"use client";

import React, { useState, useEffect } from "react";

interface SetorDisclaimerProps {
  /** Bairro atualmente selecionado */
  bairroAtual?: {
    id: string;
    nome: string;
    source?: string;
    temBairroOficial?: boolean;
  } | null;
  /** Callback opcional quando o usuário fecha */
  onDismiss?: () => void;
}

export function SetorDisclaimer({ bairroAtual, onDismiss }: SetorDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostra disclaimer se:
    // 1. Tem bairro selecionado
    // 2. source === "setor_indicadores" (indicando que veio de setor censitário)
    // 3. Não foi descartado pelo usuário
    const shouldShow = bairroAtual?.source === "setor_indicadores" && !dismissed;
    setIsVisible(shouldShow);
  }, [bairroAtual, dismissed]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:top-20 md:max-w-sm animate-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-lg border border-amber-200 bg-amber-50/95 p-3 shadow-lg backdrop-blur-sm dark:border-amber-800/50 dark:bg-amber-950/90">
        <div className="flex gap-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {bairroAtual?.nome || "Esta área"} usa dados por setor censitário
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
              Este município não possui bairros oficiais definidos pelo IBGE.
              Os dados estão agregados por <span className="font-medium">setores censitários</span>.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded p-0.5 text-amber-600 transition hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
            aria-label="Fechar aviso"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
