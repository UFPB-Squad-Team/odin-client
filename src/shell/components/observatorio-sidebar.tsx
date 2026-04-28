"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { SearchableCombobox } from "@/shell/components/searchable-combobox";
import { ModuleTabSidebar } from "@/shell/components/module-tab-sidebar";
import type { Bairro, Estado, Municipio } from "@/core/types/territory";
import type { ObservatoryLayer } from "@/core/types/territory";
import type { ShellContextType } from "@/core/types/shell";

type SidebarProps = {
  activeLayer: ObservatoryLayer;
  bairroId: string | null;
  bairros: Bairro[];
  estadoId: string | null;
  estados: Estado[];
  municipioId: string | null;
  municipios: Municipio[];
  onLayerChange: (layer: ObservatoryLayer) => void;
  onSetBairro: (bairroId: string | null) => void;
  onSetEstado: (estadoId: string | null) => void;
  onSetMunicipio: (municipioId: string | null) => void;
  sidebarCollapsed: boolean;
  shellContext?: ShellContextType;
  activeIndicatorId?: string | null;
  onIndicatorChange?: (indicatorId: string | null) => void;
};

const LAYERS: Array<{ id: ObservatoryLayer; label: string }> = [
  { id: "municipio", label: "Município" },
  { id: "bairro", label: "Bairro" },
  { id: "escola", label: "Escola" },
];

const MIN_WIDTH = 300;
const MAX_WIDTH = 550;
const DEFAULT_WIDTH = 340;
const STORAGE_KEY = "odin-sidebar-width";

export function ObservatorioSidebar({
  activeLayer,
  bairroId,
  bairros,
  estadoId,
  estados,
  municipioId,
  municipios,
  onLayerChange,
  onSetBairro,
  onSetEstado,
  onSetMunicipio,
  sidebarCollapsed,
  shellContext,
  activeIndicatorId = null,
  onIndicatorChange,
}: SidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) setSidebarWidth(n);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      window.requestAnimationFrame(() => {
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
        setSidebarWidth(newWidth);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, sidebarWidth]);

  const estadoOptions = estados.map((e) => ({ id: e.id, label: e.nome }));
  const municipioOptions = municipios.map((m) => ({ id: m.id, label: m.nome }));
  const bairroOptions = bairros.map((b) => ({ id: b.id, label: b.nome }));

  return (
    <>
      <style>{`
        .odin-scroll::-webkit-scrollbar { width: 6px; }
        .odin-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .odin-scroll::-webkit-scrollbar-thumb {
          background: #06b6d4;
          border-radius: 10px;
        }
        .odin-scroll {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 transparent;
        }
        .dragging-active * {
          user-select: none !important;
          pointer-events: none !important;
        }
      `}</style>

      <div
        ref={sidebarRef}
        className={`absolute left-0 top-0 bottom-0 z-[40] flex bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ${
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
        } ${isDragging ? "dragging-active" : ""}`}
        style={{ width: sidebarWidth }}
      >
        <div className="relative flex flex-col w-full h-full min-h-0">
          {!sidebarCollapsed && (
            <div
              onMouseDown={() => setIsDragging(true)}
              className={`absolute -right-1 top-0 w-2 h-full cursor-col-resize z-50 hover:bg-cyan-500/30 transition-colors ${
                isDragging ? 'bg-cyan-500/50' : ''
              }`}
            />
          )}

          <aside className="odin-scroll flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            <div className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-500">Painel de Filtros</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Explore território por estado, município, bairro e escola.</p>
            </div>

            {shellContext && onIndicatorChange && (
              <div className="shrink-0">
                <ModuleTabSidebar
                  shellContext={shellContext}
                  activeIndicatorId={activeIndicatorId}
                  onIndicatorChange={onIndicatorChange}
                  collapsed={sidebarCollapsed}
                />
              </div>
            )}

            <div className="shrink-0 flex flex-col gap-2 p-1">
              <div className="flex items-center gap-2">
                <span className="text-cyan-600 dark:text-cyan-500 text-xs">🔍</span>
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Busca Inteligente</label>
              </div>
              <input
                placeholder="Ex.: Av. Epitácio Pessoa"
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 outline-none focus:border-cyan-500/50 transition-colors"
              />
              <p className="text-[9px] text-zinc-500 dark:text-zinc-600">Dica: pressione / para focar a busca.</p>
            </div>

            <div className="flex flex-col gap-4">
              <SearchableCombobox 
                ariaLabel="Selecionar Estado"
                label="ESTADO" 
                value={estadoId} 
                options={estadoOptions} 
                onSelect={onSetEstado} 
              />
              <SearchableCombobox 
                ariaLabel="Selecionar Município"
                label="MUNICÍPIO" 
                value={municipioId} 
                options={municipioOptions} 
                onSelect={onSetMunicipio} 
                disabled={!estadoId} 
              />
              <SearchableCombobox 
                ariaLabel="Selecionar Bairro"
                label="BAIRRO" 
                value={bairroId} 
                options={bairroOptions} 
                onSelect={onSetBairro} 
                disabled={!municipioId} 
              />
            </div>

            <div className="shrink-0 pt-4 border-t border-zinc-200 dark:border-zinc-800/50 pb-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                📍 Camada de Análise
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => onLayerChange(layer.id)}
                    className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                      activeLayer === layer.id 
                      ? "bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.2)]" 
                      : "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}