import { Injectable } from '@nestjs/common';
import { Prisma, Punch, PunchKind, PunchSource } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

/// Hash da primeira marcação de uma empresa. Ancora a cadeia.
export const GENESIS_HASH = '0'.repeat(64);

export interface AppendPunchInput {
  companyId: string;
  employeeId: string;
  punchedAt: Date;
  localDate: Date;
  kind: PunchKind;
  source: PunchSource;
  deviceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  address?: string | null;
  selfieKey?: string | null;
  offline?: boolean;
  clientId?: string | null;
  outsideGeofence?: boolean;
}

@Injectable()
export class PunchChainService {
  constructor(private readonly prisma: PrismaService) {}

  /// Grava uma marcação no fim da cadeia da empresa.
  ///
  /// Precisa rodar dentro de uma transação: o NSR é sequencial e ininterrupto
  /// por empresa, então duas marcações simultâneas não podem ler o mesmo
  /// "último NSR". O advisory lock serializa apenas as marcações da MESMA
  /// empresa — empresas diferentes seguem em paralelo.
  async append(tx: Prisma.TransactionClient, input: AppendPunchInput): Promise<Punch> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.companyId}::text, 0))`;

    const last = await tx.punch.findFirst({
      where: { companyId: input.companyId },
      orderBy: { nsr: 'desc' },
      select: { nsr: true, hash: true },
    });

    const nsr = (last?.nsr ?? 0n) + 1n;
    const previousHash = last?.hash ?? GENESIS_HASH;
    const hash = this.computeHash(previousHash, { ...input, nsr });

    return tx.punch.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId,
        nsr,
        punchedAt: input.punchedAt,
        localDate: input.localDate,
        kind: input.kind,
        source: input.source,
        deviceId: input.deviceId ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        accuracyMeters: input.accuracyMeters ?? null,
        address: input.address ?? null,
        selfieKey: input.selfieKey ?? null,
        offline: input.offline ?? false,
        clientId: input.clientId ?? null,
        outsideGeofence: input.outsideGeofence ?? false,
        hash,
        previousHash,
      },
    });
  }

  /// Fórmula do encadeamento. Qualquer mudança aqui invalida todas as cadeias
  /// já gravadas — se precisar evoluir, versione em vez de alterar.
  computeHash(
    previousHash: string,
    fields: {
      nsr: bigint;
      companyId: string;
      employeeId: string;
      punchedAt: Date;
      kind: PunchKind;
      source: PunchSource;
      latitude?: number | null;
      longitude?: number | null;
    },
  ): string {
    const payload = [
      previousHash,
      fields.nsr.toString(),
      fields.companyId,
      fields.employeeId,
      fields.punchedAt.toISOString(),
      fields.kind,
      fields.source,
      fields.latitude?.toFixed(7) ?? '',
      fields.longitude?.toFixed(7) ?? '',
    ].join('|');

    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /// Percorre a cadeia da empresa e aponta a primeira quebra.
  ///
  /// Use em auditoria periódica: se alguém alterou uma linha direto no banco,
  /// o hash recalculado não bate e todas as marcações seguintes ficam órfãs.
  async verify(companyId: string, batchSize = 1000): Promise<ChainVerification> {
    let cursor = 0n;
    let expectedPrevious = GENESIS_HASH;
    let checked = 0;

    for (;;) {
      const batch = await this.prisma.punch.findMany({
        where: { companyId, nsr: { gt: cursor } },
        orderBy: { nsr: 'asc' },
        take: batchSize,
      });
      if (batch.length === 0) break;

      for (const punch of batch) {
        if (punch.previousHash !== expectedPrevious) {
          return {
            valid: false,
            checked,
            brokenAtNsr: punch.nsr.toString(),
            reason: 'previousHash não corresponde ao hash da marcação anterior',
          };
        }

        const recomputed = this.computeHash(punch.previousHash, {
          nsr: punch.nsr,
          companyId: punch.companyId,
          employeeId: punch.employeeId,
          punchedAt: punch.punchedAt,
          kind: punch.kind,
          source: punch.source,
          latitude: punch.latitude ? Number(punch.latitude) : null,
          longitude: punch.longitude ? Number(punch.longitude) : null,
        });

        if (recomputed !== punch.hash) {
          return {
            valid: false,
            checked,
            brokenAtNsr: punch.nsr.toString(),
            reason: 'conteúdo da marcação foi alterado após a gravação',
          };
        }

        expectedPrevious = punch.hash;
        cursor = punch.nsr;
        checked += 1;
      }
    }

    return { valid: true, checked };
  }
}

export interface ChainVerification {
  valid: boolean;
  checked: number;
  brokenAtNsr?: string;
  reason?: string;
}
