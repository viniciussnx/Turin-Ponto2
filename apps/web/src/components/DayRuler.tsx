"use client";

import { useMemo } from "react";

export interface RulerPunch {
  id: string;
  /// Instante ISO da marcação.
  punchedAt: string;
  outsideGeofence?: boolean;
}

/// Régua do dia — a peça central do painel.
///
/// Um eixo de 00:00 a 23:59 com um traço por marcação registrada hoje. Numa
/// empresa de ônibus a jornada não é 9h-18h: existe a onda da manhã (motorista
/// tem que estar na garagem antes do carro sair), o bolo do almoço e a virada
/// do segundo turno. Um cartão de KPI esconde isso; a régua mostra na hora se
/// a pegada da manhã aconteceu ou não.
///
/// A altura de cada traço é a densidade de marcações naquele minuto, então uma
/// pegada concentrada vira um pico visível.
export function DayRuler({
  punches,
  loading,
}: {
  punches: RulerPunch[];
  loading?: boolean;
}) {
  const { buckets, peak, firstAt, lastAt } = useMemo(() => build(punches), [punches]);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nowPercent = (nowMinutes / 1440) * 100;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Régua do dia</p>
          <p className="text-[13px] text-muted">
            Cada traço é uma marcação registrada hoje
          </p>
        </div>
        <div className="flex items-center gap-5 text-[13px]">
          <span className="text-muted">
            Primeira{" "}
            <strong className="tnum font-display text-[17px] font-700 text-ink">
              {firstAt ?? "--:--"}
            </strong>
          </span>
          <span className="text-muted">
            Última{" "}
            <strong className="tnum font-display text-[17px] font-700 text-ink">
              {lastAt ?? "--:--"}
            </strong>
          </span>
        </div>
      </div>

      <div className="relative h-[104px] rounded-lg bg-paper px-1">
        {/* Faixas de turno: madrugada, manhã, tarde, noite. Só contexto visual. */}
        {SHIFT_BANDS.map((band) => (
          <div
            key={band.label}
            className="absolute inset-y-0"
            style={{
              left: `${(band.from / 1440) * 100}%`,
              width: `${((band.to - band.from) / 1440) * 100}%`,
              background: band.tint,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Traços das marcações */}
        <div className="absolute inset-x-1 bottom-0 top-0 flex items-end">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded bg-line-2" />
          ) : (
            buckets.map((count, index) => {
              if (count === 0) return null;
              const height = Math.max(8, (count / peak) * 88);
              return (
                <span
                  key={index}
                  title={`${formatBucket(index)} · ${count} ${
                    count === 1 ? "marcação" : "marcações"
                  }`}
                  className="absolute w-[3px] rounded-full bg-turin"
                  style={{
                    left: `${(index / buckets.length) * 100}%`,
                    height: `${height}px`,
                    bottom: 8,
                    opacity: 0.35 + (count / peak) * 0.65,
                  }}
                />
              );
            })
          )}
        </div>

        {/* Agulha do momento atual */}
        <div
          className="absolute inset-y-0 w-px bg-ink/25"
          style={{ left: `${nowPercent}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-px left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink/50" />
        </div>
      </div>

      {/* Eixo */}
      <div className="mt-1.5 flex justify-between px-1 text-[11px] text-muted tnum">
        {["00h", "04h", "08h", "12h", "16h", "20h", "24h"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

/// Divide o dia em blocos de 10 minutos: 144 traços cabem numa faixa larga sem
/// virar sopa de pixels, e ainda distinguem uma pegada de 06:40 de outra 06:50.
const BUCKET_MINUTES = 10;
const BUCKETS = 1440 / BUCKET_MINUTES;

const SHIFT_BANDS = [
  { label: "madrugada", from: 0, to: 5 * 60, tint: "rgba(15,31,23,0.04)" },
  { label: "manhã", from: 5 * 60, to: 12 * 60, tint: "rgba(11,175,41,0.05)" },
  { label: "tarde", from: 12 * 60, to: 18 * 60, tint: "rgba(11,175,41,0.03)" },
  { label: "noite", from: 18 * 60, to: 1440, tint: "rgba(15,31,23,0.04)" },
];

function build(punches: RulerPunch[]) {
  const buckets = new Array<number>(BUCKETS).fill(0);
  let first: Date | null = null;
  let last: Date | null = null;

  for (const punch of punches) {
    const date = new Date(punch.punchedAt);
    if (Number.isNaN(date.getTime())) continue;

    const minutes = date.getHours() * 60 + date.getMinutes();
    buckets[Math.min(BUCKETS - 1, Math.floor(minutes / BUCKET_MINUTES))] += 1;

    if (!first || date < first) first = date;
    if (!last || date > last) last = date;
  }

  return {
    buckets,
    // `peak` divide as alturas; 1 evita divisão por zero num dia sem marcação.
    peak: Math.max(1, ...buckets),
    firstAt: first ? formatTime(first) : null,
    lastAt: last ? formatTime(last) : null,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatBucket(index: number): string {
  const minutes = index * BUCKET_MINUTES;
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}
