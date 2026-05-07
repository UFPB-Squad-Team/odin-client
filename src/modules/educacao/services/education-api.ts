import type {
  Bairro,
  Escola,
  Estado,
  Municipio,
} from "@/core/types/territory";
import { fetchAllSchools } from "@/core/geospatial/geospatial-api";
import type { SchoolDetail } from "../types/school-detail";
export { fetchSchoolsGeoJSON } from "@/core/geospatial/geospatial-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    const nome = normalizeMunicipioLabel(props, id);
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

async function resolveSchoolDetailId(schoolId: string): Promise<string | null> {
  const schoolsCollection = await fetchAllSchools();
  if (!schoolsCollection) {
    return null;
  }

  const matchedFeature = schoolsCollection.features.find((feature) => {
    const props = feature.properties as Record<string, unknown>;
    const featureId = String(feature.id ?? props.id ?? "").replace(/\.0$/, "");
    const inepId = String(
      props.escola_id_inep ?? props.school_id_inep ?? featureId,
    ).replace(/\.0$/, "");
    return featureId === schoolId || inepId === schoolId;
  });

  if (!matchedFeature) {
    return null;
  }

  return String(matchedFeature.id ?? "").replace(/\.0$/, "") || null;
}

export async function fetchSchoolDetail(
  schoolId: string,
): Promise<SchoolDetail | null> {
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
