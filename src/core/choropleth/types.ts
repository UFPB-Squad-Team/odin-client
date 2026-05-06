/**
 * Tipos do sistema de choropleth do ODIN.
 */

/** Extrai o valor numérico bruto de um indicador a partir das properties de uma feature. */
export type IndicatorValueExtractor = (
  props: Record<string, unknown>,
) => number | null;

/** Resultado do choropleth: mapa de featureId → cor hex. */
export type ChoroplethColors = Map<string, string>;

/** Estatísticas do indicador ativo no conjunto de features. */
export interface ChoroplethStats {
  min: number;
  max: number;
  count: number; // features com valor não-nulo
}
