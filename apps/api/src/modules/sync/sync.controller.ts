import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Actor } from '../../common/types/actor';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeSyncService } from './employee-sync.service';

class SyncCsvDto {
  @IsString()
  @MinLength(10)
  content: string;
}

@ApiTags('Sincronizacao')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly sync: EmployeeSyncService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('employees')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Dispara a sincronizacao com o Alterdata (proxy Analista-DP)' })
  fromErp(@CurrentActor() actor: Actor) {
    return this.sync.syncFromErp(actor.companyId, actor.id);
  }

  @Post('employees/csv')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Carga de funcionarios por CSV',
    description:
      'Cabecalho aceito: matricula/registration, nome/name, cpf, pis, email, cargo/position, departamento/department, admissao/admitted_at, demissao/terminated_at, situacao/status.',
  })
  fromCsv(@CurrentActor() actor: Actor, @Body() dto: SyncCsvDto) {
    return this.sync.syncFromCsv(actor.companyId, dto.content, actor.id);
  }

  @Get('runs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Historico das ultimas sincronizacoes' })
  runs(@CurrentActor() actor: Actor) {
    return this.prisma.employeeSyncRun.findMany({
      where: { companyId: actor.companyId },
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
  }
}
