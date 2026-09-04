import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import type { AlbumQualityResult } from "@/lib/album/types";

const QUALITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["identityScore", "storyScore", "technicalScore", "hasText", "unsafe", "notes"],
  properties: {
    identityScore: { type: "integer", minimum: 0, maximum: 100 },
    storyScore: { type: "integer", minimum: 0, maximum: 100 },
    technicalScore: { type: "integer", minimum: 0, maximum: 100 },
    hasText: { type: "boolean" },
    unsafe: { type: "boolean" },
    notes: { type: "array", maxItems: 4, items: { type: "string" } },
  },
} as const;

type AlbumQualityInput = {
  asset: string;
  candidateDataUrl: string;
  referenceDataUrl?: string;
  prompt: string;
  expectedAspectRatio: "4:3" | "3:2" | "16:9";
  identityRequired: boolean;
  beforeAiCheck?: () => Promise<void>;
  thresholds?: {
    identity?: number;
    story?: number;
    technical?: number;
  };
};

function parseDataUrl(value: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error("Imaginea nu are un format acceptat.");
  return { mimeType: match[1], data: match[2], buffer: Buffer.from(match[2], "base64") };
}

function credentials() {
  const encoded = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  return encoded ? JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) : undefined;
}

function score(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function targetRatio(value: AlbumQualityInput["expectedAspectRatio"]) {
  if (value === "4:3") return 4 / 3;
  if (value === "16:9") return 16 / 9;
  return 3 / 2;
}

async function deterministicCheck(candidateDataUrl: string, expectedAspectRatio: AlbumQualityInput["expectedAspectRatio"]) {
  const candidate = parseDataUrl(candidateDataUrl);
  const image = sharp(candidate.buffer);
  const [metadata, statistics] = await Promise.all([image.metadata(), image.stats()]);
  if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
    throw new Error("image_low_resolution");
  }
  const ratioDifference = Math.abs(metadata.width / metadata.height - targetRatio(expectedAspectRatio));
  if (ratioDifference > 0.28) throw new Error("image_bad_aspect_ratio");
  const average = statistics.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3;
  const contrast = statistics.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) / 3;
  if (average < 18 || average > 247 || contrast < 12 || statistics.entropy < 3.2) {
    throw new Error("image_flat_or_blank");
  }
  return { candidate, technicalScore: Math.round(Math.min(100, 72 + contrast / 2 + statistics.entropy * 1.5)) };
}

export function isAlbumAiQualityEnabled() {
  return process.env.ALBUM_AI_QC_ENABLED?.trim().toLowerCase() !== "false" && Boolean(process.env.VERTEX_AI_PROJECT_ID?.trim());
}

export async function evaluateAlbumImage(input: AlbumQualityInput): Promise<AlbumQualityResult> {
  const deterministic = await deterministicCheck(input.candidateDataUrl, input.expectedAspectRatio);
  const fallback: AlbumQualityResult = {
    asset: input.asset,
    mode: "deterministic",
    accepted: true,
    hardFailure: false,
    identityScore: input.identityRequired ? 70 : 100,
    storyScore: 75,
    technicalScore: deterministic.technicalScore,
    checkedAt: new Date().toISOString(),
    notes: ["Rezoluția, proporțiile, luminozitatea și contrastul sunt conforme."],
  };
  if (!isAlbumAiQualityEnabled()) return fallback;

  try {
    await input.beforeAiCheck?.();
    const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
    if (!project) return fallback;
    const auth = credentials();
    const client = new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.VERTEX_AI_LOCATION?.trim() || "global",
      ...(auth ? { googleAuthOptions: { credentials: auth } } : {}),
    });
    const reference = input.referenceDataUrl ? parseDataUrl(input.referenceDataUrl) : null;
    const parts = [
      ...(reference ? [{ inlineData: { mimeType: reference.mimeType, data: reference.data } }, { text: "IMAGE 1 is the authoritative character reference." }] : []),
      { inlineData: { mimeType: deterministic.candidate.mimeType, data: deterministic.candidate.data } },
      {
        text: `IMAGE ${reference ? "2" : "1"} is the candidate illustration for ${input.asset}. Evaluate it as a premium children's picture-book editor. Check character identity and age consistency${reference ? " against IMAGE 1" : " from the requested description"}, scene relevance, composition, malformed anatomy, duplicate characters, accidental words or watermarks, and child safety. Requested scene: ${input.prompt.slice(0, 2_400)}. Return strict JSON only.`,
      },
    ];
    const response = await withTimeout(client.models.generateContent({
      model: process.env.ALBUM_QC_MODEL?.trim() || "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: QUALITY_SCHEMA,
        maxOutputTokens: 700,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }), readBoundedDuration(process.env.ALBUM_QC_TIMEOUT_MS, 22_000, 8_000, 45_000), "Controlul vizual a depășit timpul de răspuns.");
    const text = response.candidates?.flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join("").trim();
    if (!text) return fallback;
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as Record<string, unknown>;
    const identityScore = score(parsed.identityScore);
    const storyScore = score(parsed.storyScore);
    const technicalScore = Math.min(deterministic.technicalScore, score(parsed.technicalScore));
    const notes = Array.isArray(parsed.notes) ? parsed.notes.map((note) => String(note).replace(/\s+/g, " ").trim().slice(0, 180)).filter(Boolean).slice(0, 4) : [];
    const hardFailure = parsed.unsafe === true || parsed.hasText === true;
    const accepted = !hardFailure
      && technicalScore >= (input.thresholds?.technical ?? 62)
      && storyScore >= (input.thresholds?.story ?? 58)
      && (!input.identityRequired || identityScore >= (input.thresholds?.identity ?? 58));
    return { asset: input.asset, mode: "ai", accepted, hardFailure, identityScore, storyScore, technicalScore, checkedAt: new Date().toISOString(), notes };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("album_budget_")) throw error;
    return { ...fallback, notes: [...fallback.notes, "Controlul semantic a fost indisponibil; s-a folosit verificarea tehnică strictă."] };
  }
}
