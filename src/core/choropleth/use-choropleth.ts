"use client";

import { useMemo } from "react";
import { getModule } from "@/core/registry/module-registry";
import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";
import { computeChoroplethStats, normalizeValue } from "./normalize";
import type { ChoroplethColors } from "./types";

type GeoJSONFeature = GeoJSONFeatureCollection["features"][number];

function normalizeFeatureId(value: unknown): string {
  return String(value ?? "").replace(/\.0$/, "").trim();
}

function resolveFeatureId(feature: GeoJSONFeature): string {
  const props = feature.properties as Record<string, unknown>;
  return normalizeFeatureId(
    feature.id ??
      props.id ??
      props.codarea ??
      props.municipioIdIbge ??
      props.municipio_id_ibge ??
      props.escola_id_inep ??
      props.inep ??
      props.codigo ??
      props.cod ??
      "",
  );
}

interface UseChoroplethArgs {
  collection: GeoJSONFeatureCollection | null;
  activeModuleId: string | null;
  activeLayer: ObservatoryLayer | null;
  activeIndicatorId: string | null;
  simplifiedView?: boolean;
}

interface UseChoroplethResult {
  /** featureId → cor hex. Vazio quando não há indicador ativo. */
  featureColors: ChoroplethColors;
  /** Estatísticas do indicador ativo (min, max, count). */
  stats: { min: number; max: number; count: number } | null;
}

/**
 * Calcula as cores do choropleth para o indicador ativo do módulo ativo.
 *
 * Fluxo:
 * 1. Obtém o módulo ativo via registry
 * 2. Usa `indicatorValueExtractor` do módulo para extrair o valor de cada feature
 * 3. Normaliza min/max no conjunto
 * 4. Chama `getMapLayerStyle(indicatorId, normalizedValue)` para obter a cor
 * 5. Retorna Map<featureId, cor>
 */
export function useChoropleth({
  collection,
  activeModuleId,
  activeLayer,
  activeIndicatorId,
  simplifiedView = false,
}: UseChoroplethArgs): UseChoroplethResult {
  return useMemo(() => {
    const empty: UseChoroplethResult = {
      featureColors: new Map(),
      stats: null,
    };

    if (!collection || !activeModuleId || !activeIndicatorId) return empty;

    const activeModule = getModule(activeModuleId);
    if (!activeModule?.indicatorValueExtractor || !activeModule?.getMapLayerStyle)
      return empty;

    const indicator = activeLayer
      ? activeModule.getIndicators?.(activeLayer)?.find((item) => item.id === activeIndicatorId)
      : undefined;
    const higherIsBetter = indicator?.higherIsBetter ?? true;
    const comparisonMode = indicator?.comparisonMode ?? "directional";

    const extractor = activeModule.indicatorValueExtractor(activeIndicatorId);
    if (!extractor) return empty;

    const stats = computeChoroplethStats(collection, extractor);
    if (!stats) return empty;

    const featureColors: ChoroplethColors = new Map();
    const simplifiedPalette = {
      critical: "#ea580c",
      attention: "#facc15",
      good: "#0f766e",
    };

    for (const feature of collection.features) {
      const featureId = resolveFeatureId(feature);
      if (!featureId) continue;

      const raw = extractor(feature.properties as Record<string, unknown>);
      if (raw === null || !isFinite(raw)) continue;

      const normalized = normalizeValue(raw, stats.min, stats.max);
      if (simplifiedView) {
        const performanceValue =
          comparisonMode === "relative"
            ? normalized
            : higherIsBetter
              ? normalized
              : 1 - normalized;
        const color =
          performanceValue >= 0.67
            ? simplifiedPalette.good
            : performanceValue >= 0.34
              ? simplifiedPalette.attention
              : simplifiedPalette.critical;
        featureColors.set(featureId, color);
        continue;
      }

      const style = activeModule.getMapLayerStyle(activeIndicatorId, normalized);
      featureColors.set(featureId, style.color);
    }

    return { featureColors, stats };
  }, [collection, activeLayer, activeModuleId, activeIndicatorId, simplifiedView]);
}
