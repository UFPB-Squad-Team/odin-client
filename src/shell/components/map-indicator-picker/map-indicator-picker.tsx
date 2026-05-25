"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, X, Search } from "lucide-react";
import type { MapIndicatorPickerProps } from "./types";
import { IndicatorGroupSection } from "./indicator-group-section";

export function MapIndicatorPicker({
  groups,
  activeModuleId,
  activeIndicatorId,
  simplifiedView,
  radiusMode = false,
  onSimplifiedViewChange,
  onSelect,
}: MapIndicatorPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (radiusMode) {
      setOpen(false);
    }
  }, [radiusMode]);

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
        className={`flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 backdrop-blur-md px-2.5 py-2 shadow-lg transition-all hover:shadow-xl hover:border-border ${radiusMode ? "max-w-[188px]" : "max-w-[220px]"}`}
      >
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        {activeIndicatorLabel ? (
          <span className="max-w-[110px] truncate text-[11px] font-medium text-foreground">
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
        {simplifiedView && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
            Simples
          </span>
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className={`w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-xl border border-border/60 bg-background/95 backdrop-blur-md shadow-xl overflow-hidden flex flex-col sm:w-[220px] ${radiusMode ? "max-w-[188px]" : "max-w-[220px]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-cyan-500" />
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-zinc-100 dark:text-zinc-100">
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
        <div className="border-b border-border/30 px-2 py-1.5">
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2 py-1">
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

      <div className="border-b border-border/30 px-2 py-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={simplifiedView}
          onClick={() => onSimplifiedViewChange(!simplifiedView)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 ${simplifiedView ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/60 dark:bg-cyan-950/35 dark:text-cyan-100" : "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40 dark:text-zinc-100"}`}
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-current">
              Visão Simplificada
            </span>
            <span className="block text-[10px] font-normal text-muted-foreground dark:text-zinc-300/90">
              3 cores sólidas para leitura rápida
            </span>
          </span>
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition ${simplifiedView ? "border-cyan-400 bg-cyan-500" : "border-zinc-400 bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${simplifiedView ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </span>
        </button>
      </div>

      {/* Indicator groups */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 flex flex-col gap-1 odin-picker-scroll [scrollbar-gutter:stable]">
        {filteredGroups.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-muted-foreground">
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
        <div className="border-t border-border/40 bg-muted/20 px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Ativo:</span>
            <span className="max-w-[120px] truncate text-[10px] font-medium text-foreground dark:text-zinc-100">
              {activeIndicatorLabel}
            </span>
          </div>
        </div>
      )}

      <style>{`
        .odin-picker-scroll::-webkit-scrollbar { width: 4px; }
        .odin-picker-scroll::-webkit-scrollbar-track { background: transparent; }
        .odin-picker-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.45); border-radius: 2px; }
        .odin-picker-scroll { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.45) transparent; }
      `}</style>
    </div>
  );
}
