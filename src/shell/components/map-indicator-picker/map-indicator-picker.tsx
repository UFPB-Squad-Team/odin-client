"use client";

import { useState, useMemo } from "react";
import { Layers, X, Search } from "lucide-react";
import type { MapIndicatorPickerProps } from "./types";
import { IndicatorGroupSection } from "./indicator-group-section";

export function MapIndicatorPicker({
  groups,
  activeModuleId,
  activeIndicatorId,
  onSelect,
}: MapIndicatorPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeIndicatorLabel = useMemo(() => {
    if (!activeModuleId || !activeIndicatorId) return null;
    const group = groups.find((g) => g.moduleId === activeModuleId);
    return group?.indicators.find((i) => i.id === activeIndicatorId)?.label ?? null;
  }, [groups, activeModuleId, activeIndicatorId]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        indicators: g.indicators.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.indicators.length > 0);
  }, [groups, search]);

  // Collapsed state: show a compact button
  if (!open) {
    if (groups.length === 0) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 backdrop-blur-md px-3 py-2 shadow-lg transition-all hover:shadow-xl hover:border-border"
      >
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        {activeIndicatorLabel ? (
          <span className="text-[11px] font-medium text-foreground max-w-[140px] truncate">
            {activeIndicatorLabel}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Colorir mapa
          </span>
        )}
        {activeIndicatorLabel && (
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="w-[calc(100vw-2rem)] max-w-[240px] max-h-[calc(100vh-6rem)] rounded-xl border border-border/60 bg-background/95 backdrop-blur-md shadow-xl overflow-hidden flex flex-col sm:w-[240px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-cyan-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
            Indicadores
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSearch("");
          }}
          className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Search */}
      {groups.flatMap((g) => g.indicators).length > 8 && (
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5">
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar indicador..."
              className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>
        </div>
      )}

      {/* Indicator groups */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1.5 odin-picker-scroll">
        {filteredGroups.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-4">
            Nenhum indicador encontrado.
          </p>
        ) : (
          filteredGroups.map((group) => (
            <IndicatorGroupSection
              key={group.moduleId}
              moduleId={group.moduleId}
              moduleLabel={group.moduleLabel}
              colorAccent={group.colorAccent}
              indicators={group.indicators}
              activeIndicatorId={activeIndicatorId}
              isActiveModule={activeModuleId === group.moduleId}
              onSelect={onSelect}
              defaultOpen={activeModuleId === group.moduleId}
            />
          ))
        )}
      </div>

      {/* Active indicator footer */}
      {activeIndicatorLabel && (
        <div className="px-3 py-2 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Ativo:</span>
            <span className="text-[10px] font-medium text-foreground truncate max-w-[160px]">
              {activeIndicatorLabel}
            </span>
          </div>
        </div>
      )}

      <style>{`
        .odin-picker-scroll::-webkit-scrollbar { width: 4px; }
        .odin-picker-scroll::-webkit-scrollbar-track { background: transparent; }
        .odin-picker-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 2px; }
        .odin-picker-scroll { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.3) transparent; }
      `}</style>
    </div>
  );
}
