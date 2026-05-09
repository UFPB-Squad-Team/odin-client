"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ModuleDetailPanelProps } from "@/core/types/module";
import { buildEducationSelection } from "@/modules/educacao/hooks/use-education-selection";
import { buildSocioeconomicoSelection } from "@/modules/socioeconomico/hooks/use-socioeconomico-selection";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";

const DIMENSION = {
  educacao: {
    label: "Educação",
    border: "border-l-cyan-500",
    headerBg: "bg-cyan-500/8 dark:bg-cyan-500/10",
    headerHover: "hover:bg-cyan-500/15 dark:hover:bg-cyan-500/20",
    titleColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    valuePulse: "text-cyan-700 dark:text-cyan-300",
  },
  socioeconomico: {
    label: "IBGE",
    border: "border-l-violet-500",
    headerBg: "bg-violet-500/8 dark:bg-violet-500/10",
    headerHover: "hover:bg-violet-500/15 dark:hover:bg-violet-500/20",
    titleColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    valuePulse: "text-violet-700 dark:text-violet-300",
  },
} as const;

type DimensionKey = keyof typeof DIMENSION;

function resolveSourceBadge(
  entity: ModuleDetailPanelProps["entity"],
): { label: string; isWarning: boolean } {
  const data = entity.data as unknown as Record<string, unknown>;
  const geoProps = data.geoProps as Record<string, unknown> | undefined;
  const source = (geoProps?.source ?? data.source) as string | undefined;
  const temBairroOficial = (data.temBairroOficial ?? geoProps?.tem_bairro_oficial) as boolean | undefined;

  if (source === "setor_indicadores" || temBairroOficial === false) {
    return { label: "Setor censitário", isWarning: true };
  }
  if (source === "bairros_indicadores" || source === "municipio_indicadores") {
    return { label: "IBGE 2022", isWarning: false };
  }
  if (entity.kind === "municipio") {
    const hasApiData = geoProps?.socioeconomico != null;
    return { label: hasApiData ? "IBGE 2022" : "IBGE · mock", isWarning: false };
  }
  return { label: "IBGE · mock", isWarning: false };
}

