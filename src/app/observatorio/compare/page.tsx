"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useShellContext } from "@/shell/context/shell-context";
import { getModule } from "@/core/registry/module-registry";
import type { MapEntity, ObservatorySelection } from "@/core/types/shell";
import type { Municipio } from "@/core/types/territory";


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
  }>;
};

function extractMunicipioMetrics(
  a: Municipio | null,
  b: Municipio | null,
): MetricGroup[] {
  const pa = (a?.geoProps ?? {}) as Record<string, unknown>;
  const pb = (b?.geoProps ?? {}) as Record<string, unknown>;
  const ea = (pa.educacao ?? {}) as Record<string, unknown>;
  const eb = (pb.educacao ?? {}) as Record<string, unknown>;

  return [
    {
      label: "Rede escolar",
      metrics: [
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
        {
          key: "totalBairros",
          label: "Bairros com escolas",
          a: parseNum(ea.totalBairros),
          b: parseNum(eb.totalBairros),
          format: "int",
          higherIsBetter: true,
        },
      ],
    },
    {
      label: "Qualidade",
      metrics: [
        {
          key: "avgIdeb",
          label: "IDEB médio",
          a: parseNum(pa.avg_ideb),
          b: parseNum(pb.avg_ideb),
          format: "decimal",
          higherIsBetter: true,
        },
      ],
    },
    {
      label: "Infraestrutura",
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
          key: "semAcessibilidade",
          label: "Sem acessibilidade PCD",
          a: parseNum(ea.pctSemAcessibilidade ?? pa.pct_sem_acessibilidade),
          b: parseNum(eb.pctSemAcessibilidade ?? pb.pct_sem_acessibilidade),
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
}: {
  groups: MetricGroup[];
  nameA: string;
  nameB: string;
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
            className="stroke-zinc-700/40"
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
            className="stroke-zinc-700/30"
            strokeWidth={0.5}
          />
        ))}
        <polygon
          points={pointsFor(valuesA)}
          fill="rgba(6,182,212,0.15)"
          stroke="#06b6d4"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polygon
          points={pointsFor(valuesB)}
          fill="rgba(168,85,247,0.15)"
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
              className="fill-zinc-400"
            >
              {shortLabel}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-cyan-400" />
          <span className="text-zinc-400 truncate max-w-[100px]">{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-purple-500" />
          <span className="text-zinc-400 truncate max-w-[100px]">{nameB}</span>
        </div>
      </div>
    </div>
  );
}


function CompareBar({
  a,
  b,
  higherIsBetter,
}: {
  a: number;
  b: number;
  higherIsBetter: boolean;
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
        className={`transition-all ${aWins && a !== b ? "bg-cyan-400" : "bg-zinc-600"}`}
      />
      <div
        style={{ width: `${pctB}%` }}
        className={`transition-all ${bWins && a !== b ? "bg-purple-500" : "bg-zinc-600"}`}
      />
    </div>
  );
}


