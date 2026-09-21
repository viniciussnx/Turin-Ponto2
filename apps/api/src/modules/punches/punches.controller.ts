import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorType, UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Actor } from '../../common/types/actor';
import { CreatePunchDto } from './dto/create-punch.dto';
import { ListPunchesDto } from './dto/list-punches.dto';
import { PunchChainService } from './punch-chain.service';
import { PunchesService } from './punches.service';

@ApiTags('Marcacoes')
@Controller('punches')
export class PunchesController {
  constructor(
    private readonly punches: PunchesService,
    private readonly chain: PunchChainService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registra uma marcacao (app do funcionario)',
    description:
      'Idempotente por clientId. Reenvio da fila offline devolve a marcacao original com duplicated=true.',
  })
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreatePunchDto,
    @Req() request: Request,
  ) {
    this.assertEmployee(actor);
    const { punch, receipt } = await this.punches.create(actor, dto, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    return {
      id: punch.id,
      nsr: punch.nsr.toString(),
      punchedAt: punch.punchedAt,
      registeredAt: punch.registeredAt,
      kind: punch.kind,
      outsideGeofence: punch.outsideGeofence,
      receipt,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Marcacoes do proprio funcionario num intervalo' })
  async listMine(
    @CurrentActor() actor: Actor,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.assertEmployee(actor);
    return this.punches.listForEmployee(actor.id, from, to);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Lista marcacoes da empresa (painel)' })
  async list(@CurrentActor() actor: Actor, @Query() query: ListPunchesDto) {
    return this.punches.listForCompany(actor.companyId, query);
  }

  @Get('chain/verify')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verifica a integridade da cadeia de marcacoes',
    description:
      'Recalcula os hashes em ordem de NSR. Aponta a primeira marcacao adulterada, se houver.',
  })
  async verifyChain(@CurrentActor() actor: Actor) {
    return this.chain.verify(actor.companyId);
  }

  private assertEmployee(actor: Actor): void {
    if (actor.type !== ActorType.EMPLOYEE) {
      throw new ForbiddenException('Rota exclusiva do aplicativo do funcionario');
    }
  }
}
