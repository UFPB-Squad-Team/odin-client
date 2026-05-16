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
    const edu = education(props);
    const v = edu?.pctComInternet ?? props.pct_com_internet ?? props.pctComInternet;
    return toNumber(v);
  },
  pct_com_biblioteca: (props) => {
    const edu = education(props);
    const v = edu?.pctComBiblioteca ?? props.pct_com_biblioteca ?? props.pctComBiblioteca;
    return toNumber(v);
  },
  pct_com_lab_informatica: (props) => {
    const edu = education(props);
    const v = edu?.pctComLabInformatica ?? props.pct_com_lab_informatica ?? props.pctComLabInformatica;
    return toNumber(v);
  },
  pct_sem_acessibilidade: (props) => {
    const edu = education(props);
    const v = edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade ?? props.pctSemAcessibilidade;
    return toNumber(v);
  },
  total_matriculas: (props) => {
    const edu = education(props);
    const v = edu?.totalMatriculas ?? props.total_alunos ?? props.total_matriculas ?? props.totalMatriculas;
    return toNumber(v);
  },
  total_escolas: (props) => {
    const edu = education(props);
    const v = edu?.totalEscolas ?? props.total_escolas ?? props.totalEscolas;
    return toNumber(v);
  },
  avg_ideb: (props) => toNumber(props.avg_ideb ?? props.avgIdeb),
};

function education(props: Record<string, unknown>): Record<string, unknown> | undefined {
  const geoProps = props.geoProps as Record<string, unknown> | undefined;
  return (
    (props.educacao as Record<string, unknown> | undefined) ??
    (geoProps?.educacao as Record<string, unknown> | undefined)
  );
}

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
