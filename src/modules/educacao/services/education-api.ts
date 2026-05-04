import type { Bairro, Escola, Estado, Municipio } from "@/core/types/territory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function listEstados(): Promise<Estado[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/estados`);
  if (!response.ok) throw new Error("estados indisponível");
  return (await response.json()) as Estado[];
}

export async function listMunicipios(estadoId: string): Promise<Municipio[]> {
  if (!API_BASE_URL) return [];

  const sgUf = estadoId.length === 2 ? estadoId.toUpperCase() : estadoId.toUpperCase();
  const response = await fetch(`${API_BASE_URL}/aggregations/cities?sg_uf=${sgUf}`);
  if (!response.ok) throw new Error("aggregations/cities indisponível");

  const geojson = await response.json() as {
    features: Array<{ properties: Record<string, unknown>; id?: string }>
  };

  return geojson.features.map((feature) => {
    const props = feature.properties;
    const rawId = String(props.municipioIdIbge ?? props.co_municipio ?? feature.id ?? "");
    const id = rawId.replace(/\.0$/, "");
    const nome = String(props.municipio ?? props.nome ?? id);
    const uf = String(props.uf ?? props.sg_uf ?? estadoId).toLowerCase();
    return { id, nome, estadoId: uf, geoProps: props };
  }).filter((m) => m.id && m.nome);
}

export async function listBairros(municipioId: string): Promise<Bairro[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/bairros?municipio_id=${municipioId}`);
  if (!response.ok) throw new Error("bairros indisponível");
  return (await response.json()) as Bairro[];
}

export async function listEscolasByBairro(bairroId: string): Promise<Escola[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/escolas?bairro_id=${bairroId}`);
  if (!response.ok) throw new Error("escolas indisponível");
  return (await response.json()) as Escola[];
}
