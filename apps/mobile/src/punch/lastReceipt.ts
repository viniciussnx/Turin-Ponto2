import { useSyncExternalStore } from 'react';
import type { PunchKind, PunchReceipt } from './queue';

/// Resultado da última marcação feita neste aparelho, compartilhado entre o
/// fluxo de registro (modal) e a aba Ponto, que mostra o estado "Ponto
/// registrado" do protótipo quando o modal fecha.
export interface LastPunch {
  kind: PunchKind;
  at: string;
  /// Nulo quando a marcação entrou na fila offline.
  receipt: PunchReceipt | null;
}

let current: LastPunch | null = null;
const listeners = new Set<() => void>();

export function setLastPunch(value: LastPunch | null): void {
  current = value;
  listeners.forEach((listener) => listener());
}

export function useLastPunch(): LastPunch | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
