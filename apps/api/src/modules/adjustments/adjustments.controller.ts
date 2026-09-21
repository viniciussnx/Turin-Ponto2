import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorType, UserRole } from '@prisma/client';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Actor } from '../../common/types/actor';
import { AdjustmentsService } from './adjustments.service';
import {
  CreateAdjustmentDto,
  ListAdjustmentsDto,
  ReviewAdjustmentDto,
} from './dto/adjustment.dto';

@ApiTags('Ajustes de ponto')
@Controller('adjustments')
export class AdjustmentsController {
  constructor(private readonly adjustments: AdjustmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Abre um pedido de ajuste',
    description: 'Aceita tanto o funcionario (app) quanto o RH (painel, informando employeeId).',
  })
  create(@CurrentActor() actor: Actor, @Body() dto: CreateAdjustmentDto) {
    return this.adjustments.create(actor, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Pedidos do proprio funcionario' })
  listMine(@CurrentActor() actor: Actor) {
    if (actor.type !== ActorType.EMPLOYEE) {
      throw new ForbiddenException('Rota exclusiva do aplicativo do funcionario');
    }
    return this.adjustments.listMine(actor.id);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Fila de ajustes da empresa' })
  list(@CurrentActor() actor: Actor, @Query() query: ListAdjustmentsDto) {
    return this.adjustments.list(actor.companyId, query);
  }

  @Patch(':id/review')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Aprova ou rejeita um ajuste',
    description:
      'Aprovar gera uma marcacao nova (ADD/CHANGE_TIME). A marcacao original nunca e alterada.',
  })
  review(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewAdjustmentDto,
  ) {
    return this.adjustments.review(actor, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela um pedido ainda pendente' })
  cancel(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.adjustments.cancel(actor, id);
  }
}
