import { GoogleGenAI } from "@google/genai";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumGenerationInput, AlbumPanelPosition, AlbumPanelTone, AlbumPlan, AlbumScene, AlbumSceneLayout, AlbumStoryBible } from "@/lib/album/types";

const PANEL_POSITIONS = new Set<AlbumPanelPosition>(["top-left", "top-right", "bottom-left", "bottom-right", "bottom"]);
const PANEL_TONES = new Set<AlbumPanelTone>(["cream", "navy"]);

const ALBUM_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "storyBible", "coverPrompt", "coloringPrompt", "differencesPrompt", "scenes"],
  properties: {
    title: { type: "string" },
    storyBible: {
      type: "object",
      additionalProperties: false,
      required: ["premise", "childRole", "emotionalNeed", "narrativePromise", "recurringMotif", "companionRole", "worldRules", "arc", "visualLanguage"],
      properties: {
        premise: { type: "string" },
        childRole: { type: "string" },
        emotionalNeed: { type: "string" },
        narrativePromise: { type: "string" },
        recurringMotif: { type: "string" },
        companionRole: { type: "string" },
        worldRules: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
        arc: {
          type: "object",
          additionalProperties: false,
          required: ["opening", "catalyst", "turningPoint", "resolution"],
          properties: {
            opening: { type: "string" },
            catalyst: { type: "string" },
            turningPoint: { type: "string" },
            resolution: { type: "string" },
          },
        },
        visualLanguage: {
          type: "object",
          additionalProperties: false,
          required: ["palette", "lighting", "texture", "compositionRules"],
          properties: {
            palette: { type: "string" },
            lighting: { type: "string" },
            texture: { type: "string" },
            compositionRules: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
          },
        },
      },
    },
    coverPrompt: { type: "string" },
    coloringPrompt: { type: "string" },
    differencesPrompt: { type: "string" },
    scenes: {
      type: "array",
      minItems: 13,
      maxItems: 13,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "text", "imagePrompt", "panelPosition", "panelTone", "editorialRole", "continuityNotes"],
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
          imagePrompt: { type: "string" },
          panelPosition: { type: "string", enum: ["top-left", "top-right", "bottom-left", "bottom-right", "bottom"] },
          panelTone: { type: "string", enum: ["cream", "navy"] },
          editorialRole: { type: "string" },
          continuityNotes: { type: "string" },
        },
      },
    },
  },
} as const;

const EDITORIAL_LAYOUTS: AlbumSceneLayout[] = [
  "cinematic", "image-left", "image-right", "cinematic", "image-right", "image-left", "cinematic",
  "image-left", "image-right", "cinematic", "image-right", "image-left", "cinematic",
];

const CAMERA_DIRECTIONS = [
  "wide cinematic establishing shot, tiny hero inside a vast layered world",
  "low-angle medium-wide shot with forward movement and wind in the environment",
  "high overhead view with a winding visual path and clear story geography",
  "intimate eye-level medium shot focused on a warm character interaction",
  "panoramic side view with the characters moving from left to right",
  "dramatic view through a natural foreground frame, with strong depth",
  "quiet close-medium composition with expressive faces and tactile details",
  "dynamic diagonal composition during a decisive action",
  "symmetrical wonder-filled reveal with monumental scale",
  "ground-level perspective with foreground details leading toward the child",
  "soft backlit silhouette resolving into a hopeful scene",
  "celebratory wide shot with layered characters and environmental movement",
  "calm golden-hour homecoming, seen from a gentle three-quarter angle",
] as const;

function artDirection(style: string) {
  const directions: Record<string, string> = {
    "Acuarelă cinematografică": "premium cinematic watercolor and gouache, luminous washes, refined ink accents, layered atmospheric depth, sophisticated European picture-book illustration",
    "Guașă pictată manual": "premium hand-painted gouache, rich opaque color, visible brush texture, elegant shapes, editorial European children's-book illustration",
    "Ilustrație 3D de poveste": "premium handcrafted 3D storybook illustration, tactile fabric and painted-paper textures, expressive sculpted characters, cinematic lighting, never glossy or plastic",
    "Creioane colorate premium": "premium colored-pencil and soft pastel illustration on fine paper, intricate texture, luminous color layering, elegant contemporary picture-book finish",
  };
  return directions[style] || directions["Acuarelă cinematografică"];
}

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

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanList(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value) ? value.map((item) => clean(item, maxLength)).filter(Boolean).slice(0, maxItems) : [];
}

