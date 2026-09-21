import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Actor } from '../../common/types/actor';
import {
  CreateEmployeeDto,
  ListEmployeesDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Funcionarios')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Lista funcionarios da empresa' })
  list(@CurrentActor() actor: Actor, @Query() query: ListEmployeesDto) {
    return this.employees.list(actor.companyId, query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Detalha um funcionario' })
  findOne(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.employees.findOne(actor.companyId, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Cadastra funcionario manualmente',
    description:
      'Use quando o funcionario ainda nao existe na origem. O sync do SQL Server cuida do fluxo normal.',
  })
  create(@CurrentActor() actor: Actor, @Body() dto: CreateEmployeeDto) {
    return this.employees.create(actor, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza um funcionario' })
  update(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employees.update(actor, id, dto);
  }

  @Post(':id/reset-app-access')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gera senha inicial do app',
    description: 'Devolve a senha em texto claro UMA vez, revoga os aparelhos e derruba as sessoes.',
  })
  resetAccess(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.employees.resetAppAccess(actor, id);
  }
}
