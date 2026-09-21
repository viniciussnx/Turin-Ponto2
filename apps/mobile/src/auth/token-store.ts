import * as SecureStore from 'expo-secure-store';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'turin.accessToken';
const REFRESH_KEY = 'turin.refreshToken';

/// Tokens vivem no Keychain (iOS) / Keystore (Android), nunca em AsyncStorage.
/// Quem tiver acesso ao armazenamento comum do app conseguiria bater ponto no
/// lugar do funcionario.
export async function saveTokens(tokens: Tokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<Tokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
