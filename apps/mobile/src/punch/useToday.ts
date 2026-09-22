import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { flush, pendingCount, type PunchKind } from './queue';

export interface TodayPunch {
  id: string;
  punchedAt: string;
  kind: PunchKind;
  outsideGeofence: boolean;
}

/// As quatro marcações do dia, na ordem que a tela 03 exibe.
export const DAY_SLOTS = [
  { kind: 'CLOCK_IN' as const, label: 'Entrada' },
  { kind: 'BREAK_OUT' as const, label: 'Almoço' },
  { kind: 'BREAK_IN' as const, label: 'Retorno' },
  { kind: 'CLOCK_OUT' as const, label: 'Saída' },
];

export interface TodayState {
  punches: TodayPunch[];
  pending: number;
  loading: boolean;
  error: string | null;
  /// Próxima marcação esperada, deduzida pela quantidade já registrada.
  nextKind: PunchKind;
  reload: () => Promise<void>;
}

export function useToday(): TodayState {
  const [punches, setPunches] = useState<TodayPunch[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      // Envia o que estiver preso na fila antes de ler: assim a tela já mostra
      // a marcação que ficou pendente da última vez sem sinal.
      await flush().catch(() => undefined);

      const today = new Date().toISOString().slice(0, 10);
      const result = await api<TodayPunch[]>(`/punches/me?from=${today}&to=${today}`);
      setPunches(result);
    } catch (failure) {
      // Sem rede, a tela continua utilizável: o botão de bater ponto é o que
      // importa, e ele funciona offline.
      setError((failure as Error).message);
    } finally {
      setPending(await pendingCount());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // A ordem cronológica é que manda: a 1ª do dia é entrada, a 2ª é saída para
  // o intervalo, e assim por diante. Passando de quatro, fica sem rótulo — o
  // servidor aceita e a apuração pareia por ordem de qualquer forma.
  const total = punches.length + pending;
  const nextKind = DAY_SLOTS[total]?.kind ?? 'UNSPECIFIED';

  return { punches, pending, loading, error, nextKind, reload };
}

export function labelForKind(kind: PunchKind): string {
  return DAY_SLOTS.find((slot) => slot.kind === kind)?.label ?? 'Registro';
}

/// Texto do botão principal: "Registrar saída", "Registrar entrada"…
/// Sentence case, que é a convenção do iOS para botão e a norma do pt-BR.
export function buttonLabelForKind(kind: PunchKind): string {
  if (kind === 'UNSPECIFIED') return 'Registrar ponto';
  return `Registrar ${labelForKind(kind).toLowerCase()}`;
}
