import type {
  Bairro,
  Escola,
  Estado,
  Municipio,
} from "@/core/types/territory";
import { fetchAllSchools } from "@/core/geospatial/geospatial-api";
import { listBairros as listBairrosFromTerritory } from "@/core/territory/territory-api";
import type { SchoolDetail } from "../types/school-detail";
export { fetchSchoolsGeoJSON } from "@/core/geospatial/geospatial-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const PAGE_SIZE = 10;

function normalizeMunicipioLabel(
  props: Record<string, unknown>,
  fallbackId: string,
) {
  return String(
    props.municipio ??
      props.nome ??
      props.name ??
      props.description ??
      fallbackId,
  );
}

export async function listEstados(): Promise<Estado[]> {
  return [
    { id: "pb", nome: "Paraíba", sigla: "PB" },
    { id: "pe", nome: "Pernambuco", sigla: "PE" },
    { id: "ce", nome: "Ceará", sigla: "CE" },
  ];
}

export async function listMunicipios(estadoId: string): Promise<Municipio[]> {
  if (!API_BASE_URL) return [];

  const sgUf = estadoId.toUpperCase();
  const response = await fetch(`${API_BASE_URL}/aggregations/cities?sg_uf=${sgUf}`);
  if (!response.ok) throw new Error("aggregations/cities indisponível");

  const geojson = await response.json() as {
    features: Array<{ properties: Record<string, unknown>; id?: string }>;
  };

  return geojson.features
    .map((feature) => {
      const props = feature.properties;
      const rawId = String(props.municipioIdIbge ?? props.co_municipio ?? feature.id ?? "");
      const id = rawId.replace(/\.0$/, "");
      const nome = normalizeMunicipioLabel(props, id);
      const uf = String(props.uf ?? props.sg_uf ?? estadoId).toLowerCase();
      return { id, nome, estadoId: uf, geoProps: props };
    })
    .filter((m) => m.id && m.nome);
}

export async function listBairros(municipioId: string): Promise<Bairro[]> {
  return listBairrosFromTerritory(municipioId);
}

