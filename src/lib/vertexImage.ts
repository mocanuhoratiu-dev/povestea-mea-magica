import { GoogleGenAI, Modality } from "@google/genai";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";

export type CoverGenerationResult =
  | { imageDataUrl: string; model: string; error?: never }
  | { imageDataUrl?: never; model?: never; error: string };

type ImageAspectRatio = "1:1" | "4:3" | "3:2" | "16:9";

function getVertexCredentials() {
  const encodedCredentials = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encodedCredentials) return undefined;

  try {
    return JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
  } catch {
    throw new Error("VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64 nu conține un JSON Base64 valid.");
  }
}

function getImageModels() {
  const configuredModels = [
    process.env.VERTEX_AI_IMAGE_MODEL,
    ...(process.env.VERTEX_AI_IMAGE_FALLBACK_MODELS || "").split(","),
    "gemini-3.1-flash-image",
  ];

  const models = Array.from(
    new Set(
      configuredModels
        .map((model) => model?.trim())
        .filter((model): model is string => Boolean(model))
    )
  );

  return models.slice(0, readBoundedDuration(process.env.VERTEX_AI_IMAGE_MAX_MODELS, 2, 1, 3));
}

function cleanCoverPrompt(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3_600);
}

function parseReferenceImage(value?: string) {
  if (!value) return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(value);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

async function generateVertexImage({
  prompt,
  aspectRatio,
  referenceImageDataUrl,
  timeoutEnvironment,
  imageSize,
  beforeAttempt,
}: {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  referenceImageDataUrl?: string;
  timeoutEnvironment: "cover" | "album";
  imageSize: "1K" | "2K";
  beforeAttempt?: () => Promise<void>;
}): Promise<CoverGenerationResult> {
  const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
  const cleanPrompt = cleanCoverPrompt(prompt);

  if (!project) return { error: "VERTEX_AI_PROJECT_ID lipsește din configurare." };
  if (!cleanPrompt) return { error: "Promptul pentru copertă este gol." };

  const errors: string[] = [];
  const timeoutMs = readBoundedDuration(
    timeoutEnvironment === "album" ? process.env.ALBUM_IMAGE_TIMEOUT_MS : process.env.VERTEX_AI_COVER_TIMEOUT_MS,
    45_000,
    8_000,
    75_000,
  );
  let client: GoogleGenAI;
  try {
    const credentials = getVertexCredentials();
    client = new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.VERTEX_AI_LOCATION?.trim() || "global",
      ...(credentials ? { googleAuthOptions: { credentials } } : {}),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Vertex AI nu a putut fi configurat pentru copertă." };
  }
  const reference = parseReferenceImage(referenceImageDataUrl);
  const contents = reference
    ? [{
        role: "user",
        parts: [
          { inlineData: reference },
          {
            text: [
              "Use the attached image only as the authoritative character-design reference.",
              "Preserve the child's face, age, skin tone, hairstyle, hair color, outfit palette and the companion's design exactly; do not redesign them.",
              "Create a new composition and action for this page, without copying the reference background or pose.",
              cleanPrompt,
            ].join(" "),
          },
        ],
      }]
    : cleanPrompt;

  for (const model of getImageModels()) {
    try {
      await beforeAttempt?.();
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents,
          config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio, imageSize },
          },
        }),
        timeoutMs,
        `Imaginea generată cu ${model} a depășit timpul de răspuns.`
      );
      const imagePart = response.candidates
        ?.flatMap((candidate) => candidate.content?.parts || [])
        .find((part) => part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/"));
      const imageData = imagePart?.inlineData?.data;
      const mimeType = imagePart?.inlineData?.mimeType || "image/png";

      if (imageData) {
        return { imageDataUrl: `data:${mimeType};base64,${imageData}`, model };
      }

      errors.push(`${model}: nu a returnat o imagine.`);
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "eroare necunoscută"}`);
    }
  }

  return { error: errors.join(" | ") || "Vertex AI nu a putut genera imaginea." };
}

/** Generates a temporary data URL. Cloud Run authenticates through its service account. */
export async function generateVertexStoryCover(prompt: string): Promise<CoverGenerationResult> {
  return generateVertexImage({
    prompt: [
      "Create exactly one square, print-quality illustration for a personalised Romanian children's storybook cover.",
      prompt,
      "Use warm watercolor and gouache children's-book art, soft magical bedtime lighting, and a clearly readable main character.",
      "Do not include any words, letters, title text, logo, watermark, frame, or collage.",
    ].join(" "),
    aspectRatio: "1:1",
    timeoutEnvironment: "cover",
    imageSize: "1K",
  });
}

export async function generateVertexAlbumIllustration(
  prompt: string,
  referenceImageDataUrl?: string,
  aspectRatio: Exclude<ImageAspectRatio, "1:1"> = "3:2",
  options: { beforeAttempt?: () => Promise<void> } = {},
) {
  return generateVertexImage({
    prompt,
    aspectRatio,
    referenceImageDataUrl,
    timeoutEnvironment: "album",
    imageSize: "2K",
    beforeAttempt: options.beforeAttempt,
  });
}
