import { GoogleGenAI } from "@google/genai";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumGenerationInput, AlbumPanelPosition, AlbumPanelTone, AlbumPlan, AlbumScene } from "@/lib/album/types";

const PANEL_POSITIONS = new Set<AlbumPanelPosition>(["top-left", "top-right", "bottom-left", "bottom-right", "bottom"]);
const PANEL_TONES = new Set<AlbumPanelTone>(["cream", "navy"]);

const ALBUM_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "characterBible", "coverPrompt", "coloringPrompt", "scenes"],
  properties: {
    title: { type: "string" },
    characterBible: { type: "string" },
    coverPrompt: { type: "string" },
    coloringPrompt: { type: "string" },
    scenes: {
      type: "array",
      minItems: 13,
      maxItems: 13,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "text", "imagePrompt", "panelPosition", "panelTone"],
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
          imagePrompt: { type: "string" },
          panelPosition: { type: "string", enum: ["top-left", "top-right", "bottom-left", "bottom-right", "bottom"] },
          panelTone: { type: "string", enum: ["cream", "navy"] },
        },
      },
    },
  },
} as const;

function clean(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getCredentials() {
  const encoded = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encoded) return undefined;
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

function modelCandidates() {
  return Array.from(new Set([
    process.env.VERTEX_AI_MODEL,
    ...(process.env.VERTEX_AI_FALLBACK_MODELS || "").split(","),
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).slice(0, 2);
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function parsePlan(text: string, input: AlbumGenerationInput, model: string): AlbumPlan {
  const source = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(source) as Record<string, unknown>;
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== 13) throw new Error("Planul albumului nu are 13 scene.");

  const characterBible = [
    `The same ${input.age}-year-old child named ${input.name} appears in every illustration.`,
    `${input.hairStyle} ${input.hairColor} hair, ${input.skinTone} skin tone, favorite color ${input.favoriteColor}.`,
    "Keep facial features, hairstyle, outfit colors, proportions and age identical on every page.",
  ].join(" ");

  const scenes = parsed.scenes.map((raw, index): AlbumScene => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Scena ${index + 1} este invalidă.`);
    const scene = raw as Record<string, unknown>;
    const heading = clean(scene.heading, 70);
    const sceneText = clean(scene.text, 650);
    const basePrompt = clean(scene.imagePrompt, 900);
    const panelPosition = PANEL_POSITIONS.has(scene.panelPosition as AlbumPanelPosition)
      ? scene.panelPosition as AlbumPanelPosition
      : (["bottom", "top-left", "top-right", "bottom-left", "bottom-right"] as AlbumPanelPosition[])[index % 5];
    const panelTone = PANEL_TONES.has(scene.panelTone as AlbumPanelTone) ? scene.panelTone as AlbumPanelTone : index % 2 ? "navy" : "cream";
    if (!heading || wordCount(sceneText) < 25 || !basePrompt) throw new Error(`Scena ${index + 1} nu are conținut suficient.`);
    return {
      heading,
      text: sceneText,
      imagePrompt: `${characterBible} ${basePrompt} Full-page landscape children's-book illustration, clear focal action, no text, no letters, no frame, no collage.`,
      panelPosition,
      panelTone,
    };
  });

  const totalWords = scenes.reduce((total, scene) => total + wordCount(scene.text), 0);
  if (totalWords < 430 || totalWords > 720) throw new Error(`Lungimea albumului este în afara intervalului (${totalWords} cuvinte).`);
  const uniquePrompts = new Set(scenes.map((scene) => scene.imagePrompt.toLocaleLowerCase("ro-RO")));
  if (uniquePrompts.size !== scenes.length) throw new Error("Planul conține ilustrații repetate.");

  return {
    title: clean(parsed.title, 100) || `${input.name} și aventura magică`,
    characterBible,
    coverPrompt: `${characterBible} ${clean(parsed.coverPrompt, 900)} Premium landscape children's-book cover scene with open space for title overlay, no text, no letters, no logo, no frame.`,
    coloringPrompt: `${characterBible} ${clean(parsed.coloringPrompt, 900)} Clean black-and-white coloring-book line art, large closed shapes, white background, no gray, no shading, no text.`,
    scenes,
    textModel: model,
  };
}

function buildPrompt(input: AlbumGenerationInput) {
  const world = albumWorldLabel(input.world);
  return `Ești autor și director artistic pentru un album ilustrat premium destinat copiilor. Scrie în română naturală și caldă, potrivită vârstei de ${input.age} ani.

Date confirmate de părinte:
- copil: ${input.name}, ${input.age} ani;
- aspect consecvent: păr ${input.hairStyle}, culoarea părului ${input.hairColor}, nuanța pielii ${input.skinTone};
- culoare preferată: ${input.favoriteColor};
- lume: ${world};
- companion: ${input.companion};
- tema emoțională: ${input.lesson};
- detaliu personal: ${input.personalDetail || "nu a fost adăugat"}.

Construiește o aventură completă în EXACT 13 scene. Fiecare scenă are 35-50 de cuvinte și avansează acțiunea. Totalul trebuie să fie 500-620 de cuvinte. Numele copilului, lumea, companionul, culoarea preferată și detaliul personal trebuie să influențeze evenimente reale, nu să apară ca o listă. Lecția se arată prin alegeri și acțiuni, fără morală rigidă. Finalul este luminos și include o despărțire sau o întoarcere acasă.

Pentru fiecare scenă scrie un prompt vizual în engleză, cu o compoziție și o acțiune unice. Nu repeta nici imaginea, nici unghiul, nici decorul unei alte pagini. Păstrează același copil și același companion în toate imaginile. Alege poziția panoului astfel încât textul să nu acopere fețele sau acțiunea.

Returnează numai JSON valid conform schemei, fără Markdown.`;
}

export async function generateAlbumPlan(input: AlbumGenerationInput): Promise<AlbumPlan> {
  const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
  if (!project) throw new Error("Vertex AI nu este configurat pentru album.");
  const credentials = getCredentials();
  const client = new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env.VERTEX_AI_LOCATION?.trim() || "global",
    ...(credentials ? { googleAuthOptions: { credentials } } : {}),
  });
  const errors: string[] = [];
  const timeoutMs = readBoundedDuration(process.env.ALBUM_TEXT_TIMEOUT_MS, 55_000, 15_000, 90_000);

  for (const model of modelCandidates()) {
    try {
      const response = await withTimeout(client.models.generateContent({
        model,
        contents: buildPrompt(input),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: ALBUM_PLAN_SCHEMA,
          maxOutputTokens: 6_000,
          temperature: 0.85,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }), timeoutMs, `Planul albumului generat cu ${model} a depășit timpul de răspuns.`);
      const text = response.candidates?.flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text || "").join("").trim();
      if (!text) throw new Error("Modelul nu a returnat un plan.");
      return parsePlan(text, input, model);
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "eroare necunoscută"}`);
    }
  }

  throw new Error(errors.join(" | ") || "Planul albumului nu a putut fi generat.");
}
