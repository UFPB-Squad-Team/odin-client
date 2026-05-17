"use client";

import { X } from "lucide-react";
import type { RadiusAnalysisResult } from "./types";
import { RADIUS_OPTIONS } from "./types";

type RadiusAnalysisPanelProps = {
  result: RadiusAnalysisResult | null;
  radiusMeters: number;
  onRadiusChange: (radius: number) => void;
  onClose: () => void;
};

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

function formatNum(value: number | null): string {
  if (value === null) return "—";
  return Math.round(value).toLocaleString("pt-BR");
}

/**
 * Painel de resultados da análise por raio.
 * Mostra indicadores agregados das features dentro do raio selecionado.
 */
export function RadiusAnalysisPanel({
  result,
  radiusMeters,
  onRadiusChange,
  onClose,
}: RadiusAnalysisPanelProps) {
  if (!result) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-background/95 backdrop-blur-md p-4 shadow-xl w-[260px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
            Análise por raio
          </span>
          <button type="button" onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Clique em qualquer ponto do mapa para analisar a área ao redor.
        </p>
        <div className="mt-3 flex gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onRadiusChange(opt.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition ${
                radiusMeters === opt.value
                  ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-background/95 backdrop-blur-md shadow-xl w-[280px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
            Análise por raio
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {result.featuresIncluded} áreas · raio de {radiusMeters >= 1000 ? `${radiusMeters / 1000}km` : `${radiusMeters}m`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted">
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Radius selector */}
      <div className="px-4 py-2 border-b border-border/30 flex gap-1.5">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onRadiusChange(opt.value)}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition ${
              radiusMeters === opt.value
                ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-[300px] overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {/* Educação */}
        {Object.keys(result.educacao).length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1.5">
              Educação
            </p>
            <div className="flex flex-col gap-1">
              {result.educacao.totalEscolas != null && (
                <Row label="Escolas" value={formatNum(result.educacao.totalEscolas)} />
              )}
              {result.educacao.totalMatriculas != null && (
                <Row label="Matrículas" value={formatNum(result.educacao.totalMatriculas)} />
              )}
              {result.educacao.pctComInternet != null && (
                <Row label="Com internet" value={formatPct(result.educacao.pctComInternet)} />
              )}
              {result.educacao.pctComBiblioteca != null && (
                <Row label="Com biblioteca" value={formatPct(result.educacao.pctComBiblioteca)} />
              )}
              {result.educacao.pctComLaboratorioInformatica != null && (
                <Row label="Lab. informática" value={formatPct(result.educacao.pctComLaboratorioInformatica)} />
              )}
              {result.educacao.pctSemAcessibilidade != null && (
                <Row label="Sem acessibilidade" value={formatPct(result.educacao.pctSemAcessibilidade)} />
              )}
            </div>
          </div>
        )}

        {/* Socioeconômico */}
        {Object.keys(result.socioeconomico).length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1.5">
              Socioeconômico
            </p>
            <div className="flex flex-col gap-1">
              {result.socioeconomico.populacaoTotal != null && (
                <Row label="População" value={formatNum(result.socioeconomico.populacaoTotal)} />
              )}
              {result.socioeconomico.pctAguaRedeGeral != null && (
                <Row label="Água rede geral" value={formatPct(result.socioeconomico.pctAguaRedeGeral)} />
              )}
              {result.socioeconomico.pctEsgotoRedeGeral != null && (
                <Row label="Esgoto rede geral" value={formatPct(result.socioeconomico.pctEsgotoRedeGeral)} />
              )}
              {result.socioeconomico.pctLixoColetado != null && (
                <Row label="Lixo coletado" value={formatPct(result.socioeconomico.pctLixoColetado)} />
              )}
              {result.socioeconomico.pctPretaParda != null && (
                <Row label="Pop. preta/parda" value={formatPct(result.socioeconomico.pctPretaParda)} />
              )}
            </div>
          </div>
        )}

        {result.featuresIncluded === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Nenhuma área encontrada neste raio. Tente aumentar o raio.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
