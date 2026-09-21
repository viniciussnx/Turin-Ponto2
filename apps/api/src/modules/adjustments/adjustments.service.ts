import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorType,
  AdjustmentStatus,
  AdjustmentType,
  Prisma,
  PunchKind,
  PunchSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { Actor } from '../../common/types/actor';
import { toLocalDate } from '../../common/utils/date';
import { PunchChainService } from '../punches/punch-chain.service';
import {
  CreateAdjustmentDto,
  ListAdjustmentsDto,
  ReviewAdjustmentDto,
} from './dto/adjustment.dto';

@Injectable()
export class AdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: PunchChainService,
    private readonly audit: AuditService,
  ) {}

  /// Abre um pedido de ajuste. Pode partir do app (o próprio funcionário) ou
  /// do painel (RH agindo em nome de alguém).
  async create(actor: Actor, dto: CreateAdjustmentDto) {
    const employeeId =
      actor.type === ActorType.EMPLOYEE ? actor.id : (dto.employeeId ?? '');
    if (!employeeId) {
      throw new BadRequestException('employeeId é obrigatório para pedidos do painel');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: actor.companyId },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');

    this.assertConsistent(dto);

    if (dto.targetPunchId) {
      const target = await this.prisma.punch.findFirst({
        where: { id: dto.targetPunchId, employeeId },
        select: { id: true },
      });
      if (!target) {
        throw new BadRequestException('Marcação alvo não pertence a este funcionário');
      }
    }

    const adjustment = await this.prisma.punchAdjustment.create({
      data: {
        companyId: actor.companyId,
        employeeId,
        type: dto.type,
        localDate: new Date(`${dto.localDate}T00:00:00.000Z`),
        targetPunchId: dto.targetPunchId ?? null,
        proposedAt: dto.proposedAt ? new Date(dto.proposedAt) : null,
        proposedKind: dto.proposedKind ?? null,
        reason: dto.reason,
        attachmentKey: dto.attachmentKey ?? null,
        requestedByEmployeeId: actor.type === ActorType.EMPLOYEE ? actor.id : null,
        requestedByUserId: actor.type === ActorType.USER ? actor.id : null,
      },
    });

    await this.audit.record({
      companyId: actor.companyId,
      actor,
      action: 'adjustment.create',
      entity: 'PunchAdjustment',
      entityId: adjustment.id,
      after: { type: dto.type, localDate: dto.localDate, reason: dto.reason },
    });

    return adjustment;
  }

  async list(companyId: string, query: ListAdjustmentsDto) {
    const where: Prisma.PunchAdjustmentWhereInput = {
      companyId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.from || query.to
        ? {
            localDate: {
              ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
              ...(query.to ? { lte: new Date(`${query.to}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.punchAdjustment.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        employee: { select: { id: true, name: true, registration: true } },
        targetPunch: { select: { id: true, punchedAt: true, kind: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }

  async listMine(employeeId: string) {
    return this.prisma.punchAdjustment.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { targetPunch: { select: { id: true, punchedAt: true, kind: true } } },
    });
  }

  /// Aprova ou rejeita um pedido.
  ///
  /// Aprovar NUNCA altera a marcação original — ela é imutável. O efeito é:
  /// ADD/CHANGE_TIME geram uma marcação nova no fim da cadeia, e o vínculo
  /// `targetPunchId` faz a apuração desconsiderar a antiga. Assim o histórico
  /// completo continua auditável.
  async review(actor: Actor, id: string, dto: ReviewAdjustmentDto) {
    if (
      dto.status !== AdjustmentStatus.APPROVED &&
      dto.status !== AdjustmentStatus.REJECTED
    ) {
      throw new BadRequestException('Status deve ser APPROVED ou REJECTED');
    }

    const adjustment = await this.prisma.punchAdjustment.findFirst({
      where: { id, companyId: actor.companyId },
      include: { employee: { include: { company: true } } },
    });
    if (!adjustment) throw new NotFoundException('Ajuste não encontrado');
    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Este ajuste já foi analisado');
    }
    if (adjustment.requestedByUserId === actor.id) {
      throw new ForbiddenException('Quem solicitou o ajuste não pode aprová-lo');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let resultingPunchId: string | null = null;

      const createsPunch =
        dto.status === AdjustmentStatus.APPROVED &&
        (adjustment.type === AdjustmentType.ADD ||
          adjustment.type === AdjustmentType.CHANGE_TIME);

      if (createsPunch) {
        if (!adjustment.proposedAt) {
          throw new BadRequestException('Ajuste sem horário proposto não pode ser aprovado');
        }
        const timezone =
          adjustment.employee.timezone ?? adjustment.employee.company.timezone;

        const punch = await this.chain.append(tx, {
          companyId: adjustment.companyId,
          employeeId: adjustment.employeeId,
          punchedAt: adjustment.proposedAt,
          localDate: toLocalDate(adjustment.proposedAt, timezone),
          kind: adjustment.proposedKind ?? PunchKind.UNSPECIFIED,
          source: PunchSource.ADJUSTMENT,
          clientId: `adj:${adjustment.id}`,
        });
        resultingPunchId = punch.id;
      }

      const updated = await tx.punchAdjustment.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedByUserId: actor.id,
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote ?? null,
          resultingPunchId,
        },
      });

      // Espelho do dia precisa ser recalculado com o ajuste aplicado.
      await tx.dayTimesheet.deleteMany({
        where: { employeeId: adjustment.employeeId, date: adjustment.localDate },
      });

      await this.audit.record(
        {
          companyId: actor.companyId,
          actor,
          action: `adjustment.${dto.status.toLowerCase()}`,
          entity: 'PunchAdjustment',
          entityId: id,
          before: { status: adjustment.status },
          after: { status: dto.status, resultingPunchId, note: dto.reviewNote ?? null },
        },
        tx,
      );

      return updated;
    });

    return result;
  }

  /// O funcionário pode desistir enquanto ninguém analisou.
  async cancel(actor: Actor, id: string) {
    const adjustment = await this.prisma.punchAdjustment.findFirst({
      where: { id, companyId: actor.companyId },
    });
    if (!adjustment) throw new NotFoundException('Ajuste não encontrado');
    if (actor.type === ActorType.EMPLOYEE && adjustment.employeeId !== actor.id) {
      throw new ForbiddenException('Ajuste de outro funcionário');
    }
    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Apenas ajustes pendentes podem ser cancelados');
    }

    return this.prisma.punchAdjustment.update({
      where: { id },
      data: { status: AdjustmentStatus.CANCELLED },
    });
  }

  private assertConsistent(dto: CreateAdjustmentDto): void {
    const needsProposal =
      dto.type === AdjustmentType.ADD || dto.type === AdjustmentType.CHANGE_TIME;
    if (needsProposal && !dto.proposedAt) {
      throw new BadRequestException(`Ajuste do tipo ${dto.type} exige proposedAt`);
    }

    const needsTarget =
      dto.type === AdjustmentType.REMOVE || dto.type === AdjustmentType.CHANGE_TIME;
    if (needsTarget && !dto.targetPunchId) {
      throw new BadRequestException(`Ajuste do tipo ${dto.type} exige targetPunchId`);
    }
  }
}
