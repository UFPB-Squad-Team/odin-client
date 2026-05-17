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
  | "renda_per_capita_media"
  | "pct_jovens_15_29"
  | "pct_adultos_30_59"
  | "pct_pop_masculina"
  | "pct_pop_feminina"
  | "pct_branca"
  | "pct_indigena"
  | "pct_agua_nao_encanada"
  | "pct_dom_sem_banheiro"
  | "pct_dom_unipessoal"
  | "pct_dom_tipo_casa"
  | "pct_dom_tipo_apto"
  | "pct_dom_degradado"
  | "total_domicilios";

// Resposta da API para resumo socioeconômico de município/bairro
export interface SocioeconomicoResumo {
  total_populacao?: number;
  total_domicilios?: number;
  taxa_analfabetismo_15_mais?: number;
  pct_agua_rede_geral?: number;
  pct_esgoto_rede_geral?: number;
  pct_lixo_coletado?: number;
  pct_agua_nao_encanada?: number;
  pct_dom_sem_banheiro?: number;
  pct_preta_parda?: number;
  pct_branca?: number;
  pct_indigena?: number;
  pct_criancas_0_9?: number;
  pct_idosos_60_mais?: number;
  pct_jovens_15_29?: number;
  pct_adultos_30_59?: number;
  pct_pop_masculina?: number;
  pct_pop_feminina?: number;
  pct_dom_unipessoal?: number;
  pct_dom_tipo_casa?: number;
  pct_dom_tipo_apto?: number;
  pct_dom_degradado?: number;
  renda_per_capita_media?: number;
  media_moradores_por_domicilio?: number;
}
