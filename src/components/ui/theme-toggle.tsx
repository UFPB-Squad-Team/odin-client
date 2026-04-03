"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Alternar tema"
        className="min-h-10 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-400"
      >
        Tema
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={`Alternar para tema ${isDark ? "claro" : "escuro"}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {isDark ? "🌙 Escuro" : "☀️ Claro"}
    </button>
  );
}
