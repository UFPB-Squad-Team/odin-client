"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useShellContext } from "@/shell/context/shell-context";
import { getModule } from "@/core/registry/module-registry";
import { listBairros } from "@/core/territory/territory-api";
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

type CompareEntityKind = "municipio" | "bairro";

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

  if (kind === "municipio") {
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
          const shortLabel =
            m.label.length > 14 ? m.label.slice(0, 13) + "…" : m.label;
          return (
            <text
              key={m.key}
              x={lx}
              y={ly}
              fontSize={9}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={isDark ? "fill-zinc-400" : "fill-zinc-500"}
            >
              {shortLabel}
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


export default function ComparePage() {
  const ctx = useShellContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const didPreselect = useRef(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [compareKind, setCompareKind] = useState<CompareEntityKind>("municipio");
  const [bairroMunicipioId, setBairroMunicipioId] = useState<string>("");
  const [bairrosByMunicipio, setBairrosByMunicipio] = useState<Bairro[]>([]);
  const [isLoadingBairroItems, setIsLoadingBairroItems] = useState(false);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const bairroCacheRef = useRef<Record<string, Bairro[]>>({});
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

  const municipios = useMemo(
    () => (ctx.municipios ?? []) as Municipio[],
    [ctx.municipios],
  );
  const bairros = useMemo(
    () => (ctx.bairros ?? []) as Bairro[],
    [ctx.bairros],
  );

  const bairroMunicipioOptions = useMemo(
    () =>
      [...municipios].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", {
          sensitivity: "base",
          numeric: true,
        }),
      ),
    [municipios],
  );

  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (bairroMunicipioId) return;

    const municipioFromUrl = searchParams.get("municipio") ?? "";
    const currentShellMunicipio = ctx.filters.municipioId ?? "";
    const defaultMunicipio =
      municipioFromUrl || currentShellMunicipio || bairroMunicipioOptions[0]?.id || "";

    if (defaultMunicipio) setBairroMunicipioId(defaultMunicipio);
  }, [bairroMunicipioId, bairroMunicipioOptions, compareKind, ctx.filters.municipioId, searchParams]);

  useEffect(() => {
    if (compareKind !== "bairro") return;
    if (!bairroMunicipioId) {
      setBairrosByMunicipio([]);
      return;
    }

    const cached = bairroCacheRef.current[bairroMunicipioId];
    if (cached) {
      setBairrosByMunicipio(cached);
      return;
    }

    let alive = true;
    setIsLoadingBairroItems(true);

    async function loadBairrosByMunicipio() {
      try {
        const data = await listBairros(bairroMunicipioId);
        const sorted = [...data].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", {
            sensitivity: "base",
            numeric: true,
          }),
        );
        bairroCacheRef.current[bairroMunicipioId] = sorted;
        if (alive) setBairrosByMunicipio(sorted);
      } catch {
        if (alive) {
          const fallback = bairros.filter((item) => item.municipioId === bairroMunicipioId);
          setBairrosByMunicipio(fallback);
        }
      } finally {
        if (alive) setIsLoadingBairroItems(false);
      }
    }

    loadBairrosByMunicipio();
    return () => {
      alive = false;
    };
  }, [bairroMunicipioId, bairros, compareKind]);

  const compareItems = useMemo<CompareEntity[]>(() => {
    if (compareKind === "bairro") {
      return bairrosByMunicipio.map((item) => ({
        id: item.id,
        nome: item.nome,
        municipioId: item.municipioId,
        geoProps: item.geoProps,
      }));
    }

    return municipios.map((item) => ({
      id: item.id,
      nome: item.nome,
      estadoId: item.estadoId,
      municipioId: item.id,
      geoProps: item.geoProps,
    }));
  }, [bairrosByMunicipio, compareKind, municipios]);

  const selectedA = useMemo(
    () => compareItems.find((item) => item.id === primaryId) ?? null,
    [compareItems, primaryId],
  );
  const selectedB = useMemo(
    () => compareItems.find((item) => item.id === secondaryId) ?? null,
    [compareItems, secondaryId],
  );

  const selectionA = useMemo<ObservatorySelection | null>(() => {
    if (!selectedA) return null;
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

  const groups = useMemo(
    () => extractComparableMetrics(selectedA, selectedB, compareKind),
    [selectedA, selectedB, compareKind],
  );

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
      pk === "bairro" || sk === "bairro" ? "bairro" : "municipio";

    setCompareKind(targetKind);

    if (targetKind === "bairro") {
      const municipioFromParams =
        primaryMunicipioId ??
        secondaryMunicipioId ??
        searchParams.get("municipio") ??
        ctx.filters.municipioId ??
        "";
      if (municipioFromParams) setBairroMunicipioId(municipioFromParams);
    }

    if (pk === targetKind && pid) setPrimaryId(pid);
    if (sk === targetKind && sid) setSecondaryId(sid);
    if ((pk === targetKind && pid) || (sk === targetKind && sid)) {
      didPreselect.current = true;
    }
  }, [ctx.filters.municipioId, searchParams]);

  useEffect(() => {
    if (compareItems.length === 0) {
      if (compareKind === "bairro" && isLoadingBairroItems) return;
      setPrimaryId("");
      setSecondaryId("");
      return;
    }

    setPrimaryId((current) =>
      current && compareItems.some((item) => item.id === current) ? current : "",
    );
    setSecondaryId((current) =>
      current && compareItems.some((item) => item.id === current) ? current : "",
    );
  }, [compareItems, compareKind, isLoadingBairroItems]);

  const filteredA = useMemo(() => {
    const q = searchA.trim().toLowerCase();
    if (!q) return compareItems.slice(0, 8);
    return compareItems.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 12);
  }, [compareItems, searchA]);

  const filteredB = useMemo(() => {
    const q = searchB.trim().toLowerCase();
    if (!q) return compareItems.slice(0, 8);
    return compareItems.filter((m) => m.nome.toLowerCase().includes(q) && m.id !== primaryId).slice(0, 12);
  }, [compareItems, searchB, primaryId]);

  function swap() {
    const pa = primaryId;
    const pb = secondaryId;
    setPrimaryId(pb);
    setSecondaryId(pa);
  }

  function clear() {
    setPrimaryId("");
    setSecondaryId("");
    setSearchA("");
    setSearchB("");
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
    compareKind === "municipio"
      ? municipios.length === 0
      : bairroMunicipioOptions.length > 0 && (!bairroMunicipioId || isLoadingBairroItems);

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
              Análise lado a lado de indicadores por município ou vizinhança
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ThemeToggle />
            <div className={`mr-2 flex items-center gap-1 rounded-md border p-1 ${theme.borderSoft} ${isDark ? "bg-zinc-900" : "bg-white"}`}>
              <button
                type="button"
                onClick={() => setCompareKind("municipio")}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${
                  compareKind === "municipio"
                    ? "bg-cyan-600 text-white"
                    : `${theme.mutedStrong} hover:text-cyan-600`
                }`}
              >
                Município
              </button>
              <button
                type="button"
                onClick={() => setCompareKind("bairro")}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wide transition ${
                  compareKind === "bairro"
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
            {compareKind === "bairro" && (
              <div className={`mb-4 grid gap-2 rounded-xl border px-4 py-3 sm:grid-cols-[1fr_240px] sm:items-center ${theme.surfaceSoft}`}>
                <p className={`text-sm ${theme.muted}`}>
                  Escolha o município para listar e comparar suas vizinhanças.
                </p>
                <select
                  value={bairroMunicipioId}
                  onChange={(event) => {
                    setBairroMunicipioId(event.target.value);
                    setPrimaryId("");
                    setSecondaryId("");
                    setSearchA("");
                    setSearchB("");
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-500 ${theme.input}`}
                >
                  {bairroMunicipioOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {compareKind === "bairro" && compareItems.length === 0 && !isLoadingBairroItems && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${theme.empty}`}>
                Nenhum bairro disponível para o município selecionado.
              </div>
            )}

            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <MunicipioSelector
                label={compareKind === "bairro" ? "Bairro A" : "Município A"}
                color="cyan"
                selected={selectedA}
                search={searchA}
                filtered={filteredA}
                onSearch={setSearchA}
                onSelect={(m) => { setPrimaryId(m.id); setSearchA(""); }}
                onClear={() => { setPrimaryId(""); setSearchA(""); }}
                isDark={isDark}
              />

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

              <MunicipioSelector
                label={compareKind === "bairro" ? "Bairro B" : "Município B"}
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

            {selectedA && selectedB ? (
              <div className="space-y-4">

                {winner && winner !== "tie" && (
                  <div
                    className={`rounded-xl border px-4 py-3 ${
                      winner === "a"
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
                                        className={`text-sm font-semibold tabular-nums ${
                                          aWins ? "text-cyan-400" : aVal === "—" ? theme.mutedStrong : theme.textSoft
                                        }`}
                                      >
                                        {aVal}
                                        {aWins && (
                                          <span className="ml-1 text-[10px] text-cyan-500"></span>
                                        )}
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
                                        className={`text-sm font-semibold tabular-nums ${
                                          bWins ? "text-purple-400" : bVal === "—" ? theme.mutedStrong : theme.textSoft
                                        }`}
                                      >
                                        {bVal}
                                        {bWins && (
                                          <span className="ml-1 text-[10px] text-purple-500"></span>
                                        )}
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
                        Radar
                      </p>
                      {hasAnyData ? (
                        <RadarChart
                          groups={groups}
                          nameA={selectedA.nome}
                          nameB={selectedB.nome}
                          isDark={isDark}
                        />
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
                            {compareKind === "bairro" ? "Bairro A" : "Município A"}
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
                            {compareKind === "bairro" ? "Bairro B" : "Município B"}
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
                  Selecione dois {compareKind === "bairro" ? "bairros" : "municípios"} para iniciar a comparação
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

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
              className={`mt-0.5 rounded border px-2 py-0.5 text-[10px] transition ${
                isDark
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
              className={`select-enter absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border py-1 shadow-xl ${
                isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
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