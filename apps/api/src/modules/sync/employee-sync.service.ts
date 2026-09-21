import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActorType, EmployeeStatus, Prisma, SyncRunStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AppConfig } from '../../config/configuration';
import {
  CsvEmployeeSource,
  EmployeeSource,
  EmployeeSourceRecord,
  ProxyEmployeeSource,
} from './employee-source';

export interface SyncSummary {
  runId: string;
  source: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/// Termos que o ERP costuma usar para quem não está mais ativo. A comparação é
/// case-insensitive e por prefixo, para tolerar "DEMITIDO EM 01/2026".
const INACTIVE_MARKERS = ['demit', 'inativ', 'desligad', 'rescis', 'terminated', 'inactive'];
const ON_LEAVE_MARKERS = ['afast', 'licen', 'ferias', 'férias', 'on_leave'];

@Injectable()
export class EmployeeSyncService {
  private readonly logger = new Logger(EmployeeSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /// Sincroniza a partir do proxy do Alterdata.
  async syncFromErp(companyId: string, actorId?: string): Promise<SyncSummary> {
    const proxy = this.config.get<AppConfig['sync']['proxy']>('sync.proxy');
    if (!proxy?.apiKey) {
      throw new Error('Integração com o Alterdata não configurada (PROXY_API_KEY vazia)');
    }
    return this.run(companyId, new ProxyEmployeeSource(proxy), actorId);
  }

  /// Sincroniza a partir de um CSV colado no painel.
  async syncFromCsv(companyId: string, content: string, actorId?: string): Promise<SyncSummary> {
    return this.run(companyId, new CsvEmployeeSource(content), actorId);
  }

  private async run(
    companyId: string,
    source: EmployeeSource,
    actorId?: string,
  ): Promise<SyncSummary> {
    const run = await this.prisma.employeeSyncRun.create({
      data: { companyId, source: source.name, status: SyncRunStatus.RUNNING },
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const records = await source.fetch();

      for (const record of records) {
        try {
          const outcome = await this.upsert(companyId, record);
          if (outcome === 'created') created += 1;
          else if (outcome === 'updated') updated += 1;
          else skipped += 1;
        } catch (error) {
          failed += 1;
          const message = `${record.registration}: ${(error as Error).message}`;
          errors.push(message);
          this.logger.warn(`Falha ao sincronizar ${message}`);
        }
      }

      await this.prisma.employeeSyncRun.update({
        where: { id: run.id },
        data: {
          status: failed > 0 && created + updated === 0 ? SyncRunStatus.FAILED : SyncRunStatus.SUCCESS,
          created,
          updated,
          skipped,
          failed,
          details: errors.slice(0, 100) as unknown as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      });

      await this.audit.record({
        companyId,
        actor: { type: actorId ? ActorType.USER : ActorType.SYSTEM, id: actorId },
        action: 'employee.sync',
        entity: 'EmployeeSyncRun',
        entityId: run.id,
        after: { source: source.name, created, updated, skipped, failed },
      });

      this.logger.log(
        `Sync ${source.name}: ${created} criados, ${updated} atualizados, ${failed} falhas`,
      );
    } catch (error) {
      await this.prisma.employeeSyncRun.update({
        where: { id: run.id },
        data: {
          status: SyncRunStatus.FAILED,
          errorMessage: (error as Error).message,
          finishedAt: new Date(),
        },
      });
      throw error;
    }

    return { runId: run.id, source: source.name, created, updated, skipped, failed, errors };
  }

  /// Insere ou atualiza um funcionário, correlacionando por `externalId`.
  ///
  /// Campos que pertencem a este sistema — PIN, aparelhos, jornada, fuso —
  /// jamais são tocados pela sincronização. A origem manda no cadastro; o
  /// ponto manda no resto.
  private async upsert(
    companyId: string,
    record: EmployeeSourceRecord,
  ): Promise<'created' | 'updated' | 'skipped'> {
    const departmentId = record.department
      ? await this.resolveDepartment(companyId, record.department)
      : null;

    const status = this.resolveStatus(record);

    const shared = {
      registration: record.registration,
      name: record.name,
      cpf: record.cpf,
      pis: record.pis,
      email: record.email,
      phone: record.phone,
      position: record.position,
      departmentId,
      admittedAt: record.admittedAt,
      terminatedAt: record.terminatedAt,
      status,
      sourcePayload: record.raw as Prisma.InputJsonValue,
      syncedAt: new Date(),
    };

    const existing = await this.prisma.employee.findFirst({
      where: { companyId, externalId: record.externalId },
      select: { id: true, name: true, status: true, registration: true },
    });

    if (!existing) {
      await this.prisma.employee.create({
        data: { companyId, externalId: record.externalId, ...shared },
      });
      return 'created';
    }

    const unchanged =
      existing.name === record.name &&
      existing.status === status &&
      existing.registration === record.registration;
    if (unchanged) {
      await this.prisma.employee.update({
        where: { id: existing.id },
        data: { syncedAt: new Date() },
      });
      return 'skipped';
    }

    await this.prisma.employee.update({ where: { id: existing.id }, data: shared });
    return 'updated';
  }

  private async resolveDepartment(companyId: string, name: string): Promise<string> {
    const department = await this.prisma.department.upsert({
      where: { companyId_name: { companyId, name } },
      create: { companyId, name },
      update: {},
      select: { id: true },
    });
    return department.id;
  }

  private resolveStatus(record: EmployeeSourceRecord): EmployeeStatus {
    // A data de desligamento é mais confiável que o texto de situação: se ela
    // existe e já passou, a pessoa está fora, diga o ERP o que disser.
    if (record.terminatedAt && record.terminatedAt <= new Date()) {
      return EmployeeStatus.TERMINATED;
    }

    const raw = (record.status ?? '').toLowerCase();
    if (INACTIVE_MARKERS.some((marker) => raw.includes(marker))) {
      return EmployeeStatus.TERMINATED;
    }
    if (ON_LEAVE_MARKERS.some((marker) => raw.includes(marker))) {
      return EmployeeStatus.ON_LEAVE;
    }
    return EmployeeStatus.ACTIVE;
  }
}
