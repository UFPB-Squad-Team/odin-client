import Image from "next/image";

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
      ? "h-9 w-9"
      : size === "lg"
        ? "h-14 w-14"
        : "h-10 w-10";

  return (
    <div className="inline-flex items-center gap-3">
      <Image
        src="/odin-logo.png"
        alt=""
        aria-hidden
        width={112}
        height={112}
        className={`shrink-0 object-contain ${sizeClass}`}
      />
      {showLabel ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
            ODIN
          </p>
          <p className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:block">
            Observatório de Dados Integrados do Nordeste
          </p>
        </div>
      ) : null}
    </div>
  );
}
