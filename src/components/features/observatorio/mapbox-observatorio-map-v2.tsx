"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { useMapLayers } from "@/hooks/use-map-layers";
import {
  LAYER_STYLES,
  type GeoJSONFeature,
  type MapEntity,
  type ObservatoryLayer,
} from "@/types/observatory";

type MapboxObservatorioMapProps = {
  activeLayer: ObservatoryLayer;
  entities: MapEntity[];
  isLoading: boolean;
  selectedId?: string;
  onEntityClick: (entity: MapEntity) => void;
  estadoId?: string | null;
  municipioId?: string | null;
  bairroId?: string | null;
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type Point = [number, number];

type PointFeature = {
  type: "Feature";
  id: string;
  properties: {
    id: string;
    nome: string;
    nivel: ObservatoryLayer;
    intensity: number;
  };
  geometry: {
    type: "Point";
    coordinates: Point;
  };
};

type PointFeatureCollection = {
  type: "FeatureCollection";
  features: PointFeature[];
};

type MapStyleId = "demo" | "light" | "dark" | "voyager";

type MapControlsState = {
  styleId: MapStyleId;
  showHeatmap: boolean;
  showPolygons: boolean;
  showPoints: boolean;
  fillOpacity: number;
  pointScale: number;
  enableDragPan: boolean;
  enableScrollZoom: boolean;
  enableHover: boolean;
  lockRotation: boolean;
  resetViewOnLayerChange: boolean;
};

const MAP_STYLE_OPTIONS: Array<{ id: MapStyleId; label: string; url: string }> =
  [
    {
      id: "demo",
      label: "Padrão",
      url: "https://demotiles.maplibre.org/style.json",
    },
    {
      id: "light",
      label: "Claro",
      url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    },
    {
      id: "dark",
      label: "Escuro",
      url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    },
    {
      id: "voyager",
      label: "Voyager",
      url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    },
  ];

const MAP_CONTROLS_STORAGE_KEY = "observatorio.map.controls.v2";

const DEFAULT_MAP_CONTROLS: MapControlsState = {
  styleId: "demo",
  showHeatmap: false,
  showPolygons: true,
  showPoints: true,
  fillOpacity: 100,
  pointScale: 100,
  enableDragPan: true,
  enableScrollZoom: true,
  enableHover: true,
  lockRotation: true,
  resetViewOnLayerChange: true,
};

function isMapStyleId(value: unknown): value is MapStyleId {
  return (
    typeof value === "string" &&
    MAP_STYLE_OPTIONS.some((option) => option.id === value)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMapControls(
  value: Partial<MapControlsState> | null | undefined,
): MapControlsState {
  if (!value) {
    return DEFAULT_MAP_CONTROLS;
  }

  const normalized: MapControlsState = {
    styleId: isMapStyleId(value.styleId)
      ? value.styleId
      : DEFAULT_MAP_CONTROLS.styleId,
    showHeatmap:
      typeof value.showHeatmap === "boolean"
        ? value.showHeatmap
        : DEFAULT_MAP_CONTROLS.showHeatmap,
    showPolygons:
      typeof value.showPolygons === "boolean"
        ? value.showPolygons
        : DEFAULT_MAP_CONTROLS.showPolygons,
    showPoints:
      typeof value.showPoints === "boolean"
        ? value.showPoints
        : DEFAULT_MAP_CONTROLS.showPoints,
    fillOpacity:
      typeof value.fillOpacity === "number"
        ? clamp(value.fillOpacity, 0, 100)
        : DEFAULT_MAP_CONTROLS.fillOpacity,
    pointScale:
      typeof value.pointScale === "number"
        ? clamp(value.pointScale, 50, 220)
        : DEFAULT_MAP_CONTROLS.pointScale,
    enableDragPan:
      typeof value.enableDragPan === "boolean"
        ? value.enableDragPan
        : DEFAULT_MAP_CONTROLS.enableDragPan,
    enableScrollZoom:
      typeof value.enableScrollZoom === "boolean"
        ? value.enableScrollZoom
        : DEFAULT_MAP_CONTROLS.enableScrollZoom,
    enableHover:
      typeof value.enableHover === "boolean"
        ? value.enableHover
        : DEFAULT_MAP_CONTROLS.enableHover,
    lockRotation:
      typeof value.lockRotation === "boolean"
        ? value.lockRotation
        : DEFAULT_MAP_CONTROLS.lockRotation,
    resetViewOnLayerChange:
      typeof value.resetViewOnLayerChange === "boolean"
        ? value.resetViewOnLayerChange
        : DEFAULT_MAP_CONTROLS.resetViewOnLayerChange,
  };

  if (!normalized.showPolygons && !normalized.showPoints) {
    normalized.showPolygons = true;
  }

  return normalized;
}

const EMPTY_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

function initialViewForLayer(layer: ObservatoryLayer): ViewState {
  if (layer === "escola") {
    return { longitude: -34.86, latitude: -7.12, zoom: 13.5 };
  }

  if (layer === "bairro") {
    return { longitude: -34.86, latitude: -7.12, zoom: 9.5 };
  }

  return { longitude: -34.86, latitude: -7.12, zoom: 6.1 };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLayerIds(layer: ObservatoryLayer) {
  return {
    source: `layer-${layer}`,
    heatSource: `layer-${layer}-heat-source`,
    heat: `layer-${layer}-heat`,
    heatHalo: `layer-${layer}-heat-halo`,
    fill: `layer-${layer}-fill`,
    points: `layer-${layer}-points`,
    line: `layer-${layer}-line`,
    hoverFill: `layer-${layer}-hover-fill`,
    hoverPoint: `layer-${layer}-hover-point`,
    hoverLine: `layer-${layer}-hover-line`,
    selectedFill: `layer-${layer}-selected-fill`,
    selectedPoint: `layer-${layer}-selected-point`,
    selectedLine: `layer-${layer}-selected-line`,
  };
}

function collectPoints(feature: GeoJSONFeature): Point[] {
  if (feature.geometry.type === "Point") {
    return [feature.geometry.coordinates];
  }

  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates.flat() as Point[];
  }

  return feature.geometry.coordinates.flat(2) as Point[];
}

function getCentroid(feature: GeoJSONFeature): Point | null {
  const points = collectPoints(feature);

  if (points.length === 0) {
    return null;
  }

  const totals = points.reduce(
    (accumulator, [longitude, latitude]) => ({
      longitude: accumulator.longitude + longitude,
      latitude: accumulator.latitude + latitude,
    }),
    { longitude: 0, latitude: 0 },
  );

  return [totals.longitude / points.length, totals.latitude / points.length];
}

export function MapboxObservatorioMap({
  activeLayer,
  entities,
  isLoading,
  selectedId,
  onEntityClick,
  estadoId,
  municipioId,
  bairroId,
}: MapboxObservatorioMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const previousActiveLayerRef = useRef(activeLayer);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controls, setControls] =
    useState<MapControlsState>(DEFAULT_MAP_CONTROLS);
  const [viewState, setViewState] = useState<ViewState>(() =>
    initialViewForLayer(activeLayer),
  );

  const {
    activeLayer: resolvedLayer,
    collection,
    error,
    loading: layerLoading,
  } = useMapLayers({
    activeLayer,
    estadoId,
    municipioId,
    bairroId,
    zoom: viewState.zoom,
  });

  const layerStyle = LAYER_STYLES[resolvedLayer];
  const ids = useMemo(() => buildLayerIds(resolvedLayer), [resolvedLayer]);
  const geojsonData = collection ?? EMPTY_COLLECTION;
  const mapStyleUrl = useMemo(() => {
    const style = MAP_STYLE_OPTIONS.find(
      (option) => option.id === controls.styleId,
    );
    return style?.url ?? MAP_STYLE_OPTIONS[0].url;
  }, [controls.styleId]);
  const pointScaleFactor = controls.pointScale / 100;
  const effectiveFillOpacity = clamp(
    layerStyle.opacity * (controls.fillOpacity / 100),
    0,
    0.85,
  );
  const interactiveLayerIds = useMemo(() => {
    const list = [] as string[];

    if (controls.showPolygons) {
      list.push(ids.fill, ids.hoverFill, ids.selectedFill);
    }

    if (controls.showPoints) {
      list.push(ids.points, ids.hoverPoint, ids.selectedPoint);
    }

    return list;
  }, [
    controls.showPoints,
    controls.showPolygons,
    ids.fill,
    ids.hoverFill,
    ids.hoverPoint,
    ids.points,
    ids.selectedFill,
    ids.selectedPoint,
  ]);

  useEffect(() => {
    try {
      const rawValue = localStorage.getItem(MAP_CONTROLS_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue) as Partial<MapControlsState>;
      setControls(normalizeMapControls(parsed));
    } catch {
      setControls(DEFAULT_MAP_CONTROLS);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_CONTROLS_STORAGE_KEY, JSON.stringify(controls));
    } catch {
      // silent: localStorage unavailable
    }
  }, [controls]);

  const heatmapData = useMemo<PointFeatureCollection>(() => {
    const features = geojsonData.features ?? [];
    const sourceFeatures: PointFeature[] = features.flatMap(
      (feature, index) => {
        const coordinates =
          feature.geometry.type === "Point"
            ? feature.geometry.coordinates
            : getCentroid(feature);

        if (!coordinates) {
          return [];
        }

        const rawProperties = feature.properties as Record<string, unknown>;
        const rawIdeb = rawProperties.ideb;
        const intensity =
          typeof rawIdeb === "number"
            ? Math.max(0.35, Math.min(1, rawIdeb / 10))
            : 0.5 + Math.abs(Math.sin(index)) * 0.5;

        return [
          {
            type: "Feature",
            id: String(feature.id),
            properties: {
              id: feature.properties.id,
              nome: feature.properties.nome,
              nivel: feature.properties.nivel,
              intensity,
            },
            geometry: {
              type: "Point",
              coordinates,
            },
          },
        ];
      },
    );

    return { type: "FeatureCollection", features: sourceFeatures };
  }, [geojsonData]);

  useEffect(() => {
    if (previousActiveLayerRef.current !== activeLayer) {
      previousActiveLayerRef.current = activeLayer;
      if (controls.resetViewOnLayerChange) {
        setViewState(initialViewForLayer(activeLayer));
      }
      setHoveredId(null);
    }
  }, [activeLayer, controls.resetViewOnLayerChange]);

  const handleFeatureClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const entityId = String(feature.id ?? feature.properties?.id ?? "");
    const normalizedEntityId = slugify(entityId);
    const entity = entities.find(
      (item) =>
        item.data.id === entityId ||
        slugify(item.data.id) === normalizedEntityId ||
        slugify(item.data.nome) === normalizedEntityId,
    );

    if (entity) {
      onEntityClick(entity);
    }
  };

  const handleHover = (event: MapLayerMouseEvent) => {
    if (!controls.enableHover) {
      setHoveredId(null);
      return;
    }

    const feature = event.features?.[0];
    if (!feature) {
      setHoveredId(null);
      return;
    }

    const entityId = String(feature.id ?? feature.properties?.id ?? "");
    setHoveredId(entityId || null);
  };

  const setControl = <K extends keyof MapControlsState>(
    key: K,
    value: MapControlsState[K],
  ) => {
    setControls((current) => {
      const next = { ...current, [key]: value } as MapControlsState;

      if (!next.showPolygons && !next.showPoints) {
        if (key === "showPolygons") {
          next.showPoints = true;
        } else if (key === "showPoints") {
          next.showPolygons = true;
        }
      }

      return next;
    });
  };

  const applyFocusPreset = (preset: "limites" | "heatmap") => {
    if (preset === "limites") {
      setViewState((current) => ({
        ...current,
        zoom: 6.2,
      }));

      setControls((current) => ({
        ...current,
        showHeatmap: false,
        showPolygons: true,
        showPoints: false,
        fillOpacity: 95,
        pointScale: 100,
      }));
      return;
    }

    setViewState((current) => ({
      ...current,
      zoom: Math.max(current.zoom, 10),
    }));

    setControls((current) => ({
      ...current,
      showHeatmap: true,
      showPolygons: false,
      showPoints: true,
      fillOpacity: 40,
      pointScale: 120,
    }));
  };

  return (
    <section className="relative h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/60">
      {isLoading || layerLoading ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/25 backdrop-blur-sm">
          <div className="rounded-lg border border-zinc-300 bg-white/95 px-6 py-4 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95">
            <svg
              className="mx-auto h-6 w-6 animate-spin text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {error
                ? "Carregando fallback local..."
                : "Carregando geometrias..."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(event) => setViewState(event.viewState)}
          mapStyle={mapStyleUrl}
          attributionControl={false}
          interactiveLayerIds={interactiveLayerIds}
          onClick={handleFeatureClick}
          onMouseMove={handleHover}
          onMouseLeave={() => setHoveredId(null)}
          dragPan={controls.enableDragPan}
          scrollZoom={controls.enableScrollZoom}
          doubleClickZoom
          dragRotate={!controls.lockRotation}
          touchZoomRotate={!controls.lockRotation}
          cursor={hoveredId || selectedId ? "pointer" : "grab"}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" visualizePitch={false} />

          {controls.showHeatmap ? (
            <Source
              key={ids.heatSource}
              id={ids.heatSource}
              type="geojson"
              data={heatmapData as never}
            >
              <Layer
                id={ids.heatHalo}
                type="heatmap"
                paint={{
                  "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["get", "intensity"],
                    0,
                    0,
                    1,
                    1,
                  ],
                  "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    5,
                    0.6,
                    9,
                    1,
                    13,
                    1.4,
                  ],
                  "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    5,
                    18,
                    9,
                    30,
                    13,
                    42,
                  ],
                  "heatmap-opacity": controls.showPolygons ? 0.3 : 0.85,
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0,
                    "rgba(255,255,255,0)",
                    0.2,
                    "rgba(120, 203, 255, 0.28)",
                    0.4,
                    "rgba(45, 212, 191, 0.48)",
                    0.65,
                    "rgba(168, 85, 247, 0.68)",
                    1,
                    "rgba(14, 165, 233, 0.9)",
                  ],
                }}
              />
              <Layer
                id={ids.heat}
                type="circle"
                paint={{
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    8,
                    5,
                    13,
                    10,
                  ],
                  "circle-color": "#ffffff",
                  "circle-opacity": controls.showPolygons ? 0.1 : 0.18,
                  "circle-blur": 0.8,
                }}
              />
            </Source>
          ) : null}

          <Source
            key={ids.source}
            id={ids.source}
            type="geojson"
            data={geojsonData as never}
          >
            {controls.showPolygons ? (
              <>
                <Layer
                  id={ids.fill}
                  type="fill"
                  filter={["!=", ["geometry-type"], "Point"]}
                  paint={{
                    "fill-color": [
                      "interpolate",
                      ["linear"],
                      ["length", ["get", "nome"]],
                      5,
                      "#e0f2fe",
                      12,
                      "#0ea5e9",
                      20,
                      "#1e1b4b",
                    ],
                    "fill-opacity": effectiveFillOpacity,
                  }}
                />
                <Layer
                  id={ids.line}
                  type="line"
                  paint={{
                    "line-color": "#1f2937",
                    "line-width": 1.6,
                    "line-opacity": 0.92,
                  }}
                  filter={["!=", ["geometry-type"], "Point"]}
                />
                <Layer
                  id={ids.hoverFill}
                  type="fill"
                  filter={
                    controls.enableHover && hoveredId
                      ? [
                          "all",
                          ["!=", ["geometry-type"], "Point"],
                          ["==", ["id"], hoveredId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "fill-color": layerStyle.hoverColor,
                    "fill-opacity": 0.52,
                  }}
                />
                <Layer
                  id={ids.hoverLine}
                  type="line"
                  filter={
                    controls.enableHover && hoveredId
                      ? [
                          "all",
                          ["!=", ["geometry-type"], "Point"],
                          ["==", ["id"], hoveredId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "line-color": layerStyle.selectedColor,
                    "line-width": 2.5,
                  }}
                />
                <Layer
                  id={ids.selectedFill}
                  type="fill"
                  filter={
                    selectedId
                      ? [
                          "all",
                          ["!=", ["geometry-type"], "Point"],
                          ["==", ["id"], selectedId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "fill-color": layerStyle.selectedColor,
                    "fill-opacity": 0.65,
                  }}
                />
                <Layer
                  id={ids.selectedLine}
                  type="line"
                  filter={
                    selectedId
                      ? [
                          "all",
                          ["!=", ["geometry-type"], "Point"],
                          ["==", ["id"], selectedId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 3,
                  }}
                />
              </>
            ) : null}

            {controls.showPoints ? (
              <>
                <Layer
                  id={ids.points}
                  type="circle"
                  filter={["==", ["geometry-type"], "Point"]}
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      9,
                      3.5 * pointScaleFactor,
                      12,
                      5.5 * pointScaleFactor,
                      15,
                      8 * pointScaleFactor,
                    ],
                    "circle-color": layerStyle.color,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 1.25,
                    "circle-opacity": 0.92,
                  }}
                />
                <Layer
                  id={ids.hoverPoint}
                  type="circle"
                  filter={
                    controls.enableHover && hoveredId
                      ? [
                          "all",
                          ["==", ["geometry-type"], "Point"],
                          ["==", ["id"], hoveredId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      9,
                      5 * pointScaleFactor,
                      12,
                      8 * pointScaleFactor,
                      15,
                      10 * pointScaleFactor,
                    ],
                    "circle-color": layerStyle.hoverColor,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 2,
                    "circle-opacity": 1,
                  }}
                />
                <Layer
                  id={ids.selectedPoint}
                  type="circle"
                  filter={
                    selectedId
                      ? [
                          "all",
                          ["==", ["geometry-type"], "Point"],
                          ["==", ["id"], selectedId],
                        ]
                      : ["==", ["id"], "__none__"]
                  }
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      9,
                      6 * pointScaleFactor,
                      12,
                      9 * pointScaleFactor,
                      15,
                      12 * pointScaleFactor,
                    ],
                    "circle-color": layerStyle.selectedColor,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 2.5,
                    "circle-opacity": 1,
                  }}
                />
              </>
            ) : null}
          </Source>
        </Map>
      </div>

      <div className="absolute right-2 top-2 z-30 w-[18rem] rounded-xl border border-zinc-300/90 bg-white/95 p-2 text-xs shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 sm:right-4 sm:top-4 sm:w-[20rem]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">
            Controles do mapa
          </p>
          <button
            type="button"
            onClick={() => setControlsOpen((value) => !value)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {controlsOpen ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {controlsOpen ? (
          <div className="mt-2 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Estilo base
              </span>
              <select
                value={controls.styleId}
                onChange={(event) =>
                  setControl("styleId", event.target.value as MapStyleId)
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {MAP_STYLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyFocusPreset("limites")}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Foco em limites
              </button>
              <button
                type="button"
                onClick={() => applyFocusPreset("heatmap")}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Foco em heatmap
              </button>

              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.showHeatmap}
                  onChange={(event) =>
                    setControl("showHeatmap", event.target.checked)
                  }
                />
                <span>Heatmap</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.showPolygons}
                  onChange={(event) =>
                    setControl("showPolygons", event.target.checked)
                  }
                />
                <span>Polígonos</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.showPoints}
                  onChange={(event) =>
                    setControl("showPoints", event.target.checked)
                  }
                />
                <span>Pontos</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.enableHover}
                  onChange={(event) =>
                    setControl("enableHover", event.target.checked)
                  }
                />
                <span>Hover</span>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                Opacidade dos polígonos ({controls.fillOpacity}%)
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={controls.fillOpacity}
                onChange={(event) =>
                  setControl("fillOpacity", Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                Escala dos pontos ({controls.pointScale}%)
              </span>
              <input
                type="range"
                min={50}
                max={220}
                value={controls.pointScale}
                onChange={(event) =>
                  setControl("pointScale", Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.enableDragPan}
                  onChange={(event) =>
                    setControl("enableDragPan", event.target.checked)
                  }
                />
                <span>Arrastar</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.enableScrollZoom}
                  onChange={(event) =>
                    setControl("enableScrollZoom", event.target.checked)
                  }
                />
                <span>Scroll zoom</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.lockRotation}
                  onChange={(event) =>
                    setControl("lockRotation", event.target.checked)
                  }
                />
                <span>Travar rotação</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
                <input
                  type="checkbox"
                  checked={controls.resetViewOnLayerChange}
                  onChange={(event) =>
                    setControl("resetViewOnLayerChange", event.target.checked)
                  }
                />
                <span>Reset por camada</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewState(initialViewForLayer(resolvedLayer))}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Recentrar
              </button>
              <button
                type="button"
                onClick={() => setControls(DEFAULT_MAP_CONTROLS)}
                className="rounded-md border border-cyan-400 bg-cyan-500/10 px-2 py-1.5 text-[11px] font-medium text-cyan-700 hover:bg-cyan-500/20 dark:border-cyan-600 dark:text-cyan-300"
              >
                Resetar painel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute left-2 top-4 z-20 rounded-lg border border-zinc-300/90 bg-white/90 px-2 py-1 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 sm:left-4 sm:top-4 sm:px-3 sm:py-2">
        <p className="font-semibold text-cyan-600 dark:text-cyan-400">
          Mapa interativo
        </p>
        <p className="mt-0.5 text-[11px] sm:text-xs">Camada: {resolvedLayer}</p>
        <p className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-400 sm:text-[11px]">
          Features: {collection?.features.length ?? 0}
        </p>
      </div>

      <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl border border-zinc-300/90 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:inset-x-4 sm:bottom-4 sm:p-3 md:inset-x-auto md:right-4 md:w-[28rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 sm:text-xs">
          Camada {resolvedLayer} · {collection?.features.length ?? 0} features
        </p>
        <div className="mt-2 max-h-40 space-y-1 overflow-auto sm:max-h-48">
          {entities.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 px-2 py-2 text-[12px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-sm">
              Nenhuma entidade no recorte.
            </p>
          ) : (
            <div className="grid gap-1">
              {entities.map((entity) => {
                const entityId = entity.data.id;
                const isSelected = entityId === selectedId;
                const isHovered = entityId === hoveredId;

                return (
                  <button
                    key={entityId}
                    type="button"
                    onClick={() => onEntityClick(entity)}
                    onMouseEnter={() => setHoveredId(entityId)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`rounded-md border px-2 py-1 text-left text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 sm:px-3 sm:py-2 sm:text-sm ${isSelected ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200" : isHovered ? "border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800" : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"}`}
                    aria-label={`Selecionar ${entity.data.nome}`}
                  >
                    <div className="font-medium">{entity.data.nome}</div>
                    {entity.kind === "escola" &&
                    typeof entity.data.ideb === "number" ? (
                      <div className="text-[10px] text-zinc-600 dark:text-zinc-400 sm:text-[11px]">
                        IDEB: {entity.data.ideb.toFixed(1)}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute right-2 top-20 z-10 rounded-lg border border-zinc-300/80 bg-white/80 px-3 py-2 text-[11px] text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/75 dark:text-zinc-200 sm:right-4 sm:top-24 sm:px-4 sm:py-3 sm:text-xs">
        <p className="font-semibold text-cyan-600 dark:text-cyan-400">
          Preview simulado
        </p>
        <p className="mt-0.5 max-w-[16rem] leading-snug">
          Arraste, dê zoom e explore. As camadas reais entram pelo hook e só
          caem em mock se a fonte falhar.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
    </section>
  );
}
