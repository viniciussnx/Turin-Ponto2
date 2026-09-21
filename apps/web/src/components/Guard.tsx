"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./Providers";

/// Porteiro das paginas internas.
///
/// A sessao vive no localStorage, entao so da para decidir no cliente. Enquanto
/// `ready` for falso mostramos o fundo neutro em vez de piscar o login para
/// quem ja esta autenticado.
export function Guard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/entrar");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="min-h-screen bg-paper" />;
  return <>{children}</>;
}
