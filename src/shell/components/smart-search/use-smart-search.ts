"use client";

import { useCallback, useRef, useState } from "react";
import { fetchUniversalSearch, type SearchResultItem } from "@/shell/services/universal-search";

const DEBOUNCE_MS = 300;

type UseSmartSearchParams = {
  sgUf?: string | null;
  municipioId?: string | null;
};

export function useSmartSearch({ sgUf, municipioId }: UseSmartSearchParams) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (text: string) => {
      setQuery(text);

      if (text.trim().length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      // Debounce
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();

      timerRef.current = setTimeout(async () => {
        setLoading(true);
        setOpen(true);

        try {
          const response = await fetchUniversalSearch({
            query: text,
            sgUf,
            municipioId,
            limit: 8,
          });
          setResults(response.results);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [sgUf, municipioId],
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setOpen(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return { query, results, loading, open, search, clear, close };
}
