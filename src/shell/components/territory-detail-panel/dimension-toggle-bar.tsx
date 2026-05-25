"use client";

import type { DimensionVisibility } from "./types";

type DimensionToggleBarProps = {
  dimensions: Array<{ moduleId: string; moduleLabel: string; colorAccent: string }>;
  visibility: DimensionVisibility;
  onToggle: (moduleId: string) => void;
};

export function DimensionToggleBar({
  dimensions,
  visibility,
  onToggle,
}: DimensionToggleBarProps) {
  if (dimensions.length <= 1) return null;

  return (
    <div className="border-b border-border/30 px-4 py-3">
      <span className="mb-2 block text-[10px] uppercase tracking-wide text-muted-foreground">
        Dimensões:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {dimensions.map((dim) => {
          const isActive = visibility[dim.moduleId] !== false;
          return (
            <button
              key={dim.moduleId}
              type="button"
              onClick={() => onToggle(dim.moduleId)}
              className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                isActive
                  ? "border border-current/20 shadow-sm"
                  : "border border-border/50 opacity-50 hover:opacity-75"
              }`}
              style={
                isActive
                  ? { color: dim.colorAccent, backgroundColor: `${dim.colorAccent}15` }
                  : undefined
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isActive ? "" : "bg-muted-foreground/40"}`}
                style={isActive ? { backgroundColor: dim.colorAccent } : undefined}
              />
              {dim.moduleLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
