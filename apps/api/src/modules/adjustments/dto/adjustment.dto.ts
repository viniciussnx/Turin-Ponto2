import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdjustmentStatus, AdjustmentType, PunchKind } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateAdjustmentDto {
  @ApiProperty({ enum: AdjustmentType })
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @ApiProperty({ description: 'Dia de competencia (YYYY-MM-DD).' })
  @Matches(ISO_DATE, { message: 'localDate deve estar no formato YYYY-MM-DD' })
  localDate: string;

  @ApiPropertyOptional({ description: 'Marcacao alvo (REMOVE / CHANGE_TIME).' })
  @IsOptional()
  @IsUUID()
  targetPunchId?: string;

  @ApiPropertyOptional({ description: 'Horario pretendido (ADD / CHANGE_TIME), ISO 8601.' })
  @IsOptional()
  @IsISO8601()
  proposedAt?: string;

  @ApiPropertyOptional({ enum: PunchKind })
  @IsOptional()
  @IsEnum(PunchKind)
  proposedKind?: PunchKind;

  @ApiProperty({ description: 'Justificativa do funcionario ou do RH.' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Chave do anexo no storage (atestado, etc).' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentKey?: string;

  @ApiPropertyOptional({
    description: 'Funcionario alvo. Obrigatorio quando o pedido parte do painel.',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class ReviewAdjustmentDto {
  @ApiProperty({ enum: [AdjustmentStatus.APPROVED, AdjustmentStatus.REJECTED] })
  @IsEnum(AdjustmentStatus)
  status: AdjustmentStatus;

  @ApiPropertyOptional({ description: 'Observacao do aprovador.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

export class ListAdjustmentsDto {
  @ApiPropertyOptional({ enum: AdjustmentStatus })
  @IsOptional()
  @IsEnum(AdjustmentStatus)
  status?: AdjustmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD).' })
  @IsOptional()
  @Matches(ISO_DATE)
  from?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD).' })
  @IsOptional()
  @Matches(ISO_DATE)
  to?: string;
}
