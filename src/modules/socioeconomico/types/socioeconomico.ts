// Tipos exclusivos do módulo Socioeconômico.
// NÃO redefinir Estado, Municipio, Bairro — esses vêm de @/core/types/territory.

export type SocioeconomicoIndicatorId =
  | "pct_preta_parda"
  | "pct_criancas_0_9"
  | "pct_agua_rede_geral"
  | "pct_esgoto_rede_geral"
  | "taxa_analfabetismo_15_mais"
  | "total_populacao"
  | "pct_lixo_coletado"
  | "pct_idosos_60_mais"
  | "renda_per_capita_media";

// Resposta da API para resumo socioeconômico de município/bairro
export interface SocioeconomicoResumo {
  total_populacao?: number;
  taxa_analfabetismo_15_mais?: number;
  pct_agua_rede_geral?: number;
  pct_esgoto_rede_geral?: number;
  pct_lixo_coletado?: number;
  pct_preta_parda?: number;
  pct_criancas_0_9?: number;
  pct_idosos_60_mais?: number;
  renda_per_capita_media?: number;
  media_moradores_por_domicilio?: number;
}
