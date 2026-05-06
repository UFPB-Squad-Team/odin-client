"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ModuleDetailPanelProps } from "@/core/types/module";
import { buildEducationSelection } from "@/modules/educacao/hooks/use-education-selection";
import { buildSocioeconomicoSelection } from "@/modules/socioeconomico/hooks/use-socioeconomico-selection";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";

// ─── Tokens de identidade por dimensão ───────────────────────────────────────
const DIMENSION = {
  educacao: {
    label: "Educação",
    // borda lateral + header
    border: "border-l-cyan-500",
    headerBg: "bg-cyan-500/8 dark:bg-cyan-500/10",
    headerHover: "hover:bg-cyan-500/15 dark:hover:bg-cyan-500/20",
    titleColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg:
      "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    valuePulse: "text-cyan-700 dark:text-cyan-300",
  },
  socioeconomico: {
    label: "IBGE",
    border: "border-l-violet-500",
    headerBg: "bg-violet-500/8 dark:bg-violet-500/10",
    headerHover: "hover:bg-violet-500/15 dark:hover:bg-violet-500/20",
    titleColor: "text-violet-600 dark:text-violet-400",
    badgeBg:
      "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    valuePulse: "text-violet-700 dark:text-violet-300",
  },
} as const;

type DimensionKey = keyof typeof DIMENSION;

// ─── Seção colapsável com identidade visual ───────────────────────────────────
function DetailSection({
  title,
  dimension,
  source,
  defaultOpen = true,
  children,
}: {
  title: string;
  dimension: DimensionKey;
  source?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const d = DIMENSION[dimension];

  return (
    <div
      className={`rounded-lg border border-border/50 border-l-2 ${d.border} overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 ${d.headerBg} ${d.headerHover} transition-colors text-left`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[11px] font-bold uppercase tracking-widest ${d.titleColor}`}
          >
            {title}
          </span>
          {source && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${d.badgeBg}`}
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

// ─── Linha de indicador ───────────────────────────────────────────────────────
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
          <span className="text-xs text-muted-foreground leading-snug">
            {label}
          </span>
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

// ─── Card de métrica headline ─────────────────────────────────────────────────
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
    <div
      className={`rounded-lg border border-border/50 border-l-2 ${d.border} px-3 py-2.5 bg-muted/30`}
    >
      {description ? (
        <IndicatorTooltip description={description}>
          <p className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help mb-0.5">
            {label}
          </p>
        </IndicatorTooltip>
      ) : (
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      )}
      <p
        className={`text-xl font-bold tabular-nums leading-none ${d.valuePulse}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Separador de dimensão ────────────────────────────────────────────────────
function DimensionDivider({
  label,
  dimension,
}: {
  label: string;
  dimension: DimensionKey;
}) {
  const d = DIMENSION[dimension];
  return (
    <div className="flex items-center gap-2 pt-1">
      <div
        className={`h-px flex-1 bg-gradient-to-r from-transparent ${dimension === "educacao" ? "to-cyan-500/30" : "to-violet-500/30"}`}
      />
      <span
        className={`text-[10px] font-bold uppercase tracking-widest ${d.titleColor} opacity-70`}
      >
        {label}
      </span>
      <div
        className={`h-px flex-1 bg-gradient-to-l from-transparent ${dimension === "educacao" ? "to-cyan-500/30" : "to-violet-500/30"}`}
      />
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────
export function EducationDetailPanel({
  entity,
  onNavigate,
}: ModuleDetailPanelProps) {
  const edu = buildEducationSelection(entity);
  const socio = buildSocioeconomicoSelection(entity);

  const hasSocioData =
    entity.kind === "municipio" &&
    entity.data.geoProps != null &&
    (entity.data.geoProps as Record<string, unknown>).socioeconomico != null;

  return (
    <div className="flex flex-col gap-2.5 p-4">
      {/* ── Bloco Educação ── */}
      {edu.metrics && edu.metrics.length > 0 && (
        <>
          <DimensionDivider label="Educação" dimension="educacao" />
          <div className="grid grid-cols-2 gap-2">
            {edu.metrics.map((m) => (
              <MetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                description={m.description}
                dimension="educacao"
              />
            ))}
          </div>
        </>
      )}

      {edu.sections?.map((section) => (
        <DetailSection
          key={section.title}
          title={section.title}
          dimension="educacao"
          source="Censo Escolar"
          defaultOpen
        >
          {section.rows.map((row) => (
            <IndicatorRow
              key={row.label}
              label={row.label}
              value={row.value}
              description={row.description}
            />
          ))}
        </DetailSection>
      ))}

      {/* ── Bloco Socioeconômico ── */}
      {entity.kind !== "escola" && (
        <>
          <DimensionDivider
            label="Contexto Socioeconômico"
            dimension="socioeconomico"
          />

          {socio.metrics && socio.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {socio.metrics.map((m) => (
                <MetricCard
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  description={m.description}
                  dimension="socioeconomico"
                />
              ))}
            </div>
          )}

          {socio.sections?.map((section) => (
            <DetailSection
              key={section.title}
              title={section.title}
              dimension="socioeconomico"
              source={hasSocioData ? "IBGE 2022" : "IBGE · mock"}
              defaultOpen={false}
            >
              {section.rows.map((row) => (
                <IndicatorRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  description={row.description}
                />
              ))}
            </DetailSection>
          ))}
        </>
      )}

      {/* ── Navegação ── */}
      {(entity.kind === "municipio" || entity.kind === "bairro") && (
        <button
          className="mt-2 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-colors"
          onClick={() => onNavigate(entity)}
        >
          Ver escolas deste{" "}
          {entity.kind === "municipio" ? "município" : "bairro"} →
        </button>
      )}
    </div>
  );
}
