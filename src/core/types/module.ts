// Contrato de interface que todo módulo do ODIN deve implementar.
// O Shell acessa módulos exclusivamente via ModuleRegistry + este contrato.
// Nenhum import direto de src/modules/ é permitido no Shell.

import type { ComponentType } from "react";
import type { ObservatoryLayer } from "./territory";
import type {
  MapEntity,
  ObservatorySelection,
  ShellContextType,
} from "./shell";

// Indicador temático de um módulo (ex.: pct_com_internet, taxa_analfabetismo)
export interface ModuleIndicator {
  id: string;
  label: string;
  description: string;
  unit?: string;
  colorScale: [string, string]; // [cor para valor mínimo, cor para valor máximo]
  higherIsBetter: boolean; // true = ordem decrescente no ranking, false = crescente
}

// Props injetadas pelo Shell no painel lateral do módulo ativo
export interface ModuleSidebarPanelProps {
  shellContext: Readonly<ShellContextType>;
  activeIndicatorId: string | null;
  onIndicatorChange: (indicatorId: string | null) => void;
}

// Props injetadas pelo Shell no painel de detalhes do módulo ativo
export interface ModuleDetailPanelProps {
  entity: MapEntity;
  shellContext: Readonly<ShellContextType>;
  onNavigate: (entity: MapEntity) => void;
}

// Estilo de camada retornado pelo módulo para simbologia dinâmica no mapa
export interface ModuleLayerStyle {
  color: string;
  opacity: number;
  hoverColor: string;
  selectedColor: string;
}

// Contrato que todo módulo deve implementar para ser plugado no Shell.
// Campos obrigatórios: id, label, description, availableLayers, SidebarPanel.
// Campos opcionais permitem extensão progressiva sem quebrar o contrato.
export interface ModuleContract {
  // --- Obrigatórios ---
  /** Identificador único do módulo. Deve ser único no ModuleRegistry. */
  id: string;
  /** Nome de exibição na interface (ex.: "Educação", "Socioeconômico"). */
  label: string;
  /** Descrição curta exibida no seletor de módulo. */
  description: string;
  /** Camadas geográficas suportadas por este módulo. */
  availableLayers: ObservatoryLayer[];
  /** Componente React renderizado na área de conteúdo da sidebar quando este módulo está ativo. */
  SidebarPanel: ComponentType<ModuleSidebarPanelProps>;

  // --- Opcionais ---
  /** Ícone exibido na sidebar recolhida. Se ausente, usa as iniciais do label. */
  icon?: ComponentType<{ className?: string }>;
  /** Componente React renderizado no painel de detalhes quando uma entidade é selecionada. */
  DetailPanel?: ComponentType<ModuleDetailPanelProps>;
  /** Retorna os indicadores disponíveis para a camada informada. */
  getIndicators?: (layer: ObservatoryLayer) => ModuleIndicator[];
  /** Retorna o estilo de camada para simbologia dinâmica dado um indicador e valor normalizado [0,1]. */
  getMapLayerStyle?: (
    indicatorId: string | null,
    value: number,
  ) => ModuleLayerStyle;
  /** Constrói o ObservatorySelection para uma entidade selecionada. Chamado pelo Shell via useEntitySelection. */
  buildSelection?: (entity: MapEntity) => ObservatorySelection;
  /**
   * Retorna uma função extratora de valor para o indicador informado.
   * A extratora recebe as properties de uma GeoJSON feature e retorna o valor numérico bruto,
   * ou null se o indicador não estiver disponível naquela feature.
   * Usado pelo choropleth para colorir o mapa.
   */
  indicatorValueExtractor?: (
    indicatorId: string,
  ) => ((props: Record<string, unknown>) => number | null) | null;
  /** Callback chamado quando este módulo se torna o módulo ativo. */
  onModuleActivated?: (shellContext: Readonly<ShellContextType>) => void;
  /** Callback chamado quando este módulo deixa de ser o módulo ativo. */
  onModuleDeactivated?: () => void;
}
