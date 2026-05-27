"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { SearchResultItem } from "@/shell/services/universal-search";
import { useSmartSearch } from "./use-smart-search";
import { SearchResultItemRow } from "./search-result-item";

type SmartSearchInputProps = {
  sgUf?: string | null;
  municipioId?: string | null;
  onSelect: (item: SearchResultItem) => void;
  placeholder?: string;
};

export function SmartSearchInput({
  sgUf,
  municipioId,
  onSelect,
  placeholder = "Buscar escola, rua, CEP, bairro...",
}: SmartSearchInputProps) {
  const { query, results, loading, open, search, clear, close } = useSmartSearch({
    sgUf,
    municipioId,
  });
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  function handleSelect(item: SearchResultItem) {
    onSelect(item);
    clear();
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-3 py-2 transition-colors focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/20">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 text-cyan-500 animate-spin shrink-0" />
        ) : (
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <input
          ref={inputRef}
          id="observatorio-smart-search"
          type="text"
          value={query}
          onChange={(e) => {
            search(e.target.value);
            setHighlightIndex(-1);
          }}
          onFocus={() => {
            if (results.length > 0) close(); // reopen handled by search
            if (query.length >= 2) search(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-md p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border/60 bg-background/98 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-[11px] text-muted-foreground text-center">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-1">
              {results.map((item, index) => (
                <SearchResultItemRow
                  key={item.id}
                  label={item.label}
                  subtitle={item.subtitle}
                  kind={item.kind}
                  isHighlighted={index === highlightIndex}
                  onClick={() => handleSelect(item)}
                />
              ))}
            </div>
          )}
          <div className="border-t border-border/30 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">
              ↑↓ navegar · Enter selecionar · Esc fechar
            </span>
            <span className="text-[9px] text-muted-foreground">
              {results.length} resultado{results.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
