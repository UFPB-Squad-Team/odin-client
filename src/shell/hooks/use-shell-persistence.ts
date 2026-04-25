"use client";

import { useEffect, useRef } from "react";
import type { ObservatoryLayer } from "@/core/types/territory";

const STORAGE_KEY = "odin:shell:state";

export type PersistableShellState = {
  estadoId: string | null;
  municipioId: string | null;
  bairroId: string | null;
  activeLayer: ObservatoryLayer;
  activeModuleId: string | null;
  sidebarCollapsed: boolean;
};

type InitialShellState = Partial<PersistableShellState>;

function readFromUrl(): InitialShellState {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const validLayers: ObservatoryLayer[] = ["municipio", "bairro", "escola"];
  const layer = params.get("layer") as ObservatoryLayer | null;

  return {
    estadoId: params.get("estado") ?? undefined,
    municipioId: params.get("municipio") ?? undefined,
    bairroId: params.get("bairro") ?? undefined,
    activeLayer: layer && validLayers.includes(layer) ? layer : undefined,
    activeModuleId: params.get("modulo") ?? undefined,
  };
}

function readFromStorage(): InitialShellState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as InitialShellState;
  } catch {
    return {};
  }
}

/**
 * Lê o estado inicial de URL (prioridade) e localStorage (fallback).
 * Deve ser chamado uma única vez na inicialização do Shell.
 */
export function readInitialShellState(): InitialShellState {
  const fromUrl = readFromUrl();
  const fromStorage = readFromStorage();
  // URL tem prioridade sobre localStorage
  return {
    estadoId: fromUrl.estadoId ?? fromStorage.estadoId ?? null,
    municipioId: fromUrl.municipioId ?? fromStorage.municipioId ?? null,
    bairroId: fromUrl.bairroId ?? fromStorage.bairroId ?? null,
    activeLayer: fromUrl.activeLayer ?? fromStorage.activeLayer ?? "bairro",
    activeModuleId: fromUrl.activeModuleId ?? fromStorage.activeModuleId ?? null,
    sidebarCollapsed: fromStorage.sidebarCollapsed ?? false,
  };
}

/**
 * Persiste o estado do Shell em localStorage e URL a cada mudança.
 */
export function useShellPersistence(state: PersistableShellState) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Pula a primeira renderização para não sobrescrever o estado lido na inicialização
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Persiste em localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage pode estar indisponível (modo privado, etc.)
    }

    // Sincroniza URL sem recarregar a página
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (state.estadoId) params.set("estado", state.estadoId);
      if (state.municipioId) params.set("municipio", state.municipioId);
      if (state.bairroId) params.set("bairro", state.bairroId);
      if (state.activeLayer) params.set("layer", state.activeLayer);
      if (state.activeModuleId) params.set("modulo", state.activeModuleId);

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState(null, "", newUrl);
    }
  }, [state]);
}
