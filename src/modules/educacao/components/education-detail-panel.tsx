"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ModuleDetailPanelProps } from "@/core/types/module";
import { buildEducationSelection } from "@/modules/educacao/hooks/use-education-selection";
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

function SocioRow({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <IndicatorRow label={label} value={value} description={description} />
  );
}

function formatPct(value: unknown) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

function formatNum(value: unknown) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("pt-BR");
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

function SocioeconomicoSections({ socio }: { socio: Record<string, unknown> }) {
  const socioPop = socio?.populacao as Record<string, unknown> | undefined;
  const socioEducacao = socio?.educacaoPopulacao as Record<string, unknown> | undefined;
  const socioSaneamento = socio?.saneamento as Record<string, unknown> | undefined;
  const socioRaca = socio?.raca as Record<string, unknown> | undefined;
  const socioHabitacao = socio?.habitacao as Record<string, unknown> | undefined;
  const socioFamilia = socio?.familia as Record<string, unknown> | undefined;
  const socioEtaria = socio?.estruturaEtaria as Record<string, unknown> | undefined;
  const socioMortalidade = socio?.mortalidade as Record<string, unknown> | undefined;

  return (
    <>
      <DimensionDivider label="Socioeconômico" dimension="socioeconomico" />

      <div className="grid grid-cols-2 gap-2">
        {socioPop?.total != null && (
          <MetricCard
            label="População"
            value={formatNum(socioPop.total)}
            description="População residente total"
            dimension="socioeconomico"
          />
        )}
        {socioEducacao?.taxaAnalfabetismo15Mais != null && (
          <MetricCard
            label="Analfabetismo 15+"
            value={formatPct(socioEducacao.taxaAnalfabetismo15Mais)}
            description="Taxa de analfabetismo da população com 15 anos ou mais"
            dimension="socioeconomico"
          />
        )}
      </div>

      {(socioSaneamento?.pctAguaRedeGeral != null ||
        socioSaneamento?.pctEsgotoRedeGeral != null ||
        socioSaneamento?.pctLixoColetado != null) && (
        <DetailSection title="Saneamento básico" dimension="socioeconomico" source="IBGE Censo 2022" defaultOpen>
          {socioSaneamento?.pctAguaRedeGeral != null && (
            <SocioRow
              label="Água rede geral"
              value={formatPct(socioSaneamento.pctAguaRedeGeral)}
              description="Domicílios com abastecimento de água por rede geral"
            />
          )}
          {socioSaneamento?.pctEsgotoRedeGeral != null && (
            <SocioRow
              label="Esgoto rede geral"
              value={formatPct(socioSaneamento.pctEsgotoRedeGeral)}
              description="Domicílios com esgotamento sanitário por rede geral"
            />
          )}
          {socioSaneamento?.pctLixoColetado != null && (
            <SocioRow
              label="Lixo coletado"
              value={formatPct(socioSaneamento.pctLixoColetado)}
              description="Domicílios com coleta de lixo"
            />
          )}
        </DetailSection>
      )}

      {(socioRaca?.pctPretaParda != null ||
        socioEtaria?.pctCriancas0a9 != null ||
        socioEtaria?.pctIdosos60Mais != null ||
        socioFamilia?.pctResponsavelFeminino != null) && (
        <DetailSection title="Perfil demográfico" dimension="socioeconomico" source="IBGE Censo 2022" defaultOpen={false}>
          {socioRaca?.pctPretaParda != null && (
            <SocioRow
              label="Pop. preta/parda"
              value={formatPct(socioRaca.pctPretaParda)}
              description="Percentual da população que se declara preta ou parda"
            />
          )}
          {socioEtaria?.pctCriancas0a9 != null && (
            <SocioRow
              label="Crianças 0–9 anos"
              value={formatPct(socioEtaria.pctCriancas0a9)}
              description="Percentual da população entre 0 e 9 anos"
            />
          )}
          {socioEtaria?.pctIdosos60Mais != null && (
            <SocioRow
              label="Idosos 60+ anos"
              value={formatPct(socioEtaria.pctIdosos60Mais)}
              description="Percentual da população com 60 anos ou mais"
            />
          )}
          {socioFamilia?.pctResponsavelFeminino != null && (
            <SocioRow
              label="Chefes femininas"
              value={formatPct(socioFamilia.pctResponsavelFeminino)}
              description="Percentual de domicílios com responsável do sexo feminino"
            />
          )}
        </DetailSection>
      )}

      {(socioHabitacao?.pctDomImprovisado != null ||
        socioHabitacao?.pctDomSuperlotado != null) && (
        <DetailSection title="Habitação" dimension="socioeconomico" source="IBGE Censo 2022" defaultOpen={false}>
          {socioHabitacao?.pctDomImprovisado != null && (
            <SocioRow
              label="Domicílios improvisados"
              value={formatPct(socioHabitacao.pctDomImprovisado)}
              description="Percentual de domicílios em estruturas improvisadas"
            />
          )}
          {socioHabitacao?.pctDomSuperlotado != null && (
            <SocioRow
              label="Domicílios superlotados"
              value={formatPct(socioHabitacao.pctDomSuperlotado)}
              description="Percentual de domicílios com mais de 3 moradores por dormitório"
            />
          )}
        </DetailSection>
      )}

      {socioMortalidade != null && Object.keys(socioMortalidade).length > 0 && (
        <DetailSection title="Mortalidade" dimension="socioeconomico" source="IBGE Censo 2022" defaultOpen={false}>
          {Object.entries(socioMortalidade).map(([key, val]) => (
            <SocioRow key={key} label={key} value={formatNum(val)} />
          ))}
        </DetailSection>
      )}
    </>
  );
}

export function EducationDetailPanel({ entity }: ModuleDetailPanelProps) {
  const edu = buildEducationSelection(entity);

  const data = entity.data as unknown as Record<string, unknown>;
  const geoProps = data.geoProps as Record<string, unknown> | undefined;
  const entitySource = (geoProps?.source ?? data.source) as string | undefined;
  const temBairroOficial = (data.temBairroOficial ?? geoProps?.tem_bairro_oficial) as boolean | undefined;
  const socio = (geoProps?.socioeconomico as Record<string, unknown> | undefined) ?? undefined;
  const hasSocioeconomico = entity.kind !== "escola" && socio != null;

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

      {hasSocioeconomico && socio ? (
        <SocioeconomicoSections socio={socio} />
      ) : null}

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
  );
}