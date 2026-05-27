"use client";

import { MapPin, School, Building2, Hash, Map } from "lucide-react";
import type { SearchResultKind } from "@/shell/services/universal-search";

const KIND_CONFIG: Record<SearchResultKind, { icon: typeof MapPin; color: string }> = {
  escola: { icon: School, color: "text-cyan-500" },
  logradouro: { icon: MapPin, color: "text-amber-500" },
  cep: { icon: Hash, color: "text-emerald-500" },
  municipio: { icon: Map, color: "text-violet-500" },
  bairro: { icon: Building2, color: "text-rose-400" },
};

type SearchResultItemProps = {
  label: string;
  subtitle: string;
  kind: SearchResultKind;
  isHighlighted: boolean;
  onClick: () => void;
};

export function SearchResultItemRow({
  label,
  subtitle,
  kind,
  isHighlighted,
  onClick,
}: SearchResultItemProps) {
  const config = KIND_CONFIG[kind] ?? KIND_CONFIG.escola;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors ${
        isHighlighted
          ? "bg-cyan-500/10 dark:bg-cyan-500/15"
          : "hover:bg-muted/50"
      }`}
    >
      <div className={`shrink-0 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 shrink-0">
        {kind}
      </span>
    </button>
  );
}
