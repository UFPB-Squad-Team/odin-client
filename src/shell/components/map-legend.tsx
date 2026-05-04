"use client";

interface MapLegendProps {
  indicatorLabel: string;
  indicatorUnit?: string;
  colorScale: [string, string];
  minValue: number;
  maxValue: number;
  higherIsBetter?: boolean;
}

export function MapLegend({
  indicatorLabel,
  indicatorUnit,
  colorScale,
  minValue,
  maxValue,
  higherIsBetter = true,
}: MapLegendProps) {
  const [colorMin, colorMax] = colorScale;
  const formatValue = (value: number) => {
    if (indicatorUnit === "%") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[240px]">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {indicatorLabel}
      </div>

      {/* Escala de cores */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-4 flex-1 rounded"
          style={{
            background: `linear-gradient(to right, ${colorMin}, ${colorMax})`,
          }}
        />
      </div>

      {/* Labels de valores */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          {formatValue(minValue)}
          {higherIsBetter && <span className="ml-1 text-gray-400">↓</span>}
        </span>
        <span>
          {formatValue(maxValue)}
          {higherIsBetter && <span className="ml-1 text-gray-400">↑</span>}
        </span>
      </div>

      {!higherIsBetter && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span>⚠</span>
          <span>Valores menores são melhores</span>
        </div>
      )}
    </div>
  );
}
