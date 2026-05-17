"use client";

import type { ObservatoryLayer } from "@/core/types/territory";

type ObservatorioMapTooltipProps = {
  visible: boolean;
  x: number;
  y: number;
  layer: ObservatoryLayer;
  subtitle?: string;
  title: string;
  selected?: boolean;
};

const LAYER_LABELS: Record<ObservatoryLayer, string> = {
  municipio: "Município",
  bairro: "Vizinhança",
  escola: "Escola",
};

export function ObservatorioMapTooltip({
  visible,
  x,
  y,
  layer,
  subtitle,
  title,
  selected,
}: ObservatorioMapTooltipProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 10 }}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[14rem] rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left shadow-xl ring-1 ring-zinc-900/5 dark:border-zinc-600 dark:bg-zinc-950 dark:ring-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
          {LAYER_LABELS[layer]}
        </p>
        <p className="mt-1 text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] leading-tight text-zinc-700 dark:text-zinc-200">
            {subtitle}
          </p>
        ) : null}
        {selected ? (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
            Selecionado
          </p>
        ) : null}
      </div>
      <div className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950" />
    </div>
  );
}
