"use client";

import type { DetailMetric } from "@/core/types/module";
import { IndicatorTooltip } from "@/components/ui/indicator-tooltip";

type DetailMetricCardProps = {
  metric: DetailMetric;
  colorAccent: string;
};

export function DetailMetricCard({ metric, colorAccent }: DetailMetricCardProps) {
  return (
    <div
      className="rounded-lg border border-border/50 px-3 py-2.5 bg-muted/30"
      style={{ borderLeftWidth: 2, borderLeftColor: colorAccent }}
    >
      {metric.description ? (
        <IndicatorTooltip description={metric.description}>
          <p className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help mb-0.5">
            {metric.label}
          </p>
        </IndicatorTooltip>
      ) : (
        <p className="text-[11px] text-muted-foreground mb-0.5">{metric.label}</p>
      )}
      <p
        className="text-xl font-bold tabular-nums leading-none"
        style={{ color: colorAccent }}
      >
        {metric.value}
      </p>
    </div>
  );
}
