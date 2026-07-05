"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Building2,
  School2,
  Search,
  X,
  Layers,
  Trash2,
  Loader2,
} from "lucide-react";
import { PendingRouteLink } from "@/components/ui/pending-route-link";
import { listMunicipios, listBairros, listEscolasByMunicipio } from "@/modules/educacao/services/education-api";
import type { Municipio, Bairro, Escola } from "@/core/types/territory";

type GranularityLevel = "municipio" | "bairro" | "escola";

export function LandingGranularityNav() {
  const router = useRouter();

  const [granularity, setGranularity] = useState<GranularityLevel>("municipio");
  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
  const [selectedBairro, setSelectedBairro] = useState<Bairro | null>(null);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

  const [municipioSearch, setMunicipioSearch] = useState("");
  const [bairroSearch, setBairroSearch] = useState("");
  const [escolaSearch, setEscolaSearch] = useState("");

  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false);
  const [showBairroDropdown, setShowBairroDropdown] = useState(false);
  const [showEscolaDropdown, setShowEscolaDropdown] = useState(false);

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEscolas, setLoadingEscolas] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const municipioRef = useRef<HTMLDivElement>(null);
  const bairroRef = useRef<HTMLDivElement>(null);
  const escolaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const data = await listMunicipios("pb");
        setMunicipios(data);
      } catch (error) {
        console.error("Erro ao carregar municípios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipios();
  }, []);

  useEffect(() => {
    if (!selectedMunicipio || granularity !== "bairro") return;
    const loadBairros = async () => {
      try {
        const data = await listBairros(selectedMunicipio.id);
        setBairros(data);
      } catch (error) {
        console.error("Erro ao carregar bairros:", error);
      }
    };

    loadBairros();
  }, [selectedMunicipio, granularity]);

  // Carrega escolas quando município é selecionado E toggle está em "escola"
  // Escola depende SOMENTE do município (endpoint /schools?municipio_id=...)
  useEffect(() => {
    if (!selectedMunicipio || granularity !== "escola") {
      setLoadingEscolas(false);
      return;
    }
    const loadEscolas = async () => {
      setLoadingEscolas(true);
      try {
        const data = await listEscolasByMunicipio(selectedMunicipio.id);
        setEscolas(data);
      } catch (error) {
        console.error("Erro ao carregar escolas:", error);
      } finally {
        setLoadingEscolas(false);
      }
    };

    loadEscolas();
  }, [selectedMunicipio, granularity]);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (municipioRef.current && !municipioRef.current.contains(e.target as Node)) {
        setShowMunicipioDropdown(false);
      }
      if (bairroRef.current && !bairroRef.current.contains(e.target as Node)) {
        setShowBairroDropdown(false);
      }
      if (escolaRef.current && !escolaRef.current.contains(e.target as Node)) {
        setShowEscolaDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtra municípios por busca
  const filteredMunicipios = municipios.filter((m) =>
    m.nome.toLowerCase().includes(municipioSearch.toLowerCase()),
  );

  // Filtra bairros baseado no município selecionado e busca
  const filteredBairros = bairros.filter((b) => {
    const matchesMunicipio = selectedMunicipio ? b.municipioId === selectedMunicipio.id : true;
    const matchesSearch = b.nome.toLowerCase().includes(bairroSearch.toLowerCase());
    return matchesMunicipio && matchesSearch;
  });

  // Escolas já vêm filtradas por município da API; aqui só filtramos por texto de busca
  const filteredEscolas = escolas.filter((e) =>
    e.nome.toLowerCase().includes(escolaSearch.toLowerCase()),
  );

  const hasAnySelection = selectedMunicipio || selectedBairro || selectedEscola;

  const handleClearAll = useCallback(() => {
    setSelectedMunicipio(null);
    setSelectedBairro(null);
    setSelectedEscola(null);
    setMunicipioSearch("");
    setBairroSearch("");
    setEscolaSearch("");
    setBairros([]);
    setEscolas([]);
  }, []);

  const handleGranularityChange = useCallback(
    (level: GranularityLevel) => {
      setGranularity(level);

      // Ao mudar toggle, limpa campos que não são mais relevantes
      if (level === "municipio") {
        setSelectedBairro(null);
        setSelectedEscola(null);
        setBairroSearch("");
        setEscolaSearch("");
        setBairros([]);
        setEscolas([]);
      } else if (level === "bairro") {
        setSelectedEscola(null);
        setEscolaSearch("");
        setEscolas([]);
      }
    },
    [],
  );

  const handleMunicipioSelect = useCallback((municipio: Municipio) => {
    setSelectedMunicipio(municipio);
    setMunicipioSearch(municipio.nome);
    setShowMunicipioDropdown(false);
    setSelectedBairro(null);
    setSelectedEscola(null);
    setBairroSearch("");
    setEscolaSearch("");
    setEscolas([]);
  }, []);

  const handleBairroSelect = useCallback((bairro: Bairro) => {
    setSelectedBairro(bairro);
    setBairroSearch(bairro.nome);
    setShowBairroDropdown(false);
  }, []);

  const handleEscolaSelect = useCallback((escola: Escola) => {
    setSelectedEscola(escola);
    setEscolaSearch(escola.nome);
    setShowEscolaDropdown(false);
  }, []);

  // Reaproveita o mesmo padrão de rota já usado no restante do app (ver breadcrumbItems
  // abaixo): /observatorio?estado=...&layer=...&municipio=...&bairro=...&modulo=educacao,
  // e /schools/{id} pra escola. O parâmetro "estado" é obrigatório — sem ele a página do
  // observatório não consegue resolver o município/bairro vindos da URL.
  const handleNavigate = useCallback(() => {
    setNavigating(true);

    setTimeout(() => {
      if (granularity === "municipio" && selectedMunicipio) {
        router.push(
          `/observatorio?estado=${selectedMunicipio.estadoId}&layer=municipio&municipio=${selectedMunicipio.id}&modulo=educacao&sidebar=expanded`,
        );
      } else if (granularity === "bairro" && selectedBairro) {
        const estadoId = selectedMunicipio?.estadoId ?? "pb";
        router.push(
          `/observatorio?estado=${estadoId}&layer=bairro&municipio=${selectedBairro.municipioId}&bairro=${selectedBairro.id}&modulo=educacao&sidebar=expanded`,
        );
      } else if (granularity === "escola" && selectedEscola) {
        router.push(`/schools/${selectedEscola.inepId ?? selectedEscola.id}`);
      }
    }, 150);
  }, [granularity, selectedMunicipio, selectedBairro, selectedEscola, router]);

  const canNavigate =
    !navigating &&
    ((granularity === "municipio" && selectedMunicipio) ||
      (granularity === "bairro" && selectedBairro) ||
      (granularity === "escola" && selectedEscola));

  const breadcrumbItems = [
    ...(selectedMunicipio
      ? [
          {
            label: selectedMunicipio.nome,
            href: `/observatorio?estado=${selectedMunicipio.estadoId}&layer=municipio&municipio=${selectedMunicipio.id}&modulo=educacao`,
          },
        ]
      : []),
    ...(selectedBairro
      ? [
          {
            label: selectedBairro.nome,
            href: `/observatorio?estado=${selectedMunicipio?.estadoId ?? "pb"}&layer=bairro&municipio=${selectedBairro.municipioId}&bairro=${selectedBairro.id}&modulo=educacao`,
          },
        ]
      : []),
    ...(selectedEscola
      ? [
          {
            label: selectedEscola.nome,
            href: `/schools/${selectedEscola.inepId ?? selectedEscola.id}`,
          },
        ]
      : []),
  ];

  // Loading state inicial
  if (loading) {
    return (
      <section className="relative rounded-3xl border border-zinc-200/70 bg-white/85 p-6 shadow-lg shadow-cyan-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.08),_transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
        </div>
        <div className="relative z-10">
          <div className="mb-6">
            <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-4 h-4 w-96 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-3xl border border-zinc-200/70 bg-white/85 p-6 shadow-lg shadow-cyan-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:p-8">
      {/* Background decoration - overflow-hidden isolado aqui pra não cortar os dropdowns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.08),_transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            <Layers className="h-4 w-4" />
            Navegação por Granularidade
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Explore o território
          </h2>
        </div>

        {/* Granularity Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleGranularityChange("municipio")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              granularity === "municipio"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/60 dark:text-cyan-300"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Município
          </button>
          <button
            type="button"
            onClick={() => handleGranularityChange("bairro")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              granularity === "bairro"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/60 dark:text-cyan-300"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Bairro
          </button>
          <button
            type="button"
            onClick={() => handleGranularityChange("escola")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              granularity === "escola"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/60 dark:text-cyan-300"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <School2 className="h-4 w-4" />
            Escola
          </button>
        </div>

        {/* Selection Inputs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Município Selector */}
          <div className="relative" ref={municipioRef}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Município
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={municipioSearch}
                onChange={(e) => {
                  setMunicipioSearch(e.target.value);
                  setShowMunicipioDropdown(true);
                }}
                onFocus={() => setShowMunicipioDropdown(true)}
                placeholder="Buscar município..."
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-8 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-cyan-500"
              />
              {municipioSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMunicipioSearch("");
                    setSelectedMunicipio(null);
                    setSelectedBairro(null);
                    setSelectedEscola(null);
                    setBairros([]);
                    setEscolas([]);
                    setBairroSearch("");
                    setEscolaSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showMunicipioDropdown && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {filteredMunicipios.length > 0 ? (
                  filteredMunicipios.map((municipio) => (
                    <button
                      key={municipio.id}
                      type="button"
                      onClick={() => handleMunicipioSelect(municipio)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                        selectedMunicipio?.id === municipio.id
                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {municipio.nome}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhum município encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bairro Selector */}
          <div className="relative" ref={bairroRef}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Bairro
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={bairroSearch}
                onChange={(e) => {
                  setBairroSearch(e.target.value);
                  setShowBairroDropdown(true);
                }}
                onFocus={() => {
                  if (selectedMunicipio && granularity === "bairro") setShowBairroDropdown(true);
                }}
                disabled={!selectedMunicipio || granularity !== "bairro"}
                placeholder={
                  granularity !== "bairro"
                    ? 'Ative o toggle "Bairro"'
                    : selectedMunicipio
                      ? "Buscar bairro..."
                      : "Selecione um município"
                }
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-8 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-cyan-500"
              />
              {bairroSearch && selectedMunicipio && granularity === "bairro" && (
                <button
                  type="button"
                  onClick={() => {
                    setBairroSearch("");
                    setSelectedBairro(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {showBairroDropdown && selectedMunicipio && granularity === "bairro" && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {filteredBairros.length > 0 ? (
                  filteredBairros.map((bairro) => (
                    <button
                      key={bairro.id}
                      type="button"
                      onClick={() => handleBairroSelect(bairro)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                        selectedBairro?.id === bairro.id
                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {bairro.nome}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhum bairro encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Escola Selector */}
          <div className="relative" ref={escolaRef}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Escola
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={escolaSearch}
                onChange={(e) => {
                  setEscolaSearch(e.target.value);
                  setShowEscolaDropdown(true);
                }}
                onFocus={() => {
                  if (selectedMunicipio && granularity === "escola") setShowEscolaDropdown(true);
                }}
                disabled={!selectedMunicipio || granularity !== "escola"}
                placeholder={
                  granularity !== "escola"
                    ? 'Ative o toggle "Escola"'
                    : selectedMunicipio
                      ? "Buscar escola..."
                      : "Selecione um município"
                }
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-8 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-cyan-500"
              />
              {escolaSearch && selectedMunicipio && granularity === "escola" && (
                <button
                  type="button"
                  onClick={() => {
                    setEscolaSearch("");
                    setSelectedEscola(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown - max-h-60 ≈ 5 itens visíveis, resto rola por dentro */}
            {showEscolaDropdown && selectedMunicipio && granularity === "escola" && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {loadingEscolas ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Carregando escolas...
                  </div>
                ) : filteredEscolas.length > 0 ? (
                  filteredEscolas.map((escola) => (
                    <button
                      key={escola.id}
                      type="button"
                      onClick={() => handleEscolaSelect(escola)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                        selectedEscola?.id === escola.id
                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <School2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <div className="truncate">{escola.nome}</div>
                        {escola.dependencia_adm && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {escola.dependencia_adm}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhuma escola encontrada
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb & Action */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Breadcrumb */}
          {breadcrumbItems.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm flex-wrap">
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;

                return (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
                    {isLast ? (
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.label}
                      </span>
                    ) : (
                      <PendingRouteLink
                        href={item.href}
                        className="text-zinc-600 transition hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-400"
                      >
                        {item.label}
                      </PendingRouteLink>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {/* Clear button */}
            {hasAnySelection && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar seleção
              </button>
            )}

            {/* Navigate Button */}
            <button
              type="button"
              onClick={handleNavigate}
              disabled={!canNavigate || navigating}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {navigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  Acessar {granularity === "municipio" ? "município" : granularity === "bairro" ? "bairro" : "escola"}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
