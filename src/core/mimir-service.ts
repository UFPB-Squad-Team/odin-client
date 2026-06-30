const MIMIR_API_URL = process.env.NEXT_PUBLIC_NLP_API_URL as string;

if (!MIMIR_API_URL) {
  throw new Error(
    "MIMIR_API_URL is not defined. Set NEXT_PUBLIC_NLP_API_URL in your environment variables."
  );
}

export interface MimirRequest {
  mensagem: string;
  colecoes?: string[];
}

export interface MimirResponse {
  resposta: string;
  colecoes_consultadas: string[];
}

export const COLECOES_DISPONIVEIS = [
  { id: "escolas", label: "Escolas", icon: "🏫" },
  { id: "municipios", label: "Municípios", icon: "🏙️" },
  { id: "bairros", label: "Bairros", icon: "🏘️" },
  { id: "setores", label: "Setores", icon: "📊" },
] as const;

export async function sendMessage(
  message: string,
  colecoes?: string[]
): Promise<MimirResponse> {
  const body: MimirRequest = { mensagem: message };
  if (colecoes && colecoes.length > 0) {
    body.colecoes = colecoes;
  }

  const res = await fetch(MIMIR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Mimir API error: ${res.status} ${res.statusText}`);
  }

  const data: MimirResponse = await res.json();
  return data;
}