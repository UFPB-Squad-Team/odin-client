"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  id: string;
  label: string;
};

type SearchableComboboxProps = {
  ariaLabel: string;
  disabled?: boolean;
  emptyMessage?: string;
  label: string;
  onSelect: (id: string | null) => void;
  options: Option[];
  placeholder?: string;
  value: string | null;
  isLoading?: boolean;
};

export function SearchableCombobox({
  ariaLabel,
  disabled,
  emptyMessage = "Nenhum resultado",
  label,
  onSelect,
  options,
  placeholder = "Digite para buscar",
  value,
  isLoading = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 30);

    return options
      .filter((option) => option.label.toLowerCase().includes(normalized))
      .slice(0, 30);
  }, [options, query]);

  return (
    <label className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
      {label}

      <div ref={wrapperRef} className="relative mt-1.5">
        <input
          aria-label={ariaLabel}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value.trim()) {
              onSelect(null);
            }
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-16 text-sm normal-case text-zinc-900 outline-none ring-cyan-500/60 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />

        <div className="absolute inset-y-0 right-1 flex items-center gap-1">
          {isLoading ? (
            <div className="px-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : value ? (
            <button
              type="button"
              aria-label={`Limpar seleção de ${label.toLowerCase()}`}
              onClick={() => {
                onSelect(null);
                setQuery("");
                setOpen(false);
              }}
              className="rounded p-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          ) : null}

          <button
            type="button"
            aria-label={`Abrir opções de ${label.toLowerCase()}`}
            disabled={disabled || isLoading}
            onClick={() => setOpen((prev) => !prev)}
            className="rounded p-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ▾
          </button>
        </div>

        {open ? (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-zinc-300 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-xs normal-case text-zinc-500 dark:text-zinc-400">
                {emptyMessage}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(option.id);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                  className={`w-full rounded px-2 py-2 text-left text-sm normal-case transition ${
                    value === option.id
                      ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}
