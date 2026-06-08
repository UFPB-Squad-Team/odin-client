"use client";

import React, { useEffect, useState } from "react";
import { startObservatorioTour } from "../components/tour/observatorio-tour";

const ONBOARDING_STORAGE_KEY = "odin:onboarding:completed";

interface OnboardingModalProps {
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      setIsOpen(true);
    }
  }, []);

  const handleStartTour = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOpen(false);
    // Inicia o tour específico do observatório
    setTimeout(() => {
      startObservatorioTour();
    }, 100);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOpen(false);
    onComplete?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Logo ODIN */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-cyan-100 p-4 dark:bg-cyan-900/30">
            <span className="text-3xl">🦉</span>
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Bem-vindo ao <span className="text-cyan-600 dark:text-cyan-400">Observatório ODIN</span>
        </h2>
        
        <p className="mb-6 text-center text-zinc-600 dark:text-zinc-400">
          Explore dados de Educação e Socioeconômico no Nordeste
        </p>

        <div className="mb-6 space-y-3">
          <div className="rounded-lg bg-cyan-50 p-3 dark:bg-cyan-950/30">
            <p className="text-sm text-cyan-800 dark:text-cyan-300">
              🎯 <span className="font-medium">Tour guiado</span> — Vamos mostrar as principais funcionalidades em 7 passos.
            </p>
          </div>
          
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              📊 <span className="font-medium">3 camadas</span>: Município, Bairro e Escola • Indicadores dinâmicos • Comparação entre territórios
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Pular tour
          </button>
          
          <button
            onClick={handleStartTour}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 active:scale-[0.98]"
          >
            Iniciar tour 🚀
          </button>
        </div>
        
        <p className="mt-4 text-center text-xs text-zinc-400">
          Você pode refazer o tour nas configurações
        </p>
      </div>
    </div>
  );
};
