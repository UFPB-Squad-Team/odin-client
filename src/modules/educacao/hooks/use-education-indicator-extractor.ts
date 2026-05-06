import type { IndicatorValueExtractor } from "@/core/choropleth/types";

/**
 * Mapa de indicadorId → função extratora de valor.
 * Cada extratora lê as properties de uma GeoJSON feature (que contém geoProps mergeados)
 * e retorna o valor numérico bruto, ou null se ausente.
 *
 * A API retorna os dados em dois formatos:
 * - Flat: `pct_com_internet`, `total_escolas`, etc. (nível raiz das properties)
 * - Aninhado: `educacao.pctComInternet`, `educacao.totalEscolas`, etc.
 * Preferimos o aninhado quando disponível.
 */
const EXTRACTORS: Record<string, IndicatorValueExtractor> = {
  pct_com_internet: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.pctComInternet ?? props.pct_com_internet;
    return toNumber(v);
  },
  pct_com_biblioteca: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.pctComBiblioteca ?? props.pct_com_biblioteca;
    return toNumber(v);
  },
  pct_com_lab_informatica: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.pctComLabInformatica ?? props.pct_com_lab_informatica;
    return toNumber(v);
  },
  pct_sem_acessibilidade: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade;
    return toNumber(v);
  },
  total_matriculas: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.totalMatriculas ?? props.total_alunos;
    return toNumber(v);
  },
  total_escolas: (props) => {
    const edu = props.educacao as Record<string, unknown> | undefined;
    const v = edu?.totalEscolas ?? props.total_escolas;
    return toNumber(v);
  },
  avg_ideb: (props) => toNumber(props.avg_ideb),
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

/**
 * Retorna a função extratora para o indicador informado, ou null se não suportado.
 */
export function extractEducationIndicatorValue(
  indicatorId: string,
): IndicatorValueExtractor | null {
  return EXTRACTORS[indicatorId] ?? null;
}
