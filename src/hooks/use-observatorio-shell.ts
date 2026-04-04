"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCascadeFilters } from "@/hooks/use-cascade-filters";
import {
  listBairros,
  listEscolasByBairro,
  listEstados,
  listMunicipios,
} from "@/services/education-api";
import {
  MOCK_BAIRROS,
  MOCK_ENDERECOS,
  MOCK_ESCOLAS,
  MOCK_ESTADOS,
  MOCK_MUNICIPIOS,
} from "@/services/education-mock-data";
import type { Bairro, Escola, Estado, Municipio } from "@/types/education";
import type {
  MapEntity,
  ObservatoryLayer,
  SearchSuggestion,
  ObservatorySelection,
} from "@/types/observatory";

type EscolaAtlasMock = {
  anoReferencia: number;
  dependenciaAdm: string;
  endereco: {
    bairro: string;
    logradouro: string;
    municipio: string;
    uf: string;
  };
  indicadores: {
    taxaAbandono?: number;
    taxaReprovacao?: number;
    docentesSuperior?: number;
    horasAulaDiarias?: number;
    tdi?: number;
    tnr?: number;
  };
  infraestrutura: {
    internetParaAlunos: boolean;
    possuiBiblioteca: boolean;
    possuiLaboratorioInformatica: boolean;
    possuiAcessibilidadePcd: boolean;
  };
  zonaLocalizacao: "Urbana" | "Rural";
};

