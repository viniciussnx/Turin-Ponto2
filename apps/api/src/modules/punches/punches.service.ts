import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Company, Employee, Punch, PunchKind, PunchSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { Actor } from '../../common/types/actor';
import { distanceInMeters } from '../../common/utils/geo';
import { formatLocalDateTime, toLocalDate } from '../../common/utils/date';
import { PunchChainService } from './punch-chain.service';
import { CreatePunchDto } from './dto/create-punch.dto';
import { ListPunchesDto } from './dto/list-punches.dto';

/// Tolerância para relógio adiantado no aparelho. Acima disso a marcação é
/// recusada — aceitar horário futuro abriria caminho para fraude trivial.
const MAX_CLOCK_SKEW_MINUTES = 5;

/// Marcação com menos de 60s da anterior é quase sempre toque duplo na tela.
const MIN_SECONDS_BETWEEN_PUNCHES = 60;

export interface PunchReceipt {
  nsr: string;
  employeeName: string;
  registration: string;
  companyName: string;
  cnpj: string | null;
  punchedAt: string;
  hash: string;
  outsideGeofence: boolean;
  duplicated: boolean;
}

@Injectable()
export class PunchesService {
  private readonly logger = new Logger(PunchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: PunchChainService,
    private readonly audit: AuditService,
  ) {}

