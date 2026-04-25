import type { Municipio, Bairro } from "@/core/types/territory";
import type { SocioeconomicoResumo } from "@/modules/socioeconomico/types/socioeconomico";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function notConfiguredMessage(endpoint: string) {
  return `Endpoint ${endpoint} indisponível em modo local sem NEXT_PUBLIC_API_BASE_URL.`;
}

export async function getMunicipioResumoSocioeconomico(
  municipioId: string,
): Promise<SocioeconomicoResumo | null> {
  if (!API_BASE_URL) return null;
  const response = await fetch(
    `${API_BASE_URL}/municipios/${municipioId}/resumo/socioeconomico`,
  );
  if (!response.ok) throw new Error(notConfiguredMessage(`/municipios/${municipioId}/resumo/socioeconomico`));
  return (await response.json()) as SocioeconomicoResumo;
}

export async function getBairroResumoSocioeconomico(
  bairroId: string,
): Promise<SocioeconomicoResumo | null> {
  if (!API_BASE_URL) return null;
  const response = await fetch(
    `${API_BASE_URL}/bairros/${bairroId}/resumo/socioeconomico`,
  );
  if (!response.ok) throw new Error(notConfiguredMessage(`/bairros/${bairroId}/resumo/socioeconomico`));
  return (await response.json()) as SocioeconomicoResumo;
}

// Tipos re-exportados para conveniência interna do módulo
export type { Municipio, Bairro };
