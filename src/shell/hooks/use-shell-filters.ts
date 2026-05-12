"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCascadeFilters } from "@/core/filters/use-cascade-filters";
import { fetchAllSchools } from "@/core/geospatial/geospatial-api";
import {
  JOAO_PESSOA_IBGE_ID,
  listBairros,
  listEstados,
  listMunicipios,
} from "@/core/territory/territory-api";
import {
  MOCK_BAIRROS,
  MOCK_ENDERECOS,
  MOCK_ESCOLAS,
  MOCK_ESTADOS,
  MOCK_MUNICIPIOS,
} from "./territory-mock-data";
import type { Bairro, Escola, Estado, Municipio } from "@/core/types/territory";
import type { SearchSuggestion } from "@/core/types/shell";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function withFallback<T>(
  request: () => Promise<T[]>,
  fallback: T[],
): Promise<T[]> {
  try {
    const data = await request();
    return data.length > 0 ? data : fallback;
  } catch {
    return fallback;
  }
}

type InitialState = {
  estadoId?: string | null;
  municipioId?: string | null;
  bairroId?: string | null;
};

export function useShellFilters(initialState?: InitialState) {
  const filters = useCascadeFilters();
  const { estadoId, municipioId, bairroId, setEstado, setMunicipio, setBairro } = filters;

  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);

  const [loading, setLoading] = useState({
    estados: false,
    municipios: false,
    bairros: false,
    escolas: false,
  });

  const pendingPathRef = useRef<{ municipioId?: string; bairroId?: string } | null>(null);
  const bootstrapRef = useRef({ estado: true, municipio: true, bairro: true });

  // Aplicar estado inicial da persistência (URL/localStorage)
  useEffect(() => {
    if (initialState?.estadoId && !estadoId) {
      bootstrapRef.current = { estado: false, municipio: false, bairro: false };
      pendingPathRef.current = {
        municipioId: initialState.municipioId ?? undefined,
        bairroId: initialState.bairroId ?? undefined,
      };
      setEstado(initialState.estadoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadEstados() {
      setLoading((prev) => ({ ...prev, estados: true }));
      const data = await withFallback(listEstados, MOCK_ESTADOS);
      if (alive) {
        setEstados(data);
        if (bootstrapRef.current.estado && !estadoId && data[0]) {
          setEstado(data[0].id);
          bootstrapRef.current.estado = false;
        }
      }
      setLoading((prev) => ({ ...prev, estados: false }));
    }
    loadEstados();
    return () => { alive = false; };
  }, [estadoId, setEstado]);

  useEffect(() => {
    let alive = true;
    async function loadMunicipios() {
      if (!estadoId) { setMunicipios([]); return; }
      setLoading((prev) => ({ ...prev, municipios: true }));
      const fallback = MOCK_MUNICIPIOS.filter((m) => m.estadoId === estadoId);
      const data = await withFallback(() => listMunicipios(estadoId), fallback);
      const sortedData = [...data].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true }),
      );
      if (alive) {
        setMunicipios(sortedData);
        if (pendingPathRef.current?.municipioId) {
          const target = sortedData.find((m) => m.id === pendingPathRef.current?.municipioId);
          if (target) setMunicipio(target.id);
          pendingPathRef.current = { ...pendingPathRef.current, municipioId: undefined };
        } else if (bootstrapRef.current.municipio && !municipioId && sortedData[0]) {
          const defaultMunicipio = sortedData.find((m) => m.id === JOAO_PESSOA_IBGE_ID) ?? sortedData[0];
          setMunicipio(defaultMunicipio.id);
          bootstrapRef.current.municipio = false;
        }
      }
      setLoading((prev) => ({ ...prev, municipios: false }));
    }
    loadMunicipios();
    return () => { alive = false; };
  }, [estadoId, setMunicipio]);

  useEffect(() => {
    let alive = true;
    async function loadBairros() {
      if (!municipioId) { setBairros([]); return; }
      setLoading((prev) => ({ ...prev, bairros: true }));
      const fallback = MOCK_BAIRROS.filter((b) => b.municipioId === municipioId);
      const data = await withFallback(() => listBairros(municipioId), fallback);
      if (alive) {
        setBairros(data);
        if (pendingPathRef.current?.bairroId) {
          const target = data.find((b) => b.id === pendingPathRef.current?.bairroId);
          if (target) setBairro(target.id);
          pendingPathRef.current = null;
        } else if (bootstrapRef.current.bairro && !bairroId && data[0]) {
          setBairro(data[0].id);
          bootstrapRef.current.bairro = false;
        }
      }
      setLoading((prev) => ({ ...prev, bairros: false }));
    }
    loadBairros();
    return () => { alive = false; };
  }, [municipioId, setBairro]);

  useEffect(() => {
    let alive = true;
    async function loadEscolas() {
      if (!municipioId) { setEscolas([]); return; }
      setLoading((prev) => ({ ...prev, escolas: true }));
      const fallback = MOCK_ESCOLAS.filter((item) =>
        MOCK_BAIRROS.some(
          (bairro) => bairro.id === item.bairroId && bairro.municipioId === municipioId,
        ),
      );

      const geojson = await fetchAllSchools(municipioId);

      const data = geojson?.features?.length
        ? geojson.features
            .map((feature) => {
              const props = feature.properties as Record<string, unknown>;
              const rawId = String(
                props.escola_id_inep ?? props.id ?? feature.id ?? "",
              ).replace(/\.0$/, "");
              const nome = String(
                props.escola_nome ?? props.nome ?? props.name ?? rawId,
              );
              const bairroNome = String(props.bairro ?? props.bairro_nome ?? "").trim();
              const bairroMatch = MOCK_BAIRROS.find((bairro) => bairro.nome === bairroNome);

              return {
                id: rawId,
                inepId: String(
                  props.escola_id_inep ?? props.school_id_inep ?? rawId,
                ).replace(/\.0$/, ""),
                nome,
                bairroId: bairroMatch?.id ?? slugify(bairroNome || rawId),
                bairroNome: bairroNome || undefined,
                municipioId,
                municipioNome:
                  String(props.municipio_nome ?? props.municipio ?? "").trim() || undefined,
                estadoSigla:
                  String(props.estado_sigla ?? props.uf ?? estadoId ?? "").trim() || undefined,
                ideb: toNumber(props.ideb),
                inse: toNumber(props.inse),
              } satisfies Escola;
            })
            .filter((item) => item.id && item.nome)
        : fallback;

      if (alive) setEscolas(data);
      setLoading((prev) => ({ ...prev, escolas: false }));
    }
    loadEscolas();
    return () => { alive = false; };
  }, [estadoId, municipioId]);

  const searchCatalog = useMemo<SearchSuggestion[]>(() => {
    const municipioLookup = new Map(municipios.map((m) => [m.id, m.nome]));
    const bairroLookup = new Map(bairros.map((b) => [b.id, b.nome]));
    const estadoLookup = new Map(estados.map((e) => [e.id, e.nome]));

    const byBairro = bairros.map((b) => ({
      id: `bairro-${b.id}`, kind: "bairro" as const,
      label: b.nome, subtitle: `Bairro · ${municipioLookup.get(b.municipioId) ?? ""}`,
      bairroId: b.id, municipioId: b.municipioId, estadoId: estadoId ?? undefined,
      keywords: `${b.nome} ${municipioLookup.get(b.municipioId) ?? ""}`,
    }));

    const byEscola = escolas.map((e) => ({
      id: `escola-${e.id}`, kind: "escola" as const,
      label: e.nome,
      subtitle: `Escola · ${e.bairroNome ?? bairroLookup.get(e.bairroId) ?? e.municipioNome ?? ""}`,
      escolaId: e.id, bairroId: e.bairroId, municipioId: municipioId ?? undefined,
      estadoId: estadoId ?? undefined,
      keywords: `${e.nome} ${e.bairroNome ?? bairroLookup.get(e.bairroId) ?? ""} ${e.municipioNome ?? municipioLookup.get(municipioId ?? "") ?? ""}`,
    }));

    const byEndereco = MOCK_ENDERECOS.map((a) => ({
      id: `endereco-${a.id}`, kind: "endereco" as const,
      label: a.logradouro, subtitle: `Rua · ${bairroLookup.get(a.bairroId) ?? a.bairroId}`,
      bairroId: a.bairroId, municipioId: a.municipioId, estadoId: a.estadoId,
      keywords: `${a.logradouro} ${bairroLookup.get(a.bairroId) ?? ""} ${municipioLookup.get(a.municipioId) ?? ""} ${estadoLookup.get(a.estadoId) ?? ""}`,
    }));

    return [...byBairro, ...byEscola, ...byEndereco];
  }, [bairros, escolas, estadoId, estados, municipioId, municipios]);

  const fuse = useMemo(
    () => new Fuse(searchCatalog, { ignoreLocation: true, keys: ["label", "subtitle", "keywords"], threshold: 0.35 }),
    [searchCatalog],
  );

  function searchSuggestions(query: string): SearchSuggestion[] {
    const normalized = query.trim();
    if (!normalized) return searchCatalog.slice(0, 8);
    return fuse.search(normalized).slice(0, 8).map((r) => r.item);
  }

  function applySuggestion(suggestion: SearchSuggestion) {
    pendingPathRef.current = { bairroId: suggestion.bairroId, municipioId: suggestion.municipioId };
    if (suggestion.estadoId && suggestion.estadoId !== estadoId) { setEstado(suggestion.estadoId); return; }
    if (suggestion.municipioId && suggestion.municipioId !== municipioId) { setMunicipio(suggestion.municipioId); return; }
    if (suggestion.bairroId && suggestion.bairroId !== bairroId) { setBairro(suggestion.bairroId); return; }
  }

  function applyFilterPath(path: { estadoId?: string | null; municipioId?: string | null; bairroId?: string | null }) {
    pendingPathRef.current = { bairroId: path.bairroId ?? undefined, municipioId: path.municipioId ?? undefined };
    if (path.estadoId === null) { setEstado(null); return; }
    if (path.estadoId && path.estadoId !== estadoId) { setEstado(path.estadoId); return; }
    if (path.municipioId === null) { setMunicipio(null); return; }
    if (path.municipioId && path.municipioId !== municipioId) { setMunicipio(path.municipioId); return; }
    if (path.bairroId === null) { setBairro(null); return; }
    if (path.bairroId && path.bairroId !== bairroId) setBairro(path.bairroId);
  }

  function disableBootstrapDefaults() {
    bootstrapRef.current = { estado: false, municipio: false, bairro: false };
  }

  return {
    filters,
    estados, municipios, bairros, escolas,
    loading,
    searchSuggestions,
    applySuggestion,
    applyFilterPath,
    disableBootstrapDefaults,
  };
}
