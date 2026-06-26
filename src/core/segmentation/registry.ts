/**
 * Registry de módulos de segmentação.
 * Permite que módulos (educação, saúde, etc.) se registrem
 * e sejam descobertos pelo sistema de comparação.
 */

import type { SegmentationModule, SegmentationResult } from "./types";

const _modules = new Map<string, SegmentationModule>();

export function registerSegmentationModule(module: SegmentationModule): void {
  _modules.set(module.id, module);
}

export function getSegmentationModule(id: string): SegmentationModule | undefined {
  return _modules.get(id);
}

export function getAllSegmentationModules(): SegmentationModule[] {
  return Array.from(_modules.values());
}

/**
 * Extrai segmentos disponíveis para uma entidade em um dado módulo.
 */
export function getSegmentationForEntity(
  moduleId: string,
  geoProps: Record<string, unknown>
): SegmentationResult | null {
  const mod = _modules.get(moduleId);
  if (!mod) return null;

  const available = mod.extractAvailableSegments(geoProps);
  const defaultSeg = mod.defaultSegment;

  // Se não detectou segmentos específicos, oferece TODOS para o usuário escolher
  // Isso garante que o seletor apareça e o usuário possa filtrar
  if (available.length === 0) {
    const allSegments = Object.keys(mod.segments);
    return {
      module: mod,
      availableSegments: allSegments,
      hasMultiple: allSegments.length > 1,
      primarySegment: defaultSeg,
    };
  }

  return {
    module: mod,
    availableSegments: available,
    hasMultiple: available.length > 1,
    primarySegment: available[0],
  };
}

