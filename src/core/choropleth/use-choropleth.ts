"use client";

import { useMemo } from "react";
import { getModule } from "@/core/registry/module-registry";
import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";
import { computeChoroplethStats, normalizeValue } from "./normalize";
import type { ChoroplethColors } from "./types";
import type { ThresholdCor } from "@/core/types/comparision";
import type { ColorVisionMode } from "@/core/types/a11y";
import {
  getBandColors,
  hasAccessiblePalette,
  resolveAccessibleColor,
} from "@/core/a11y/palettes";

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
  /** Modo de visão de cores; quando ≠ "default" substitui a paleta do indicador. */
  colorVisionMode?: ColorVisionMode;
}

interface UseChoroplethResult {
  /** featureId → cor hex. Vazio quando não há indicador ativo. */
  featureColors: ChoroplethColors;
  /** Estatísticas do indicador ativo (min, max, count). */
  stats: { min: number; max: number; count: number } | null;
  /** Thresholds usados na visão simplificada (para renderizar a régua). */
  activeThresholds: ThresholdCor[] | null;
}

/** Thresholds padrão da visão simplificada quando o indicador não declara faixas. */
const DEFAULT_THRESHOLDS: ThresholdCor[] = [
  { min: 0, max: 34, cor: "#ea580c", rotulo: "Crítico" },
  { min: 34, max: 67, cor: "#facc15", rotulo: "Atenção" },
  { min: 67, max: 101, cor: "#0f766e", rotulo: "Bom" },
];

/**
 * Índice da faixa (threshold) que contém o valor. Trabalhar com o índice — em vez
 * da cor final — permite trocar a paleta (acessibilidade) sem perder o significado
 * de cada faixa.
 */
function resolveThresholdIndex(
  value: number,
  thresholds: ThresholdCor[],
  higherIsBetter: boolean,
  forceHigherIsBetter: boolean,
): number {
  const effectiveValue = (!higherIsBetter && forceHigherIsBetter)
    ? 100 - value
    : value;

  for (let index = 0; index < thresholds.length; index++) {
    const threshold = thresholds[index];
    if (effectiveValue >= threshold.min && effectiveValue < threshold.max) {
      return index;
    }
  }

  return Math.max(0, thresholds.length - 1);
}

/**
 * Faixas exibidas na régua da visão simplificada, já com a paleta do modo de visão
 * de cores: a cor de cada faixa é derivada da rampa acessível, preservando a ordem
 * (crítico → adequado) e os rótulos declarados pelo indicador.
 */
function buildActiveThresholds(
  simplifiedView: boolean,
  thresholds: ThresholdCor[] | null,
  colorVisionMode: ColorVisionMode,
): ThresholdCor[] | null {
  if (!simplifiedView) return null;

  const base = thresholds ?? DEFAULT_THRESHOLDS;
  if (!hasAccessiblePalette(colorVisionMode)) return base;

  const bandColors = getBandColors(colorVisionMode);
  return base.map((threshold, index) => ({
    ...threshold,
    cor: bandColors[Math.min(index, bandColors.length - 1)],
  }));
}

export function useChoropleth({
  collection,
  activeModuleId,
  activeLayer,
  activeIndicatorId,
  simplifiedView = false,
  colorVisionMode = "default",
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
    // Paleta acessível do modo ativo (rampa em Oklab) e faixas da visão simplificada.
    const accessiblePalette = hasAccessiblePalette(colorVisionMode);
    const bandColors = getBandColors(colorVisionMode);

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

        const bandIndex = resolveThresholdIndex(
          percentual,
          thresholdsSimplificado,
          higherIsBetter,
          forceHigherIsBetter,
        );

        const color = accessiblePalette
          ? bandColors[Math.min(bandIndex, bandColors.length - 1)]
          : thresholdsSimplificado[bandIndex]?.cor;

        if (color) {
          featureColors.set(featureId, color);
        }
        continue;
      }

      if (simplifiedView) {
        const performanceValue =
          indicator?.comparisonMode === "relative"
            ? normalized
            : higherIsBetter
              ? normalized
              : 1 - normalized;

        const bandIndex =
          performanceValue >= 0.67 ? 2 : performanceValue >= 0.34 ? 1 : 0;

        featureColors.set(featureId, bandColors[bandIndex]);
        continue;
      }

      const accessibleColor = resolveAccessibleColor(colorVisionMode, normalized);
      if (accessibleColor) {
        featureColors.set(featureId, accessibleColor);
        continue;
      }

      const style = activeModule.getMapLayerStyle(activeIndicatorId, normalized);
      featureColors.set(featureId, style.color);
    }

    return {
      featureColors,
      stats,
      activeThresholds: buildActiveThresholds(
        simplifiedView,
        thresholdsSimplificado,
        colorVisionMode,
      ),
    };
  }, [
    collection,
    activeLayer,
    activeModuleId,
    activeIndicatorId,
    simplifiedView,
    colorVisionMode,
  ]);
}
