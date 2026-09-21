"use client";

/// Cliente da API do painel.
///
/// Mesma estratégia do app: access token curto em memória/localStorage e
/// refresh opaco rotacionado, com uma única renovação em voo por vez.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api"
).replace(/\/$/, "");

const ACCESS_KEY = "turin.panel.access";
const REFRESH_KEY = "turin.panel.refresh";
const USER_KEY = "turin.panel.user";

export interface PanelUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "VIEWER";
  company: { id: string; name: string };
}

export function loadSession(): { access: string; refresh: string; user: PanelUser } | null {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!access || !refresh || !rawUser) return null;
  try {
    return { access, refresh, user: JSON.parse(rawUser) as PanelUser };
  } catch {
    return null;
  }
}

export function saveSession(access: string, refresh: string, user: PanelUser): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

let onExpired: (() => void) | null = null;

export function setExpiredHandler(handler: (() => void) | null): void {
  onExpired = handler;
}

/// Uma renovação por vez. Um painel dispara várias consultas na mesma tela;
/// sem esta trava, cada 401 rotacionaria o refresh e as demais cairiam.
let refreshing: Promise<string | null> | null = null;

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  anonymous?: boolean;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const response = await send(path, options);

  if (response.status === 401 && !options.anonymous) {
    const renewed = await renew();
    if (!renewed) {
      clearSession();
      onExpired?.();
      throw new ApiError("Sessão expirada", 401);
    }
    return parse<T>(await send(path, options));
  }

  return parse<T>(response);
}

async function send(path: string, options: Options): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!options.anonymous) {
    const session = loadSession();
    if (session) headers.Authorization = `Bearer ${session.access}`;
  }

  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      "Não foi possível falar com o servidor. Verifique se a API está no ar.",
      0,
    );
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(messageOf(body) ?? `Erro ${response.status}`, response.status, body);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/// O Nest devolve `message` como string ou array (erros de validação).
function messageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const message = (body as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return null;
}

async function renew(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const session = loadSession();
      if (!session) return null;

      const response = await send("/auth/refresh", {
        method: "POST",
        body: { refreshToken: session.refresh },
        anonymous: true,
      });
      if (!response.ok) return null;

      const renewed = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      saveSession(renewed.accessToken, renewed.refreshToken, session.user);
      return renewed.accessToken;
    } catch {
      return null;
    } finally {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();

  return refreshing;
}
