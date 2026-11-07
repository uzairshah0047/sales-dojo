import type {
  ChatRequest,
  ChatResponse,
  EvaluateRequest,
  Evaluation,
} from "@shared/sellio";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      (response.status === 502
        ? "Kunden svarte ikke. Prøv igjen."
        : "Noe gikk galt. Prøv igjen.");
    throw new ApiError(message, response.status, (payload as { error?: string } | null)?.error);
  }

  return payload as T;
}

export function postChat(body: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", body);
}

export function postEvaluate(body: EvaluateRequest): Promise<Evaluation> {
  return request<Evaluation>("/api/evaluate", body);
}

export interface VoiceConfig {
  configured: boolean;
  provider: string;
  model: string;
}

export function getVoiceConfig(): Promise<VoiceConfig> {
  return request<VoiceConfig>("/api/voice/config");
}

export async function postSpeech(
  text: string,
  gender: "female" | "male",
  key?: string
): Promise<Blob> {
  const response = await fetch("/api/voice/tts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { "x-elevenlabs-key": key } : {}),
    },
    body: JSON.stringify({ text, gender }),
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .catch(() => ({}) as { error?: string });
    throw new ApiError(
      (detail as { error?: string }).error ?? "tts_failed",
      response.status,
      (detail as { error?: string }).error
    );
  }

  return response.blob();
}
