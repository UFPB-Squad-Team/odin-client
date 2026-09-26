"use client";

import { useEffect, useMemo, useState } from "react";
import { listModules } from "@/core/registry/module-registry";
import type { ObservatoryLayer } from "@/core/types/territory";
import type { IndicatorGroup } from "@/shell/components/map-indicator-picker";
import { useModuleAccents } from "@/shell/hooks/use-module-accents";

/**
 * Builds indicator groups from all registered modules for the active layer.
 * Polls for module availability after mount to handle async bootstrap.
 */
export function useIndicatorGroups(
  activeLayer: ObservatoryLayer,
  activeModuleId?: string | null,
): IndicatorGroup[] {
  const { accentFor } = useModuleAccents();
  const [moduleCount, setModuleCount] = useState(() => listModules().length);

  // Poll until modules are registered (handles async bootstrap)
  useEffect(() => {
    if (moduleCount > 0) return;

    const interval = setInterval(() => {
      const count = listModules().length;
      if (count > 0) {
        setModuleCount(count);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [moduleCount]);

  return useMemo(() => {
    const modules = listModules();

    return modules
      .map((mod) => {
        const indicators = mod.getIndicators?.(activeLayer) ?? [];
        if (indicators.length === 0) return null;

        return {
          moduleId: mod.id,
          moduleLabel: mod.label,
          colorAccent: accentFor(mod.id),
          indicators,
        };
      })
      .filter(Boolean) as IndicatorGroup[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, moduleCount, activeModuleId, accentFor]);
}
