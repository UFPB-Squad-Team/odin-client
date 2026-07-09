"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ObservatorioDetailPanel } from "@/shell/components/observatorio-detail-panel";
import ComparePanel from "@/shell/components/compare-panel";
import { MapboxObservatorioMap } from "@/shell/components/mapbox-observatorio-map-v2";
import { ObservatorioSidebar } from "@/shell/components/observatorio-sidebar";
import { ShareLinkButton } from "@/shell/components/share-link-button";
import { MapIndicatorPicker } from "@/shell/components/map-indicator-picker";
import {
  type InterestProfileId,
  InterestProfileSelector,
} from "@/shell/components/profile-interest-selector";
import { RadiusAnalysisToggle, RadiusAnalysisPanel } from "@/shell/components/radius-analysis";
import { useIndicatorGroups } from "@/shell/hooks/use-indicator-groups";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCallback } from "react";
import { useTheme } from "next-themes";
import { useObservatorioShell } from "@/shell/hooks/use-observatorio-shell";
import { getModule } from "@/core/registry/module-registry";
import { JOAO_PESSOA_IBGE_ID } from "@/core/territory/territory-api";
import type { ShellContextType } from "@/core/types/shell";
import type { ObservatoryLayer } from "@/core/types/territory";
import type { DependenciaAdministrativa } from "@/core/types/comparision";
import { resolveLayerByZoom } from "@/core/geospatial/use-map-layers";
import { startObservatorioTour } from "../components/tour/observatorio-tour";

const STORAGE_KEY = "odin:observatorio:shell:v1";

const ZOOM_LAYER_SYNC_SUPPRESS_MS = 7000;

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
  simplifiedView: boolean;
};

const DEFAULT_MAP_VISUAL_CONTROLS: MapVisualControls = {
  styleId: "light",
  fillOpacity: 100,
  pointScale: 100,
  simplifiedView: false,
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

  return { longitude: -34.86, latitude: -7.12, zoom: 4.9 };
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

function isDarkMapStyle(styleId: MapStyleId) {
  return styleId === "dark" || styleId === "satellite";
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
  const simplifiedView = searchParams.get("simplified");

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
    simplifiedView:
      simplifiedView === "1" || simplifiedView === "true"
        ? true
        : DEFAULT_MAP_VISUAL_CONTROLS.simplifiedView,
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
  simplifiedView: boolean;
  sidebarCollapsed: boolean;
  zoom: number;
}) {
  const params = new URLSearchParams();
  if (state.estadoId) params.set("estado", state.estadoId);
  if (state.municipioId) params.set("municipio", state.municipioId);
  if (state.bairroId) params.set("bairro", state.bairroId);
  params.set("layer", state.activeLayer);
  if (state.activeModuleId) params.set("modulo", state.activeModuleId);
  // Sempre inclui o estado da sidebar na URL para preservar entre navegações
  params.set("sidebar", state.sidebarCollapsed ? "collapsed" : "expanded");
  params.set("lng", state.longitude.toFixed(6));
  params.set("lat", state.latitude.toFixed(6));
  params.set("zoom", state.zoom.toFixed(2));
  params.set("style", state.mapStyleId);
  params.set("fillOpacity", String(state.fillOpacity));
  params.set("pointScale", String(state.pointScale));
  if (state.simplifiedView) params.set("simplified", "1");
  return params;
}

