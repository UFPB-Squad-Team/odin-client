type OdinLogoPlaceholderProps = {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

export function OdinLogoPlaceholder({
  size = "md",
  showLabel = true,
}: OdinLogoPlaceholderProps) {
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-[9px]"
      : size === "lg"
        ? "h-14 w-14 text-xs"
        : "h-10 w-10 text-[10px]";

  return (
    <div className="inline-flex items-center gap-3">
      <div
        aria-hidden
        className={`grid place-items-center rounded-xl border border-cyan-300/70 bg-cyan-50 font-bold tracking-[0.2em] text-cyan-700 shadow-sm dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300 ${sizeClass}`}
      >
        OD
      </div>
      {showLabel ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
            ODIN
          </p>
          <p className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:block">
            Observatório de Dados do Nordeste
          </p>
        </div>
      ) : null}
    </div>
  );
}
