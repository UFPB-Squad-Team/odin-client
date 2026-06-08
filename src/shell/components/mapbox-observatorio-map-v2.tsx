"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useMapLayers } from "@/core/geospatial/use-map-layers";
import { getModule } from "@/core/registry/module-registry";
import { useChoropleth } from "@/core/choropleth/use-choropleth";
import { normalizeValue } from "@/core/choropleth/normalize";
import { aggregateFeaturesInRadius } from "@/shell/components/radius-analysis/aggregate-features";
import { registerMarkerImages } from "@/shell/components/map-markers";
import { ObservatorioMapTooltip } from "@/shell/components/observatorio-map-tooltip";
import { MapLegend } from "@/shell/components/map-legend";
import { LAYER_STYLES, type GeoJSONFeature } from "@/core/types/geospatial";
import type { ModuleIndicator } from "@/core/types/module";
import type { Escola, ObservatoryLayer } from "@/core/types/territory";
import type { MapEntity } from "@/core/types/shell";

type MapboxObservatorioMapProps = {
  activeLayer: ObservatoryLayer;
  activeModuleId: string | null;
  activeIndicatorId: string | null;
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
  radiusMode?: boolean;
  radiusMeters?: number;
  onRadiusResult?: (result: import("@/shell/components/radius-analysis").RadiusAnalysisResult | null) => void;
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
  accent: string;
  indicatorLabel?: string;
  summary?: string;
  detail?: string;
  value?: string;
};

type MapStyleId = "demo" | "light" | "dark" | "voyager" | "satellite";
type MapStyleValue = string | StyleSpecification;

type MapVisualControls = {
  styleId: MapStyleId;
  fillOpacity: number;
  pointScale: number;
  simplifiedView: boolean;
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
  { id: "demo", label: "Padrão", style: "https://demotiles.maplibre.org/style.json" },
  { id: "light", label: "Claro", style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { id: "dark", label: "Escuro", style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "voyager", label: "Voyager", style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
  { id: "satellite", label: "Satélite", style: SATELLITE_STYLE },
];

const EMPTY_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isDarkMapStyle(styleId: MapStyleId) {
  return styleId === "dark" || styleId === "satellite";
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
  if (feature.geometry.type === "Point") return [feature.geometry.coordinates];
  if (feature.geometry.type === "Polygon") return feature.geometry.coordinates.flat() as Point[];
  return feature.geometry.coordinates.flat(2) as Point[];
}

function getCentroid(feature: GeoJSONFeature): Point | null {
  const points = collectPoints(feature);
  if (points.length === 0) return null;
  const totals = points.reduce(
    (acc, [lng, lat]) => ({ longitude: acc.longitude + lng, latitude: acc.latitude + lat }),
    { longitude: 0, latitude: 0 },
  );
  return [totals.longitude / points.length, totals.latitude / points.length];
}

function getLayerSubtitle(layer: ObservatoryLayer, entityName: string) {
  if (layer === "municipio") return `Limite municipal · ${entityName}`;
  if (layer === "bairro") return `Vizinhança · ${entityName}`;
  return `Ponto escolar · ${entityName}`;
}

function normalizeId(raw: unknown): string {
  return String(raw ?? "").replace(/\.0$/, "").trim();
}

function generateRadiusCircle(centerLng: number, centerLat: number, radiusMeters: number): [number, number][] {
  const coords: [number, number][] = [];
  const R = 6371000;
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const lat = Math.asin(
      Math.sin((centerLat * Math.PI) / 180) * Math.cos(radiusMeters / R) +
        Math.cos((centerLat * Math.PI) / 180) * Math.sin(radiusMeters / R) * Math.cos(angle),
    );
    const lng =
      ((centerLng * Math.PI) / 180) +
      Math.atan2(
        Math.sin(angle) * Math.sin(radiusMeters / R) * Math.cos((centerLat * Math.PI) / 180),
        Math.cos(radiusMeters / R) - Math.sin((centerLat * Math.PI) / 180) * Math.sin(lat),
      );
    coords.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI]);
  }

  return coords;
}

