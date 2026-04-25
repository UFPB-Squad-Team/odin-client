// Validação em runtime da conformidade de um módulo com o ModuleContract.
// Útil para testes de regressão e para detectar módulos mal-formados no bootstrap.

import type { ModuleContract } from "@/core/types/module";

/**
 * Verifica em runtime se um valor desconhecido satisfaz o ModuleContract.
 * Checa presença e tipos dos campos obrigatórios.
 *
 * Propriedade P1: FOR ALL m IN listModules(): validateModuleContract(m) === true
 */
export function validateModuleContract(
  module: unknown,
): module is ModuleContract {
  if (typeof module !== "object" || module === null) {
    return false;
  }

  const m = module as Record<string, unknown>;

  // Campos obrigatórios
  if (typeof m.id !== "string" || m.id.trim() === "") return false;
  if (typeof m.label !== "string" || m.label.trim() === "") return false;
  if (typeof m.description !== "string") return false;
  if (!Array.isArray(m.availableLayers) || m.availableLayers.length === 0)
    return false;

  const validLayers = new Set(["municipio", "bairro", "escola"]);
  for (const layer of m.availableLayers as unknown[]) {
    if (typeof layer !== "string" || !validLayers.has(layer)) return false;
  }

  if (typeof m.SidebarPanel !== "function") return false;

  // Campos opcionais — se presentes, devem ter o tipo correto
  if (m.DetailPanel !== undefined && typeof m.DetailPanel !== "function")
    return false;
  if (
    m.getIndicators !== undefined &&
    typeof m.getIndicators !== "function"
  )
    return false;
  if (
    m.getMapLayerStyle !== undefined &&
    typeof m.getMapLayerStyle !== "function"
  )
    return false;
  if (
    m.buildSelection !== undefined &&
    typeof m.buildSelection !== "function"
  )
    return false;
  if (
    m.onModuleActivated !== undefined &&
    typeof m.onModuleActivated !== "function"
  )
    return false;
  if (
    m.onModuleDeactivated !== undefined &&
    typeof m.onModuleDeactivated !== "function"
  )
    return false;

  return true;
}
