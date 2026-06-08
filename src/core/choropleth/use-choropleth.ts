"use client";

import { useMemo } from "react";
import { getModule } from "@/core/registry/module-registry";
import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";
import { computeChoroplethStats, normalizeValue } from "./normalize";
import type { ChoroplethColors } from "./types";
import type { ThresholdCor } from "@/core/types/comparision";

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
  /** Thresholds usados na visão simplificada (para renderizar a régua). */
  activeThresholds: ThresholdCor[] | null;
}

/**
 * Determina a cor com base em thresholds fixos (visão simplificada).
 */
function resolveThresholdColor(
  value: number,
  thresholds: ThresholdCor[],
  higherIsBetter: boolean,
  forceHigherIsBetter: boolean,
): string | null {
  const effectiveValue = (!higherIsBetter && forceHigherIsBetter)
    ? 100 - value 
    : value;

  for (const threshold of thresholds) {
    if (effectiveValue >= threshold.min && effectiveValue < threshold.max) {
      return threshold.cor;
    }
  }

  return thresholds[thresholds.length - 1]?.cor ?? "#6b7280";
}

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
      activeThresholds: null,
    };

    if (!collection || !activeModuleId || !activeIndicatorId) return empty;

    const activeModule = getModule(activeModuleId);
    if (!activeModule?.indicatorValueExtractor || !activeModule?.getMapLayerStyle)
      return empty;

    const indicator = activeLayer
      ? activeModule.getIndicators?.(activeLayer)?.find((item) => item.id === activeIndicatorId)
      : undefined;
    const higherIsBetter = indicator?.higherIsBetter ?? true;
    const forceHigherIsBetter = indicator?.forceHigherIsBetter ?? false;
    const thresholdsSimplificado = indicator?.thresholdsSimplificado ?? null;

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

      if (simplifiedView && thresholdsSimplificado) {
        
        const percentual = normalized * 100;
        
        const color = resolveThresholdColor(
          percentual,
          thresholdsSimplificado,
          higherIsBetter,
          forceHigherIsBetter,
        );
        
        if (color) {
          featureColors.set(featureId, color);
        }
        continue;
      }

      if (simplifiedView) {
        const simplifiedPalette = {
          critical: "#ea580c",
          attention: "#facc15",
          good: "#0f766e",
        };

        const performanceValue =
          indicator?.comparisonMode === "relative"
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

    return {
      featureColors,
      stats,
      activeThresholds: simplifiedView ? (thresholdsSimplificado ?? [
        { min: 0, max: 34, cor: "#ea580c", rotulo: "Crítico" },
        { min: 34, max: 67, cor: "#facc15", rotulo: "Atenção" },
        { min: 67, max: 101, cor: "#0f766e", rotulo: "Bom" },
      ]) : null,
    };
  }, [collection, activeLayer, activeModuleId, activeIndicatorId, simplifiedView]);
}
