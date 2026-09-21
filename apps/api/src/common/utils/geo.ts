/// Distancia em metros entre duas coordenadas (formula de haversine).
/// Precisao suficiente para cerca geografica de dezenas/centenas de metros.
export function distanceInMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a)));
}