function resolveChoroplethFeatureId(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
): string {
  const props = feature.properties as Record<string, unknown> | undefined;
  return normalizeId(
    feature.id ??
      props?.id ??
      props?.codarea ??
      props?.municipioIdIbge ??
      props?.municipio_id_ibge ??
      props?.escola_id_inep ??
      props?.inep ??
      props?.codigo ??
      props?.cod ??
      "",
  );
}

function resolveEntityFromFeature(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
  entities: MapEntity[],
): MapEntity | undefined {
  const featureId = normalizeId(feature.id ?? feature.properties?.id ?? "");
  const propsId = normalizeId(feature.properties?.id ?? "");

  return entities.find((item) => {
    const entityId = item.data.id;
    if (entityId === featureId || entityId === propsId) return true;
    const slugId = slugify(entityId);
    if (slugId === slugify(featureId) || slugId === slugify(propsId)) return true;
    if (item.kind === "escola") {
      const escola = item.data as Escola;
      if (escola.inepId && (escola.inepId === featureId || escola.inepId === propsId)) return true;
    }
    return false;
  });
}

function resolveFeatureLayer(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
  fallback: ObservatoryLayer,
): ObservatoryLayer {
  const rawLayer = String(feature.properties?.nivel ?? "");
  if (rawLayer === "municipio" || rawLayer === "bairro" || rawLayer === "escola") return rawLayer;
  return fallback;
}

function resolveFeatureTitle(
  feature: NonNullable<MapLayerMouseEvent["features"]>[number],
) {
  const rawName =
    feature.properties?.nome ??
    feature.properties?.escola_nome ??
    feature.properties?.name ??
    feature.properties?.description ??
    feature.properties?.id;
  return String(rawName ?? "Sem nome");
}

function formatIndicatorValue(value: number, unit?: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "R$") return `R$ ${value.toLocaleString("pt-BR")}`;
  if (Number.isInteger(value)) return value.toLocaleString("pt-BR");
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function buildHoverInsight(params: {
  activeIndicatorId: string | null;
  activeModule: ReturnType<typeof getModule> | null;
  activeIndicator: ModuleIndicator | null;
  stats: { min: number; max: number; count: number } | null;
  featureProps: Record<string, unknown>;
  featureId: string;
  layer: ObservatoryLayer;
}) {
  const { activeIndicatorId, activeModule, activeIndicator, stats, featureProps, featureId, layer } = params;
  if (!activeIndicatorId || !activeModule || !activeIndicator || !stats) return null;

  const extractor = activeModule.indicatorValueExtractor?.(activeIndicatorId);
  if (!extractor) return null;

  const rawValue = extractor(featureProps);
  if (rawValue === null || !isFinite(rawValue)) return null;

  const normalized = normalizeValue(rawValue, stats.min, stats.max);
  const performance =
    activeIndicator.comparisonMode === "relative"
      ? normalized
      : activeIndicator.higherIsBetter
        ? normalized
        : 1 - normalized;
  const tone = activeIndicator.comparisonMode === "relative"
    ? performance >= 0.67
      ? "muito alto"
      : performance >= 0.34
        ? "na média"
        : "muito baixo"
    : performance >= 0.67
      ? "favorável"
      : performance >= 0.34
        ? "intermediário"
        : "de atenção";

  const layerLabel =
    layer === "municipio"
      ? "município"
      : layer === "bairro"
        ? "vizinhança"
        : "escola";

  const summary =
    activeModule.label === "Educação"
      ? performance >= 0.67
        ? "Predomínio de indicadores escolares positivos"
        : performance >= 0.34
          ? "Quadro escolar em equilíbrio"
          : "Ponto de atenção nos indicadores escolares"
      : activeModule.label === "Socioeconômico"
        ? activeIndicator.comparisonMode === "relative"
          ? performance >= 0.67
            ? "Quantidade alta no recorte"
            : performance >= 0.34
              ? "Quantidade na média do recorte"
              : "Quantidade baixa no recorte"
          : performance >= 0.67
            ? "Leitura socioeconômica favorável"
            : performance >= 0.34
              ? "Leitura socioeconômica intermediária"
              : "Ponto de atenção socioeconômica"
        : performance >= 0.67
          ? `Leitura favorável na ${layerLabel}`
          : performance >= 0.34
            ? `Leitura intermediária na ${layerLabel}`
            : `Ponto de atenção na ${layerLabel}`;

  return {
    accent: performance >= 0.67 ? "#06b6d4" : performance >= 0.34 ? "#a78bfa" : "#f59e0b",
    summary,
    detail: `${activeIndicator.label} • ${formatIndicatorValue(rawValue, activeIndicator.unit)} • ${activeIndicator.comparisonMode === "relative" ? "quantidade" : "leitura"} ${tone} no recorte`,
    value: formatIndicatorValue(rawValue, activeIndicator.unit),
    featureId,
  };
}

