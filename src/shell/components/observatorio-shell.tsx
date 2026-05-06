"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ObservatorioDetailPanel } from "@/shell/components/observatorio-detail-panel";
import { MapboxObservatorioMap } from "@/shell/components/mapbox-observatorio-map-v2";
import { ObservatorioSidebar } from "@/shell/components/observatorio-sidebar";
import { ShareLinkButton } from "@/shell/components/share-link-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ShellProvider } from "@/shell/context/shell-context";
import { ModuleBootstrap } from "@/shell/components/module-bootstrap";
import { useObservatorioShell } from "@/shell/hooks/use-observatorio-shell";
import type { ShellContextType } from "@/core/types/shell";
import type { ObservatoryLayer } from "@/core/types/territory";
import { resolveLayerByZoom } from "@/core/geospatial/use-map-layers";

const STORAGE_KEY = "odin:observatorio:shell:v1";

function isLayer(value: string | null): value is ObservatoryLayer {
  return value === "municipio" || value === "bairro" || value === "escola";
}

type MapViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type MapStyleId = "demo" | "light" | "dark" | "voyager" | "satellite";

type MapVisualControls = {
  styleId: MapStyleId;
  fillOpacity: number;
  pointScale: number;
};

const DEFAULT_MAP_VISUAL_CONTROLS: MapVisualControls = {
  styleId: "light",
  fillOpacity: 100,
  pointScale: 100,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function initialViewForLayer(layer: ObservatoryLayer): MapViewState {
  if (layer === "escola") {
    return { longitude: -34.86, latitude: -7.12, zoom: 13.5 };
  }

  if (layer === "bairro") {
    return { longitude: -34.86, latitude: -7.12, zoom: 9.5 };
  }

  return { longitude: -34.86, latitude: -7.12, zoom: 6.1 };
}

function isMapStyleId(value: string | null): value is MapStyleId {
  return (
    value === "demo" ||
    value === "light" ||
    value === "dark" ||
    value === "voyager" ||
    value === "satellite"
  );
}

function parseNumber(value: string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readMapViewState(
  searchParams: URLSearchParams,
  fallbackLayer: ObservatoryLayer,
): MapViewState {
  const fallback = initialViewForLayer(fallbackLayer);
  const longitude = parseNumber(searchParams.get("lng"));
  const latitude = parseNumber(searchParams.get("lat"));
  const zoom = parseNumber(searchParams.get("zoom"));

  return {
    longitude: longitude ?? fallback.longitude,
    latitude: latitude ?? fallback.latitude,
    zoom: clamp(zoom ?? fallback.zoom, 0, 22),
  };
}

function readMapVisualControls(searchParams: URLSearchParams) {
  const styleId = searchParams.get("style");
  const fillOpacity = parseNumber(searchParams.get("fillOpacity"));
  const pointScale = parseNumber(searchParams.get("pointScale"));

  return {
    styleId: isMapStyleId(styleId)
      ? styleId
      : DEFAULT_MAP_VISUAL_CONTROLS.styleId,
    fillOpacity: clamp(
      fillOpacity ?? DEFAULT_MAP_VISUAL_CONTROLS.fillOpacity,
      20,
      100,
    ),
    pointScale: clamp(
      pointScale ?? DEFAULT_MAP_VISUAL_CONTROLS.pointScale,
      70,
      160,
    ),
  } satisfies MapVisualControls;
}

function buildShareableSearchParams(state: {
  activeLayer: ObservatoryLayer;
  activeModuleId: string | null;
  bairroId: string | null;
  estadoId: string | null;
  fillOpacity: number;
  latitude: number;
  longitude: number;
  mapStyleId: MapStyleId;
  municipioId: string | null;
  pointScale: number;
  sidebarCollapsed: boolean;
  zoom: number;
}) {
  const params = new URLSearchParams();
  if (state.estadoId) params.set("estado", state.estadoId);
  if (state.municipioId) params.set("municipio", state.municipioId);
  if (state.bairroId) params.set("bairro", state.bairroId);
  params.set("layer", state.activeLayer);
  if (state.activeModuleId) params.set("modulo", state.activeModuleId);
  if (state.sidebarCollapsed) params.set("sidebar", "collapsed");
  params.set("lng", state.longitude.toFixed(6));
  params.set("lat", state.latitude.toFixed(6));
  params.set("zoom", state.zoom.toFixed(2));
  params.set("style", state.mapStyleId);
  params.set("fillOpacity", String(state.fillOpacity));
  params.set("pointScale", String(state.pointScale));
  return params;
}

export function ObservatorioShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const previousActiveLayerRef = useRef<ObservatoryLayer>("bairro");
  const skipZoomLayerSyncRef = useRef(false);

  const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(
    null,
  );
  const [mapViewState, setMapViewState] = useState<MapViewState>(() =>
    initialViewForLayer("bairro"),
  );
  const [mapVisualControls, setMapVisualControls] = useState<MapVisualControls>(
    DEFAULT_MAP_VISUAL_CONTROLS,
  );

  const {
    activeLayer,
    applyFilterPath,
    bairros,
    detailsOpen,
    disableBootstrapDefaults,
    estados,
    filters,
    loading,
    mapEntities,
    municipios,
    selected,
    selectEntity,
    setActiveLayer,
    setDetailsOpen,
    activeModuleId,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useObservatorioShell();

  function handleEntityClick(entity: import("@/core/types/shell").MapEntity) {
    selectEntity(entity);
  }

  // ShellContext para módulos
  const shellContext: ShellContextType = {
    activeLayer,
    filters: {
      estadoId: filters.estadoId,
      municipioId: filters.municipioId,
      bairroId: filters.bairroId,
    },
    selectedEntity: selected
      ? (() => {
          if (selected.kind === "municipio") {
            const found = municipios.find((m) => m.id === selected.id);
            if (found) {
              return {
                kind: "municipio" as const,
                data: found,
              };
            }
            return {
              kind: "municipio" as const,
              data: {
                id: selected.id,
                nome: selected.nome,
                estadoId: filters.estadoId ?? "",
                geoProps: undefined,
              },
            };
          }

          if (selected.kind === "bairro") {
            const found = bairros.find((item) => item.id === selected.id);
            if (found) {
              return {
                kind: "bairro" as const,
                data: found,
              };
            }
            return {
              kind: "bairro" as const,
              data: {
                id: selected.id,
                nome: selected.nome,
                municipioId: filters.municipioId ?? "",
              },
            };
          }

          const fallbackSchool = mapEntities.find(
            (entity) =>
              entity.kind === "escola" &&
              (entity.data.id === selected.id || entity.data.inepId === selected.id),
          );

          if (fallbackSchool) {
            return fallbackSchool;
          }

          return {
            kind: selected.kind,
            data: { id: selected.id, nome: selected.nome },
          } as import("@/core/types/shell").MapEntity;
        })()
      : null,
    activeModuleId,
    setActiveLayer,
    setActiveModule,
  };

  // Restaura estado da URL ou localStorage na inicialização
  useEffect(() => {
    if (initializedRef.current) return;

    const queryLayer = searchParams.get("layer");
    const queryState = {
      activeModuleId: searchParams.get("modulo"),
      bairroId: searchParams.get("bairro"),
      estadoId: searchParams.get("estado"),
      layer: isLayer(queryLayer) ? queryLayer : null,
      municipioId: searchParams.get("municipio"),
      sidebarCollapsed: searchParams.get("sidebar") === "collapsed",
      viewState: readMapViewState(
        searchParams,
        isLayer(queryLayer) ? queryLayer : activeLayer,
      ),
      visualControls: readMapVisualControls(searchParams),
    };

    const hasQueryState = Boolean(
      queryState.activeModuleId ||
      queryState.estadoId ||
      queryState.municipioId ||
      queryState.bairroId ||
      queryState.layer ||
      searchParams.get("sidebar") ||
      searchParams.get("lng") ||
      searchParams.get("lat") ||
      searchParams.get("zoom") ||
      searchParams.get("style") ||
      searchParams.get("fillOpacity") ||
      searchParams.get("pointScale"),
    );

    let storageState: {
      activeModuleId?: string | null;
      bairroId?: string | null;
      estadoId?: string | null;
      layer?: ObservatoryLayer;
      municipioId?: string | null;
      sidebarCollapsed?: boolean;
      viewState?: MapViewState;
      visualControls?: MapVisualControls;
    } | null = null;

    if (!hasQueryState) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            activeModuleId?: string | null;
            bairroId?: string | null;
            estadoId?: string | null;
            layer?: string;
            municipioId?: string | null;
            sidebarCollapsed?: boolean;
            viewState?: Partial<MapViewState>;
            visualControls?: Partial<MapVisualControls>;
          };
          const parsedLayer = isLayer(parsed.layer ?? null)
            ? (parsed.layer as ObservatoryLayer)
            : undefined;
          storageState = {
            activeModuleId: parsed.activeModuleId ?? null,
            bairroId: parsed.bairroId ?? null,
            estadoId: parsed.estadoId ?? null,
            layer: parsedLayer,
            municipioId: parsed.municipioId ?? null,
            sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
            viewState: {
              longitude:
                parsed.viewState?.longitude ??
                initialViewForLayer(parsedLayer ?? activeLayer).longitude,
              latitude:
                parsed.viewState?.latitude ??
                initialViewForLayer(parsedLayer ?? activeLayer).latitude,
              zoom: clamp(
                parsed.viewState?.zoom ??
                  initialViewForLayer(parsedLayer ?? activeLayer).zoom,
                0,
                22,
              ),
            },
            visualControls: {
              styleId: isMapStyleId(parsed.visualControls?.styleId ?? null)
                ? parsed.visualControls!.styleId!
                : DEFAULT_MAP_VISUAL_CONTROLS.styleId,
              fillOpacity: clamp(
                parsed.visualControls?.fillOpacity ??
                  DEFAULT_MAP_VISUAL_CONTROLS.fillOpacity,
                20,
                100,
              ),
              pointScale: clamp(
                parsed.visualControls?.pointScale ??
                  DEFAULT_MAP_VISUAL_CONTROLS.pointScale,
                70,
                160,
              ),
            },
          };
        }
      } catch {
        storageState = null;
      }
    }

    const initial = hasQueryState
      ? {
          activeModuleId: queryState.activeModuleId ?? undefined,
          bairroId: queryState.bairroId,
          estadoId: queryState.estadoId,
          layer: queryState.layer ?? undefined,
          municipioId: queryState.municipioId,
          sidebarCollapsed: queryState.sidebarCollapsed,
          viewState: queryState.viewState,
          visualControls: queryState.visualControls,
        }
      : storageState;

    if (initial) {
      disableBootstrapDefaults();

      previousActiveLayerRef.current = initial.layer ?? activeLayer;
      if (initial.layer) setActiveLayer(initial.layer);

      if (initial.activeModuleId) {
        setActiveModule(initial.activeModuleId);
      }

      setSidebarCollapsed(Boolean(initial.sidebarCollapsed));
      applyFilterPath({
        bairroId: initial.bairroId,
        estadoId: initial.estadoId,
        municipioId: initial.municipioId,
      });

      setMapViewState(
        initial.viewState ?? initialViewForLayer(initial.layer ?? activeLayer),
      );
      setMapVisualControls(
        initial.visualControls ?? DEFAULT_MAP_VISUAL_CONTROLS,
      );
    }

    initializedRef.current = true;
  }, [
    activeLayer,
    applyFilterPath,
    disableBootstrapDefaults,
    searchParams,
    setActiveLayer,
    setActiveModule,
    setSidebarCollapsed,
  ]);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (previousActiveLayerRef.current === activeLayer) {
      return;
    }

    previousActiveLayerRef.current = activeLayer;
    skipZoomLayerSyncRef.current = true;
    setMapViewState(initialViewForLayer(activeLayer));
  }, [activeLayer]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (skipZoomLayerSyncRef.current) {
      skipZoomLayerSyncRef.current = false;
      return;
    }

    const resolvedLayer = resolveLayerByZoom(mapViewState.zoom, activeLayer);
    if (resolvedLayer !== activeLayer) {
      setActiveLayer(resolvedLayer);
    }
  }, [activeLayer, mapViewState.zoom, setActiveLayer]);

  // Persiste em localStorage
  useEffect(() => {
    if (!initializedRef.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeLayer,
          activeModuleId,
          bairroId: filters.bairroId,
          estadoId: filters.estadoId,
          fillOpacity: mapVisualControls.fillOpacity,
          layer: activeLayer,
          municipioId: filters.municipioId,
          pointScale: mapVisualControls.pointScale,
          sidebarCollapsed,
          viewState: mapViewState,
          visualControls: mapVisualControls,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    activeLayer,
    activeModuleId,
    filters.bairroId,
    filters.estadoId,
    filters.municipioId,
    mapViewState,
    mapVisualControls,
    sidebarCollapsed,
  ]);

  // Sincroniza URL
  useEffect(() => {
    if (!initializedRef.current) return;
    const params = buildShareableSearchParams({
      activeLayer,
      activeModuleId,
      bairroId: filters.bairroId,
      estadoId: filters.estadoId,
      fillOpacity: mapVisualControls.fillOpacity,
      latitude: mapViewState.latitude,
      longitude: mapViewState.longitude,
      mapStyleId: mapVisualControls.styleId,
      municipioId: filters.municipioId,
      pointScale: mapVisualControls.pointScale,
      sidebarCollapsed,
      zoom: mapViewState.zoom,
    });
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
  }, [
    activeLayer,
    activeModuleId,
    filters.bairroId,
    filters.estadoId,
    filters.municipioId,
    mapViewState,
    mapVisualControls,
    pathname,
    router,
    searchParams,
    sidebarCollapsed,
  ]);

  // Atalhos de teclado
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
        (
          document.getElementById(
            "observatorio-smart-search",
          ) as HTMLInputElement | null
        )?.focus();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }
      if (event.key === "Escape" && detailsOpen) setDetailsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [detailsOpen, setDetailsOpen, setSidebarCollapsed]);

  const buildShareUrl = () => {
    const params = buildShareableSearchParams({
      activeLayer,
      activeModuleId,
      bairroId: filters.bairroId,
      estadoId: filters.estadoId,
      fillOpacity: mapVisualControls.fillOpacity,
      latitude: mapViewState.latitude,
      longitude: mapViewState.longitude,
      mapStyleId: mapVisualControls.styleId,
      municipioId: filters.municipioId,
      pointScale: mapVisualControls.pointScale,
      sidebarCollapsed,
      zoom: mapViewState.zoom,
    });

    return `${window.location.origin}${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <ShellProvider value={shellContext}>
      <ModuleBootstrap />
      <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-900 transition-colors dark:text-zinc-100">
        <header className="relative z-[50] border-b border-zinc-200/80 bg-white/90 px-3 py-3 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85 sm:px-4">
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
              <ShareLinkButton getUrl={buildShareUrl} />
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

        <div className="relative h-[calc(100vh-65px)] w-full overflow-hidden">
          <ObservatorioSidebar
            activeLayer={activeLayer}
            bairroId={filters.bairroId}
            bairros={bairros}
            estadoId={filters.estadoId}
            estados={estados}
            municipioId={filters.municipioId}
            municipios={municipios}
            onLayerChange={(layer) => {
              skipZoomLayerSyncRef.current = true;
              setActiveLayer(layer);
            }}
            onSetBairro={filters.setBairro}
            onSetEstado={filters.setEstado}
            onSetMunicipio={filters.setMunicipio}
            sidebarCollapsed={sidebarCollapsed}
            shellContext={shellContext}
            activeIndicatorId={activeIndicatorId}
            onIndicatorChange={setActiveIndicatorId}
          />

          {/* O MAPA AGORA OCUPA 100% SEMPRE */}
          <div className="absolute inset-0 z-[10]">
            <MapboxObservatorioMap
              activeLayer={activeLayer}
              activeModuleId={activeModuleId}
              activeIndicatorId={activeIndicatorId}
              entities={mapEntities}
              isLoading={
                loading.escolas || loading.bairros || loading.municipios
              }
              onEntityClick={handleEntityClick}
              onRecenter={() =>
                setMapViewState(initialViewForLayer(activeLayer))
              }
              onResetVisual={() =>
                setMapVisualControls(DEFAULT_MAP_VISUAL_CONTROLS)
              }
              onViewStateChange={setMapViewState}
              onVisualControlsChange={setMapVisualControls}
              selectedId={selected?.id}
              estadoId={filters.estadoId}
              municipioId={filters.municipioId}
              bairroId={filters.bairroId}
              viewState={mapViewState}
              visualControls={mapVisualControls}
            />
          </div>

          <ObservatorioDetailPanel
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            selection={selected}
            activeModuleId={activeModuleId}
            shellContext={shellContext}
            onNavigate={handleEntityClick}
          />
        </div>
      </main>
    </ShellProvider>
  );
}
