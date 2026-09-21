import { describe, expect, it } from 'vitest';
import { DayCalculationInput, calculateDay } from './day-calculator';

const TZ = 'America/Sao_Paulo';

/// Helper: horário local de São Paulo (UTC-3) como instante UTC.
const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 2, 10, hour + 3, minute)); // 10/03/2026, sem horário de verão

const base = (overrides: Partial<DayCalculationInput> = {}): DayCalculationInput => ({
  punches: [],
  timezone: TZ,
  expectedMinutes: 480,
  minBreakMinutes: 60,
  toleranceMinutesPerDay: 10,
  isHoliday: false,
  isRestDay: false,
  ...overrides,
});

describe('calculateDay', () => {
  it('apura um dia cheio de 8h com 1h de intervalo', () => {
    const result = calculateDay(
      base({
        punches: [
          { punchedAt: at(8) },
          { punchedAt: at(12) },
          { punchedAt: at(13) },
          { punchedAt: at(17) },
        ],
      }),
    );

    expect(result.workedMinutes).toBe(480);
    expect(result.breakMinutes).toBe(60);
    expect(result.balanceMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.hasInconsistency).toBe(false);
  });

  it('zera o saldo dentro da tolerância legal de 10 minutos', () => {
    const result = calculateDay(
      base({
        punches: [
          { punchedAt: at(8) },
          { punchedAt: at(12) },
          { punchedAt: at(13) },
          { punchedAt: at(17, 8) }, // 8 min a mais
        ],
      }),
    );

    expect(result.workedMinutes).toBe(488);
    expect(result.balanceMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('conta hora extra quando ultrapassa a tolerância', () => {
    const result = calculateDay(
      base({
        punches: [
          { punchedAt: at(8) },
          { punchedAt: at(12) },
          { punchedAt: at(13) },
          { punchedAt: at(19) }, // 2h a mais
        ],
      }),
    );

    expect(result.workedMinutes).toBe(600);
    expect(result.balanceMinutes).toBe(120);
    expect(result.overtimeMinutes).toBe(120);
    expect(result.absenceMinutes).toBe(0);
  });

  it('sinaliza número ímpar de marcações e ignora a última', () => {
    const result = calculateDay(
      base({
        punches: [{ punchedAt: at(8) }, { punchedAt: at(12) }, { punchedAt: at(13) }],
      }),
    );

    expect(result.workedMinutes).toBe(240);
    expect(result.punchCount).toBe(3);
    expect(result.inconsistencies.map((item) => item.code)).toContain('ODD_PUNCH_COUNT');
  });

  it('acusa intervalo abaixo do mínimo em jornada acima de 6h', () => {
    const result = calculateDay(
      base({
        punches: [
          { punchedAt: at(8) },
          { punchedAt: at(12) },
          { punchedAt: at(12, 20) }, // apenas 20 min de intervalo
          { punchedAt: at(17) },
        ],
      }),
    );

    expect(result.breakMinutes).toBe(20);
    expect(result.inconsistencies.map((item) => item.code)).toContain('BREAK_BELOW_MINIMUM');
  });

  it('registra falta integral em dia útil sem marcação', () => {
    const result = calculateDay(base({ punches: [] }));

    expect(result.workedMinutes).toBe(0);
    expect(result.absenceMinutes).toBe(480);
    expect(result.inconsistencies.map((item) => item.code)).toContain('NO_PUNCHES_ON_WORKDAY');
  });

  it('não gera falta em folga e sinaliza marcação no dia', () => {
    const result = calculateDay(
      base({
        expectedMinutes: 0,
        isRestDay: true,
        punches: [{ punchedAt: at(9) }, { punchedAt: at(13) }],
      }),
    );

    expect(result.workedMinutes).toBe(240);
    expect(result.balanceMinutes).toBe(240);
    expect(result.absenceMinutes).toBe(0);
    expect(result.inconsistencies.map((item) => item.code)).toContain('PUNCH_ON_REST_DAY');
  });

  it('conta adicional noturno apenas na faixa das 22h às 5h', () => {
    const result = calculateDay(
      base({
        expectedMinutes: 480,
        // Turno das 20h às 4h: 2h antes das 22h + 6h dentro da faixa noturna.
        punches: [{ punchedAt: at(20) }, { punchedAt: at(28) }],
      }),
    );

    expect(result.workedMinutes).toBe(480);
    expect(result.nightMinutes).toBe(360);
  });

  it('avisa quando a jornada passa de 16h (provável saída não registrada)', () => {
    const result = calculateDay(
      base({ punches: [{ punchedAt: at(6) }, { punchedAt: at(23) }] }),
    );

    expect(result.inconsistencies.map((item) => item.code)).toContain('EXCESSIVE_WORKDAY');
  });
});
