"use client";

/**
 * API service for generating municipio/state dossiê PDFs.
 *
 * The PDF is generated entirely in-memory on the backend and streamed
 * directly as a download (Content-Disposition: attachment).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Generate and download a municipio dossier PDF.
 *
 * @param municipioId - 7-digit IBGE code
 * @param municipioNome - Name used for the filename fallback
 */
export async function downloadMunicipioDossier(
  municipioId: string,
  municipioNome: string,
): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL não configurada");
  }

  const url = `${API_BASE_URL}/municipios/${municipioId}/dossie`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    console.error("[dossier-api] Network error:", networkError);
    throw new Error(
      "Não foi possível conectar ao servidor."
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Erro desconhecido");
    console.error(`[dossier-api] HTTP ${response.status}:`, errorText);

    if (response.status === 404) {
      throw new Error(
        `Município não encontrado. Verifique o código IBGE: ${municipioId}`,
      );
    }
    throw new Error(
      `Erro ao gerar dossiê`,
    );
  }

  const blob = await response.blob();
  const filename = `dossie_${municipioNome.toLowerCase().replace(/\s+/g, "_")}_${municipioId}.pdf`;

  triggerDownload(blob, filename);
}

/**
 * Generate and download a state dossier PDF.
 *
 * @param sgUf - 2-letter state code (e.g., "PB")
 * @param estadoNome - State name used for the filename fallback
 */
export async function downloadStateDossier(
  sgUf: string,
  estadoNome: string,
): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL não configurada");
  }

  const url = `${API_BASE_URL}/estados/${sgUf.toUpperCase()}/dossie`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    console.error("[dossier-api] Network error:", networkError);
    throw new Error(
      "Não foi possível conectar ao servidor."
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Erro desconhecido");
    console.error(`[dossier-api] HTTP ${response.status}:`, errorText);

    if (response.status === 404) {
      throw new Error(
        `Estado não encontrado ou sem dados disponíveis: ${sgUf}`,
      );
    }
    throw new Error(
      `Erro ao gerar dossiê do estado`,
    );
  }

  const blob = await response.blob();
  const filename = `dossie_${estadoNome.toLowerCase().replace(/\s+/g, "_")}_${sgUf.toUpperCase()}.pdf`;

  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 100);
}