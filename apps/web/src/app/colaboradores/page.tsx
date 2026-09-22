"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  SearchInput,
  Select,
  Skeleton,
  Td,
  TableShell,
  Th,
} from "@/components/ui";
import {
  EMPLOYEE_STATUS_LABEL,
  formatDate,
  useEmployees,
  useResetAppAccess,
  type Employee,
} from "@/lib/queries";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  // Uma consulta por palavra digitada, nao por tecla.
  const buscaAtrasada = useDebounced(search);
  const [status, setStatus] = useState("ACTIVE");
  const [onlyPending, setOnlyPending] = useState(false);
  const [page, setPage] = useState(1);

  const query = useEmployees({
    search: buscaAtrasada || undefined,
    status: status || undefined,
    pendingActivation: onlyPending || undefined,
    page,
    pageSize: 25,
  });

  return (
    <Guard>
      <Shell
        title="Colaboradores"
        subtitle="Cadastro sincronizado do Alterdata — somente leitura na origem"
        actions={
          <Link
            href="/sincronizacao"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold text-ink-2 hover:bg-line-2"
          >
            <Icon name="sync" className="h-4 w-4" />
            Sincronizar
          </Link>
        }
      >
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <Field label="Buscar">
                  <SearchInput
                    value={search}
                    onChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder="Nome, matrícula ou CPF"
                  />
                </Field>
              </div>
              <div className="w-[170px]">
                <Field label="Situação">
                  <Select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="ACTIVE">Ativos</option>
                    <option value="ON_LEAVE">Afastados</option>
                    <option value="TERMINATED">Desligados</option>
                  </Select>
                </Field>
              </div>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[14px] text-ink-2">
                <input
                  type="checkbox"
                  checked={onlyPending}
                  onChange={(event) => {
                    setOnlyPending(event.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-[var(--turin)]"
                />
                Sem acesso ao app
              </label>
            </div>
          </Card>

          {query.isError ? <ErrorNote>{(query.error as Error).message}</ErrorNote> : null}

          {query.isLoading ? (
            <Card className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-11" />
              ))}
            </Card>
          ) : query.data === undefined ? (
            <Card>
              <EmptyState
                icon="alert"
                title="Não foi possível carregar o cadastro"
                detail="Tente de novo quando a API responder."
              />
            </Card>
          ) : query.data.items.length === 0 ? (
            <Card>
              <EmptyState
                icon="users"
                title="Nenhum colaborador encontrado"
                detail="Ajuste a busca, ou sincronize com o Alterdata para trazer o cadastro."
              />
            </Card>
          ) : (
            <>
              <TableShell>
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>Matrícula</Th>
                    <Th>Cargo</Th>
                    <Th>Departamento</Th>
                    <Th>Jornada</Th>
                    <Th>Situação</Th>
                    <Th>App</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.items.map((employee) => (
                    <EmployeeRow key={employee.id} employee={employee} />
                  ))}
                </tbody>
              </TableShell>

              <div className="flex items-center justify-between text-[13px] text-muted">
                <span className="tnum">
                  {query.data?.total} colaboradores · página {query.data?.page} de{" "}
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

function EmployeeRow({ employee }: { employee: Employee }) {
  const reset = useResetAppAccess();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <tr className="hover:bg-paper">
        <Td>
          <Link
            href={`/espelho?colaborador=${employee.id}`}
            className="font-semibold text-ink hover:text-turin-ink"
          >
            {employee.name}
          </Link>
          {employee.admittedAt ? (
            <p className="tnum text-[12px] text-muted">
              Desde {formatDate(employee.admittedAt)}
            </p>
          ) : null}
        </Td>
        <Td className="tnum text-ink-2">{employee.registration}</Td>
        <Td className="text-ink-2">{employee.position ?? "—"}</Td>
        <Td className="text-ink-2">{employee.department?.name ?? "—"}</Td>
        <Td className="text-ink-2">{employee.workSchedule?.name ?? "Sem jornada"}</Td>
        <Td>
          <Badge
            tone={
              employee.status === "ACTIVE"
                ? "ok"
                : employee.status === "ON_LEAVE"
                  ? "warn"
                  : "neutral"
            }
          >
            {EMPLOYEE_STATUS_LABEL[employee.status]}
          </Badge>
        </Td>
        <Td>
          {employee.appActivated ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-turin-ink">
              <Icon name="check" className="h-4 w-4" />
              {employee._count.devices > 0
                ? `${employee._count.devices} aparelho${employee._count.devices > 1 ? "s" : ""}`
                : "Ativado"}
            </span>
          ) : (
            <span className="text-[13px] text-muted">Sem acesso</span>
          )}
        </Td>
        <Td align="right">
          <Button
            size="sm"
            variant="outline"
            loading={reset.isPending}
            onClick={() => {
              // Liberar acesso a quem ainda não tem é inócuo e vai direto.
              // Gerar nova senha para quem já usa o app derruba a sessão do
              // aparelho — isso passa pela confirmação.
              if (employee.appActivated) setConfirmar(true);
              else reset.mutate(employee.id);
            }}
          >
            {employee.appActivated ? "Nova senha" : "Liberar acesso"}
          </Button>

          {/* `position: fixed` escapa do layout da tabela, então o diálogo
              pode morar na própria célula da ação que o dispara. */}
          <ConfirmDialog
            aberto={confirmar}
            titulo={`Gerar nova senha para ${employee.name}?`}
            consequencia={
              employee._count.devices > 0
                ? `Os ${employee._count.devices} aparelho${employee._count.devices > 1 ? "s" : ""} de ${employee.name} serão desconectados na hora. Se estiver em rota, ${employee.name} não consegue bater o ponto até receber a senha nova e entrar de novo.`
                : `${employee.name} será desconectado do app e precisará entrar de novo com a senha nova.`
            }
            confirmar="Gerar nova senha"
            carregando={reset.isPending}
            onCancelar={() => setConfirmar(false)}
            onConfirmar={() => {
              setConfirmar(false);
              reset.mutate(employee.id);
            }}
          />
        </Td>
      </tr>

      {/* A senha aparece uma única vez. Fica numa linha própria, larga, para
          quem estiver ao telefone com o motorista conseguir ditar. */}
      {reset.isSuccess && reset.data ? (
        <tr>
          <td colSpan={8} className="border-b border-line-2 bg-turin-soft px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Senha inicial de {employee.name}</p>
                <p className="tnum font-display text-[32px] font-bold tracking-[0.12em] text-turin-ink">
                  {reset.data.initialPassword}
                </p>
                <p className="mt-1 text-[13px] text-ink-2">
                  Anote agora: ela não será exibida de novo. O colaborador troca no primeiro
                  acesso, e os aparelhos anteriores foram desconectados.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard?.writeText(reset.data?.initialPassword ?? "")
                }
              >
                Copiar
              </Button>
            </div>
          </td>
        </tr>
      ) : null}

      {reset.isError ? (
        <tr>
          <td colSpan={8} className="border-b border-line-2 px-4 py-2">
            <p role="alert" className="text-[13px] text-bad">
              {(reset.error as Error).message}
            </p>
          </td>
        </tr>
      ) : null}

    </>
  );
}
