"use client";

import { useCallback, useMemo, useState } from "react";

type CascadeFilters = {
  estadoId: string | null;
  municipioId: string | null;
  bairroId: string | null;
};

const INITIAL_FILTERS: CascadeFilters = {
  estadoId: null,
  municipioId: null,
  bairroId: null,
};

export function useCascadeFilters() {
  const [filters, setFilters] = useState<CascadeFilters>(INITIAL_FILTERS);

  const setEstado = useCallback((estadoId: string | null) => {
    setFilters({ estadoId, municipioId: null, bairroId: null });
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
