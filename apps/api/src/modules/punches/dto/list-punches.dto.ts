import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ListPunchesDto {
  @ApiPropertyOptional({ description: 'Filtra por funcionario.' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD), inclusiva.' })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'from deve estar no formato YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD), inclusiva.' })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'to deve estar no formato YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ description: 'Busca por nome ou matricula.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
