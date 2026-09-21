"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearSession,
  loadSession,
  saveSession,
  setExpiredHandler,
  type PanelUser,
} from "@/lib/api";

interface AuthValue {
  user: PanelUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados de ponto mudam o tempo todo, mas não a cada foco de janela:
            // 30s evita refazer a consulta a cada alt-tab do analista.
            staleTime: 30_000,
            retry: (failureCount, error) => {
              // 4xx não melhora com retentativa.
              const status = (error as { status?: number }).status ?? 0;
              if (status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PanelUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session) setUser(session.user);
    setReady(true);

    setExpiredHandler(() => {
      setUser(null);
      router.replace("/entrar");
    });
    return () => setExpiredHandler(null);
  }, [router]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      async signIn(email, password) {
        const result = await api<{
          accessToken: string;
          refreshToken: string;
          user: PanelUser;
        }>("/auth/login", {
          method: "POST",
          anonymous: true,
          body: { email, password },
        });
        saveSession(result.accessToken, result.refreshToken, result.user);
        setUser(result.user);
      },
      signOut() {
        clearSession();
        setUser(null);
        router.replace("/entrar");
      },
    }),
    [user, ready, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de <Providers>");
  return value;
}
