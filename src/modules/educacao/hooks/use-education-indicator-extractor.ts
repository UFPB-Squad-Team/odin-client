import type { IndicatorValueExtractor } from "@/core/choropleth/types";

/**
 * Mapa de indicadorId → função extratora de valor.
 * Cada extratora lê as properties de uma GeoJSON feature e retorna o valor numérico bruto.
 *
 * A API retorna os dados em dois formatos:
 * - Flat: `pct_com_internet`, `total_escolas`, etc. (nível raiz das properties)
 * - Aninhado: `educacao.pctComInternet`, `educacao.totalEscolas`, etc.
 * Preferimos o aninhado quando disponível.
 */
const EXTRACTORS: Record<string, IndicatorValueExtractor> = {
  // Infraestrutura
  pct_com_internet: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComInternet ?? props.pct_com_internet);
  },
  pct_com_internet_alunos: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComInternetAlunos ?? props.pct_com_internet_alunos);
  },
  pct_com_biblioteca: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComBiblioteca ?? props.pct_com_biblioteca);
  },
  pct_com_lab_informatica: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComLaboratorioInformatica ?? edu?.pctComLabInformatica ?? props.pct_com_lab_informatica);
  },
  pct_com_lab_ciencias: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComLaboratorioCiencias ?? props.pct_com_lab_ciencias);
  },
  pct_com_quadra_esportes: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComQuadraEsportes ?? props.pct_com_quadra_esportes);
  },
  pct_com_cozinha: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComCozinha ?? props.pct_com_cozinha);
  },
  pct_com_refeitorio: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComRefeitorio ?? props.pct_com_refeitorio);
  },
  pct_com_agua_potavel: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComAguaPotavel ?? props.pct_com_agua_potavel);
  },
  pct_com_esgoto_rede_publica: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComEsgotoRedePublica ?? props.pct_com_esgoto_rede_publica);
  },
  pct_com_coleta_lixo: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctComColetaLixo ?? props.pct_com_coleta_lixo);
  },
  pct_sem_acessibilidade: (props) => {
    const edu = education(props);
    return toNumber(edu?.pctSemAcessibilidade ?? props.pct_sem_acessibilidade);
  },

  // Quantitativos
  total_matriculas: (props) => {
    const edu = education(props);
    return toNumber(edu?.totalMatriculas ?? props.total_alunos ?? props.total_matriculas);
  },
  total_escolas: (props) => {
    const edu = education(props);
    return toNumber(edu?.totalEscolas ?? props.total_escolas);
  },

  // IDEB
  media_ideb_anos_iniciais: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaIdebAnosIniciais ?? props.media_ideb_anos_iniciais);
  },
  media_ideb_anos_finais: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaIdebAnosFinals ?? edu?.mediaIdebAnosFinais ?? props.media_ideb_anos_finais);
  },
  media_ideb_ensino_medio: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaIdebEnsinoMedio ?? props.media_ideb_ensino_medio);
  },

  // Taxas de aprovação
  media_taxa_aprovacao_ai: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAprovacaoAi ?? props.media_taxa_aprovacao_ai);
  },
  media_taxa_aprovacao_af: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAprovacaoAf ?? props.media_taxa_aprovacao_af);
  },
  media_taxa_aprovacao_em: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAprovacaoEm ?? props.media_taxa_aprovacao_em);
  },

  // Taxas de abandono
  media_taxa_abandono_ai: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAbandonoAi ?? props.media_taxa_abandono_ai);
  },
  media_taxa_abandono_af: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAbandonoAf ?? props.media_taxa_abandono_af);
  },
  media_taxa_abandono_em: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTaxaAbandonoEm ?? props.media_taxa_abandono_em);
  },

  // TDI
  media_tdi_anos_iniciais: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTdiAnosIniciais ?? props.media_tdi_anos_iniciais);
  },
  media_tdi_anos_finais: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTdiAnosFinais ?? props.media_tdi_anos_finais);
  },
  media_tdi_ensino_medio: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaTdiEnsinoMedio ?? props.media_tdi_ensino_medio);
  },

  // Docentes com superior
  media_docentes_superior_ai: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaDocentesSuperiorAi ?? props.media_docentes_superior_ai);
  },
  media_docentes_superior_af: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaDocentesSuperiorAf ?? props.media_docentes_superior_af);
  },
  media_docentes_superior_em: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaDocentesSuperiorEm ?? props.media_docentes_superior_em);
  },

  // Horas-aula
  media_horas_aula_ai: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaHorasAulaAi ?? props.media_horas_aula_ai);
  },
  media_horas_aula_af: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaHorasAulaAf ?? props.media_horas_aula_af);
  },
  media_horas_aula_em: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaHorasAulaEm ?? props.media_horas_aula_em);
  },

  // Alunos por turma
  media_alunos_turma_ai: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaAlunosTurmaAi ?? props.media_alunos_turma_ai);
  },
  media_alunos_turma_af: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaAlunosTurmaAf ?? props.media_alunos_turma_af);
  },
  media_alunos_turma_em: (props) => {
    const edu = education(props);
    return toNumber(edu?.mediaAlunosTurmaEm ?? props.media_alunos_turma_em);
  },
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
