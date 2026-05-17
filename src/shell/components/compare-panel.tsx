"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useShellContext } from "@/shell/context/shell-context";
import RadarChart from "@/shell/components/radar-chart";
import { useObservatorioShell } from "@/shell/hooks/use-observatorio-shell";

type Option = {
  id: string;
  label: string;
  subtitle?: string;
  kind: "municipio" | "bairro" | "escola";
  source: import("@/core/types/shell").ObservatorySelection;
};

export default function ComparePanel() {
  const ctx = useShellContext();

  const primary = ctx.comparePrimarySelection ?? null;
  const secondary = ctx.compareSecondarySelection ?? null;
  const { municipios, bairros, escolas, activeLayer } = useObservatorioShell();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const options: Option[] = useMemo(() => {
    if (activeLayer === "municipio") {
      return municipios.map((m) => ({
        id: m.id,
        label: m.nome,
        subtitle: m.estadoId?.toUpperCase() ?? undefined,
        kind: "municipio",
        source: { id: m.id, nome: m.nome, kind: "municipio", subtitle: m.estadoId?.toUpperCase() ?? "Município" },
      }));
    }
    if (activeLayer === "bairro") {
      return bairros.map((b) => ({
        id: b.id,
        label: b.nome,
        subtitle: b.municipioId?.toUpperCase() ?? undefined,
        kind: "bairro",
        source: { id: b.id, nome: b.nome, kind: "bairro", subtitle: "Vizinhança" },
      }));
    }
    return escolas.map((s) => ({
      id: s.id,
      label: s.nome,
      subtitle: s.bairroNome?.toUpperCase() ?? s.municipioNome?.toUpperCase() ?? undefined,
      kind: "escola",
      source: { id: s.id, nome: s.nome, kind: "escola", subtitle: s.bairroNome?.toUpperCase() ?? s.municipioNome?.toUpperCase() ?? "Escola" },
    }));
  }, [activeLayer, bairros, escolas, municipios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => (o.label + " " + (o.subtitle ?? "")).toLowerCase().includes(q)).slice(0, 12);
  }, [options, query]);

  function clearAll() {
    ctx.setComparePrimarySelection?.(null);
    ctx.setCompareSecondarySelection?.(null);
    ctx.setComparePanelOpen?.(false);
  }

  useEffect(() => {
    if (ctx.comparePanelOpen) {
      // focus input for quick selection
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [ctx.comparePanelOpen]);

  if (!ctx.comparePanelOpen) return null;

  return (
    <div className="fixed left-1/2 top-12 z-50 w-[min(46rem,95%)] -translate-x-1/2 rounded-md border border-zinc-200 bg-white/95 p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-600 dark:text-cyan-400">Comparar</p>
          <h3 className="mt-1 text-sm font-semibold truncate">Comparação Lado a Lado</h3>
          <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-300">{primary ? `${primary.nome} — selecione a segunda entidade` : "Selecione duas entidades para comparar"}</p>
        </div>

          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => ctx.setComparePanelOpen?.(false)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Limpar comparação
          </button>
            <a
              href="/observatorio/compare"
              className="ml-2 inline-flex items-center rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
            >
              Abrir página de comparação
            </a>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/70">
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Primária</h4>
          <div className="mt-2">
            <div className="text-sm font-medium">{primary?.nome ?? "—"}</div>
            <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-300">{primary?.subtitle ?? ""}</div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/70">
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Secundária</h4>
          <div className="mt-2">
            <div className="text-sm font-medium">{secondary?.nome ?? "—"}</div>
            <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-300">{secondary?.subtitle ?? ""}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-3">
          {!secondary ? (
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Pesquisar {activeLayer}</label>
              <div className="mt-2 flex gap-2">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Buscar ${activeLayer} por nome...`}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
                />
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700"
                >
                  Limpar
                </button>
              </div>

              <ul className="mt-2 max-h-48 overflow-auto">
                {filtered.map((opt) => (
                  <li key={opt.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        ctx.setCompareSecondarySelection?.(opt.source);
                      }}
                      className="w-full text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      {opt.subtitle ? <div className="text-xs text-zinc-500">{opt.subtitle}</div> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <RadarChart a={primary} b={secondary} />
        </div>
      </div>
    </div>
  );
}
