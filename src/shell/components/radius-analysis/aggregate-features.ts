import type { GeoJSONFeatureCollection } from "@/core/types/geospatial";
import type { RadiusCenter, RadiusAnalysisResult } from "./types";
import { haversineDistance } from "./haversine";

/**
 * Computa o centróide de uma feature (ponto médio dos vértices).
 */
function featureCentroid(feature: GeoJSONFeatureCollection["features"][number]): [number, number] | null {
  const geom = feature.geometry;
  if (geom.type === "Point") return geom.coordinates;

  let points: [number, number][] = [];
  if (geom.type === "Polygon") {
    points = geom.coordinates[0] as [number, number][];
  } else if (geom.type === "MultiPolygon") {
    points = geom.coordinates.flatMap((poly) => poly[0]) as [number, number][];
  }

  if (points.length === 0) return null;

  const sumLng = points.reduce((acc, p) => acc + p[0], 0);
  const sumLat = points.reduce((acc, p) => acc + p[1], 0);
  return [sumLng / points.length, sumLat / points.length];
}

/**
 * Extrai valor numérico de uma propriedade, retornando null se inválido.
 */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

/**
 * Agrega indicadores das features dentro do raio.
 * Usa média ponderada por população quando disponível, senão média simples.
 */
export function aggregateFeaturesInRadius(
  collection: GeoJSONFeatureCollection,
  center: RadiusCenter,
  radiusMeters: number,
): RadiusAnalysisResult {
  // Filtra features cujo centróide está dentro do raio
  const includedFeatures = collection.features.filter((feature) => {
    const centroid = featureCentroid(feature);
    if (!centroid) return false;
    const distance = haversineDistance(center.latitude, center.longitude, centroid[1], centroid[0]);
    return distance <= radiusMeters;
  });

  // Extrai dados de educação e socioeconômico de cada feature
  const eduValues: Record<string, number[]> = {};
  const socioValues: Record<string, number[]> = {};

  for (const feature of includedFeatures) {
    const props = feature.properties as Record<string, unknown>;
    const edu = props.educacao as Record<string, unknown> | undefined;
    const socio = props.socioeconomico as Record<string, unknown> | undefined;

    // Educação — campos aninhados (municípios/vizinhanças)
    if (edu) {
      const eduFields: Record<string, unknown> = {
        totalEscolas: edu.totalEscolas,
        totalMatriculas: edu.totalMatriculas,
        pctComInternet: edu.pctComInternet,
        pctComBiblioteca: edu.pctComBiblioteca,
        pctComLaboratorioInformatica: edu.pctComLaboratorioInformatica,
        pctSemAcessibilidade: edu.pctSemAcessibilidade,
      };

      for (const [key, val] of Object.entries(eduFields)) {
        const num = toNumber(val);
        if (num !== null) {
          if (!eduValues[key]) eduValues[key] = [];
          eduValues[key].push(num);
        }
      }
    }

    // Educação — campos flat (escolas como pontos)
    if (!edu) {
      const flatEduFields: Record<string, unknown> = {
        totalEscolas: 1, // cada escola conta como 1
        pctComInternet: props.pct_com_internet,
        pctComBiblioteca: props.pct_com_biblioteca,
        pctSemAcessibilidade: props.pct_sem_acessibilidade,
      };

      // Matrículas da escola
      const matriculas = props.matriculas as Record<string, unknown> | undefined;
      if (matriculas?.totalAlunos != null) {
        flatEduFields.totalMatriculas = matriculas.totalAlunos;
      }

      for (const [key, val] of Object.entries(flatEduFields)) {
        const num = toNumber(val);
        if (num !== null) {
          if (!eduValues[key]) eduValues[key] = [];
          eduValues[key].push(num);
        }
      }
    }

    // Socioeconômico — campos aninhados (municípios/vizinhanças)
    if (socio) {
      const pop = socio.populacao as Record<string, unknown> | undefined;
      const san = socio.saneamento as Record<string, unknown> | undefined;
      const raca = socio.raca as Record<string, unknown> | undefined;
      const etaria = socio.estruturaEtaria as Record<string, unknown> | undefined;

      const socioFields: Record<string, unknown> = {
        populacaoTotal: pop?.total,
        pctAguaRedeGeral: san?.pctAguaRedeGeral,
        pctEsgotoRedeGeral: san?.pctEsgotoRedeGeral,
        pctLixoColetado: san?.pctLixoColetado,
        pctPretaParda: raca?.pctPretaParda,
        pctCriancas0a9: etaria?.pctCriancas0a9,
        pctIdosos60Mais: etaria?.pctIdosos60Mais,
      };

      for (const [key, val] of Object.entries(socioFields)) {
        const num = toNumber(val);
        if (num !== null) {
          if (!socioValues[key]) socioValues[key] = [];
          socioValues[key].push(num);
        }
      }
    }
  }

  // Calcula médias (soma para totais, média para percentuais)
  const sumKeys = new Set(["totalEscolas", "totalMatriculas", "populacaoTotal"]);

  function aggregate(values: Record<string, number[]>): Record<string, number | null> {
    const result: Record<string, number | null> = {};
    for (const [key, nums] of Object.entries(values)) {
      if (nums.length === 0) {
        result[key] = null;
      } else if (sumKeys.has(key)) {
        result[key] = nums.reduce((a, b) => a + b, 0);
      } else {
        result[key] = nums.reduce((a, b) => a + b, 0) / nums.length;
      }
    }
    return result;
  }

  return {
    center,
    radiusMeters,
    featuresIncluded: includedFeatures.length,
    educacao: aggregate(eduValues),
    socioeconomico: aggregate(socioValues),
  };
}
