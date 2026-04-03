import type {
  GeoJSONFeatureCollection,
  ObservatoryLayer,
} from "@/types/observatory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function endpointUnavailableMessage(endpoint: string) {
  return `Endpoint ${endpoint} indisponível em modo local sem NEXT_PUBLIC_API_BASE_URL.`;
}

export async function listCamadas(
  nivel: ObservatoryLayer,
  recorteId: string,
): Promise<GeoJSONFeatureCollection | null> {
  if (!API_BASE_URL) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}/camadas?nivel=${nivel}&recorte=${recorteId}`,
  );

  if (!response.ok) {
    throw new Error(endpointUnavailableMessage("/camadas"));
  }

  return (await response.json()) as GeoJSONFeatureCollection;
}
