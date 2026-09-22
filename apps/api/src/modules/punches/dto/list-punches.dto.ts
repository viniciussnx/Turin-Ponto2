import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/*
 * Colunas por que a listagem pode ser ordenada.
 *
 * É uma lista fechada de propósito: o valor vira caminho de `orderBy` do
 * Prisma, e aceitar string livre deixaria o cliente pedir ordenação por
 * qualquer campo do modelo — inclusive os que não têm índice, o que num
 * `Punch` com milhões de linhas derruba a consulta.
 */
export enum PunchSort {
  PunchedAt = 'punchedAt',
  Nsr = 'nsr',
  Employee = 'employee',
  Kind = 'kind',
}

export enum SortDir {
  Asc = 'asc',
  Desc = 'desc',
}

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

  @ApiPropertyOptional({ enum: PunchSort, default: PunchSort.PunchedAt })
  @IsOptional()
  @IsEnum(PunchSort)
  sort?: PunchSort;

  @ApiPropertyOptional({ enum: SortDir, default: SortDir.Desc })
  @IsOptional()
  @IsEnum(SortDir)
  dir?: SortDir;
}
