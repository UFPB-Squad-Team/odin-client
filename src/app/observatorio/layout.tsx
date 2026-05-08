"use client";

import { ShellProvider } from "@/shell/context/shell-context";
import { useObservatorioShell } from "@/shell/hooks/use-observatorio-shell";
import type { ShellContextType } from "@/core/types/shell";

export default function ObservatorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    activeLayer,
    bairros,
    filters,
    mapEntities,
    municipios,
    selected,
    setActiveLayer,
    setActiveModule,
    activeModuleId,
  } = useObservatorioShell();

  const shellContext: ShellContextType = {
    activeLayer,
    filters: {
      activeLayer,
      estadoId: filters.estadoId,
      municipioId: filters.municipioId,
      bairroId: filters.bairroId,
    },
    selectedEntity: selected?.sourceEntity ?? null,
    activeModuleId,
    setActiveLayer,
    setActiveModule,
    municipios: municipios || [],
    bairros: bairros || [],
    escolas: mapEntities
      .filter(e => e.kind === "escola")
      .map(e => e.data) || [],
  };

  return (
    <ShellProvider value={shellContext}>
      {children}
    </ShellProvider>
  );
}