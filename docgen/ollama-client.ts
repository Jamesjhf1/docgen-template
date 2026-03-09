/**
 * Kaycha DocGen — Ollama Client
 * Minimal fetch-based client for Ollama /api/chat endpoint.
 */

export interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: false;
  think?: boolean;
  options?: { temperature?: number; num_predict?: number };
}

/**
 * Call Ollama /api/chat (non-streaming).
 * Throws on network error or non-200 response.
 */
export async function ollamaChat(
  baseUrl: string,
  request: OllamaChatRequest,
): Promise<OllamaResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`Ollama ${response.status}: ${text}`);
  }

  return response.json() as Promise<OllamaResponse>;
}
