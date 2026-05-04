"use client";

type MapWebGLFallbackProps = {
  onRetry: () => void;
};

export function MapWebGLFallback({ onRetry }: MapWebGLFallbackProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-zinc-100 p-8 dark:bg-zinc-950/60">
      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {/* Ícone */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Mapa indisponível
        </h2>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Seu navegador não conseguiu inicializar o mapa interativo. Isso geralmente acontece quando a aceleração de GPU está desabilitada.
        </p>

        <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-left dark:bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Como resolver:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <li>• No Chrome: acesse <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">chrome://settings/system</code> e ative "Usar aceleração de hardware"</li>
            <li>• Reinicie o navegador após ativar</li>
            <li>• Em ambientes corporativos, a GPU pode estar bloqueada por política</li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Tentar novamente
          </button>
          <a
            href="https://get.webgl.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Verificar suporte WebGL
          </a>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Os filtros e dados na sidebar continuam disponíveis enquanto o mapa não carrega.
      </p>
    </div>
  );
}
