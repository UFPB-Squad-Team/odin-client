"use client";

import { useState, useTransition } from "react";
import { HelpCircle } from "lucide-react";
import { startOdinTour } from "@/shell/components/tour/tour-provider";

export function LandingTourButton() {
  const [isPending, startTransition] = useTransition();
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (hasStarted) return;

        setHasStarted(true);
        startTransition(() => {
          void startOdinTour();
        });
      }}
      disabled={isPending}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-70 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Como funciona</span>
    </button>
  );
}