import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { ApiError, api } from '../api/client';

/// Fila offline de marcações.
///
/// A regra do produto é que o funcionário SEMPRE consegue bater o ponto —
/// garagem tem laje, subsolo e ponto cego de operadora. Então a marcação é
/// gravada localmente primeiro e enviada depois; a tela confirma na hora.
///
/// O que torna isso seguro é o `clientId`: o servidor trata a marcação como
/// idempotente por esse id, então reenviar não duplica. E o horário que vale é
/// o `punchedAt` do momento do toque, não o da chegada ao servidor.

export type PunchKind = 'CLOCK_IN' | 'BREAK_OUT' | 'BREAK_IN' | 'CLOCK_OUT' | 'UNSPECIFIED';

export interface QueuedPunch {
  clientId: string;
  punchedAt: string;
  kind: PunchKind;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  address?: string;
  selfieKey?: string;
  offline: boolean;
  /// Quantas vezes já tentamos enviar. Só para diagnóstico na tela.
  attempts: number;
  /// Último erro, quando a tentativa falhou por motivo não recuperável.
  lastError?: string;
}

export interface PunchReceipt {
  nsr: string;
  employeeName: string;
  registration: string;
  companyName: string;
  cnpj: string | null;
  punchedAt: string;
  hash: string;
  outsideGeofence: boolean;
  duplicated: boolean;
}

interface PunchResponse {
  id: string;
  nsr: string;
  punchedAt: string;
  registeredAt: string;
  kind: PunchKind;
  outsideGeofence: boolean;
  receipt: PunchReceipt;
}

const QUEUE_KEY = 'turin.punchQueue';

export type PunchInput = Omit<QueuedPunch, 'clientId' | 'offline' | 'attempts'>;

/// Enfileira e tenta enviar na hora. Devolve o comprovante quando o envio deu
/// certo, ou `null` quando ficou pendente — em ambos os casos a marcação está
/// registrada do ponto de vista do funcionário.
export async function submitPunch(input: PunchInput): Promise<PunchReceipt | null> {
  const punch: QueuedPunch = {
    ...input,
    clientId: Crypto.randomUUID(),
    offline: false,
    attempts: 0,
  };

  await enqueue(punch);
  const [receipt] = await flush();
  return receipt ?? null;
}

/// Tenta enviar tudo que está pendente. Seguro chamar a qualquer momento:
/// no boot, ao voltar do background e depois de cada marcação.
export async function flush(): Promise<PunchReceipt[]> {
  const queue = await readQueue();
  if (queue.length === 0) return [];

  const receipts: PunchReceipt[] = [];
  const remaining: QueuedPunch[] = [];

  for (const punch of queue) {
    try {
      const result = await api<PunchResponse>('/punches', {
        method: 'POST',
        body: {
          clientId: punch.clientId,
          punchedAt: punch.punchedAt,
          kind: punch.kind,
          latitude: punch.latitude,
          longitude: punch.longitude,
          accuracyMeters: punch.accuracyMeters,
          address: punch.address,
          selfieKey: punch.selfieKey,
          // Marca como offline quando não foi na primeira tentativa: essa
          // diferença entre `punchedAt` e a chegada é evidência de auditoria.
          offline: punch.attempts > 0,
        },
      });
      receipts.push(result.receipt);
    } catch (error) {
      const failed = { ...punch, attempts: punch.attempts + 1 };

      if (isPermanent(error)) {
        // 4xx não melhora com retentativa. Sai da fila para não travar as
        // marcações seguintes; o registro do erro vira pendência no app.
        failed.lastError = (error as ApiError).message;
        await recordRejected(failed);
        continue;
      }

      failed.lastError = (error as Error).message;
      remaining.push(failed);
    }
  }

  await writeQueue(remaining);
  return receipts;
}

/// Erro do cliente (400/403/404/422): reenviar dá o mesmo resultado.
/// O 401 fica de fora — esse o cliente HTTP resolve renovando o token.
function isPermanent(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status >= 400 && error.status < 500 && error.status !== 401;
}

export async function pendingCount(): Promise<number> {
  return (await readQueue()).length;
}

export async function readQueue(): Promise<QueuedPunch[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedPunch[];
  } catch {
    // Fila corrompida não pode impedir novas marcações.
    await AsyncStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

async function writeQueue(queue: QueuedPunch[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function enqueue(punch: QueuedPunch): Promise<void> {
  const queue = await readQueue();
  queue.push(punch);
  await writeQueue(queue);
}

const REJECTED_KEY = 'turin.punchRejected';

/// Marcações que o servidor recusou. Ficam guardadas para o funcionário poder
/// abrir uma solicitação de ajuste — perder o registro seria pior.
async function recordRejected(punch: QueuedPunch): Promise<void> {
  const raw = await AsyncStorage.getItem(REJECTED_KEY);
  const list = raw ? (JSON.parse(raw) as QueuedPunch[]) : [];
  list.push(punch);
  await AsyncStorage.setItem(REJECTED_KEY, JSON.stringify(list.slice(-50)));
}

export async function readRejected(): Promise<QueuedPunch[]> {
  const raw = await AsyncStorage.getItem(REJECTED_KEY);
  return raw ? (JSON.parse(raw) as QueuedPunch[]) : [];
}
