"use client";

import { createContext, useContext } from "react";
import type { ShellContextType } from "@/core/types/shell";

const ShellContext = createContext<ShellContextType | null>(null);

/**
 * Provider do ShellContext — envolve o ObservatorioShell.
 * Módulos consomem o contexto via useShellContext(), nunca importando do Shell diretamente.
 */
export const ShellProvider = ShellContext.Provider;

/**
 * Hook público para módulos consumirem o estado compartilhado do Shell.
 * Lança erro descritivo se usado fora do ShellProvider.
 */
export function useShellContext(): ShellContextType {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error(
      "[useShellContext] Hook usado fora do ShellProvider. " +
        "Certifique-se de que o componente está dentro de <ObservatorioShell>.",
    );
  }
  return ctx;
}