function parseIndicadoresFromProps(
  raw: Record<string, unknown>,
): import("@/core/types/territory").EscolaIndicadores | undefined {
  let indicadores = raw.indicadores;
  if (typeof indicadores === "string") {
    try { indicadores = JSON.parse(indicadores); } catch { return undefined; }
  }
  if (!indicadores || typeof indicadores !== "object") return undefined;
  const ind = indicadores as Record<string, unknown>;

  function parseEtapa(etapa: unknown): import("@/core/types/territory").EtapaIndicadores | undefined {
    if (!etapa || typeof etapa !== "object") return undefined;
    const e = etapa as Record<string, unknown>;
    if (Object.keys(e).length === 0) return undefined;
    return {
      alunosPorTurma: e.alunosPorTurma != null ? Number(e.alunosPorTurma) : undefined,
      taxaAprovacao: e.taxaAprovacao != null ? Number(e.taxaAprovacao) : undefined,
      taxaReprovacao: e.taxaReprovacao != null ? Number(e.taxaReprovacao) : undefined,
      horasAulaDiarias: e.horasAulaDiarias != null ? Number(e.horasAulaDiarias) : undefined,
      tnr: e.tnr != null ? Number(e.tnr) : undefined,
    };
  }

  return {
    anoReferencia: ind.anoReferencia != null ? Number(ind.anoReferencia) : undefined,
    totalAlunos: undefined,
    educacaoInfantil: parseEtapa(ind.educacaoInfantil),
    fundamentalAnosIniciais: parseEtapa(ind.fundamentalAnosIniciais),
    fundamentalAnosFinais: parseEtapa(ind.fundamentalAnosFinais),
    ensinoMedio: parseEtapa(ind.ensinoMedio),
  };
}

function buildEscolaFromFeatureProps(
  props: Record<string, unknown>,
  fallbackId: string,
  fallbackNome: string,
): Escola {
  const inepRaw = props.escola_id_inep ?? props.inep ?? fallbackId;
  const idebRaw = props.ideb ?? (props.indicadores as Record<string, unknown> | null)?.idebAnosIniciais;
  const inseRaw = props.inse;

  return {
    id: fallbackId,
    inepId: String(inepRaw).replace(/\.0$/, ""),
    nome: fallbackNome,
    bairroId: String(props.bairro ?? ""),
    bairroNome: props.bairro != null ? String(props.bairro) : undefined,
    municipioId: props.municipioIdIbge != null ? String(props.municipioIdIbge).replace(/\.0$/, "") : undefined,
    municipioNome: props.municipio_nome != null ? String(props.municipio_nome) : undefined,
    estadoSigla: props.estado_sigla != null ? String(props.estado_sigla) : undefined,
    dependenciaAdministrativa: props.dependencia_adm != null ? String(props.dependencia_adm) : props.dependencia != null ? String(props.dependencia) : undefined,
    dependencia_adm: props.dependencia_adm != null ? String(props.dependencia_adm) : props.dependencia != null ? String(props.dependencia) : undefined,
    tipoLocalizacao: props.tipo_localizacao != null ? String(props.tipo_localizacao) : props.zona != null ? String(props.zona) : undefined,
    tipo_localizacao: props.tipo_localizacao != null ? String(props.tipo_localizacao) : props.zona != null ? String(props.zona) : undefined,
    ideb: idebRaw != null && Number(idebRaw) !== 0 ? Number(idebRaw) : undefined,
    inse: inseRaw != null && Number(inseRaw) !== 0 ? Number(inseRaw) : undefined,
    indicadores: parseIndicadoresFromProps(props),
    matriculas: props.matriculas != null ? props.matriculas as import("@/core/types/territory").EscolaMatriculas : undefined,
    geoProps: props,
  };
}

