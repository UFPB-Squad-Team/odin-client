"use client";

import { useEffect, useState } from "react";
import { getModule } from "@/core/registry/module-registry";
import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { ObservatoryLayer } from "@/core/types/territory";

export function useEntitySelection(
  activeModuleId: string | null,
  activeLayer: ObservatoryLayer,
  estadoId: string | null,
  municipioId: string | null,
  bairroId: string | null,
) {
  const [selected, setSelected] = useState<ObservatorySelection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Limpa seleção quando filtros ou camada mudam
  useEffect(() => {
    setSelected(null);
    setDetailsOpen(false);
  }, [estadoId, municipioId, bairroId, activeLayer]);

  function selectEntity(entity: MapEntity) {
    // Delega a construção do ObservatorySelection para o módulo ativo
    // O Shell não conhece a lógica de nenhum módulo específico
    const module = activeModuleId ? getModule(activeModuleId) : undefined;

    if (module?.buildSelection) {
      setSelected(module.buildSelection(entity));
    } else {
      // Fallback genérico quando o módulo não implementa buildSelection
      setSelected({
        id: entity.data.id,
        nome: entity.data.nome,
        kind: entity.kind,
        subtitle: `${entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1)} selecionado`,
        sourceEntity: entity,
      });
    }

    setDetailsOpen(true);
  }

  return {
    selected,
    detailsOpen,
    setDetailsOpen,
    selectEntity,
  };
}
