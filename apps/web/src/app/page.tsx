"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { DayRuler } from "@/components/DayRuler";
import { Icon } from "@/components/Icon";
import { Badge, Card, EmptyState, ErrorNote, Skeleton, Stat } from "@/components/ui";
import {
  formatDate,
  today,
  useAdjustments,
  useEmployees,
  useInconsistencies,
  usePunches,
} from "@/lib/queries";

export default function TodayPage() {
  const day = today();

  const punches = usePunches({ from: day, to: day, pageSize: 200 });
  const pending = useAdjustments({ status: "PENDING" });
  const issues = useInconsistencies(day, day);
  const active = useEmployees({ status: "ACTIVE", pageSize: 1 });
  const notActivated = useEmployees({ status: "ACTIVE", pendingActivation: true, pageSize: 1 });

  const rulerPunches = useMemo(
    () => (punches.data?.items ?? []).map((p) => ({ id: p.id, punchedAt: p.punchedAt })),
    [punches.data],
  );

  // Quem já apareceu hoje: o que o encarregado quer saber às 6h.
  const presentCount = useMemo(
    () => new Set((punches.data?.items ?? []).map((p) => p.employee.id)).size,
    [punches.data],
  );

  /*
   * O contador acima conta pessoas distintas dentro de UMA página de 200
   * marcações. Com ~206 ativos batendo quatro vezes por dia, a página enche
   * por volta da quinquagésima pessoa: a partir daí o número para de crescer
   * e passa a mentir para baixo — todo dia, depois das 8h.
   *
   * Enquanto não existe endpoint de agregação (`GET /punches/summary`), a
   * saída honesta não é esconder: é dizer que o número é um piso. Um "≥ 50"
   * é informação; um "50" que na verdade são 140 é um erro de operação.
   */
  const punchTotal = punches.data?.total ?? 0;
  const punchesTruncadas = punchTotal > (punches.data?.items.length ?? 0);

  const activeTotal = active.data?.total ?? 0;

  // Se a API não respondeu, os contadores NÃO podem mostrar zero: num painel de
  // operação, "0 pendências" por falha de rede faz o analista fechar o dia
  // achando que estava tudo certo.
  //
  // A checagem é por AUSÊNCIA DE DADO, não por `isError`: a consulta pode ficar
  // pendente ou pausada sem nunca virar erro, e o efeito na tela seria o mesmo
  // zero enganoso.
  const queries = [punches, pending, issues, active];
  const failure = queries.find((query) => query.isError);
  const unavailable = queries.some((query) => !query.isLoading && query.data === undefined);
  const dash = (value: string) => (unavailable ? "—" : value);

  return (
    <Guard>
      <Shell
        title="Hoje"
        subtitle={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
        actions={
          <Link
            href="/marcacoes"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold text-ink-2 hover:bg-line-2"
          >
            <Icon name="clock" className="h-4 w-4" />
            Ver marcações
          </Link>
        }
      >
        <div className="space-y-5">
          {unavailable ? (
            <ErrorNote>
              {failure
                ? `Não foi possível carregar os dados de hoje: ${(failure.error as Error).message} Os números abaixo estão indisponíveis — não são zero.`
                : "Os dados de hoje ainda não chegaram. Os números abaixo estão indisponíveis — não são zero."}
            </ErrorNote>
          ) : null}

          {/* Assinatura do painel */}
          <Card>
            <DayRuler punches={rulerPunches} loading={punches.isLoading} />

            <div className="mt-6 grid grid-cols-2 gap-6 border-t border-line-2 pt-5 sm:grid-cols-4">
              <Stat
                value={punches.isLoading ? "—" : dash(String(punches.data?.total ?? 0))}
                label="Marcações hoje"
              />
              <Stat
                value={
                  punches.isLoading || active.isLoading
                    ? "—"
                    : dash(
                        `${punchesTruncadas ? "≥" : ""}${presentCount}/${activeTotal}`,
                      )
                }
                label="Bateram ponto"
                tone={unavailable ? "neutral" : "ok"}
                hint={
                  punchesTruncadas
                    ? "no mínimo — contagem parcial"
                    : "pessoas distintas"
                }
              />
              <Stat
                value={issues.isLoading ? "—" : dash(String(issues.data?.length ?? 0))}
                label="Pendências"
                tone={!unavailable && (issues.data?.length ?? 0) > 0 ? "warn" : "neutral"}
              />
              <Stat
                value={pending.isLoading ? "—" : dash(String(pending.data?.length ?? 0))}
                label="Ajustes a analisar"
                tone={!unavailable && (pending.data?.length ?? 0) > 0 ? "info" : "neutral"}
              />
            </div>

            {punchesTruncadas ? (
              <p className="mt-4 rounded-lg bg-warn-soft px-4 py-2.5 text-[12px] leading-relaxed text-warn">
                O dia já passou de {punchTotal} marcações e a tela lê as 200 mais
                recentes, então “bateram ponto” é um piso, não o total. Para o
                número fechado, abra{" "}
                <Link href={`/marcacoes?de=${day}&ate=${day}`} className="underline">
                  Marcações
                </Link>
                .
              </p>
            ) : null}
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Fila de ajustes */}
            <Card padded={false}>
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 className="font-display text-[19px] font-bold text-ink">
                    Ajustes aguardando
                  </h2>
                  <p className="text-[13px] text-muted">Pedidos abertos pelo app</p>
                </div>
                <Link
                  href="/ajustes"
                  className="text-[13px] font-semibold text-turin hover:text-turin-ink"
                >
                  Ver todos
                </Link>
              </header>

              {pending.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : pending.data === undefined ? (
                <EmptyState
                  icon="alert"
                  title="Não foi possível carregar"
                  detail="A fila pode ter pedidos. Recarregue quando a API voltar."
                />
              ) : (pending.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon="check"
                  title="Nada na fila"
                  detail="Todos os pedidos foram analisados."
                />
              ) : (
                <ul className="divide-y divide-line-2">
                  {pending.data?.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <Link
                        href="/ajustes"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-paper"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warn-soft">
                          <Icon name="swap" className="h-4 w-4 text-warn" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-ink">
                            {item.employee.name}
                          </p>
                          <p className="tnum truncate text-[12px] text-muted">
                            {`Matrícula ${item.employee.registration} · ${formatDate(item.localDate)}`}
                          </p>
                        </div>
                        <Badge tone="warn">Em análise</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Pendências de apuração */}
            <Card padded={false}>
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 className="font-display text-[19px] font-bold text-ink">
                    Jornadas com pendência
                  </h2>
                  <p className="text-[13px] text-muted">Apuradas hoje</p>
                </div>
                <Link
                  href={`/espelho?de=${day}&ate=${day}`}
                  className="text-[13px] font-semibold text-turin hover:text-turin-ink"
                >
                  Espelho
                </Link>
              </header>

              {issues.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : issues.data === undefined ? (
                <EmptyState
                  icon="alert"
                  title="Não foi possível carregar"
                  detail="Pode haver jornadas pendentes. Recarregue quando a API voltar."
                />
              ) : (issues.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon="check"
                  title="Nenhuma pendência hoje"
                  detail="As jornadas apuradas hoje fecharam sem inconsistência."
                />
              ) : (
                <ul className="divide-y divide-line-2">
                  {issues.data?.slice(0, 6).map((item) => (
                    // Cada pendência leva ao espelho DAQUELE colaborador
                    // NAQUELE dia. Era a tarefa mais frequente do painel e a
                    // única sem caminho: o link ia para o espelho vazio.
                    <li key={item.id}>
                      <Link
                        href={`/espelho?colaborador=${item.employee.id}&de=${item.date}&ate=${item.date}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-paper"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bad-soft">
                          <Icon name="alert" className="h-4 w-4 text-bad" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-ink">
                            {item.employee.name}
                          </p>
                          <p className="truncate text-[12px] text-muted">
                            {item.inconsistencies[0]?.message ?? "Pendência na jornada"}
                          </p>
                        </div>
                        <span className="tnum text-[13px] text-muted">
                          {item.punchCount} marc.
                        </span>
                        <Icon
                          name="chevron-right"
                          className="h-4 w-4 shrink-0 text-muted"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Adoção do app */}
          {(notActivated.data?.total ?? 0) > 0 ? (
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-info-soft">
                  <Icon name="key" className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {notActivated.data?.total} colaboradores ainda sem acesso ao app
                  </p>
                  <p className="text-[13px] text-muted">
                    Gere a senha inicial para cada um liberar o primeiro acesso.
                  </p>
                </div>
              </div>
              <Link
                href="/colaboradores?pendentes=1"
                className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold text-ink-2 hover:bg-line-2"
              >
                Ver lista
              </Link>
            </Card>
          ) : null}
        </div>
      </Shell>
    </Guard>
  );
}
