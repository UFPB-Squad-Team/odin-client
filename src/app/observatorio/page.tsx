"use client";

import { Suspense, useEffect, useState } from "react";
import { ModuleBootstrap } from "./module-bootstrap";
import { ObservatorioShell } from "@/shell/components/observatorio-shell";
import { OnboardingModal } from "@/shell/components/onboarding-modal";

function ObservatorioFallback() {
  return (
    <main className="grid h-screen w-screen place-items-center bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
      Carregando observatório...
    </main>
  );
}

function ObservatorioContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);

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
