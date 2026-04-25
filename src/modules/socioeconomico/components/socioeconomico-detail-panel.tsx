"use client";

import type { ModuleDetailPanelProps } from "@/core/types/module";
import { buildSocioeconomicoSelection } from "@/modules/socioeconomico/hooks/use-socioeconomico-selection";

export function SocioeconomicoDetailPanel({ entity }: ModuleDetailPanelProps) {
  const selection = buildSocioeconomicoSelection(entity);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
          {selection.subtitle}
        </p>
        <h2 className="text-base font-semibold leading-tight">{selection.nome}</h2>
        <p className="text-[11px] text-muted-foreground mt-1">
          Fonte: IBGE Censo Demográfico 2022
        </p>
      </div>

      {selection.metrics && selection.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selection.metrics.map((metric) => (
            <div key={metric.label} className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-sm font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      {selection.sections?.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {section.title}
          </p>
          <div className="flex flex-col gap-1">
            {section.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
