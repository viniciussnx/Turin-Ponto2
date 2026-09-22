"use client";

import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Badge, Button, Card, ErrorNote, Stat } from "@/components/ui";
import { useVerifyChain } from "@/lib/queries";

export default function AuditPage() {
  const verify = useVerifyChain();

  return (
    <Guard>
      <Shell
        title="Auditoria"
        subtitle="Integridade da cadeia de marcações"
        actions={
          <Button icon="shield" onClick={() => verify.mutate()} loading={verify.isPending}>
            Verificar agora
          </Button>
        }
      >
        <div className="max-w-3xl space-y-5">
          <Card>
            <div className="flex flex-wrap items-start gap-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-turin-soft">
                <Icon name="shield" className="h-5 w-5 text-turin-ink" />
              </div>
              <div className="min-w-[260px] flex-1">
                <h2 className="text-[15px] font-semibold text-ink">Como a cadeia funciona</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  Cada marcação recebe um NSR sequencial e um hash calculado a partir do
                  hash da anterior. Alterar uma linha direto no banco quebra a cadeia de
                  todas as seguintes, e a verificação aponta o NSR exato onde isso
                  aconteceu. É o que dá valor probatório ao registro.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Marcações nunca são alteradas nem apagadas. Correções entram como ajuste
                  vinculado, que gera uma marcação nova — o histórico completo permanece.
                </p>
              </div>
            </div>
          </Card>

          {verify.isError ? <ErrorNote>{(verify.error as Error).message}</ErrorNote> : null}

          {verify.isSuccess && verify.data ? (
            verify.data.valid ? (
              <Card className="border-turin-line bg-turin-soft">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-turin">
                    <Icon name="check" className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-[22px] font-bold text-turin-ink">
                      CADEIA ÍNTEGRA
                    </h3>
                    <p className="mt-1 text-[14px] text-ink-2">
                      Nenhuma marcação foi alterada após a gravação.
                    </p>
                    <div className="mt-4">
                      <Stat
                        value={verify.data.checked.toLocaleString("pt-BR")}
                        label="Marcações verificadas"
                        tone="ok"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-bad bg-bad-soft">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bad">
                    <Icon name="alert" className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-[22px] font-bold text-bad">
                      CADEIA QUEBRADA
                    </h3>
                    <p className="mt-1 text-[14px] text-ink-2">{verify.data.reason}</p>
                    <div className="mt-4 flex flex-wrap gap-8">
                      <div>
                        <p className="eyebrow">Primeiro NSR afetado</p>
                        <p className="tnum font-display text-[30px] font-bold text-bad">
                          {verify.data.brokenAtNsr}
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow">Verificadas até ali</p>
                        <p className="tnum font-display text-[30px] font-bold text-ink">
                          {verify.data.checked.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
                      Isso indica alteração feita fora do sistema. Preserve o banco como
                      está e envolva quem responde pela infraestrutura antes de qualquer
                      correção.
                    </p>
                  </div>
                </div>
              </Card>
            )
          ) : null}

          {!verify.isSuccess && !verify.isPending ? (
            <Card>
              <div className="flex items-center gap-3">
                <Badge>Não verificada</Badge>
                <p className="text-[14px] text-muted">
                  Ainda não verificada nesta sessão. A checagem percorre todas as marcações
                  da empresa — em bases grandes leva alguns segundos.
                </p>
              </div>
            </Card>
          ) : null}
        </div>
      </Shell>
    </Guard>
  );
}
