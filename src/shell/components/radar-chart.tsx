"use client";

import React, { useMemo } from "react";
import type { ObservatorySelection } from "@/core/types/shell";

type RadarChartProps = {
  a?: ObservatorySelection | null;
  b?: ObservatorySelection | null;
  size?: number;
};

function parseMetricValue(v: string | number | undefined) {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const raw = String(v).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export default function RadarChart({ a, b, size = 260 }: RadarChartProps) {
  const metricsA = a?.metrics ?? [];
  const metricsB = b?.metrics ?? [];

  const labels = useMemo(() => {
    const set = new Map<string, { a?: number; b?: number }>();
    metricsA.forEach((m) => set.set(m.label, { ...(set.get(m.label) ?? {}), a: parseMetricValue(m.value) }));
    metricsB.forEach((m) => set.set(m.label, { ...(set.get(m.label) ?? {}), b: parseMetricValue(m.value) }));
    return Array.from(set.entries()).map(([label, vals]) => ({ label, a: vals.a ?? 0, b: vals.b ?? 0 }));
  }, [metricsA, metricsB]);

  if (labels.length === 0) {
    return (
      <div className="flex w-full justify-center items-center" style={{ minHeight: size }}>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Sem métricas disponíveis para comparação</p>
      </div>
    );
  }

  const count = Math.max(3, labels.length);
  const center = size / 2;
  const radius = Math.floor(size * 0.38);
  const angle = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2;

  const maxPerLabel = labels.map((l) => Math.max(l.a, l.b, 1));

  function pointsForNormalized(values: number[]) {
    return values
      .map((v, i) => {
        const denom = maxPerLabel[i] ?? 1;
        const pct = denom <= 0 ? 0 : v / denom;
        const r = pct * radius;
        const x = center + Math.cos(angle(i)) * r;
        const y = center + Math.sin(angle(i)) * r;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }

  const valuesA = labels.map((l) => l.a);
  const valuesB = labels.map((l) => l.b);

  return (
    <div className="flex w-full justify-center relative">
      <div className="absolute left-4 top-2 flex gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-6 rounded bg-cyan-400" />
          <span className="text-zinc-700 dark:text-zinc-300">Primária</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-6 rounded bg-indigo-500" />
          <span className="text-zinc-700 dark:text-zinc-300">Secundária</span>
        </div>
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        {[0.25, 0.5, 0.75, 1].map((t, idx) => (
          <circle key={idx} cx={center} cy={center} r={radius * t} strokeWidth={0.5} fill="none" className="stroke-zinc-200 dark:stroke-zinc-700" />
        ))}

        {Array.from({ length: count }).map((_, i) => (
          <line key={i} x1={center} y1={center} x2={center + Math.cos(angle(i)) * radius} y2={center + Math.sin(angle(i)) * radius} strokeWidth={0.6} className="stroke-zinc-200/80 dark:stroke-zinc-700/80" />
        ))}

        <polygon points={pointsForNormalized(valuesA)} fill="rgba(6,182,212,0.12)" stroke="#06b6d4" strokeWidth={1.5} />
        <polygon points={pointsForNormalized(valuesB)} fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth={1.5} />

        {labels.map((l, i) => {
          const denom = maxPerLabel[i] ?? 1;
          const pa = valuesA[i] ?? 0;
          const pb = valuesB[i] ?? 0;
          const rA = (pa / denom) * radius;
          const rB = (pb / denom) * radius;
          const xa = center + Math.cos(angle(i)) * rA;
          const ya = center + Math.sin(angle(i)) * rA;
          const xb = center + Math.cos(angle(i)) * rB;
          const yb = center + Math.sin(angle(i)) * rB;
          const anchor = Math.abs(Math.cos(angle(i))) < 0.1 ? "middle" : Math.cos(angle(i)) > 0 ? "start" : "end";

          return (
            <g key={l.label}>
              <circle cx={xa} cy={ya} r={3.2} fill="#06b6d4">
                <title>{`${l.label} — Primária: ${pa} (${Math.round((pa / denom) * 100)}%)`}</title>
              </circle>
              <circle cx={xb} cy={yb} r={3.2} fill="#6366f1">
                <title>{`${l.label} — Secundária: ${pb} (${Math.round((pb / denom) * 100)}%)`}</title>
              </circle>

              <text x={xa + Math.sign(Math.cos(angle(i))) * 6} y={ya + Math.sign(Math.sin(angle(i))) * 6} fontSize={10} className="fill-zinc-700 dark:fill-zinc-300">
                {Math.round((pa / denom) * 100)}%
              </text>
              <text x={xb + Math.sign(Math.cos(angle(i))) * 6} y={yb + Math.sign(Math.sin(angle(i))) * 6} fontSize={10} className="fill-zinc-700 dark:fill-zinc-300">
                {Math.round((pb / denom) * 100)}%
              </text>

              <text x={center + Math.cos(angle(i)) * (radius + 18)} y={center + Math.sin(angle(i)) * (radius + 18)} fontSize={11} textAnchor={anchor} className="fill-zinc-700 dark:fill-zinc-300">
                {l.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}