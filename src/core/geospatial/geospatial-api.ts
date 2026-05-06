import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";

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

/**
 * Busca municípios da API ODIN como GeoJSON.
 * GET /api/v1/aggregations/cities?sg_uf=PB
 */
export async function fetchMunicipiosGeoJSON(
  sgUf: string,
): Promise<GeoJSONFeatureCollection | null> {
  if (!API_BASE_URL) return null;

  const response = await fetch(
    `${API_BASE_URL}/aggregations/cities?sg_uf=${sgUf}`,
  );

  if (!response.ok) return null;

  return (await response.json()) as GeoJSONFeatureCollection;
}

/**
 * Busca escolas como GeoJSON para a camada de mapa.
 * GET /api/v1/escolas/geojson/paraiba?municipio_id=2507507
 */
export async function fetchSchoolsGeoJSON(
  municipioId?: string | null,
): Promise<GeoJSONFeatureCollection | null> {
  if (!API_BASE_URL) return null;

  const query = municipioId
    ? `?municipio_id=${encodeURIComponent(municipioId)}`
    : "";

  const response = await fetch(
    `${API_BASE_URL}/escolas/geojson/paraiba${query}`,
  );

  if (!response.ok) return null;

  const rawCollection = (await response.json()) as GeoJSONFeatureCollection;

  return {
    type: "FeatureCollection",
    features: rawCollection.features.map((feature): GeoJSONFeature => {
      const props = feature.properties as Record<string, unknown>;
      const rawId = String(
        props.id ?? props.escola_id_inep ?? feature.id ?? "",
      ).replace(/\.0$/, "");
      const escolaNome = String(
        props.escola_nome ?? props.nome ?? props.name ?? rawId,
      );
      const municipioIdIbge = String(
        props.municipioIdIbge ?? props.municipio_id_ibge ?? "",
      ).replace(/\.0$/, "");

      return {
        ...feature,
        id: rawId,
        properties: {
          ...props,
          bairro: String(props.bairro ?? props.bairro_nome ?? ""),
          dependencia_adm: String(props.dependencia_adm ?? ""),
          escola_id_inep: props.escola_id_inep ?? rawId,
          escola_nome: escolaNome,
          id: rawId,
          municipioIdIbge: municipioIdIbge || undefined,
          municipio_nome: String(props.municipio_nome ?? props.municipio ?? ""),
          nome: escolaNome,
          nivel: "escola",
          tipo_localizacao: String(props.tipo_localizacao ?? ""),
        },
      };
    }),
  };
}

type SchoolListItem = {
  bairro?: string;
  dependencia_adm?: string;
  escola_id_inep?: string | number;
  escola_nome?: string;
  id?: string | number;
  ideb?: number | string | null;
  latitude?: number | string | null;
  localizacao?: {
    coordinates?: [number, number];
    type?: string;
  } | null;
  longitude?: number | string | null;
  municipioIdIbge?: string | number;
  municipio_id_ibge?: string | number;
  municipio_nome?: string;
  tipo_localizacao?: string;
  [key: string]: unknown;
};

type SchoolsPageResponse = {
  page?: number;
  page_size?: number;
  schools?: SchoolListItem[];
  total_items?: number;
  total_pages?: number;
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSchoolFeature(item: SchoolListItem): GeoJSONFeature | null {
  const rawId = String(item.id ?? item.escola_id_inep ?? "").replace(/\.0$/, "");
  if (!rawId) return null;

  const localizacao = item.localizacao?.coordinates;
  const longitude = localizacao?.[0] ?? toNumber(item.longitude);
  const latitude = localizacao?.[1] ?? toNumber(item.latitude);
  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }

  const escolaNome = String(item.escola_nome ?? item.nome ?? item.name ?? rawId);
  const municipioIdIbge = String(
    item.municipioIdIbge ?? item.municipio_id_ibge ?? "",
  ).replace(/\.0$/, "");

  return {
    type: "Feature",
    id: rawId,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      ...item,
      bairro: String(item.bairro ?? ""),
      dependencia_adm: String(item.dependencia_adm ?? ""),
      escola_id_inep: item.escola_id_inep ?? rawId,
      escola_nome: escolaNome,
      id: rawId,
      ideb: item.ideb ?? null,
      latitude,
      localizacao:
        item.localizacao ?? { type: "Point", coordinates: [longitude, latitude] },
      longitude,
      municipioIdIbge: municipioIdIbge || undefined,
      municipio_nome: String(item.municipio_nome ?? ""),
      nome: escolaNome,
      nivel: "escola",
      tipo_localizacao: String(item.tipo_localizacao ?? ""),
    },
  };
}

/**
 * Busca todas as escolas com paginação em /api/v1/schools e converte para GeoJSON.
 */
export async function fetchAllSchools(
  municipioId?: string | null,
): Promise<GeoJSONFeatureCollection | null> {
  if (!API_BASE_URL) return null;

  const pageSize = 100;
  const schools: SchoolListItem[] = [];
  let page = 1;
  let totalItems: number | null = null;

  while (true) {
    const response = await fetch(
      `${API_BASE_URL}/schools?page=${page}&page_size=${pageSize}`,
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as SchoolsPageResponse;
    const pageSchools = payload.schools ?? [];

    if (page === 1 && pageSchools.length === 0) {
      return {
        type: "FeatureCollection",
        features: [],
      };
    }

    schools.push(...pageSchools);
    totalItems = payload.total_items ?? totalItems;

    if (
      pageSchools.length < pageSize ||
      (totalItems !== null && schools.length >= totalItems) ||
      (payload.total_pages !== undefined && page >= payload.total_pages)
    ) {
      break;
    }

    page += 1;
  }

  const filteredSchools = municipioId
    ? schools.filter((item) => {
        const itemMunicipioId = String(
          item.municipioIdIbge ?? item.municipio_id_ibge ?? "",
        ).replace(/\.0$/, "");
        return itemMunicipioId === municipioId;
      })
    : schools;

  const features = filteredSchools
    .map(normalizeSchoolFeature)
    .filter(Boolean) as GeoJSONFeature[];

  return {
    type: "FeatureCollection",
    features,
  };
}

