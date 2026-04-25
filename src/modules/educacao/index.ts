// Módulo Educação — implementa ModuleContract e é o ponto de entrada público do módulo.
// Registrado no bootstrap: src/app/observatorio/page.tsx

import type { ModuleContract, ModuleIndicator, ModuleLayerStyle } from "@/core/types/module";
import type { ObservatoryLayer } from "@/core/types/territory";
import { EducationSidebarPanel } from "./components/education-sidebar-panel";
import { EducationDetailPanel } from "./components/education-detail-panel";
import { buildEducationSelection } from "./hooks/use-education-selection";

// Interpolação linear entre duas cores hex para simbologia dinâmica
function interpolateHex(colorA: string, colorB: string, t: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  return `#${toHex(clamp(a.r + (b.r - a.r) * t))}${toHex(clamp(a.g + (b.g - a.g) * t))}${toHex(clamp(a.b + (b.b - a.b) * t))}`;
}

const EDUCATION_INDICATORS_BY_LAYER: Record<ObservatoryLayer, ModuleIndicator[]> = {
  municipio: [
    {
      id: "pct_com_internet",
      label: "Internet para alunos",
      description: "Percentual de escolas do município com acesso à internet banda larga",
      unit: "%",
      colorScale: ["#FEF3C7", "#B45309"],
      higherIsBetter: true,
    },
    {
      id: "pct_com_biblioteca",
      label: "Biblioteca",
      description: "Percentual de escolas do município com biblioteca",
      unit: "%",
      colorScale: ["#EDE9FE", "#6D28D9"],
      higherIsBetter: true,
    },
    {
      id: "pct_com_lab_informatica",
      label: "Lab. de informática",
      description: "Percentual de escolas do município com laboratório de informática",
      unit: "%",
      colorScale: ["#D1FAE5", "#065F46"],
      higherIsBetter: true,
    },
    {
      id: "pct_sem_acessibilidade",
      label: "Sem acessibilidade PCD",
      description: "Percentual de escolas do município sem nenhum recurso de acessibilidade para PCD",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "total_matriculas",
      label: "Total de matrículas",
      description: "Soma de matrículas ativas em Educação Infantil, Ensino Fundamental e Ensino Médio",
      colorScale: ["#E0F2FE", "#0369A1"],
      higherIsBetter: true,
    },
  ],
  bairro: [
    {
      id: "pct_com_internet",
      label: "Internet para alunos",
      description: "Percentual de escolas do bairro com acesso à internet banda larga",
      unit: "%",
      colorScale: ["#FEF3C7", "#B45309"],
      higherIsBetter: true,
    },
    {
      id: "pct_com_biblioteca",
      label: "Biblioteca",
      description: "Percentual de escolas do bairro com biblioteca",
      unit: "%",
      colorScale: ["#EDE9FE", "#6D28D9"],
      higherIsBetter: true,
    },
    {
      id: "pct_sem_acessibilidade",
      label: "Sem acessibilidade PCD",
      description: "Percentual de escolas do bairro sem nenhum recurso de acessibilidade para PCD",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
  ],
  escola: [
    {
      id: "total_matriculas",
      label: "Total de matrículas",
      description: "Total de matrículas ativas na escola",
      colorScale: ["#E0F2FE", "#0369A1"],
      higherIsBetter: true,
    },
  ],
};

export const educacaoModule: ModuleContract = {
  id: "educacao",
  label: "Educação",
  description: "Indicadores do Censo Escolar INEP — escolas, matrículas e infraestrutura",
  availableLayers: ["municipio", "bairro", "escola"],

  SidebarPanel: EducationSidebarPanel,
  DetailPanel: EducationDetailPanel,

  getIndicators: (layer: ObservatoryLayer): ModuleIndicator[] => {
    return EDUCATION_INDICATORS_BY_LAYER[layer] ?? [];
  },

  getMapLayerStyle: (indicatorId: string | null, value: number): ModuleLayerStyle => {
    // Encontra a escala de cores do indicador ativo, ou usa padrão
    const allIndicators = Object.values(EDUCATION_INDICATORS_BY_LAYER).flat();
    const indicator = allIndicators.find((i) => i.id === indicatorId);
    const [colorMin, colorMax] = indicator?.colorScale ?? ["#FEF3C7", "#B45309"];

    const clampedValue = Math.max(0, Math.min(1, value));
    const color = interpolateHex(colorMin, colorMax, clampedValue);

    return {
      color,
      opacity: 0.75,
      hoverColor: interpolateHex(colorMin, colorMax, Math.min(1, clampedValue + 0.15)),
      selectedColor: "#FBBF24",
    };
  },

  buildSelection: buildEducationSelection,

  onModuleActivated: () => {
    // Inicialização leve — sem side effects no Shell
  },
};
