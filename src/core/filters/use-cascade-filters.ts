"use client";

import { useCallback, useMemo, useState } from "react";
import type { TerritoryFilters } from "@/core/types/territory";

const INITIAL_FILTERS: TerritoryFilters = {
  activeLayer: "bairro",
  estadoId: null,
  municipioId: null,
  bairroId: null,
};

export function useCascadeFilters() {
  const [filters, setFilters] = useState<TerritoryFilters>(INITIAL_FILTERS);

  const setEstado = useCallback((estadoId: string | null) => {
    setFilters((prev) => ({ ...prev, estadoId, municipioId: null, bairroId: null }));
  }, []);

  const setMunicipio = useCallback((municipioId: string | null) => {
    setFilters((prev) => ({ ...prev, municipioId, bairroId: null }));
  }, []);

  const setBairro = useCallback((bairroId: string | null) => {
    setFilters((prev) => ({ ...prev, bairroId }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return useMemo(
    () => ({
      ...filters,
      setEstado,
      setMunicipio,
      setBairro,
      resetFilters,
    }),
    [filters, resetFilters, setBairro, setEstado, setMunicipio],
  );
}
