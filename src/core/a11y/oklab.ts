/**
 * Matemática de cor perceptual (Oklab) e utilitários de contraste (WCAG 2.1).
 *
 * Por que Oklab: a interpolação direta em sRGB — usada historicamente em
 * `interpolateHex` — não preserva a luminosidade percebida e produz trechos
 * "achatados" no meio da rampa. Esses trechos ficam indistinguíveis para pessoas
 * com deficiência de visão de cores (CVD) e também em impressão em escala de cinza.
 * Oklab é perceptualmente uniforme, então rampas amostradas nele mantêm a
 * luminância crescendo de forma estável.
 *
 * Referências:
 * - Björn Ottosson, "A perceptual color space for image processing" (2020)
 * - Machado, Oliveira & Fernandes, "A Physiologically-based Model for
 *   Simulation of Color Vision Deficiency" (2009)
 * - WCAG 2.1 — luminância relativa e razão de contraste
 */

import type { ColorVisionMode } from "@/core/types/a11y";

export type Rgb = { r: number; g: number; b: number };
export type Oklab = { L: number; a: number; b: number };

/** Matriz 3x3 aplicada em RGB linear (Machado et al., severidade 1.0). */
type CvdMatrix = [number, number, number][];

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Converte `#rgb` ou `#rrggbb` em componentes 0..255. */
export function parseHex(hex: string): Rgb {
  const normalized = hex.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(expanded.slice(0, 6) || "000000", 16);
  if (Number.isNaN(int)) return { r: 0, g: 0, b: 0 };
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  };
}

/** Converte componentes 0..255 em `#rrggbb`. */
export function toHex({ r, g, b }: Rgb): string {
  const part = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const c = clampUnit(channel);
  return (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
}

/** sRGB (0..255) → Oklab. */
export function rgbToOklab(rgb: Rgb): Oklab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** Oklab → sRGB (0..255, com clamp de gamut). */
export function oklabToRgb(lab: Oklab): Rgb {
  const lCube = (lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const mCube = (lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const sCube = (lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;

  return {
    r: linearToSrgb(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube),
    g: linearToSrgb(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube),
    b: linearToSrgb(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube),
  };
}

/** Interpola duas cores em Oklab (`t` de 0 a 1). */
export function interpolateOklabHex(colorA: string, colorB: string, t: number): string {
  const a = rgbToOklab(parseHex(colorA));
  const b = rgbToOklab(parseHex(colorB));
  const k = clampUnit(t);
  return toHex(
    oklabToRgb({
      L: a.L + (b.L - a.L) * k,
      a: a.a + (b.a - a.a) * k,
      b: a.b + (b.b - a.b) * k,
    }),
  );
}

/** Amostra uma rampa multicolorida em `t` (0..1), interpolando em Oklab. */
export function sampleRampHex(stops: string[], t: number): string {
  if (stops.length === 0) return "#6b7280";
  if (stops.length === 1) return stops[0];

  const k = clampUnit(t) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(k));
  return interpolateOklabHex(stops[index], stops[index + 1], k - index);
}

/**
 * Amostra densa da rampa — usada em gradientes CSS, que interpolam em sRGB.
 * Com 9 paradas a diferença entre sRGB e Oklab deixa de ser perceptível.
 */
export function sampleRampStops(stops: string[], count = 9): string[] {
  if (stops.length === 0) return [];
  if (count < 2) return [...stops];
  return Array.from({ length: count }, (_, index) => sampleRampHex(stops, index / (count - 1)));
}

/** `linear-gradient` pronto para a rampa, com paradas densas. */
export function rampGradientCss(stops: string[], direction = "to right"): string {
  const dense = sampleRampStops(stops, 9);
  if (dense.length === 0) return `linear-gradient(${direction}, #6b7280, #6b7280)`;
  const pairs = dense.map(
    (color, index) => `${color} ${((index / (dense.length - 1)) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(${direction}, ${pairs.join(", ")})`;
}

/** `#rrggbb` + alfa (0..1) → `rgba(...)`. Usado nas paradas das camadas de mapa. */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${Number(safeAlpha.toFixed(3))})`;
}

/** Luminância relativa — WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Razão de contraste entre duas cores (1 a 21) — WCAG 2.1. */
export function contrastRatio(colorA: string, colorB: string): number {
  const luminanceA = relativeLuminance(colorA);
  const luminanceB = relativeLuminance(colorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Matrizes de simulação por tipo de CVD (Machado et al., severidade 1.0). */
const CVD_MATRICES: Record<Exclude<ColorVisionMode, "default">, CvdMatrix> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

/**
 * Simula como uma cor é percebida em um modo de CVD.
 * Permite auditar as rampas (contraste entre faixas e contra o fundo do mapa)
 * sem depender apenas da inspeção visual de quem tem visão tricromata.
 */
export function simulateColorVision(hex: string, mode: ColorVisionMode): string {
  if (mode === "default") return hex;

  const matrix = CVD_MATRICES[mode];
  const { r, g, b } = parseHex(hex);
  const linear = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const simulated = matrix.map(
    (row) => row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2],
  );

  return toHex({
    r: linearToSrgb(simulated[0]),
    g: linearToSrgb(simulated[1]),
    b: linearToSrgb(simulated[2]),
  });
}


