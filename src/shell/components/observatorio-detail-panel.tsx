"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listModules } from "@/core/registry/module-registry";
import { TerritoryDetailPanel } from "@/shell/components/territory-detail-panel";
import type {
  ObservatorySelection,
  ShellContextType,
  MapEntity,
} from "@/core/types/shell";

type DetailPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  selection: ObservatorySelection | null;
  activeModuleId?: string | null;
  shellContext?: ShellContextType;
  onNavigate?: (entity: MapEntity) => void;
};

function layerLabel(kind: ObservatorySelection["kind"]) {
  if (kind === "municipio") return "Município";
  if (kind === "bairro") return "Vizinhança";
  return "Escola";
}

export function ObservatorioDetailPanel({
  isOpen,
  onClose,
  selection,
  activeModuleId,
  shellContext,
  onNavigate,
}: DetailPanelProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setIsNavigating(false);
  }, [isOpen]);

  function navigateToCompare(
    primaryKind: string,
    primaryId: string,
    primaryName: string,
    primarySubtitle: string,
    primaryMetrics?: Array<{ label: string; value: string; description?: string }>,
    primaryMunicipioId?: string,
    secondaryKind?: string,
    secondaryId?: string,
    secondaryName?: string,
    secondarySubtitle?: string,
    secondaryMetrics?: Array<{ label: string; value: string; description?: string }>,
    secondaryMunicipioId?: string,
  ) {
    setIsNavigating(true);
    const params = new URLSearchParams({
      primaryKind,
      primaryId,
      primaryName,
      primarySubtitle,
      ...(primaryMetrics ? { primaryMetrics: JSON.stringify(primaryMetrics) } : {}),
      ...(primaryMunicipioId ? { primaryMunicipioId } : {}),
      ...(secondaryKind && secondaryId && secondaryName && secondarySubtitle
        ? {
            secondaryKind,
            secondaryId,
            secondaryName,
            secondarySubtitle,
            ...(secondaryMetrics ? { secondaryMetrics: JSON.stringify(secondaryMetrics) } : {}),
            ...(secondaryMunicipioId ? { secondaryMunicipioId } : {}),
          }
        : {}),
    });
    router.push(`/observatorio/compare?${params.toString()}`);
    onClose();
  }

  const handleCompareClick = () => {
    if (!selection || !shellContext) return;
    const primaryMunicipioId =
      selection.kind === "bairro"
        ? (selection.sourceEntity?.kind === "bairro"
            ? selection.sourceEntity.data.municipioId
            : shellContext.filters.municipioId) ?? undefined
        : undefined;

    navigateToCompare(
      selection.kind,
      selection.id,
      selection.nome,
      selection.subtitle || "",
      selection.metrics,
      primaryMunicipioId,
    );
  };

  const handleCompareWithSelectedClick = () => {
    if (!selection || !shellContext || !primary) return;
    const primaryMunicipioId =
      primary.kind === "bairro"
        ? (primary.sourceEntity?.kind === "bairro"
            ? primary.sourceEntity.data.municipioId
            : shellContext.filters.municipioId) ?? undefined
        : undefined;
    const secondaryMunicipioId =
      selection.kind === "bairro"
        ? (selection.sourceEntity?.kind === "bairro"
            ? selection.sourceEntity.data.municipioId
            : shellContext.filters.municipioId) ?? undefined
        : undefined;

    navigateToCompare(
      primary.kind,
      primary.id,
      primary.nome,
      primary.subtitle || "",
      primary.metrics,
      primaryMunicipioId,
      selection.kind,
      selection.id,
      selection.nome,
      selection.subtitle || "",
      selection.metrics,
      secondaryMunicipioId,
    );
  };

  const primary = shellContext?.comparePrimarySelection ?? null;
  const isSameAsPrimary = Boolean(
    primary &&
      selection &&
      primary.id === selection.id &&
      primary.kind === selection.kind,
  );

  const showCompareButton = selection?.kind !== "escola";

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Fechar painel de detalhes"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-[1px]"
        />
      ) : null}

      <aside
        aria-label="Painel de detalhes"
        className={`fixed bottom-0 right-0 top-auto z-[60] max-h-[92dvh] w-full overflow-y-auto border-t border-zinc-300 bg-white/95 p-3 shadow-xl backdrop-blur transition-transform duration-200 dark:border-zinc-700 dark:bg-zinc-900/95 sm:top-0 sm:max-h-[100dvh] sm:w-[22rem] sm:border-l sm:border-t-0 sm:p-4 ${
          isOpen
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-[105%] sm:translate-x-[105%]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 sm:text-xs">
              Detalhes
            </p>
            <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">
              {selection?.nome ?? "Nenhuma seleção"}
            </h2>
            {selection ? (
              <p className="mt-1 truncate text-[11px] text-zinc-600 dark:text-zinc-300 sm:text-xs">
                {layerLabel(selection.kind)} · {selection.subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {selection && shellContext && showCompareButton ? (
              <>
                {!primary ? (
                  <button
                    type="button"
                    disabled={isNavigating}
                    onClick={handleCompareClick}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-600 bg-cyan-50 px-2 py-1 text-[10px] font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-500/30 dark:bg-cyan-900/30 dark:text-cyan-200 sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    {isNavigating ? (
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : null}
                    Comparar
                  </button>
                ) : isSameAsPrimary ? (
                  <span className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-400 sm:px-3 sm:py-1.5 sm:text-xs">
                    Selecionado
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isNavigating}
                    onClick={handleCompareWithSelectedClick}
                    className="inline-flex items-center gap-1.5 rounded-md border border-indigo-600 bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-600/30 dark:bg-indigo-900/30 dark:text-indigo-200 sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    {isNavigating ? (
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : null}
                    Comparar com selecionado
                  </button>
                )}
              </>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              Fechar
            </button>
          </div>
        </div>

        {selection ? (
          (() => {
            if (shellContext && onNavigate) {
              // Resolve a entidade com dados completos (geoProps)
              const entity: MapEntity = (() => {
                // 1. sourceEntity do selection (mais completo)
                if (selection.sourceEntity) return selection.sourceEntity;

                // 2. selectedEntity do shell context
                if (
                  shellContext.selectedEntity &&
                  shellContext.selectedEntity.kind === selection.kind &&
                  shellContext.selectedEntity.data.id === selection.id
                ) {
                  return shellContext.selectedEntity;
                }

                // 3. Busca na lista de entidades do shell
                if (selection.kind === "municipio") {
                  const found = shellContext.municipios.find((m) => m.id === selection.id);
                  if (found) return { kind: "municipio" as const, data: found };
                }
                if (selection.kind === "bairro") {
                  const found = shellContext.bairros.find((b) => b.id === selection.id);
                  if (found) return { kind: "bairro" as const, data: found };
                }
                if (selection.kind === "escola") {
                  const found = shellContext.escolas.find((e) => e.id === selection.id);
                  if (found) return { kind: "escola" as const, data: found };
                }

                // 4. Fallback mínimo
                return {
                  kind: selection.kind,
                  data:
                    selection.kind === "municipio"
                      ? { id: selection.id, nome: selection.nome, estadoId: shellContext.filters.estadoId ?? "" }
                      : selection.kind === "bairro"
                        ? { id: selection.id, nome: selection.nome, municipioId: shellContext.filters.municipioId ?? "" }
                        : { id: selection.id, nome: selection.nome, bairroId: "" },
                } as MapEntity;
              })();

              const showNeighborhoodSummary = selection.kind === "bairro";
              const municipalityName =
                shellContext.municipios.find(
                  (municipio) => municipio.id === shellContext.filters.municipioId,
                )?.nome ??
                (shellContext.selectedEntity?.kind === "municipio"
                  ? shellContext.selectedEntity.data.nome
                  : undefined);

              return (
                <div className="flex flex-col gap-4">
                  {showNeighborhoodSummary ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-200">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                        Vizinhança selecionada
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                        {selection.nome}
                      </div>
                      {municipalityName ? (
                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          Município: {municipalityName}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <TerritoryDetailPanel entity={entity} />
                </div>
              );
            }

            return (
              <div className="mt-3 space-y-2 sm:mt-4">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300 sm:px-3 sm:text-xs">
                  {(() => {
                    const src =
                      selection.sourceEntity?.data ??
                      shellContext?.selectedEntity?.data;
                    const raw = (src ?? {}) as Record<string, unknown>;
                    const inep = (raw.inepId ??
                      raw.escola_id_inep ??
                      raw.escolaId ??
                      selection.id) as string | number;
                    const ibge = (raw.municipioId ??
                      raw.municipioIdIbge ??
                      raw.municipio_id_ibge ??
                      raw.municipio_id ??
                      "—") as string;
                    const matriculasObj = raw.matriculas as
                      | Record<string, unknown>
                      | undefined;
                    const alunos = (matriculasObj?.totalAlunos ??
                      raw.totalAlunos ??
                      raw.total_alunos ??
                      raw.alunos ??
                      "—") as string | number;
                    return (
                      <>
                        <div className="text-[11px]">
                          IBGE: <strong className="ml-1">{String(ibge)}</strong>
                        </div>
                        <div className="text-[11px]">
                          INEP: <strong className="ml-1">{String(inep)}</strong>
                        </div>
                        <div className="text-[11px]">
                          Alunos: <strong className="ml-1">{String(alunos)}</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {selection.metrics?.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-950/70 sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <span className="text-zinc-600 dark:text-zinc-300">{metric.label}</span>
                    <strong className="truncate">{metric.value}</strong>
                  </div>
                ))}

                {selection.sections?.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950/70 sm:p-3"
                  >
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300">
                      {section.title}
                    </h3>
                    <div className="mt-2 space-y-1.5">
                      {section.rows.map((row) => (
                        <div
                          key={`${section.title}-${row.label}`}
                          className="flex items-center justify-between gap-2 text-[12px] sm:text-sm"
                        >
                          <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                          <strong className="text-right">{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            );
          })()
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-2 py-2 text-[12px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:mt-4 sm:px-3 sm:text-sm">
            Selecione uma entidade para ver detalhes.
          </p>
        )}
      </aside>
    </>
  );
}