"use client";

import { useEffect, useState } from "react";

type ShareLinkButtonProps = {
  getUrl: () => string;
};

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function ShareLinkButton({ getUrl }: ShareLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status !== "copied" && status !== "error") return;

    const timeout = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleCopy = async () => {
    try {
      await copyText(getUrl());
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };

  const label =
    status === "copied"
      ? "Link copiado"
      : status === "error"
        ? "Falha ao copiar"
        : "Compartilhar";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 ${status === "copied" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300" : status === "error" ? "border-rose-500/50 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:border-cyan-400/30 dark:text-cyan-300"}`}
      aria-live="polite"
    >
      <span className="text-sm leading-none">{status === "copied" ? "✓" : status === "error" ? "!" : "↗"}</span>
      <span>{label}</span>
    </button>
  );
}