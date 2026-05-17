"use client";

type DimensionDividerProps = {
  label: string;
  colorAccent: string;
};

export function DimensionDivider({ label, colorAccent }: DimensionDividerProps) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div
        className="h-px flex-1 bg-gradient-to-r from-transparent"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${colorAccent}40)` }}
      />
      <span
        className="text-[10px] font-bold uppercase tracking-widest opacity-70"
        style={{ color: colorAccent }}
      >
        {label}
      </span>
      <div
        className="h-px flex-1 bg-gradient-to-l from-transparent"
        style={{ backgroundImage: `linear-gradient(to left, transparent, ${colorAccent}40)` }}
      />
    </div>
  );
}
