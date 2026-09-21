import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActorType, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { Actor } from '../../common/types/actor';
import {
  CreateEmployeeDto,
  ListEmployeesDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(companyId: string, query: ListEmployeesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.pendingActivation ? { passwordHash: null } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { registration: { contains: query.search, mode: 'insensitive' } },
              { cpf: { contains: query.search.replace(/\D/g, '') } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          registration: true,
          name: true,
          cpf: true,
          email: true,
          position: true,
          status: true,
          admittedAt: true,
          photoUrl: true,
          syncedAt: true,
          passwordHash: true,
          department: { select: { id: true, name: true } },
          workSchedule: { select: { id: true, name: true } },
          _count: { select: { devices: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      // O hash nunca sai da API: vira apenas o booleano de "já ativou o app".
      items: items.map(({ passwordHash, ...employee }) => ({
        ...employee,
        appActivated: passwordHash !== null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        workSchedule: { include: { days: { orderBy: { weekday: 'asc' } } } },
        devices: {
          orderBy: { lastSeenAt: 'desc' },
          select: {
            id: true,
            platform: true,
            model: true,
            osVersion: true,
            appVersion: true,
            authorized: true,
            lastSeenAt: true,
            revokedAt: true,
          },
        },
      },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');

    const { passwordHash, sourcePayload, ...rest } = employee;
    return { ...rest, appActivated: passwordHash !== null };
  }

  async create(actor: Actor, dto: CreateEmployeeDto) {
    await this.assertRegistrationFree(actor.companyId, dto.registration);

    const employee = await this.prisma.employee.create({
      data: {
        companyId: actor.companyId,
        registration: dto.registration,
        name: dto.name,
        cpf: dto.cpf ?? null,
        pis: dto.pis ?? null,
        email: dto.email?.toLowerCase() ?? null,
        phone: dto.phone ?? null,
        position: dto.position ?? null,
        departmentId: dto.departmentId ?? null,
        workScheduleId: dto.workScheduleId ?? null,
        admittedAt: dto.admittedAt ? new Date(dto.admittedAt) : null,
        timezone: dto.timezone ?? null,
        externalId: dto.externalId ?? null,
      },
    });

    await this.audit.record({
      companyId: actor.companyId,
      actor,
      action: 'employee.create',
      entity: 'Employee',
      entityId: employee.id,
      after: { registration: employee.registration, name: employee.name },
    });

    return this.findOne(actor.companyId, employee.id);
  }

  async update(actor: Actor, id: string, dto: UpdateEmployeeDto) {
    const before = await this.prisma.employee.findFirst({
      where: { id, companyId: actor.companyId },
    });
    if (!before) throw new NotFoundException('Funcionário não encontrado');

    if (dto.registration && dto.registration !== before.registration) {
      await this.assertRegistrationFree(actor.companyId, dto.registration);
    }

    await this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.registration !== undefined ? { registration: dto.registration } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.cpf !== undefined ? { cpf: dto.cpf } : {}),
        ...(dto.pis !== undefined ? { pis: dto.pis } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.toLowerCase() ?? null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        ...(dto.workScheduleId !== undefined ? { workScheduleId: dto.workScheduleId } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.admittedAt !== undefined
          ? { admittedAt: dto.admittedAt ? new Date(dto.admittedAt) : null }
          : {}),
        ...(dto.terminatedAt !== undefined
          ? { terminatedAt: dto.terminatedAt ? new Date(dto.terminatedAt) : null }
          : {}),
      },
    });

    await this.audit.record({
      companyId: actor.companyId,
      actor,
      action: 'employee.update',
      entity: 'Employee',
      entityId: id,
      before: { name: before.name, status: before.status, registration: before.registration },
      after: dto as unknown as Prisma.InputJsonValue,
    });

    return this.findOne(actor.companyId, id);
  }

  /// Gera uma senha inicial para o app e devolve em texto claro UMA ÚNICA VEZ.
  ///
  /// Atende três casos: liberar o primeiro acesso, "esqueci a senha" e "troquei
  /// de celular". Revogar os aparelhos junto é essencial — senão o telefone
  /// antigo, possivelmente perdido, continuaria autorizado a bater ponto.
  ///
  /// A senha em claro só existe nesta resposta; no banco fica apenas o hash.
  /// Quem chamou precisa repassá-la ao funcionário na hora.
  async resetAppAccess(actor: Actor, id: string): Promise<ResetAppAccessResult> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId: actor.companyId },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');

    const initialPassword = generateInitialPassword();

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: {
          passwordHash: await hash(initialPassword, BCRYPT_ROUNDS),
          mustChangePassword: true,
        },
      });
      await tx.device.updateMany({
        where: { employeeId: id },
        data: { authorized: false, revokedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { subjectType: ActorType.EMPLOYEE, subjectId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.audit.record({
      companyId: actor.companyId,
      actor,
      action: 'employee.reset_app_access',
      entity: 'Employee',
      entityId: id,
      // A senha NUNCA entra na auditoria — só o fato de ter sido gerada.
      after: { devicesRevoked: true },
    });

    return {
      success: true,
      registration: employee.registration,
      initialPassword,
      message:
        'Senha inicial gerada. Anote agora: ela não será exibida de novo. ' +
        'O funcionário troca no primeiro login.',
    };
  }

  private async assertRegistrationFree(companyId: string, registration: string): Promise<void> {
    const existing = await this.prisma.employee.findFirst({
      where: { companyId, registration },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Já existe funcionário com esta matrícula');
  }
}

const BCRYPT_ROUNDS = 12;

export interface ResetAppAccessResult {
  success: true;
  registration: string;
  initialPassword: string;
  message: string;
}

/// Senha inicial de 8 caracteres, legível ao telefone.
///
/// O alfabeto exclui de propósito 0/O, 1/I/l e 5/S: a senha é ditada por
/// telefone ou copiada de um papel, e esses pares geram chamado no RH.
const SAFE_ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ23467989';

function generateInitialPassword(length = 8): string {
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += SAFE_ALPHABET[randomInt(SAFE_ALPHABET.length)];
  }
  return password;
}
