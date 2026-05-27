"use client";

interface MapLegendProps {
  indicatorLabel: string;
  indicatorUnit?: string;
  colorScale: [string, string];
  minValue: number;
  maxValue: number;
  higherIsBetter?: boolean;
  comparisonMode?: "directional" | "relative";
  simplifiedView?: boolean;
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
}: MapLegendProps) {
  const [colorMin, colorMax] = colorScale;
  const formatValue = (value: number) => {
    if (indicatorUnit === "%") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <div className="rounded-xl border border-zinc-300/90 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 min-w-[240px] sm:min-w-[280px]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {indicatorLabel}
        </div>
        {simplifiedView ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
            Visão simplificada
          </span>
        ) : null}
      </div>

      {simplifiedView ? (
        <div className="mt-3 space-y-2">
          {(
            comparisonMode === "relative"
              ? [
                  { label: "Muito baixo", description: "Quantidade bem abaixo do restante", color: "#ea580c" },
                  { label: "Na média", description: "Quantidade próxima ao conjunto", color: "#facc15" },
                  { label: "Muito alto", description: "Quantidade bem acima do restante", color: "#0f766e" },
                ]
              : [
                  { label: "Crítico", description: "Desempenho baixo", color: "#ea580c" },
                  { label: "Atenção", description: "Zona intermediária", color: "#facc15" },
                  { label: "Dentro da meta", description: "Desempenho favorável", color: "#0f766e" },
                ]
          ).map((band) => (
            <div key={band.label} className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: band.color }} />
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
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-4 flex-1 rounded"
              style={{
                background: `linear-gradient(to right, ${colorMin}, ${colorMax})`,
              }}
            />
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
    </div>
  );
}
