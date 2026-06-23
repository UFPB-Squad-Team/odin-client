/**
 * Tipos centrais para o sistema de comparação do ODIN.
 * Define conceitos de segmentação por nível de ensino e esfera administrativa,
 * além de estruturas para pesos contextuais de indicadores e thresholds fixos.
 */

/** Níveis de ensino considerados no sistema educacional brasileiro. */
export type EnsinoLevel = "infantil" | "fundamental" | "medio" | "superior" | "todas";

/** Esferas administrativas de responsabilidade pela oferta educacional. */
export type DependenciaAdministrativa =
  | "municipal"
  | "estadual"
  | "federal"
  | "privada";

/**
 * Define como o peso de um indicador varia conforme o contexto de análise.
 * Exemplo: "parquinho" tem peso 1.5 para ensino infantil e 0.3 para ensino médio.
 */
export interface IndicadorPesoContexto {
  /** Peso multiplicador aplicado ao valor normalizado do indicador neste contexto. */
  peso: number;
  /** Se true, o indicador é irrelevante neste contexto (não aparece na comparação). */
  irrelevante?: boolean;
}

/**
 * Threshold fixo para a régua de cores na visão simplificada.
 * Substitui a escala dinâmica min-max por faixas pré-definidas.
 */
export interface ThresholdCor {
  /** Valor mínimo do intervalo (inclusive). Em percentual (0-100) ou valor bruto. */
  min: number;
  /** Valor máximo do intervalo (exclusive). */
  max: number;
  /** Cor hexadecimal associada a esta faixa. */
  cor: string;
  /** Rótulo exibido na régua (ex: "Crítico", "Atenção", "Bom"). */
  rotulo: string;
}

/**
 * Configuração para exibição de disclaimer quando dados não são oficiais.
 * Exemplo: municípios sem bairros oficiais usam setores censitários.
 */
export interface DisclaimerConfig {
  /** Título do disclaimer. */
  titulo: string;
  /** Mensagem explicativa. */
  mensagem: string;
  /** Tipo de severidade visual (info, warning, critical). */
  severidade: "info" | "warning" | "critical";
}

/**
 * Mapa de pesos contextuais para um indicador.
 * Chave: identificador do contexto (ex: "infantil", "fundamental", "municipal", "privada").
 * Valor: configuração de peso para aquele contexto.
 */
export type MapaPesosContextuais = Map<string, IndicadorPesoContexto>;