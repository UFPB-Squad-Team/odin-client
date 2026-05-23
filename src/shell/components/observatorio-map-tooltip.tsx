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
  accent?: string;
  indicatorLabel?: string;
  detail?: string;
  value?: string;
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
  accent,
  indicatorLabel,
  detail,
  value,
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
      <div
        className="max-w-[16rem] overflow-hidden rounded-2xl border bg-white/95 text-left shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-950/95 dark:ring-white/10"
        style={{ borderColor: accent ?? undefined }}
      >
        <div
          className="h-1 w-full"
          style={{ background: accent ?? "linear-gradient(90deg, #06b6d4, #a78bfa)" }}
        />
        <div className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                {LAYER_LABELS[layer]}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </p>
            </div>
            {value ? (
              <div className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {value}
              </div>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[12px] font-medium leading-tight text-zinc-700 dark:text-zinc-200">
              {subtitle}
            </p>
          ) : null}
          {indicatorLabel ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-950/30 dark:text-cyan-200">
              Indicador ativo: {indicatorLabel}
            </div>
          ) : null}
          {value ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/70">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Valor
              </span>
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                {value}
              </span>
            </div>
          ) : null}
          {detail ? (
            <p className="mt-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] leading-snug text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200">
              {detail}
            </p>
          ) : null}
          {selected ? (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
              Selecionado
            </p>
          ) : null}
        </div>
      </div>
      <div className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-inherit bg-inherit" />
    </div>
  );
}
