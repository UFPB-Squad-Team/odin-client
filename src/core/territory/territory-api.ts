import type { Bairro, Estado, Municipio } from "@/core/types/territory";
import {
  NORDESTE_ESTADOS,
  normalizeEstadoId,
} from "@/core/territory/estados-nordeste";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export {
  DEFAULT_ESTADO_ID,
  DEFAULT_ESTADO_UF,
  ESTADO_VIEWPORTS,
  NORDESTE_ESTADOS,
  NORDESTE_IDS,
  NORDESTE_VIEWPORT,
  formatEstadoLabel,
  getEstadoViewport,
  isEstadoId,
  normalizeEstadoId,
  resolveDefaultEstadoId,
} from "@/core/territory/estados-nordeste";
export type {
  EstadoId,
  EstadoUf,
  EstadoViewport,
} from "@/core/territory/estados-nordeste";

export const JOAO_PESSOA_IBGE_ID = "2507507";

type NeighborhoodGeometry = {
  type?: string;
  coordinates?: unknown;
};

type NeighborhoodRawRecord = Record<string, unknown> & {
  geometria?: NeighborhoodGeometry;
  geometry?: NeighborhoodGeometry;
};

export function sortMunicipiosByName(a: Municipio, b: Municipio) {
  return a.nome.localeCompare(b.nome, "pt-BR", {
    sensitivity: "base",
    numeric: true,
  });
}

export function normalizeNeighborhoodPayload(
  payload: unknown,
): NeighborhoodRawRecord[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        ...raw,
        geometria: (raw.geometria ?? raw.geometry) as NeighborhoodGeometry | undefined,
        geometry: (raw.geometry ?? raw.geometria) as NeighborhoodGeometry | undefined,
      };
    }) as NeighborhoodRawRecord[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const collection = payload as {
    features?: Array<{
      id?: string | number;
      properties?: Record<string, unknown>;
      geometry?: NeighborhoodGeometry;
    }>;
  };

  if (!Array.isArray(collection.features)) {
    return [];
  }

  return collection.features.map((feature) => ({
    ...(feature.properties ?? {}),
    id: feature.id ?? feature.properties?.id,
    geometria: feature.geometry,
    geometry: feature.geometry,
  })) as NeighborhoodRawRecord[];
}

export const bairrosGeoCache = new Map<string, Array<Record<string, unknown>>>();

function normalizeMunicipioLabel(props: Record<string, unknown>, fallbackId: string) {
  return String(props.municipio ?? props.nome ?? props.name ?? props.description ?? fallbackId);
}

/**
 * Lista os estados disponíveis para o filtro em cascata.
 *
 * Consome `GET /api/v1/estados` quando `NEXT_PUBLIC_API_BASE_URL` está
 * configurada e normaliza cada item para o contrato `Estado` do frontend
 * (`id` = UF minúscula). Estados fora do escopo do ODIN (9 UFs do Nordeste)
 * são descartados. Em caso de falha/indisponibilidade, devolve a lista
 * canônica local — o seletor da sidebar nunca fica vazio.
 */
export async function listEstados(): Promise<Estado[]> {
  if (!API_BASE_URL) return NORDESTE_ESTADOS;

  try {
    const response = await fetch(`${API_BASE_URL}/estados`);
    if (!response.ok) throw new Error(`estados falhou: ${response.status}`);

    const payload = (await response.json()) as Array<{
      id?: unknown;
      nome?: unknown;
      sigla?: unknown;
    }>;

    const normalized = (Array.isArray(payload) ? payload : [])
      .map((item): Estado | null => {
        const uf = normalizeEstadoId(
          typeof item.sigla === "string" ? item.sigla : String(item.id ?? ""),
        );
        if (!uf) return null;
        const nome =
          typeof item.nome === "string" && item.nome.trim()
            ? item.nome.trim()
            : (NORDESTE_ESTADOS.find((estado) => estado.id === uf)?.nome ?? uf);
        return { id: uf, nome, sigla: uf.toUpperCase() };
      })
      .filter((estado): estado is Estado => estado !== null);

    return normalized.length > 0 ? normalized : NORDESTE_ESTADOS;
  } catch (error) {
    console.warn("[listEstados] API indisponível, usando lista canônica:", error);
    return NORDESTE_ESTADOS;
  }
}

export async function listMunicipios(estadoId: string): Promise<Municipio[]> {
  if (!API_BASE_URL) {
    console.warn("[listMunicipios] API_BASE_URL não definida, retornando []");
    return [];
  }

  const sgUf = estadoId.toUpperCase();
  const url = `${API_BASE_URL}/aggregations/cities?sg_uf=${sgUf}`;
  console.log("[listMunicipios] fetching:", url);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`aggregations/cities falhou: ${response.status}`);

  const geojson = (await response.json()) as {
    features: Array<{ properties: Record<string, unknown>; id?: string; geometry?: { type: string; coordinates: [number, number] } }>;
  };

  console.log("[listMunicipios] features recebidas:", geojson.features?.length);

  const result = geojson.features
    .map((feature) => {
      const props = feature.properties;
      const rawId = String(props.municipioIdIbge ?? props.co_municipio ?? feature.id ?? "");
      const id = rawId.replace(/\.0$/, "");
      const nome = normalizeMunicipioLabel(props, id);
      const uf = String(props.uf ?? props.sg_uf ?? estadoId).toLowerCase();
      // Inclui centróide da geometry (Point) no geoProps para auto-pan
      const centroide = feature.geometry?.type === "Point" ? feature.geometry.coordinates : undefined;
      return { id, nome, estadoId: uf, geoProps: { ...props, _centroide: centroide } } satisfies Municipio;
    })
    .filter((m) => m.id && m.nome);

  const sorted = [...result].sort(sortMunicipiosByName);

  console.log("[listMunicipios] municípios normalizados:", sorted.length, sorted.slice(0, 3));
  return sorted;
}

export async function listBairros(municipioId: string): Promise<Bairro[]> {
  if (!API_BASE_URL) return [];

  const response = await fetch(
    `${API_BASE_URL}/aggregations/neighborhoods?municipio_id=${municipioId}&include_geometria=true`,
  );
  if (!response.ok) throw new Error("aggregations/neighborhoods indisponível");

  const payload = normalizeNeighborhoodPayload(await response.json());

  bairrosGeoCache.set(municipioId, payload);

  return payload
    .map((raw, index) => {
      const idRaw = String(raw._id ?? raw.cd_bairro_ibge ?? raw.cd_setor ?? raw.id ?? "");
      const id = idRaw.replace(/\.0$/, "");
      const rawNome = String(raw.bairro ?? raw.nm_bairro ?? raw.nome_area ?? raw.nome ?? "").trim();
      const isSetor = raw.nivel === "setor" || raw.source === "setor_indicadores";

      const nome = isSetor && (!rawNome || /^\d+$/.test(rawNome))
        ? `Setor ${id}`
        : (rawNome && rawNome.length > 0 ? rawNome : id || `Área ${index + 1}`);
      const municipioIdApi = String(
        raw.municipioIdIbge ?? raw.municipio_id_ibge ?? raw.cd_municipio ?? "",
      ).replace(/\.0$/, "");
      const source = raw.source != null ? String(raw.source) : undefined;
      const temBairroOficial =
        raw.tem_bairro_oficial != null ? Boolean(raw.tem_bairro_oficial) : undefined;

      return {
        id,
        nome,
        municipioId: municipioIdApi || municipioId,
        geoProps: raw,
        source,
        temBairroOficial,
      } satisfies Bairro;
    })
    .filter((b) => b.id && b.nome)
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true }),
    );
}
