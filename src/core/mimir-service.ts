const MIMIR_API_URL = process.env.NEXT_PUBLIC_NLP_API_URL as string;

if (!MIMIR_API_URL) {
  throw new Error(
    "MIMIR_API_URL is not defined. Set NEXT_PUBLIC_NLP_API_URL in your environment variables."
  );
}

export interface MimirRequest {
  mensagem: string;
  colecoes?: string[];
  ignorar_cache?: boolean;
}

export interface MimirResponse {
  resposta: string;
  colecoes_consultadas: string[];
  component: "text" | "table";
  payload: Record<string, unknown>[];
  colunas: string[];
  rotulos: string[];
  /** Fonte da resposta: 'rag' | 'cache' | 'fallback' */
  fonte: string;
  /** Nível de confiança: 'alta' | 'media' | 'baixa' */
  confianca: string;
}

export const COLECOES_DISPONIVEIS = [
  { id: "escolas", label: "Escolas", icon: "🏫" },
  { id: "municipios", label: "Municípios", icon: "🏙️" },
  { id: "bairros", label: "Bairros", icon: "🏘️" },
  { id: "setores", label: "Setores", icon: "📊" },
] as const;

export async function sendMessage(
  message: string,
  colecoes?: string[],
  ignorarCache: boolean = false
): Promise<MimirResponse> {
  const body: MimirRequest = { mensagem: message };
  if (colecoes && colecoes.length > 0) {
    body.colecoes = colecoes;
  }
  if (ignorarCache) {
    body.ignorar_cache = true;
  }

  const res = await fetch(MIMIR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Tenta extrair mensagem de erro do corpo
    let detail = `Erro ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody.detail) detail = errBody.detail;
    } catch {
      // ignora
    }
    throw new Error(detail);
  }

  const data: MimirResponse = await res.json();
  return data;
}