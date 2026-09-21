import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const INSTALLATION_KEY = 'turin.installationId';

export interface DeviceInfo {
  installationId: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

/// Identidade estavel desta instalacao do app.
///
/// Gerada uma vez e guardada no armazenamento seguro. O servidor amarra este
/// id ao funcionario: e o que impede dois colegas de baterem o ponto um do
/// outro no mesmo aparelho. Desinstalar o app gera um id novo, e ai o RH
/// precisa liberar o acesso de novo — que e exatamente o comportamento
/// desejado para "troquei de celular".
export async function getInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (existing) return existing;

  const fresh = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_KEY, fresh);
  return fresh;
}

export async function getDeviceInfo(appVersion?: string): Promise<DeviceInfo> {
  return {
    installationId: await getInstallationId(),
    platform: Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB',
    model: Device.modelName ?? undefined,
    osVersion: Device.osVersion ?? undefined,
    appVersion,
  };
}
