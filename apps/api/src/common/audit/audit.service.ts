import { Injectable, Logger } from '@nestjs/common';
import { ActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Actor } from '../types/actor';

export interface AuditInput {
  companyId: string;
  actor: Actor | { type: ActorType; id?: string; name?: string };
  action: string;
  entity: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /// Registra a trilha de auditoria. Nunca deve derrubar a operacao de
  /// negocio: se a gravacao falhar, loga e segue.
  async record(input: AuditInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          companyId: input.companyId,
          actorType: input.actor.type,
          actorId: input.actor.id ?? null,
          actorName: input.actor.name ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          before: input.before,
          after: input.after,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gravar auditoria de ${input.action}: ${(error as Error).message}`,
      );
    }
  }
}
