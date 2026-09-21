import { Injectable, NotFoundException } from '@nestjs/common';
import { AdjustmentStatus, AdjustmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { minutesToClock } from '../../common/utils/date';
import { DayCalculationResult, Inconsistency, calculateDay } from './day-calculator';

export interface TimesheetDay {
  date: string;
  weekday: number;
  isHoliday: boolean;
  isRestDay: boolean;
  punches: { id: string; time: string; kind: string; outsideGeofence: boolean }[];
  expectedMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  balanceMinutes: number;
  overtimeMinutes: number;
  nightMinutes: number;
  absenceMinutes: number;
  hasInconsistency: boolean;
  inconsistencies: Inconsistency[];
  /// Versões "HH:mm" prontas para a tela.
  worked: string;
  expected: string;
  balance: string;
}

export interface TimesheetResult {
  employee: { id: string; name: string; registration: string; timezone: string };
  from: string;
  to: string;
  days: TimesheetDay[];
  totals: {
    expectedMinutes: number;
    workedMinutes: number;
    balanceMinutes: number;
    overtimeMinutes: number;
    nightMinutes: number;
    absenceMinutes: number;
    inconsistentDays: number;
    worked: string;
    expected: string;
    balance: string;
  };
}

@Injectable()
export class TimesheetService {
  constructor(private readonly prisma: PrismaService) {}

  /// Monta o espelho de ponto de um período e atualiza o cache `DayTimesheet`.
  async build(
    companyId: string,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<TimesheetResult> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        company: true,
        workSchedule: { include: { days: true } },
      },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');

    const timezone = employee.timezone ?? employee.company.timezone;
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);

    const [punches, holidays, approvedAdjustments] = await Promise.all([
      this.prisma.punch.findMany({
        where: { employeeId, localDate: { gte: fromDate, lte: toDate } },
        orderBy: { punchedAt: 'asc' },
        select: {
          id: true,
          punchedAt: true,
          localDate: true,
          kind: true,
          outsideGeofence: true,
        },
      }),
      this.prisma.holiday.findMany({
        where: { companyId, date: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.punchAdjustment.findMany({
        where: {
          employeeId,
          status: AdjustmentStatus.APPROVED,
          localDate: { gte: fromDate, lte: toDate },
        },
        select: { type: true, localDate: true, targetPunchId: true },
      }),
    ]);

    // Marcações não são apagadas: um REMOVE ou CHANGE_TIME aprovado apenas faz
    // a apuração ignorar a original, que continua na cadeia para auditoria.
    const disregardedPunchIds = new Set(
      approvedAdjustments
        .filter(
          (adjustment) =>
            adjustment.targetPunchId &&
            (adjustment.type === AdjustmentType.REMOVE ||
              adjustment.type === AdjustmentType.CHANGE_TIME),
        )
        .map((adjustment) => adjustment.targetPunchId as string),
    );

    // Dia abonado não gera falta: zeramos a carga prevista.
    const justifiedDates = new Set(
      approvedAdjustments
        .filter((adjustment) => adjustment.type === AdjustmentType.JUSTIFY_ABSENCE)
        .map((adjustment) => isoDay(adjustment.localDate)),
    );

    const punchesByDate = new Map<string, typeof punches>();
    for (const punch of punches) {
      if (disregardedPunchIds.has(punch.id)) continue;
      const key = isoDay(punch.localDate);
      const list = punchesByDate.get(key) ?? [];
      list.push(punch);
      punchesByDate.set(key, list);
    }

    const holidayDates = new Set(holidays.map((holiday) => isoDay(holiday.date)));
    const scheduleDays = new Map(
      (employee.workSchedule?.days ?? []).map((day) => [day.weekday, day]),
    );
    const minBreakMinutes = employee.workSchedule?.minBreakMinutes ?? 60;

    const days: TimesheetDay[] = [];
    const cacheWrites: Promise<unknown>[] = [];

    for (const date of eachDay(fromDate, toDate)) {
      const key = isoDay(date);
      const weekday = date.getUTCDay();
      const scheduleDay = scheduleDays.get(weekday);
      const isHoliday = holidayDates.has(key);
      // Sem jornada cadastrada não há expectativa: o dia só registra o que foi
      // trabalhado, sem gerar falta. Feriado zera a carga prevista.
      const isRestDay = !scheduleDay || scheduleDay.startMinute == null;
      const isJustified = justifiedDates.has(key);
      const expectedMinutes =
        isRestDay || isHoliday || isJustified ? 0 : expectedFor(scheduleDay!, minBreakMinutes);

      const dayPunches = punchesByDate.get(key) ?? [];
      const result = calculateDay({
        punches: dayPunches,
        timezone,
        expectedMinutes,
        minBreakMinutes,
        toleranceMinutesPerDay: employee.company.toleranceMinutesPerDay,
        isHoliday,
        isRestDay,
      });

      days.push({
        date: key,
        weekday,
        isHoliday,
        isRestDay,
        punches: dayPunches.map((punch) => ({
          id: punch.id,
          time: formatTime(punch.punchedAt, timezone),
          kind: punch.kind,
          outsideGeofence: punch.outsideGeofence,
        })),
        ...result,
        worked: minutesToClock(result.workedMinutes),
        expected: minutesToClock(result.expectedMinutes),
        balance: minutesToClock(result.balanceMinutes),
      });

      cacheWrites.push(this.persist(companyId, employeeId, date, result, isHoliday, isRestDay));
    }

    await Promise.all(cacheWrites);

    const totals = days.reduce(
      (acc, day) => ({
        expectedMinutes: acc.expectedMinutes + day.expectedMinutes,
        workedMinutes: acc.workedMinutes + day.workedMinutes,
        balanceMinutes: acc.balanceMinutes + day.balanceMinutes,
        overtimeMinutes: acc.overtimeMinutes + day.overtimeMinutes,
        nightMinutes: acc.nightMinutes + day.nightMinutes,
        absenceMinutes: acc.absenceMinutes + day.absenceMinutes,
        inconsistentDays: acc.inconsistentDays + (day.hasInconsistency ? 1 : 0),
      }),
      {
        expectedMinutes: 0,
        workedMinutes: 0,
        balanceMinutes: 0,
        overtimeMinutes: 0,
        nightMinutes: 0,
        absenceMinutes: 0,
        inconsistentDays: 0,
      },
    );

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        registration: employee.registration,
        timezone,
      },
      from,
      to,
      days,
      totals: {
        ...totals,
        worked: minutesToClock(totals.workedMinutes),
        expected: minutesToClock(totals.expectedMinutes),
        balance: minutesToClock(totals.balanceMinutes),
      },
    };
  }

  /// Dias com pendência no período — a fila de trabalho do RH no painel.
  async inconsistencies(companyId: string, from: string, to: string) {
    return this.prisma.dayTimesheet.findMany({
      where: {
        companyId,
        hasInconsistency: true,
        date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
      },
      orderBy: [{ date: 'desc' }],
      include: {
        employee: { select: { id: true, name: true, registration: true } },
      },
      take: 500,
    });
  }

  private persist(
    companyId: string,
    employeeId: string,
    date: Date,
    result: DayCalculationResult,
    isHoliday: boolean,
    isRestDay: boolean,
  ) {
    const data = {
      companyId,
      employeeId,
      date,
      expectedMinutes: result.expectedMinutes,
      workedMinutes: result.workedMinutes,
      breakMinutes: result.breakMinutes,
      balanceMinutes: result.balanceMinutes,
      overtimeMinutes: result.overtimeMinutes,
      nightMinutes: result.nightMinutes,
      absenceMinutes: result.absenceMinutes,
      isHoliday,
      isRestDay,
      hasInconsistency: result.hasInconsistency,
      inconsistencies: result.inconsistencies as unknown as object,
      punchCount: result.punchCount,
      computedAt: new Date(),
    };

    return this.prisma.dayTimesheet.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: data,
      update: data,
    });
  }
}

/// Carga prevista do dia: usa o valor explícito quando houver, senão deriva
/// de entrada/saída descontando o intervalo previsto.
function expectedFor(
  day: {
    startMinute: number | null;
    endMinute: number | null;
    breakStartMinute: number | null;
    breakEndMinute: number | null;
    expectedMinutes: number | null;
  },
  fallbackBreak: number,
): number {
  if (day.expectedMinutes != null) return day.expectedMinutes;
  if (day.startMinute == null || day.endMinute == null) return 0;

  const gross = day.endMinute - day.startMinute;
  const scheduledBreak =
    day.breakStartMinute != null && day.breakEndMinute != null
      ? day.breakEndMinute - day.breakStartMinute
      : gross > 6 * 60
        ? fallbackBreak
        : 0;

  return Math.max(0, gross - scheduledBreak);
}

function* eachDay(from: Date, to: Date): Generator<Date> {
  const cursor = new Date(from);
  while (cursor <= to) {
    yield new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(instant);
}
