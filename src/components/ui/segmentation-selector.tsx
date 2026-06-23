"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SegmentationModule, SegmentId } from "@/core/segmentation/types";

type SegmentationSelectorProps = {
  /** Módulo de segmentação ativo */
  module: SegmentationModule;
  /** IDs dos segmentos disponíveis */
  availableSegments: SegmentId[];
  /** Segmento atualmente selecionado */
  selectedSegment: SegmentId;
  /** Callback quando o segmento muda */
  onSegmentChange: (segment: SegmentId) => void;
  /** Tema escuro? */
  isDark: boolean;
  /** Orientação: horizontal pill ou dropdown */
  variant?: "pill" | "dropdown";
};

/**
 * Seletor de segmentação universal e estiloso.
 * Funciona para qualquer módulo (educação, saúde, etc.)
 * Suporta visualização pill horizontal ou dropdown.
 */
export function SegmentationSelector({
  module,
  availableSegments,
  selectedSegment,
  onSegmentChange,
  isDark,
  variant = "pill",
}: SegmentationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Se não há segmentos ou só 1, mostra label estático com ícone
  if (availableSegments.length <= 1) {
    const seg = module.segments[selectedSegment];
    const icon = seg?.icon || module.icon;
    const label = seg?.label || module.label;

    return (
      <div className="flex items-center gap-2 px-1">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
          Segmento:
        </span>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          isDark
            ? "bg-zinc-800/70 text-zinc-300"
            : "bg-zinc-100 text-zinc-700"
        }`}>
          <span className="text-sm">{icon}</span>
          <span>{label}</span>
        </div>
      </div>
    );
  }

  // Variante Pill: chips horizontais
  if (variant === "pill") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-medium uppercase tracking-wider mr-1 ${
          isDark ? "text-zinc-500" : "text-zinc-400"
        }`}>
          Segmento:
        </span>
        <div className="flex flex-wrap gap-1">
          {availableSegments.map((segId) => {
            const seg = module.segments[segId];
            if (!seg) return null;
            const isActive = segId === selectedSegment;

            return (
              <button
                key={segId}
                type="button"
                onClick={() => onSegmentChange(segId)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 shadow-sm shadow-cyan-500/10"
                      : "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-400/40 shadow-sm"
                    : isDark
                    ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
                    : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800"
                }`}
              >
                <span className="text-sm leading-none">{seg.icon}</span>
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Variante Dropdown
  const selectedConfig = module.segments[selectedSegment];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 ${
          isDark
            ? "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        <span className="text-sm">{selectedConfig?.icon || module.icon}</span>
        <span className="font-medium">{selectedConfig?.label || module.label}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-20 mt-1.5 w-52 overflow-hidden rounded-xl border shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-200 bg-white"
          }`}
          style={{
            animation: "segDropdown 0.15s ease-out",
          }}
        >
          <style>{`
            @keyframes segDropdown {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className={`px-3 py-2 border-b ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              {module.icon} {module.label}
            </p>
          </div>

          {/* Options */}
          <div className="py-1">
            {availableSegments.map((segId) => {
              const seg = module.segments[segId];
              if (!seg) return null;
              const isActive = segId === selectedSegment;

              return (
                <button
                  key={segId}
                  type="button"
                  onClick={() => {
                    onSegmentChange(segId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? isDark
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-cyan-50 text-cyan-700"
                      : isDark
                      ? "text-zinc-300 hover:bg-zinc-800"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-base mt-0.5">{seg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium ${isActive ? (isDark ? "text-cyan-300" : "text-cyan-700") : ""}`}>
                      {seg.label}
                      {isActive && (
                        <span className="ml-1.5 text-[9px] opacity-60">• ativo</span>
                      )}
                    </div>
                    <div className={`text-[10px] mt-0.5 leading-tight ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      {seg.description}
                    </div>
                  </div>
                  {isActive && (
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}