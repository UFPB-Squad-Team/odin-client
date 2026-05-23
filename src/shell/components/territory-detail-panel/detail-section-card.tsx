"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DetailSection, DetailRow } from "@/core/types/module";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";

type DetailSectionCardProps = {
  section: DetailSection;
  colorAccent: string;
};

function Row({ row }: { row: DetailRow }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-1.5 sm:items-center">
      <div className="min-w-0">
        {row.description ? (
          <IndicatorTooltip description={row.description}>
            <span className="block text-xs text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help leading-snug break-words">
              {row.label}
            </span>
          </IndicatorTooltip>
        ) : (
          <span className="block text-xs text-muted-foreground leading-snug break-words">
            {row.label}
          </span>
        )}
      </div>
      <span className="justify-self-end text-right text-sm font-semibold tabular-nums shrink-0 text-foreground/90">
        {row.value}
      </span>
    </div>
  );
}

export function DetailSectionCard({ section, colorAccent }: DetailSectionCardProps) {
  const [open, setOpen] = useState(section.defaultOpen !== false);

  return (
    <div
      className="rounded-lg border border-border/50 overflow-hidden"
      style={{ borderLeftWidth: 2, borderLeftColor: colorAccent }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors text-left hover:bg-muted/30"
        style={{ backgroundColor: `${colorAccent}08` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: colorAccent }}
          >
            {section.title}
          </span>
          {section.source && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
              style={{ backgroundColor: `${colorAccent}15`, color: colorAccent }}
            >
              {section.source}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>
      {open && (
        <div className="px-3 py-1.5 divide-y divide-border/30">
          {section.rows.map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
