import { Suspense } from "react";
import { ObservatorioShell } from "@/components/features/observatorio/observatorio-shell";

function ObservatorioFallback() {
  return (
    <main className="grid h-screen w-screen place-items-center bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
      Carregando observatório...
    </main>
  );
}

export default function ObservatorioPage() {
  return (
    <Suspense fallback={<ObservatorioFallback />}>
      <ObservatorioShell />
    </Suspense>
  );
}