function parsePlan(text: string, input: AlbumGenerationInput, model: string): AlbumPlan {
  const source = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(source) as Record<string, unknown>;
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== 13) throw new Error("Planul albumului nu are 13 scene.");

  const characterBible = [
    `The same ${input.age}-year-old child named ${input.name} appears in every illustration.`,
    `${input.hairStyle} ${input.hairColor} hair, ${input.eyeColor} eyes, ${input.skinTone} skin tone.`,
    `Signature outfit: ${input.outfit}. Favorite color accent: ${input.favoriteColor}.`,
    input.appearanceDetail ? `Distinctive visual details: ${input.appearanceDetail}.` : "",
    `The companion is always ${input.companion.toLocaleLowerCase("ro-RO")}, with the same colors, proportions and accessories.`,
    input.secondaryCharacterName ? `A secondary human character named ${input.secondaryCharacterName}, the child's ${input.secondaryCharacterRole}, appears when the story calls for them. Their immutable appearance is: ${input.secondaryCharacterAppearance || "age-appropriate features selected by the family"}. Never merge this person with the main child or add another child.` : "",
    "Keep the child's face, hairstyle, eye color, outfit, proportions and apparent age identical on every page.",
  ].filter(Boolean).join(" ");
  const visualStyle = artDirection(input.artStyle);
  const rawBible = record(parsed.storyBible);
  const rawArc = record(rawBible.arc);
  const rawVisualLanguage = record(rawBible.visualLanguage);
  const immutableTraits = [
    `${input.age} years old with ${input.skinTone} skin tone`,
    `${input.hairStyle} ${input.hairColor} hair`,
    `${input.eyeColor} eyes`,
    `signature outfit: ${input.outfit}`,
    input.appearanceDetail || "natural age-appropriate facial features",
  ];
  const storyBible: AlbumStoryBible = {
    version: 3,
    premise: clean(rawBible.premise, 420),
    childRole: clean(rawBible.childRole, 220),
    emotionalNeed: clean(rawBible.emotionalNeed, 220),
    narrativePromise: clean(rawBible.narrativePromise, 300),
    recurringMotif: clean(rawBible.recurringMotif, 180),
    companionRole: clean(rawBible.companionRole, 220),
    worldRules: cleanList(rawBible.worldRules, 5, 180),
    arc: {
      opening: clean(rawArc.opening, 260),
      catalyst: clean(rawArc.catalyst, 260),
      turningPoint: clean(rawArc.turningPoint, 260),
      resolution: clean(rawArc.resolution, 260),
    },
    characterLock: {
      referenceMode: input.referenceMode,
      canonicalDescription: characterBible,
      immutableTraits,
      outfitPalette: `${input.outfit}; recurring ${input.favoriteColor} accent`,
      companionDescription: `${input.companion}, always with identical colors, proportions and accessories${input.secondaryCharacterName ? `; ${input.secondaryCharacterName}, ${input.secondaryCharacterRole}, always with this appearance: ${input.secondaryCharacterAppearance || "the confirmed family description"}` : ""}`,
      anchorAsset: "cover",
    },
    visualLanguage: {
      palette: clean(rawVisualLanguage.palette, 220) || `${input.favoriteColor} accent balanced with colors natural to ${albumWorldLabel(input.world, input.customWorld)}`,
      lighting: clean(rawVisualLanguage.lighting, 220) || input.mood,
      texture: clean(rawVisualLanguage.texture, 220) || visualStyle,
      compositionRules: cleanList(rawVisualLanguage.compositionRules, 6, 180),
      forbidden: ["generated text or letters", "duplicate child", "different outfit", "generic stock fantasy", "photoreal adult proportions", "framing devices or collages", "extra unrequested children", "merged character identities"],
    },
  };
  if (!storyBible.premise || !storyBible.childRole || storyBible.worldRules.length < 3 || !storyBible.arc.opening || !storyBible.arc.resolution) {
    throw new Error("Story Bible V3 este incompletă.");
  }

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
    const layout = EDITORIAL_LAYOUTS[index];
    const editorialRole = clean(scene.editorialRole, 120) || `momentul ${index + 1} al arcului narativ`;
    const continuityNotes = clean(scene.continuityNotes, 420);
    const sceneWords = wordCount(sceneText);
    if (!heading || sceneWords < 24 || sceneWords > 50 || !basePrompt) {
      throw new Error(`Scena ${index + 1} nu respectă lungimea pentru album (${sceneWords} cuvinte).`);
    }
    return {
      heading,
      text: sceneText,
      imagePrompt: `${characterBible} IMMUTABLE CHARACTER LOCK: preserve the exact face, apparent age, hairstyle and length, eye color, skin tone, body proportions, signature outfit, recurring accessories and companion design from the authoritative reference. Keep the requested hero singular${input.secondaryCharacterName ? ` and keep ${input.secondaryCharacterName} visibly distinct from the hero` : ""}; never merge, duplicate or replace them. Preserve recurring objects, their colors and any safety gear whenever the action continues across pages. STORY BIBLE CONTINUITY: ${storyBible.recurringMotif}; ${storyBible.visualLanguage.palette}; ${storyBible.visualLanguage.lighting}. SCENE CONTINUITY: ${continuityNotes}. ${basePrompt} ${CAMERA_DIRECTIONS[index]}. ${visualStyle}. ${layout === "image-left" ? "Compose the main child action clearly in the left two-thirds, with readable environmental depth." : layout === "image-right" ? "Compose the main child action clearly in the right two-thirds, with readable environmental depth." : "Use a full-width cinematic composition with the complete action in the central safe area."} Layered foreground, middle ground and background, expressive body language, nuanced lighting, print-quality detail. Every prop and background must serve this exact scene. Treat commercial products only as unbranded visual references: no brand name, trademark, logo, decal, label or printed marking. No generic fantasy stock imagery, no repeated pose, no text, no letters, no frame, no collage, no watermark.`,
      panelPosition,
      panelTone,
      layout,
      editorialRole,
      continuityNotes,
    };
  });

  const totalWords = scenes.reduce((total, scene) => total + wordCount(scene.text), 0);
  if (totalWords < 360 || totalWords > 560) throw new Error(`Lungimea albumului este în afara intervalului (${totalWords} cuvinte).`);
  const uniquePrompts = new Set(scenes.map((scene) => scene.imagePrompt.toLocaleLowerCase("ro-RO")));
  if (uniquePrompts.size !== scenes.length) throw new Error("Planul conține ilustrații repetate.");

  return {
    title: clean(parsed.title, 100) || `${input.name} și aventura magică`,
    storyBible,
    characterBible,
    characterPrompt: `${characterBible} ${visualStyle}. Create a clean full-body character-design reference showing the main child, companion${input.secondaryCharacterName ? ` and ${input.secondaryCharacterName} as a clearly separate secondary character` : ""}, all fully visible, neutral warm studio background, simple relaxed pose, clear face and outfit details, no scenery, no action, no duplicate figures, no extra characters, no text, no letters, no labels, no frame, no collage.`,
    coverPrompt: `${characterBible} ${clean(parsed.coverPrompt, 900)} ${visualStyle}. Spectacular full-bleed A5 landscape picture-book cover art with a dynamic narrative moment, sweeping movement, rich depth and a memorable silhouette. Place the child and companion in the right half; keep the upper-left third atmospheric and visually quiet for editorial title typography. Premium bookstore cover, emotionally expressive, print-quality detail. No title, no text, no letters, no logo, no border, no frame, no collage, no watermark.`,
    coloringPrompt: `${characterBible} ${clean(parsed.coloringPrompt, 900)} Refined black-and-white coloring-book line art based on a recognizable moment from this exact adventure, balanced 4:3 composition, large closed shapes, varied but uncluttered details, generous white areas, crisp dark outlines, white background, no gray, no shading, no text, no border.`,
    differencesPrompt: `${characterBible} ${clean(parsed.differencesPrompt, 900)} Create one clean, richly detailed but readable storybook observation scene from this exact adventure. ${visualStyle}. Center the child and companion with five clearly separated supporting objects around them. Balanced 4:3 composition, no text, no letters, no frame, no collage, no watermark.`,
    scenes,
    textModel: model,
  };
}

