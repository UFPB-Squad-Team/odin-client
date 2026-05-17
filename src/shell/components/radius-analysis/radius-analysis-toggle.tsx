"use client";

import { Crosshair } from "lucide-react";

type RadiusAnalysisToggleProps = {
  active: boolean;
  onToggle: () => void;
};

/**
 * Botão flutuante para ativar/desativar o modo de análise por raio.
 */
export function RadiusAnalysisToggle({ active, onToggle }: RadiusAnalysisToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md transition-all ${
        active
          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/25"
          : "border-border/60 bg-background/90 text-muted-foreground hover:shadow-xl hover:border-border"
      }`}
      title={active ? "Desativar análise por raio" : "Ativar análise por raio"}
    >
      <Crosshair className="h-3.5 w-3.5" />
      <span className="text-[11px] font-medium">
        {active ? "Análise ativa" : "Análise por raio"}
      </span>
    </button>
  );
}
