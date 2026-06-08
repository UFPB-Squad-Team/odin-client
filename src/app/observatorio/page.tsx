"use client";

import { Suspense, useEffect, useState } from "react";
import { ModuleBootstrap } from "./module-bootstrap";
import { ObservatorioShell } from "@/shell/components/observatorio-shell";
import { OnboardingModal } from "@/shell/components/onboarding-modal";
import { SetorDisclaimer } from "@/shell/components/setor-disclaimer";
import { useObservatorioShell } from "@/shell/hooks/use-observatorio-shell";

function ObservatorioFallback() {
  return (
    <main className="grid h-screen w-screen place-items-center bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
      Carregando observatório...
    </main>
  );
}

function ObservatorioContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { selected, bairros } = useObservatorioShell();

  const bairroAtual = selected?.kind === "bairro" 
    ? bairros.find(b => b.id === selected.id)
    : null;

  useEffect(() => {
    const hasCompleted = localStorage.getItem("odin:onboarding:completed");
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <>
      <ObservatorioShell />
      
      {showOnboarding && (
        <OnboardingModal 
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      
      <SetorDisclaimer 
        bairroAtual={bairroAtual}
        onDismiss={() => console.log("Disclaimer closed")}
      />
    </>
  );
}

export default function ObservatorioPage() {
  return (
    <Suspense fallback={<ObservatorioFallback />}>
      <ModuleBootstrap />
      <ObservatorioContent />
    </Suspense>
  );
}
