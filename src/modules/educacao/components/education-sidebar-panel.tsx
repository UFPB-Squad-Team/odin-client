"use client";

import { cn } from "@/lib/utils";
import type { ModuleSidebarPanelProps } from "@/core/types/module";
import type { EducationIndicatorId } from "@/modules/educacao/types/education";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip"; 

const EDUCATION_INDICATORS: Array<{
  id: EducationIndicatorId;
  label: string;
  description: string;
}> = [
  {
    id: "pct_com_internet",
    label: "Internet para alunos",
    description: "Percentual de escolas do município com acesso à internet banda larga",
  },
  {
    id: "pct_com_biblioteca",
    label: "Biblioteca",
    description: "Percentual de escolas do município com biblioteca",
  },
  {
    id: "pct_com_lab_informatica",
    label: "Lab. de informática",
    description: "Percentual de escolas do município com laboratório de informática",
  },
  {
    id: "pct_sem_acessibilidade",
    label: "Sem acessibilidade PCD",
    description: "Percentual de escolas do município sem nenhum recurso de acessibilidade para PCD",
  },
  {
    id: "total_matriculas",
    label: "Total de matrículas",
    description: "Soma de matrículas ativas em Educação Infantil, Ensino Fundamental e Ensino Médio",
  },
];

export function EducationSidebarPanel({
  activeIndicatorId,
  onIndicatorChange,
}: ModuleSidebarPanelProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        Indicador
      </p>
      {EDUCATION_INDICATORS.map((indicator) => {
        const isActive = activeIndicatorId === indicator.id;
        return (
          <button
            key={indicator.id}
            onClick={() => onIndicatorChange(isActive ? null : indicator.id)}
            aria-pressed={isActive}
            className={cn(
              "flex items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors w-full",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            <IndicatorTooltip description={indicator.description}>
              <span className="flex-1 leading-snug">{indicator.label}</span>
            </IndicatorTooltip>
            {isActive && (
              <span className="shrink-0 text-xs opacity-70 mt-0.5 ml-auto">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}