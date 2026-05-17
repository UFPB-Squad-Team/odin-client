"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ModuleIndicator } from "@/core/types/module";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";

type IndicatorGroupSectionProps = {
  moduleId: string;
  moduleLabel: string;
  colorAccent: string;
  indicators: ModuleIndicator[];
  activeIndicatorId: string | null;
  isActiveModule: boolean;
  onSelect: (moduleId: string, indicatorId: string | null) => void;
  defaultOpen?: boolean;
};

export function IndicatorGroupSection({
  moduleId,
  moduleLabel,
  colorAccent,
  indicators,
  activeIndicatorId,
  isActiveModule,
  onSelect,
  defaultOpen = false,
}: IndicatorGroupSectionProps) {
  // Só abre por padrão se este módulo tem o indicador ativo
  const hasActiveIndicator = isActiveModule && activeIndicatorId != null;
  const [open, setOpen] = useState(hasActiveIndicator);

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          hasActiveIndicator
            ? "bg-muted/60"
            : "hover:bg-muted/40"
        }`}
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: colorAccent }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80 flex-1">
          {moduleLabel}
        </span>
        {hasActiveIndicator && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: colorAccent }}
          />
        )}
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-1.5 pb-1.5 flex flex-col gap-0.5">
          {indicators.map((indicator) => {
            const isActive = isActiveModule && activeIndicatorId === indicator.id;
            return (
              <button
                key={indicator.id}
                type="button"
                onClick={() =>
                  onSelect(moduleId, isActive ? null : indicator.id)
                }
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-all ${
                  isActive
                    ? "text-white font-medium shadow-sm"
                    : "text-foreground/80 hover:bg-muted/50"
                }`}
                style={
                  isActive
                    ? { backgroundColor: colorAccent }
                    : undefined
                }
              >
                {!isActive && (
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30 shrink-0" />
                )}
                <IndicatorTooltip description={indicator.description}>
                  <span className="flex-1 leading-snug truncate">
                    {indicator.label}
                  </span>
                </IndicatorTooltip>
                {isActive && (
                  <span className="text-[10px] opacity-80 shrink-0">✕</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
