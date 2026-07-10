"use client";

import { useState } from "react";
import { downloadMunicipioDossier } from "@/shell/services/dossier-api";

type DossierDownloadButtonProps = {
  municipioId: string;
  municipioNome: string;
};

export function DossierDownloadButton({
  municipioId,
  municipioNome,
}: DossierDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      await downloadMunicipioDossier(municipioId, municipioNome);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao gerar dossiê";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5 text-sm font-medium text-emerald-700 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-wait dark:text-emerald-300"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Gerando dossiê…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Gerar Dossiê do Município (PDF)
          </>
        )}
      </button>

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400 px-1">
          {error}
        </p>
      )}
    </div>
  );
}