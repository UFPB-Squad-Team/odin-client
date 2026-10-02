"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MapLoadingIndicatorProps = {
  /** Controla a visibilidade com fade suave (transition-opacity). */
  visible: boolean;
  /** "bar" = faixa superior fina · "pill" = badge flutuante. */
  variant?: "bar" | "pill";
  /** Texto acessível (pill) / sr-only (barra). */
  label?: string;
  /** Posição do pill — "top-center" evita o MapIndicatorPicker (top-right). */
  align?: "top-center" | "bottom-center";
  className?: string;
};

/**
 * Feedback de carregamento NÃO bloqueante para o canvas MapLibre.
 *
 * - `pointer-events-none`: pan/zoom/click atravessam o overlay.
 * - `z-30`: acima do canvas, sem competir com os painéis interativos (z-20) e
 *   com o card de entidades (z-30 no canto inferior esquerdo).
 * - `transition-opacity duration-300`: entra/sai sem "piscar".
 * - `motion-reduce:*`: respeita `prefers-reduced-motion`.
 */
export function MapLoadingIndicator({
  visible,
  variant = "bar",
  label = "Carregando dados...",
  align = "top-center",
  className,
}: MapLoadingIndicatorProps) {
  if (variant === "bar") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy={visible}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-30 h-1 overflow-hidden",
          "transition-opacity duration-300 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
          className,
        )}
      >
        {/* trilha (cyan a 20% — token de destaque real do ODIN) */}
        <div className="h-full w-full bg-cyan-500/20" />
        {/* preenchimento animado indeterminado */}
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 shadow-[0_0_10px_rgba(6,182,212,0.65)] animate-odin-map-progress motion-reduce:animate-none" />
        <span className="sr-only">{visible ? label : ""}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={visible}
      className={cn(
        "pointer-events-none absolute z-30 flex items-center gap-2 rounded-full",
        "border border-zinc-300/60 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm",
        "backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-200",
        "transition-opacity duration-300 motion-reduce:transition-none",
        align === "top-center"
          ? "left-1/2 top-3 -translate-x-1/2"
          : "left-1/2 bottom-3 -translate-x-1/2",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-500 motion-reduce:animate-none" />
      <span>{label}</span>
    </div>
  );
}