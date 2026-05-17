"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMunicipiosGeoJSON,
  fetchSchoolsGeoJSON,
  listCamadas,
} from "@/core/geospatial/geospatial-api";
import { buildMockCollection } from "@/core/geospatial/geospatial-mock-data";
import type {
  GeoJSONFeatureCollection,
  GeoJSONMultiPolygonCoordinates,
  GeoJSONPolygonCoordinates,
} from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";

type UseMapLayersArgs = {
  activeLayer: ObservatoryLayer;
  estadoId?: string | null;
  municipioId?: string | null;
  bairroId?: string | null;
  zoom?: number;
};

const LAYER_ZOOM_BREAKPOINTS: Record<ObservatoryLayer, number> = {
  municipio: 5,
  bairro: 9,
  escola: 13,
};

type RawGeoJSONFeature = {
  type: "Feature";
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point";
    coordinates:
      | GeoJSONFeatureCollection["features"][number]["geometry"]["coordinates"]
      | [number, number];
  };
};

type RawGeoJSONCollection = {
  type: "FeatureCollection";
  features: RawGeoJSONFeature[];
};

const MUNICIPALITY_CODE_TO_ENTITY_ID: Record<string, string> = {};

const UF_TO_IBGE_STATE_CODE: Record<string, string> = {
  ma: "21",
  pi: "22",
  ce: "23",
  rn: "24",
  pb: "25",
  pe: "26",
  al: "27",
  se: "28",
  ba: "29",
};

const IBGE_STATE_CODE_TO_UF = Object.fromEntries(
  Object.entries(UF_TO_IBGE_STATE_CODE).map(([uf, code]) => [code, uf]),
) as Record<string, string>;

const ESTADO_NAME_TO_UF: Record<string, string> = {
  paraiba: "pb",
  pernambuco: "pe",
  ceara: "ce",
  riograndedonorte: "rn",
  maranhao: "ma",
  piaui: "pi",
  alagoas: "al",
  sergipe: "se",
  bahia: "ba",
};

function normalizeEstadoIdToUf(
  estadoId: string | null | undefined,
): string | null {
  if (!estadoId) return null;
  const trimmed = estadoId.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.length === 2 && UF_TO_IBGE_STATE_CODE[trimmed]) return trimmed;
  if (IBGE_STATE_CODE_TO_UF[trimmed]) return IBGE_STATE_CODE_TO_UF[trimmed];
  const normalizedName = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
  return ESTADO_NAME_TO_UF[normalizedName] ?? null;
}

function normalizeCollection(
  rawCollection: RawGeoJSONCollection,
  layer: ObservatoryLayer,
): GeoJSONFeatureCollection {
  const features = rawCollection.features
    .map((feature) => {
      const rawId = String(
        feature.properties.codarea ??
          feature.properties.id ??
          feature.properties.cod ??
          feature.properties.codigo ??
          feature.id ??
          "",
      );

      const entityId =
        layer === "municipio"
          ? (MUNICIPALITY_CODE_TO_ENTITY_ID[rawId] ?? rawId)
          : rawId ||
            String(
              feature.properties.nome ?? feature.properties.name ?? "item",
            );

      const nome = String(
        feature.properties.nome ??
          feature.properties.name ??
          feature.properties.nm_mun ??
          feature.properties.description ??
          entityId,
      );

      let geometry:
        | GeoJSONFeatureCollection["features"][number]["geometry"]
        | null = null;

      if (feature.geometry.type === "Polygon") {
        geometry = {
          type: "Polygon",
          coordinates: feature.geometry
            .coordinates as GeoJSONPolygonCoordinates,
        };
      }
      if (feature.geometry.type === "MultiPolygon") {
        geometry = {
          type: "MultiPolygon",
          coordinates: feature.geometry
            .coordinates as GeoJSONMultiPolygonCoordinates,
        };
      }
      if (feature.geometry.type === "Point") {
        geometry = {
          type: "Point",
          coordinates: feature.geometry.coordinates as [number, number],
        };
      }

      if (!geometry) return null;

      return {
        type: "Feature" as const,
        id: entityId,
        properties: {
          id: entityId,
          nome,
          nivel: layer,
          ...(layer === "municipio" ? { codarea: rawId } : {}),
          ...feature.properties,
        },
        geometry,
      };
    })
    .filter(Boolean) as GeoJSONFeatureCollection["features"];

  return { type: "FeatureCollection", features };
}

