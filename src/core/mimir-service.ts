const MIMIR_API_URL = process.env.NEXT_PUBLIC_NLP_API_URL as string;

if (!MIMIR_API_URL) {
  throw new Error(
    "MIMIR_API_URL is not defined. Set NEXT_PUBLIC_NLP_API_URL in your environment variables."
  );
}

export interface MimirRequest {
  mensagem: string;
}

export interface MimirResponse {
  resposta: string;
}

export async function sendMessage(message: string): Promise<string> {
  const res = await fetch(MIMIR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mensagem: message } satisfies MimirRequest),
  });

  if (!res.ok) {
    throw new Error(`Mimir API error: ${res.status} ${res.statusText}`);
  }

  const data: MimirResponse = await res.json();
  return data.resposta;
}
