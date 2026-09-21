"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  SearchInput,
  Skeleton,
  Stat,
  Td,
  TableShell,
  Th,
} from "@/components/ui";
import {
  firstDayOfMonth,
  formatDate,
  lastDayOfMonth,
  useEmployees,
  useTimesheet,
  type TimesheetDay,
} from "@/lib/queries";

export default function TimesheetPage() {
  return (
    <Guard>
      <Suspense fallback={<div className="min-h-screen bg-paper" />}>
        <TimesheetContent />
      </Suspense>
    </Guard>
  );
}

function TimesheetContent() {
  const params = useSearchParams();
  const [employeeId, setEmployeeId] = useState<string | null>(
    params.get("colaborador"),
  );
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(lastDayOfMonth());

  const employees = useEmployees({ search: search || undefined, status: "ACTIVE", pageSize: 12 });
  const timesheet = useTimesheet(employeeId, from, to);

  return (
    <Shell
      title="Espelho de ponto"
      subtitle="Apuração do período, dia a dia"
      actions={
        timesheet.data ? (
          <Button variant="outline" icon="download" onClick={() => window.print()}>
            Imprimir
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Seletor de colaborador */}
        <Card padded={false} className="h-fit">
          <div className="border-b border-line p-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar colaborador"
            />
          </div>

          {employees.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : (
            <ul className="max-h-[540px] divide-y divide-line-2 overflow-y-auto">
              {employees.data?.items.map((employee) => (
                <li key={employee.id}>
                  <button
                    onClick={() => setEmployeeId(employee.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      employeeId === employee.id ? "bg-turin-soft" : "hover:bg-paper"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-600 text-ink">
                        {employee.name}
                      </p>
                      <p className="tnum truncate text-[12px] text-muted">
                        {employee.registration} · {employee.position ?? "—"}
                      </p>
                    </div>
                    {employeeId === employee.id ? (
                      <Icon name="check" className="h-4 w-4 shrink-0 text-turin" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Espelho */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[150px]">
                <Field label="De">
                  <Input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </Field>
              </div>
              <div className="w-[150px]">
                <Field label="Até">
                  <Input
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {!employeeId ? (
            <Card>
              <EmptyState
                icon="mirror"
                title="Escolha um colaborador"
                detail="Selecione alguém na lista ao lado para ver a apuração do período."
              />
            </Card>
          ) : timesheet.isError ? (
            <ErrorNote>{(timesheet.error as Error).message}</ErrorNote>
          ) : timesheet.isLoading ? (
            <Card className="space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="h-9" />
              ))}
            </Card>
          ) : timesheet.data ? (
            <>
              <Card>
                <div className="mb-4">
                  <p className="eyebrow">Colaborador</p>
                  <p className="font-display text-[24px] font-700 text-ink">
                    {timesheet.data.employee.name}
                  </p>
                  <p className="tnum text-[13px] text-muted">
                    Matrícula {timesheet.data.employee.registration}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-5 border-t border-line-2 pt-4 sm:grid-cols-4">
                  <Stat value={timesheet.data.totals.worked} label="Trabalhado" />
                  <Stat value={timesheet.data.totals.expected} label="Previsto" />
                  <Stat
                    value={timesheet.data.totals.balance}
                    label="Saldo"
                    tone={
                      timesheet.data.totals.balanceMinutes > 0
                        ? "ok"
                        : timesheet.data.totals.balanceMinutes < 0
                          ? "bad"
                          : "neutral"
                    }
                  />
                  <Stat
                    value={String(timesheet.data.totals.inconsistentDays)}
                    label="Pendências"
                    tone={timesheet.data.totals.inconsistentDays > 0 ? "warn" : "neutral"}
                  />
                </div>
              </Card>

              <TableShell>
                <thead>
                  <tr>
                    <Th>Dia</Th>
                    <Th>Marcações</Th>
                    <Th align="right">Trabalhado</Th>
                    <Th align="right">Previsto</Th>
                    <Th align="right">Saldo</Th>
                    <Th>Situação</Th>
                  </tr>
                </thead>
                <tbody>
                  {timesheet.data.days.map((day) => (
                    <DayRow key={day.date} day={day} />
                  ))}
                </tbody>
              </TableShell>
            </>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function DayRow({ day }: { day: TimesheetDay }) {
  const isOff = day.isRestDay || day.isHoliday;

  return (
    <tr className={`hover:bg-paper ${isOff ? "bg-paper/60" : ""}`}>
      <Td>
        <span className="tnum font-display text-[17px] font-700 text-ink">
          {day.date.slice(8, 10)}
        </span>
        <span className="ml-1.5 text-[12px] text-muted">{WEEKDAYS[day.weekday]}</span>
      </Td>

      <Td>
        {day.punches.length > 0 ? (
          <span className="tnum text-[14px] text-ink-2">
            {day.punches.map((punch) => punch.time).join(" · ")}
          </span>
        ) : (
          <span className="text-[14px] text-muted">
            {day.isHoliday ? "Feriado" : day.isRestDay ? "Folga" : "Sem marcação"}
          </span>
        )}
      </Td>

      <Td align="right" className="tnum text-ink">
        {day.workedMinutes > 0 ? day.worked : "—"}
      </Td>
      <Td align="right" className="tnum text-muted">
        {day.expectedMinutes > 0 ? day.expected : "—"}
      </Td>
      <Td
        align="right"
        className={`tnum font-600 ${
          day.balanceMinutes > 0
            ? "text-turin-ink"
            : day.balanceMinutes < 0
              ? "text-bad"
              : "text-muted"
        }`}
      >
        {day.balanceMinutes === 0 ? "—" : day.balance}
      </Td>

      <Td>
        {day.hasInconsistency ? (
          <span title={day.inconsistencies.map((item) => item.message).join(" · ")}>
            <Badge tone="warn">{shortLabel(day.inconsistencies[0]?.code)}</Badge>
          </span>
        ) : day.isHoliday ? (
          <Badge>Feriado</Badge>
        ) : day.isRestDay ? (
          <Badge>Folga</Badge>
        ) : day.overtimeMinutes > 0 ? (
          <Badge tone="ok">Hora extra</Badge>
        ) : null}
      </Td>
    </tr>
  );
}

/// Rótulo curto do código de inconsistência. O texto completo fica no title,
/// porque a coluna não comporta "Número ímpar de marcações (3). A última foi…".
function shortLabel(code?: string): string {
  return (
    {
      ODD_PUNCH_COUNT: "Marcação ímpar",
      NO_PUNCHES_ON_WORKDAY: "Sem marcação",
      PUNCH_ON_REST_DAY: "Marcou na folga",
      BREAK_BELOW_MINIMUM: "Intervalo curto",
      WORKED_ON_HOLIDAY: "Trabalhou no feriado",
      EXCESSIVE_WORKDAY: "Jornada > 16h",
    }[code ?? ""] ?? "Pendência"
  );
}
