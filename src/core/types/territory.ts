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
  geoProps?: Record<string, unknown>;
  source?: string;
  temBairroOficial?: boolean;
}

export interface Escola {
  id: string;
  inepId?: string;
  nome: string;
  bairroId: string;
  bairroNome?: string;
  municipioId?: string;
  municipioNome?: string;
  estadoSigla?: string;
  ideb?: number;
  inse?: number;
}

export type TerritoryFilters = {
  activeLayer: string;
  estadoId: string | null;
  municipioId: string | null;
  bairroId: string | null;
};