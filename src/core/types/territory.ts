// Entidades territoriais e tipos de camada compartilhados por todos os módulos.
// Nenhum módulo deve redefinir estes tipos localmente.

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