  /// Registra a marcação de um funcionário vinda do app.
  async create(
    actor: Actor,
    dto: CreatePunchDto,
    meta: { ip?: string; userAgent?: string } = {},
  ): Promise<{ punch: Punch; receipt: PunchReceipt }> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: actor.id, companyId: actor.companyId },
      include: { company: true },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');
    if (employee.status === 'TERMINATED') {
      throw new ForbiddenException('Funcionário desligado não pode registrar ponto');
    }

    const company = employee.company;
    const punchedAt = new Date(dto.punchedAt);
    if (Number.isNaN(punchedAt.getTime())) {
      throw new BadRequestException('punchedAt inválido');
    }

    const skewMinutes = (punchedAt.getTime() - Date.now()) / 60_000;
    if (skewMinutes > MAX_CLOCK_SKEW_MINUTES) {
      throw new BadRequestException(
        'Horário do aparelho está adiantado. Ajuste a data/hora automática e tente novamente.',
      );
    }

    // Idempotência: a fila offline reenvia a mesma marcação após falha de rede.
    // Devolvemos o registro original em vez de criar um duplicado.
    const existing = await this.prisma.punch.findUnique({
      where: { employeeId_clientId: { employeeId: employee.id, clientId: dto.clientId } },
    });
    if (existing) {
      return { punch: existing, receipt: this.buildReceipt(existing, employee, company, true) };
    }

    this.assertRequiredEvidence(company, dto);
    await this.assertNotTooSoon(employee.id, punchedAt);

    const outsideGeofence = await this.evaluateGeofence(employee, dto);
    if (outsideGeofence && company.blockOutsideGeofence) {
      throw new ForbiddenException(
        'Você está fora das áreas autorizadas para registro de ponto.',
      );
    }

    const timezone = employee.timezone ?? company.timezone;
    const localDate = toLocalDate(punchedAt, timezone);

    const punch = await this.prisma.$transaction(async (tx) => {
      const created = await this.chain.append(tx, {
        companyId: employee.companyId,
        employeeId: employee.id,
        punchedAt,
        localDate,
        kind: dto.kind ?? PunchKind.UNSPECIFIED,
        source: PunchSource.MOBILE_APP,
        deviceId: actor.deviceId ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        accuracyMeters: dto.accuracyMeters ?? null,
        address: dto.address ?? null,
        selfieKey: dto.selfieKey ?? null,
        offline: dto.offline ?? false,
        clientId: dto.clientId,
        outsideGeofence,
      });

      // O espelho do dia vira cache obsoleto assim que entra uma marcação nova.
      await tx.dayTimesheet.deleteMany({
        where: { employeeId: employee.id, date: localDate },
      });

      await this.audit.record(
        {
          companyId: employee.companyId,
          actor,
          action: 'punch.create',
          entity: 'Punch',
          entityId: created.id,
          after: {
            nsr: created.nsr.toString(),
            punchedAt: created.punchedAt.toISOString(),
            kind: created.kind,
            offline: created.offline,
            outsideGeofence: created.outsideGeofence,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return created;
    });

    return { punch, receipt: this.buildReceipt(punch, employee, company, false) };
  }

  /// Listagem administrativa, paginada.
  async listForCompany(companyId: string, query: ListPunchesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where = {
      companyId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.from || query.to
        ? {
            localDate: {
              ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
              ...(query.to ? { lte: new Date(`${query.to}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            employee: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { registration: { contains: query.search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.punch.findMany({
        where,
        orderBy: [{ localDate: 'desc' }, { punchedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          employee: { select: { id: true, name: true, registration: true } },
          device: { select: { id: true, platform: true, model: true } },
        },
      }),
      this.prisma.punch.count({ where }),
    ]);

    return {
      items: items.map((item) => ({ ...item, nsr: item.nsr.toString() })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /// Marcações do próprio funcionário num intervalo (tela de espelho no app).
  async listForEmployee(employeeId: string, from: string, to: string) {
    const punches = await this.prisma.punch.findMany({
      where: {
        employeeId,
        localDate: {
          gte: new Date(`${from}T00:00:00.000Z`),
          lte: new Date(`${to}T00:00:00.000Z`),
        },
      },
      orderBy: { punchedAt: 'asc' },
    });
    return punches.map((punch) => ({ ...punch, nsr: punch.nsr.toString() }));
  }

  /// Recusa a marcação quando a empresa exige selfie/localização e o app não
  /// enviou. A checagem é do servidor porque o cliente é adulterável.
  private assertRequiredEvidence(company: Company, dto: CreatePunchDto): void {
    if (company.requireSelfie && !dto.selfieKey) {
      throw new BadRequestException('Esta empresa exige selfie no registro de ponto');
    }
    if (company.requireLocation && (dto.latitude == null || dto.longitude == null)) {
      throw new BadRequestException('Esta empresa exige localização no registro de ponto');
    }
  }

  private async assertNotTooSoon(employeeId: string, punchedAt: Date): Promise<void> {
    const previous = await this.prisma.punch.findFirst({
      where: { employeeId },
      orderBy: { punchedAt: 'desc' },
      select: { punchedAt: true },
    });
    if (!previous) return;

    const seconds = Math.abs(punchedAt.getTime() - previous.punchedAt.getTime()) / 1000;
    if (seconds < MIN_SECONDS_BETWEEN_PUNCHES) {
      throw new BadRequestException(
        'Já existe uma marcação registrada há menos de um minuto.',
      );
    }
  }

  /// `true` quando o funcionário está fora de todas as cercas aplicáveis.
  /// Sem cerca cadastrada ou sem coordenada, nunca sinaliza.
  private async evaluateGeofence(employee: Employee, dto: CreatePunchDto): Promise<boolean> {
    if (dto.latitude == null || dto.longitude == null) return false;

    const fences = await this.prisma.geofence.findMany({
      where: {
        companyId: employee.companyId,
        active: true,
        OR: [{ employees: { none: {} } }, { employees: { some: { id: employee.id } } }],
      },
    });
    if (fences.length === 0) return false;

    return !fences.some((fence) => {
      const distance = distanceInMeters(
        dto.latitude as number,
        dto.longitude as number,
        Number(fence.latitude),
        Number(fence.longitude),
      );
      // A imprecisão do GPS entra a favor do funcionário: quem está na borda
      // com sinal ruim não deve ser marcado como fora.
      return distance - (dto.accuracyMeters ?? 0) <= fence.radiusMeters;
    });
  }

  /// Comprovante entregue ao trabalhador a cada marcação.
  private buildReceipt(
    punch: Punch,
    employee: Employee,
    company: Company,
    duplicated: boolean,
  ): PunchReceipt {
    const timezone = employee.timezone ?? company.timezone;
    return {
      nsr: punch.nsr.toString(),
      employeeName: employee.name,
      registration: employee.registration,
      companyName: company.name,
      cnpj: company.cnpj,
      punchedAt: formatLocalDateTime(punch.punchedAt, timezone),
      hash: punch.hash.slice(0, 16).toUpperCase(),
      outsideGeofence: punch.outsideGeofence,
      duplicated,
    };
  }
}
