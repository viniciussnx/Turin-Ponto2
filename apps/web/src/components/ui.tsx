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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-600 ${TONE[tone]}`}
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
    "inline-flex items-center justify-center gap-2 rounded-lg font-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-[14px]" }[size];
  const variants = {
    primary: "bg-turin text-white hover:bg-turin-ink",
    ghost: "text-ink-2 hover:bg-line-2",
    outline: "border border-line bg-surface text-ink-2 hover:bg-line-2",
    danger: "bg-bad text-white hover:brightness-95",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes} ${variants} ${className}`}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
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
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${CONTROL} pl-9`}
      />
    </div>
  );
}

/// Número grande com rótulo. A condensada faz o total ler como instrumento.
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
      <p className={`tnum font-display text-[34px] leading-tight font-700 ${ink}`}>{value}</p>
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
        <p className="text-[15px] font-600 text-ink">{title}</p>
        {detail ? <p className="mt-1 max-w-sm text-[13px] text-muted">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-bad-soft px-4 py-3">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
      <p className="text-[13px] leading-relaxed text-bad">{children}</p>
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
  return <div className={`animate-pulse rounded bg-line-2 ${className}`} />;
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-[14px]">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-line px-4 py-3 text-${align} eyebrow whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td className={`border-b border-line-2 px-4 py-3 text-${align} ${className}`}>{children}</td>
  );
}
