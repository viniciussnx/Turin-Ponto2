import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorType, UserRole } from '@prisma/client';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Actor } from '../../common/types/actor';
import { TimesheetService } from './timesheet.service';

@ApiTags('Espelho de ponto')
@Controller('timesheet')
export class TimesheetController {
  constructor(private readonly timesheet: TimesheetService) {}

  @Get('me')
  @ApiOperation({ summary: 'Espelho do proprio funcionario (app)' })
  async mine(
    @CurrentActor() actor: Actor,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (actor.type !== ActorType.EMPLOYEE) {
      throw new ForbiddenException('Rota exclusiva do aplicativo do funcionario');
    }
    const range = resolveRange(from, to);
    return this.timesheet.build(actor.companyId, actor.id, range.from, range.to);
  }

  @Get('inconsistencies')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Dias com pendencia no periodo (fila do RH)' })
  async pending(
    @CurrentActor() actor: Actor,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const range = resolveRange(from, to);
    return this.timesheet.inconsistencies(actor.companyId, range.from, range.to);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Espelho de um funcionario (painel)' })
  async ofEmployee(
    @CurrentActor() actor: Actor,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const range = resolveRange(from, to);
    return this.timesheet.build(actor.companyId, employeeId, range.from, range.to);
  }
}

/// Sem intervalo informado, assume o mes corrente - que e o que a tela do app
/// abre por padrao.
function resolveRange(from?: string, to?: string): { from: string; to: string } {
  if (from && to) return { from, to };
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}