export default function ComparePage() {
  const ctx = useShellContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const didPreselect = useRef(false);

  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  const activeModuleId = ctx.activeModuleId ?? null;

  const municipios = useMemo(
    () => (ctx.municipios ?? []) as Municipio[],
    [ctx.municipios],
  );

  const municipioA = useMemo(
    () => municipios.find((m) => m.id === primaryId) ?? null,
    [municipios, primaryId],
  );
  const municipioB = useMemo(
    () => municipios.find((m) => m.id === secondaryId) ?? null,
    [municipios, secondaryId],
  );

  const selectionA = useMemo<ObservatorySelection | null>(() => {
    if (!municipioA) return null;
    const entity: MapEntity = { kind: "municipio", data: municipioA };
    const mod = activeModuleId ? getModule(activeModuleId) : undefined;
    if (mod?.buildSelection) {
      try { return mod.buildSelection(entity); } catch { /* fallback */ }
    }
    return { id: municipioA.id, nome: municipioA.nome, kind: "municipio", subtitle: "Município" };
  }, [municipioA, activeModuleId]);

  const selectionB = useMemo<ObservatorySelection | null>(() => {
    if (!municipioB) return null;
    const entity: MapEntity = { kind: "municipio", data: municipioB };
    const mod = activeModuleId ? getModule(activeModuleId) : undefined;
    if (mod?.buildSelection) {
      try { return mod.buildSelection(entity); } catch { }
    }
    return { id: municipioB.id, nome: municipioB.nome, kind: "municipio", subtitle: "Município" };
  }, [municipioB, activeModuleId]);

  const groups = useMemo(
    () => extractMunicipioMetrics(municipioA, municipioB),
    [municipioA, municipioB],
  );

  const hasAnyData = useMemo(
    () => groups.some((g) => g.metrics.some((m) => m.a > 0 || m.b > 0)),
    [groups],
  );

  useEffect(() => {
    if (didPreselect.current || municipios.length === 0) return;
    const pk = searchParams.get("primaryKind");
    const pid = searchParams.get("primaryId");
    const sk = searchParams.get("secondaryKind");
    const sid = searchParams.get("secondaryId");
    if (pk === "municipio" && pid) setPrimaryId(pid);
    if (sk === "municipio" && sid) setSecondaryId(sid);
    if ((pk && pid) || (sk && sid)) didPreselect.current = true;
  }, [municipios, searchParams]);

  const filteredA = useMemo(() => {
    const q = searchA.trim().toLowerCase();
    if (!q) return municipios.slice(0, 8);
    return municipios.filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 12);
  }, [municipios, searchA]);

  const filteredB = useMemo(() => {
    const q = searchB.trim().toLowerCase();
    if (!q) return municipios.slice(0, 8);
    return municipios.filter((m) => m.nome.toLowerCase().includes(q) && m.id !== primaryId).slice(0, 12);
  }, [municipios, searchB, primaryId]);

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
    if (!municipioA || !municipioB) return null;
    let scoreA = 0;
    let scoreB = 0;
    groups.forEach((g) =>
      g.metrics.forEach((m) => {
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
  }, [groups, municipioA, municipioB]);

  const isLoading = municipios.length === 0;

  return (
    <main
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(135deg, #09090b 0%, #0f0f14 50%, #09090b 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .metric-row:hover { background: rgba(255,255,255,0.03); }
        .select-enter { animation: fadeUp 0.15s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .winner-glow-a { box-shadow: 0 0 0 1px rgba(6,182,212,0.4), 0 4px 24px rgba(6,182,212,0.12); }
        .winner-glow-b { box-shadow: 0 0 0 1px rgba(168,85,247,0.4), 0 4px 24px rgba(168,85,247,0.12); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-8">

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500">
              ODIN · Observatório
            </p>
            <h1
              className="mt-1 text-2xl font-bold text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Comparar municípios
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Análise lado a lado de indicadores educacionais
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
            >
              Limpar
            </button>
            <Link
              href="/observatorio"
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800"
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
            <span className="text-sm text-zinc-500">Carregando municípios…</span>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <MunicipioSelector
                label="Município A"
                color="cyan"
                selected={municipioA}
                search={searchA}
                filtered={filteredA}
                onSearch={setSearchA}
                onSelect={(m) => { setPrimaryId(m.id); setSearchA(""); }}
                onClear={() => { setPrimaryId(""); setSearchA(""); }}
              />

              <div className="flex flex-col items-center justify-center pt-7 gap-2">
                <button
                  type="button"
                  onClick={swap}
                  disabled={!primaryId || !secondaryId}
                  title="Trocar"
                  className="rounded-full border border-zinc-700 p-2 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <span className="text-[10px] text-zinc-600 tracking-wider">VS</span>
              </div>

              <MunicipioSelector
                label="Município B"
                color="purple"
                selected={municipioB}
                search={searchB}
                filtered={filteredB}
                onSearch={setSearchB}
                onSelect={(m) => { setSecondaryId(m.id); setSearchB(""); }}
                onClear={() => { setSecondaryId(""); setSearchB(""); }}
              />
            </div>

            {municipioA && municipioB ? (
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
                        {winner === "a" ? municipioA.nome : municipioB.nome}
                      </span>{" "}
                      se destaca na maioria dos indicadores disponíveis.
                    </p>
                  </div>
                )}

                {!hasAnyData && (
                  <div className="rounded-xl border border-zinc-800 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-500">
                      Dados agregados ainda não disponíveis para estes municípios.
                      Os indicadores são preenchidos conforme o Censo Escolar.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div
                        key={group.label}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                      >
                        <div className="border-b border-zinc-800 px-4 py-2.5">
                          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                            {group.label}
                          </h3>
                        </div>
                        <div>
                          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                            <span>Indicador</span>
                            <span className="text-right text-cyan-600">{municipioA.nome.split(" ")[0]}</span>
                            <span className="text-right text-purple-600">{municipioB.nome.split(" ")[0]}</span>
                          </div>

                          {group.metrics.map((m) => {
                            const aVal = formatMetricValue(m.a, m.format);
                            const bVal = formatMetricValue(m.b, m.format);
                            const aWins = m.a > 0 && m.b > 0 && (m.higherIsBetter ? m.a > m.b : m.a < m.b);
                            const bWins = m.a > 0 && m.b > 0 && (m.higherIsBetter ? m.b > m.a : m.b < m.a);
                            const noData = m.a === 0 && m.b === 0;

                            return (
                              <div
                                key={m.key}
                                className="metric-row grid grid-cols-[1fr_1fr_1fr] items-center gap-4 border-t border-zinc-800/60 px-4 py-3 transition-colors"
                              >
                                <span className="text-sm text-zinc-400">{m.label}</span>

                                <div className="text-right">
                                  {noData ? (
                                    <span className="text-sm text-zinc-700">—</span>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-sm font-semibold tabular-nums ${
                                          aWins ? "text-cyan-400" : aVal === "—" ? "text-zinc-700" : "text-zinc-300"
                                        }`}
                                      >
                                        {aVal}
                                        {aWins && (
                                          <span className="ml-1 text-[10px] text-cyan-500">↑</span>
                                        )}
                                      </span>
                                      {m.a > 0 && m.b > 0 && (
                                        <CompareBar a={m.a} b={m.b} higherIsBetter={m.higherIsBetter} />
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right">
                                  {noData ? (
                                    <span className="text-sm text-zinc-700">—</span>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-sm font-semibold tabular-nums ${
                                          bWins ? "text-purple-400" : bVal === "—" ? "text-zinc-700" : "text-zinc-300"
                                        }`}
                                      >
                                        {bVal}
                                        {bWins && (
                                          <span className="ml-1 text-[10px] text-purple-500">↑</span>
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
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Radar
                      </p>
                      {hasAnyData ? (
                        <RadarChart
                          groups={groups}
                          nameA={municipioA.nome}
                          nameB={municipioB.nome}
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center">
                          <p className="text-xs text-zinc-600">Sem dados</p>
                        </div>
                      )}
                    </div>

                    {hasAnyData && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                          Placar
                        </p>
                        <ScoreCard
                          groups={groups}
                          nameA={municipioA.nome}
                          nameB={municipioB.nome}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {municipioA && (
                        <div
                          className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 ${winner === "a" ? "winner-glow-a" : ""}`}
                        >
                          <p className="text-[10px] text-zinc-500">Município A</p>
                          <p className="mt-0.5 text-sm font-medium text-white">{municipioA.nome}</p>
                          {selectionA?.metrics?.map((m) => (
                            <div key={m.label} className="mt-1 flex justify-between text-xs">
                              <span className="text-zinc-500">{m.label}</span>
                              <span className="font-medium text-zinc-300">{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {municipioB && (
                        <div
                          className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 ${winner === "b" ? "winner-glow-b" : ""}`}
                        >
                          <p className="text-[10px] text-zinc-500">Município B</p>
                          <p className="mt-0.5 text-sm font-medium text-white">{municipioB.nome}</p>
                          {selectionB?.metrics?.map((m) => (
                            <div key={m.label} className="mt-1 flex justify-between text-xs">
                              <span className="text-zinc-500">{m.label}</span>
                              <span className="font-medium text-zinc-300">{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                <p className="text-sm text-zinc-600">
                  Selecione dois municípios para iniciar a comparação
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ─── ScoreCard ───────────────────────────────────────────────────────────────

function ScoreCard({
  groups,
  nameA,
  nameB,
}: {
  groups: MetricGroup[];
  nameA: string;
  nameB: string;
}) {
  let scoreA = 0;
  let scoreB = 0;
  let ties = 0;

  groups.forEach((g) =>
    g.metrics.forEach((m) => {
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
        <span className="text-zinc-600 text-[10px]">{ties > 0 ? `${ties} empate${ties > 1 ? "s" : ""}` : ""}</span>
        <span className="text-purple-400 font-semibold">{nameB.split(" ")[0]}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
        <div style={{ width: `${pctA}%` }} className="bg-cyan-500 transition-all" />
        <div style={{ width: `${pctB}%` }} className="bg-purple-500 transition-all" />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
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
}: {
  label: string;
  color: "cyan" | "purple";
  selected: Municipio | null;
  search: string;
  filtered: Municipio[];
  onSearch: (q: string) => void;
  onSelect: (m: Municipio) => void;
  onClear: () => void;
}) {
  const accent = color === "cyan" ? "text-cyan-400" : "text-purple-400";
  const border = color === "cyan" ? "border-cyan-500/40" : "border-purple-500/40";
  const ring = color === "cyan" ? "focus:ring-cyan-500/30" : "focus:ring-purple-500/30";
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] ${accent}`}>
        {label}
      </p>
      {selected ? (
        <div className={`rounded-xl border ${border} bg-zinc-900/60 p-3`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{selected.nome}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{selected.estadoId?.toUpperCase()}</p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="mt-0.5 rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition"
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
            placeholder="Buscar município…"
            className={`w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-0 transition focus:border-zinc-600 focus:ring-1 ${ring}`}
          />
          {filtered.length > 0 && (
            <ul className="select-enter absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={() => onSelect(m)}
                    className="w-full px-3 py-2 text-left transition hover:bg-zinc-800"
                  >
                    <div className="text-sm text-zinc-200">{m.nome}</div>
                    <div className="text-[10px] text-zinc-600">{m.estadoId?.toUpperCase()}</div>
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