export async function listEscolasByBairro(bairroId: string): Promise<Escola[]> {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/escolas?bairro_id=${bairroId}`);
  if (!response.ok) throw new Error("escolas indisponível");
  return (await response.json()) as Escola[];
}

export type SchoolListItem = {
  bairro?: string;
  dependencia?: string;
  dependencia_adm?: string;
  escola_id_inep?: string | number;
  escola_nome?: string;
  id?: string | number;
  ideb?: number | string | null;
  inep?: string | number | null;
  latitude?: number | string | null;
  localizacao?: {
    coordinates?: [number, number];
    type?: string;
  } | null;
  longitude?: number | string | null;
  municipioIdIbge?: string | number;
  municipio_id_ibge?: string | number;
  municipio_nome?: string;
  nome?: string;
  tipo_localizacao?: string;
  zona?: string;
  zonaLocalizacao?: string;
  [key: string]: unknown;
};

export type SchoolsPageResponse = {
  page?: number;
  page_size?: number;
  schools?: SchoolListItem[];
  total_items?: number;
  total_pages?: number;
  next_cursor?: string | null;
};

export type SchoolsPage = {
  schools: Escola[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  failed: boolean;
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSchoolListItem(item: SchoolListItem): Escola | null {
  const rawId = String(item.id ?? item.escola_id_inep ?? item.inep ?? "").replace(/\.0$/, "");
  if (!rawId) return null;

  const escolaNome = String(item.escola_nome ?? item.nome ?? rawId);

  return {
    id: rawId,
    inepId: String(item.escola_id_inep ?? item.inep ?? rawId).replace(/\.0$/, ""),
    nome: escolaNome,
    bairroId: String(item.bairro ?? rawId),
    bairroNome: item.bairro != null ? String(item.bairro) : undefined,
    municipioId:
      item.municipioIdIbge != null
        ? String(item.municipioIdIbge).replace(/\.0$/, "")
        : item.municipio_id_ibge != null
          ? String(item.municipio_id_ibge).replace(/\.0$/, "")
          : undefined,
    municipioNome: item.municipio_nome != null ? String(item.municipio_nome) : undefined,
    dependenciaAdministrativa:
      item.dependencia_adm != null
        ? String(item.dependencia_adm)
        : item.dependencia != null
          ? String(item.dependencia)
          : undefined,
    dependencia_adm:
      item.dependencia_adm != null
        ? String(item.dependencia_adm)
        : item.dependencia != null
          ? String(item.dependencia)
          : undefined,
    tipoLocalizacao:
      item.tipo_localizacao != null
        ? String(item.tipo_localizacao)
        : item.zona != null
          ? String(item.zona)
          : item.zonaLocalizacao != null
            ? String(item.zonaLocalizacao)
            : undefined,
    tipo_localizacao:
      item.tipo_localizacao != null
        ? String(item.tipo_localizacao)
        : item.zona != null
          ? String(item.zona)
          : item.zonaLocalizacao != null
            ? String(item.zonaLocalizacao)
            : undefined,
    ideb: toNumber(item.ideb) ?? undefined,
    inse: undefined,
    geoProps: item as Record<string, unknown>,
  };
}

async function fetchSchoolsPageRaw(
  municipioId: string,
  page: number,
): Promise<{ payload: SchoolsPageResponse | null; failed: boolean }> {
  try {
    const url = `${API_BASE_URL}/schools?page=${page}&page_size=${PAGE_SIZE}&municipio_id=${municipioId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[fetchSchoolsPageRaw] HTTP ${response.status} página ${page} município ${municipioId}`);
      return { payload: null, failed: true };
    }

    const payload = (await response.json()) as SchoolsPageResponse;
    return { payload, failed: false };
  } catch (err) {
    console.warn(`[fetchSchoolsPageRaw] Erro na página ${page}:`, err);
    return { payload: null, failed: true };
  }
}

export async function fetchEscolasByMunicipioPage(
  municipioId: string,
  page: number,
): Promise<SchoolsPage> {
  const empty: SchoolsPage = {
    schools: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: page,
    pageSize: PAGE_SIZE,
    failed: false,
  };

  if (!API_BASE_URL) return empty;

  const { payload, failed } = await fetchSchoolsPageRaw(municipioId, page);

  if (failed || !payload) {
    return {
      ...empty,
      failed: true,
      currentPage: page,
    };
  }

  const rawSchools = payload.schools ?? [];
  const schools = rawSchools.map(normalizeSchoolListItem).filter(Boolean) as Escola[];

  const totalItems = payload.total_items ?? schools.length;
  const totalPages =
    payload.total_pages ?? (totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0);

  return {
    schools: schools.sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true }),
    ),
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: PAGE_SIZE,
    failed: false,
  };
}

export async function listEscolasByMunicipio(municipioId: string): Promise<Escola[]> {
  if (!API_BASE_URL) return [];

  const schools: Escola[] = [];

  const firstPage = await fetchEscolasByMunicipioPage(municipioId, 1);
  if (firstPage.failed) return schools;

  schools.push(...firstPage.schools);

  if (firstPage.totalPages <= 1) return schools;

  const CONCURRENCY = 3;
  const remaining = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2);

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((p) => fetchEscolasByMunicipioPage(municipioId, p)),
    );
    for (const result of results) {
      if (!result.failed) {
        schools.push(...result.schools);
      }
    }
  }

  return schools.sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true }),
  );
}

async function resolveSchoolDetailId(schoolId: string): Promise<string | null> {
  const schoolsCollection = await fetchAllSchools();
  if (!schoolsCollection) return null;

  const matchedFeature = schoolsCollection.features.find((feature) => {
    const props = feature.properties as Record<string, unknown>;
    const featureId = String(feature.id ?? props.id ?? "").replace(/\.0$/, "");
    const inepId = String(
      props.escola_id_inep ?? props.school_id_inep ?? featureId,
    ).replace(/\.0$/, "");
    return featureId === schoolId || inepId === schoolId;
  });

  if (!matchedFeature) return null;

  return String(matchedFeature.id ?? "").replace(/\.0$/, "") || null;
}

export async function fetchSchoolDetail(schoolId: string): Promise<SchoolDetail | null> {
  if (!API_BASE_URL) return null;

  const directResponse = await fetch(`${API_BASE_URL}/${schoolId}`);
  if (directResponse.ok) {
    return (await directResponse.json()) as SchoolDetail;
  }

  const resolvedSchoolId = await resolveSchoolDetailId(schoolId);
  if (!resolvedSchoolId || resolvedSchoolId === schoolId) return null;

  const response = await fetch(`${API_BASE_URL}/${resolvedSchoolId}`);
  if (!response.ok) return null;

  return (await response.json()) as SchoolDetail;
}