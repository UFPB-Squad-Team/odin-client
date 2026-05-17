import type { IndicatorValueExtractor } from "@/core/choropleth/types";

/**
 * Extratores de valor para indicadores socioeconômicos.
 * Lê de `geoProps.socioeconomico.*` (estrutura aninhada da API).
 */
const EXTRACTORS: Record<string, IndicatorValueExtractor> = {
  pct_preta_parda: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.raca as Record<string, unknown> | undefined)?.pctPretaParda ??
        props.pct_preta_parda ??
        props.pctPretaParda,
    );
  },
  pct_branca: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.raca as Record<string, unknown> | undefined)?.pctBranca ??
        props.pct_branca ??
        props.pctBranca,
    );
  },
  pct_indigena: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.raca as Record<string, unknown> | undefined)?.pctIndigena ??
        props.pct_indigena ??
        props.pctIndigena,
    );
  },
  taxa_analfabetismo_15_mais: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.educacaoPopulacao as Record<string, unknown> | undefined)
        ?.taxaAnalfabetismo15Mais ??
        props.taxa_analfabetismo_15_mais ??
        props.taxaAnalfabetismo15Mais,
    );
  },
  pct_agua_rede_geral: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctAguaRedeGeral ??
        props.pct_agua_rede_geral ??
        props.pctAguaRedeGeral,
    );
  },
  pct_esgoto_rede_geral: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)
        ?.pctEsgotoRedeGeral ??
        props.pct_esgoto_rede_geral ??
        props.pctEsgotoRedeGeral,
    );
  },
  pct_lixo_coletado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctLixoColetado ??
        props.pct_lixo_coletado ??
        props.pctLixoColetado,
    );
  },
  pct_agua_inadequada: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctAguaInadequada ??
        props.pct_agua_inadequada ??
        props.pctAguaInadequada,
    );
  },
  pct_esgoto_inadequado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctEsgotoInadequado ??
        props.pct_esgoto_inadequado ??
        props.pctEsgotoInadequado,
    );
  },
  pct_lixo_inadequado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctLixoInadequado ??
        props.pct_lixo_inadequado ??
        props.pctLixoInadequado,
    );
  },
  pct_agua_nao_encanada: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctAguaNaoEncanada ??
        props.pct_agua_nao_encanada ??
        props.pctAguaNaoEncanada,
    );
  },
  pct_dom_sem_banheiro: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctDomSemBanheiro ??
        props.pct_dom_sem_banheiro ??
        props.pctDomSemBanheiro,
    );
  },
  total_populacao: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.populacao as Record<string, unknown> | undefined)?.total ??
        props.total_populacao ??
        props.totalPopulacao,
    );
  },
  total_domicilios: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.populacao as Record<string, unknown> | undefined)?.totalDomicilios ??
        props.total_domicilios ??
        props.totalDomicilios,
    );
  },
  pct_criancas_0_9: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctCriancas0a9 ??
        props.pct_criancas_0_9 ??
        props.pctCriancas0a9,
    );
  },
  pct_idosos_60_mais: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctIdosos60Mais ??
        props.pct_idosos_60_mais ??
        props.pctIdosos60Mais,
    );
  },
  pct_jovens_15_29: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctJovens15a29 ??
        props.pct_jovens_15_29 ??
        props.pctJovens15a29,
    );
  },
  pct_adultos_30_59: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctAdultos30a59 ??
        props.pct_adultos_30_59 ??
        props.pctAdultos30a59,
    );
  },
  pct_pop_masculina: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.genero as Record<string, unknown> | undefined)?.pctPopMasculina ??
        props.pct_pop_masculina ??
        props.pctPopMasculina,
    );
  },
  pct_pop_feminina: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.genero as Record<string, unknown> | undefined)?.pctPopFeminina ??
        props.pct_pop_feminina ??
        props.pctPopFeminina,
    );
  },
  pct_dom_superlotado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomSuperlotado ??
        props.pct_dom_superlotado ??
        props.pctDomSuperlotado,
    );
  },
  pct_dom_improvisado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomImprovisado ??
        props.pct_dom_improvisado ??
        props.pctDomImprovisado,
    );
  },
  pct_dom_unipessoal: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomUnipessoal ??
        props.pct_dom_unipessoal ??
        props.pctDomUnipessoal,
    );
  },
  pct_dom_tipo_casa: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomTipoCasa ??
        props.pct_dom_tipo_casa ??
        props.pctDomTipoCasa,
    );
  },
  pct_dom_tipo_apto: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomTipoApto ??
        props.pct_dom_tipo_apto ??
        props.pctDomTipoApto,
    );
  },
  pct_dom_degradado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomDegradado ??
        props.pct_dom_degradado ??
        props.pctDomDegradado,
    );
  },
  pct_responsavel_feminino: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.familia as Record<string, unknown> | undefined)
        ?.pctResponsavelFeminino ??
        props.pct_responsavel_feminino ??
        props.pctResponsavelFeminino,
    );
  },
};

function socio(
  props: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const geoProps = props.geoProps as Record<string, unknown> | undefined;
  return (
    (props.socioeconomico as Record<string, unknown> | undefined) ??
    (geoProps?.socioeconomico as Record<string, unknown> | undefined)
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

export function extractSocioeconomicoIndicatorValue(
  indicatorId: string,
): IndicatorValueExtractor | null {
  return EXTRACTORS[indicatorId] ?? null;
}
