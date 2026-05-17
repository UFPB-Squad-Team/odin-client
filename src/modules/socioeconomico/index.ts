import type {
  ModuleContract,
  ModuleIndicator,
  ModuleLayerStyle,
} from "@/core/types/module";
import type { ObservatoryLayer } from "@/core/types/territory";
import { SocioeconomicoSidebarPanel } from "./components/socioeconomico-sidebar-panel";
import { SocioeconomicoDetailPanel } from "./components/socioeconomico-detail-panel";
import { buildSocioeconomicoSelection } from "./hooks/use-socioeconomico-selection";
import { buildSocioeconomicoDetailSections } from "./hooks/build-socioeconomico-detail-sections";
import { extractSocioeconomicoIndicatorValue } from "./hooks/use-socioeconomico-indicator-extractor";
import { interpolateHex } from "@/lib/format";

const SOCIOECONOMICO_INDICATORS_BY_LAYER: Record<
  ObservatoryLayer,
  ModuleIndicator[]
> = {
  municipio: [
    {
      id: "pct_preta_parda",
      label: "Pop. preta/parda",
      description:
        "Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#C2410C"],
      higherIsBetter: false,
    },
    {
      id: "pct_branca",
      label: "Pop. branca",
      description:
        "Percentual da população que se autodeclara branca — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#9A3412"],
      higherIsBetter: false,
    },
    {
      id: "pct_indigena",
      label: "Pop. indígena",
      description:
        "Percentual da população que se autodeclara indígena — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#ECFDF5", "#065F46"],
      higherIsBetter: false,
    },
    {
      id: "taxa_analfabetismo_15_mais",
      label: "Analfabetismo 15+",
      description:
        "Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F0FDF4", "#15803D"],
      higherIsBetter: false,
    },
    {
      id: "pct_agua_rede_geral",
      label: "Água rede geral",
      description:
        "Percentual de domicílios com abastecimento de água por rede geral — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#EFF6FF", "#1D4ED8"],
      higherIsBetter: true,
    },
    {
      id: "pct_esgoto_rede_geral",
      label: "Esgoto rede geral",
      description:
        "Percentual de domicílios com esgotamento sanitário por rede geral — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F5F3FF", "#6D28D9"],
      higherIsBetter: true,
    },
    {
      id: "pct_agua_nao_encanada",
      label: "Sem água encanada",
      description:
        "Percentual de domicílios sem água encanada — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "pct_agua_inadequada",
      label: "Água inadequada",
      description:
        "Percentual de domicílios com abastecimento de água inadequado — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "pct_esgoto_inadequado",
      label: "Esgoto inadequado",
      description:
        "Percentual de domicílios com esgoto inadequado — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#991B1B"],
      higherIsBetter: false,
    },
    {
      id: "pct_lixo_inadequado",
      label: "Lixo inadequado",
      description:
        "Percentual de domicílios com destinação inadequada de lixo — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#7F1D1D"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_sem_banheiro",
      label: "Sem banheiro",
      description:
        "Percentual de domicílios sem banheiro — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "total_populacao",
      label: "População total",
      description: "Total de residentes no território — IBGE Censo 2022",
      colorScale: ["#F0FDF4", "#166534"],
      higherIsBetter: true,
    },
    {
      id: "total_domicilios",
      label: "Total de domicílios",
      description: "Total de domicílios no território — IBGE Censo 2022",
      colorScale: ["#F0FDF4", "#166534"],
      higherIsBetter: true,
    },
    {
      id: "pct_pop_masculina",
      label: "Pop. masculina",
      description:
        "Percentual da população do sexo masculino — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#EFF6FF", "#1E40AF"],
      higherIsBetter: false,
    },
    {
      id: "pct_pop_feminina",
      label: "Pop. feminina",
      description:
        "Percentual da população do sexo feminino — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FDF2F8", "#9D174D"],
      higherIsBetter: false,
    },
    {
      id: "pct_jovens_15_29",
      label: "Jovens 15–29",
      description:
        "Percentual da população entre 15 e 29 anos — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#ECFDF5", "#047857"],
      higherIsBetter: false,
    },
    {
      id: "pct_adultos_30_59",
      label: "Adultos 30–59",
      description:
        "Percentual da população entre 30 e 59 anos — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#EFF6FF", "#1D4ED8"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_unipessoal",
      label: "Dom. unipessoal",
      description:
        "Percentual de domicílios com apenas 1 morador — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFFBEB", "#92400E"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_tipo_casa",
      label: "Dom. tipo casa",
      description:
        "Percentual de domicílios do tipo casa — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#ECFDF5", "#065F46"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_tipo_apto",
      label: "Dom. tipo apartamento",
      description:
        "Percentual de domicílios do tipo apartamento — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#EFF6FF", "#1E40AF"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_degradado",
      label: "Dom. degradado",
      description:
        "Percentual de domicílios degradados ou inacabados — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
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
      description:
        "Percentual da população que se autodeclara preta ou parda — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#C2410C"],
      higherIsBetter: false,
    },
    {
      id: "pct_branca",
      label: "Pop. branca",
      description:
        "Percentual da população que se autodeclara branca — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FFF7ED", "#9A3412"],
      higherIsBetter: false,
    },
    {
      id: "pct_indigena",
      label: "Pop. indígena",
      description:
        "Percentual da população que se autodeclara indígena — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#ECFDF5", "#065F46"],
      higherIsBetter: false,
    },
    {
      id: "taxa_analfabetismo_15_mais",
      label: "Analfabetismo 15+",
      description:
        "Taxa de analfabetismo da população com 15 anos ou mais — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#F0FDF4", "#15803D"],
      higherIsBetter: false,
    },
    {
      id: "pct_agua_nao_encanada",
      label: "Sem água encanada",
      description:
        "Percentual de domicílios sem água encanada — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_sem_banheiro",
      label: "Sem banheiro",
      description:
        "Percentual de domicílios sem banheiro — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
    {
      id: "pct_dom_degradado",
      label: "Dom. degradado",
      description:
        "Percentual de domicílios degradados ou inacabados — IBGE Censo 2022",
      unit: "%",
      colorScale: ["#FEF9C3", "#B91C1C"],
      higherIsBetter: false,
    },
  ],
  escola: [], // Módulo socioeconômico não tem indicadores no nível de escola
};

export const socioeconomicoModule: ModuleContract = {
  id: "socioeconomico",
  label: "Socioeconômico",
  description:
    "Indicadores do IBGE Censo Demográfico 2022 — população, renda e saneamento",
  availableLayers: ["municipio", "bairro"],

  SidebarPanel: SocioeconomicoSidebarPanel,
  DetailPanel: SocioeconomicoDetailPanel,

  getIndicators: (layer: ObservatoryLayer): ModuleIndicator[] => {
    return SOCIOECONOMICO_INDICATORS_BY_LAYER[layer] ?? [];
  },

  getMapLayerStyle: (
    indicatorId: string | null,
    value: number,
  ): ModuleLayerStyle => {
    const allIndicators = Object.values(
      SOCIOECONOMICO_INDICATORS_BY_LAYER,
    ).flat();
    const indicator = allIndicators.find((i) => i.id === indicatorId);
    const [colorMin, colorMax] = indicator?.colorScale ?? [
      "#F5F3FF",
      "#6D28D9",
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
      selectedColor: "#A78BFA",
    };
  },

  buildSelection: buildSocioeconomicoSelection,
  indicatorValueExtractor: extractSocioeconomicoIndicatorValue,
  buildDetailSections: buildSocioeconomicoDetailSections,
};
