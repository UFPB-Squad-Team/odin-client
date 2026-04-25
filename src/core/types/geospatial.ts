// Tipos GeoJSON e geoespaciais compartilhados por todos os módulos e pelo Shell.
// Módulos que precisam de dados geoespaciais importam daqui, nunca de src/types/observatory.ts.

import type { ObservatoryLayer } from "./territory";

export type GeoJSONCoordinate = [number, number];
export type GeoJSONLinearRing = GeoJSONCoordinate[];
export type GeoJSONPolygonCoordinates = GeoJSONLinearRing[];
export type GeoJSONMultiPolygonCoordinates = GeoJSONPolygonCoordinates[];

export type GeoJSONGeometry =
  | {
      type: "Point";
      coordinates: GeoJSONCoordinate;
    }
  | {
      type: "Polygon";
      coordinates: GeoJSONPolygonCoordinates;
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoJSONMultiPolygonCoordinates;
    };

export interface GeoJSONFeatureProperties {
  id: string;
  nome: string;
  nivel: ObservatoryLayer;
  [key: string]: unknown;
}

export interface GeoJSONFeature {
  type: "Feature";
  id: string | number;
  properties: GeoJSONFeatureProperties;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface CamadaGeoespacial {
  nivel: ObservatoryLayer;
  recorte: string; // ID do filtro pai (estado/município/bairro)
  features: GeoJSONFeature[];
  bounds?: {
    min: [number, number]; // [lng, lat]
    max: [number, number]; // [lng, lat]
  };
  loadedAt: number; // timestamp para cache invalidation
}

export interface MapLayerStyle {
  id: string;
  color: string;
  hoverColor: string;
  selectedColor: string;
  opacity: number;
  hoverOpacity: number;
}

export const LAYER_STYLES: Record<ObservatoryLayer, MapLayerStyle> = {
  municipio: {
    id: "municipio",
    color: "#06B6D4", // cyan
    hoverColor: "#0891B2",
    selectedColor: "#00D9FF",
    opacity: 0.6,
    hoverOpacity: 0.8,
  },
  bairro: {
    id: "bairro",
    color: "#A78BFA", // violet
    hoverColor: "#9333EA",
    selectedColor: "#D8B4FE",
    opacity: 0.6,
    hoverOpacity: 0.8,
  },
  escola: {
    id: "escola",
    color: "#10B981", // emerald
    hoverColor: "#059669",
    selectedColor: "#6EE7B7",
    opacity: 0.6,
    hoverOpacity: 0.8,
  },
};

export interface MapLoadingState {
  municipio: boolean;
  bairro: boolean;
  escola: boolean;
}

export interface MapErrorState {
  municipio: Error | null;
  bairro: Error | null;
  escola: Error | null;
}
