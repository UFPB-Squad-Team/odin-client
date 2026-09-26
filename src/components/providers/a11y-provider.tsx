"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_COLOR_VISION_MODE,
  isColorVisionMode,
} from "@/core/a11y/palettes";
import type { ColorVisionMode } from "@/core/types/a11y";

const COLOR_VISION_STORAGE_KEY = "odin-a11y-color-vision";
const OUTLINE_STORAGE_KEY = "odin-a11y-outline-emphasis";

interface A11yContextValue {
  /** Modo de visão de cores ativo (persistido no navegador). */
  colorVisionMode: ColorVisionMode;
  setColorVisionMode: (mode: ColorVisionMode) => void;
  /** Reforça os contornos dos polígonos (dupla codificação por forma). */
  outlineEmphasis: boolean;
  setOutlineEmphasis: (enabled: boolean) => void;
  /** true quando o mapa usa uma rampa acessível (modo ≠ padrão). */
  isAccessiblePalette: boolean;
  /** true quando os contornos devem ser reforçados (manual ou automático). */
  useStrongOutlines: boolean;
}

const A11yContext = createContext<A11yContextValue | null>(null);

/**
 * Provider das preferências de acessibilidade do ODIN.
 *
 * Montado no layout raiz para que mapa, legenda e páginas de comparação leiam a
 * mesma preferência. A restauração acontece no cliente (evita mismatch de SSR) e
 * o modo ativo também é publicado em `<html data-cvd="...">` para consultas de
 * estilo e para ferramentas externas de auditoria.
 */
export function A11yProvider({ children }: { children: ReactNode }) {
  const [colorVisionMode, setColorVisionModeState] = useState<ColorVisionMode>(
    DEFAULT_COLOR_VISION_MODE,
  );
  const [outlineEmphasis, setOutlineEmphasisState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedMode = window.localStorage.getItem(COLOR_VISION_STORAGE_KEY);
      if (isColorVisionMode(storedMode)) {
        setColorVisionModeState(storedMode);
      }
      setOutlineEmphasisState(
        window.localStorage.getItem(OUTLINE_STORAGE_KEY) === "true",
      );
    } catch {
      // localStorage indisponível (modo privado) — mantém os padrões.
    }
    setHydrated(true);
  }, []);

  const setColorVisionMode = useCallback((mode: ColorVisionMode) => {
    setColorVisionModeState(mode);
    try {
      window.localStorage.setItem(COLOR_VISION_STORAGE_KEY, mode);
    } catch {
      // Sem persistência: a preferência vale só para esta sessão.
    }
  }, []);

  const setOutlineEmphasis = useCallback((enabled: boolean) => {
    setOutlineEmphasisState(enabled);
    try {
      window.localStorage.setItem(OUTLINE_STORAGE_KEY, String(enabled));
    } catch {
      // Sem persistência: a preferência vale só para esta sessão.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.cvd = colorVisionMode;
    root.dataset.cvdOutlines = outlineEmphasis ? "strong" : "default";
  }, [colorVisionMode, outlineEmphasis]);

  const value = useMemo<A11yContextValue>(
    () => ({
      colorVisionMode,
      setColorVisionMode,
      outlineEmphasis,
      setOutlineEmphasis,
      isAccessiblePalette: hydrated && colorVisionMode !== "default",
      useStrongOutlines: outlineEmphasis || colorVisionMode === "achromatopsia",
    }),
    [
      colorVisionMode,
      setColorVisionMode,
      outlineEmphasis,
      setOutlineEmphasis,
      hydrated,
    ],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

/**
 * Hook público das preferências de acessibilidade.
 * Lança erro descritivo se usado fora do A11yProvider (mesmo padrão do ShellContext).
 */
export function useA11y(): A11yContextValue {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error(
      "[useA11y] Hook usado fora do A11yProvider. " +
      "Certifique-se de que o componente está dentro do layout com <A11yProvider>.",
    );
  }
  return context;
}
