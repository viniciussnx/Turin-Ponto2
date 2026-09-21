import Constants from 'expo-constants';
import { clearTokens, loadTokens, saveTokens, type Tokens } from '../auth/token-store';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/// Endereço da API. Em desenvolvimento não pode ser `localhost`: o celular
/// resolveria para ele mesmo. Usamos o IP da máquina que o Metro já anuncia.
export const API_URL = resolveApiUrl();

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3333/api` : 'http://localhost:3333/api';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /// Rotas de login/refresh não levam token nem tentam renovar.
  anonymous?: boolean;
  timeoutMs?: number;
}

/// Uma renovação de token por vez.
///
/// Quando o app volta do background, várias telas disparam requisições juntas e
/// todas recebem 401. Sem esta trava, cada uma rotacionaria o refresh token; a
/// primeira invalidaria as demais e o usuário cairia para o login sem motivo.
let refreshInFlight: Promise<Tokens | null> | null = null;

/// Chamado quando a sessão morre de vez. O AuthProvider registra aqui a sua
/// função de logout, para o app voltar ao login de qualquer tela.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);

  if (response.status === 401 && !options.anonymous) {
    const renewed = await renewTokens();
    if (!renewed) {
      await clearTokens();
      onSessionExpired?.();
      throw new ApiError('Sessão expirada', 401);
    }
    return parse<T>(await send(path, options));
  }

  return parse<T>(response);
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!options.anonymous) {
      const tokens = await loadTokens();
      if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Sem resposta do servidor. Verifique sua conexão.', 0);
    }
    throw new ApiError('Falha de conexão. Verifique sua internet.', 0);
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(messageFrom(body) ?? `Erro ${response.status}`, response.status, body);
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

/// O Nest devolve `message` como string ou array de strings (erros de validação).
function messageFrom(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return null;
}

async function renewTokens(): Promise<Tokens | null> {
  refreshInFlight ??= (async () => {
    try {
      const current = await loadTokens();
      if (!current?.refreshToken) return null;

      const response = await send('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: current.refreshToken },
        anonymous: true,
      });
      if (!response.ok) return null;

      const renewed = (await response.json()) as Tokens;
      await saveTokens(renewed);
      return renewed;
    } catch {
      return null;
    } finally {
      // Libera na próxima volta do event loop: quem estava esperando já leu
      // o resultado desta promise.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}
