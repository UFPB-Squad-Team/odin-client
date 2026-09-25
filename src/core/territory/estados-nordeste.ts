import type { Estado } from "@/core/types/territory";

/**
 * Escopo territorial do ODIN: os 9 estados do Nordeste brasileiro.
 *
 * Este arquivo é a ÚNICA fonte de verdade para siglas, nomes, código IBGE e
 * enquadramento de mapa dos estados cobertos pela plataforma. Qualquer novo
 * estado deve ser adicionado aqui — os consumidores (sidebar, hooks de filtro,
 * camadas do mapa e mocks) derivam tudo deste módulo.
 */

/**
 * Identificador canônico do estado: UF em minúsculas.
 * É o valor usado em `Estado.id`, no filtro em cascata e na query string
 * compartilhável (`?estado=pb`).
 */
export type EstadoId =
  | "al"
  | "ba"
  | "ce"
  | "ma"
  | "pb"
  | "pe"
  | "pi"
  | "rn"
  | "se";

/** Sigla oficial em caixa alta (`"PB"`), usada em contratos com a API/IBGE. */
export type EstadoUf = Uppercase<EstadoId>;

export type EstadoViewport = {
  latitude: number;
  longitude: number;
  zoom: number;
};

/**
 * Lista canônica dos estados do Nordeste.
 * Ordenada alfabeticamente por nome — é a ordem exibida no seletor da sidebar.
 */
export const NORDESTE_ESTADOS: Estado[] = [
  { id: "al", nome: "Alagoas", sigla: "AL" },
  { id: "ba", nome: "Bahia", sigla: "BA" },
  { id: "ce", nome: "Ceará", sigla: "CE" },
  { id: "ma", nome: "Maranhão", sigla: "MA" },
  { id: "pb", nome: "Paraíba", sigla: "PB" },
  { id: "pe", nome: "Pernambuco", sigla: "PE" },
  { id: "pi", nome: "Piauí", sigla: "PI" },
  { id: "rn", nome: "Rio Grande do Norte", sigla: "RN" },
  { id: "se", nome: "Sergipe", sigla: "SE" },
];

export const NORDESTE_IDS: EstadoId[] = NORDESTE_ESTADOS.map(
  (estado) => estado.id as EstadoId,
);

export const NORDESTE_UFS: EstadoUf[] = NORDESTE_ESTADOS.map(
  (estado) => estado.sigla as EstadoUf,
);

export const NORDESTE_ID_SET: ReadonlySet<string> = new Set(NORDESTE_IDS);

/**
 * Estado selecionado por padrão quando nenhum filtro é informado.
 * Mantém o foco do MVP (Paraíba) enquanto a lista já cobre todo o Nordeste.
 * `DEFAULT_ESTADO_ID` e `DEFAULT_ESTADO_UF` devem apontar para o mesmo estado.
 */
export const DEFAULT_ESTADO_ID: EstadoId = "pb";
export const DEFAULT_ESTADO_UF: EstadoUf = "PB";

/** Códigos IBGE (UF) usados para acessar malhas e recortes oficiais. */
export const UF_TO_IBGE_STATE_CODE: Record<EstadoId, string> = {
  al: "27",
  ba: "29",
  ce: "23",
  ma: "21",
  pb: "25",
  pe: "26",
  pi: "22",
  rn: "24",
  se: "28",
};

export const IBGE_STATE_CODE_TO_ID: Record<string, EstadoId> = Object.fromEntries(
  (Object.entries(UF_TO_IBGE_STATE_CODE) as Array<[EstadoId, string]>).map(
    ([id, code]) => [code, id],
  ),
) as Record<string, EstadoId>;

/**
 * Enquadramento de visão geral (todos os estados do Nordeste).
 * Usado como view default da camada de municípios — o mapa abre na região e
 * faz pan para o estado escolhido no filtro.
 */
export const NORDESTE_VIEWPORT: EstadoViewport = {
  latitude: -8.4,
  longitude: -38.6,
  zoom: 4.9,
};

/** Enquadramento por estado: centroides aproximados + zoom de visão estadual. */
export const ESTADO_VIEWPORTS: Record<EstadoId, EstadoViewport> = {
  al: { latitude: -9.62, longitude: -36.63, zoom: 7.3 },
  ba: { latitude: -12.6, longitude: -41.7, zoom: 5.7 },
  ce: { latitude: -5.5, longitude: -39.6, zoom: 6.5 },
  ma: { latitude: -5.0, longitude: -45.3, zoom: 5.9 },
  pb: { latitude: -7.15, longitude: -36.7, zoom: 7.3 },
  pe: { latitude: -8.3, longitude: -37.9, zoom: 7.0 },
  pi: { latitude: -7.4, longitude: -42.7, zoom: 6.1 },
  rn: { latitude: -5.8, longitude: -36.6, zoom: 7.4 },
  se: { latitude: -10.6, longitude: -37.4, zoom: 7.8 },
};

/** Nome do estado sem acentos e sem espaços → id (usado no match por nome). */
const ESTADO_NAME_TO_ID: Record<string, EstadoId> = {
  alagoas: "al",
  bahia: "ba",
  ceara: "ce",
  maranhao: "ma",
  paraiba: "pb",
  pernambuco: "pe",
  piaui: "pi",
  riograndedonorte: "rn",
  sergipe: "se",
};

function stripAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function isEstadoId(value: string | null | undefined): value is EstadoId {
  return typeof value === "string" && NORDESTE_ID_SET.has(value.toLowerCase());
}

/**
 * Normaliza qualquer representação do estado para o `EstadoId` canônico
 * (minúsculas). Aceita `"PB"`, `"pb"`, `"25"` (código IBGE) ou o nome completo
 * (`"Paraíba"`, `"paraiba"`, `"Rio Grande do Norte"`).
 * Retorna `null` quando o valor não corresponde a um estado do Nordeste.
 */
export function normalizeEstadoId(
  estado: string | null | undefined,
): EstadoId | null {
  if (estado === null || estado === undefined) return null;

  const trimmed = String(estado).trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (isEstadoId(lower)) return lower;
  if (IBGE_STATE_CODE_TO_ID[lower]) return IBGE_STATE_CODE_TO_ID[lower];

  return ESTADO_NAME_TO_ID[stripAccents(trimmed)] ?? null;
}

/** Viewport do estado informado; cai na visão geral do Nordeste se inválido. */
export function getEstadoViewport(estado: string | null | undefined): EstadoViewport {
  const estadoId = normalizeEstadoId(estado);
  return estadoId ? ESTADO_VIEWPORTS[estadoId] : NORDESTE_VIEWPORT;
}

/** Rótulo exibido no seletor: `Paraíba (PB)`. */
export function formatEstadoLabel(estado: Estado) {
  return `${estado.nome} (${estado.sigla})`;
}

/**
 * Define o estado selecionado na inicialização, priorizando
 * {@link DEFAULT_ESTADO_ID} e caindo no primeiro estado disponível.
 */
export function resolveDefaultEstadoId(estados: Estado[]): string | null {
  if (estados.length === 0) return null;

  const preferred = estados.find(
    (estado) => estado.id.toLowerCase() === DEFAULT_ESTADO_ID,
  );

  return preferred?.id ?? estados[0].id;
}
