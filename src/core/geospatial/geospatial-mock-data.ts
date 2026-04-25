import {
  MOCK_BAIRROS,
  MOCK_ESCOLAS,
  MOCK_MUNICIPIOS,
} from "@/modules/educacao/services/education-mock-data";
import type {
  CamadaGeoespacial,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@/core/types/geospatial";
import type { ObservatoryLayer } from "@/core/types/territory";

type Point = [number, number];

const MUNICIPIO_CENTERS: Record<string, Point> = {
  jp: [-34.863, -7.115],
  cg: [-35.8808, -7.2194],
  rec: [-34.8781, -8.0476],
  for: [-38.5267, -3.7319],
};

const BAIRRO_CENTERS: Record<string, Point> = {
  manaira: [-34.8292, -7.1071],
  tamba: [-34.8178, -7.1234],
  catole: [-35.8931, -7.2162],
  "boa-viagem": [-34.8946, -8.1174],
  meireles: [-38.5007, -3.7238],
};

const ESCOLA_CENTERS: Record<string, Point> = {
  "ecit-1": [-34.8318, -7.1057],
  "escola-2": [-34.8142, -7.1218],
  "escola-3": [-35.8956, -7.2141],
  "escola-4": [-34.9028, -8.1231],
  "escola-5": [-38.4992, -3.7214],
};

function squarePolygon([lng, lat]: Point, delta: number) {
  return [
    [lng - delta, lat - delta],
    [lng + delta, lat - delta],
    [lng + delta, lat + delta],
    [lng - delta, lat + delta],
    [lng - delta, lat - delta],
  ] as [number, number][];
}

function buildFeature(
  id: string,
  nome: string,
  nivel: ObservatoryLayer,
  center: Point,
  properties: Record<string, unknown>,
  delta: number,
): GeoJSONFeature {
  return {
    type: "Feature",
    id,
    properties: {
      id,
      nome,
      nivel,
      ...properties,
    },
    geometry: {
      type: "Polygon",
      coordinates: [squarePolygon(center, delta)],
    },
  };
}

function calculateBounds(features: GeoJSONFeature[]) {
  if (features.length === 0) {
    return undefined;
  }

  const coords: Array<[number, number]> = [];

  for (const feature of features) {
    const polygons = feature.geometry.coordinates as [number, number][][];
    for (const ring of polygons) {
      for (const point of ring) {
        coords.push(point);
      }
    }
  }

  const lngs = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);

  return {
    min: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    max: [Math.max(...lngs), Math.max(...lats)] as [number, number],
  };
}

export function buildMockLayer(
  nivel: ObservatoryLayer,
  recorteId: string,
): CamadaGeoespacial {
  let features: GeoJSONFeature[] = [];

  if (nivel === "municipio") {
    const municipios = MOCK_MUNICIPIOS.filter(
      (municipio) => municipio.estadoId === recorteId,
    );

    features = municipios.map((municipio, index) => {
      const center = MUNICIPIO_CENTERS[municipio.id] ?? [
        -35 + index * 0.15,
        -7 - index * 0.08,
      ];
      return buildFeature(
        municipio.id,
        municipio.nome,
        "municipio",
        center,
        { estadoId: municipio.estadoId, order: index + 1 },
        0.06,
      );
    });
  }

  if (nivel === "bairro") {
    const bairros = MOCK_BAIRROS.filter(
      (bairro) => bairro.municipioId === recorteId,
    );

    features = bairros.map((bairro, index) => {
      const center = BAIRRO_CENTERS[bairro.id] ?? [
        -35 + index * 0.05,
        -7 - index * 0.04,
      ];
      return buildFeature(
        bairro.id,
        bairro.nome,
        "bairro",
        center,
        { municipioId: bairro.municipioId, order: index + 1 },
        0.025,
      );
    });
  }

  if (nivel === "escola") {
    const escolas = MOCK_ESCOLAS.filter(
      (escola) => escola.bairroId === recorteId,
    );

    features = escolas.map((escola, index) => {
      const center = ESCOLA_CENTERS[escola.id] ?? [
        -34.8 + index * 0.03,
        -7.1 - index * 0.03,
      ];
      return buildFeature(
        escola.id,
        escola.nome,
        "escola",
        center,
        {
          bairroId: escola.bairroId,
          ideb: escola.ideb,
          inse: escola.inse,
          order: index + 1,
        },
        0.012,
      );
    });
  }

  return {
    nivel,
    recorte: recorteId,
    features,
    bounds: calculateBounds(features),
    loadedAt: Date.now(),
  };
}

export function buildMockCollection(
  nivel: ObservatoryLayer,
  recorteId: string,
): GeoJSONFeatureCollection {
  const layer = buildMockLayer(nivel, recorteId);
  return {
    type: "FeatureCollection",
    features: layer.features,
  };
}
