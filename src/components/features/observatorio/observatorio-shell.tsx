"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ObservatorioDetailPanel } from "@/components/features/observatorio/observatorio-detail-panel";
import { MapboxObservatorioMap } from "@/components/features/observatorio/mapbox-observatorio-map-v2";
import { ObservatorioSidebar } from "@/components/features/observatorio/observatorio-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useObservatorioShell } from "@/hooks/use-observatorio-shell";
import type { ObservatoryLayer } from "@/types/observatory";

const STORAGE_KEY = "odin:observatorio:shell:v1";

function isLayer(value: string | null): value is ObservatoryLayer {
  return value === "municipio" || value === "bairro" || value === "escola";
}

export function ObservatorioShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  const {
    activeLayer,
    applyFilterPath,
    applySuggestion,
    bairros,
    detailsOpen,
    disableBootstrapDefaults,
    estados,
    filters,
    loading,
    mapEntities,
    municipios,
    searchSuggestions,
    selected,
    selectEntity,
    setActiveLayer,
    setDetailsOpen,
  } = useObservatorioShell();

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const queryLayer = searchParams.get("layer");
    const queryState = {
      bairroId: searchParams.get("bairro"),
      estadoId: searchParams.get("estado"),
      layer: isLayer(queryLayer) ? queryLayer : null,
      municipioId: searchParams.get("municipio"),
      sidebarCollapsed: searchParams.get("sidebar") === "collapsed",
    };

    const hasQueryState = Boolean(
      queryState.estadoId ||
      queryState.municipioId ||
      queryState.bairroId ||
      queryState.layer ||
      searchParams.get("sidebar"),
    );

    let storageState: {
      bairroId?: string | null;
      estadoId?: string | null;
      layer?: ObservatoryLayer;
      municipioId?: string | null;
      sidebarCollapsed?: boolean;
    } | null = null;

    if (!hasQueryState) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            bairroId?: string | null;
            estadoId?: string | null;
            layer?: string;
            municipioId?: string | null;
            sidebarCollapsed?: boolean;
          };

          storageState = {
            bairroId: parsed.bairroId ?? null,
            estadoId: parsed.estadoId ?? null,
            layer: isLayer(parsed.layer ?? null)
              ? (parsed.layer as ObservatoryLayer)
              : undefined,
            municipioId: parsed.municipioId ?? null,
            sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
          };
        }
      } catch {
        storageState = null;
      }
    }

    const initial = hasQueryState
      ? {
          bairroId: queryState.bairroId,
          estadoId: queryState.estadoId,
          layer: queryState.layer ?? undefined,
          municipioId: queryState.municipioId,
          sidebarCollapsed: queryState.sidebarCollapsed,
        }
      : storageState;

    if (initial) {
      disableBootstrapDefaults();
      if (initial.layer) {
        setActiveLayer(initial.layer);
      }
      setSidebarCollapsed(Boolean(initial.sidebarCollapsed));
      applyFilterPath({
        bairroId: initial.bairroId,
        estadoId: initial.estadoId,
        municipioId: initial.municipioId,
      });
    }

    initializedRef.current = true;
  }, [applyFilterPath, disableBootstrapDefaults, searchParams, setActiveLayer]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const state = {
      activeLayer,
      bairroId: filters.bairroId,
      estadoId: filters.estadoId,
      municipioId: filters.municipioId,
      sidebarCollapsed,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failures
    }
  }, [
    activeLayer,
    filters.bairroId,
    filters.estadoId,
    filters.municipioId,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const params = new URLSearchParams();

    if (filters.estadoId) params.set("estado", filters.estadoId);
    if (filters.municipioId) params.set("municipio", filters.municipioId);
    if (filters.bairroId) params.set("bairro", filters.bairroId);
    params.set("layer", activeLayer);
    if (sidebarCollapsed) params.set("sidebar", "collapsed");

    const next = params.toString();
    const current = searchParams.toString();

    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
  }, [
    activeLayer,
    filters.bairroId,
    filters.estadoId,
    filters.municipioId,
    pathname,
    router,
    searchParams,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = Boolean(
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable),
      );

      if (
        !isTyping &&
        (event.key === "/" ||
          ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k"))
      ) {
        event.preventDefault();
        const input = document.getElementById(
          "observatorio-smart-search",
        ) as HTMLInputElement | null;
        input?.focus();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      if (event.key === "Escape" && detailsOpen) {
        setDetailsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailsOpen, setDetailsOpen]);

  return (
    <main className="grid h-screen w-screen grid-rows-[auto_1fr] overflow-hidden bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200/80 bg-white/90 px-3 py-3 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label={
                sidebarCollapsed ? "Expandir filtros" : "Recolher filtros"
              }
            >
              <span className="text-sm leading-none">
                {sidebarCollapsed ? "☰" : "›"}
              </span>
              <span className="hidden sm:inline">
                {sidebarCollapsed ? "Expandir" : "Recolher"}
              </span>
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                Observatório
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-xl">
                  ODIN
                </h1>
                <span className="hidden rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:inline-flex">
                  {activeLayer}
                </span>
                <span className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 md:inline-flex">
                  • {mapEntities.length} entidades
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Voltar
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div
        className={`grid min-h-0 w-full grid-cols-1 transition-all duration-200 ${
          sidebarCollapsed
            ? "md:grid-cols-[0_1fr]"
            : "md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]"
        }`}
      >
        <ObservatorioSidebar
          activeLayer={activeLayer}
          bairroId={filters.bairroId}
          bairros={bairros}
          estadoId={filters.estadoId}
          estados={estados}
          loading={loading}
          municipioId={filters.municipioId}
          municipios={municipios}
          onLayerChange={setActiveLayer}
          onApplySuggestion={applySuggestion}
          onSetBairro={filters.setBairro}
          onSetEstado={filters.setEstado}
          onSetMunicipio={filters.setMunicipio}
          searchSuggestions={searchSuggestions}
          sidebarCollapsed={sidebarCollapsed}
        />

        <div className="relative h-full min-h-0">
          <MapboxObservatorioMap
            activeLayer={activeLayer}
            entities={mapEntities}
            isLoading={loading.escolas || loading.bairros || loading.municipios}
            onEntityClick={selectEntity}
            selectedId={selected?.id}
            estadoId={filters.estadoId}
            municipioId={filters.municipioId}
            bairroId={filters.bairroId}
          />

          <ObservatorioDetailPanel
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            selection={selected}
          />
        </div>
      </div>
    </main>
  );
}
