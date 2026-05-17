/**
 * Calcula a distância em metros entre dois pontos geográficos usando a fórmula de Haversine.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Gera pontos de um círculo para renderizar no mapa.
 * Retorna coordenadas [lng, lat][] para um polígono GeoJSON.
 */
export function generateCircleCoordinates(
  centerLng: number,
  centerLat: number,
  radiusMeters: number,
  segments = 64,
): [number, number][] {
  const coords: [number, number][] = [];
  const R = 6371000;

  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const lat = Math.asin(
      Math.sin((centerLat * Math.PI) / 180) * Math.cos(radiusMeters / R) +
        Math.cos((centerLat * Math.PI) / 180) *
          Math.sin(radiusMeters / R) *
          Math.cos(angle),
    );
    const lng =
      ((centerLng * Math.PI) / 180) +
      Math.atan2(
        Math.sin(angle) * Math.sin(radiusMeters / R) * Math.cos((centerLat * Math.PI) / 180),
        Math.cos(radiusMeters / R) - Math.sin((centerLat * Math.PI) / 180) * Math.sin(lat),
      );

    coords.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI]);
  }

  return coords;
}
