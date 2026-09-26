/**
 * Paletas acessíveis do ODIN (rampas sequenciais e faixas da visão simplificada).
 *
 * Regras de projeto das rampas:
 * 1. Luminância monotônica — a leitura funciona mesmo sem perceber matiz.
 * 2. Matizes saturados ao longo de toda a rampa — evita que o meio da escala
 *    colida com o cinza de "sem dado" (chroma mínimo garantido).
 * 3. Eixo de matiz escolhido conforme o tipo de CVD: azul/amarelo para
 *    protanopia e deuteranopia (vermelho–verde), rosa/magenta para tritanopia
 *    (azul–amarelo) e luminância pura para acromatopsia.
 *
 * Referências: Cividis (Nuñez, Anderton & Renslow, 2018), Viridis (Smith &
 * van der Walt, 2015) e Paul Tol's Notes (SRON) para paletas seguras em CVD.
 */

import type {
  AccessibleColorVisionMode,
  AccentSurface,
  ColorVisionMode,
} from "@/core/types/a11y";
import type { ObservatoryLayer } from "@/core/types/territory";
import { sampleRampHex } from "./oklab";

/** Metadados de um modo de visão de cores, usados pelo menu de acessibilidade. */
export interface ColorVisionOption {
  id: ColorVisionMode;
  label: string;
  description: string;
  /** Referência técnica exibida como tooltip no menu. */
  reference: string;
  /** Paradas da rampa contínua (mínimo → máximo) usadas na prévia. */
  preview: string[];
}

export const DEFAULT_COLOR_VISION_MODE: ColorVisionMode = "default";

/**
 * Rampas sequenciais por modo. `default` é `null`: nesse caso o mapa mantém a
 * escala declarada pelo próprio indicador (`ModuleIndicator.colorScale`).
 */
export const SEQUENTIAL_RAMPS: Record<ColorVisionMode, string[] | null> = {
  default: null,
  // Eixo azul → areia, com o meio saturado em ciano (sem cinza no meio da escala).
  protanopia: ["#0A2A5E", "#2A629C", "#4E9DBE", "#9BCBD1", "#F3E9A0"],
  // Eixo roxo → azul → areia: separa bem quem confunde vermelho e verde.
  deuteranopia: ["#3B0F5E", "#5B3FA0", "#7E7EC4", "#B0BBD4", "#F2E28A"],
  // Eixo vinho → rosa → branco: preservado na tritanopia (cones S ausentes).
  tritanopia: ["#4A0018", "#A82266", "#DB6FA8", "#F3B6D2", "#FFF7FB"],
  // Luminância pura, sem informação de matiz (acromatopsia/alto contraste).
  achromatopsia: ["#11161C", "#4C545C", "#8B9299", "#C7CBD1", "#FFFFFF"],
};

const OPTION_METADATA: Record<ColorVisionMode, Omit<ColorVisionOption, "id" | "preview">> = {
  default: {
    label: "Padrão",
    description: "Cores originais definidas por indicador",
    reference: "Escalas declaradas no módulo (ex.: ModuleIndicator.colorScale).",
  },
  protanopia: {
    label: "Protanopia",
    description: "Daltonismo vermelho (eixo azul–amarelo)",
    reference: "Rampa própria inspirada em Cividis; matiz vermelho não é usada como informação.",
  },
  deuteranopia: {
    label: "Deuteranopia",
    description: "Daltonismo verde (eixo azul–amarelo)",
    reference: "Rampa roxo→azul→areia; separação por luminância e por matiz preservada.",
  },
  tritanopia: {
    label: "Tritanopia",
    description: "Daltonismo azul–amarelo (eixo rosa–magenta)",
    reference: "Rampa vinho→rosa→branco; evita contrastes azul/amarelo simultâneos.",
  },
  achromatopsia: {
    label: "Alto contraste",
    description: "Monocromático (apenas luminância)",
    reference: "Escala de cinza pura com contornos reforçados nos polígonos.",
  },
};

