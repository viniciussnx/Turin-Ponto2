"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/* ------------------------------------------------------------- Marcações */

export interface Punch {
  id: string;
  nsr: string;
  punchedAt: string;
  registeredAt: string;
  localDate: string;
  kind: string;
  source: string;
  offline: boolean;
  outsideGeofence: boolean;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  employee: { id: string; name: string; registration: string };
  device: { id: string; platform: string; model: string | null } | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/// Colunas ordenáveis. Espelha o enum `PunchSort` da API — a lista é fechada
/// dos dois lados porque o valor vira caminho de `orderBy` no Prisma.
export type PunchSort = "punchedAt" | "nsr" | "employee" | "kind";

export function usePunches(params: {
  from?: string;
  to?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: PunchSort;
  dir?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["punches", params],
    queryFn: () => api<Paged<Punch>>(`/punches?${qs(params)}`),
    placeholderData: (anterior) => anterior,
  });
}

/* ---------------------------------------------------------- Colaboradores */

export interface Employee {
  id: string;
  registration: string;
  name: string;
  cpf: string | null;
  email: string | null;
  position: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  admittedAt: string | null;
  photoUrl: string | null;
  syncedAt: string | null;
  appActivated: boolean;
  department: { id: string; name: string } | null;
  workSchedule: { id: string; name: string } | null;
  _count: { devices: number };
}

export function useEmployees(params: {
  search?: string;
  status?: string;
  departmentId?: string;
  pendingActivation?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => api<Paged<Employee>>(`/employees?${qs(params)}`),
    // Mantém a tabela anterior na tela enquanto a próxima página ou o novo
    // filtro carregam. Sem isto a lista sumia e voltava a cada tecla — o olho
    // perdia a linha que estava seguindo.
    placeholderData: (anterior) => anterior,
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => api<Record<string, unknown>>(`/employees/${id}`),
    enabled: Boolean(id),
  });
}

export interface ResetResult {
  success: true;
  registration: string;
  initialPassword: string;
  message: string;
}

export function useResetAppAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<ResetResult>(`/employees/${id}/reset-app-access`, { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["employees"] }),
  });
}

/* --------------------------------------------------------------- Ajustes */

export interface Adjustment {
  id: string;
  type: "ADD" | "REMOVE" | "CHANGE_TIME" | "JUSTIFY_ABSENCE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  localDate: string;
  proposedAt: string | null;
  proposedKind: string | null;
  reason: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  employee: { id: string; name: string; registration: string };
  targetPunch: { id: string; punchedAt: string; kind: string } | null;
  reviewedBy: { id: string; name: string } | null;
}

export function useAdjustments(params: { status?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["adjustments", params],
    queryFn: () => api<Adjustment[]>(`/adjustments?${qs(params)}`),
  });
}

export function useReviewAdjustment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reviewNote?: string;
    }) => api(`/adjustments/${id}/review`, { method: "PATCH", body: { status, reviewNote } }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["adjustments"] });
      void client.invalidateQueries({ queryKey: ["inconsistencies"] });
    },
  });
}

/* --------------------------------------------------------------- Espelho */

export interface TimesheetDay {
  date: string;
  weekday: number;
  isHoliday: boolean;
  isRestDay: boolean;
  punches: { id: string; time: string; kind: string; outsideGeofence: boolean }[];
  expectedMinutes: number;
  workedMinutes: number;
  balanceMinutes: number;
  overtimeMinutes: number;
  nightMinutes: number;
  absenceMinutes: number;
  hasInconsistency: boolean;
  inconsistencies: { code: string; message: string }[];
  worked: string;
  expected: string;
  balance: string;
}

export interface Timesheet {
  employee: { id: string; name: string; registration: string; timezone: string };
  from: string;
  to: string;
  days: TimesheetDay[];
  totals: {
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

export function useTimesheet(employeeId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["timesheet", employeeId, from, to],
    queryFn: () => api<Timesheet>(`/timesheet/employee/${employeeId}?from=${from}&to=${to}`),
    enabled: Boolean(employeeId),
  });
}

export interface Inconsistency {
  id: string;
  date: string;
  workedMinutes: number;
  expectedMinutes: number;
  balanceMinutes: number;
  punchCount: number;
  inconsistencies: { code: string; message: string }[];
  employee: { id: string; name: string; registration: string };
}

export function useInconsistencies(from: string, to: string) {
  return useQuery({
    queryKey: ["inconsistencies", from, to],
    queryFn: () => api<Inconsistency[]>(`/timesheet/inconsistencies?from=${from}&to=${to}`),
  });
}

/* --------------------------------------------------- Sincronização e auditoria */

export interface SyncRun {
  id: string;
  source: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export function useSyncRuns() {
  return useQuery({ queryKey: ["syncRuns"], queryFn: () => api<SyncRun[]>("/sync/runs") });
}

export function useRunSync() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<Record<string, unknown>>("/sync/employees", { method: "POST" }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["syncRuns"] });
      void client.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export interface ChainVerification {
  valid: boolean;
  checked: number;
  brokenAtNsr?: string;
  reason?: string;
}

export function useVerifyChain() {
  return useMutation({
    mutationFn: () => api<ChainVerification>("/punches/chain/verify"),
  });
}

/* ----------------------------------------------------------------- Utils */

function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function firstDayOfMonth(reference = new Date()): string {
  return `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-01`;
}

export function lastDayOfMonth(reference = new Date()): string {
  const last = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const KIND_LABEL: Record<string, string> = {
  CLOCK_IN: "Entrada",
  BREAK_OUT: "Saída p/ intervalo",
  BREAK_IN: "Retorno",
  CLOCK_OUT: "Saída",
  UNSPECIFIED: "Marcação",
};

export const ADJUSTMENT_TYPE_LABEL: Record<string, string> = {
  ADD: "Inclusão de marcação",
  REMOVE: "Exclusão de marcação",
  CHANGE_TIME: "Ajuste de horário",
  JUSTIFY_ABSENCE: "Abono de falta",
};

export const ADJUSTMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  CANCELLED: "Cancelado",
};

export const EMPLOYEE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  ON_LEAVE: "Afastado",
  TERMINATED: "Desligado",
};
