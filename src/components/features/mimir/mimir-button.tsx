"use client";

import Link from "next/link";
import { useState } from "react";

export function MimirButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/mimir"
      aria-label="Pergunte ao Mimir - Assistente IA do ODIN"
      className="group fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-zinc-900/90 shadow-lg shadow-zinc-900/20 backdrop-blur transition-all duration-300 ease-out hover:scale-110 hover:bg-zinc-800 hover:shadow-cyan-500/20 dark:bg-zinc-100/90 dark:shadow-zinc-950/30 dark:hover:bg-zinc-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="size-7 transition-transform duration-300 group-hover:rotate-12"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-400 dark:text-cyan-500"
        />
        <circle
          cx="24"
          cy="24"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-cyan-400/60 dark:text-cyan-500/60"
        />
        <circle
          cx="24"
          cy="24"
          r="4"
          className="fill-cyan-400 dark:fill-cyan-500"
        />
        <line
          x1="24"
          y1="2"
          x2="24"
          y2="8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/40 dark:text-cyan-500/40"
        />
        <line
          x1="24"
          y1="40"
          x2="24"
          y2="46"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/40 dark:text-cyan-500/40"
        />
        <line
          x1="2"
          y1="24"
          x2="8"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/40 dark:text-cyan-500/40"
        />
        <line
          x1="40"
          y1="24"
          x2="46"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/40 dark:text-cyan-500/40"
        />
        <line
          x1="8.5"
          y1="8.5"
          x2="12.5"
          y2="12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/30 dark:text-cyan-500/30"
        />
        <line
          x1="35.5"
          y1="35.5"
          x2="39.5"
          y2="39.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/30 dark:text-cyan-500/30"
        />
        <line
          x1="39.5"
          y1="8.5"
          x2="35.5"
          y2="12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/30 dark:text-cyan-500/30"
        />
        <line
          x1="12.5"
          y1="35.5"
          x2="8.5"
          y2="39.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-cyan-400/30 dark:text-cyan-500/30"
        />
      </svg>

      <span
        className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${
          hovered
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0 pointer-events-none"
        }`}
      >
        Pergunte ao Mimir
      </span>
    </Link>
  );
}