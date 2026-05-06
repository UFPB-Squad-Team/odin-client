import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { ChoroplethStats, IndicatorValueExtractor } from "./types";

/**
 * Calcula min/max do indicador no conjunto de features.
 * Retorna null se não houver features com valor válido.
 */
export function computeChoroplethStats(
  collection: GeoJSONFeatureCollection,
  extractor: IndicatorValueExtractor,
): ChoroplethStats | null {
  let min = Infinity;
  let max = -Infinity;
  let count = 0;

  for (const feature of collection.features) {
    const value = extractor(feature.properties as Record<string, unknown>);
    if (value === null || !isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
    count++;
  }

  if (count === 0) return null;
  return { min, max, count };
}

/**
 * Normaliza um valor para [0, 1] dado min/max.
 * Retorna 0.5 se min === max (todos os valores iguais).
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
