import type {
  ModuleContract,
  ModuleIndicator,
  ModuleLayerStyle,
} from "@/core/types/module";
import type { ObservatoryLayer } from "@/core/types/territory";
import { EducationSidebarPanel } from "./components/education-sidebar-panel";
import { EducationDetailPanel } from "./components/education-detail-panel";
import { buildEducationSelection } from "./hooks/use-education-selection";
import { buildEducationDetailSections } from "./hooks/build-education-detail-sections";
import { extractEducationIndicatorValue } from "./hooks/use-education-indicator-extractor";
import { interpolateHex } from "@/lib/format";

const EDUCATION_INDICATORS_BY_LAYER: Record<
  ObservatoryLayer,
  ModuleIndicator[]
> = {
  municipio: [
    // Infraestrutura
    { id: "pct_com_internet", label: "Internet (geral)", description: "Escolas com acesso à internet", unit: "%", colorScale: ["#FEF3C7", "#B45309"], higherIsBetter: true },
    { id: "pct_com_internet_alunos", label: "Internet para alunos", description: "Escolas com internet disponível para alunos", unit: "%", colorScale: ["#FEF3C7", "#92400E"], higherIsBetter: true },
    { id: "pct_com_biblioteca", label: "Biblioteca", description: "Escolas com biblioteca ou sala de leitura", unit: "%", colorScale: ["#EDE9FE", "#6D28D9"], higherIsBetter: true },
    { id: "pct_com_lab_informatica", label: "Lab. informática", description: "Escolas com laboratório de informática", unit: "%", colorScale: ["#D1FAE5", "#065F46"], higherIsBetter: true },
    { id: "pct_com_lab_ciencias", label: "Lab. ciências", description: "Escolas com laboratório de ciências", unit: "%", colorScale: ["#ECFDF5", "#047857"], higherIsBetter: true },
    { id: "pct_com_quadra_esportes", label: "Quadra esportes", description: "Escolas com quadra de esportes", unit: "%", colorScale: ["#FEF3C7", "#D97706"], higherIsBetter: true },
    { id: "pct_sem_acessibilidade", label: "Sem acessibilidade PCD", description: "Escolas sem infraestrutura de acessibilidade", unit: "%", colorScale: ["#FEF9C3", "#B91C1C"], higherIsBetter: false },
    // IDEB
    { id: "media_ideb_anos_iniciais", label: "IDEB anos iniciais", description: "IDEB médio dos anos iniciais do fundamental", colorScale: ["#E0F2FE", "#0369A1"], higherIsBetter: true },
    { id: "media_ideb_anos_finais", label: "IDEB anos finais", description: "IDEB médio dos anos finais do fundamental", colorScale: ["#E0F2FE", "#0C4A6E"], higherIsBetter: true },
    { id: "media_ideb_ensino_medio", label: "IDEB ensino médio", description: "IDEB médio do ensino médio", colorScale: ["#E0F2FE", "#164E63"], higherIsBetter: true },
    // Taxas
    { id: "media_taxa_aprovacao_ai", label: "Aprovação (AI)", description: "Taxa de aprovação nos anos iniciais", unit: "%", colorScale: ["#ECFDF5", "#065F46"], higherIsBetter: true },
    { id: "media_taxa_aprovacao_af", label: "Aprovação (AF)", description: "Taxa de aprovação nos anos finais", unit: "%", colorScale: ["#ECFDF5", "#047857"], higherIsBetter: true },
    { id: "media_taxa_abandono_af", label: "Abandono (AF)", description: "Taxa de abandono nos anos finais", unit: "%", colorScale: ["#FEF9C3", "#B91C1C"], higherIsBetter: false },
    { id: "media_taxa_abandono_em", label: "Abandono (EM)", description: "Taxa de abandono no ensino médio", unit: "%", colorScale: ["#FEF9C3", "#991B1B"], higherIsBetter: false },
    // TDI
    { id: "media_tdi_anos_iniciais", label: "Distorção (AI)", description: "Distorção idade-série nos anos iniciais", unit: "%", colorScale: ["#FFF7ED", "#C2410C"], higherIsBetter: false },
    { id: "media_tdi_anos_finais", label: "Distorção (AF)", description: "Distorção idade-série nos anos finais", unit: "%", colorScale: ["#FFF7ED", "#9A3412"], higherIsBetter: false },
    // Quantitativos
    { id: "total_matriculas", label: "Total de matrículas", description: "Soma de matrículas ativas", colorScale: ["#E0F2FE", "#0369A1"], higherIsBetter: true },
    { id: "total_escolas", label: "Total de escolas", description: "Número de escolas no território", colorScale: ["#F0FDF4", "#166534"], higherIsBetter: true },
  ],
  bairro: [
    { id: "pct_com_internet", label: "Internet (geral)", description: "Escolas com acesso à internet", unit: "%", colorScale: ["#FEF3C7", "#B45309"], higherIsBetter: true },
    { id: "pct_com_internet_alunos", label: "Internet para alunos", description: "Escolas com internet para alunos", unit: "%", colorScale: ["#FEF3C7", "#92400E"], higherIsBetter: true },
    { id: "pct_com_biblioteca", label: "Biblioteca", description: "Escolas com biblioteca", unit: "%", colorScale: ["#EDE9FE", "#6D28D9"], higherIsBetter: true },
    { id: "pct_com_lab_informatica", label: "Lab. informática", description: "Escolas com laboratório de informática", unit: "%", colorScale: ["#D1FAE5", "#065F46"], higherIsBetter: true },
    { id: "pct_com_lab_ciencias", label: "Lab. ciências", description: "Escolas com laboratório de ciências", unit: "%", colorScale: ["#ECFDF5", "#047857"], higherIsBetter: true },
    { id: "pct_sem_acessibilidade", label: "Sem acessibilidade PCD", description: "Escolas sem acessibilidade", unit: "%", colorScale: ["#FEF9C3", "#B91C1C"], higherIsBetter: false },
    { id: "total_matriculas", label: "Total de matrículas", description: "Matrículas ativas no bairro", colorScale: ["#E0F2FE", "#0369A1"], higherIsBetter: true },
  ],
  escola: [
    { id: "total_matriculas", label: "Total de matrículas", description: "Total de matrículas ativas na escola", colorScale: ["#E0F2FE", "#0369A1"], higherIsBetter: true },
  ],
};

