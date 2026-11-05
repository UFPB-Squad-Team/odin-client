"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export function SetorDisclaimer() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50/95 p-3 shadow-sm backdrop-blur-sm dark:border-amber-800/50 dark:bg-amber-950/90"
    >
      <div className="flex items-start gap-2">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
            Exibindo setores censitários
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            Este município não tem delimitação de bairros disponível na base do IBGE.
            Por isso, nesta granularidade, exibimos setores censitários em vez de bairros.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/50"
          aria-label="Fechar aviso sobre setores censitários"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
