"use client";

import { useEffect, useRef } from "react";
import { Button } from "./ui";

/*
 * Diálogo de confirmação para ação irreversível.
 *
 * O painel tinha ações destrutivas a um clique — "Nova senha" desconecta o
 * celular de um motorista que pode estar em rota, sem undo e sem aviso. O HIG
 * (`alerts.md`) é direto: confirmar antes do irreversível, dizer a
 * consequência em vez de perguntar "tem certeza?", e o botão de confirmar
 * carrega o verbo da ação, não "OK".
 *
 * Mecânica de diálogo que precisa existir para ser um diálogo de verdade:
 * foco vai para dentro ao abrir, Esc fecha, Tab circula preso aqui dentro, e
 * o foco volta para quem abriu ao fechar.
 */
export function ConfirmDialog({
  aberto,
  titulo,
  consequencia,
  confirmar,
  onConfirmar,
  onCancelar,
  destrutivo = true,
  carregando,
}: {
  aberto: boolean;
  titulo: string;
  /// O que vai acontecer, em uma frase. Não é "tem certeza?".
  consequencia: string;
  /// O verbo da ação: "Gerar nova senha", "Recusar pedido".
  confirmar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  destrutivo?: boolean;
  carregando?: boolean;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const anterior = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    anterior.current = document.activeElement as HTMLElement | null;
    // O foco começa em Cancelar: numa ação destrutiva, o caminho seguro é o
    // que fica debaixo do dedo quando alguém confirma no Enter por reflexo.
    cancelar.current?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCancelar();
        return;
      }

      if (evento.key !== "Tab" || !caixa.current) return;

      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      anterior.current?.focus();
    };
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCancelar();
      }}
    >
      <div
        ref={caixa}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-consequencia"
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl"
      >
        <h2 id="confirmar-titulo" className="font-display text-[18px] font-bold text-ink">
          {titulo}
        </h2>
        <p id="confirmar-consequencia" className="mt-2 text-[14px] leading-relaxed text-ink-2">
          {consequencia}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelar}
            type="button"
            onClick={onCancelar}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold text-ink-2 hover:bg-line-2"
          >
            Cancelar
          </button>
          <Button
            variant={destrutivo ? "danger" : "primary"}
            onClick={onConfirmar}
            loading={carregando}
          >
            {confirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
