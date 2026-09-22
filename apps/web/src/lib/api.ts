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
    throw new ApiError(humanize(response.status, messageOf(body)), response.status, body);
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

/*
 * Traduz a falha para uma frase que diz o que houve e o que fazer.
 *
 * Antes, a mensagem crua do Nest ia direto para a tela — o analista do DP via
 * "Bad Request", "Forbidden resource" ou uma linha de validação em inglês com
 * o nome do campo do DTO. `writing.md` pede o contrário: *"When an error
 * occurs, focus on what people can do next."*
 *
 * Uma mensagem específica do servidor em português é sempre melhor que a
 * genérica daqui, então ela tem precedência — o que filtramos é o jargão.
 */
function humanize(status: number, raw: string | null): string {
  if (raw && ehApresentavel(raw)) return raw;

  switch (status) {
    case 0:
      return "Não foi possível falar com o servidor. Verifique se a API está no ar.";
    case 400:
      return "Algum campo veio fora do formato esperado. Confira os dados e tente de novo.";
    case 401:
      return "Sua sessão expirou. Entre de novo para continuar.";
    case 403:
      return "Seu perfil não tem permissão para esta ação. Fale com o responsável pelo sistema.";
    case 404:
      return "Não encontramos esse registro. Ele pode ter sido removido ou alterado.";
    case 409:
      return "Esse registro foi alterado por outra pessoa enquanto você trabalhava. Recarregue a página.";
    case 422:
      return "Os dados enviados não passaram na validação do servidor.";
    case 429:
      return "Muitas tentativas seguidas. Espere alguns instantes e tente de novo.";
    default:
      if (status >= 500) {
        return "O servidor falhou ao processar. Tente de novo; se persistir, avise a TI.";
      }
      return `Não foi possível concluir (erro ${status}).`;
  }
}

/// Jargão que não deve chegar ao usuário: as frases padrão do Nest/HTTP em
/// inglês e as linhas de validação do class-validator.
const JARGAO = [
  /^(bad request|unauthorized|forbidden|not found|conflict|internal server error)/i,
  /forbidden resource/i,
  /^request failed/i,
  /must be a|should not be empty|must not be|is not a valid/i,
  /^\w+\.\w+/,
];

function ehApresentavel(mensagem: string): boolean {
  if (mensagem.length > 180) return false;
  return !JARGAO.some((padrao) => padrao.test(mensagem));
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
