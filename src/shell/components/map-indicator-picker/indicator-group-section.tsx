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
}: IndicatorGroupSectionProps) {
  // Só abre por padrão se este módulo tem o indicador ativo
  const hasActiveIndicator = isActiveModule && activeIndicatorId != null;
  const [open, setOpen] = useState(hasActiveIndicator);

  return (
    <div className="overflow-hidden rounded-lg border border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors ${
          hasActiveIndicator
            ? "bg-muted/55"
            : "hover:bg-muted/35"
        }`}
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: colorAccent }}
        />
        <span
          className="flex-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: colorAccent }}
        >
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
        <div className="odin-indicator-scroll flex max-h-[24vh] flex-col gap-0.5 overflow-y-auto px-1.5 pb-1.5 pr-2 [scrollbar-gutter:stable]">
          {indicators.map((indicator) => {
            const isActive = isActiveModule && activeIndicatorId === indicator.id;
            return (
              <button
                key={indicator.id}
                type="button"
                onClick={() =>
                  onSelect(moduleId, isActive ? null : indicator.id)
                }
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11.5px] transition-all ${
                  isActive
                    ? "text-white font-medium shadow-sm"
                    : "text-foreground/90 hover:bg-muted/45"
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

      <style>{`
        .odin-indicator-scroll::-webkit-scrollbar { width: 4px; }
        .odin-indicator-scroll::-webkit-scrollbar-track { background: transparent; }
        .odin-indicator-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.35); border-radius: 2px; }
        .odin-indicator-scroll { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.35) transparent; }
      `}</style>
    </div>
  );
}
