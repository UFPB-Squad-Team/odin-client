import type { Bairro, Escola, Municipio, ObservatoryLayer, TerritoryFilters } from "./territory";

export type MapEntity =
  | { kind: "municipio"; data: Municipio }
  | { kind: "bairro"; data: Bairro }
  | { kind: "escola"; data: Escola };

export type ObservatorySelection = {
  id: string;
  nome: string;
  kind: ObservatoryLayer;
  subtitle: string;
  sourceEntity?: MapEntity;
  metrics?: Array<{
    description: string; label: string; value: string 
}>;
  sections?: Array<{
    title: string;
    rows: Array<{
      description: string; label: string; value: string 
}>;
  }>;
};

export type SearchSuggestionKind =
  | "estado"
  | "municipio"
  | "bairro"
  | "escola"
  | "endereco";

export type SearchSuggestion = {
  id: string;
  kind: SearchSuggestionKind;
  label: string;
  subtitle: string;
  estadoId?: string;
  municipioId?: string;
  bairroId?: string;
  escolaId?: string;
  keywords: string;
};

// Estado compartilhado exposto pelo ShellContext para os módulos consumirem.
// Módulos leem este contexto via useShellContext() — nunca importam do Shell diretamente.
export interface ShellContextType {
  activeLayer: ObservatoryLayer;
  filters: TerritoryFilters;
  selectedEntity: MapEntity | null;
  activeModuleId: string | null;
  setActiveLayer: (layer: ObservatoryLayer) => void;
  setActiveModule: (moduleId: string) => void;
}