/** Ordem de exibição no menu de acessibilidade. */
export const COLOR_VISION_OPTIONS: ColorVisionOption[] = (
  ["default", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"] as ColorVisionMode[]
).map((id) => ({
  id,
  ...OPTION_METADATA[id],
  preview: SEQUENTIAL_RAMPS[id] ?? ["#FEF3C7", "#B45309"],
}));

export function getColorVisionOption(mode: ColorVisionMode): ColorVisionOption {
  return (
    COLOR_VISION_OPTIONS.find((option) => option.id === mode) ??
    COLOR_VISION_OPTIONS[0]
  );
}

/** Type guard usado ao restaurar a preferência salva no navegador. */
export function isColorVisionMode(value: unknown): value is ColorVisionMode {
  return (
    typeof value === "string" &&
    COLOR_VISION_OPTIONS.some((option) => option.id === value)
  );
}

/** Rampa do modo (ou `null` no modo padrão). */
export function getSequentialRamp(mode: ColorVisionMode): string[] | null {
  return SEQUENTIAL_RAMPS[mode] ?? null;
}

/** true quando o modo substitui a paleta do indicador por uma rampa acessível. */
export function hasAccessiblePalette(mode: ColorVisionMode): boolean {
  return getSequentialRamp(mode) !== null;
}

/**
 * Cor contínua do choropleth para um valor já normalizado (0..1).
 * Retorna `null` no modo padrão, preservando o comportamento do módulo.
 */
export function resolveAccessibleColor(
  mode: ColorVisionMode,
  normalized: number,
): string | null {
  const ramp = getSequentialRamp(mode);
  if (!ramp) return null;
  return sampleRampHex(ramp, normalized);
}

/** Posições da rampa usadas como cores das 3 faixas da visão simplificada. */
const BAND_STOPS = [0.15, 0.5, 0.85];

/** Faixas ordenadas (crítico → atenção → adequado) da visão simplificada. */
export function getBandColors(mode: ColorVisionMode): [string, string, string] {
  const ramp = getSequentialRamp(mode);
  if (!ramp) return ["#ea580c", "#facc15", "#0f766e"];
  return [
    sampleRampHex(ramp, BAND_STOPS[0]),
    sampleRampHex(ramp, BAND_STOPS[1]),
    sampleRampHex(ramp, BAND_STOPS[2]),
  ];
}

/**
 * Posição de cada camada na rampa do modo.
 *
 * A identidade visual da camada (município/bairro/escola) também é derivada da
 * rampa acessível: assim a troca de modo muda o mapa inteiro — não apenas o
 * choropleth — e as cores de identidade continuam separáveis em todas as
 * simulações de CVD (no modo acromático a separação é por luminância).
 */
const LAYER_ACCENT_STOPS: Record<ObservatoryLayer, number> = {
  municipio: 0.32,
  bairro: 0.56,
  escola: 0.8,
};

/** Deslocamentos na rampa usados nos estados de hover e de seleção. */
const ACCENT_HOVER_OFFSET = 0.06;
const ACCENT_SELECTED_OFFSET = 0.18;

/**
 * Cores de identidade da camada no modo ativo.
 *
 * Retorna `null` no modo padrão: nesse caso o mapa mantém `LAYER_STYLES`.
 * Base/hover/seleção são separados por luminância, o que vale também para
 * acromatopsia (onde qualquer separação por matiz desaparece).
 */
export function getAccessibleLayerColors(
  layer: ObservatoryLayer,
  mode: ColorVisionMode,
): { color: string; hoverColor: string; selectedColor: string } | null {
  const ramp = getSequentialRamp(mode);
  if (!ramp) return null;

  const baseStop = LAYER_ACCENT_STOPS[layer];
  const at = (offset: number) =>
    sampleRampHex(ramp, Math.max(0, Math.min(1, baseStop + offset)));

  return {
    color: at(0),
    hoverColor: at(ACCENT_HOVER_OFFSET),
    selectedColor: at(ACCENT_SELECTED_OFFSET),
  };
}

/**
 * Ordem canônica dos módulos para o acento categórico — a mesma lista do shell
 * (`MODULE_COLORS`). A ordem é fixa para que o acento de um módulo não mude
 * quando outro módulo não tem dados para a entidade selecionada.
 */
const MODULE_ACCENT_ORDER = [
  "educacao",
  "socioeconomico",
  "saude",
  "habitacao",
  "seguranca",
] as const;

/**
 * Posições da rampa usadas como acento dos módulos: a metade superior em fundo
 * escuro (painéis do observatório) e a inferior em fundo claro. Nos dois casos o
 * acento mantém contraste não textual (WCAG 1.4.11) com a superfície do painel.
 */
const MODULE_ACCENT_STOPS: Record<AccentSurface, number[]> = {
  dark: [0.6, 0.7, 0.8, 0.88, 0.96],
  light: [0.06, 0.16, 0.26, 0.36, 0.46],
};

/** Hash estável usado para posicionar módulos fora da ordem canônica na rampa. */
function hashModuleId(moduleId: string): number {
  let hash = 7;
  for (let index = 0; index < moduleId.length; index += 1) {
    hash = (hash * 31 + moduleId.charCodeAt(index)) % 997;
  }
  return hash;
}

/**
 * Acento acessível de um módulo (Educação, Socioeconômico, ...).
 *
 * O painel de detalhes e o seletor de indicadores identificam cada módulo por uma
 * cor. Nos modos acessíveis essa cor passa a vir da mesma rampa do choropleth:
 * mapa e painel mudam juntos e o acento continua separável em todos os tipos de
 * CVD (na acromatopsia, por luminância).
 *
 * Retorna `null` no modo padrão — nesse caso o shell mantém as cores históricas
 * de `MODULE_COLORS`.
 */
export function getAccessibleModuleAccent(
  moduleId: string,
  mode: ColorVisionMode,
  surface: AccentSurface = "dark",
): string | null {
  const ramp = getSequentialRamp(mode);
  if (!ramp) return null;

  const stops = MODULE_ACCENT_STOPS[surface];
  const knownIndex = MODULE_ACCENT_ORDER.indexOf(
    moduleId as (typeof MODULE_ACCENT_ORDER)[number],
  );
  // Módulos fora da ordem canônica (domínios futuros) recebem uma posição estável
  // a partir do próprio id, em vez de herdarem o cinza neutro.
  const slot = knownIndex >= 0 ? knownIndex % stops.length : hashModuleId(moduleId) % stops.length;
  return sampleRampHex(ramp, stops[slot]);
}

/**
 * Acento neutro do painel (cabeçalho e ações) quando nenhum módulo está ativo.
 * Retorna `null` no modo padrão.
 */
export function getAccessibleSurfaceAccent(
  mode: ColorVisionMode,
  surface: AccentSurface = "dark",
): string | null {
  const ramp = getSequentialRamp(mode);
  if (!ramp) return null;
  return sampleRampHex(ramp, MODULE_ACCENT_STOPS[surface][0]);
}

/**
 * Símbolos de dupla codificação (WCAG 1.4.1 — Uso de Cor): cada faixa recebe um
 * glifo próprio, então a legenda continua legível em preto e branco.
 */
export const BAND_GLYPHS = ["▼", "◆", "▲"] as const;

/** Rótulo curto do modo acessível, usado nos selos da legenda. */
export function describeAccessibleMode(mode: AccessibleColorVisionMode): string {
  return getColorVisionOption(mode).label;
}
