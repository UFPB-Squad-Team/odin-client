"use client";

import React, { useMemo, useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useShellContext } from "@/shell/context/shell-context";
import { getModule } from "@/core/registry/module-registry";
import { listBairros, listMunicipios } from "@/core/territory/territory-api";
import { fetchMunicipiosGeoJSON } from "@/core/geospatial/geospatial-api";
import {
  DEFAULT_ESTADO_ID,
  NORDESTE_ESTADOS,
  normalizeEstadoId,
} from "@/core/territory/estados-nordeste";
import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { Bairro, Municipio } from "@/core/types/territory";


function parseNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function fmt(v: unknown, decimals = 1): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = parseNum(v);
  if (n === 0) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(decimals);
}

function fmtPct(v: unknown): string {
  const n = parseNum(v);
  if (n === 0) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtInt(v: unknown): string {
  const n = parseNum(v);
  if (n === 0) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}


/** Rótulo do lado ("Estado A", "Município B"…) conforme a granularidade atual. */
function kindNoun(kind: CompareEntityKind, side: "A" | "B"): string {
  const base = kind === "estado" ? "Estado" : kind === "bairro" ? "Bairro" : "Município";
  return `${base} ${side}`;
}

/** Plural da granularidade para textos de estado vazio. */
function kindPlural(kind: CompareEntityKind): string {
  return kind === "estado" ? "estados" : kind === "bairro" ? "bairros" : "municípios";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Chaves de taxa/proporção → média simples; demais chaves numéricas → soma. */
function isAggMeanKey(key: string): boolean {
  return /^(pct|taxa|razao|media|média)/i.test(key);
}

type AggAcc = { total: number; count: number };

function collectAggValues(
  node: Record<string, unknown>,
  prefix: string,
  into: Map<string, AggAcc>,
) {
  for (const [key, raw] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(raw)) {
      collectAggValues(raw, path, into);
      continue;
    }
    const num = toFiniteNumber(raw);
    if (num === null) continue;
    const acc = into.get(path) ?? { total: 0, count: 0 };
    acc.total += num;
    acc.count += 1;
    into.set(path, acc);
  }
}

function setPathValue(target: Record<string, unknown>, path: string, value: number) {
  const parts = path.split(".");
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!isRecord(node[part])) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/**
 * Agrega as props dos municípios de um estado em um único objeto no formato
 * esperado por `extractComparableMetrics` (`educacao` / `socioeconomico`):
 * somatório para totais, média simples para percentuais/taxas.
 */
function aggregateEstadoProps(
  collection: { features?: Array<{ properties?: unknown }> } | null,
): Record<string, unknown> | null {
  const features = (collection?.features ?? []).filter((f) =>
    isRecord(f?.properties),
  ) as Array<{ properties: Record<string, unknown> }>;
  if (features.length === 0) return null;

  const sections: Record<string, unknown> = {};
  let hasValues = false;

  for (const section of ["educacao", "socioeconomico"] as const) {
    const acc = new Map<string, AggAcc>();
    for (const feature of features) {
      const sec = feature.properties[section];
      if (isRecord(sec)) collectAggValues(sec, "", acc);
    }
    if (acc.size === 0) continue;

    const out: Record<string, unknown> = {};
    acc.forEach(({ total, count }, path) => {
      const leaf = path.split(".").pop() ?? path;
      setPathValue(out, path, isAggMeanKey(leaf) ? total / count : total);
    });
    sections[section] = out;
    hasValues = true;
  }

  return hasValues ? sections : null;
}


type MetricGroup = {
  label: string;
  metrics: Array<{
    key: string;
    label: string;
    a: number;
    b: number;
    format: "int" | "pct" | "decimal";
    higherIsBetter: boolean;
    competitive?: boolean;
  }>;
};

type CompareEntityKind = "estado" | "municipio" | "bairro";

type CompareEntity = {
  id: string;
  nome: string;
  estadoId?: string;
  municipioId?: string;
  geoProps?: Record<string, unknown>;
};

function extractComparableMetrics(
  a: CompareEntity | null,
  b: CompareEntity | null,
  kind: CompareEntityKind,
): MetricGroup[] {
  const pa = (a?.geoProps ?? {}) as Record<string, unknown>;
  const pb = (b?.geoProps ?? {}) as Record<string, unknown>;
  const ea = (pa.educacao ?? {}) as Record<string, unknown>;
  const eb = (pb.educacao ?? {}) as Record<string, unknown>;
  const sa = (pa.socioeconomico ?? {}) as Record<string, unknown>;
  const sb = (pb.socioeconomico ?? {}) as Record<string, unknown>;

  const saSaneamento = (sa.saneamento ?? {}) as Record<string, unknown>;
  const sbSaneamento = (sb.saneamento ?? {}) as Record<string, unknown>;
  const saPopulacao = (sa.populacao ?? {}) as Record<string, unknown>;
  const sbPopulacao = (sb.populacao ?? {}) as Record<string, unknown>;
  const saEducacaoPop = (sa.educacaoPopulacao ?? {}) as Record<string, unknown>;
  const sbEducacaoPop = (sb.educacaoPopulacao ?? {}) as Record<string, unknown>;
  const saEstruturaEtaria = (sa.estruturaEtaria ?? {}) as Record<string, unknown>;
  const sbEstruturaEtaria = (sb.estruturaEtaria ?? {}) as Record<string, unknown>;
  const saRaca = (sa.raca ?? {}) as Record<string, unknown>;
  const sbRaca = (sb.raca ?? {}) as Record<string, unknown>;
  const saHabitacao = (sa.habitacao ?? {}) as Record<string, unknown>;
  const sbHabitacao = (sb.habitacao ?? {}) as Record<string, unknown>;
  const saGenero = (sa.genero ?? {}) as Record<string, unknown>;
  const sbGenero = (sb.genero ?? {}) as Record<string, unknown>;

  const redeEscolarMetrics: MetricGroup["metrics"] = [
    {
      key: "totalEscolas",
      label: "Total de escolas",
      a: parseNum(ea.totalEscolas ?? pa.total_escolas),
      b: parseNum(eb.totalEscolas ?? pb.total_escolas),
      format: "int",
      higherIsBetter: true,
    },
    {
      key: "totalAlunos",
      label: "Total de alunos",
      a: parseNum(ea.totalMatriculas ?? pa.total_alunos),
      b: parseNum(eb.totalMatriculas ?? pb.total_alunos),
      format: "int",
      higherIsBetter: true,
    },
  ];

  if (kind !== "bairro") {
    redeEscolarMetrics.push({
      key: "totalBairros",
      label: "Bairros com escolas",
      a: parseNum(ea.totalBairros),
      b: parseNum(eb.totalBairros),
      format: "int",
      higherIsBetter: true,
    });
  }

  return [
    {
      label: "Rede escolar",
      metrics: redeEscolarMetrics,
    },
    {
      label: "Infraestrutura escolar",
      metrics: [
        {
          key: "internet",
          label: "Com internet p/ alunos",
          a: parseNum(ea.pctComInternet ?? pa.pct_com_internet),
          b: parseNum(eb.pctComInternet ?? pb.pct_com_internet),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "biblioteca",
          label: "Com biblioteca",
          a: parseNum(ea.pctComBiblioteca ?? pa.pct_com_biblioteca),
          b: parseNum(eb.pctComBiblioteca ?? pb.pct_com_biblioteca),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "lab",
          label: "Com lab. informática",
          a: parseNum(ea.pctComLabInformatica ?? pa.pct_com_lab_informatica),
          b: parseNum(eb.pctComLabInformatica ?? pb.pct_com_lab_informatica),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "comAcessibilidade",
          label: "Com acessibilidade PCD",
          a: Math.max(
            0,
            100 - parseNum(ea.pctSemAcessibilidade ?? pa.pct_sem_acessibilidade),
          ),
          b: Math.max(
            0,
            100 - parseNum(eb.pctSemAcessibilidade ?? pb.pct_sem_acessibilidade),
          ),
          format: "pct",
          higherIsBetter: true,
        },
      ],
    },
    {
      label: "Demografia",
      metrics: [
        {
          key: "populacaoTotal",
          label: "População total",
          a: parseNum(saPopulacao.total),
          b: parseNum(sbPopulacao.total),
          format: "int",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "totalDomicilios",
          label: "Total de domicílios",
          a: parseNum(saPopulacao.totalDomicilios),
          b: parseNum(sbPopulacao.totalDomicilios),
          format: "int",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctCriancas0a9",
          label: "Crianças (0-9)",
          a: parseNum(saEstruturaEtaria.pctCriancas0a9),
          b: parseNum(sbEstruturaEtaria.pctCriancas0a9),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctJovens15a29",
          label: "Jovens (15-29)",
          a: parseNum(saEstruturaEtaria.pctJovens15a29),
          b: parseNum(sbEstruturaEtaria.pctJovens15a29),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctAdultos30a59",
          label: "Adultos (30-59)",
          a: parseNum(saEstruturaEtaria.pctAdultos30a59),
          b: parseNum(sbEstruturaEtaria.pctAdultos30a59),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctIdosos60Mais",
          label: "Idosos (60+)",
          a: parseNum(saEstruturaEtaria.pctIdosos60Mais),
          b: parseNum(sbEstruturaEtaria.pctIdosos60Mais),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPopMasculina",
          label: "Pop. masculina",
          a: parseNum(saGenero.pctPopMasculina),
          b: parseNum(sbGenero.pctPopMasculina),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPopFeminina",
          label: "Pop. feminina",
          a: parseNum(saGenero.pctPopFeminina),
          b: parseNum(sbGenero.pctPopFeminina),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctPretaParda",
          label: "Pop. preta/parda",
          a: parseNum(saRaca.pctPretaParda),
          b: parseNum(sbRaca.pctPretaParda),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctBranca",
          label: "Pop. branca",
          a: parseNum(saRaca.pctBranca),
          b: parseNum(sbRaca.pctBranca),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "pctIndigena",
          label: "Pop. indígena",
          a: parseNum(saRaca.pctIndigena),
          b: parseNum(sbRaca.pctIndigena),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
      ],
    },
    {
      label: "Saneamento",
      metrics: [
        {
          key: "aguaRedeGeral",
          label: "Água da rede geral",
          a: parseNum(saSaneamento.pctAguaRedeGeral),
          b: parseNum(sbSaneamento.pctAguaRedeGeral),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "esgotoRedeGeral",
          label: "Esgoto da rede geral",
          a: parseNum(saSaneamento.pctEsgotoRedeGeral),
          b: parseNum(sbSaneamento.pctEsgotoRedeGeral),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "lixoColetado",
          label: "Lixo coletado",
          a: parseNum(saSaneamento.pctLixoColetado),
          b: parseNum(sbSaneamento.pctLixoColetado),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "aguaNaoEncanada",
          label: "Sem água encanada",
          a: parseNum(saSaneamento.pctAguaNaoEncanada),
          b: parseNum(sbSaneamento.pctAguaNaoEncanada),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "domSemBanheiro",
          label: "Sem banheiro",
          a: parseNum(saSaneamento.pctDomSemBanheiro),
          b: parseNum(sbSaneamento.pctDomSemBanheiro),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "aguaInadequada",
          label: "Água inadequada",
          a: parseNum(saSaneamento.pctAguaInadequada),
          b: parseNum(sbSaneamento.pctAguaInadequada),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "esgotoInadequado",
          label: "Esgoto inadequado",
          a: parseNum(saSaneamento.pctEsgotoInadequado),
          b: parseNum(sbSaneamento.pctEsgotoInadequado),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "lixoInadequado",
          label: "Lixo inadequado",
          a: parseNum(saSaneamento.pctLixoInadequado),
          b: parseNum(sbSaneamento.pctLixoInadequado),
          format: "pct",
          higherIsBetter: false,
        },
      ],
    },
    {
      label: "Habitação e vulnerabilidade",
      metrics: [
        {
          key: "taxaAlfabetizacao15Mais",
          label: "Alfabetização (15+)",
          a: Math.max(0, 100 - parseNum(saEducacaoPop.taxaAnalfabetismo15Mais)),
          b: Math.max(0, 100 - parseNum(sbEducacaoPop.taxaAnalfabetismo15Mais)),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "razaoDependencia",
          label: "Razão de dependência",
          a: parseNum(saEstruturaEtaria.razaoDependencia),
          b: parseNum(sbEstruturaEtaria.razaoDependencia),
          format: "pct",
          higherIsBetter: false,
        },
        {
          key: "domNaoSuperlotado",
          label: "Dom. não superlotados",
          a: Math.max(0, 100 - parseNum(saHabitacao.pctDomSuperlotado)),
          b: Math.max(0, 100 - parseNum(sbHabitacao.pctDomSuperlotado)),
          format: "pct",
          higherIsBetter: true,
        },
        {
          key: "domUnipessoal",
          label: "Dom. unipessoais",
          a: parseNum(saHabitacao.pctDomUnipessoal),
          b: parseNum(sbHabitacao.pctDomUnipessoal),
          format: "pct",
          higherIsBetter: false,
          competitive: false,
        },
        {
          key: "domTipoCasa",
          label: "Dom. tipo casa",
          a: parseNum(saHabitacao.pctDomTipoCasa),
          b: parseNum(sbHabitacao.pctDomTipoCasa),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "domTipoApto",
          label: "Dom. tipo apartamento",
          a: parseNum(saHabitacao.pctDomTipoApto),
          b: parseNum(sbHabitacao.pctDomTipoApto),
          format: "pct",
          higherIsBetter: true,
          competitive: false,
        },
        {
          key: "domDegradado",
          label: "Dom. degradado/inacabado",
          a: parseNum(saHabitacao.pctDomDegradado),
          b: parseNum(sbHabitacao.pctDomDegradado),
          format: "pct",
          higherIsBetter: false,
        },
      ],
    },
  ];
}

function formatMetricValue(
  v: number,
  format: "int" | "pct" | "decimal",
): string {
  if (v === 0) return "—";
  if (format === "int") return fmtInt(v);
  if (format === "pct") return fmtPct(v);
  return fmt(v);
}

function wrapRadarLabel(label: string, maxCharacters = 14): string[] {
  const lines: string[] = [];

  for (const word of label.split(/\s+/)) {
    const current = lines[lines.length - 1];
    if (current && `${current} ${word}`.length <= maxCharacters) {
      lines[lines.length - 1] = `${current} ${word}`;
    } else if (word.length <= maxCharacters) {
      lines.push(word);
    } else {
      for (let index = 0; index < word.length; index += maxCharacters) {
        lines.push(word.slice(index, index + maxCharacters));
      }
    }
  }

  return lines.length > 0 ? lines : [label];
}


function RadarChart({
  groups,
  nameA,
  nameB,
  isDark,
}: {
  groups: MetricGroup[];
  nameA: string;
  nameB: string;
  isDark: boolean;
}) {
  const allMetrics = groups.flatMap((g) => g.metrics);
  if (allMetrics.length === 0) return null;

  const size = 280;
  const center = size / 2;
  const radius = 100;
  const count = allMetrics.length;
  const angle = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2;

  const maxPerMetric = allMetrics.map((m) => Math.max(m.a, m.b, 0.0001));

  function pointsFor(values: number[]) {
    return values
      .map((v, i) => {
        const pct = v / (maxPerMetric[i] ?? 1);
        const r = Math.sqrt(Math.max(0, pct)) * radius;
        const x = center + Math.cos(angle(i)) * r;
        const y = center + Math.sin(angle(i)) * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const valuesA = allMetrics.map((m) => m.a);
  const valuesB = allMetrics.map((m) => m.b);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full"
      >
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * t}
            fill="none"
            className={isDark ? "stroke-zinc-700/40" : "stroke-zinc-300/70"}
            strokeWidth={0.5}
          />
        ))}
        {allMetrics.map((_, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle(i)) * radius}
            y2={center + Math.sin(angle(i)) * radius}
            className={isDark ? "stroke-zinc-700/30" : "stroke-zinc-300/70"}
            strokeWidth={0.5}
          />
        ))}
        <polygon
          points={pointsFor(valuesA)}
          fill={isDark ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.10)"}
          stroke="#06b6d4"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polygon
          points={pointsFor(valuesB)}
          fill={isDark ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.10)"}
          stroke="#a855f7"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {allMetrics.map((m, i) => {
          const lx = center + Math.cos(angle(i)) * (radius + 16);
          const ly = center + Math.sin(angle(i)) * (radius + 16);
          const anchor =
            Math.abs(Math.cos(angle(i))) < 0.15
              ? "middle"
              : Math.cos(angle(i)) > 0
                ? "start"
                : "end";
          const labelLines = wrapRadarLabel(m.label);
          const labelStartY = ly - ((labelLines.length - 1) * 4);
          return (
            <text
              key={m.key}
              x={lx}
              y={labelStartY}
              fontSize={8}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={isDark ? "fill-zinc-400" : "fill-zinc-500"}
            >
              <title>{m.label}</title>
              {labelLines.map((line, lineIndex) => (
                <tspan key={`${m.key}-${lineIndex}`} x={lx} dy={lineIndex === 0 ? 0 : 9}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-cyan-400" />
          <span className={isDark ? "text-zinc-400 truncate max-w-[100px]" : "text-zinc-600 truncate max-w-[100px]"}>{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-purple-500" />
          <span className={isDark ? "text-zinc-400 truncate max-w-[100px]" : "text-zinc-600 truncate max-w-[100px]"}>{nameB}</span>
        </div>
      </div>
    </div>
  );
}


function CompareBar({
  a,
  b,
  higherIsBetter,
  isDark,
}: {
  a: number;
  b: number;
  higherIsBetter: boolean;
  isDark: boolean;
}) {
  if (a === 0 && b === 0) return null;
  const total = a + b;
  if (total === 0) return null;
  const pctA = (a / total) * 100;
  const pctB = (b / total) * 100;
  const aWins = higherIsBetter ? a >= b : a <= b;
  const bWins = higherIsBetter ? b > a : b < a;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full">
      <div
        style={{ width: `${pctA}%` }}
        className={`transition-all ${aWins && a !== b ? "bg-cyan-400" : isDark ? "bg-zinc-600" : "bg-zinc-300"}`}
      />
      <div
        style={{ width: `${pctB}%` }}
        className={`transition-all ${bWins && a !== b ? "bg-purple-500" : isDark ? "bg-zinc-600" : "bg-zinc-300"}`}
      />
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL (com conteúdo)
// ============================================================

function ComparePageContent() {
  const ctx = useShellContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const didPreselect = useRef(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [compareKind, setCompareKind] = useState<CompareEntityKind>("municipio");
  const [ufA, setUfA] = useState<string>("");
  const [ufB, setUfB] = useState<string>("");
  const [municipiosA, setMunicipiosA] = useState<Municipio[]>([]);
  const [municipiosB, setMunicipiosB] = useState<Municipio[]>([]);
  const [isLoadingMunicipiosA, setIsLoadingMunicipiosA] = useState(true);
  const [isLoadingMunicipiosB, setIsLoadingMunicipiosB] = useState(true);
  const [bairroMunicipioIdA, setBairroMunicipioIdA] = useState<string>("");
  const [bairroMunicipioIdB, setBairroMunicipioIdB] = useState<string>("");
  const [bairrosByMunicipioA, setBairrosByMunicipioA] = useState<Bairro[]>([]);
  const [bairrosByMunicipioB, setBairrosByMunicipioB] = useState<Bairro[]>([]);
  const [isLoadingBairroItemsA, setIsLoadingBairroItemsA] = useState(false);
  const [isLoadingBairroItemsB, setIsLoadingBairroItemsB] = useState(false);
  const [estadoAgg, setEstadoAgg] = useState<Record<string, Record<string, unknown>>>({});
  const [isLoadingEstadoAgg, setIsLoadingEstadoAgg] = useState(false);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [radarGroupLabel, setRadarGroupLabel] = useState("");
  const didInitUfs = useRef(false);
  const bairroCacheRef = useRef<Record<string, Bairro[]>>({});
  const municipiosCacheRef = useRef<Record<string, Municipio[]>>({});
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = isDark
    ? {
      page: "bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.14),_transparent_35%),linear-gradient(180deg,_#09090b,_#0f172a)] text-zinc-100",
      surface: "border-zinc-800 bg-zinc-900/50",
      surfaceStrong: "border-zinc-800 bg-zinc-950/70",
      surfaceSoft: "border-zinc-800 bg-zinc-900/40",
      border: "border-zinc-800",
      borderSoft: "border-zinc-700",
      text: "text-zinc-100",
      textSoft: "text-zinc-300",
      muted: "text-zinc-400",
      mutedStrong: "text-zinc-500",
      input: "border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-600",
      button: "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
      buttonSoft: "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
      empty: "border-zinc-800 text-zinc-600",
    }
    : {
      page: "bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.10),_transparent_35%),linear-gradient(180deg,_#fafafa,_#eef4f9)] text-zinc-900",
      surface: "border-zinc-200 bg-white/90 shadow-sm shadow-cyan-500/5",
      surfaceStrong: "border-zinc-200 bg-white/95 shadow-sm shadow-cyan-500/5",
      surfaceSoft: "border-zinc-200 bg-zinc-50/80",
      border: "border-zinc-200",
      borderSoft: "border-zinc-300",
      text: "text-zinc-900",
      textSoft: "text-zinc-700",
      muted: "text-zinc-500",
      mutedStrong: "text-zinc-600",
      input: "border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400",
      button: "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
      buttonSoft: "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900",
      empty: "border-zinc-300 text-zinc-500",
    };

  const activeModuleId = ctx.activeModuleId ?? null;

  const bairros = useMemo(
    () => (ctx.bairros ?? []) as Bairro[],
    [ctx.bairros],
  );

  // Inicialização das UFs por lado: query string > filtro do shell > padrão.
  useEffect(() => {
    if (didInitUfs.current) return;
    const urlPrimaria = normalizeEstadoId(searchParams.get("primaryEstado"));
    const urlSecundaria = normalizeEstadoId(searchParams.get("secondaryEstado"));
    if (urlPrimaria || urlSecundaria) {
      const base = urlPrimaria ?? urlSecundaria ?? DEFAULT_ESTADO_ID;
      setUfA(urlPrimaria ?? base);
      setUfB(urlSecundaria ?? base);
      didInitUfs.current = true;
      return;
    }
    if (!ctx.filters.estadoId) return;
    const shellUf = normalizeEstadoId(ctx.filters.estadoId) ?? DEFAULT_ESTADO_ID;
    setUfA(shellUf);
    setUfB(shellUf);
    didInitUfs.current = true;
  }, [ctx.filters.estadoId, searchParams]);

  // Lista de municípios por lado (modos município e bairro), com cache por UF.
  useEffect(() => {
    if (compareKind === "estado") return;
    if (!ufA) return;
    const cached = municipiosCacheRef.current[ufA];
    if (cached) {
      setMunicipiosA(cached);
      setIsLoadingMunicipiosA(false);
      return;
    }
    let alive = true;
    setIsLoadingMunicipiosA(true);
    setMunicipiosA([]);
    listMunicipios(ufA)
      .then((data) => {
        municipiosCacheRef.current[ufA] = data;
        if (alive) setMunicipiosA(data);
      })
      .catch(() => {
        if (alive) setMunicipiosA([]);
      })
      .finally(() => {
        if (alive) setIsLoadingMunicipiosA(false);
      });
    return () => {
      alive = false;
    };
  }, [compareKind, ufA]);

  useEffect(() => {
    if (compareKind === "estado") return;
    if (!ufB) return;
    const cached = municipiosCacheRef.current[ufB];
    if (cached) {
      setMunicipiosB(cached);
      setIsLoadingMunicipiosB(false);
      return;
    }
    let alive = true;
    setIsLoadingMunicipiosB(true);
    setMunicipiosB([]);
    listMunicipios(ufB)
      .then((data) => {
        municipiosCacheRef.current[ufB] = data;
        if (alive) setMunicipiosB(data);
      })
      .catch(() => {
        if (alive) setMunicipiosB([]);
      })
      .finally(() => {
        if (alive) setIsLoadingMunicipiosB(false);
      });
    return () => {
      alive = false;
    };
  }, [compareKind, ufB]);

  // Município de partida de cada lado no modo bairro.
  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (isLoadingMunicipiosA || municipiosA.length === 0) return;
    const isKnown = (id: string) => municipiosA.some((m) => m.id === id);
    if (bairroMunicipioIdA && isKnown(bairroMunicipioIdA)) return;
    const fromUrl = searchParams.get("municipio") ?? "";
    const fromShell = ctx.filters.municipioId ?? "";
    setBairroMunicipioIdA(
      isKnown(fromUrl) ? fromUrl : isKnown(fromShell) ? fromShell : municipiosA[0].id,
    );
  }, [bairroMunicipioIdA, compareKind, ctx.filters.municipioId, isLoadingMunicipiosA, municipiosA, searchParams]);

  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (isLoadingMunicipiosB || municipiosB.length === 0) return;
    const isKnown = (id: string) => municipiosB.some((m) => m.id === id);
    if (bairroMunicipioIdB && isKnown(bairroMunicipioIdB)) return;
    const fromShell = ctx.filters.municipioId ?? "";
    setBairroMunicipioIdB(isKnown(fromShell) ? fromShell : municipiosB[0].id);
  }, [bairroMunicipioIdB, compareKind, ctx.filters.municipioId, isLoadingMunicipiosB, municipiosB]);

  // Bairros por lado, com cache por município.
  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (!bairroMunicipioIdA) {
      setBairrosByMunicipioA([]);
      setIsLoadingBairroItemsA(false);
      return;
    }

    const cached = bairroCacheRef.current[bairroMunicipioIdA];
    if (cached) {
      setBairrosByMunicipioA(cached);
      setIsLoadingBairroItemsA(false);
      return;
    }

    let alive = true;
    setIsLoadingBairroItemsA(true);

    async function loadBairrosA() {
      try {
        const data = await listBairros(bairroMunicipioIdA);
        const sorted = [...data].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", {
            sensitivity: "base",
            numeric: true,
          }),
        );
        bairroCacheRef.current[bairroMunicipioIdA] = sorted;
        if (alive) setBairrosByMunicipioA(sorted);
      } catch {
        if (alive) {
          const fallback = bairros.filter((item) => item.municipioId === bairroMunicipioIdA);
          setBairrosByMunicipioA(fallback);
        }
      } finally {
        if (alive) setIsLoadingBairroItemsA(false);
      }
    }

    loadBairrosA();
    return () => {
      alive = false;
    };
  }, [bairroMunicipioIdA, bairros, compareKind]);

  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (!bairroMunicipioIdB) {
      setBairrosByMunicipioB([]);
      setIsLoadingBairroItemsB(false);
      return;
    }

    const cached = bairroCacheRef.current[bairroMunicipioIdB];
    if (cached) {
      setBairrosByMunicipioB(cached);
      setIsLoadingBairroItemsB(false);
      return;
    }

    let alive = true;
    setIsLoadingBairroItemsB(true);

    async function loadBairrosB() {
      try {
        const data = await listBairros(bairroMunicipioIdB);
        const sorted = [...data].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", {
            sensitivity: "base",
            numeric: true,
          }),
        );
        bairroCacheRef.current[bairroMunicipioIdB] = sorted;
        if (alive) setBairrosByMunicipioB(sorted);
      } catch {
        if (alive) {
          const fallback = bairros.filter((item) => item.municipioId === bairroMunicipioIdB);
          setBairrosByMunicipioB(fallback);
        }
      } finally {
        if (alive) setIsLoadingBairroItemsB(false);
      }
    }

    loadBairrosB();
    return () => {
      alive = false;
    };
  }, [bairroMunicipioIdB, bairros, compareKind]);

  const estadoItems = useMemo<CompareEntity[]>(
    () =>
      NORDESTE_ESTADOS.map((estado) => ({
        id: estado.id,
        nome: estado.nome,
        estadoId: estado.sigla,
      })),
    [],
  );

  const compareItemsA = useMemo<CompareEntity[]>(() => {
    if (compareKind === "estado") return estadoItems;
    if (compareKind === "bairro") {
      return bairrosByMunicipioA.map((item) => ({
        id: item.id,
        nome: item.nome,
        municipioId: item.municipioId,
        geoProps: item.geoProps,
      }));
    }

    return municipiosA.map((item) => ({
      id: item.id,
      nome: item.nome,
      estadoId: item.estadoId,
      municipioId: item.id,
      geoProps: item.geoProps,
    }));
  }, [bairrosByMunicipioA, compareKind, estadoItems, municipiosA]);

  const compareItemsB = useMemo<CompareEntity[]>(() => {
    if (compareKind === "estado") return estadoItems;
    if (compareKind === "bairro") {
      return bairrosByMunicipioB.map((item) => ({
        id: item.id,
        nome: item.nome,
        municipioId: item.municipioId,
        geoProps: item.geoProps,
      }));
    }

    return municipiosB.map((item) => ({
      id: item.id,
      nome: item.nome,
      estadoId: item.estadoId,
      municipioId: item.id,
      geoProps: item.geoProps,
    }));
  }, [bairrosByMunicipioB, compareKind, estadoItems, municipiosB]);

  const selectedA = useMemo(
    () => compareItemsA.find((item) => item.id === primaryId) ?? null,
    [compareItemsA, primaryId],
  );
  const selectedB = useMemo(
    () => compareItemsB.find((item) => item.id === secondaryId) ?? null,
    [compareItemsB, secondaryId],
  );

  const selectionA = useMemo<ObservatorySelection | null>(() => {
    if (!selectedA) return null;
    if (compareKind === "estado") {
      return {
        id: selectedA.id,
        nome: selectedA.nome,
        kind: "estado",
        subtitle: `Estado · ${selectedA.estadoId ?? selectedA.id.toUpperCase()}`,
      };
    }
    const data = (compareKind === "bairro"
      ? ({
        id: selectedA.id,
        nome: selectedA.nome,
        municipioId: selectedA.municipioId ?? "",
        geoProps: selectedA.geoProps,
      } satisfies Bairro)
      : ({
        id: selectedA.id,
        nome: selectedA.nome,
        estadoId: selectedA.estadoId ?? "",
        geoProps: selectedA.geoProps,
      } satisfies Municipio));
    const entity: MapEntity = { kind: compareKind, data } as MapEntity;
    const mod = activeModuleId ? getModule(activeModuleId) : undefined;
    if (mod?.buildSelection) {
      try { return mod.buildSelection(entity); } catch { /* fallback */ }
    }
    return {
      id: selectedA.id,
      nome: selectedA.nome,
      kind: compareKind,
      subtitle: compareKind === "bairro" ? "Vizinhança" : "Município",
    };
  }, [selectedA, activeModuleId, compareKind]);

  const selectionB = useMemo<ObservatorySelection | null>(() => {
    if (!selectedB) return null;
    if (compareKind === "estado") {
      return {
        id: selectedB.id,
        nome: selectedB.nome,
        kind: "estado",
        subtitle: `Estado · ${selectedB.estadoId ?? selectedB.id.toUpperCase()}`,
      };
    }
    const data = (compareKind === "bairro"
      ? ({
        id: selectedB.id,
        nome: selectedB.nome,
        municipioId: selectedB.municipioId ?? "",
        geoProps: selectedB.geoProps,
      } satisfies Bairro)
      : ({
        id: selectedB.id,
        nome: selectedB.nome,
        estadoId: selectedB.estadoId ?? "",
        geoProps: selectedB.geoProps,
      } satisfies Municipio));
    const entity: MapEntity = { kind: compareKind, data } as MapEntity;
    const mod = activeModuleId ? getModule(activeModuleId) : undefined;
    if (mod?.buildSelection) {
      try { return mod.buildSelection(entity); } catch { }
    }
    return {
      id: selectedB.id,
      nome: selectedB.nome,
      kind: compareKind,
      subtitle: compareKind === "bairro" ? "Vizinhança" : "Município",
    };
  }, [selectedB, activeModuleId, compareKind]);

  const groups = useMemo(() => {
    if (compareKind === "estado") {
      const withAgg = (sel: CompareEntity | null): CompareEntity | null =>
        sel ? { ...sel, geoProps: estadoAgg[sel.id] ?? sel.geoProps } : null;
      return extractComparableMetrics(withAgg(selectedA), withAgg(selectedB), "estado");
    }
    return extractComparableMetrics(selectedA, selectedB, compareKind);
  }, [selectedA, selectedB, compareKind, estadoAgg]);

  const radarGroups = useMemo(
    () => groups.filter((group) => group.metrics.length > 0),
    [groups],
  );

  useEffect(() => {
    if (!radarGroups.some((group) => group.label === radarGroupLabel)) {
      setRadarGroupLabel(radarGroups[0]?.label ?? "");
    }
  }, [radarGroupLabel, radarGroups]);

  const selectedRadarGroup =
    radarGroups.find((group) => group.label === radarGroupLabel) ??
    radarGroups[0] ??
    null;

  // Agrega os municípios de cada estado selecionado em props estaduais.
  useEffect(() => {
    if (compareKind !== "estado") return;
    const wanted = [selectedA?.id, selectedB?.id].filter((id): id is string => Boolean(id));
    const missing = wanted.filter((id) => !estadoAgg[id]);
    if (missing.length === 0) {
      setIsLoadingEstadoAgg(false);
      return;
    }

    let alive = true;
    setIsLoadingEstadoAgg(true);

    void (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const collection = await fetchMunicipiosGeoJSON(id.toUpperCase());
            const props = aggregateEstadoProps(collection);
            return props ? ([id, props] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      if (!alive) return;
      const found = results.filter(
        (entry): entry is readonly [string, Record<string, unknown>] => entry !== null,
      );
      if (found.length > 0) {
        setEstadoAgg((prev) => {
          const next = { ...prev };
          for (const [id, props] of found) next[id] = props;
          return next;
        });
      }
      setIsLoadingEstadoAgg(false);
    })();

    return () => {
      alive = false;
    };
  }, [compareKind, selectedA?.id, selectedB?.id, estadoAgg]);

  const hasAnyData = useMemo(
    () => groups.some((g) => g.metrics.some((m) => m.a > 0 || m.b > 0)),
    [groups],
  );

  useEffect(() => {
    if (didPreselect.current) return;
    const pk = searchParams.get("primaryKind");
    const pid = searchParams.get("primaryId");
    const sk = searchParams.get("secondaryKind");
    const sid = searchParams.get("secondaryId");
    const primaryMunicipioId = searchParams.get("primaryMunicipioId");
    const secondaryMunicipioId = searchParams.get("secondaryMunicipioId");

    const targetKind: CompareEntityKind =
      pk === "bairro" || sk === "bairro"
        ? "bairro"
        : pk === "estado" || sk === "estado"
          ? "estado"
          : "municipio";

    setCompareKind(targetKind);

    const estadoPrimario = normalizeEstadoId(searchParams.get("primaryEstado"));
    const estadoSecundario = normalizeEstadoId(searchParams.get("secondaryEstado"));
    if (estadoPrimario || estadoSecundario) {
      const base = estadoPrimario ?? estadoSecundario ?? DEFAULT_ESTADO_ID;
      setUfA(estadoPrimario ?? base);
      setUfB(estadoSecundario ?? base);
      didInitUfs.current = true;
    }

    if (targetKind === "bairro") {
      const municipioFromParams =
        primaryMunicipioId ??
        secondaryMunicipioId ??
        searchParams.get("municipio") ??
        ctx.filters.municipioId ??
        "";
      if (municipioFromParams) {
        setBairroMunicipioIdA(municipioFromParams);
        setBairroMunicipioIdB(municipioFromParams);
      }
    }

    if (pk === targetKind && pid) setPrimaryId(pid);
    if (sk === targetKind && sid) setSecondaryId(sid);
    if ((pk === targetKind && pid) || (sk === targetKind && sid)) {
      didPreselect.current = true;
    }
  }, [ctx.filters.municipioId, searchParams]);

  useEffect(() => {
    const pendingA =
      compareKind !== "estado" &&
      (isLoadingMunicipiosA ||
        (compareKind === "bairro" &&
          (isLoadingBairroItemsA || (!bairroMunicipioIdA && municipiosA.length > 0))));
    const pendingB =
      compareKind !== "estado" &&
      (isLoadingMunicipiosB ||
        (compareKind === "bairro" &&
          (isLoadingBairroItemsB || (!bairroMunicipioIdB && municipiosB.length > 0))));

    if (!pendingA) {
      setPrimaryId((current) =>
        current && compareItemsA.some((item) => item.id === current) ? current : "",
      );
    }
    if (!pendingB) {
      setSecondaryId((current) =>
        current && compareItemsB.some((item) => item.id === current) ? current : "",
      );
    }
  }, [
    bairroMunicipioIdA,
    bairroMunicipioIdB,
    compareItemsA,
    compareItemsB,
    compareKind,
    isLoadingBairroItemsA,
    isLoadingBairroItemsB,
    isLoadingMunicipiosA,
    isLoadingMunicipiosB,
    municipiosA,
    municipiosB,
  ]);

  const filteredA = useMemo(() => {
    const q = searchA.trim().toLowerCase();
    if (!q) return compareItemsA.slice(0, 8);
    return compareItemsA.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 12);
  }, [compareItemsA, searchA]);

  const filteredB = useMemo(() => {
    const q = searchB.trim().toLowerCase();
    if (!q) return compareItemsB.slice(0, 8);
    return compareItemsB.filter((m) => m.nome.toLowerCase().includes(q) && m.id !== primaryId).slice(0, 12);
  }, [compareItemsB, searchB, primaryId]);

  function swap() {
    const pa = primaryId;
    const pb = secondaryId;
    setPrimaryId(pb);
    setSecondaryId(pa);
    if (compareKind !== "estado") {
      setUfA(ufB);
      setUfB(ufA);
    }
    if (compareKind === "bairro") {
      setBairroMunicipioIdA(bairroMunicipioIdB);
      setBairroMunicipioIdB(bairroMunicipioIdA);
    }
  }

  function clear() {
    setPrimaryId("");
    setSecondaryId("");
    setSearchA("");
    setSearchB("");
    setEstadoAgg({});
    didPreselect.current = false;
    router.replace("/observatorio/compare", { scroll: false });
  }

  const winner = useMemo(() => {
    if (!selectedA || !selectedB) return null;
    let scoreA = 0;
    let scoreB = 0;
    groups.forEach((g) =>
      g.metrics.forEach((m) => {
        if (m.competitive === false) return;
        if (m.a === 0 && m.b === 0) return;
        if (m.higherIsBetter) {
          if (m.a > m.b) scoreA++;
          else if (m.b > m.a) scoreB++;
        } else {
          if (m.a < m.b) scoreA++;
          else if (m.b < m.a) scoreB++;
        }
      }),
    );
    if (scoreA === scoreB) return "tie";
    return scoreA > scoreB ? "a" : "b";
  }, [groups, selectedA, selectedB]);

  const isLoading =
    compareKind === "estado"
      ? isLoadingEstadoAgg
      : compareKind === "municipio"
        ? isLoadingMunicipiosA || isLoadingMunicipiosB
        : isLoadingMunicipiosA ||
        isLoadingMunicipiosB ||
        (municipiosA.length > 0 && !bairroMunicipioIdA) ||
        (municipiosB.length > 0 && !bairroMunicipioIdB) ||
        isLoadingBairroItemsA ||
        isLoadingBairroItemsB;

  return (
    <main
      className={`min-h-screen w-full ${theme.page}`}
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .metric-row:hover { background: ${isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)"}; }
        .select-enter { animation: fadeUp 0.15s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .winner-glow-a { box-shadow: 0 0 0 1px rgba(6,182,212,0.4), 0 4px 24px rgba(6,182,212,0.12); }
        .winner-glow-b { box-shadow: 0 0 0 1px rgba(168,85,247,0.4), 0 4px 24px rgba(168,85,247,0.12); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${isDark ? "#3f3f46" : "#cbd5e1"}; border-radius: 2px; }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-8">

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500">
              ODIN · Observatório
            </p>
            <h1
              className={`mt-1 text-2xl font-bold ${theme.text}`}
              style={{ letterSpacing: "-0.02em" }}
            >
              Comparar territórios
            </h1>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              Análise lado a lado de indicadores por estado, município ou vizinhança
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ThemeToggle />
            <div className={`mr-2 flex items-center gap-1 rounded-md border p-1 ${theme.borderSoft} ${isDark ? "bg-zinc-900" : "bg-white"}`}>
              <button
                type="button"
                onClick={() => setCompareKind("estado")}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${compareKind === "estado"
                  ? "bg-emerald-600 text-white"
                  : `${theme.mutedStrong} hover:text-emerald-600`
                  }`}
              >
                Estado
              </button>
              <button
                type="button"
                onClick={() => setCompareKind("municipio")}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${compareKind === "municipio"
                  ? "bg-cyan-600 text-white"
                  : `${theme.mutedStrong} hover:text-cyan-600`
                  }`}
              >
                Município
              </button>
              <button
                type="button"
                onClick={() => setCompareKind("bairro")}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${compareKind === "bairro"
                  ? "bg-purple-600 text-white"
                  : `${theme.mutedStrong} hover:text-purple-600`
                  }`}
              >
                Vizinhança
              </button>
            </div>
            <button
              type="button"
              onClick={clear}
              className={`rounded-md border px-3 py-1.5 text-xs transition ${theme.buttonSoft}`}
            >
              Limpar
            </button>
            <Link
              href="/observatorio"
              className={`rounded-md border px-3 py-1.5 text-xs transition ${theme.button}`}
            >
              ← Voltar ao mapa
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <svg className="h-5 w-5 animate-spin text-cyan-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className={`text-sm ${theme.muted}`}>Carregando dados de comparação…</span>
          </div>
        ) : (
          <>
            {compareKind === "bairro" &&
              !isLoadingBairroItemsA &&
              !isLoadingBairroItemsB &&
              compareItemsA.length === 0 &&
              compareItemsB.length === 0 && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${theme.empty}`}>
                  Nenhum bairro disponível para o município selecionado.
                </div>
              )}

            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <div className="flex flex-col gap-2">
                {compareKind !== "estado" && (
                  <label className="flex flex-col gap-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                      Estado A
                    </span>
                    <select
                      value={ufA}
                      onChange={(event) => {
                        setUfA(event.target.value);
                        if (compareKind === "bairro") setBairroMunicipioIdA("");
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-500 ${theme.input}`}
                    >
                      {NORDESTE_ESTADOS.map((estado) => (
                        <option key={estado.id} value={estado.id}>
                          {estado.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {compareKind === "bairro" && (
                  <label className="flex flex-col gap-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                      Município A
                    </span>
                    <select
                      value={bairroMunicipioIdA}
                      onChange={(event) => setBairroMunicipioIdA(event.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-500 ${theme.input}`}
                    >
                      {municipiosA.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <MunicipioSelector
                  label={kindNoun(compareKind, "A")}
                  color="cyan"
                  selected={selectedA}
                  search={searchA}
                  filtered={filteredA}
                  onSearch={setSearchA}
                  onSelect={(m) => { setPrimaryId(m.id); setSearchA(""); }}
                  onClear={() => { setPrimaryId(""); setSearchA(""); }}
                  isDark={isDark}
                />
              </div>

              <div className="flex flex-col items-center justify-center pt-7 gap-2">
                <button
                  type="button"
                  onClick={swap}
                  disabled={!primaryId || !secondaryId}
                  title="Trocar"
                  className={`rounded-full border p-2 transition disabled:opacity-30 ${theme.buttonSoft}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {compareKind !== "estado" && (
                  <label className="flex flex-col gap-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                      Estado B
                    </span>
                    <select
                      value={ufB}
                      onChange={(event) => {
                        setUfB(event.target.value);
                        if (compareKind === "bairro") setBairroMunicipioIdB("");
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-500 ${theme.input}`}
                    >
                      {NORDESTE_ESTADOS.map((estado) => (
                        <option key={estado.id} value={estado.id}>
                          {estado.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {compareKind === "bairro" && (
                  <label className="flex flex-col gap-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                      Município B
                    </span>
                    <select
                      value={bairroMunicipioIdB}
                      onChange={(event) => setBairroMunicipioIdB(event.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-500 ${theme.input}`}
                    >
                      {municipiosB.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <MunicipioSelector
                  label={kindNoun(compareKind, "B")}
                  color="purple"
                  selected={selectedB}
                  search={searchB}
                  filtered={filteredB}
                  onSearch={setSearchB}
                  onSelect={(m) => { setSecondaryId(m.id); setSearchB(""); }}
                  onClear={() => { setSecondaryId(""); setSearchB(""); }}
                  isDark={isDark}
                />
              </div>
            </div>

            {selectedA && selectedB ? (
              <div className="space-y-4">

                {winner && winner !== "tie" && (
                  <div
                    className={`rounded-xl border px-4 py-3 ${winner === "a"
                      ? "border-cyan-500/30 bg-cyan-950/20"
                      : "border-purple-500/30 bg-purple-950/20"
                      }`}
                  >
                    <p className="text-xs text-zinc-400">
                      <span
                        className={`font-semibold ${winner === "a" ? "text-cyan-400" : "text-purple-400"}`}
                      >
                        {winner === "a" ? selectedA.nome : selectedB.nome}
                      </span>{" "}
                      se destaca na maioria dos indicadores disponíveis.
                    </p>
                  </div>
                )}

                {!hasAnyData && (
                  <div className={`rounded-xl border px-4 py-6 text-center ${theme.surfaceSoft}`}>
                    <p className={`text-sm ${theme.muted}`}>
                      Dados agregados ainda não disponíveis para este recorte.
                      Os indicadores são preenchidos conforme o Censo Escolar.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div
                        key={group.label}
                        className={`overflow-hidden rounded-xl border ${theme.surface}`}
                      >
                        <div className={`border-b px-4 py-2.5 ${theme.border}`}>
                          <h3 className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                            {group.label}
                          </h3>
                        </div>
                        <div>
                          <div className={`grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 py-2 text-[10px] font-medium uppercase tracking-widest ${theme.mutedStrong}`}>
                            <span>Indicador</span>
                            <span className="text-right text-cyan-600">{selectedA.nome.split(" ")[0]}</span>
                            <span className="text-right text-purple-600">{selectedB.nome.split(" ")[0]}</span>
                          </div>

                          {group.metrics.map((m) => {
                            const aVal = formatMetricValue(m.a, m.format);
                            const bVal = formatMetricValue(m.b, m.format);
                            const isCompetitive = m.competitive !== false;
                            const aWins =
                              isCompetitive &&
                              m.a > 0 &&
                              m.b > 0 &&
                              (m.higherIsBetter ? m.a > m.b : m.a < m.b);
                            const bWins =
                              isCompetitive &&
                              m.a > 0 &&
                              m.b > 0 &&
                              (m.higherIsBetter ? m.b > m.a : m.b < m.a);
                            const noData = m.a === 0 && m.b === 0;

                            return (
                              <div
                                key={m.key}
                                className={`metric-row grid grid-cols-[1fr_1fr_1fr] items-center gap-4 border-t px-4 py-3 transition-colors ${theme.border}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${theme.muted}`}>{m.label}</span>
                                  {isCompetitive && !m.higherIsBetter && (
                                    <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${theme.mutedStrong} ${theme.borderSoft}`}>
                                      menor melhor
                                    </span>
                                  )}
                                </div>

                                <div className="text-right">
                                  {noData ? (
                                    <span className={theme.mutedStrong}>—</span>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-sm font-semibold tabular-nums ${aWins ? "text-cyan-400" : aVal === "—" ? theme.mutedStrong : theme.textSoft
                                          }`}
                                      >
                                        {aVal}
                                      </span>
                                      {isCompetitive && m.a > 0 && m.b > 0 && (
                                        <CompareBar a={m.a} b={m.b} higherIsBetter={m.higherIsBetter} isDark={isDark} />
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right">
                                  {noData ? (
                                    <span className={theme.mutedStrong}>—</span>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-sm font-semibold tabular-nums ${bWins ? "text-purple-400" : bVal === "—" ? theme.mutedStrong : theme.textSoft
                                          }`}
                                      >
                                        {bVal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className={`rounded-xl border p-4 ${theme.surface}`}>
                      <p className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                        Radar por tema
                      </p>
                      {hasAnyData ? (
                        <>
                          <div
                            className="mb-4 flex flex-wrap gap-1.5"
                            role="tablist"
                            aria-label="Tema de indicadores do radar"
                          >
                            {radarGroups.map((group) => {
                              const selected = group.label === selectedRadarGroup?.label;
                              return (
                                <button
                                  key={group.label}
                                  type="button"
                                  role="tab"
                                  aria-selected={selected}
                                  onClick={() => setRadarGroupLabel(group.label)}
                                  className={`rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 ${selected
                                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                                    : `${theme.borderSoft} ${theme.muted} hover:bg-zinc-100 dark:hover:bg-zinc-800/70`}`}
                                >
                                  {group.label}
                                </button>
                              );
                            })}
                          </div>
                          {selectedRadarGroup ? (
                            <>
                              <p className={`mb-2 text-[11px] ${theme.mutedStrong}`}>
                                {selectedRadarGroup.metrics.length} indicadores neste conjunto
                              </p>
                              <RadarChart
                                groups={[selectedRadarGroup]}
                                nameA={selectedA.nome}
                                nameB={selectedB.nome}
                                isDark={isDark}
                              />
                            </>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex h-40 items-center justify-center">
                          <p className={`text-xs ${theme.mutedStrong}`}>Sem dados</p>
                        </div>
                      )}
                    </div>

                    {hasAnyData && (
                      <div className={`rounded-xl border p-4 ${theme.surface}`}>
                        <p className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] ${theme.muted}`}>
                          Placar
                        </p>
                        <ScoreCard
                          groups={groups}
                          nameA={selectedA.nome}
                          nameB={selectedB.nome}
                          isDark={isDark}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {selectedA && (
                        <div
                          className={`rounded-xl border p-3 ${theme.surface} ${winner === "a" ? "winner-glow-a" : ""}`}
                        >
                          <p className={`text-[10px] ${theme.muted}`}>
                            {kindNoun(compareKind, "A")}
                          </p>
                          <p className={`mt-0.5 text-sm font-medium ${theme.text}`}>{selectedA.nome}</p>
                          {selectionA?.metrics?.map((m) => (
                            <div key={m.label} className="mt-1 flex justify-between text-xs">
                              <span className={theme.muted}>{m.label}</span>
                              <span className={`font-medium ${theme.textSoft}`}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedB && (
                        <div
                          className={`rounded-xl border p-3 ${theme.surface} ${winner === "b" ? "winner-glow-b" : ""}`}
                        >
                          <p className={`text-[10px] ${theme.muted}`}>
                            {kindNoun(compareKind, "B")}
                          </p>
                          <p className={`mt-0.5 text-sm font-medium ${theme.text}`}>{selectedB.nome}</p>
                          {selectionB?.metrics?.map((m) => (
                            <div key={m.label} className="mt-1 flex justify-between text-xs">
                              <span className={theme.muted}>{m.label}</span>
                              <span className={`font-medium ${theme.textSoft}`}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border border-dashed py-16 text-center ${theme.empty}`}>
                <p className={`text-sm ${theme.mutedStrong}`}>
                  Selecione dois {kindPlural(compareKind)} para iniciar a comparação
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL (com Suspense)
// ============================================================

function ScoreCard({
  groups,
  nameA,
  nameB,
  isDark,
}: {
  groups: MetricGroup[];
  nameA: string;
  nameB: string;
  isDark: boolean;
}) {
  let scoreA = 0;
  let scoreB = 0;
  let ties = 0;

  groups.forEach((g) =>
    g.metrics.forEach((m) => {
      if (m.competitive === false) return;
      if (m.a === 0 && m.b === 0) return;
      if (m.higherIsBetter) {
        if (m.a > m.b) scoreA++;
        else if (m.b > m.a) scoreB++;
        else ties++;
      } else {
        if (m.a < m.b) scoreA++;
        else if (m.b < m.a) scoreB++;
        else ties++;
      }
    }),
  );

  const total = scoreA + scoreB + ties;
  const pctA = total > 0 ? Math.round((scoreA / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((scoreB / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-cyan-400 font-semibold">{nameA.split(" ")[0]}</span>
        <span className={isDark ? "text-zinc-600 text-[10px]" : "text-zinc-500 text-[10px]"}>
          {ties > 0 ? `${ties} empate${ties > 1 ? "s" : ""}` : ""}
        </span>
        <span className="text-purple-400 font-semibold">{nameB.split(" ")[0]}</span>
      </div>
      <div className={`flex h-2 overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
        <div style={{ width: `${pctA}%` }} className="bg-cyan-500 transition-all" />
        <div style={{ width: `${pctB}%` }} className="bg-purple-500 transition-all" />
      </div>
      <div className={`flex justify-between text-xs ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>
        <span>{scoreA} indicador{scoreA !== 1 ? "es" : ""}</span>
        <span>{scoreB} indicador{scoreB !== 1 ? "es" : ""}</span>
      </div>
    </div>
  );
}

function MunicipioSelector({
  label,
  color,
  selected,
  search,
  filtered,
  onSearch,
  onSelect,
  onClear,
  isDark,
}: {
  label: string;
  color: "cyan" | "purple";
  selected: CompareEntity | null;
  search: string;
  filtered: CompareEntity[];
  onSearch: (q: string) => void;
  onSelect: (m: CompareEntity) => void;
  onClear: () => void;
  isDark: boolean;
}) {
  const accent = color === "cyan" ? "text-cyan-400" : "text-purple-400";
  const border = color === "cyan" ? "border-cyan-500/40" : "border-purple-500/40";
  const ring = color === "cyan" ? "focus:ring-cyan-500/30" : "focus:ring-purple-500/30";
  const panel = isDark ? "bg-zinc-900/60" : "bg-white";
  const input = isDark
    ? "border-zinc-700 bg-zinc-900 text-white placeholder-zinc-600"
    : "border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400";
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] ${accent}`}>
        {label}
      </p>
      {selected ? (
        <div className={`rounded-xl border ${border} ${panel} p-3`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>{selected.nome}</p>
              {selected.estadoId && (
                <p className={isDark ? "mt-0.5 text-xs text-zinc-500" : "mt-0.5 text-xs text-zinc-600"}>
                  {selected.estadoId.toUpperCase()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClear}
              className={`mt-0.5 rounded border px-2 py-0.5 text-[10px] transition ${isDark
                ? "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                : "border-zinc-300 text-zinc-600 hover:text-zinc-900"
                }`}
            >
              Trocar
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={`Buscar ${label.toLowerCase().replace(" a", "").replace(" b", "")}…`}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-zinc-600 focus:ring-1 ${input} ${ring}`}
          />
          {filtered.length > 0 && (
            <ul
              className={`select-enter absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border py-1 shadow-xl ${isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
                }`}
            >
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={() => onSelect(m)}
                    className={`w-full px-3 py-2 text-left transition ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                  >
                    <div className={isDark ? "text-sm text-zinc-200" : "text-sm text-zinc-900"}>{m.nome}</div>
                    {m.estadoId && <div className={isDark ? "text-[10px] text-zinc-600" : "text-[10px] text-zinc-500"}>{m.estadoId.toUpperCase()}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// EXPORT PRINCIPAL COM SUSPENSE
// ============================================================

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-cyan-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-zinc-400">Carregando comparador...</span>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
