"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCascadeFilters } from "@/core/filters/use-cascade-filters";
import { fetchAllSchools } from "@/core/geospatial/geospatial-api";
import { getModule } from "@/core/registry/module-registry";
import {
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
import type {
  MapEntity,
  ObservatorySelection,
  SearchSuggestion,
} from "@/core/types/shell";
import type { ObservatoryLayer } from "@/core/types/territory";

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

export function useObservatorioShell() {
  const filters = useCascadeFilters();
  const {
    estadoId,
    municipioId,
    bairroId,
    setEstado,
    setMunicipio,
    setBairro,
  } = filters;

  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);

  const [activeLayer, setActiveLayer] = useState<ObservatoryLayer>("bairro");
  const [selected, setSelected] = useState<ObservatorySelection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>("educacao");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pendingPathRef = useRef<{
    municipioId?: string;
    bairroId?: string;
  } | null>(null);
  const bootstrapRef = useRef({
    estado: true,
    municipio: true,
    bairro: true,
  });

  const [loading, setLoading] = useState({
    estados: false,
    municipios: false,
    bairros: false,
    escolas: false,
  });

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
      const fallback = MOCK_MUNICIPIOS.filter((item) => item.estadoId === estadoId);
      const data = await withFallback(() => listMunicipios(estadoId), fallback);
      if (alive) {
        setMunicipios(data);
        if (pendingPathRef.current?.municipioId) {
          const target = data.find((item) => item.id === pendingPathRef.current?.municipioId);
          if (target) setMunicipio(target.id);
          pendingPathRef.current = { ...pendingPathRef.current, municipioId: undefined };
        } else if (bootstrapRef.current.municipio && !municipioId && data[0]) {
          setMunicipio(data[0].id);
          bootstrapRef.current.municipio = false;
        }
      }
      setLoading((prev) => ({ ...prev, municipios: false }));
    }
    loadMunicipios();
    return () => { alive = false; };
  }, [estadoId, municipioId, setMunicipio]);

  useEffect(() => {
    let alive = true;
    async function loadBairros() {
      if (!municipioId) { setBairros([]); return; }
      setLoading((prev) => ({ ...prev, bairros: true }));
      const fallback = MOCK_BAIRROS.filter((item) => item.municipioId === municipioId);
      const data = await withFallback(() => listBairros(municipioId), fallback);
      if (alive) {
        setBairros(data);
        if (pendingPathRef.current?.bairroId) {
          const target = data.find((item) => item.id === pendingPathRef.current?.bairroId);
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
  }, [municipioId, bairroId, setBairro]);

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

  useEffect(() => {
    setSelected(null);
    setDetailsOpen(false);
  }, [estadoId, municipioId, bairroId, activeLayer]);

  const mapEntities: MapEntity[] = useMemo(() => {
    if (activeLayer === "municipio") return municipios.map((data) => ({ kind: "municipio" as const, data }));
    if (activeLayer === "bairro") return bairros.map((data) => ({ kind: "bairro" as const, data }));
    return escolas.map((data) => ({ kind: "escola" as const, data }));
  }, [activeLayer, municipios, bairros, escolas]);

  function selectEntity(entity: MapEntity) {
    const activeModule = activeModuleId ? getModule(activeModuleId) : undefined;

    if (activeModule?.buildSelection) {
      setSelected(activeModule.buildSelection(entity));
    } else {
      setSelected({
        id: entity.data.id,
        nome: entity.data.nome,
        kind: entity.kind,
        subtitle: `${entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1)} selecionado`,
      });
    }
    setDetailsOpen(true);
  }

  const searchCatalog = useMemo<SearchSuggestion[]>(() => {
    const estadoLookup = new Map(estados.map((item) => [item.id, item.nome]));
    const municipioLookup = new Map(municipios.map((item) => [item.id, item.nome]));
    const bairroLookup = new Map(bairros.map((item) => [item.id, item.nome]));

    const byBairro = bairros.map((bairro) => ({
      id: `bairro-${bairro.id}`, kind: "bairro" as const,
      label: bairro.nome, subtitle: `Bairro · ${municipioLookup.get(bairro.municipioId) ?? ""}`,
      bairroId: bairro.id, municipioId: bairro.municipioId, estadoId: estadoId ?? undefined,
      keywords: `${bairro.nome} ${municipioLookup.get(bairro.municipioId) ?? ""}`,
    }));

    const byEscola = escolas.map((escola) => ({
      id: `escola-${escola.id}`, kind: "escola" as const,
      label: escola.nome,
      subtitle: `Escola · ${escola.bairroNome ?? bairroLookup.get(escola.bairroId) ?? escola.municipioNome ?? ""}`,
      escolaId: escola.id, bairroId: escola.bairroId,
      municipioId: municipioId ?? undefined, estadoId: estadoId ?? undefined,
      keywords: `${escola.nome} ${escola.bairroNome ?? bairroLookup.get(escola.bairroId) ?? ""} ${escola.municipioNome ?? municipioLookup.get(municipioId ?? "") ?? ""}`,
    }));

    const byEndereco = MOCK_ENDERECOS.map((address) => ({
      id: `endereco-${address.id}`, kind: "endereco" as const,
      label: address.logradouro, subtitle: `Rua · ${bairroLookup.get(address.bairroId) ?? address.bairroId}`,
      bairroId: address.bairroId, municipioId: address.municipioId, estadoId: address.estadoId,
      keywords: `${address.logradouro} ${bairroLookup.get(address.bairroId) ?? ""} ${municipioLookup.get(address.municipioId) ?? ""} ${estadoLookup.get(address.estadoId) ?? ""}`,
    }));

    return [...byBairro, ...byEscola, ...byEndereco];
  }, [bairros, escolas, estadoId, estados, municipioId, municipios]);

  const fuse = useMemo(
    () => new Fuse(searchCatalog, { ignoreLocation: true, keys: ["label", "subtitle", "keywords"], threshold: 0.35 }),
    [searchCatalog],
  );

  function searchSuggestions(query: string) {
    const normalized = query.trim();
    if (!normalized) return searchCatalog.slice(0, 8);
    return fuse.search(normalized).slice(0, 8).map((item) => item.item);
  }

  function applySuggestion(suggestion: SearchSuggestion) {
    pendingPathRef.current = { bairroId: suggestion.bairroId, municipioId: suggestion.municipioId };
    if (suggestion.estadoId && suggestion.estadoId !== estadoId) { setEstado(suggestion.estadoId); return; }
    if (suggestion.municipioId && suggestion.municipioId !== municipioId) { setMunicipio(suggestion.municipioId); return; }
    if (suggestion.bairroId && suggestion.bairroId !== bairroId) { setBairro(suggestion.bairroId); return; }
    if (suggestion.escolaId) {
      const escola = escolas.find((item) => item.id === suggestion.escolaId);
      if (escola) selectEntity({ kind: "escola", data: escola });
    }
  }

  function disableBootstrapDefaults() {
    bootstrapRef.current = { estado: false, municipio: false, bairro: false };
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

  function setActiveModule(moduleId: string) {
    setActiveModuleId(moduleId);
  }

  return {
    activeLayer,
    bairros,
    detailsOpen,
    escolas,
    estados,
    filters,
    loading,
    mapEntities,
    municipios,
    selected,
    selectEntity,
    setActiveLayer,
    setDetailsOpen,
    searchSuggestions,
    applySuggestion,
    applyFilterPath,
    disableBootstrapDefaults,
    // novos
    activeModuleId,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
  };
}
