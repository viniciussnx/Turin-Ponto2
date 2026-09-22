"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/Providers";
import { TurinMark } from "@/components/TurinMark";
import { Button, ErrorNote, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, ready } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (failure) {
      setError((failure as Error).message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Lado da marca. O grafite esverdeado é o mesmo do splash do app. */}
      <div className="relative hidden overflow-hidden bg-graphite lg:block">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 90% at 30% 10%, #0BAF29 0%, #07752B 38%, #04150C 78%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <TurinMark className="h-6 w-auto text-white" />

          <div className="max-w-md">
            <h2 className="font-display text-[46px] leading-[1.05] font-bold text-white">
              O PONTO DE QUEM
              <br />
              MOVE A CIDADE
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">
              Marcações, jornadas e ajustes de toda a operação, do primeiro carro
              da manhã ao último da noite.
            </p>
          </div>

          <p className="text-[13px] text-white/40">Turin Transportes</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden">
            <TurinMark className="h-6 w-auto text-turin" />
          </div>

          <p className="eyebrow mt-8 lg:mt-0">Painel administrativo</p>
          <h1 className="mt-1 font-display text-[38px] leading-none font-bold text-ink">
            ENTRAR
          </h1>
          <p className="mt-3 text-[14px] text-muted">
            Acesso do RH e dos encarregados de garagem.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@turintransportes.com.br"
                autoComplete="username"
                required
                disabled={loading}
              />
            </Field>

            <Field label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </Field>

            {error ? <ErrorNote>{error}</ErrorNote> : null}

            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            Esqueceu a senha? Procure o responsável pelo sistema — o painel não envia
            redefinição por e-mail.
          </p>
        </div>
      </div>
    </div>
  );
}

