/** Ponto central da análise por raio. */
export type RadiusCenter = {
  longitude: number;
  latitude: number;
};

/** Resultado agregado da análise por raio. */
export type RadiusAnalysisResult = {
  center: RadiusCenter;
  radiusMeters: number;
  featuresIncluded: number;
  educacao: Record<string, number | null>;
  socioeconomico: Record<string, number | null>;
};

/** Estado do modo de análise por raio. */
export type RadiusAnalysisState = {
  active: boolean;
  center: RadiusCenter | null;
  radiusMeters: number;
  result: RadiusAnalysisResult | null;
};

export const DEFAULT_RADIUS_METERS = 1000;

export const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 5000, label: "5km" },
] as const;
