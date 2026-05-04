"use client";

import { HelpCircle } from "lucide-react";
import { startOdinTour } from "@/shell/components/tour/tour-provider";

export function LandingTourButton() {
  return (
    <button
      type="button"
      onClick={() => startOdinTour()}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Como funciona</span>
    </button>
  );
}