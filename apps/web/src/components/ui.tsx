"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

type Tone = "ok" | "warn" | "bad" | "info" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "bg-turin-soft text-turin-ink",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  neutral: "bg-line-2 text-ink-2",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  type = "button",
  icon,
  className = "",
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  icon?: IconName;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-[14px]" }[size];
  /// `turin-acao` (700) e não o verde da marca (500): branco sobre o 500 dá
  /// 2,93:1 e reprova. Sobre o 700 dá 6,18:1, sobre o 800 dá 8,41:1 — e o
  /// estado pressionado fica mais escuro, não mais claro, como se espera.
  const variants = {
    primary: "bg-turin-acao text-on-turin hover:bg-turin-acao-2",
    ghost: "text-ink-2 hover:bg-line-2",
    outline: "border border-line bg-surface text-ink-2 hover:bg-line-2",
    danger: "bg-bad text-white hover:brightness-90",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${sizes} ${variants} ${className}`}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
      {loading ? <span className="sr-only">Carregando</span> : null}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted focus:border-turin focus:outline-none";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /// Rótulo acessível. Um `placeholder` some assim que a pessoa digita, então
  /// ele não serve de rótulo — o campo ficaria anônimo no leitor de tela.
  label?: string;
}) {
  return (
    <div className="relative flex-1">
      <Icon
        name="search"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={`${CONTROL} pl-9`}
      />
    </div>
  );
}

/// Número grande com rótulo. A mono faz o total ler como instrumento de
/// medição, e alinha quando vários `Stat` ficam lado a lado.
export function Stat({
  value,
  label,
  tone = "neutral",
  hint,
}: {
  value: string;
  label: string;
  tone?: Tone;
  hint?: string;
}) {
  const ink = {
    ok: "text-turin-ink",
    warn: "text-warn",
    bad: "text-bad",
    info: "text-info",
    neutral: "text-ink",
  }[tone];

  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`tnum font-display text-[34px] leading-tight font-bold ${ink}`}>{value}</p>
      {hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon = "search",
  title,
  detail,
  action,
}: {
  icon?: IconName;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-line-2">
        <Icon name={icon} className="h-5 w-5 text-muted" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {detail ? <p className="mt-1 max-w-sm text-[13px] text-muted">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

/// `role="alert"` faz o leitor de tela anunciar o erro no momento em que ele
/// aparece. Sem isso, quem não está olhando para o ponto exato da tela submete
/// o formulário e não recebe notícia nenhuma de que falhou.
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-bad-soft px-4 py-3">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
      <p className="text-[13px] leading-relaxed text-bad">{children}</p>
    </div>
  );
}

/// Confirmação de ação concluída. Complementa o `ErrorNote`: aprovar um ajuste
/// tem efeito jurídico e não pode ter o silêncio como único retorno.
export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg bg-turin-soft px-4 py-3"
    >
      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-turin-ink" aria-hidden="true" />
      <p className="text-[13px] leading-relaxed text-turin-ink">{children}</p>
    </div>
  );
}

/// Aviso de recurso que depende de backend ainda inexistente. Mesma política
/// do app: melhor dizer na cara que o dado é provisório.
export function ProvisionalNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-warn-soft px-4 py-3">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
      <p className="text-[13px] leading-relaxed text-warn">{children}</p>
    </div>
  );
}

/// Esqueleto de carregamento. Preferido a um spinner central: mantém o layout
/// estável e o olho não salta quando os dados chegam.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-line-2 ${className}`} />;
}

/// Envolve um bloco de esqueletos e anuncia o carregamento uma única vez.
/// Marcar cada `Skeleton` seria um anúncio por retângulo cinza; o leitor de
/// tela precisa de uma frase, não de doze.
export function LoadingRegion({
  children,
  label = "Carregando dados",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/*
 * Alinhamento como mapa estático.
 *
 * Antes isto era `text-${align}`, interpolado em tempo de execução. O Tailwind
 * varre o código como texto puro e nunca vê a string montada, então nenhuma
 * das classes era gerada: toda coluna numérica do painel renderizava alinhada
 * à esquerda, e os cabeçalhos ficavam centralizados sobre células à esquerda.
 * Um mapa literal é o que o varredor consegue enxergar.
 */
const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

type Align = keyof typeof ALIGN;

export function TableShell({
  children,
  caption,
  minWidth = 720,
}: {
  children: ReactNode;
  /// Descreve a tabela para quem usa leitor de tela. Fica invisível na tela.
  caption?: string;
  minWidth?: number;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-line bg-surface">
      <table
        className="w-full border-collapse text-[14px]"
        style={{ minWidth: `${minWidth}px` }}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

/*
 * Cabeçalho de coluna.
 *
 * `scope="col"` é o que liga cada célula ao seu cabeçalho num leitor de tela —
 * sem ele, uma tabela de 31 linhas por 8 colunas é lida como 248 valores
 * soltos. `sticky` mantém o cabeçalho à vista: o espelho de um mês não cabe
 * na tela e conferir a oitava coluna da linha 25 sem cabeçalho é adivinhação.
 */
export function Th({
  children,
  align = "left",
  className = "",
  sortKey,
  sortedBy,
  sortDir,
  onSort,
}: {
  children?: ReactNode;
  align?: Align;
  className?: string;
  sortKey?: string;
  sortedBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
}) {
  const ativo = sortKey != null && sortKey === sortedBy;
  const ordenavel = sortKey != null && onSort != null;

  return (
    <th
      scope="col"
      aria-sort={ativo ? (sortDir === "asc" ? "ascending" : "descending") : ordenavel ? "none" : undefined}
      className={`sticky top-0 z-10 border-b border-line bg-surface px-4 py-3 ${ALIGN[align]} eyebrow whitespace-nowrap ${className}`}
    >
      {ordenavel ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={`inline-flex items-center gap-1 hover:text-ink ${ativo ? "text-ink" : ""}`}
        >
          {children}
          <span aria-hidden="true" className="text-[10px]">
            {ativo ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <td className={`border-b border-line-2 px-4 py-3 ${ALIGN[align]} ${className}`}>{children}</td>
  );
}

/// Corpo de tabela com faixas alternadas. Numa tabela densa a zebra é o que
/// impede o olho de pular de linha ao percorrer a régua até a oitava coluna.
export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="[&>tr:nth-child(even)]:bg-paper/60">{children}</tbody>;
}
