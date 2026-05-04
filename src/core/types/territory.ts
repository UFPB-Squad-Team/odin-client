export type ObservatoryLayer = "municipio" | "bairro" | "escola";

export interface Estado {
  id: string;
  nome: string;
  sigla: string;
}

export interface Municipio {
  id: string;
  nome: string;
  estadoId: string;
  geoProps?: Record<string, unknown>;
}

export interface Bairro {
  id: string;
  nome: string;
  municipioId: string;
}

export interface Escola {
  id: string;
  nome: string;
  bairroId: string;
  ideb?: number;
  inse?: number;
}

export type TerritoryFilters = {
  estadoId: string | null;
  municipioId: string | null;
  bairroId: string | null;
};
