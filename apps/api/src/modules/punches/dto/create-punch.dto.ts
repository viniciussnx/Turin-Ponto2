import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PunchKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePunchDto {
  @ApiProperty({
    description:
      'UUID gerado no dispositivo. Garante idempotencia: reenvio da fila offline nao duplica a marcacao.',
  })
  @IsString()
  @MaxLength(64)
  clientId: string;

  @ApiProperty({ description: 'Momento da marcacao em ISO 8601 com fuso.' })
  @IsISO8601()
  punchedAt: string;

  @ApiPropertyOptional({ enum: PunchKind, default: PunchKind.UNSPECIFIED })
  @IsOptional()
  @IsEnum(PunchKind)
  kind?: PunchKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Precisao do GPS em metros.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  accuracyMeters?: number;

  @ApiPropertyOptional({ description: 'Endereco resolvido no dispositivo.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Chave da selfie ja enviada ao storage.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  selfieKey?: string;

  @ApiPropertyOptional({
    description: 'Registrada sem conexao e sincronizada depois.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  offline?: boolean;
}
