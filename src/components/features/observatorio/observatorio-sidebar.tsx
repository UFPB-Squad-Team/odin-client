"use client";

import { useMemo, useState } from "react";
import { SearchableCombobox } from "@/components/features/observatorio/searchable-combobox";
import type { Bairro, Estado, Municipio } from "@/types/education";
import type { ObservatoryLayer, SearchSuggestion } from "@/types/observatory";

type SidebarProps = {
  activeLayer: ObservatoryLayer;
  bairroId: string | null;
  bairros: Bairro[];
  estadoId: string | null;
  estados: Estado[];
  loading: {
    estados: boolean;
    municipios: boolean;
    bairros: boolean;
    escolas: boolean;
  };
  municipioId: string | null;
  municipios: Municipio[];
  onLayerChange: (layer: ObservatoryLayer) => void;
  onSetBairro: (bairroId: string | null) => void;
  onSetEstado: (estadoId: string | null) => void;
  onSetMunicipio: (municipioId: string | null) => void;
  onApplySuggestion: (suggestion: SearchSuggestion) => void;
  searchSuggestions: (query: string) => SearchSuggestion[];
  sidebarCollapsed: boolean;
};

const LAYERS: Array<{ id: ObservatoryLayer; label: string }> = [
  { id: "municipio", label: "Município" },
  { id: "bairro", label: "Bairro" },
  { id: "escola", label: "Escola" },
];