export function ObservatorioShell() {

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const previousActiveLayerRef = useRef<ObservatoryLayer>("bairro");
  const skipZoomLayerSyncUntilRef = useRef(0);
  const autoSelectDoneRef = useRef(false);

  function suppressZoomLayerSync(durationMs = ZOOM_LAYER_SYNC_SUPPRESS_MS) {
    skipZoomLayerSyncUntilRef.current = Date.now() + durationMs;
  }

  const handleStartTour = () => {
    startObservatorioTour();
  };

  const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(
    null,
  );
  const [activeProfile, setActiveProfile] = useState<InterestProfileId | null>(null);

  const [mapViewState, setMapViewState] = useState<MapViewState>(() =>
    initialViewForLayer("bairro"),
  );
  const [mapVisualControls, setMapVisualControls] = useState<MapVisualControls>(
    DEFAULT_MAP_VISUAL_CONTROLS,
  );
  const { resolvedTheme } = useTheme();

  // Sincroniza o estilo do mapa com o tema (claro/escuro) automaticamente.
  useEffect(() => {
    if (!resolvedTheme) return;
    const desired: MapStyleId = resolvedTheme === "dark" ? "dark" : "light";
    setMapVisualControls((current) => (current.styleId === desired ? current : { ...current, styleId: desired }));
  }, [resolvedTheme]);
  const [comparePrimarySelection, setComparePrimarySelection] = useState<import("@/core/types/shell").ObservatorySelection | null>(null);
  const [compareSecondarySelection, setCompareSecondarySelection] = useState<import("@/core/types/shell").ObservatorySelection | null>(null);
  const [comparePanelOpen, setComparePanelOpen] = useState(false);

  // initialSidebarCollapsed: mesma semântica do state (true = recolhida).
  // Se não houver parâmetro "sidebar" na URL, undefined → o hook usa o default (true).
  // Antes disso era "initialSidebarExpanded" e era passado direto como o valor de
  // sidebarCollapsed dentro do hook — invertido. Isso, combinado com o restore
  // effect abaixo assumindo um default DIFERENTE quando o parâmetro está ausente,
  // causava o flash (um lugar assumia "recolhida por padrão", o outro "expandida").
  const sidebarParam = searchParams.get("sidebar");
  const initialSidebarCollapsed = sidebarParam === null
    ? undefined
    : sidebarParam === "collapsed";

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
  } = useObservatorioShell(initialSidebarCollapsed);

  function handleEntityClick(entity: import("@/core/types/shell").MapEntity) {
    selectEntity(entity);
  }

  const indicatorGroups = useIndicatorGroups(activeLayer, activeModuleId);

  const [radiusMode, setRadiusMode] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [radiusResult, setRadiusResult] = useState<import("@/shell/components/radius-analysis").RadiusAnalysisResult | null>(null);
  const [selectedDependencia, setSelectedDependencia] = useState<DependenciaAdministrativa[]>([]);
  const darkMapStyle = isDarkMapStyle(mapVisualControls.styleId);

  const firstIndicatorFor = (moduleId: string, layer: ObservatoryLayer, preferredIndicatorId?: string) => {
    const activeModule = getModule(moduleId);
    const indicators = activeModule?.getIndicators?.(layer) ?? [];
    if (preferredIndicatorId && indicators.some((indicator) => indicator.id === preferredIndicatorId)) {
      return preferredIndicatorId;
    }
    return indicators[0]?.id ?? null;
  };

  const applyProfile = (profile: InterestProfileId | "reset") => {
    suppressZoomLayerSync();

    if (profile === "family") {
      setActiveProfile("family");
      filters.setMunicipio(JOAO_PESSOA_IBGE_ID);
      setActiveModule("educacao");
      setActiveLayer("bairro");
      setActiveIndicatorId(firstIndicatorFor("educacao", "bairro", "pct_com_internet_alunos") ?? null);
      setMapVisualControls((current) => ({ ...current, simplifiedView: true }));
      setMapViewState(initialViewForLayer("bairro"));
      setSidebarCollapsed(false);
      setComparePanelOpen(false);
      return;
    }

    if (profile === "researcher") {
      setActiveProfile("researcher");
      filters.setMunicipio(JOAO_PESSOA_IBGE_ID);
      setActiveModule("socioeconomico");
      setActiveLayer("municipio");
      setActiveIndicatorId(firstIndicatorFor("socioeconomico", "municipio", "pct_agua_inadequada") ?? null);
      setMapVisualControls((current) => ({ ...current, simplifiedView: false }));
      setMapViewState(initialViewForLayer("municipio"));
      setSidebarCollapsed(false);
      setComparePanelOpen(false);
      return;
    }

    setActiveProfile(null);
    filters.setMunicipio(JOAO_PESSOA_IBGE_ID);
    setActiveModule("educacao");
    setActiveLayer("bairro");
    setMapViewState(initialViewForLayer("bairro"));
    setActiveIndicatorId(null);
    setMapVisualControls((current) => ({ ...current, simplifiedView: false }));
    setSidebarCollapsed(false);
    setComparePanelOpen(false);
  };

  const handleIndicatorSelect = (moduleId: string, indicatorId: string | null) => {
    if (moduleId !== activeModuleId) {
      setActiveModule(moduleId);
    }
    setActiveIndicatorId(indicatorId);
  };

  const handleToggleDependencia = useCallback((dependencia: DependenciaAdministrativa) => {
    setSelectedDependencia((prev) =>
      prev.includes(dependencia)
        ? prev.filter((d) => d !== dependencia)
        : [...prev, dependencia],
    );
  }, []);

  /**
   * Lógica de navegação ao selecionar resultado da busca universal.
   * Comportamento varia por tipo de resultado:
   * - municipio → centraliza + seleciona município + zoom 10
   * - bairro → centraliza + zoom 13
   * - escola → centraliza + zoom 15 + abre detalhes
   * - logradouro/cep → centraliza + ativa análise por raio
   */
  const handleSearchSelect = (item: import("@/shell/services/universal-search").SearchResultItem) => {
    const [lng, lat] = item.coordinates;

    switch (item.kind) {
      case "municipio":
        filters.setMunicipio(item.municipioIdIbge);
        suppressZoomLayerSync();
        setMapViewState({ longitude: lng, latitude: lat, zoom: 10 });
        break;

      case "bairro":
        if (item.municipioIdIbge && item.municipioIdIbge !== filters.municipioId) {
          filters.setMunicipio(item.municipioIdIbge);
        }
        suppressZoomLayerSync();
        setMapViewState({ longitude: lng, latitude: lat, zoom: 13 });
        break;

      case "escola":
        suppressZoomLayerSync();
        setMapViewState({ longitude: lng, latitude: lat, zoom: 15 });
        // Abre detalhes da escola
        selectEntity({
          kind: "escola",
          data: {
            id: item.id,
            nome: item.label,
            bairroId: String(item.metadata.bairro ?? ""),
            municipioId: item.municipioIdIbge,
            municipioNome: String(item.metadata.municipioNome ?? ""),
          },
        });
        break;

      case "logradouro":
      case "cep":
        // Centraliza e ativa análise por raio
        suppressZoomLayerSync();
        setMapViewState({ longitude: lng, latitude: lat, zoom: 14 });
        setRadiusMode(true);
        // Simula clique no ponto para disparar a análise
        setTimeout(() => {
          setRadiusResult(null); // será computado pelo próximo clique ou automaticamente
        }, 100);
        break;
    }
  };

  // ShellContext para módulos
  const shellContext: ShellContextType = {
    activeLayer,
    filters: {
      activeLayer,
      estadoId: filters.estadoId,
      municipioId: filters.municipioId,
      bairroId: filters.bairroId,
    },
    selectedEntity: selected
      ? (() => {
        if (selected.sourceEntity) {
          return selected.sourceEntity;
        }

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
    municipios: municipios || [],
    bairros: bairros || [],
    escolas: mapEntities
      .filter(e => e.kind === "escola")
      .map(e => e.data) || [],
    comparePrimarySelection,
    setComparePrimarySelection,
    compareSecondarySelection,
    setCompareSecondarySelection,
    comparePanelOpen,
    setComparePanelOpen,
  };

  // Restaura estado da URL ou localStorage na inicialização.
  // useLayoutEffect roda de forma síncrona ANTES do navegador pintar,
  // eliminando o flash da sidebar/selected ao carregar.
  useLayoutEffect(() => {
    if (initializedRef.current) return;

    const queryLayer = searchParams.get("layer");
    const querySidebarParam = searchParams.get("sidebar");
    const queryState = {
      activeModuleId: searchParams.get("modulo"),
      bairroId: searchParams.get("bairro"),
      estadoId: searchParams.get("estado"),
      layer: isLayer(queryLayer) ? queryLayer : null,
      municipioId: searchParams.get("municipio"),
      // undefined quando não há parâmetro explícito — nesse caso não mexemos
      // no sidebarCollapsed abaixo, deixando o valor já inicializado pelo hook.
      sidebarCollapsed: querySidebarParam === null
        ? undefined
        : querySidebarParam === "collapsed",
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
      searchParams.get("pointScale") ||
      searchParams.get("simplified")
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
            // Sempre recolhida ao restaurar de localStorage (comportamento
            // já existente antes desta correção — não alterado aqui).
            sidebarCollapsed: undefined,
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
              simplifiedView:
                parsed.visualControls?.simplifiedView ??
                DEFAULT_MAP_VISUAL_CONTROLS.simplifiedView,
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
      suppressZoomLayerSync();

      previousActiveLayerRef.current = initial.layer ?? activeLayer;
      if (initial.layer) setActiveLayer(initial.layer);

      if (initial.activeModuleId) {
        setActiveModule(initial.activeModuleId);
      }

      // Só mexe na sidebar se houve um sinal explícito (parâmetro na URL).
      // Sem isso, o valor já inicializado pelo useState do hook é preservado —
      // era essa reafirmação incondicional, com um default diferente do
      // useState, que causava o flash.
      if (initial.sidebarCollapsed !== undefined) {
        setSidebarCollapsed(initial.sidebarCollapsed);
      }

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
    // Não reseta a posição do mapa ao mudar de camada — mantém onde o usuário está.
    // O reset só acontece via botão "Centralizar".
  }, [activeLayer]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (Date.now() < skipZoomLayerSyncUntilRef.current) return;

    const resolvedLayer = resolveLayerByZoom(mapViewState.zoom, activeLayer);
    if (resolvedLayer !== activeLayer) {
      setActiveLayer(resolvedLayer);
    }
  }, [activeLayer, mapViewState.zoom, setActiveLayer]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (autoSelectDoneRef.current) return;

    if (activeLayer === "municipio" && filters.municipioId) {
      const municipio = municipios.find((m) => m.id === filters.municipioId);
      if (municipio && municipio.id !== selected?.id) {
        selectEntity({ kind: "municipio", data: municipio });
        autoSelectDoneRef.current = true;
        return;
      }
    }

    // Bairro: seleciona quando os bairros carregam
    if (activeLayer === "bairro" && filters.bairroId) {
      if (bairros.length === 0) return; // ainda carregando
      const bairro = bairros.find((b) => b.id === filters.bairroId);
      if (bairro && bairro.id !== selected?.id) {
        selectEntity({ kind: "bairro", data: bairro });
      }
      autoSelectDoneRef.current = true;
    }
  }, [filters.municipioId, filters.bairroId, bairros, municipios, selected?.id, selectEntity, activeLayer]);

  // Auto-pan quando município muda via dropdown
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!filters.municipioId) return;

    const municipio = municipios.find((m) => m.id === filters.municipioId);
    if (!municipio?.geoProps) return;

    const geoProps = municipio.geoProps as Record<string, unknown>;
    const centroide = geoProps._centroide as [number, number] | undefined;

    const zoomTarget = activeLayer === "municipio" ? 8 : activeLayer === "bairro" ? 12 : 13;

    if (centroide) {
      suppressZoomLayerSync();
      setMapViewState({
        longitude: centroide[0],
        latitude: centroide[1],
        zoom: zoomTarget,
      });
    }
  }, [filters.municipioId, municipios, activeLayer]);

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
          simplifiedView: mapVisualControls.simplifiedView,
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
      simplifiedView: mapVisualControls.simplifiedView,
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
      simplifiedView: mapVisualControls.simplifiedView,
      sidebarCollapsed,
      zoom: mapViewState.zoom,
    });

    return `${window.location.origin}${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <>
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
                  <span id="layer-selector" className="hidden rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:inline-flex">
                    {activeLayer}
                  </span>
                  <span className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 md:inline-flex">
                    • {mapEntities.length} entidades
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartTour}
                className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 shadow-sm transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-cyan-800/50 dark:bg-cyan-950/50 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
                aria-label="Iniciar tour guiado"
                title="Tour guiado pelo observatório"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <span className="hidden sm:inline">Tour</span>
              </button>
              <ShareLinkButton getUrl={buildShareUrl} />
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Voltar
              </Link>
              <div className="theme-toggle">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <InterestProfileSelector
              value={activeProfile}
              onSelect={applyProfile}
              onReset={() => applyProfile("reset")}
            />
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
              suppressZoomLayerSync();
              setActiveLayer(layer);
              setMapViewState(initialViewForLayer(layer));
            }}
            onSetBairro={filters.setBairro}
            onSetEstado={filters.setEstado}
            onSetMunicipio={filters.setMunicipio}
            onSearchSelect={handleSearchSelect}
            sidebarCollapsed={sidebarCollapsed}
            selectedDependencia={selectedDependencia}
            onToggleDependencia={handleToggleDependencia}
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
              radiusMode={radiusMode}
              radiusMeters={radiusMeters}
              onRadiusResult={setRadiusResult}
              selectedDependencia={activeLayer === "escola" ? selectedDependencia : undefined}
            />

            {/* Floating indicator picker */}
            <div className="absolute top-2 right-2 z-[20] sm:top-4 sm:right-4 flex flex-col gap-2 items-end">
              <MapIndicatorPicker
                groups={indicatorGroups}
                activeModuleId={activeModuleId}
                activeIndicatorId={activeIndicatorId}
                simplifiedView={mapVisualControls.simplifiedView}
                radiusMode={radiusMode}
                darkMapStyle={darkMapStyle}
                onSimplifiedViewChange={(value) =>
                  setMapVisualControls((current) => ({
                    ...current,
                    simplifiedView: value,
                  }))
                }
                onSelect={handleIndicatorSelect}
              />
              <div id="simplified-view-toggle">
                <RadiusAnalysisToggle
                  active={radiusMode}
                  darkMapStyle={darkMapStyle}
                  onToggle={() => {
                    setRadiusMode((v) => !v);
                    if (radiusMode) setRadiusResult(null);
                  }}
                />
              </div>
              {radiusMode && (
                <RadiusAnalysisPanel
                  result={radiusResult}
                  radiusMeters={radiusMeters}
                  darkMapStyle={darkMapStyle}
                  onRadiusChange={setRadiusMeters}
                  onClose={() => {
                    setRadiusMode(false);
                    setRadiusResult(null);
                  }}
                />
              )}
            </div>
          </div>

          <ObservatorioDetailPanel
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            selection={selected}
            activeModuleId={activeModuleId}
            shellContext={shellContext}
            onNavigate={handleEntityClick}
          />
          <div className="compare-button">
            <ComparePanel />
          </div>
        </div>
      </main >
    </>
  );
}