async function fetchJsonFromCandidates(
  candidates: string[],
): Promise<RawGeoJSONCollection | null> {
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      return (await response.json()) as RawGeoJSONCollection;
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

function buildMunicipalityFallbackCandidates(estadoUf: string | null) {
  if (!estadoUf) return [] as string[];
  const code = UF_TO_IBGE_STATE_CODE[estadoUf];
  return code ? [`/data/geojs-${code}-mun.json`] : [];
}

async function fetchIbgeMunicipalities(
  estadoUf: string,
): Promise<GeoJSONFeatureCollection> {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${estadoUf.toUpperCase()}/municipios?formato=application/vnd.geo+json`,
  );
  if (!response.ok) throw new Error("Falha ao carregar malha do IBGE.");
  const rawCollection = (await response.json()) as RawGeoJSONCollection;
  return normalizeCollection(rawCollection, "municipio");
}

function computeFeatureCentroid(
  feature: { geometry?: { type?: string; coordinates?: unknown } },
): [number, number] | null {
  const geom = feature.geometry;
  if (!geom?.type || !geom.coordinates) return null;

  let points: [number, number][] = [];

  if (geom.type === "Point") {
    return geom.coordinates as [number, number];
  }
  if (geom.type === "Polygon") {
    points = (geom.coordinates as number[][][])[0] as [number, number][];
  }
  if (geom.type === "MultiPolygon") {
    points = (geom.coordinates as number[][][][]).flatMap((poly) => poly[0]) as [number, number][];
  }

  if (points.length === 0) return null;

  const sumLng = points.reduce((acc, p) => acc + p[0], 0);
  const sumLat = points.reduce((acc, p) => acc + p[1], 0);
  return [sumLng / points.length, sumLat / points.length];
}

async function fetchMunicipalityCollection(
  estadoUf: string | null,
): Promise<GeoJSONFeatureCollection | null> {
  if (!estadoUf) return null;

  const sgUf = estadoUf.toUpperCase();
  const collection = await fetchMunicipiosGeoJSON(sgUf);

  if (!collection?.features?.length) return null;

  // Normaliza IDs e propriedades para consistência com o choropleth
  const features = collection.features.map((feature) => {
    const props = feature.properties as Record<string, unknown>;
    const rawId = String(
      props.municipioIdIbge ?? props.co_municipio ?? feature.id ?? "",
    ).replace(/\.0$/, "");
    const nome = String(
      props.municipio ?? props.nome ?? props.name ?? rawId,
    );

    // Computa centróide a partir da geometria para auto-pan
    const centroide = computeFeatureCentroid(feature);

    return {
      ...feature,
      id: rawId,
      properties: {
        ...props,
        id: rawId,
        nome,
        nivel: "municipio" as const,
        ...(centroide ? { _centroide: centroide } : {}),
      },
    };
  }) as GeoJSONFeatureCollection["features"];

  return {
    type: "FeatureCollection",
    features: features.sort((a, b) =>
      String(a.properties.nome ?? "").localeCompare(String(b.properties.nome ?? ""), "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }),
    ),
  };
}

export function resolveLayerByZoom(
  zoom: number | undefined,
  fallback: ObservatoryLayer,
) {
  if (typeof zoom !== "number") return fallback;
  if (zoom >= LAYER_ZOOM_BREAKPOINTS.escola) return "escola";
  if (zoom >= LAYER_ZOOM_BREAKPOINTS.bairro) return "bairro";
  return "municipio";
}

function getRecorteId(
  layer: ObservatoryLayer,
  estadoId?: string | null,
  municipioId?: string | null,
) {
  void layer;
  if (layer === "municipio") return estadoId ?? null;
  if (layer === "bairro") return municipioId ?? null;
  return estadoId ?? null;
}

function getBackendRecorteId(
  layer: ObservatoryLayer,
  estadoId?: string | null,
  municipioId?: string | null,
  bairroId?: string | null,
) {
  void bairroId;
  if (layer === "municipio") return estadoId ?? null;
  if (layer === "bairro") return municipioId ?? null;
  return estadoId ?? null;
}

export function useMapLayers({
  activeLayer,
  estadoId,
  municipioId,
  bairroId,
  zoom,
}: UseMapLayersArgs) {
  const cacheRef = useRef<Record<string, GeoJSONFeatureCollection>>({});
  const [collection, setCollection] = useState<GeoJSONFeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const resolvedLayer = useMemo(
    () => resolveLayerByZoom(zoom, activeLayer),
    [activeLayer, zoom],
  );

  const recorteId = useMemo(
    () => getRecorteId(resolvedLayer, estadoId, municipioId),
    [estadoId, municipioId, resolvedLayer],
  );

  const backendRecorteId = useMemo(
    () => getBackendRecorteId(resolvedLayer, estadoId, municipioId, bairroId),
    [bairroId, estadoId, municipioId, resolvedLayer],
  );

  const estadoUf = useMemo(() => normalizeEstadoIdToUf(estadoId), [estadoId]);

  const cacheKey = useMemo(
    () => (recorteId ? `${resolvedLayer}:${recorteId}` : null),
    [recorteId, resolvedLayer],
  );

  useEffect(() => {
    if (!cacheKey || !recorteId) {
      setCollection(null);
      setLoading(false);
      setError(null);
      return;
    }

    const currentCacheKey = cacheKey;
    const currentBackendRecorteId = backendRecorteId ?? recorteId;

    const cached = cacheRef.current[currentCacheKey];
    if (cached) {
      setCollection(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        let nextCollection: GeoJSONFeatureCollection | null = null;

        if (resolvedLayer === "municipio") {
          nextCollection = await fetchMunicipalityCollection(estadoUf);
        }
        if (!nextCollection && resolvedLayer === "escola") {
          nextCollection = await fetchSchoolsGeoJSON();
        }
        if (!nextCollection && resolvedLayer !== "escola") {
          const remoteCollection = await listCamadas(
            resolvedLayer,
            currentBackendRecorteId,
          );
          nextCollection = remoteCollection ?? buildMockCollection(resolvedLayer, currentBackendRecorteId);
        }

        if (nextCollection) {
          cacheRef.current[currentCacheKey] = nextCollection;
          if (alive) setCollection(nextCollection);
          return;
        }

        if (resolvedLayer === "escola") {
          if (alive) setCollection(null);
          return;
        }

        const fallbackCollection = buildMockCollection(resolvedLayer, currentBackendRecorteId);
        cacheRef.current[currentCacheKey] = fallbackCollection;
        if (alive) setCollection(fallbackCollection);
      } catch (loadError) {
        const fallbackCollection = buildMockCollection(resolvedLayer, currentBackendRecorteId);
        cacheRef.current[currentCacheKey] = fallbackCollection;
        if (alive) {
          setCollection(fallbackCollection);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Falha ao carregar camadas geoespaciais.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [backendRecorteId, cacheKey, estadoUf, municipioId, recorteId, refreshTick, resolvedLayer]);

  const features = collection?.features ?? [];

  const refresh = () => {
    if (!cacheKey) return;
    delete cacheRef.current[cacheKey];
    setRefreshTick((value) => value + 1);
  };

  return { activeLayer: resolvedLayer, collection, error, features, loading, recorteId, refresh, zoom };
}
