"use client";

import type { Municipio } from "@/core/types/territory";

type BairroMunicipioSelectorProps = {
  municipios: Municipio[];
  municipioId: string | null;
  onMunicipioChange: (id: string) => void;
  totalBairros: number;
  isLoading?: boolean;
  temBairroOficialNoMunicipio?: boolean;
};

export function BairroMunicipioSelector({
  municipios,
  municipioId,
  onMunicipioChange,
  totalBairros,
  isLoading = false,
  temBairroOficialNoMunicipio,
}: BairroMunicipioSelectorProps) {
  const selectedMunicipio = municipios.find((m) => m.id === municipioId);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <label
        htmlFor="bairro-municipio-select"
        className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
      >
        Município
      </label>
      <select
        id="bairro-municipio-select"
        value={municipioId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) onMunicipioChange(value);
        }}
        disabled={isLoading || municipios.length === 0}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {municipios.length === 0 && (
          <option value="">Carregando municípios...</option>
        )}
        {municipios.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {isLoading
            ? "Buscando bairros..."
            : totalBairros > 0
            ? `${totalBairros} bairro${totalBairros !== 1 ? "s" : ""} encontrado${totalBairros !== 1 ? "s" : ""}`
            : selectedMunicipio
            ? "Nenhum bairro encontrado"
            : "Selecione um município"}
        </p>
        {municipioId && (
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            {municipioId}
          </span>
        )}
      </div>

      {temBairroOficialNoMunicipio === false && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
          Dados disponíveis via setor censitário (sem delimitação oficial de bairros)
        </p>
      )}
    </div>
  );
}