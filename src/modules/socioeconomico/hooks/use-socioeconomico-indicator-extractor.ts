import type { IndicatorValueExtractor } from "@/core/choropleth/types";

/**
 * Extratores de valor para indicadores socioeconômicos.
 * Lê de `geoProps.socioeconomico.*` (estrutura aninhada da API).
 */
const EXTRACTORS: Record<string, IndicatorValueExtractor> = {
  pct_preta_parda: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.raca as Record<string, unknown> | undefined)?.pctPretaParda,
    );
  },
  taxa_analfabetismo_15_mais: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.educacaoPopulacao as Record<string, unknown> | undefined)
        ?.taxaAnalfabetismo15Mais,
    );
  },
  pct_agua_rede_geral: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctAguaRedeGeral,
    );
  },
  pct_esgoto_rede_geral: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)
        ?.pctEsgotoRedeGeral,
    );
  },
  pct_lixo_coletado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.saneamento as Record<string, unknown> | undefined)?.pctLixoColetado,
    );
  },
  total_populacao: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.populacao as Record<string, unknown> | undefined)?.total,
    );
  },
  pct_criancas_0_9: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctCriancas0a9,
    );
  },
  pct_idosos_60_mais: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.estruturaEtaria as Record<string, unknown> | undefined)
        ?.pctIdosos60Mais,
    );
  },
  pct_dom_superlotado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomSuperlotado,
    );
  },
  pct_dom_improvisado: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.habitacao as Record<string, unknown> | undefined)?.pctDomImprovisado,
    );
  },
  pct_responsavel_feminino: (props) => {
    const s = socio(props);
    return toNumber(
      (s?.familia as Record<string, unknown> | undefined)
        ?.pctResponsavelFeminino,
    );
  },
};

function socio(
  props: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return props.socioeconomico as Record<string, unknown> | undefined;
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
