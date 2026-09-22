"use client";

import { Icon, type IconName } from "./Icon";
import { Card } from "./ui";

/// Módulo cujo modelo de dados existe mas cuja API ainda não foi escrita.
///
/// Preferido a esconder o item do menu: quem opera precisa saber que o conceito
/// existe e por onde ele é mantido hoje. E preferido a uma tela falsa com
/// dados inventados, que dá a impressão de que já funciona.
export function PendingModule({
  icon,
  title,
  summary,
  endpoints,
  note,
}: {
  icon: IconName;
  title: string;
  summary: string;
  endpoints: string[];
  note?: string;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-line-2">
            <Icon name={icon} className="h-5 w-5 text-ink-2" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[12px] font-semibold text-warn">
                Falta a API
              </span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{summary}</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="eyebrow mb-3">Endpoints a construir</p>
        <ul className="space-y-1.5">
          {endpoints.map((endpoint) => (
            <li
              key={endpoint}
              className="tnum rounded-lg bg-paper px-3 py-2 text-[13px] text-ink-2"
            >
              {endpoint}
            </li>
          ))}
        </ul>
      </Card>

      {note ? (
        <div className="rounded-lg bg-warn-soft px-4 py-3">
          <p className="text-[13px] leading-relaxed text-warn">{note}</p>
        </div>
      ) : null}
    </div>
  );
}
