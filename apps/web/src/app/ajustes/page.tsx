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
  Input,
  Skeleton,
} from "@/components/ui";
import {
  ADJUSTMENT_STATUS_LABEL,
  ADJUSTMENT_TYPE_LABEL,
  KIND_LABEL,
  formatDate,
  formatDateTime,
  formatTime,
  useAdjustments,
  useReviewAdjustment,
  type Adjustment,
} from "@/lib/queries";

const TABS = [
  { key: "PENDING", label: "Em análise" },
  { key: "APPROVED", label: "Aprovados" },
  { key: "REJECTED", label: "Recusados" },
  { key: "", label: "Todos" },
] as const;

export default function AdjustmentsPage() {
  const [status, setStatus] = useState<string>("PENDING");
  const query = useAdjustments({ status: status || undefined });

  return (
    <Guard>
      <Shell
        title="Ajustes"
        subtitle="Pedidos de correção abertos pelos colaboradores"
      >
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-line">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-600 transition-colors ${
                  status === tab.key
                    ? "border-turin text-ink"
                    : "border-transparent text-muted hover:text-ink-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {query.isError ? <ErrorNote>{(query.error as Error).message}</ErrorNote> : null}

          {query.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : query.data === undefined ? (
            <Card>
              <EmptyState
                icon="alert"
                title="Não foi possível carregar"
                detail="Tente de novo quando a API responder."
              />
            </Card>
          ) : query.data.length === 0 ? (
            <Card>
              <EmptyState
                icon="check"
                title="Nada aqui"
                detail={
                  status === "PENDING"
                    ? "Nenhum pedido aguardando análise."
                    : "Nenhum pedido com este status."
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {query.data?.map((item) => (
                <AdjustmentCard key={item.id} adjustment={item} />
              ))}
            </div>
          )}
        </div>
      </Shell>
    </Guard>
  );
}

function AdjustmentCard({ adjustment }: { adjustment: Adjustment }) {
  const review = useReviewAdjustment();
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  const pending = adjustment.status === "PENDING";
  const tone =
    adjustment.status === "APPROVED"
      ? "ok"
      : adjustment.status === "PENDING"
        ? "warn"
        : adjustment.status === "REJECTED"
          ? "bad"
          : "neutral";

  function decide(status: "APPROVED" | "REJECTED") {
    review.mutate({ id: adjustment.id, status, reviewNote: note.trim() || undefined });
  }

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-start gap-4 p-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-line-2">
          <Icon name="swap" className="h-5 w-5 text-ink-2" />
        </div>

        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-600 text-ink">{adjustment.employee.name}</h3>
            <Badge tone={tone}>{ADJUSTMENT_STATUS_LABEL[adjustment.status]}</Badge>
          </div>

          <p className="tnum mt-0.5 text-[13px] text-muted">
            {`Matrícula ${adjustment.employee.registration} · ${ADJUSTMENT_TYPE_LABEL[adjustment.type]} · ${formatDate(adjustment.localDate)}`}
          </p>

          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{adjustment.reason}</p>

          {/* O que a aprovação vai fazer, em texto. Quem decide precisa saber
              que aprovar cria uma marcação nova, não altera a antiga. */}
          {pending ? (
            <div className="mt-3 rounded-lg bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink-2">
              <strong className="font-600">Ao aprovar:</strong>{" "}
              {describeEffect(adjustment)}
            </div>
          ) : null}

          {adjustment.reviewNote ? (
            <div className="mt-3 rounded-lg bg-paper px-4 py-3">
              <p className="eyebrow mb-1">Resposta ao colaborador</p>
              <p className="text-[13px] text-ink-2">{adjustment.reviewNote}</p>
            </div>
          ) : null}

          {adjustment.reviewedAt ? (
            <p className="mt-2 text-[12px] text-muted">
              {`Analisado por ${adjustment.reviewedBy?.name ?? "—"} em ${formatDateTime(adjustment.reviewedAt)}`}
            </p>
          ) : null}
        </div>

        {pending ? (
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            {expanded ? (
              <>
                <Input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Observação (opcional)"
                  className="w-[240px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide("APPROVED")}
                    loading={review.isPending}
                    icon="check"
                    className="flex-1"
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => decide("REJECTED")}
                    loading={review.isPending}
                    icon="x"
                    className="flex-1"
                  >
                    Recusar
                  </Button>
                </div>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
                Analisar
              </Button>
            )}

            {review.isError ? (
              <p className="max-w-[240px] text-[12px] text-bad">
                {(review.error as Error).message}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/// Explica o efeito da aprovação em português, porque a mecânica não é óbvia:
/// nada é alterado, uma marcação nova entra no fim da cadeia.
function describeEffect(adjustment: Adjustment): string {
  const time = adjustment.proposedAt ? formatTime(adjustment.proposedAt) : null;
  const kind = adjustment.proposedKind ? KIND_LABEL[adjustment.proposedKind] : "marcação";

  switch (adjustment.type) {
    case "ADD":
      return `uma nova marcação de ${kind.toLowerCase()} às ${time} é criada no fim da cadeia. Nada existente é alterado.`;
    case "CHANGE_TIME":
      return `uma nova marcação às ${time} é criada, e a original passa a ser desconsiderada na apuração — mas continua registrada para auditoria.`;
    case "REMOVE":
      return "a marcação apontada deixa de contar na apuração. Ela permanece na base, marcada como desconsiderada.";
    case "JUSTIFY_ABSENCE":
      return "o dia deixa de gerar falta: a carga prevista é zerada na apuração.";
    default:
      return "a apuração do dia é recalculada.";
  }
}
