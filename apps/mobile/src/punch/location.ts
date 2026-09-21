import * as Location from 'expo-location';

export interface Fix {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export type LocationOutcome =
  | { status: 'ok'; fix: Fix }
  | { status: 'denied' }
  | { status: 'unavailable'; reason: string };

/// Pega a posição para acompanhar a marcação.
///
/// Nunca lança e nunca bloqueia o ponto: a Portaria 671/2021 proíbe o REP-P de
/// impedir o registro, e mesmo no uso gerencial recusar a batida por GPS ruim
/// puniria o funcionário por um problema que não é dele. Sem posição, a
/// marcação vai sem coordenada e o servidor decide o que fazer.
export async function getFix(timeoutMs = 8_000): Promise<LocationOutcome> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return { status: 'denied' };

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs,
    );

    if (!position) {
      // GPS demorou demais — garagem coberta, subsolo. Tentamos a última
      // posição conhecida antes de desistir.
      const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
      if (!last) return { status: 'unavailable', reason: 'Sem sinal de GPS' };
      return { status: 'ok', fix: toFix(last) };
    }

    return { status: 'ok', fix: toFix(position) };
  } catch (error) {
    return { status: 'unavailable', reason: (error as Error).message };
  }
}

function toFix(position: Location.LocationObject): Fix {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy
      ? Math.round(position.coords.accuracy)
      : undefined,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