function DetailSection({
  title,
  dimension,
  source,
  sourceIsWarning,
  defaultOpen = true,
  children,
}: {
  title: string;
  dimension: DimensionKey;
  source?: string;
  sourceIsWarning?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const d = DIMENSION[dimension];

  return (
    <div className={`rounded-lg border border-border/50 border-l-2 ${d.border} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 ${d.headerBg} ${d.headerHover} transition-colors text-left`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[11px] font-bold uppercase tracking-widest ${d.titleColor}`}>
            {title}
          </span>
          {source && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                sourceIsWarning
                  ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : d.badgeBg
              }`}
            >
              {source}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>
      {open && (
        <div className="px-3 py-1.5 divide-y divide-border/30">{children}</div>
      )}
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-3">
      <div className="min-w-0">
        {description ? (
          <IndicatorTooltip description={description}>
            <span className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help leading-snug">
              {label}
            </span>
          </IndicatorTooltip>
        ) : (
          <span className="text-xs text-muted-foreground leading-snug">{label}</span>
        )}
      </div>
      <span
        className={`text-sm font-semibold tabular-nums shrink-0 ${highlight ? "text-foreground" : "text-foreground/90"}`}
      >
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  dimension,
}: {
  label: string;
  value: string;
  description?: string;
  dimension: DimensionKey;
}) {
  const d = DIMENSION[dimension];
  return (
    <div className={`rounded-lg border border-border/50 border-l-2 ${d.border} px-3 py-2.5 bg-muted/30`}>
      {description ? (
        <IndicatorTooltip description={description}>
          <p className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help mb-0.5">
            {label}
          </p>
        </IndicatorTooltip>
      ) : (
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      )}
      <p className={`text-xl font-bold tabular-nums leading-none ${d.valuePulse}`}>{value}</p>
    </div>
  );
}

function DimensionDivider({ label, dimension }: { label: string; dimension: DimensionKey }) {
  const d = DIMENSION[dimension];
  return (
    <div className="flex items-center gap-2 pt-1">
      <div
        className={`h-px flex-1 bg-gradient-to-r from-transparent ${
          dimension === "educacao" ? "to-cyan-500/30" : "to-violet-500/30"
        }`}
      />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${d.titleColor} opacity-70`}>
        {label}
      </span>
      <div
        className={`h-px flex-1 bg-gradient-to-l from-transparent ${
          dimension === "educacao" ? "to-cyan-500/30" : "to-violet-500/30"
        }`}
      />
    </div>
  );
}

function DataQualityNote({ source, temBairroOficial }: { source?: string; temBairroOficial?: boolean }) {
  if (source === "setor_indicadores" || temBairroOficial === false) {
    return (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
        Dados baseados em setores censitários — este município não possui delimitação oficial de bairros.
      </div>
    );
  }
  return null;
}

export function EducationDetailPanel({ entity, onNavigate }: ModuleDetailPanelProps) {
  const edu = buildEducationSelection(entity);
  const socio = buildSocioeconomicoSelection(entity);

  const data = entity.data as unknown as Record<string, unknown>;
  const geoProps = data.geoProps as Record<string, unknown> | undefined;
  const entitySource = (geoProps?.source ?? data.source) as string | undefined;
  const temBairroOficial = (data.temBairroOficial ?? geoProps?.tem_bairro_oficial) as boolean | undefined;

  const { label: socioSourceLabel, isWarning: socioSourceIsWarning } = resolveSourceBadge(entity);

  return (
    <div className="flex flex-col gap-2.5 p-4">
      {entity.kind === "bairro" && (
        <DataQualityNote source={entitySource} temBairroOficial={temBairroOficial} />
      )}

      {edu.metrics && edu.metrics.length > 0 && (
        <>
          <DimensionDivider label="Educação" dimension="educacao" />
          <div className="grid grid-cols-2 gap-2">
            {edu.metrics.map((m) => (
              <MetricCard key={m.label} label={m.label} value={m.value} description={m.description} dimension="educacao" />
            ))}
          </div>
        </>
      )}

      {edu.sections?.map((section) => (
        <DetailSection key={section.title} title={section.title} dimension="educacao" source="Censo Escolar" defaultOpen>
          {section.rows.map((row) => (
            <IndicatorRow key={row.label} label={row.label} value={row.value} description={row.description} />
          ))}
        </DetailSection>
      ))}

      {entity.kind !== "escola" && (
        <>
          <DimensionDivider label="Contexto Socioeconômico" dimension="socioeconomico" />

          {socio.metrics && socio.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {socio.metrics.map((m) => (
                <MetricCard key={m.label} label={m.label} value={m.value} description={m.description} dimension="socioeconomico" />
              ))}
            </div>
          )}

          {socio.sections?.map((section) => (
            <DetailSection
              key={section.title}
              title={section.title}
              dimension="socioeconomico"
              source={socioSourceLabel}
              sourceIsWarning={socioSourceIsWarning}
              defaultOpen={false}
            >
              {section.rows.map((row) => (
                <IndicatorRow key={row.label} label={row.label} value={row.value} description={row.description} />
              ))}
            </DetailSection>
          ))}
        </>
      )}

      {entity.kind === "escola" && (
        <Link
          href={`/schools/${entity.data.id}`}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium text-cyan-700 transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/10 dark:text-cyan-300"
        >
          Abrir página completa da escola →
        </Link>
      )}

      {(entity.kind === "municipio" || entity.kind === "bairro") && (
        <button
          className="mt-2 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-colors"
          onClick={() => onNavigate(entity)}
        >
          Ver escolas deste {entity.kind === "municipio" ? "município" : "bairro"} →
        </button>
      )}
    </div>
  );
}