const ESCOLA_ATLAS_MOCKS: Record<string, EscolaAtlasMock> = {
  "ecit-1": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Manaíra",
      logradouro: "Av. Flávio Ribeiro Coutinho",
      municipio: "João Pessoa",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 1.2,
      taxaReprovacao: 5.3,
      docentesSuperior: 94,
      horasAulaDiarias: 5.4,
      tdi: 12,
      tnr: 1.1,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-2": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Tambaú",
      logradouro: "Av. Epitácio Pessoa",
      municipio: "João Pessoa",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 2.1,
      taxaReprovacao: 8.7,
      docentesSuperior: 91,
      horasAulaDiarias: 5,
      tdi: 14,
      tnr: 1.3,
    },
    infraestrutura: {
      internetParaAlunos: false,
      possuiBiblioteca: false,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-3": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Catolé",
      logradouro: "Rua Vigário Calixto",
      municipio: "Campina Grande",
      uf: "PB",
    },
    indicadores: {
      taxaAbandono: 3.6,
      taxaReprovacao: 12.4,
      docentesSuperior: 88,
      horasAulaDiarias: 4.8,
      tdi: 18,
      tnr: 1.6,
    },
    infraestrutura: {
      internetParaAlunos: false,
      possuiBiblioteca: false,
      possuiLaboratorioInformatica: false,
      possuiAcessibilidadePcd: false,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-4": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Boa Viagem",
      logradouro: "Av. Boa Viagem",
      municipio: "Recife",
      uf: "PE",
    },
    indicadores: {
      taxaAbandono: 0.9,
      taxaReprovacao: 4.9,
      docentesSuperior: 96,
      horasAulaDiarias: 5.7,
      tdi: 10,
      tnr: 0.9,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
  "escola-5": {
    anoReferencia: 2024,
    dependenciaAdm: "Municipal",
    endereco: {
      bairro: "Meireles",
      logradouro: "Av. Beira Mar",
      municipio: "Fortaleza",
      uf: "CE",
    },
    indicadores: {
      taxaAbandono: 1.1,
      taxaReprovacao: 5.7,
      docentesSuperior: 95,
      horasAulaDiarias: 5.6,
      tdi: 11,
      tnr: 1,
    },
    infraestrutura: {
      internetParaAlunos: true,
      possuiBiblioteca: true,
      possuiLaboratorioInformatica: true,
      possuiAcessibilidadePcd: true,
    },
    zonaLocalizacao: "Urbana",
  },
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

    return () => {
      alive = false;
    };
  }, [estadoId, setEstado]);

  useEffect(() => {
    let alive = true;

    async function loadMunicipios() {
      if (!estadoId) {
        setMunicipios([]);
        return;
      }

      setLoading((prev) => ({ ...prev, municipios: true }));

      const fallback = MOCK_MUNICIPIOS.filter(
        (item) => item.estadoId === estadoId,
      );

      const data = await withFallback(() => listMunicipios(estadoId), fallback);

      if (alive) {
        setMunicipios(data);
        if (pendingPathRef.current?.municipioId) {
          const target = data.find(
            (item) => item.id === pendingPathRef.current?.municipioId,
          );

          if (target) {
            setMunicipio(target.id);
          }
          pendingPathRef.current = {
            ...pendingPathRef.current,
            municipioId: undefined,
          };
        } else if (bootstrapRef.current.municipio && !municipioId && data[0]) {
          setMunicipio(data[0].id);
          bootstrapRef.current.municipio = false;
        }
      }

      setLoading((prev) => ({ ...prev, municipios: false }));
    }

    loadMunicipios();

    return () => {
      alive = false;
    };
  }, [estadoId, municipioId, setMunicipio]);

  useEffect(() => {
    let alive = true;

    async function loadBairros() {
      if (!municipioId) {
        setBairros([]);
        return;
      }

      setLoading((prev) => ({ ...prev, bairros: true }));

      const fallback = MOCK_BAIRROS.filter(
        (item) => item.municipioId === municipioId,
      );

      const data = await withFallback(() => listBairros(municipioId), fallback);

      if (alive) {
        setBairros(data);
        if (pendingPathRef.current?.bairroId) {
          const target = data.find(
            (item) => item.id === pendingPathRef.current?.bairroId,
          );
          if (target) {
            setBairro(target.id);
          }
          pendingPathRef.current = null;
        } else if (bootstrapRef.current.bairro && !bairroId && data[0]) {
          setBairro(data[0].id);
          bootstrapRef.current.bairro = false;
        }
      }

      setLoading((prev) => ({ ...prev, bairros: false }));
    }

    loadBairros();

    return () => {
      alive = false;
    };
  }, [municipioId, bairroId, setBairro]);

  useEffect(() => {
    let alive = true;

    async function loadEscolas() {
      if (!bairroId) {
        setEscolas([]);
        return;
      }

      setLoading((prev) => ({ ...prev, escolas: true }));

      const fallback = MOCK_ESCOLAS.filter(
        (item) => item.bairroId === bairroId,
      );

      const data = await withFallback(
        () => listEscolasByBairro(bairroId),
        fallback,
      );

      if (alive) {
        setEscolas(data);
      }

      setLoading((prev) => ({ ...prev, escolas: false }));
    }

    loadEscolas();

    return () => {
      alive = false;
    };
  }, [bairroId]);

  useEffect(() => {
    setSelected(null);
    setDetailsOpen(false);
  }, [estadoId, municipioId, bairroId, activeLayer]);

  const mapEntities: MapEntity[] = useMemo(() => {
    if (activeLayer === "municipio") {
      return municipios.map((data) => ({ kind: "municipio" as const, data }));
    }

    if (activeLayer === "bairro") {
      return bairros.map((data) => ({ kind: "bairro" as const, data }));
    }

    return escolas.map((data) => ({ kind: "escola" as const, data }));
  }, [activeLayer, municipios, bairros, escolas]);

  function selectEntity(entity: MapEntity) {
    if (entity.kind === "municipio") {
      const municipioBairros = bairros.filter(
        (item) => item.municipioId === entity.data.id,
      );
      const municipioBairroIds = new Set(
        municipioBairros.map((item) => item.id),
      );
      const municipioEscolas = escolas.filter((item) =>
        municipioBairroIds.has(item.bairroId),
      );
      const municipioEscolaDetails = municipioEscolas
        .map((item) => ESCOLA_ATLAS_MOCKS[item.id])
        .filter(Boolean);

      const internetParaAlunosCount = municipioEscolaDetails.filter(
        (item) => item.infraestrutura.internetParaAlunos,
      ).length;

      setSelected({
        id: entity.data.id,
        nome: entity.data.nome,
        kind: "municipio",
        subtitle: "Visão agregada por município",
        metrics: [
          {
            label: "Bairros mapeados",
            value: String(municipioBairros.length),
          },
          {
            label: "Escolas no recorte",
            value: String(municipioEscolas.length),
          },
          {
            label: "% internet para alunos",
            value: municipioEscolaDetails.length
              ? `${((internetParaAlunosCount / municipioEscolaDetails.length) * 100).toFixed(1)}%`
              : "—",
          },
        ],
        sections: [
          {
            title: "Indicadores agregados (mock)",
            rows: [
              {
                label: "Taxa média de abandono",
                value: municipioEscolaDetails.length
                  ? `${average(
                      municipioEscolaDetails
                        .map((item) => item.indicadores.taxaAbandono ?? 0)
                        .filter((item) => item > 0),
                    ).toFixed(1)}%`
                  : "—",
              },
              {
                label: "Taxa média de reprovação",
                value: municipioEscolaDetails.length
                  ? `${average(
                      municipioEscolaDetails
                        .map((item) => item.indicadores.taxaReprovacao ?? 0)
                        .filter((item) => item > 0),
                    ).toFixed(1)}%`
                  : "—",
              },
              {
                label: "Docentes com superior (média)",
                value: municipioEscolaDetails.length
                  ? `${average(
                      municipioEscolaDetails
                        .map((item) => item.indicadores.docentesSuperior ?? 0)
                        .filter((item) => item > 0),
                    ).toFixed(1)}%`
                  : "—",
              },
            ],
          },
        ],
      });
    }

    if (entity.kind === "bairro") {
      const bairroEscolas = escolas.filter(
        (item) => item.bairroId === entity.data.id,
      );
      const bairroEscolaDetails = bairroEscolas
        .map((item) => ESCOLA_ATLAS_MOCKS[item.id])
        .filter(Boolean);

      setSelected({
        id: entity.data.id,
        nome: entity.data.nome,
        kind: "bairro",
        subtitle: "Visão territorial detalhada por bairro",
        metrics: [
          { label: "Escolas no bairro", value: String(bairroEscolas.length) },
          { label: "Nível de análise", value: "Granular" },
        ],
        sections: [
          {
            title: "Infraestrutura (mock)",
            rows: [
              {
                label: "Escolas com biblioteca",
                value: `${bairroEscolaDetails.filter((item) => item.infraestrutura.possuiBiblioteca).length}/${bairroEscolaDetails.length}`,
              },
              {
                label: "Escolas com lab. informática",
                value: `${bairroEscolaDetails.filter((item) => item.infraestrutura.possuiLaboratorioInformatica).length}/${bairroEscolaDetails.length}`,
              },
              {
                label: "Escolas com internet p/ alunos",
                value: `${bairroEscolaDetails.filter((item) => item.infraestrutura.internetParaAlunos).length}/${bairroEscolaDetails.length}`,
              },
            ],
          },
        ],
      });
    }

    if (entity.kind === "escola") {
      const detail = ESCOLA_ATLAS_MOCKS[entity.data.id];

      setSelected({
        id: entity.data.id,
        nome: entity.data.nome,
        kind: "escola",
        subtitle: "Visão micro em unidade escolar",
        metrics: [
          { label: "IDEB", value: entity.data.ideb?.toFixed(1) ?? "—" },
          { label: "INSE", value: entity.data.inse?.toFixed(1) ?? "—" },
        ],
        sections: detail
          ? [
              {
                title: "Identificação",
                rows: [
                  { label: "Dependência", value: detail.dependenciaAdm },
                  {
                    label: "Ano referência",
                    value: String(detail.anoReferencia),
                  },
                  { label: "Zona", value: detail.zonaLocalizacao },
                ],
              },
              {
                title: "Endereço",
                rows: [
                  { label: "Município", value: detail.endereco.municipio },
                  { label: "Bairro", value: detail.endereco.bairro },
                  { label: "Logradouro", value: detail.endereco.logradouro },
                  { label: "UF", value: detail.endereco.uf },
                ],
              },
              {
                title: "Indicadores (mock)",
                rows: [
                  {
                    label: "Taxa abandono",
                    value: `${detail.indicadores.taxaAbandono ?? "—"}%`,
                  },
                  {
                    label: "Taxa reprovação",
                    value: `${detail.indicadores.taxaReprovacao ?? "—"}%`,
                  },
                  {
                    label: "Docentes superior",
                    value: `${detail.indicadores.docentesSuperior ?? "—"}%`,
                  },
                  {
                    label: "Horas aula diárias",
                    value: detail.indicadores.horasAulaDiarias
                      ? `${detail.indicadores.horasAulaDiarias.toFixed(1)}h`
                      : "—",
                  },
                  {
                    label: "TDI",
                    value: String(detail.indicadores.tdi ?? "—"),
                  },
                  {
                    label: "TNR",
                    value: String(detail.indicadores.tnr ?? "—"),
                  },
                ],
              },
              {
                title: "Infraestrutura",
                rows: [
                  {
                    label: "Internet para alunos",
                    value: detail.infraestrutura.internetParaAlunos
                      ? "Sim"
                      : "Não",
                  },
                  {
                    label: "Biblioteca",
                    value: detail.infraestrutura.possuiBiblioteca
                      ? "Sim"
                      : "Não",
                  },
                  {
                    label: "Lab. informática",
                    value: detail.infraestrutura.possuiLaboratorioInformatica
                      ? "Sim"
                      : "Não",
                  },
                  {
                    label: "Acessibilidade PCD",
                    value: detail.infraestrutura.possuiAcessibilidadePcd
                      ? "Sim"
                      : "Não",
                  },
                ],
              },
            ]
          : undefined,
      });
    }

    setDetailsOpen(true);
  }

  const searchCatalog = useMemo<SearchSuggestion[]>(() => {
    const estadoLookup = new Map(estados.map((item) => [item.id, item.nome]));
    const municipioLookup = new Map(
      municipios.map((item) => [item.id, item.nome]),
    );
    const bairroLookup = new Map(bairros.map((item) => [item.id, item.nome]));

    const byBairro = bairros.map((bairro) => ({
      id: `bairro-${bairro.id}`,
      kind: "bairro" as const,
      label: bairro.nome,
      subtitle: `Bairro · ${municipioLookup.get(bairro.municipioId) ?? ""}`,
      bairroId: bairro.id,
      municipioId: bairro.municipioId,
      estadoId: estadoId ?? undefined,
      keywords: `${bairro.nome} ${municipioLookup.get(bairro.municipioId) ?? ""}`,
    }));

    const byEscola = escolas.map((escola) => ({
      id: `escola-${escola.id}`,
      kind: "escola" as const,
      label: escola.nome,
      subtitle: `Escola · ${bairroLookup.get(escola.bairroId) ?? ""}`,
      escolaId: escola.id,
      bairroId: escola.bairroId,
      municipioId: municipioId ?? undefined,
      estadoId: estadoId ?? undefined,
      keywords: `${escola.nome} ${bairroLookup.get(escola.bairroId) ?? ""}`,
    }));

    const byEndereco = MOCK_ENDERECOS.map((address) => ({
      id: `endereco-${address.id}`,
      kind: "endereco" as const,
      label: address.logradouro,
      subtitle: `Rua · ${bairroLookup.get(address.bairroId) ?? address.bairroId}`,
      bairroId: address.bairroId,
      municipioId: address.municipioId,
      estadoId: address.estadoId,
      keywords: `${address.logradouro} ${bairroLookup.get(address.bairroId) ?? ""} ${municipioLookup.get(address.municipioId) ?? ""} ${estadoLookup.get(address.estadoId) ?? ""}`,
    }));

    return [...byBairro, ...byEscola, ...byEndereco];
  }, [bairros, escolas, estadoId, estados, municipioId, municipios]);

  const fuse = useMemo(
    () =>
      new Fuse(searchCatalog, {
        ignoreLocation: true,
        keys: ["label", "subtitle", "keywords"],
        threshold: 0.35,
      }),
    [searchCatalog],
  );

  function searchSuggestions(query: string) {
    const normalized = query.trim();
    if (!normalized) {
      return searchCatalog.slice(0, 8);
    }

    return fuse
      .search(normalized)
      .slice(0, 8)
      .map((item) => item.item);
  }

  function applySuggestion(suggestion: SearchSuggestion) {
    pendingPathRef.current = {
      bairroId: suggestion.bairroId,
      municipioId: suggestion.municipioId,
    };

    if (suggestion.estadoId && suggestion.estadoId !== estadoId) {
      setEstado(suggestion.estadoId);
      return;
    }

    if (suggestion.municipioId && suggestion.municipioId !== municipioId) {
      setMunicipio(suggestion.municipioId);
      return;
    }

    if (suggestion.bairroId && suggestion.bairroId !== bairroId) {
      setBairro(suggestion.bairroId);
      return;
    }

    if (suggestion.escolaId) {
      const escola = escolas.find((item) => item.id === suggestion.escolaId);
      if (escola) {
        selectEntity({ kind: "escola", data: escola });
      }
    }
  }

  function disableBootstrapDefaults() {
    bootstrapRef.current = {
      estado: false,
      municipio: false,
      bairro: false,
    };
  }

  function applyFilterPath(path: {
    estadoId?: string | null;
    municipioId?: string | null;
    bairroId?: string | null;
  }) {
    pendingPathRef.current = {
      bairroId: path.bairroId ?? undefined,
      municipioId: path.municipioId ?? undefined,
    };

    if (path.estadoId === null) {
      setEstado(null);
      return;
    }

    if (path.estadoId && path.estadoId !== estadoId) {
      setEstado(path.estadoId);
      return;
    }

    if (path.municipioId === null) {
      setMunicipio(null);
      return;
    }

    if (path.municipioId && path.municipioId !== municipioId) {
      setMunicipio(path.municipioId);
      return;
    }

    if (path.bairroId === null) {
      setBairro(null);
      return;
    }

    if (path.bairroId && path.bairroId !== bairroId) {
      setBairro(path.bairroId);
    }
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
  };
}
