const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchResultKind = "escola" | "logradouro" | "cep" | "municipio" | "bairro";

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  label: string;
  subtitle: string;
  coordinates: [number, number]; // [longitude, latitude]
  municipioIdIbge: string;
  metadata: Record<string, unknown>;
}

export interface UniversalSearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
}


/**
 * Busca universal — retorna sugestões de escolas, logradouros, CEPs, bairros e municípios.
 */
export async function fetchUniversalSearch(params: {
  query: string;
  sgUf?: string | null;
  municipioId?: string | null;
  limit?: number;
}): Promise<UniversalSearchResponse> {
  if (!API_BASE_URL || params.query.trim().length < 2) {
    return { results: [], total: 0, query: params.query };
  }

  const url = new URL(`${API_BASE_URL}/busca/universal`);
  url.searchParams.set("q", params.query.trim());
  if (params.sgUf) url.searchParams.set("sg_uf", params.sgUf.toUpperCase());
  if (params.municipioId) url.searchParams.set("municipio_id", params.municipioId);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    return { results: [], total: 0, query: params.query };
  }

  return (await response.json()) as UniversalSearchResponse;
}
