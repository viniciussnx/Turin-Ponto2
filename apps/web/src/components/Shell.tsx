"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./Providers";
import { Icon, type IconName } from "./Icon";
import { TurinMark } from "./TurinMark";

/// Navegação do painel. Os grupos espelham a rotina do DP: primeiro o que
/// precisa de ação hoje (frequência), depois o cadastro que muda pouco.
const NAV: { group: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    group: "Operação",
    items: [
      { href: "/", label: "Hoje", icon: "pulse" },
      { href: "/marcacoes", label: "Marcações", icon: "clock" },
      { href: "/ajustes", label: "Ajustes", icon: "swap" },
      { href: "/espelho", label: "Espelho de ponto", icon: "mirror" },
    ],
  },
  {
    group: "Cadastro",
    items: [
      { href: "/colaboradores", label: "Colaboradores", icon: "users" },
      { href: "/jornadas", label: "Jornadas", icon: "calendar" },
      { href: "/perimetros", label: "Perímetros", icon: "pin" },
      { href: "/feriados", label: "Feriados", icon: "star" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { href: "/sincronizacao", label: "Sincronização", icon: "sync" },
      { href: "/auditoria", label: "Auditoria", icon: "shield" },
    ],
  },
];

export function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [estreito, setEstreito] = useState(false);

  /// O rail é `position: fixed` e sai da tela por `translate` no mobile — mas
  /// continuava focável e lido pelo leitor de tela enquanto estava fora do
  /// campo de visão, então o Tab passeava por doze links invisíveis antes de
  /// chegar ao conteúdo. `inert` só entra abaixo de lg, onde o rail é gaveta.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sincronizar = () => setEstreito(mq.matches);
    sincronizar();
    mq.addEventListener("change", sincronizar);
    return () => mq.removeEventListener("change", sincronizar);
  }, []);

  /// Esc fecha a gaveta. Sem isso, quem abriu pelo teclado ficava sem saída.
  useEffect(() => {
    if (!open) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [open]);

  const railOculto = estreito && !open;

  return (
    <div className="flex min-h-screen">
      {/* Rail escuro fixo, no verde mais profundo da escala Turin. */}
      <aside
        inert={railOculto}
        aria-hidden={railOculto || undefined}
        className={`rail-escuro fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col bg-graphite transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <TurinMark className="h-5 w-auto text-turin-glow" />
          <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-white">
            PONTO
          </span>
        </div>

        <nav aria-label="Seções do painel" className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((section) => (
            <div key={section.group} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
                          active
                            ? "bg-graphite-3 text-white"
                            : "text-white/75 hover:bg-graphite-2 hover:text-white"
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          className={`h-[18px] w-[18px] ${
                            active ? "text-turin-glow" : "text-white/70"
                          }`}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-turin text-[13px] font-bold text-white">
              {initials(user?.name ?? "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white/90">{user?.name}</p>
              <p className="truncate text-[11px] text-white/70">{roleLabel(user?.role)}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              aria-label="Sair"
              className="rounded-md p-2 text-white/70 hover:bg-graphite-2 hover:text-white"
            >
              <Icon name="logout" className="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-graphite/50 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[236px]">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
          <div className="flex min-h-16 items-center gap-4 px-5 py-3 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="rounded-md p-2 text-ink-2 hover:bg-line-2 lg:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[26px] leading-none font-bold tracking-[0.01em] text-ink">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 truncate text-[13px] text-muted">{subtitle}</p>
              ) : null}
            </div>

            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 px-5 py-6 lg:px-8 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role?: string): string {
  return (
    {
      OWNER: "Responsável",
      ADMIN: "Administrador",
      MANAGER: "Encarregado",
      VIEWER: "Consulta",
    }[role ?? ""] ?? ""
  );
}
