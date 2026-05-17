"use client";

import { useCallback, useMemo, useState } from "react";
import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { RadiusAnalysisState, RadiusCenter, RadiusAnalysisResult } from "./types";
import { DEFAULT_RADIUS_METERS } from "./types";
import { aggregateFeaturesInRadius } from "./aggregate-features";

/**
 * Hook que gerencia o estado da análise por raio.
 * Recebe a collection de features carregada no mapa e computa a agregação client-side.
 */
export function useRadiusAnalysis(collection: GeoJSONFeatureCollection | null) {
  const [state, setState] = useState<RadiusAnalysisState>({
    active: false,
    center: null,
    radiusMeters: DEFAULT_RADIUS_METERS,
    result: null,
  });

  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      active: !prev.active,
      center: prev.active ? null : prev.center,
      result: prev.active ? null : prev.result,
    }));
  }, []);

  const setCenter = useCallback(
    (center: RadiusCenter) => {
      if (!collection) {
        setState((prev) => ({ ...prev, center, result: null }));
        return;
      }

      const result = aggregateFeaturesInRadius(collection, center, state.radiusMeters);
      setState((prev) => ({ ...prev, center, result }));
    },
    [collection, state.radiusMeters],
  );

  const setRadius = useCallback(
    (radiusMeters: number) => {
      if (!collection || !state.center) {
        setState((prev) => ({ ...prev, radiusMeters, result: null }));
        return;
      }

      const result = aggregateFeaturesInRadius(collection, state.center, radiusMeters);
      setState((prev) => ({ ...prev, radiusMeters, result }));
    },
    [collection, state.center],
  );

  const close = useCallback(() => {
    setState({
      active: false,
      center: null,
      radiusMeters: state.radiusMeters,
      result: null,
    });
  }, [state.radiusMeters]);

  /** GeoJSON do círculo para renderizar no mapa. */
  const circleGeoJSON = useMemo(() => {
    if (!state.center) return null;

    // Importação lazy para evitar bundle desnecessário
    const { generateCircleCoordinates } = require("./haversine") as typeof import("./haversine");
    const coords = generateCircleCoordinates(
      state.center.longitude,
      state.center.latitude,
      state.radiusMeters,
    );

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "radius-circle",
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [coords],
          },
        },
      ],
    };
  }, [state.center, state.radiusMeters]);

  return {
    state,
    toggle,
    setCenter,
    setRadius,
    close,
    circleGeoJSON,
  };
}
