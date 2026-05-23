"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GraduationCap, Home, Sparkles } from "lucide-react";

export type InterestProfileId = "family" | "researcher";

export type InterestProfileOption = {
  id: InterestProfileId;
  label: string;
  description: string;
  summary: string;
  changes: string[];
  icon: typeof Home;
  accentClassName: string;
  activeClassName: string;
};

export const INTEREST_PROFILE_OPTIONS: InterestProfileOption[] = [
  {
    id: "family",
    label: "Morador / Mãe / Pai",
    description: "Leitura cotidiana do território com foco em escola e bairro.",
    summary: "Ativa educação no bairro com leitura simplificada.",
    changes: ["Camada: Bairro", "Indicador inicial: Internet para alunos", "Layout: Simplificado"],
    icon: Home,
    accentClassName: "border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100",
    activeClassName: "border-cyan-500/40 bg-cyan-500/15 text-cyan-900 dark:text-cyan-100",
  },
  {
    id: "researcher",
    label: "Pesquisador",
    description: "Leitura analítica com foco em carências e nuances do território.",
    summary: "Ativa socioeconômico no município com leitura analítica.",
    changes: ["Camada: Município", "Indicador inicial: Água inadequada", "Layout: Analítico"],
    icon: GraduationCap,
    accentClassName: "border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-100",
    activeClassName: "border-violet-500/40 bg-violet-500/15 text-violet-900 dark:text-violet-100",
  },
];

type InterestProfileSelectorProps = {
  value: InterestProfileId | null;
  onSelect: (profileId: InterestProfileId) => void;
  onReset: () => void;
};

export function InterestProfileSelector({ value, onSelect, onReset }: InterestProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!open) return;
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const currentProfile = useMemo(
    () => INTEREST_PROFILE_OPTIONS.find((option) => option.id === value) ?? null,
    [value],
  );

  if (!currentProfile) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2 px-0.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
          Modo padrão
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {INTEREST_PROFILE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10.5px] font-semibold transition hover:scale-[1.01] ${option.accentClassName}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const CurrentIcon = currentProfile.icon;

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10.5px] font-semibold shadow-sm transition hover:shadow-md ${currentProfile.activeClassName}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <CurrentIcon className="h-3.5 w-3.5" />
          <span>{currentProfile.label}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onReset();
          }}
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Voltar ao Modo Padrão
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Trocar perfil
          </p>
          <div className="flex flex-col gap-1">
            {INTEREST_PROFILE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = option.id === currentProfile.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSelect(option.id);
                  }}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition ${active ? option.activeClassName : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"}`}
                >
                  <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${active ? "border-current/20 bg-white/40" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold leading-tight">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReset();
              }}
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Voltar ao Modo Padrão
            </button>
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-2 text-[10.5px] leading-snug text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">{currentProfile.summary}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {currentProfile.changes.map((change) => (
                  <span key={change} className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {change}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}