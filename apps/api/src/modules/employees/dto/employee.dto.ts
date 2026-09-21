import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Matricula, unica na empresa.' })
  @IsString()
  @MaxLength(40)
  registration: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Somente digitos.' })
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 digitos' })
  cpf?: string;

  @ApiPropertyOptional({ description: 'PIS/PASEP, somente digitos.' })
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'PIS deve conter 11 digitos' })
  pis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workScheduleId?: string;

  @ApiPropertyOptional({ description: 'Data de admissao (ISO 8601).' })
  @IsOptional()
  @IsISO8601()
  admittedAt?: string;

  @ApiPropertyOptional({ description: 'Fuso proprio, sobrepondo o da empresa.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Chave no sistema de origem (SQL Server).' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalId?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: 'Data de desligamento (ISO 8601).' })
  @IsOptional()
  @IsISO8601()
  terminatedAt?: string;
}

export class ListEmployeesDto {
  @ApiPropertyOptional({ description: 'Busca por nome, matricula ou CPF.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Apenas quem ainda nao ativou o app.' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingActivation?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  pageSize?: number = 25;
}
