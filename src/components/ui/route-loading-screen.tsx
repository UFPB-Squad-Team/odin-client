export function RouteLoadingScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="grid h-screen w-screen place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_35%),linear-gradient(180deg,_#fafafa,_#f4f7fb)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)] dark:text-zinc-100">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-zinc-200/80 bg-white/85 px-6 py-8 text-center shadow-xl shadow-cyan-500/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-8">
        <div className="flex items-center gap-3 text-cyan-700 dark:text-cyan-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500 dark:border-cyan-950 dark:border-t-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
            Carregando
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-cyan-200/80 dark:bg-cyan-900/60" />
          <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            Processando navegação
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>
    </main>
  );
}