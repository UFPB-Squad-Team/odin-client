"use client";

import {
  BAND_GLYPHS,
  getBandColors,
  getColorVisionOption,
  getSequentialRamp,
} from "@/core/a11y/palettes";
import { rampGradientCss } from "@/core/a11y/oklab";
import type { ColorVisionMode } from "@/core/types/a11y";

interface MapLegendProps {
  indicatorLabel: string;
  indicatorUnit?: string;
  colorScale: [string, string];
  minValue: number;
  maxValue: number;
  higherIsBetter?: boolean;
  comparisonMode?: "directional" | "relative";
  simplifiedView?: boolean;
  /** Modo de visão de cores ativo (a legenda reflete a rampa usada no mapa). */
  colorVisionMode?: ColorVisionMode;
  /** Cor usada nas feições sem dado — exibida como nota quando há modo acessível. */
  noDataColor?: string;
}

export function MapLegend({
  indicatorLabel,
  indicatorUnit,
  colorScale,
  minValue,
  maxValue,
  higherIsBetter = true,
  comparisonMode = "directional",
  simplifiedView = false,
  colorVisionMode = "default",
  noDataColor,
}: MapLegendProps) {
  const [colorMin, colorMax] = colorScale;
  const ramp = getSequentialRamp(colorVisionMode);
  const bandColors = getBandColors(colorVisionMode);
  const accessibleMode = colorVisionMode !== "default";
  const modeOption = accessibleMode ? getColorVisionOption(colorVisionMode) : null;

  const formatValue = (value: number) => {
    if (indicatorUnit === "%") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("pt-BR");
  };

  const gradient = ramp
    ? rampGradientCss(ramp)
    : `linear-gradient(to right, ${colorMin}, ${colorMax})`;

  const bands = (
    comparisonMode === "relative"
      ? [
        { label: "Muito baixo", description: "Quantidade bem abaixo do restante" },
        { label: "Na média", description: "Quantidade próxima ao conjunto" },
        { label: "Muito alto", description: "Quantidade bem acima do restante" },
      ]
      : [
        { label: "Crítico", description: "Desempenho baixo" },
        { label: "Atenção", description: "Zona intermediária" },
        { label: "Dentro da meta", description: "Desempenho favorável" },
      ]
  ).map((band, index) => ({
    ...band,
    color: bandColors[Math.min(index, bandColors.length - 1)],
    glyph: BAND_GLYPHS[Math.min(index, BAND_GLYPHS.length - 1)],
  }));

  return (
    <div className="odin-font-scale-excluded rounded-xl border border-zinc-300/90 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 min-w-[240px] sm:min-w-[280px]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {indicatorLabel}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {simplifiedView ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
              Visão simplificada
            </span>
          ) : null}
          {modeOption ? (
            <span
              title={modeOption.reference}
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-400/50 dark:text-cyan-200"
            >
              {`Paleta: ${modeOption.label}`}
            </span>
          ) : null}
        </div>
      </div>

      {simplifiedView ? (
        <div className="mt-3 space-y-2">
          {bands.map((band) => (
            <div key={band.label} className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: band.color }}
              />
              <span
                aria-hidden="true"
                className="w-2.5 shrink-0 text-center text-[10px] font-bold text-zinc-700 dark:text-zinc-200"
              >
                {band.glyph}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                  {band.label}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {band.description}
                </div>
              </div>
            </div>
          ))}
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {comparisonMode === "relative"
              ? "Faixas relativas ao conjunto selecionado."
              : "Faixas qualitativas para leitura rápida."}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Cada faixa tem símbolo, cor e rótulo (WCAG 1.4.1 — uso de cor).
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 flex-1 rounded" style={{ background: gradient }} />
          </div>

          <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              {formatValue(minValue)}
              {higherIsBetter && <span className="ml-1 text-zinc-400">↓</span>}
            </span>
            <span>
              {formatValue(maxValue)}
              {higherIsBetter && <span className="ml-1 text-zinc-400">↑</span>}
            </span>
          </div>

          {comparisonMode === "directional" && !higherIsBetter && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <span>⚠</span>
              <span>Valores menores são melhores</span>
            </div>
          )}
        </>
      )}

      {accessibleMode && noDataColor ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600"
            style={{ backgroundColor: noDataColor }}
          />
          <span>Sem dado para o indicador</span>
        </div>
      ) : null}
    </div>
  );
}
