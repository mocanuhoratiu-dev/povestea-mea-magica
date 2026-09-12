import { GoogleGenAI, Modality } from "@google/genai";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import { imageRejection, type ImageRejection } from "./vertexImageFailure";
import { fallbackModels, imageResolution, withModelFallback } from './modelFallback';

export type CoverGenerationResult =
  | { imageDataUrl: string; model: string; resolution: '1K' | '2K'; error?: never; rejection?: never }
  | { imageDataUrl?: never; model?: never; error: string; rejection?: ImageRejection };

type ImageAspectRatio = "1:1" | "4:3" | "3:2" | "3:4" | "16:9";

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
  return fallbackModels('image', process.env.VERTEX_AI_IMAGE_MODEL, process.env.VERTEX_AI_IMAGE_FALLBACK_MODELS,
    readBoundedDuration(process.env.VERTEX_AI_IMAGE_MAX_MODELS, 3, 1, 3));
}

function cleanCoverPrompt(value: string, maximum = 3_600) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
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
  referencePurpose = "character",
  deadlineAt,
  preferredModel,
  require2K = false,
  additionalReferenceDataUrl,
}: {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  referenceImageDataUrl?: string;
  timeoutEnvironment: "cover" | "album";
  imageSize: "1K" | "2K";
  beforeAttempt?: (model?: string) => Promise<void>;
  referencePurpose?: "character" | "mascot" | "photo";
  deadlineAt?: number;
  preferredModel?: string;
  require2K?: boolean;
  additionalReferenceDataUrl?: string;
}): Promise<CoverGenerationResult> {
  const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
  const cleanPrompt = cleanCoverPrompt(prompt, timeoutEnvironment === "album" ? 12_000 : 3_600);

  if (!project) return { error: "VERTEX_AI_PROJECT_ID lipsește din configurare." };
  if (!cleanPrompt) return { error: "Promptul pentru copertă este gol." };

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
              "Preserve the child's face, apparent age, skin tone, exact hairstyle and length, hair color, eye color, body proportions, outfit palette and every recurring accessory from the reference; do not redesign them.",
              "Preserve the companion's species, colors, proportions and accessories exactly. Never merge the child with a sibling, friend or companion and never duplicate a character.",
              "If the scene continues an action with a bicycle or another moving object, preserve the same object color and child-safety equipment shown in the reference or requested by the family.",
              "Create a new composition and action for this page, without copying the reference background or pose.",
              "Do not reproduce any brand name, trademark, logo, decal, label or printed marking visible in the reference.",
              cleanPrompt,
            ].join(" "),
          },
        ],
      }]
    : cleanPrompt;
  if (reference && referencePurpose === "mascot" && Array.isArray(contents)) {
    contents[0].parts = [{ inlineData: reference }, { text: "The reference shows ONLY our mascot Lumi. Preserve her face, golden flame hair, plum cloak and handheld lantern. Invent the CHILD separately using the requested human child description; do not turn the child into Lumi. Create a fully volumetric animated-film scene. " + cleanPrompt }];
  }

  if (reference && referencePurpose === "photo" && Array.isArray(contents)) {
    contents[0].parts = [{ inlineData: reference }, { text: "This is a parent-provided PHOTO for identity, not an illustrated character sheet. Translate the child's recognizable face, apparent age, skin tone, hair color and hairstyle into the requested illustration style. Stylized eyes and proportions are expected. Use the outfit and companions requested in the prompt, not incidental clothing, people or objects in the photograph. Do not copy the background, pose or photographic rendering. Never merge or duplicate children. " + cleanPrompt }];
  }
  const extraReference = parseReferenceImage(additionalReferenceDataUrl);
  if (extraReference && Array.isArray(contents)) {
    contents[0].parts.push({ inlineData: extraReference }, { text: "This ADDITIONAL reference is for art direction and supporting companion/prop continuity only. IMAGE 1 remains authoritative for the child's identity. Never replace or merge the child with another person or the mascot shown here. Do not copy the composition." });
  }
  const configuredModels = getImageModels();
  const models = [...new Set([...(preferredModel && configuredModels.includes(preferredModel) ? [preferredModel] : []), ...configuredModels])]
    .filter(model => !require2K || imageResolution(model, '2K') === '2K');

  try {
    return await withModelFallback<CoverGenerationResult>({
      role: 'image', models,
      deadlineAt: deadlineAt || Date.now() + Math.min(120_000, timeoutMs * 3), perModelMs: timeoutMs,
      run: async (model, availableMs, signal) => {
      await beforeAttempt?.(model);
      const resolution = imageResolution(model, imageSize);
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents,
          config: {
            abortSignal: signal,
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio, imageSize: resolution },
          },
        }),
        Math.min(timeoutMs, availableMs),
        `Imaginea generată cu ${model} a depășit timpul de răspuns.`
      );
      const rejection = imageRejection(response, model);
      if (rejection) return { error: `${model}: ${rejection.reason}`, rejection };
      const imagePart = response.candidates
        ?.flatMap((candidate) => candidate.content?.parts || [])
        .find((part) => part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/"));
      const imageData = imagePart?.inlineData?.data;
      const mimeType = imagePart?.inlineData?.mimeType || "image/png";

      if (imageData) {
        console.info(JSON.stringify({ event: 'pmm_image_model_output', model, resolution, requestedResolution: imageSize }));
        return { imageDataUrl: `data:${mimeType};base64,${imageData}`, model, resolution };
      }

      const finishReason = response.candidates?.[0]?.finishReason || response.promptFeedback?.blockReason || "EMPTY";
      if (/PROHIBITED_CONTENT|SAFETY|IMAGE_RECITATION|BLOCKLIST/i.test(finishReason)) return { error: `${model}: ${finishReason}` };
      throw new Error(`${model}: nu a returnat o imagine. (${finishReason})`);
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('album_budget_')) throw error;
    return { error: error instanceof Error ? error.message : 'Vertex AI nu a putut genera imaginea.' };
  }
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
  options: { beforeAttempt?: (model?: string) => Promise<void>; referencePurpose?: "character" | "photo"; deadlineAt?: number; preferredModel?: string; require2K?: boolean; additionalReferenceDataUrl?: string } = {},
) {
  return generateVertexImage({
    prompt,
    aspectRatio,
    referenceImageDataUrl,
    timeoutEnvironment: "album",
    imageSize: "2K",
    beforeAttempt: options.beforeAttempt,
    referencePurpose: options.referencePurpose,
    deadlineAt: options.deadlineAt,
    preferredModel: options.preferredModel,
    require2K: options.require2K,
    additionalReferenceDataUrl: options.additionalReferenceDataUrl,
  });
}

export function generateVertexKitIllustration(prompt: string, referenceImageDataUrl: string | undefined, cover: boolean, beforeAttempt: () => Promise<void>, options: { character?: boolean; preferredModel?: string; additionalReferenceDataUrl?: string } = {}) {
  return generateVertexImage({ prompt, referenceImageDataUrl, referencePurpose: options.character ? "character" : cover ? "mascot" : "character", aspectRatio: cover ? "3:4" : "3:2", timeoutEnvironment: "cover", imageSize: "1K", beforeAttempt, preferredModel: options.preferredModel, additionalReferenceDataUrl: options.additionalReferenceDataUrl });
}
