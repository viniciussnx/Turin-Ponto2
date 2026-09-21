import { useCallback, useEffect, useState } from 'react';
import { api } from './client';

/// Espelho de ponto, tal como `GET /timesheet/me` devolve.

export interface Inconsistency {
  code: string;
  message: string;
}

export interface TimesheetPunch {
  id: string;
  time: string;
  kind: string;
  outsideGeofence: boolean;
}

export interface TimesheetDay {
  date: string;
  weekday: number;
  isHoliday: boolean;
  isRestDay: boolean;
  punches: TimesheetPunch[];
  expectedMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  balanceMinutes: number;
  overtimeMinutes: number;
  nightMinutes: number;
  absenceMinutes: number;
  hasInconsistency: boolean;
  inconsistencies: Inconsistency[];
  worked: string;
  expected: string;
  balance: string;
}

export interface TimesheetTotals {
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
}

export interface Timesheet {
  employee: { id: string; name: string; registration: string; timezone: string };
  from: string;
  to: string;
  days: TimesheetDay[];
  totals: TimesheetTotals;
}

export function useTimesheet(month: Date) {
  const [data, setData] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = firstDayOf(month);
  const to = lastDayOf(month);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api<Timesheet>(`/timesheet/me?from=${from}&to=${to}`));
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function firstDayOf(month: Date): string {
  return new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function lastDayOf(month: Date): string {
  return new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
}

/// Dias futuros não interessam no espelho: mostram sempre "falta" até chegarem.
export function untilToday(days: TimesheetDay[]): TimesheetDay[] {
  const today = new Date().toISOString().slice(0, 10);
  return days.filter((day) => day.date <= today);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayLabel(weekday: number): string {
  return WEEKDAYS[weekday] ?? '';
}

export function dayNumber(isoDate: string): string {
  return isoDate.slice(8, 10);
}

export function monthLabel(month: Date): string {
  return month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/// Resumo de um dia em uma linha: "07:12 · 11:58 · 12:59 · 16:46".
export function marksLine(day: TimesheetDay): string {
  if (day.punches.length > 0) return day.punches.map((punch) => punch.time).join(' · ');
  if (day.isHoliday) return 'Feriado';
  if (day.isRestDay) return 'Folga programada';
  return 'Sem marcação';
}

/// Rótulo de situação do dia, na linguagem do protótipo.
export function dayTag(day: TimesheetDay): { text: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' } {
  if (day.hasInconsistency) {
    return { text: day.inconsistencies[0]?.message ?? 'Pendência', tone: 'warn' };
  }
  if (day.isHoliday) return { text: 'Feriado', tone: 'neutral' };
  if (day.isRestDay) return { text: 'Folga', tone: 'neutral' };
  if (day.punches.length === 0) return { text: 'Sem marcação', tone: 'neutral' };
  if (day.overtimeMinutes > 0) return { text: 'Hora extra', tone: 'ok' };
  if (day.absenceMinutes > 0) return { text: 'Saldo negativo', tone: 'bad' };
  return { text: 'Jornada normal', tone: 'neutral' };
}
