// Módulo Socioeconômico — implementa ModuleContract.
// Registrado no bootstrap: src/app/observatorio/page.tsx

import type { ModuleContract, ModuleIndicator, ModuleLayerStyle } from "@/core/types/module";
import type { ObservatoryLayer } from "@/core/types/territory";
import { SocioeconomicoSidebarPanel } from "./components/socioeconomico-sidebar-panel";
import { SocioeconomicoDetailPanel } from "./components/socioeconomico-detail-panel";
import { buildSocioeconomicoSelection } from "./hooks/use-socioeconomico-selection";

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

const SOCIOECONOMICO_INDICATORS_BY_LAYER: Record<ObservatoryLayer, ModuleIndicator[]> = {
  municipio: [
    {
      id: "pct_preta_parda",
      label: "Pop. preta/parda",
      description: "Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#C2410C"],
      higherIsBetter: false,
    },
    {
      id: "taxa_analfabetismo_15_mais",
      label: "Analfabetismo 15+",
      description: "Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F0FDF4", "#15803D"],
      higherIsBetter: false,
    },
    {
      id: "pct_agua_rede_geral",
      label: "Água rede geral",
      description: "Percentual de domicílios com abastecimento de água por rede geral — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#EFF6FF", "#1D4ED8"],
      higherIsBetter: true,
    },
    {
      id: "pct_esgoto_rede_geral",
      label: "Esgoto rede geral",
      description: "Percentual de domicílios com esgotamento sanitário por rede geral — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F5F3FF", "#6D28D9"],
      higherIsBetter: true,
    },
    {
      id: "total_populacao",
      label: "População total",
      description: "Total de residentes no território — IBGE Censo 2022",
      colorScale: ["#F0FDF4", "#166534"],
      higherIsBetter: true,
    },
    {
      id: "renda_per_capita_media",
      label: "Renda per capita",
      description: "Renda per capita média do território — IBGE Censo 2022",
      unit: "R$",
      colorScale: ["#FFFBEB", "#92400E"],
      higherIsBetter: true,
    },
  ],
  bairro: [
    {
      id: "pct_preta_parda",
      label: "Pop. preta/parda",
      description: "Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#C2410C"],
      higherIsBetter: false,
    },
    {
      id: "taxa_analfabetismo_15_mais",
      label: "Analfabetismo 15+",
      description: "Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F0FDF4", "#15803D"],
      higherIsBetter: false,
    },
  ],
  escola: [], // Módulo socioeconômico não tem indicadores no nível de escola
};

export const socioeconomicoModule: ModuleContract = {
  id: "socioeconomico",
  label: "Socioeconômico",
  description: "Indicadores do IBGE Censo Demográfico 2022 — população, renda e saneamento",
  availableLayers: ["municipio", "bairro"],

  SidebarPanel: SocioeconomicoSidebarPanel,
  DetailPanel: SocioeconomicoDetailPanel,

  getIndicators: (layer: ObservatoryLayer): ModuleIndicator[] => {
    return SOCIOECONOMICO_INDICATORS_BY_LAYER[layer] ?? [];
  },

  getMapLayerStyle: (indicatorId: string | null, value: number): ModuleLayerStyle => {
    const allIndicators = Object.values(SOCIOECONOMICO_INDICATORS_BY_LAYER).flat();
    const indicator = allIndicators.find((i) => i.id === indicatorId);
    const [colorMin, colorMax] = indicator?.colorScale ?? ["#F5F3FF", "#6D28D9"];
    const clampedValue = Math.max(0, Math.min(1, value));
    const color = interpolateHex(colorMin, colorMax, clampedValue);
    return {
      color,
      opacity: 0.75,
      hoverColor: interpolateHex(colorMin, colorMax, Math.min(1, clampedValue + 0.15)),
      selectedColor: "#A78BFA",
    };
  },

  buildSelection: buildSocioeconomicoSelection,
};
