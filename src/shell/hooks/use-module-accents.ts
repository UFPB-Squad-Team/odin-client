"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useA11y } from "@/components/providers/a11y-provider";
import {
  getAccessibleModuleAccent,
  getAccessibleSurfaceAccent,
} from "@/core/a11y/palettes";
import type { AccentSurface } from "@/core/types/a11y";

/**
 * Cores de acento dos módulos (Educação, Socioeconômico, Saúde, ...).
 *
 * São a fonte única usada pelo painel de detalhes, pelo seletor de indicadores e
 * pelos chips de dimensão.
 *
 * - No modo padrão valem as cores históricas do shell (mapa e painel não mudam).
 * - Nos modos acessíveis o acento passa a vir da mesma rampa Oklab do choropleth:
 *   assim trocar o modo de visão de cores altera o mapa **e** a leitura do painel,
 *   mantendo os acentos separáveis em cada tipo de CVD.
 */
export const MODULE_ACCENT_FALLBACKS: Record<string, string> = {
  educacao: "#06b6d4", // cyan
  socioeconomico: "#a78bfa", // violet
  saude: "#10b981", // emerald
  habitacao: "#f59e0b", // amber
  seguranca: "#f43f5e", // rose
};

/** Cinza neutro para módulos sem cor declarada. */
export const MODULE_ACCENT_FALLBACK = "#6b7280";

export interface ModuleAccents {
  /** Acento do módulo no modo e na superfície atuais (nunca `null`). */
  accentFor: (moduleId: string) => string;
  /** Acento neutro do painel sem módulo ativo (`null` no modo padrão). */
  surfaceAccent: string | null;
  /** true quando os acentos vêm da rampa acessível (modo ≠ padrão, já hidratado). */
  isAccessiblePalette: boolean;
  /** Superfície dos painéis, que define a metade da rampa usada. */
  surface: AccentSurface;
}

export function useModuleAccents(): ModuleAccents {
  const { colorVisionMode, isAccessiblePalette } = useA11y();
  const { resolvedTheme } = useTheme();

  // `resolvedTheme` é indefinido no SSR e na primeira renderização no cliente:
  // assume superfície escura (padrão dos painéis do observatório) para não gerar
  // divergência de hidratação.
  const surface: AccentSurface = resolvedTheme === "light" ? "light" : "dark";

  const accentFor = useMemo(
    () => (moduleId: string) =>
      getAccessibleModuleAccent(moduleId, colorVisionMode, surface) ??
      MODULE_ACCENT_FALLBACKS[moduleId] ??
      MODULE_ACCENT_FALLBACK,
    [colorVisionMode, surface],
  );

  const surfaceAccent = useMemo(
    () => getAccessibleSurfaceAccent(colorVisionMode, surface),
    [colorVisionMode, surface],
  );

  return { accentFor, surfaceAccent, isAccessiblePalette, surface };
}
