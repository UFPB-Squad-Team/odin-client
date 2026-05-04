"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MapEntity } from "@/core/types/shell";
import type { ModuleIndicator } from "@/core/types/module";

interface MunicipalityRankingProps {
  entities: MapEntity[];
  activeIndicator: ModuleIndicator | null;
  onSelectEntity: (entity: MapEntity) => void;
  selectedId?: string;
}

export function MunicipalityRanking({
  entities,
  activeIndicator,
  onSelectEntity,
  selectedId,
}: MunicipalityRankingProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const rankedEntities = useMemo(() => {
    if (!activeIndicator || entities.length === 0) return [];

    // Filtra apenas municípios e ordena pelo indicador ativo
    const municipios = entities.filter((e) => e.kind === "municipio");
    
    return municipios
      .map((entity) => {
        const value = entity.data[activeIndicator.id as keyof typeof entity.data];
        const numericValue = typeof value === "number" ? value : null;
        return { entity, value: numericValue };
      })
      .filter((item) => item.value !== null)
      .sort((a, b) => {
        if (a.value === null || b.value === null) return 0;
        // Se valores maiores são melhores, ordena decrescente
        return activeIndicator.higherIsBetter ? b.value - a.value : a.value - b.value;
      })
      .slice(0, 10); // Top 10
  }, [entities, activeIndicator]);

  if (!activeIndicator || rankedEntities.length === 0) {
    return null;
  }

  const formatValue = (value: number | null) => {
    if (value === null) return "—";
    if (activeIndicator.unit === "%") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <div className="fixed top-24 right-6 z-[100] w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-cyan-500 dark:border-cyan-600 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-left transition-opacity hover:opacity-90"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>🏆</span>
              <span>Top 10 Municípios</span>
            </h3>
            <p className="text-xs text-cyan-50 mt-0.5">
              {activeIndicator.label}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-white" />
          ) : (
            <ChevronDown className="h-5 w-5 text-white" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="max-h-[60vh] overflow-y-auto">{rankedEntities.map(({ entity, value }, index) => {
          const isSelected = entity.data.id === selectedId;
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

          return (
            <button
              key={entity.data.id}
              onClick={() => onSelectEntity(entity)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                isSelected
                  ? "bg-cyan-50 dark:bg-cyan-950/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {medal || `${index + 1}º`}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {entity.data.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatValue(value)}
                </p>
              </div>

              {/* Barra de progresso */}
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                  style={{
                    width: `${value !== null ? Math.min(100, (value / (rankedEntities[0]?.value ?? 100)) * 100) : 0}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
}
