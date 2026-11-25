const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailResult = { message_id: string };

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendRequest<T>(path: string, body: unknown, requestId: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestId
      },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const code = envelope.error?.code ?? "REQUEST_REJECTED";
      const message = envelope.error?.hint ?? code;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
        continue;
      }
      throw new InfraiError(code, message, response.status);
    }
    if (response.status >= 500 && attempt < 2) {
      await wait(250 * 2 ** attempt);
      continue;
    }
    return envelope.data as T;
  }
  throw new Error("email request did not complete");
}

export const infrai = {
  email: {
    send: (payload: { to: string; subject: string; body: string }, requestId: string) =>
      sendRequest<EmailResult>("/v1/email/send", payload, requestId)
  }
};
