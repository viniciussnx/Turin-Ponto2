"use client";

import { useState } from "react";
import { useDebounced } from "@/lib/useDebounced";
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
  Tbody,
  Td,
  TableShell,
  Th,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  KIND_LABEL,
  formatDate,
  formatTime,
  today,
  usePunches,
  type Paged,
  type PunchSort,
  type Punch,
} from "@/lib/queries";

export default function PunchesPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");
  // Uma consulta por palavra digitada, nao por tecla.
  const buscaAtrasada = useDebounced(search);
  const [page, setPage] = useState(1);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);

  const [sort, setSort] = useState<PunchSort | undefined>();
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const intervaloInvalido = Boolean(from && to && from > to);

  const query = usePunches({
    from,
    to,
    search: buscaAtrasada || undefined,
    page,
    pageSize: 50,
    sort,
    dir,
  });

  /// Primeiro clique numa coluna ordena decrescente (o mais recente/maior
  /// primeiro, que é o que se quer ver numa lista de ponto); o segundo
  /// inverte. Trocar de coluna volta para a primeira página, senão a pessoa
  /// cai na página 7 de uma ordenação que acabou de mudar.
  const ordenacao = {
    sortedBy: sort,
    sortDir: dir,
    onSort: (chave: string) => {
      setPage(1);
      if (chave === sort) {
        setDir((atual) => (atual === "desc" ? "asc" : "desc"));
      } else {
        setSort(chave as PunchSort);
        setDir("desc");
      }
    },
  };

  /*
   * Exporta o PERÍODO INTEIRO, não a página visível.
   *
   * Antes, o arquivo saía com no máximo 50 linhas — as da página atual — mas
   * com o nome `marcacoes-<de>-a-<ate>.csv`, prometendo o intervalo todo. Num
   * processo trabalhista esse arquivo seria apresentado como "as marcações do
   * período", e faltariam as outras páginas sem ninguém notar.
   *
   * A API já pagina; aqui percorremos até o fim antes de montar o arquivo.
   *
   * O AFD assinado da Portaria 671 continua sendo outra coisa, e ainda não
   * existe — ver README.
   */
  async function exportCsv() {
    setExportando(true);
    try {
      const rows: Punch[] = [];
      let pagina = 1;
      let totalPaginas = 1;

      do {
        const lote = await api<Paged<Punch>>(
          // A ordenação vai junto: o arquivo tem de sair na mesma ordem que
          // está na tela, senão quem exporta não reconhece o que recebeu.
          `/punches?${new URLSearchParams({
            from,
            to,
            ...(buscaAtrasada ? { search: buscaAtrasada } : {}),
            ...(sort ? { sort, dir } : {}),
            page: String(pagina),
            pageSize: "200",
          })}`,
        );
        rows.push(...lote.items);
        totalPaginas = lote.totalPages;
        pagina += 1;
      } while (pagina <= totalPaginas);

      montarArquivo(rows);
    } catch (falha) {
      setErroExport((falha as Error).message);
    } finally {
      setExportando(false);
    }
  }

  function montarArquivo(rows: Punch[]) {
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
        subtitle="Registros de ponto do período"
        actions={
          <Button
            variant="outline"
            icon="download"
            onClick={() => void exportCsv()}
            loading={exportando}
            disabled={!query.data?.total}
          >
            {query.data?.total
              ? `Exportar ${query.data.total} marcaç${query.data.total === 1 ? "ão" : "ões"}`
              : "Exportar"}
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

          {/* `De` depois de `Até` devolve lista vazia da API, e a tela dizia
              "Nenhuma marcação no período" — uma resposta correta para uma
              pergunta impossível. Agora o intervalo inválido é nomeado. */}
          {intervaloInvalido ? (
            <ErrorNote>
              A data inicial é posterior à final. Inverta as duas para ver os
              registros do período.
            </ErrorNote>
          ) : null}

          {erroExport ? <ErrorNote>{erroExport}</ErrorNote> : null}

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
                    <Th sortKey="employee" {...ordenacao}>
                      Colaborador
                    </Th>
                    <Th>Matrícula</Th>
                    <Th>Data</Th>
                    <Th sortKey="punchedAt" {...ordenacao}>
                      Hora
                    </Th>
                    <Th sortKey="kind" {...ordenacao}>
                      Tipo
                    </Th>
                    <Th sortKey="nsr" {...ordenacao}>
                      NSR
                    </Th>
                    <Th>Origem</Th>
                  </tr>
                </thead>
                <Tbody>
                  {query.data?.items.map((punch) => (
                    <tr key={punch.id} className="hover:bg-paper">
                      <Td className="font-semibold text-ink">{punch.employee.name}</Td>
                      <Td className="tnum text-ink-2">{punch.employee.registration}</Td>
                      <Td className="tnum text-ink-2">{formatDate(punch.localDate)}</Td>
                      <Td className="tnum font-display text-[17px] font-bold text-ink">
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
                </Tbody>
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