export function MapboxObservatorioMap({
  activeLayer,
  activeModuleId,
  activeIndicatorId,
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
  radiusMode = false,
  radiusMeters = 1000,
  onRadiusResult,
}: MapboxObservatorioMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipState | null>(null);
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [, setMarkersReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Register marker images on map load and style changes
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (map && (typeof map.isStyleLoaded !== "function" || map.isStyleLoaded())) {
      registerMarkerImages(map);
      setMarkersReady(true);
    }
  };

  const handleStyleData = () => {
    const map = mapRef.current?.getMap();
    if (map) {
      // Re-register after style change (images are lost)
      setTimeout(() => {
        if (typeof map.isStyleLoaded !== "function" || map.isStyleLoaded()) {
          registerMarkerImages(map);
          setMarkersReady(true);
        }
      }, 100);
    }
  };
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
  } = useMapLayers({ activeLayer, estadoId, municipioId, bairroId, zoom: viewState.zoom });

  const layerStyle = LAYER_STYLES[resolvedLayer];
  const ids = useMemo(() => buildLayerIds(resolvedLayer), [resolvedLayer]);
  const geojsonData = collection ?? EMPTY_COLLECTION;

  const { featureColors, stats } = useChoropleth({
    collection,
    activeModuleId,
    activeLayer: resolvedLayer,
    activeIndicatorId,
    simplifiedView: visualControls.simplifiedView,
  });

  const activeModule = useMemo(() => (activeModuleId ? getModule(activeModuleId) : null), [activeModuleId]);
  const activeIndicator = useMemo(
    () => activeModule?.getIndicators?.(resolvedLayer)?.find((indicator) => indicator.id === activeIndicatorId) ?? null,
    [activeIndicatorId, activeModule, resolvedLayer],
  );

  const fillColorExpression = useMemo(() => {
    if (featureColors.size === 0) return layerStyle.color;

    const pairs: unknown[] = [];
    featureColors.forEach((color, id) => {
      pairs.push(id, color);
    });

    return [
      "match",
      [
        "to-string",
        [
          "coalesce",
          ["get", "id"],
          ["get", "codarea"],
          ["get", "municipioIdIbge"],
          ["get", "municipio_id_ibge"],
          ["get", "escola_id_inep"],
          ["get", "inep"],
          ["get", "codigo"],
          ["get", "cod"],
          ["id"],
        ],
      ],
      ...pairs,
      layerStyle.color,
    ] as unknown as string;
  }, [featureColors, layerStyle.color]);

  const hasChoropleth = featureColors.size > 0;
  const showLegend = Boolean(hasChoropleth && activeIndicator && stats);

  const mapStyleUrl = useMemo(() => {
    const style = MAP_STYLE_OPTIONS.find((o) => o.id === visualControls.styleId);
    return style?.style ?? MAP_STYLE_OPTIONS[0].style;
  }, [visualControls.styleId]);

  const fillOpacityFactor = clamp(visualControls.fillOpacity / 100, 0.2, 1);
  const effectiveFillOpacity = clamp(Math.min(layerStyle.opacity, 0.2) * fillOpacityFactor, 0.04, 0.32);
  const pointScaleFactor = clamp(visualControls.pointScale / 100, 0.7, 1.6);
  const mapIsDark = isDarkMapStyle(visualControls.styleId);
  const appIsDark = mounted ? resolvedTheme === "dark" : false;
  const contrastStrokeColor = mapIsDark ? "rgba(255,255,255,0.88)" : "rgba(15,23,42,0.82)";
  const subtleOutlineColor = mapIsDark ? "rgba(255,255,255,0.34)" : "rgba(15,23,42,0.28)";
  const radiusFillOpacity = mapIsDark ? (appIsDark ? 0.24 : 0.2) : (appIsDark ? 0.28 : 0.24);
  const radiusLineOpacity = mapIsDark ? 0.95 : 0.88;

  const heatmapData = useMemo<PointFeatureCollection>(() => {
    const features = geojsonData.features ?? [];
    const fallbackPreviewPoints = [
      { id: "preview-recife", nome: "Recife", nivel: resolvedLayer, coordinates: [-34.9011, -8.0476] as Point, intensity: 1 },
      { id: "preview-joao-pessoa", nome: "João Pessoa", nivel: resolvedLayer, coordinates: [-34.8731, -7.1195] as Point, intensity: 0.82 },
      { id: "preview-campina-grande", nome: "Campina Grande", nivel: resolvedLayer, coordinates: [-35.8811, -7.2291] as Point, intensity: 0.68 },
      { id: "preview-fortaleza", nome: "Fortaleza", nivel: resolvedLayer, coordinates: [-38.5267, -3.7319] as Point, intensity: 0.55 },
      { id: "preview-natal", nome: "Natal", nivel: resolvedLayer, coordinates: [-35.2099, -5.7793] as Point, intensity: 0.5 },
    ];

    const sourceFeatures: PointFeature[] =
      features.length > 0
        ? features.flatMap((feature, index) => {
            const centroid = getCentroid(feature);
            if (!centroid) return [];
            const rawProperties = feature.properties as Record<string, unknown>;
            const rawIdeb = rawProperties.ideb;
            const intensity =
              typeof rawIdeb === "number"
                ? Math.max(0.35, Math.min(1, rawIdeb / 10))
                : Math.max(0.35, 1 - index * 0.08);
            return [{
              type: "Feature",
              id: String(feature.id),
              properties: { id: feature.properties.id, nome: feature.properties.nome, nivel: feature.properties.nivel, intensity },
              geometry: { type: "Point", coordinates: centroid },
            }];
          })
        : fallbackPreviewPoints.map((p) => ({
            type: "Feature",
            id: p.id,
            properties: { id: p.id, nome: p.nome, nivel: p.nivel, intensity: p.intensity },
            geometry: { type: "Point", coordinates: p.coordinates },
          }));

    return { type: "FeatureCollection", features: sourceFeatures };
  }, [geojsonData, resolvedLayer]);

  const handleFeatureClick = (event: MapLayerMouseEvent) => {
    // Radius mode: compute aggregation instead of selecting entity
    if (radiusMode && onRadiusResult) {
      const { lng, lat } = event.lngLat;
      setRadiusCenter([lng, lat]);

      if (collection) {
        const result = aggregateFeaturesInRadius(collection, { longitude: lng, latitude: lat }, radiusMeters);
        onRadiusResult(result);
      }
      return;
    }

    const feature = event.features?.[0];
    if (!feature) return;

    // Auto-pan to clicked location (don't change zoom if already zoomed in enough)
    const { lng, lat } = event.lngLat;
    onViewStateChange({ longitude: lng, latitude: lat, zoom: viewState.zoom });

    const entity = resolveEntityFromFeature(feature, entities);
    if (entity) {
      onEntityClick(entity);
      return;
    }

    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const fallbackId = normalizeId(props.id ?? feature.id ?? "");
    const fallbackNome = resolveFeatureTitle(feature);

    if (!fallbackId) return;

    if (resolvedLayer === "municipio") {
      const municipioIdIbge = normalizeId(
        props.municipioIdIbge ?? props.co_municipio ?? props.id ?? feature.id ?? "",
      );
      const nome = String(
        props.municipio ?? props.nome ?? props.name ?? props.description ?? fallbackNome,
      );
      const estadoSigla = String(props.sg_uf ?? props.uf ?? estadoId ?? "").toLowerCase();

      onEntityClick({
        kind: "municipio",
        data: {
          id: municipioIdIbge || fallbackId,
          nome,
          estadoId: estadoSigla,
          geoProps: props,
        },
      });
      return;
    }

    if (resolvedLayer === "escola") {
      const escola = buildEscolaFromFeatureProps(props, fallbackId, fallbackNome);
      onEntityClick({ kind: "escola", data: escola });
      return;
    }

    if (resolvedLayer === "bairro") {
      const bairroMunicipioId = normalizeId(
        props.municipioIdIbge ?? props.municipio_id_ibge ?? "",
      );
      onEntityClick({
        kind: "bairro",
        data: {
          id: fallbackId,
          nome: fallbackNome,
          municipioId: bairroMunicipioId ?? municipioId ?? "",
          geoProps: props,
        },
      });
      return;
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
    const entityId = resolveChoroplethFeatureId(feature);
    const layer = resolveFeatureLayer(feature, resolvedLayer);
    const title = entity?.data.nome ?? resolveFeatureTitle(feature);
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const hoverInsight = buildHoverInsight({
      activeIndicatorId,
      activeModule,
      activeIndicator,
      stats,
      featureProps: props,
      featureId: entityId,
      layer,
    });

    setHoveredId(entityId || null);
    setHoverTooltip({
      x: event.point.x,
      y: event.point.y,
      layer,
      subtitle: hoverInsight?.summary ?? getLayerSubtitle(layer, title),
      title,
      selected: Boolean(entity && entity.data.id === selectedId),
      accent: hoverInsight?.accent ?? layerStyle.hoverColor,
      indicatorLabel: activeIndicator?.label,
      detail: hoverInsight?.detail,
      value: hoverInsight?.value,
    });
  };

  const handleRecenter = () => {
    onRecenter();
    setHoveredId(null);
    setHoverTooltip(null);
  };

  const toggleCard = (card: keyof MapCardVisibilityState) => {
    setCollapsedCards((current) => ({ ...current, [card]: !current[card] }));
  };

  return (
    <section className="relative h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950/60">
      {isLoading || layerLoading ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/25 backdrop-blur-sm">
          <div className="rounded-lg border border-zinc-300 bg-white/95 px-6 py-4 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95">
            <svg className="mx-auto h-6 w-6 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {error ? "Carregando fallback local..." : "Carregando geometrias..."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(event) => onViewStateChange(event.viewState)}
          onLoad={handleMapLoad}
          onStyleData={handleStyleData}
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
          onMouseLeave={() => { setHoveredId(null); setHoverTooltip(null); }}
          dragPan
          scrollZoom
          doubleClickZoom
          touchZoomRotate
          cursor={radiusMode ? "crosshair" : hoveredId || selectedId ? "pointer" : "grab"}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" visualizePitch={false} />

          <Source key={ids.heatSource} id={ids.heatSource} type="geojson" data={heatmapData as never}>
            <Layer
              id={ids.heatHalo}
              type="heatmap"
              paint={{
                "heatmap-weight": ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 1, 1],
                "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 9, 1, 13, 1.4],
                "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 18, 9, 30, 13, 42],
                "heatmap-opacity": 0.85,
                "heatmap-color": [
                  "interpolate", ["linear"], ["heatmap-density"],
                  0, "rgba(255,255,255,0)",
                  0.2, "rgba(120, 203, 255, 0.28)",
                  0.4, "rgba(45, 212, 191, 0.48)",
                  0.65, "rgba(168, 85, 247, 0.68)",
                  1, "rgba(14, 165, 233, 0.9)",
                ],
              }}
            />
            <Layer
              id={ids.heat}
              type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 5, 13, 10],
                "circle-color": "#ffffff",
                "circle-opacity": 0.18,
                "circle-blur": 0.8,
              }}
            />
          </Source>

          <Source key={ids.source} id={ids.source} type="geojson" data={geojsonData as never}>
            <Layer
              id={ids.fill}
              type="fill"
              filter={["!=", ["geometry-type"], "Point"]}
              paint={{
                "fill-color": fillColorExpression,
                "fill-opacity": hasChoropleth ? 0.82 : effectiveFillOpacity,
                "fill-outline-color": subtleOutlineColor,
              }}
            />
            <Layer
              id={ids.points}
              type="circle"
              filter={["==", ["geometry-type"], "Point"]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"],
                  9, 4 * pointScaleFactor,
                  12, 6 * pointScaleFactor,
                  15, 9 * pointScaleFactor,
                ],
                "circle-color": resolvedLayer === "escola" ? "#06b6d4" : fillColorExpression,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 15, 2.5],
                "circle-opacity": 0.92,
              }}
            />
            <Layer
              id={ids.line}
              type="line"
              paint={{ "line-color": layerStyle.hoverColor, "line-width": 1.35, "line-opacity": 0.9 }}
              filter={["!=", ["geometry-type"], "Point"]}
            />
            <Layer
              id={ids.hoverFill}
              type="fill"
              filter={hoveredId ? ["all", ["!=", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], hoveredId]] : ["==", ["id"], "__none__"]}
              paint={{ "fill-color": layerStyle.hoverColor, "fill-opacity": 0.56, "fill-outline-color": contrastStrokeColor }}
            />
            <Layer
              id={ids.hoverPoint}
              type="circle"
              filter={hoveredId ? ["all", ["==", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], hoveredId]] : ["==", ["id"], "__none__"]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5 * pointScaleFactor, 12, 8 * pointScaleFactor, 15, 10 * pointScaleFactor],
                "circle-color": layerStyle.hoverColor,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
                "circle-opacity": 1,
              }}
            />
            <Layer
              id={ids.hoverLine}
              type="line"
              filter={hoveredId ? ["all", ["!=", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], hoveredId]] : ["==", ["id"], "__none__"]}
              paint={{ "line-color": layerStyle.selectedColor, "line-width": 2.75, "line-opacity": 0.95 }}
            />
            <Layer
              id={ids.selectedFill}
              type="fill"
              filter={selectedId ? ["all", ["!=", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], selectedId]] : ["==", ["id"], "__none__"]}
              paint={{ "fill-color": layerStyle.selectedColor, "fill-opacity": 0.7, "fill-outline-color": contrastStrokeColor }}
            />
            <Layer
              id={ids.selectedPoint}
              type="circle"
              filter={selectedId ? ["all", ["==", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], selectedId]] : ["==", ["id"], "__none__"]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 6 * pointScaleFactor, 12, 9 * pointScaleFactor, 15, 12 * pointScaleFactor],
                "circle-color": layerStyle.selectedColor,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2.5,
                "circle-opacity": 1,
              }}
            />
            <Layer
              id={ids.selectedLine}
              type="line"
              filter={selectedId ? ["all", ["!=", ["geometry-type"], "Point"], ["==", ["to-string", ["coalesce", ["get", "id"], ["to-string", ["id"]]]], selectedId]] : ["==", ["id"], "__none__"]}
              paint={{ "line-color": contrastStrokeColor, "line-width": 3.2, "line-opacity": 1 }}
            />
          </Source>

          {/* Radius analysis circle */}
          {radiusMode && radiusCenter && (
            <Source
              id="radius-circle"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: [{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Polygon",
                    coordinates: [generateRadiusCircle(radiusCenter[0], radiusCenter[1], radiusMeters)],
                  },
                }],
              } as never}
            >
              <Layer
                id="radius-circle-fill"
                type="fill"
                paint={{ "fill-color": "#06b6d4", "fill-opacity": radiusFillOpacity, "fill-outline-color": contrastStrokeColor }}
              />
              <Layer
                id="radius-circle-line"
                type="line"
                paint={{ "line-color": contrastStrokeColor, "line-width": 2.25, "line-opacity": radiusLineOpacity, "line-dasharray": [3, 2] }}
              />
            </Source>
          )}
        </Map>
      </div>

      <div className="pointer-events-auto absolute left-2 bottom-2 z-30 flex w-[min(18rem,calc(100vw-1rem))] max-w-[18rem] flex-col gap-2 sm:bottom-4 sm:left-4 sm:w-[min(16rem,calc(100vw-1rem))] sm:max-w-[16rem]">
        {showLegend && activeIndicator && stats ? (
          <MapLegend
            indicatorLabel={activeIndicator.label}
            indicatorUnit={activeIndicator.unit}
            colorScale={activeIndicator.colorScale}
            minValue={stats.min}
            maxValue={stats.max}
            higherIsBetter={activeIndicator.higherIsBetter}
            comparisonMode={activeIndicator.comparisonMode}
            simplifiedView={visualControls.simplifiedView}
          />
        ) : null}

        <div className="overflow-hidden rounded-xl border border-zinc-300/90 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/95 px-2.5 py-2 dark:border-zinc-700/80 dark:bg-zinc-900/95 sm:px-3">
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
              {resolvedLayer} · {collection?.features.length ?? 0} features
            </p>
            <button
              type="button"
              onClick={() => toggleCard("entities")}
              className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {collapsedCards.entities ? "Expandir" : "Minimizar"}
            </button>
          </div>

          {!collapsedCards.entities ? (
            <div className="max-h-[min(12.5rem,calc(100vh-20rem))] space-y-1 overflow-y-auto px-2.5 py-2 sm:max-h-[14rem] sm:px-3 odin-entity-scroll">
              {entities.length === 0 ? (
                <p className="rounded-md border border-dashed border-zinc-300 px-2 py-2 text-[12px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-sm">
                  Nenhuma entidade no recorte.
                </p>
              ) : (
                <div className="grid gap-1.5">
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
                        className={`rounded-md border px-2 py-1.5 text-left text-[11.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 sm:px-3 sm:py-2 sm:text-sm ${isSelected ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200" : isHovered ? "border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800" : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"}`}
                        aria-label={`Selecionar ${entity.data.nome}`}
                      >
                        <div className="max-w-full truncate font-medium">{entity.data.nome}</div>
                        {entity.kind === "escola" && typeof entity.data.ideb === "number" ? (
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
      </div>

      <style>{`
        .odin-entity-scroll::-webkit-scrollbar { width: 4px; }
        .odin-entity-scroll::-webkit-scrollbar-track { background: transparent; }
        .odin-entity-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.35); border-radius: 2px; }
        .odin-entity-scroll { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.35) transparent; }
      `}</style>

      <ObservatorioMapTooltip
        visible={Boolean(hoverTooltip)}
        x={hoverTooltip?.x ?? 0}
        y={hoverTooltip?.y ?? 0}
        layer={hoverTooltip?.layer ?? resolvedLayer}
        subtitle={hoverTooltip?.subtitle ?? ""}
        title={hoverTooltip?.title ?? ""}
        selected={hoverTooltip?.selected}
        accent={hoverTooltip?.accent}
        indicatorLabel={hoverTooltip?.indicatorLabel}
        detail={hoverTooltip?.detail}
        value={hoverTooltip?.value}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />

      {/* Visual controls — top-left compact panel */}
      <div className="absolute top-2 left-2 z-20 sm:top-4 sm:left-4">
        <div className="rounded-xl border border-zinc-300/90 bg-white/95 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleCard("visual")}
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 w-full"
          >
            <span>⚙</span>
            <span>Visual</span>
          </button>

          {!collapsedCards.visual && (
            <div className="px-3 pb-3 pt-1 w-52 border-t border-zinc-200/60 dark:border-zinc-700/60">
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-zinc-600 dark:text-zinc-300">Estilo</span>
                <select
                  value={visualControls.styleId}
                  onChange={(e) => onVisualControlsChange({ ...visualControls, styleId: e.target.value as MapStyleId })}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {MAP_STYLE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </label>

              <label className="mt-2 block">
                <span className="mb-1 block text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                  Opacidade ({visualControls.fillOpacity}%)
                </span>
                <input
                  type="range" min={20} max={100} value={visualControls.fillOpacity}
                  onChange={(e) => onVisualControlsChange({ ...visualControls, fillOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </label>

              <label className="mt-2 block">
                <span className="mb-1 block text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                  Pontos ({visualControls.pointScale}%)
                </span>
                <input
                  type="range" min={70} max={160} value={visualControls.pointScale}
                  onChange={(e) => onVisualControlsChange({ ...visualControls, pointScale: Number(e.target.value) })}
                  className="w-full"
                />
              </label>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Centralizar
                </button>
                <button
                  type="button"
                  onClick={onResetVisual}
                  className="rounded-md border border-cyan-500/60 bg-cyan-500/10 px-2 py-1 text-[10px] font-medium text-cyan-700 transition hover:bg-cyan-500/20 dark:border-cyan-600 dark:text-cyan-300"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}