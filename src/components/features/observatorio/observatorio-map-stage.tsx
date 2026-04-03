import type { MapEntity, ObservatoryLayer } from "@/types/observatory";

type MapStageProps = {
  activeLayer: ObservatoryLayer;
  entities: MapEntity[];
  isDetailsOpen: boolean;
  onCloseDetails: () => void;
  onSelect: (entity: MapEntity) => void;
  selectedId?: string;
};

const LAYER_LABEL: Record<ObservatoryLayer, string> = {
  municipio: "Municípios",
  bairro: "Bairros",
  escola: "Escolas",
};

export function ObservatorioMapStage({
  activeLayer,
  entities,
  isDetailsOpen,
  onCloseDetails,
  onSelect,
  selectedId,
}: MapStageProps) {
  return (
    <section className="relative h-full min-h-[50vh] overflow-hidden bg-zinc-100 dark:bg-zinc-950/60 sm:min-h-[60vh]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_75%_70%,rgba(139,92,246,0.15),transparent_42%)]" />

      <div className="absolute left-2 top-2 z-20 rounded-lg border border-zinc-300/90 bg-white/90 px-2 py-1 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 sm:left-4 sm:top-4 sm:px-3 sm:py-2">
        <p className="font-semibold text-cyan-600 dark:text-cyan-400">
          Mapa (fase 2)
        </p>
        <p className="mt-0.5 text-[11px] sm:text-xs">
          Camada: {LAYER_LABEL[activeLayer]}
        </p>
        {isDetailsOpen ? (
          <button
            type="button"
            onClick={onCloseDetails}
            className="mt-1 inline-flex rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:mt-2 sm:text-[11px]"
          >
            Fechar painel
          </button>
        ) : null}
      </div>

      <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl border border-zinc-300/90 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:inset-x-4 sm:bottom-4 sm:p-3 md:inset-x-auto md:right-4 md:w-[28rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 sm:text-xs">
          Entidades
        </p>

        <div className="mt-2 max-h-40 overflow-auto pr-1 sm:max-h-48">
          {entities.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 px-2 py-2 text-[12px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:px-3 sm:py-2 sm:text-sm">
              Nenhuma entidade.
            </p>
          ) : (
            <div className="grid gap-2">
              {entities.map((entity) => {
                const active = entity.data.id === selectedId;

                return (
                  <button
                    key={entity.data.id}
                    type="button"
                    onClick={() => onSelect(entity)}
                    className={`rounded-md border px-2 py-1 text-left text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 sm:px-3 sm:py-2 sm:text-sm ${
                      active
                        ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                        : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {entity.data.nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <div className="rounded-xl border border-zinc-300/80 bg-white/80 px-4 py-3 text-center shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 sm:px-5 sm:py-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 sm:text-xs">
            Fase 2 · App Shell
          </p>
          <p className="mt-1 text-[12px] text-zinc-700 dark:text-zinc-200 sm:text-sm">
            Área pronta para Mapbox · Fase 3.
          </p>
        </div>
      </div>
    </section>
  );
}
