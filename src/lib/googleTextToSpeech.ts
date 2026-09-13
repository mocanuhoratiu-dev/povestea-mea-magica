import { createHash } from "node:crypto";
import { GoogleAuth } from "google-auth-library";
import { NARRATION_MAX_BYTES, NARRATION_MODEL, NARRATION_VERSION, NARRATION_VOICE, narrationBytes, narrationDirections, normalizeNarration, type NarrationKind } from "./narration.ts";

export type { NarrationKind } from "./narration.ts";

export function narrationRequest(text: string, kind: NarrationKind) {
  const normalized = normalizeNarration(text);
  if (!normalized || narrationBytes(normalized) > NARRATION_MAX_BYTES) throw new Error("Invalid narration length.");
  return {
    input: { text: normalized, prompt: narrationDirections[kind] },
    voice: { languageCode: "ro-RO", name: process.env.GOOGLE_TTS_VOICE?.trim() || NARRATION_VOICE, modelName: process.env.GOOGLE_TTS_MODEL?.trim() || NARRATION_MODEL },
    audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000 },
  };
}

export function narrationCacheKey(text: string, kind: NarrationKind) {
  return createHash("sha256").update(JSON.stringify({ version: NARRATION_VERSION, ...narrationRequest(text, kind) })).digest("hex");
}

let auth: GoogleAuth | undefined;
function googleAuth() {
  if (!auth) {
    const encoded = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
    const credentials = encoded ? JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) : undefined;
    auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"], ...(credentials ? { credentials } : {}) });
  }
  return auth;
}

// Bounded, short-lived cache: no child text or audio is written to application logs.
const cache = new Map<string, { audio: Buffer; expires: number }>();
const pending = new Map<string, Promise<Buffer>>();
const CACHE_BYTES = 16 * 1024 * 1024;
let cachedBytes = 0;

async function generate(text: string, kind: NarrationKind) {
  const client = await googleAuth().getClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === "string" ? token : token.token;
  if (!accessToken) throw new Error("TTS authentication failed.");

  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(process.env.VERTEX_AI_PROJECT_ID?.trim()
        ? { "x-goog-user-project": process.env.VERTEX_AI_PROJECT_ID.trim() }
        : {}),
    },
    body: JSON.stringify(narrationRequest(text, kind)),
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`TTS provider returned ${response.status}.`);
  }

  const payload = (await response.json()) as { audioContent?: unknown };
  if (typeof payload.audioContent !== "string" || !payload.audioContent) {
    throw new Error("Google Cloud Text-to-Speech nu a returnat fișierul audio.");
  }
  return Buffer.from(payload.audioContent, "base64");
}

export async function synthesizeRomanianSpeech(text: string, kind: NarrationKind): Promise<Buffer> {
  const key = narrationCacheKey(text, kind);
  for (const [id, item] of cache) {
    if (item.expires <= Date.now()) { cachedBytes -= item.audio.length; cache.delete(id); }
  }
  const existing = cache.get(key);
  if (existing) return existing.audio;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  if (pending.size >= 8) throw new Error("TTS concurrency limit reached.");
  const promise = generate(text, kind).then((audio) => {
    while (cache.size && (cachedBytes + audio.length > CACHE_BYTES || cache.size >= 64)) {
      const first = cache.keys().next().value!;
      cachedBytes -= cache.get(first)!.audio.length;
      cache.delete(first);
    }
    if (audio.length <= CACHE_BYTES) { cache.set(key, { audio, expires: Date.now() + 10 * 60_000 }); cachedBytes += audio.length; }
    return audio;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
