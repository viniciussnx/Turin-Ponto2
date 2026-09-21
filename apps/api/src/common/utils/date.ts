import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/// Data de competencia (dia civil) de um instante, no fuso informado.
///
/// Devolve meia-noite UTC do dia local, que e o formato que o Postgres espera
/// numa coluna `date`. Sem isso, uma marcacao as 21h de Sao Paulo cairia no
/// dia seguinte quando lida como UTC.
export function toLocalDate(instant: Date, timezone: string): Date {
  const isoDay = formatInTimeZone(instant, timezone, 'yyyy-MM-dd');
  return new Date(`${isoDay}T00:00:00.000Z`);
}

/// Minutos desde a meia-noite local.
export function minutesSinceMidnight(instant: Date, timezone: string): number {
  const zoned = toZonedTime(instant, timezone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/// "HH:mm" local, para exibicao em comprovantes e relatorios.
export function formatLocalTime(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, 'HH:mm');
}

export function formatLocalDateTime(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, "dd/MM/yyyy 'as' HH:mm:ss");
}

/// Converte minutos para "HH:mm", aceitando negativos (saldo devedor).
export function minutesToClock(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
