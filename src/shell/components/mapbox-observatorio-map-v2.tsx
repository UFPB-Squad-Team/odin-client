"use client";

import { useMemo, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { useMapLayers } from "@/core/geospatial/use-map-layers";
import { ObservatorioMapTooltip } from "@/shell/components/observatorio-map-tooltip";
import { LAYER_STYLES, type GeoJSONFeature } from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";
import type { MapEntity } from "@/core/types/shell";

type MapboxObservatorioMapProps = {
  activeLayer: ObservatoryLayer;
  entities: MapEntity[];
  isLoading: boolean;
  viewState: ViewState;
  visualControls: MapVisualControls;
  onRecenter: () => void;
  selectedId?: string;
  onEntityClick: (entity: MapEntity) => void;
  onViewStateChange: (viewState: ViewState) => void;
  onVisualControlsChange: (controls: MapVisualControls) => void;
  onResetVisual: () => void;
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

type HoverTooltipState = {
  x: number;
  y: number;
  layer: ObservatoryLayer;
  subtitle: string;
  title: string;
  selected: boolean;
};

type MapStyleId = "demo" | "light" | "dark" | "voyager" | "satellite";
type MapStyleValue = string | StyleSpecification;

type MapVisualControls = {
  styleId: MapStyleId;
  fillOpacity: number;
  pointScale: number;
};

type MapCardVisibilityState = {
  info: boolean;
  visual: boolean;
  entities: boolean;
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles © Esri",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "esri",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

type MapStyleOption = {
  id: MapStyleId;
  label: string;
  style: MapStyleValue;
};

const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    id: "demo",
    label: "Padrão",
    style: "https://demotiles.maplibre.org/style.json",
  },
  {
    id: "light",
    label: "Claro",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    id: "dark",
    label: "Escuro",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  {
    id: "voyager",
    label: "Voyager",
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
  {
    id: "satellite",
    label: "Satélite",
    style: SATELLITE_STYLE,
  },
];

const EMPTY_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function getLayerSubtitle(layer: ObservatoryLayer, entityName: string) {
  if (layer === "municipio") {
    return `Limite municipal · ${entityName}`;
  }

  if (layer === "bairro") {
    return `Limite de bairro · ${entityName}`;
  }

  return `Ponto escolar · ${entityName}`;
}

function resolveEntityFromFeature(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
  entities: MapEntity[],
) {
  const entityId = String(feature.id ?? feature.properties?.id ?? "");
  const normalizedEntityId = slugify(entityId);

  return entities.find(
    (item) =>
      item.data.id === entityId ||
      slugify(item.data.id) === normalizedEntityId ||
      slugify(item.data.nome) === normalizedEntityId,
  );
}

function resolveFeatureLayer(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
  fallback: ObservatoryLayer,
): ObservatoryLayer {
  const rawLayer = String(feature.properties?.nivel ?? "");

  if (
    rawLayer === "municipio" ||
    rawLayer === "bairro" ||
    rawLayer === "escola"
  ) {
    return rawLayer;
  }

  return fallback;
}

function resolveFeatureTitle(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
) {
  const rawName =
    feature.properties?.nome ??
    feature.properties?.name ??
    feature.properties?.description ??
    feature.properties?.id;

  return String(rawName ?? "Sem nome");
}

export function MapboxObservatorioMap({
  activeLayer,
  entities,
  isLoading,
  viewState,
  visualControls,
  onRecenter,
  onResetVisual,
  selectedId,
  onEntityClick,
  onViewStateChange,
  onVisualControlsChange,
  estadoId,
  municipioId,
  bairroId,
}: MapboxObservatorioMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipState | null>(
    null,
  );
  const [collapsedCards, setCollapsedCards] = useState<MapCardVisibilityState>({
    info: false,
    visual: false,
    entities: false,
  });

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
      (option) => option.id === visualControls.styleId,
    );

    return style?.style ?? MAP_STYLE_OPTIONS[0].style;
  }, [visualControls.styleId]);
  const fillOpacityFactor = clamp(visualControls.fillOpacity / 100, 0.2, 1);
  const effectiveFillOpacity = clamp(
    Math.min(layerStyle.opacity, 0.2) * fillOpacityFactor,
    0.04,
    0.32,
  );
  const pointScaleFactor = clamp(visualControls.pointScale / 100, 0.7, 1.6);
  const areAllCardsCollapsed =
    collapsedCards.info && collapsedCards.visual && collapsedCards.entities;

  const heatmapData = useMemo<PointFeatureCollection>(() => {
    const features = geojsonData.features ?? [];
    const fallbackPreviewPoints: Array<{
      coordinates: Point;
      id: string;
      nome: string;
      nivel: ObservatoryLayer;
      intensity: number;
    }> = [
      {
        id: "preview-recife",
        nome: "Recife",
        nivel: resolvedLayer,
        coordinates: [-34.9011, -8.0476],
        intensity: 1,
      },
      {
        id: "preview-joao-pessoa",
        nome: "João Pessoa",
        nivel: resolvedLayer,
        coordinates: [-34.8731, -7.1195],
        intensity: 0.82,
      },
      {
        id: "preview-campina-grande",
        nome: "Campina Grande",
        nivel: resolvedLayer,
        coordinates: [-35.8811, -7.2291],
        intensity: 0.68,
      },
      {
        id: "preview-fortaleza",
        nome: "Fortaleza",
        nivel: resolvedLayer,
        coordinates: [-38.5267, -3.7319],
        intensity: 0.55,
      },
      {
        id: "preview-natal",
        nome: "Natal",
        nivel: resolvedLayer,
        coordinates: [-35.2099, -5.7793],
        intensity: 0.5,
      },
    ];

    const sourceFeatures: PointFeature[] =
      features.length > 0
        ? features.flatMap((feature, index) => {
            const centroid = getCentroid(feature);
            if (!centroid) {
              return [];
            }

            const rawProperties = feature.properties as Record<string, unknown>;
            const rawIdeb = rawProperties.ideb;
            const intensity =
              typeof rawIdeb === "number"
                ? Math.max(0.35, Math.min(1, rawIdeb / 10))
                : Math.max(0.35, 1 - index * 0.08);

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
                  coordinates: centroid,
                },
              },
            ];
          })
        : fallbackPreviewPoints.map((point) => ({
            type: "Feature",
            id: point.id,
            properties: {
              id: point.id,
              nome: point.nome,
              nivel: point.nivel,
              intensity: point.intensity,
            },
            geometry: {
              type: "Point",
              coordinates: point.coordinates,
            },
          }));

    return { type: "FeatureCollection", features: sourceFeatures };
  }, [geojsonData, resolvedLayer]);

  const handleFeatureClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const entity = resolveEntityFromFeature(feature, entities);

    if (entity) {
      onEntityClick(entity);
    }
  };

  const handleHover = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setHoveredId(null);
      setHoverTooltip(null);
      return;
    }

    const entity = resolveEntityFromFeature(feature, entities);
    const entityId = String(feature.id ?? feature.properties?.id ?? "");
    const layer = resolveFeatureLayer(feature, resolvedLayer);
    const title = entity?.data.nome ?? resolveFeatureTitle(feature);

    setHoveredId(entityId || null);

    setHoverTooltip({
      x: event.point.x,
      y: event.point.y,
      layer,
      subtitle: getLayerSubtitle(layer, title),
      title,
      selected: Boolean(entity && entity.data.id === selectedId),
    });
  };

  const handleRecenter = () => {
    onRecenter();
    setHoveredId(null);
    setHoverTooltip(null);
  };

  const handleResetVisual = () => {
    onResetVisual();
  };

  const toggleCard = (card: keyof MapCardVisibilityState) => {
    setCollapsedCards((current) => ({
      ...current,
      [card]: !current[card],
    }));
  };

  const toggleAllCards = () => {
    const nextCollapsed = !areAllCardsCollapsed;

    setCollapsedCards({
      info: nextCollapsed,
      visual: nextCollapsed,
      entities: nextCollapsed,
    });
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
          {...viewState}
          onMove={(event) => onViewStateChange(event.viewState)}
          mapStyle={mapStyleUrl}
          attributionControl={false}
          interactiveLayerIds={[
            ids.fill,
            ids.points,
            ids.hoverFill,
            ids.hoverPoint,
            ids.selectedFill,
            ids.selectedPoint,
          ]}
          onClick={handleFeatureClick}
          onMouseMove={handleHover}
          onMouseLeave={() => {
            setHoveredId(null);
            setHoverTooltip(null);
          }}
          dragPan
          scrollZoom
          doubleClickZoom
          touchZoomRotate
          cursor={hoveredId || selectedId ? "pointer" : "grab"}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" visualizePitch={false} />

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
                "heatmap-opacity": 0.85,
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
                "circle-opacity": 0.18,
                "circle-blur": 0.8,
              }}
            />
          </Source>

          <Source
            key={ids.source}
            id={ids.source}
            type="geojson"
            data={geojsonData as never}
          >
            <Layer
              id={ids.fill}
              type="fill"
              filter={["!=", ["geometry-type"], "Point"]}
              paint={{
                "fill-color": layerStyle.color,
                "fill-opacity": effectiveFillOpacity,
              }}
            />
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
              id={ids.line}
              type="line"
              paint={{
                "line-color": layerStyle.hoverColor,
                "line-width": 1.25,
                "line-opacity": 0.85,
              }}
              filter={["!=", ["geometry-type"], "Point"]}
            />
            <Layer
              id={ids.hoverFill}
              type="fill"
              filter={
                hoveredId
                  ? [
                      "all",
                      ["!=", ["geometry-type"], "Point"],
                      ["==", ["get", "id"], hoveredId],
                    ]
                  : ["==", ["id"], "__none__"]
              }
              paint={{
                "fill-color": layerStyle.hoverColor,
                "fill-opacity": 0.52,
              }}
            />
            <Layer
              id={ids.hoverPoint}
              type="circle"
              filter={
                hoveredId
                  ? [
                      "all",
                      ["==", ["geometry-type"], "Point"],
                      ["==", ["get", "id"], hoveredId],
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
              id={ids.hoverLine}
              type="line"
              filter={
                hoveredId
                  ? [
                      "all",
                      ["!=", ["geometry-type"], "Point"],
                      ["==", ["get", "id"], hoveredId],
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
                      ["==", ["get", "id"], selectedId],
                    ]
                  : ["==", ["id"], "__none__"]
              }
              paint={{
                "fill-color": layerStyle.selectedColor,
                "fill-opacity": 0.65,
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
                      ["==", ["get", "id"], selectedId],
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
            <Layer
              id={ids.selectedLine}
              type="line"
              filter={
                selectedId
                  ? [
                      "all",
                      ["!=", ["geometry-type"], "Point"],
                      ["==", ["get", "id"], selectedId],
                    ]
                  : ["==", ["id"], "__none__"]
              }
              paint={{
                "line-color": "#ffffff",
                "line-width": 3,
              }}
            />
          </Source>
        </Map>
      </div>

      <div className="absolute right-2 top-2 z-30 flex gap-2 sm:right-4 sm:top-4">
        <button
          type="button"
          onClick={toggleAllCards}
          className="rounded-md border border-zinc-300/90 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-sm backdrop-blur transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {areAllCardsCollapsed ? "Expandir todos" : "Minimizar todos"}
        </button>
      </div>

      <div className="absolute left-2 top-4 z-20 min-w-[12rem] rounded-lg border border-zinc-300/90 bg-white/90 px-2 py-2 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 sm:left-4 sm:top-4 sm:px-3 sm:py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-cyan-600 dark:text-cyan-400">
            Mapa interativo
          </p>
          <button
            type="button"
            onClick={() => toggleCard("info")}
            className="rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {collapsedCards.info ? "Expandir" : "Minimizar"}
          </button>
        </div>
        {!collapsedCards.info ? (
          <>
            <p className="mt-0.5 text-[11px] sm:text-xs">
              Camada: {resolvedLayer}
            </p>
            <p className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-400 sm:text-[11px]">
              Features: {collection?.features.length ?? 0}
            </p>
          </>
        ) : null}
      </div>

      <div className="absolute right-2 top-16 z-20 w-72 rounded-xl border border-zinc-300/90 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 sm:right-4 sm:top-16">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
            Visual do mapa
          </p>
          <button
            type="button"
            onClick={() => toggleCard("visual")}
            className="rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {collapsedCards.visual ? "Expandir" : "Minimizar"}
          </button>
        </div>

        {!collapsedCards.visual ? (
          <>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Estilo base
              </span>
              <select
                value={visualControls.styleId}
                onChange={(event) =>
                  onVisualControlsChange({
                    ...visualControls,
                    styleId: event.target.value as MapStyleId,
                  })
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {MAP_STYLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Opacidade dos limites ({visualControls.fillOpacity}%)
              </span>
              <input
                type="range"
                min={20}
                max={100}
                value={visualControls.fillOpacity}
                onChange={(event) =>
                  onVisualControlsChange({
                    ...visualControls,
                    fillOpacity: Number(event.target.value),
                  })
                }
                className="w-full"
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Tamanho dos pontos ({visualControls.pointScale}%)
              </span>
              <input
                type="range"
                min={70}
                max={160}
                value={visualControls.pointScale}
                onChange={(event) =>
                  onVisualControlsChange({
                    ...visualControls,
                    pointScale: Number(event.target.value),
                  })
                }
                className="w-full"
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRecenter}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Centralizar
              </button>
              <button
                type="button"
                onClick={handleResetVisual}
                className="rounded-md border border-cyan-500/60 bg-cyan-500/10 px-2 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-500/20 dark:border-cyan-600 dark:text-cyan-300"
              >
                Reset visual
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl border border-zinc-300/90 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:inset-x-4 sm:bottom-4 sm:p-3 md:inset-x-auto md:right-4 md:w-[28rem]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 sm:text-xs">
            Camada {resolvedLayer} · {collection?.features.length ?? 0} features
          </p>
          <button
            type="button"
            onClick={() => toggleCard("entities")}
            className="rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {collapsedCards.entities ? "Expandir" : "Minimizar"}
          </button>
        </div>

        {!collapsedCards.entities ? (
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
        ) : null}
      </div>

      <ObservatorioMapTooltip
        visible={Boolean(hoverTooltip)}
        x={hoverTooltip?.x ?? 0}
        y={hoverTooltip?.y ?? 0}
        layer={hoverTooltip?.layer ?? resolvedLayer}
        subtitle={hoverTooltip?.subtitle ?? ""}
        title={hoverTooltip?.title ?? ""}
        selected={hoverTooltip?.selected}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
    </section>
  );
}