function buildPrompt(input: AlbumGenerationInput) {
  const world = albumWorldLabel(input.world, input.customWorld);
  return `Ești autor și director artistic pentru un album ilustrat premium destinat copiilor. Scrie în română naturală și caldă, potrivită vârstei de ${input.age} ani.

Date confirmate de părinte:
- copil: ${input.name}, ${input.age} ani;
- aspect consecvent: păr ${input.hairStyle}, culoarea părului ${input.hairColor}, ochi ${input.eyeColor}, nuanța pielii ${input.skinTone};
- ținută: ${input.outfit};
- alte trăsături vizuale: ${input.appearanceDetail || "nu au fost adăugate"};
- culoare preferată: ${input.favoriteColor};
- lume: ${world};
- companion: ${input.companion};
- personaj secundar: ${input.secondaryCharacterName ? `${input.secondaryCharacterName}, ${input.secondaryCharacterRole}, cu aspectul ${input.secondaryCharacterAppearance || "descris de familie"}` : "nu a fost adăugat"};
- tema emoțională: ${input.lesson};
- atmosferă: ${input.mood};
- stil vizual ales: ${input.artStyle};
- detaliu personal: ${input.personalDetail || "nu a fost adăugat"};
- ideea părintelui pentru poveste: ${input.storyContext || "autorul poate construi liber aventura"}.

Începe cu o Story Bible V3: premisa, rolul copilului, nevoia emoțională, promisiunea narativă, motivul recurent, rolul companionului, 3-5 reguli ale lumii, arcul în patru momente și limbajul vizual. Story Bible trebuie să fie specifică acestor alegeri și să mențină coerența fără să transforme povestea într-un scenariu rigid.

Construiește apoi o aventură completă în EXACT 13 scene. Fiecare scenă are 28-40 de cuvinte și avansează acțiunea. Totalul trebuie să fie 400-500 de cuvinte. Scrie aerisit, cu propoziții clare, ușor de citit cu voce tare și fără formulări tehnice sau metafore greoaie. Numele copilului, lumea, companionul, culoarea preferată și detaliul personal trebuie să influențeze evenimente reale, nu să apară ca o listă. Lecția se arată prin alegeri și acțiuni, fără morală rigidă. Finalul este luminos și include o despărțire sau o întoarcere acasă.

Respectă ideea părintelui atunci când este oferită, dar transform-o într-o poveste coerentă, sigură și potrivită vârstei. Pentru fiecare scenă scrie un rol editorial scurt, note de continuitate și un prompt vizual în engleză, cu o acțiune, un decor și o stare vizuală specifice acelui moment. Nu repeta aceeași imagine, poziție a corpului sau același fundal. Păstrează același copil și același companion în toate imaginile. Dacă există un personaj secundar, păstrează-i numele, relația și aspectul, folosește-l numai când ajută povestea și nu îl confunda niciodată cu eroul principal. Nu adăuga alți copii. Textul va fi randat separat de imagine, deci nu include text sau titluri în ilustrație.

Scrie și două prompturi separate pentru activități: coloringPrompt pentru o scenă de colorat și differencesPrompt pentru o scenă de observație. Ambele trebuie să folosească lumea, companionul și un moment recognoscibil din poveste, fără a copia o ilustrație de poveste.

Returnează numai JSON valid conform schemei, fără Markdown.`;
}

export async function generateAlbumPlan(input: AlbumGenerationInput, options: { beforeAttempt?: () => Promise<void> } = {}): Promise<AlbumPlan> {
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
      await options.beforeAttempt?.();
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
