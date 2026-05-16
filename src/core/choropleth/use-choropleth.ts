"use client";

import { useMemo } from "react";
import { getModule } from "@/core/registry/module-registry";
import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
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
  activeIndicatorId: string | null;
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
  activeIndicatorId,
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

    const extractor = activeModule.indicatorValueExtractor(activeIndicatorId);
    if (!extractor) return empty;

    const stats = computeChoroplethStats(collection, extractor);
    if (!stats) return empty;

    const featureColors: ChoroplethColors = new Map();

    for (const feature of collection.features) {
      const featureId = resolveFeatureId(feature);
      if (!featureId) continue;

      const raw = extractor(feature.properties as Record<string, unknown>);
      if (raw === null || !isFinite(raw)) continue;

      const normalized = normalizeValue(raw, stats.min, stats.max);
      const style = activeModule.getMapLayerStyle(activeIndicatorId, normalized);
      featureColors.set(featureId, style.color);
    }

    return { featureColors, stats };
  }, [collection, activeModuleId, activeIndicatorId]);
}