export const educacaoModule: ModuleContract = {
  id: "educacao",
  label: "Educação",
  description:
    "Indicadores do Censo Escolar INEP — escolas, matrículas e infraestrutura",
  availableLayers: ["municipio", "bairro", "escola"],

  SidebarPanel: EducationSidebarPanel,
  DetailPanel: EducationDetailPanel,

  getIndicators: (layer: ObservatoryLayer): ModuleIndicator[] => {
    return EDUCATION_INDICATORS_BY_LAYER[layer] ?? [];
  },

  getMapLayerStyle: (
    indicatorId: string | null,
    value: number,
  ): ModuleLayerStyle => {
    // Encontra a escala de cores do indicador ativo, ou usa padrão
    const allIndicators = Object.values(EDUCATION_INDICATORS_BY_LAYER).flat();
    const indicator = allIndicators.find((i) => i.id === indicatorId);
    const [colorMin, colorMax] = indicator?.colorScale ?? [
      "#FEF3C7",
      "#B45309",
    ];

    const clampedValue = Math.max(0, Math.min(1, value));
    const color = interpolateHex(colorMin, colorMax, clampedValue);

    return {
      color,
      opacity: 0.75,
      hoverColor: interpolateHex(
        colorMin,
        colorMax,
        Math.min(1, clampedValue + 0.15),
      ),
      selectedColor: "#FBBF24",
    };
  },

  buildSelection: buildEducationSelection,
  indicatorValueExtractor: extractEducationIndicatorValue,
  buildDetailSections: buildEducationDetailSections,

  onModuleActivated: () => {
    // Inicialização leve — sem side effects no Shell
  },
};
