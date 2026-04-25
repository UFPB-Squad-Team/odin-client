import type { Bairro, Escola, Estado, Municipio } from "@/core/types/territory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function notConfiguredMessage(endpoint: string) {
  return `Endpoint ${endpoint} indisponível em modo local sem NEXT_PUBLIC_API_BASE_URL.`;
}

export async function listEstados(): Promise<Estado[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/estados`);
  if (!response.ok) throw new Error(notConfiguredMessage("/estados"));
  return (await response.json()) as Estado[];
}

export async function listMunicipios(estadoId: string): Promise<Municipio[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/municipios?estado_id=${estadoId}`);
  if (!response.ok) throw new Error(notConfiguredMessage("/municipios"));
  return (await response.json()) as Municipio[];
}

export async function listBairros(municipioId: string): Promise<Bairro[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/bairros?municipio_id=${municipioId}`);
  if (!response.ok) throw new Error(notConfiguredMessage("/bairros"));
  return (await response.json()) as Bairro[];
}

export async function listEscolasByBairro(bairroId: string): Promise<Escola[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/escolas?bairro_id=${bairroId}`);
  if (!response.ok) throw new Error(notConfiguredMessage("/escolas"));
  return (await response.json()) as Escola[];
}