export function ObservatorioSidebar({
  activeLayer,
  bairroId,
  bairros,
  estadoId,
  estados,
  loading,
  municipioId,
  municipios,
  onLayerChange,
  onSetBairro,
  onSetEstado,
  onSetMunicipio,
  onApplySuggestion,
  searchSuggestions,
  sidebarCollapsed,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuggestionLabel, setSelectedSuggestionLabel] = useState<
    string | null
  >(null);
  const smartSuggestions = useMemo(
    () => searchSuggestions(searchQuery),
    [searchQuery, searchSuggestions],
  );

  const estadoOptions = estados.map((estado) => ({
    id: estado.id,
    label: estado.nome,
  }));
  const municipioOptions = municipios.map((municipio) => ({
    id: municipio.id,
    label: municipio.nome,
  }));
  const bairroOptions = bairros.map((bairro) => ({
    id: bairro.id,
    label: bairro.nome,
  }));

  return (
    <aside
      className={`border-b border-zinc-300/70 bg-white/90 backdrop-blur transition-all dark:border-zinc-800/70 dark:bg-zinc-900/70 md:border-b-0 md:border-r ${
        sidebarCollapsed
          ? "md:w-0 md:overflow-hidden md:p-0 md:opacity-0"
          : "overflow-y-auto p-3 sm:p-4 md:w-auto md:overflow-y-auto md:p-6 md:opacity-100"
      }`}
    >
      <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50 px-4 py-4 shadow-sm dark:border-zinc-800/70 dark:from-zinc-900/80 dark:to-zinc-950/50 sm:px-5 sm:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
          Painel de filtros
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Explore território por estado, município, bairro e camada.
        </p>
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
          Busca inteligente, filtros em cascata e contexto salvo.
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm dark:border-zinc-700/50 dark:from-zinc-900/50 dark:to-zinc-900/30 sm:mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700 dark:text-zinc-200">
          🔍 Busca Inteligente
        </p>

        <input
          id="observatorio-smart-search"
          aria-label="Buscar rua, bairro ou escola"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            if (selectedSuggestionLabel) {
              setSelectedSuggestionLabel(null);
            }
          }}
          placeholder="Ex.: Av. Epitácio Pessoa"
          className="mt-3 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-cyan-500/60 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          Dica: pressione <strong>/</strong> para focar a busca.
        </p>

        <div className="mt-2 max-h-36 space-y-1 overflow-auto">
          {searchQuery.trim().length > 0 ? (
            smartSuggestions.length > 0 ? (
              <div className="grid gap-1">
                {smartSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onApplySuggestion(item);
                      setSelectedSuggestionLabel(item.label);
                      setSearchQuery("");
                    }}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-left text-xs text-zinc-700 transition hover:bg-cyan-50 hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-cyan-950/30"
                  >
                    <strong className="font-medium">{item.label}</strong>
                    <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                      {item.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Nenhuma sugestão encontrada.
              </p>
            )
          ) : null}

          {selectedSuggestionLabel ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-cyan-300/80 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300">
              <span>✓ {selectedSuggestionLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedSuggestionLabel(null)}
                className="rounded px-2 py-0.5 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:hover:bg-cyan-900/40"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3.5 sm:mt-7 sm:space-y-4">
        <SearchableCombobox
          ariaLabel="Buscar e selecionar estado"
          label="Estado"
          value={estadoId}
          options={estadoOptions}
          onSelect={onSetEstado}
          placeholder="Digite o estado"
        />

        <SearchableCombobox
          ariaLabel="Buscar e selecionar município"
          label="Município"
          value={municipioId}
          options={municipioOptions}
          onSelect={onSetMunicipio}
          placeholder="Digite o município"
          disabled={!estadoId}
        />

        <SearchableCombobox
          ariaLabel="Buscar e selecionar bairro"
          label="Bairro"
          value={bairroId}
          options={bairroOptions}
          onSelect={onSetBairro}
          placeholder="Digite o bairro"
          disabled={!municipioId}
        />
      </div>

      <div className="mt-7 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700 dark:text-zinc-200">
          📍 Camada de Análise
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LAYERS.map((layer) => {
            const active = layer.id === activeLayer;

            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onLayerChange(layer.id)}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 ${
                  active
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "border border-zinc-300 text-zinc-700 hover:border-cyan-400 hover:text-cyan-600 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-cyan-500 dark:hover:bg-zinc-800"
                }`}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 rounded-lg border border-dashed border-cyan-300/70 bg-cyan-50/60 p-4 shadow-sm dark:border-cyan-900/50 dark:bg-cyan-950/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">
              🧩 Filtros futuros
            </p>
            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
              Apenas placeholder visual para prototipação.
            </p>
          </div>
          <span className="rounded-full border border-cyan-300 bg-white px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:border-cyan-900/60 dark:bg-zinc-950 dark:text-cyan-300">
            Sidebar
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
                  Filtro por rede
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Municipal, estadual, privada
                </p>
              </div>
              <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                Placeholder
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
                Zona
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  Urbana
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  Rural
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
                Ano
              </p>
              <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className="h-2 w-3/4 rounded-full bg-cyan-500/80" />
              </div>
              <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                Slider visual para recorte temporal.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
              Infraestrutura
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                "Internet",
                "Biblioteca",
                "Lab. informática",
                "Acessibilidade",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-2 py-2 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
              Indicadores
            </p>
            <div className="mt-2 space-y-2">
              {[
                "Taxa de abandono",
                "Taxa de reprovação",
                "Docentes com superior",
              ].map((label) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span>{label}</span>
                    <span>0% — 100%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-2 w-1/2 rounded-full bg-violet-500/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-lg border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm dark:border-zinc-700/50 dark:from-zinc-900/50 dark:to-zinc-900/30">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700 dark:text-zinc-200">
          ⚡ Status do Sistema
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Estados</span>
            <span
              className={`text-xs font-semibold ${loading.estados ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
            >
              {loading.estados ? "⟳ Carregando" : "✓ Pronto"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Municípios</span>
            <span
              className={`text-xs font-semibold ${loading.municipios ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
            >
              {loading.municipios ? "⟳ Carregando" : "✓ Pronto"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Bairros</span>
            <span
              className={`text-xs font-semibold ${loading.bairros ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
            >
              {loading.bairros ? "⟳ Carregando" : "✓ Pronto"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Escolas</span>
            <span
              className={`text-xs font-semibold ${loading.escolas ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
            >
              {loading.escolas ? "⟳ Carregando" : "✓ Pronto"}
            </span>
          </li>
        </ul>
      </div>
      <div className="h-4 sm:h-6" />
    </aside>
  );
}
