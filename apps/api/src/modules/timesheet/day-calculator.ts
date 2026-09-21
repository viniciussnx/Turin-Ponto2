import { toZonedTime } from 'date-fns-tz';

/// Apuração de um dia de trabalho. Função pura: recebe marcações e jornada,
/// devolve os totais. Não toca no banco, o que a torna trivial de testar e
/// permite recalcular qualquer período histórico sem efeito colateral.

export type InconsistencyCode =
  | 'ODD_PUNCH_COUNT'
  | 'NO_PUNCHES_ON_WORKDAY'
  | 'PUNCH_ON_REST_DAY'
  | 'BREAK_BELOW_MINIMUM'
  | 'WORKED_ON_HOLIDAY'
  | 'EXCESSIVE_WORKDAY';

export interface Inconsistency {
  code: InconsistencyCode;
  message: string;
}

export interface CalculatorPunch {
  punchedAt: Date;
}

export interface DayCalculationInput {
  punches: CalculatorPunch[];
  timezone: string;
  /// Carga esperada do dia em minutos. 0 = folga.
  expectedMinutes: number;
  /// Intervalo mínimo obrigatório quando a jornada passa de 6h.
  minBreakMinutes: number;
  toleranceMinutesPerDay: number;
  isHoliday: boolean;
  isRestDay: boolean;
}

export interface DayCalculationResult {
  workedMinutes: number;
  breakMinutes: number;
  expectedMinutes: number;
  balanceMinutes: number;
  overtimeMinutes: number;
  nightMinutes: number;
  absenceMinutes: number;
  punchCount: number;
  hasInconsistency: boolean;
  inconsistencies: Inconsistency[];
}

/// Jornada acima disso é quase certamente marcação esquecida (o funcionário
/// não bateu a saída), não um dia real de 16 horas.
const MAX_PLAUSIBLE_WORKDAY_MINUTES = 16 * 60;

/// Horário noturno urbano: 22h às 5h (CLT art. 73 §2º).
const NIGHT_START_MINUTE = 22 * 60;
const NIGHT_END_MINUTE = 5 * 60;

export function calculateDay(input: DayCalculationInput): DayCalculationResult {
  const inconsistencies: Inconsistency[] = [];
  const punches = [...input.punches].sort(
    (a, b) => a.punchedAt.getTime() - b.punchedAt.getTime(),
  );

  // O pareamento é pela ORDEM, não pelo tipo informado na marcação: o
  // funcionário erra o botão com frequência, mas a sequência temporal não mente.
  // Pares (0,1), (2,3)... são trabalho; (1,2), (3,4)... são intervalo.
  const usable = punches.length % 2 === 0 ? punches : punches.slice(0, -1);

  if (punches.length % 2 !== 0) {
    inconsistencies.push({
      code: 'ODD_PUNCH_COUNT',
      message: `Número ímpar de marcações (${punches.length}). A última foi ignorada no cálculo.`,
    });
  }

  let workedMinutes = 0;
  let nightMinutes = 0;
  for (let i = 0; i + 1 < usable.length; i += 2) {
    const start = usable[i].punchedAt;
    const end = usable[i + 1].punchedAt;
    workedMinutes += diffInMinutes(start, end);
    nightMinutes += nightOverlapMinutes(start, end, input.timezone);
  }

  let breakMinutes = 0;
  for (let i = 1; i + 1 < usable.length; i += 2) {
    breakMinutes += diffInMinutes(usable[i].punchedAt, usable[i + 1].punchedAt);
  }

  if (punches.length === 0 && input.expectedMinutes > 0) {
    inconsistencies.push({
      code: 'NO_PUNCHES_ON_WORKDAY',
      message: 'Nenhuma marcação em dia útil com jornada prevista.',
    });
  }
  if (punches.length > 0 && input.isRestDay) {
    inconsistencies.push({
      code: 'PUNCH_ON_REST_DAY',
      message: 'Marcações registradas em dia de folga.',
    });
  }
  if (punches.length > 0 && input.isHoliday) {
    inconsistencies.push({
      code: 'WORKED_ON_HOLIDAY',
      message: 'Marcações registradas em feriado.',
    });
  }
  // CLT art. 71: jornada acima de 6h exige intervalo mínimo (em regra, 1h).
  if (workedMinutes > 6 * 60 && breakMinutes < input.minBreakMinutes) {
    inconsistencies.push({
      code: 'BREAK_BELOW_MINIMUM',
      message: `Intervalo de ${breakMinutes} min abaixo do mínimo de ${input.minBreakMinutes} min.`,
    });
  }
  if (workedMinutes > MAX_PLAUSIBLE_WORKDAY_MINUTES) {
    inconsistencies.push({
      code: 'EXCESSIVE_WORKDAY',
      message: 'Jornada acima de 16h. Verifique se falta uma marcação de saída.',
    });
  }

  const rawBalance = workedMinutes - input.expectedMinutes;

  // CLT art. 58 §1º: variações de até 10 min no total do dia não são
  // computadas nem como extra nem como falta. Dentro da faixa, o saldo zera.
  const withinTolerance = Math.abs(rawBalance) <= input.toleranceMinutesPerDay;
  const balanceMinutes = withinTolerance ? 0 : rawBalance;

  const overtimeMinutes = Math.max(0, balanceMinutes);
  const absenceMinutes = Math.max(0, -balanceMinutes);

  return {
    workedMinutes,
    breakMinutes,
    expectedMinutes: input.expectedMinutes,
    balanceMinutes,
    overtimeMinutes,
    nightMinutes,
    absenceMinutes,
    punchCount: punches.length,
    hasInconsistency: inconsistencies.length > 0,
    inconsistencies,
  };
}

function diffInMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

/// Minutos de um intervalo que caem na faixa noturna (22h-5h) do fuso local.
///
/// Devolve minutos de relógio. A conversão para a "hora noturna reduzida" de
/// 52min30s (CLT art. 73 §1º) é responsabilidade da folha, não da apuração.
function nightOverlapMinutes(start: Date, end: Date, timezone: string): number {
  const localStart = toZonedTime(start, timezone);
  const localEnd = toZonedTime(end, timezone);

  let total = 0;
  // Varredura minuto a minuto: uma jornada tem no máximo ~1440 iterações, o
  // custo é irrelevante e evita a aritmética de faixas que cruzam meia-noite.
  const cursor = new Date(localStart);
  cursor.setSeconds(0, 0);

  while (cursor < localEnd) {
    const minuteOfDay = cursor.getHours() * 60 + cursor.getMinutes();
    if (minuteOfDay >= NIGHT_START_MINUTE || minuteOfDay < NIGHT_END_MINUTE) {
      total += 1;
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return total;
}
