"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SegmentationModule } from "@/core/segmentation/types";

type SegmentationModuleSelectorProps = {
  /** Todos os módulos de segmentação disponíveis */
  modules: SegmentationModule[];
  /** Módulo atualmente selecionado */
  selectedModuleId: string;
  /** Callback quando o módulo muda */
  onModuleChange: (moduleId: string) => void;
  /** Tema escuro? */
  isDark: boolean;
};

/**
 * Dropdown estilizado para selecionar o módulo de segmentação ativo.
 * Similar ao MunicipioSelector: input de busca + dropdown flutuante.
 * Escalável: quando novos módulos forem registrados, aparecerão automaticamente.
 */
export function SegmentationModuleSelector({
  modules,
  selectedModuleId,
  onModuleChange,
  isDark,
}: SegmentationModuleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Filtra módulos pela busca
  const filtered = modules.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      m.label.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const inputClasses = isDark
    ? "border-zinc-700 bg-zinc-900 text-white placeholder-zinc-600"
    : "border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400";

  const panelClasses = isDark
    ? "border-zinc-700 bg-zinc-900"
    : "border-zinc-200 bg-white";

  return (
    <div ref={dropdownRef} className="relative">
      {/* Label */}
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] ${
        isDark ? "text-zinc-500" : "text-zinc-400"
      }`}>
        Módulo de análise
      </p>

      {/* Botão / Input de seleção */}
      {selectedModule && !isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setSearch("");
          }}
          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
            isDark
              ? "border-zinc-700 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800"
              : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          <span className="text-base">{selectedModule.icon}</span>
          <div className="flex-1 text-left">
            <div className="font-medium">{selectedModule.label}</div>
            <div className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              {selectedModule.description}
            </div>
          </div>
          <svg
            className={`h-4 w-4 transition-transform ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : (
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar módulo…"
            autoFocus
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-zinc-600 focus:ring-1 ${inputClasses}`}
          />
          {filtered.length > 0 && (
            <ul
              className={`select-enter absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border py-1 shadow-xl ${panelClasses}`}
            >
              {filtered.map((mod) => {
                const isActive = mod.id === selectedModuleId;
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        onModuleChange(mod.id);
                        setSearch("");
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition ${
                        isActive
                          ? isDark
                            ? "bg-cyan-500/15 text-cyan-300"
                            : "bg-cyan-50 text-cyan-700"
                          : isDark
                          ? "text-zinc-300 hover:bg-zinc-800"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="text-base">{mod.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{mod.label}</div>
                        <div className={`text-[10px] truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          {mod.description}
                        </div>
                      </div>
                      {isActive && (
                        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {filtered.length === 0 && search.trim() && (
            <div className={`select-enter absolute z-20 mt-1 w-full rounded-xl border py-3 text-center text-sm shadow-xl ${panelClasses} ${
              isDark ? "text-zinc-500" : "text-zinc-400"
            }`}>
              Nenhum módulo encontrado
            </div>
          )}
        </div>
      )}

      <style>{`
        .select-enter { animation: fadeUp 0.15s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}