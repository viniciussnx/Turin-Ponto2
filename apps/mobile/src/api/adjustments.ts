import { useCallback, useEffect, useState } from 'react';
import { api } from './client';

export type AdjustmentType = 'ADD' | 'REMOVE' | 'CHANGE_TIME' | 'JUSTIFY_ABSENCE';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Adjustment {
  id: string;
  type: AdjustmentType;
  status: AdjustmentStatus;
  localDate: string;
  targetPunchId: string | null;
  proposedAt: string | null;
  proposedKind: string | null;
  reason: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  targetPunch?: { id: string; punchedAt: string; kind: string } | null;
}

export interface CreateAdjustmentInput {
  type: AdjustmentType;
  localDate: string;
  targetPunchId?: string;
  proposedAt?: string;
  proposedKind?: string;
  reason: string;
}

export function useAdjustments() {
  const [items, setItems] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api<Adjustment[]>('/adjustments/me'));
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}

export async function createAdjustment(input: CreateAdjustmentInput): Promise<Adjustment> {
  return api<Adjustment>('/adjustments', { method: 'POST', body: input });
}

export async function cancelAdjustment(id: string): Promise<void> {
  await api(`/adjustments/${id}/cancel`, { method: 'PATCH' });
}

export const TYPE_LABEL: Record<AdjustmentType, string> = {
  ADD: 'Inclusão de marcação',
  REMOVE: 'Exclusão de marcação',
  CHANGE_TIME: 'Ajuste de horário',
  JUSTIFY_ABSENCE: 'Abono de falta',
};

export const STATUS_LABEL: Record<AdjustmentStatus, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  CANCELLED: 'Cancelado',
};

export function statusTone(status: AdjustmentStatus): 'ok' | 'warn' | 'bad' | 'neutral' {
  if (status === 'APPROVED') return 'ok';
  if (status === 'PENDING') return 'warn';
  if (status === 'REJECTED') return 'bad';
  return 'neutral';
}

export function typeIcon(type: AdjustmentType): 'swap' | 'plus' | 'alert' | 'doc' {
  if (type === 'CHANGE_TIME') return 'swap';
  if (type === 'ADD') return 'plus';
  if (type === 'JUSTIFY_ABSENCE') return 'doc';
  return 'alert';
}

/// "Protocolo #4821" no protótipo. O servidor usa UUID, então mostramos os
/// últimos caracteres em caixa alta — curto o bastante para ditar ao RH e
/// suficiente para localizar o registro.
export function protocolOf(id: string): string {
  return id.replace(/-/g, '').slice(-6).toUpperCase();
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
