import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
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

export type SchoolDetail = {
  id: string;
  escola_nome: string;
  municipio_nome: string;
  estado_sigla: string;
  dependencia_adm: string;
  tipo_localizacao: string;
  localizacao?: { type: string; coordinates: [number, number] };
  endereco?: {
    bairro: string;
    logradouro: string;
    numero?: string;
    municipio: string;
    uf: string;
    cep?: string;
  };
  indicadores?: {
    anoReferencia: number;
    totalAlunos?: number;
    educacaoInfantil?: Record<string, number | null>;
    fundamentalAnosIniciais?: Record<string, number | null>;
    fundamentalAnosFinais?: Record<string, number | null>;
    ensinoMedio?: Record<string, number | null>;
  };
  infraestrutura?: {
    possuiAcessibilidadePcd?: boolean;
    possuiAguaPotavel?: boolean;
    possuiBiblioteca?: boolean;
    possuiColetaLixo?: boolean;
    possuiCozinha?: boolean;
    possuiEnergiaPublica?: boolean;
    possuiEsgotoRedePublica?: boolean;
    possuiLaboratorioCiencias?: boolean;
    possuiLaboratorioInformatica?: boolean;
    possuiPatioCoberto?: boolean;
    possuiPatioDescoberto?: boolean;
    possuiPiscina?: boolean;
    possuiQuadraEsportes?: boolean;
    possuiRefeitorio?: boolean;
    equipamentos?: Record<string, boolean>;
    internet?: {
      internetAdministrativa?: boolean;
      internetParaAlunos?: boolean;
      possuiInternet?: boolean;
    };
    salas?: {
      acessiveis?: number;
      climatizadas?: number;
      utilizadas?: number;
    };
  };
};

/**
 * Busca detalhes completos de uma escola.
 * GET /api/v1/{school_id}  (path sem prefixo schools/ por ora — bug conhecido do backend)
 */
export async function fetchSchoolDetail(
  schoolId: string,
): Promise<SchoolDetail | null> {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/${schoolId}`);

  if (!response.ok) return null;

  return (await response.json()) as SchoolDetail;
}
