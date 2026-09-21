import { Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { AppConfig } from '../../config/configuration';

/// Formato normalizado que o sincronizador consome. Cada fonte (proxy do
/// Alterdata, CSV, futura API) traduz o seu formato para este.
export interface EmployeeSourceRecord {
  externalId: string;
  registration: string;
  name: string;
  cpf?: string | null;
  pis?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  admittedAt?: Date | null;
  terminatedAt?: Date | null;
  /// Texto livre vindo da origem; o sincronizador decide o status final.
  status?: string | null;
  raw: Record<string, unknown>;
}

export interface EmployeeSource {
  readonly name: string;
  fetch(): Promise<EmployeeSourceRecord[]>;
}

/// Uma linha de `GET /empresas/{cod}/funcionarios` do proxy Analista-DP.
/// Os nomes são os do Alterdata Pack (schema `wdp`, tabela `f{cod}`).
interface ProxyEmployee {
  idfuncionario: string | number;
  matricula?: string | null;
  nome?: string | null;
  iddepartamento?: string | number | null;
  departamento?: string | null;
  cargo?: string | null;
  dtadmissao?: string | null;
  dtdemissao?: string | null;
}

/// Lê o cadastro do Alterdata Pack através do proxy Analista-DP.
///
/// O proxy é o mesmo que o sistema de férias usa — um único ponto de
/// integração com o ERP, em vez de cada aplicação abrir a sua própria conexão
/// ao Postgres do Alterdata. É somente leitura: quem manda no cadastro é o
/// ERP, este sistema manda apenas no ponto.
export class ProxyEmployeeSource implements EmployeeSource {
  readonly name = 'alterdata-proxy';
  private readonly logger = new Logger(ProxyEmployeeSource.name);

  constructor(private readonly config: AppConfig['sync']['proxy']) {}

  async fetch(): Promise<EmployeeSourceRecord[]> {
    if (!this.config.apiKey) {
      throw new Error('PROXY_API_KEY não configurada');
    }

    const rows = await this.request<ProxyEmployee[]>(
      `/empresas/${this.config.company}/funcionarios`,
    );
    this.logger.log(`${rows.length} funcionários lidos do proxy do Alterdata`);

    return rows.map((row) => this.normalize(row));
  }

  private async request<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        headers: { 'X-Proxy-Key': this.config.apiKey },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Proxy respondeu ${response.status} em ${path}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(
          `Proxy não respondeu em ${this.config.timeoutMs / 1000}s (${path})`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(row: ProxyEmployee): EmployeeSourceRecord {
    const registration = text(row.matricula);
    const externalId = text(row.idfuncionario) ?? registration;

    if (!externalId || !registration) {
      throw new Error(
        `Registro sem matrícula/identificador: ${JSON.stringify(row).slice(0, 200)}`,
      );
    }

    return {
      externalId,
      registration,
      name: presentableName(text(row.nome)) ?? registration,
      // O proxy não devolve CPF nem PIS hoje. Ficam nulos de propósito: quando
      // a API passar a entregá-los, é só mapear aqui.
      cpf: null,
      pis: null,
      email: null,
      phone: null,
      position: titleCase(text(row.cargo)),
      department: titleCase(text(row.departamento)),
      admittedAt: toDate(row.dtadmissao),
      terminatedAt: toDate(row.dtdemissao),
      // O Alterdata não tem campo de situação: quem tem data de demissão está
      // desligado, o resto está ativo.
      status: row.dtdemissao ? 'DESLIGADO' : 'ATIVO',
      raw: row as unknown as Record<string, unknown>,
    };
  }
}

/// Fonte alternativa para carga inicial e para rodar sem acesso ao proxy.
export class CsvEmployeeSource implements EmployeeSource {
  readonly name = 'csv';

  constructor(private readonly content: string) {}

  async fetch(): Promise<EmployeeSourceRecord[]> {
    const rows = parse(this.content, {
      columns: (header: string[]) => header.map((column) => column.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter: [',', ';'],
    }) as Record<string, unknown>[];

    return rows.map((row) => normalizeCsv(row));
  }
}

/// Colunas aceitas no CSV, em inglês ou português.
const COLUMN_ALIASES: Record<string, string[]> = {
  externalId: ['external_id', 'externalid', 'idfuncionario', 'id', 'codigo'],
  registration: ['registration', 'matricula', 'cdchamada', 'chapa'],
  name: ['name', 'nome', 'nmfuncionario'],
  cpf: ['cpf'],
  pis: ['pis', 'pis_pasep', 'nit'],
  email: ['email', 'e_mail'],
  phone: ['phone', 'telefone', 'celular'],
  position: ['position', 'cargo', 'funcao'],
  department: ['department', 'departamento', 'setor'],
  admittedAt: ['admitted_at', 'admissao', 'dtadmissao', 'data_admissao'],
  terminatedAt: ['terminated_at', 'demissao', 'dtdemissao', 'data_demissao'],
  status: ['status', 'situacao'],
};

function normalizeCsv(row: Record<string, unknown>): EmployeeSourceRecord {
  const lowered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    lowered[key.trim().toLowerCase()] = value;
  }

  const pick = (field: string): unknown => {
    for (const alias of COLUMN_ALIASES[field] ?? []) {
      const value = lowered[alias];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
  };

  const registration = text(pick('registration'));
  const externalId = text(pick('externalId')) ?? registration;

  if (!externalId || !registration) {
    throw new Error(
      `Registro sem matrícula/identificador: ${JSON.stringify(row).slice(0, 200)}`,
    );
  }

  return {
    externalId,
    registration,
    name: presentableName(text(pick('name'))) ?? registration,
    cpf: digits(pick('cpf')),
    pis: digits(pick('pis')),
    email: text(pick('email'))?.toLowerCase() ?? null,
    phone: text(pick('phone')),
    position: titleCase(text(pick('position'))),
    department: titleCase(text(pick('department'))),
    admittedAt: toDate(pick('admittedAt')),
    terminatedAt: toDate(pick('terminatedAt')),
    status: text(pick('status')),
    raw: row,
  };
}

function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value).trim() || null;
}

function digits(value: unknown): string | null {
  const raw = text(value);
  return raw ? raw.replace(/\D/g, '') || null : null;
}

/// Datas do Alterdata chegam como texto 'AAAA-MM-DD'. Interpretamos como
/// meia-noite UTC: tratar como horário local jogaria a data um dia para trás
/// no fuso de Brasília.
function toDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;

  const isoDay = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
    return new Date(`${isoDay}T00:00:00.000Z`);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/// O ERP guarda tudo em CAIXA ALTA. Exibir assim grita na tela do app.
function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .replace(/(^|[\s/-])([a-zà-ú])/g, (_, prefix: string, letter: string) =>
      prefix + letter.toUpperCase(),
    );
}

/// Nomes em caixa alta viram Capitalizados, mantendo as preposições minúsculas.
const LOWERCASE_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

function presentableName(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && LOWERCASE_PARTICLES.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}
