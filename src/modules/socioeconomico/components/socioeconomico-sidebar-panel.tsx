"use client";

import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";
import type { ModuleSidebarPanelProps } from "@/core/types/module";
import type { SocioeconomicoIndicatorId } from "@/modules/socioeconomico/types/socioeconomico";

const SOCIOECONOMICO_INDICATORS: Array<{
  id: SocioeconomicoIndicatorId;
  label: string;
  description: string;
}> = [
  {
    id: "pct_preta_parda",
    label: "Pop. preta/parda",
    description: "Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022",
  },
  {
    id: "taxa_analfabetismo_15_mais",
    label: "Analfabetismo 15+",
    description: "Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022",
  },
  {
    id: "pct_agua_rede_geral",
    label: "Água rede geral",
    description: "Percentual de domicílios com abastecimento de água por rede geral — IBGE Censo 2022",
  },
  {
    id: "pct_esgoto_rede_geral",
    label: "Esgoto rede geral",
    description: "Percentual de domicílios com esgotamento sanitário por rede geral — IBGE Censo 2022",
  },
  {
    id: "total_populacao",
    label: "População total",
    description: "Total de residentes no território — IBGE Censo 2022",
  },
  {
    id: "renda_per_capita_media",
    label: "Renda per capita",
    description: "Renda per capita média do território — IBGE Censo 2022",
  },
];

export function SocioeconomicoSidebarPanel({
  activeIndicatorId,
  onIndicatorChange,
}: ModuleSidebarPanelProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        Indicador Socioeconômico
      </p>
      <p className="text-[11px] text-muted-foreground mb-2">
        Fonte: IBGE Censo Demográfico 2022
      </p>
      {SOCIOECONOMICO_INDICATORS.map((indicator) => {
        const isActive = activeIndicatorId === indicator.id;
        return (
          <button
            key={indicator.id}
            onClick={() => onIndicatorChange(isActive ? null : indicator.id)}
            aria-pressed={isActive}
            className={[
              "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-violet-600 text-white"
                : "hover:bg-muted text-foreground",
            ].join(" ")}
          >
            <IndicatorTooltip description={indicator.description}>
              <span className="flex-1 leading-snug text-left">{indicator.label}</span>
            </IndicatorTooltip>
            {isActive && <span className="shrink-0 text-xs opacity-70 mt-0.5">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
