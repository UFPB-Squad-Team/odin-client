"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { listModules } from "@/core/registry/module-registry";
import type { MapEntity } from "@/core/types/shell";
import type { DimensionContribution, DimensionVisibility } from "./types";
import { DimensionToggleBar } from "./dimension-toggle-bar";
import { DimensionDivider } from "./dimension-divider";
import { DetailMetricCard } from "./detail-metric-card";
import { DetailSectionCard } from "./detail-section-card";

const MODULE_COLORS: Record<string, string> = {
  educacao: "#06b6d4",
  socioeconomico: "#a78bfa",
  saude: "#10b981",
  habitacao: "#f59e0b",
  seguranca: "#f43f5e",
};

const DEFAULT_COLOR = "#6b7280";

const STORAGE_KEY = "odin:detail-panel:dimensions";

function loadVisibility(): DimensionVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DimensionVisibility;
  } catch { /* ignore */ }
  return {};
}

function saveVisibility(visibility: DimensionVisibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch { /* ignore */ }
}


type TerritoryDetailPanelProps = {
  entity: MapEntity;
};

export function TerritoryDetailPanel({ entity }: TerritoryDetailPanelProps) {
  const [visibility, setVisibility] = useState<DimensionVisibility>(loadVisibility);
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

  useEffect(() => {
    saveVisibility(visibility);
  }, [visibility]);

  const contributions = useMemo<DimensionContribution[]>(() => {
    const modules = listModules();

    return modules
      .map((mod) => {
        if (!mod.buildDetailSections) return null;

        const contribution = mod.buildDetailSections(entity);
        if (!contribution) return null;
        if (contribution.metrics.length === 0 && contribution.sections.length === 0) return null;

        return {
          moduleId: mod.id,
          moduleLabel: mod.label,
          colorAccent: MODULE_COLORS[mod.id] ?? DEFAULT_COLOR,
          contribution,
        };
      })
      .filter(Boolean) as DimensionContribution[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, moduleCount]);

  const handleToggle = (moduleId: string) => {
    setVisibility((prev) => ({
      ...prev,
      [moduleId]: prev[moduleId] === false ? true : false,
    }));
  };

  const visibleContributions = contributions.filter(
    (c) => visibility[c.moduleId] !== false,
  );

  const dimensionsMeta = contributions.map((c) => ({
    moduleId: c.moduleId,
    moduleLabel: c.moduleLabel,
    colorAccent: c.colorAccent,
  }));

  if (contributions.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Nenhum dado disponível para esta entidade.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <DimensionToggleBar
        dimensions={dimensionsMeta}
        visibility={visibility}
        onToggle={handleToggle}
      />

      <div className="flex flex-col gap-2.5 p-4">
        {visibleContributions.map((dim) => (
          <div key={dim.moduleId} className="flex flex-col gap-2">
            <DimensionDivider label={dim.moduleLabel} colorAccent={dim.colorAccent} />

            {dim.contribution.metrics.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dim.contribution.metrics.map((metric) => (
                  <DetailMetricCard
                    key={metric.label}
                    metric={metric}
                    colorAccent={dim.colorAccent}
                  />
                ))}
              </div>
            )}

            {dim.contribution.sections.map((section) => (
              <DetailSectionCard
                key={section.title}
                section={section}
                colorAccent={dim.colorAccent}
              />
            ))}
          </div>
        ))}

        {entity.kind === "escola" && (
          <Link
            href={`/schools/${entity.data.id}`}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium text-cyan-700 transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/10 dark:text-cyan-300"
          >
            Abrir página completa da escola →
          </Link>
        )}

        {entity.kind === "municipio" && (
          <Link
            href={`/observatorio/municipios/${entity.data.id}/schools`}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium text-cyan-700 transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/10 dark:text-cyan-300"
          >
            Ver escolas deste município →
          </Link>
        )}
      </div>
    </div>
  );
}
