"use client";

import { useState } from "react";
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
  Td,
  TableShell,
  Th,
} from "@/components/ui";
import { KIND_LABEL, formatDate, formatTime, today, usePunches } from "@/lib/queries";

export default function PunchesPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = usePunches({ from, to, search: search || undefined, page, pageSize: 50 });

  function exportCsv() {
    const rows = query.data?.items ?? [];
    // Exportação do que está na tela. O AFD assinado (Portaria 671) é outra
    // coisa e ainda não existe — ver README.
    const header = [
      "NSR",
      "Colaborador",
      "Matricula",
      "Data",
      "Hora",
      "Tipo",
      "Origem",
      "Fora da cerca",
    ];
    const lines = rows.map((punch) => [
      punch.nsr,
      punch.employee.name,
      punch.employee.registration,
      formatDate(punch.localDate),
      formatTime(punch.punchedAt),
      KIND_LABEL[punch.kind] ?? punch.kind,
      punch.offline ? "App (offline)" : "App",
      punch.outsideGeofence ? "sim" : "nao",
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marcacoes-${from}-a-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Guard>
      <Shell
        title="Marcações"
        subtitle="Registros de ponto, na ordem em que chegaram"
        actions={
          <Button
            variant="outline"
            icon="download"
            onClick={exportCsv}
            disabled={!query.data?.items.length}
          >
            Exportar
          </Button>
        }
      >
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[150px]">
                <Field label="De">
                  <Input
                    type="date"
                    value={from}
                    onChange={(event) => {
                      setFrom(event.target.value);
                      setPage(1);
                    }}
                  />
                </Field>
              </div>
              <div className="w-[150px]">
                <Field label="Até">
                  <Input
                    type="date"
                    value={to}
                    onChange={(event) => {
                      setTo(event.target.value);
                      setPage(1);
                    }}
                  />
                </Field>
              </div>
              <div className="min-w-[220px] flex-1">
                <Field label="Buscar">
                  <SearchInput
                    value={search}
                    onChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder="Nome ou matrícula"
                  />
                </Field>
              </div>
            </div>
          </Card>

          {query.isError ? (
            <ErrorNote>{(query.error as Error).message}</ErrorNote>
          ) : null}

          {query.isLoading ? (
            <Card className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </Card>
          ) : query.data === undefined ? (
            // Sem dado não é o mesmo que zero registros. Dizer "nenhuma marcação"
            // quando a API não respondeu faria o analista concluir que ninguém
            // bateu ponto.
            <Card>
              <EmptyState
                icon="alert"
                title="Não foi possível carregar as marcações"
                detail="Pode haver registros no período. Tente de novo quando a API responder."
              />
            </Card>
          ) : query.data.items.length === 0 ? (
            <Card>
              <EmptyState
                icon="clock"
                title="Nenhuma marcação no período"
                detail="Ajuste as datas ou a busca para encontrar registros."
              />
            </Card>
          ) : (
            <>
              <TableShell>
                <thead>
                  <tr>
                    <Th>Colaborador</Th>
                    <Th>Matrícula</Th>
                    <Th>Data</Th>
                    <Th>Hora</Th>
                    <Th>Tipo</Th>
                    <Th>NSR</Th>
                    <Th>Origem</Th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.items.map((punch) => (
                    <tr key={punch.id} className="hover:bg-paper">
                      <Td className="font-600 text-ink">{punch.employee.name}</Td>
                      <Td className="tnum text-ink-2">{punch.employee.registration}</Td>
                      <Td className="tnum text-ink-2">{formatDate(punch.localDate)}</Td>
                      <Td className="tnum font-display text-[17px] font-700 text-ink">
                        {formatTime(punch.punchedAt)}
                      </Td>
                      <Td className="text-ink-2">{KIND_LABEL[punch.kind] ?? punch.kind}</Td>
                      <Td className="tnum text-muted">{punch.nsr}</Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {punch.offline ? <Badge tone="info">Offline</Badge> : null}
                          {punch.outsideGeofence ? (
                            <Badge tone="warn">Fora da cerca</Badge>
                          ) : null}
                          {!punch.offline && !punch.outsideGeofence ? (
                            <span className="text-[13px] text-muted">App</span>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>

              <div className="flex items-center justify-between text-[13px] text-muted">
                <span className="tnum">
                  {query.data?.total} registros · página {query.data?.page} de{" "}
                  {query.data?.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    <Icon name="chevron-left" className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= (query.data?.totalPages ?? 1)}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Próxima
                    <Icon name="chevron-right" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Shell>
    </Guard>
  );
}
