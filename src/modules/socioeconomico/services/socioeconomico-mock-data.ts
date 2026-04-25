import type { SocioeconomicoResumo } from "@/modules/socioeconomico/types/socioeconomico";

// Mock de dados socioeconômicos por município (IBGE Censo 2022)
export const MOCK_SOCIOECONOMICO_MUNICIPIOS: Record<string, SocioeconomicoResumo> = {
  jp: {
    total_populacao: 817511,
    taxa_analfabetismo_15_mais: 4.2,
    pct_agua_rede_geral: 91.3,
    pct_esgoto_rede_geral: 72.1,
    pct_lixo_coletado: 96.8,
    pct_preta_parda: 68.4,
    pct_criancas_0_9: 11.2,
    pct_idosos_60_mais: 14.8,
    renda_per_capita_media: 1842.5,
    media_moradores_por_domicilio: 2.9,
  },
  cg: {
    total_populacao: 422000,
    taxa_analfabetismo_15_mais: 6.8,
    pct_agua_rede_geral: 84.7,
    pct_esgoto_rede_geral: 58.3,
    pct_lixo_coletado: 93.2,
    pct_preta_parda: 71.2,
    pct_criancas_0_9: 12.8,
    pct_idosos_60_mais: 13.1,
    renda_per_capita_media: 1423.0,
    media_moradores_por_domicilio: 3.1,
  },
  rec: {
    total_populacao: 1653461,
    taxa_analfabetismo_15_mais: 5.1,
    pct_agua_rede_geral: 88.9,
    pct_esgoto_rede_geral: 65.4,
    pct_lixo_coletado: 95.1,
    pct_preta_parda: 72.8,
    pct_criancas_0_9: 10.9,
    pct_idosos_60_mais: 15.2,
    renda_per_capita_media: 1956.0,
    media_moradores_por_domicilio: 2.8,
  },
  for: {
    total_populacao: 2703391,
    taxa_analfabetismo_15_mais: 4.9,
    pct_agua_rede_geral: 90.1,
    pct_esgoto_rede_geral: 68.7,
    pct_lixo_coletado: 94.6,
    pct_preta_parda: 70.1,
    pct_criancas_0_9: 11.5,
    pct_idosos_60_mais: 13.9,
    renda_per_capita_media: 1788.0,
    media_moradores_por_domicilio: 3.0,
  },
};

export function getMockSocioeconomicoMunicipio(
  municipioId: string,
): SocioeconomicoResumo | null {
  return MOCK_SOCIOECONOMICO_MUNICIPIOS[municipioId] ?? null;
}
