"use client";

import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Skeleton,
  Stat,
  Td,
  TableShell,
  Th,
} from "@/components/ui";
import { formatDateTime, useRunSync, useSyncRuns } from "@/lib/queries";

export default function SyncPage() {
  const runs = useSyncRuns();
  const run = useRunSync();

  const last = runs.data?.[0];

  return (
    <Guard>
      <Shell
        title="Sincronização"
        subtitle="Cadastro de colaboradores vindo do Alterdata Pack"
        actions={
          <Button icon="sync" onClick={() => run.mutate()} loading={run.isPending}>
            Sincronizar agora
          </Button>
        }
      >
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start gap-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-turin-soft">
                <Icon name="sync" className="h-5 w-5 text-turin-ink" />
              </div>
              <div className="min-w-[260px] flex-1">
                <h2 className="text-[15px] font-600 text-ink">
                  Leitura pelo proxy Analista-DP
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  O ERP continua dono do cadastro; este sistema é dono do ponto. A
                  sincronização só lê — nada é escrito de volta no Alterdata. Campos que
                  pertencem ao ponto (senha do app, aparelhos, jornada) nunca são tocados.
                </p>
                <p className="mt-2 text-[13px] text-muted">
                  Rota: <code className="tnum">GET /empresas/00001/funcionarios</code>
                </p>
              </div>
            </div>
          </Card>

          {run.isError ? <ErrorNote>{(run.error as Error).message}</ErrorNote> : null}

          {last ? (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Última execução</p>
                  <p className="text-[14px] text-ink-2">
                    {formatDateTime(last.startedAt)} · origem {last.source}
                  </p>
                </div>
                <Badge tone={statusTone(last.status)}>{statusLabel(last.status)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-5 border-t border-line-2 pt-4 sm:grid-cols-4">
                <Stat value={String(last.created)} label="Criados" tone="ok" />
                <Stat value={String(last.updated)} label="Atualizados" tone="info" />
                <Stat value={String(last.skipped)} label="Sem mudança" />
                <Stat
                  value={String(last.failed)}
                  label="Falhas"
                  tone={last.failed > 0 ? "bad" : "neutral"}
                />
              </div>

              {last.errorMessage ? (
                <p className="mt-4 rounded-lg bg-bad-soft px-4 py-3 text-[13px] text-bad">
                  {last.errorMessage}
                </p>
              ) : null}
            </Card>
          ) : null}

          <div>
            <h2 className="mb-3 font-display text-[20px] font-700 text-ink">Histórico</h2>

            {runs.isLoading ? (
              <Card className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10" />
                ))}
              </Card>
            ) : (runs.data?.length ?? 0) === 0 ? (
              <Card>
                <EmptyState
                  icon="sync"
                  title="Nenhuma sincronização ainda"
                  detail="Rode a primeira para trazer o cadastro do Alterdata."
                />
              </Card>
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <Th>Início</Th>
                    <Th>Origem</Th>
                    <Th>Situação</Th>
                    <Th align="right">Criados</Th>
                    <Th align="right">Atualizados</Th>
                    <Th align="right">Sem mudança</Th>
                    <Th align="right">Falhas</Th>
                  </tr>
                </thead>
                <tbody>
                  {runs.data?.map((item) => (
                    <tr key={item.id} className="hover:bg-paper">
                      <Td className="tnum text-ink-2">{formatDateTime(item.startedAt)}</Td>
                      <Td className="text-ink-2">{item.source}</Td>
                      <Td>
                        <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                      </Td>
                      <Td align="right" className="tnum">
                        {item.created}
                      </Td>
                      <Td align="right" className="tnum">
                        {item.updated}
                      </Td>
                      <Td align="right" className="tnum text-muted">
                        {item.skipped}
                      </Td>
                      <Td
                        align="right"
                        className={`tnum ${item.failed > 0 ? "text-bad" : "text-muted"}`}
                      >
                        {item.failed}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </div>
        </div>
      </Shell>
    </Guard>
  );
}

function statusLabel(status: string): string {
  return { RUNNING: "Em andamento", SUCCESS: "Concluída", FAILED: "Falhou" }[status] ?? status;
}

function statusTone(status: string): "ok" | "warn" | "bad" | "neutral" {
  if (status === "SUCCESS") return "ok";
  if (status === "RUNNING") return "warn";
  if (status === "FAILED") return "bad";
  return "neutral";
}
