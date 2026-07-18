import { GoogleGenAI, Modality } from "@google/genai";

export type CoverGenerationResult =
  | { imageDataUrl: string; model: string; error?: never }
  | { imageDataUrl?: never; model?: never; error: string };

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
    "gemini-2.5-flash-image",
  ];

  return Array.from(
    new Set(
      configuredModels
        .map((model) => model?.trim())
        .filter((model): model is string => Boolean(model))
    )
  );
}

function cleanCoverPrompt(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1_800);
}

/**
 * Generates a temporary data URL rather than storing a child's cover in Cloud Storage.
 * Cloud Run uses its service account through Application Default Credentials.
 */
export async function generateVertexStoryCover(prompt: string): Promise<CoverGenerationResult> {
  const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
  const cleanPrompt = cleanCoverPrompt(prompt);

  if (!project) return { error: "VERTEX_AI_PROJECT_ID lipsește din configurare." };
  if (!cleanPrompt) return { error: "Promptul pentru copertă este gol." };

  const errors: string[] = [];
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
  const coverPrompt = [
    "Create exactly one square, print-quality illustration for a personalised Romanian children's storybook cover.",
    cleanPrompt,
    "Use warm watercolor and gouache children's-book art, soft magical bedtime lighting, and a clearly readable main character.",
    "Do not include any words, letters, title text, logo, watermark, frame, or collage.",
  ].join(" ");

  for (const model of getImageModels()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: coverPrompt,
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      });
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

  return { error: errors.join(" | ") || "Vertex AI nu a putut genera coperta." };
}
