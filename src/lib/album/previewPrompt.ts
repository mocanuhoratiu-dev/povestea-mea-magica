import type { AlbumGenerationInput, AlbumQualityResult } from "./types";

const titleDirections: Record<string, string> = {
  forest: "pădurea luminilor",
  stars: "harta dintre stele",
  ocean: "oceanul de cristal",
  clouds: "orașul dintre nori",
  dinosaurs: "valea dinozaurilor blânzi",
  castle: "castelul anotimpurilor",
  library: "biblioteca poveștilor vii",
  garden: "grădina lucrurilor mici",
  aurora: "secretul aurorei",
  inventions: "atelierul invențiilor magice",
};

export function albumPreviewTitle(input: AlbumGenerationInput) {
  if (input.world === "custom" && input.customWorld) return `${input.name} în lumea sa magică`;
  return `${input.name} și ${titleDirections[input.world] || "aventura magică"}`;
}

export function buildAlbumPreviewRetryPrompt(prompt: string, quality: AlbumQualityResult) {
  const feedback = quality.notes.length > 0
    ? quality.notes.join("; ")
    : "strengthen scene relevance, composition and character consistency";
  return `${prompt}\n\nEDITORIAL RETRY. The previous candidate was rejected. Correct these issues: ${feedback}. Preserve every requested child, companion, world, color, object appearance and story detail, but never reproduce a commercial brand name, trademark, logo, decal, label or printed marking. Named products are visual references only and must become unbranded objects. Keep the hero and selected companion singular and consistent; supporting characters explicitly required by the family story may appear once and remain visually secondary. Use clean anatomy and a polished premium picture-book composition. No title, no words, no letters, no logo, no watermark.`;
}

function visualDirection(style: string) {
  const directions: Record<string, string> = {
    "Acuarelă cinematografică": "premium cinematic watercolor and gouache, luminous washes, fine painted texture, layered atmospheric depth, sophisticated European picture-book illustration",
    "Guașă pictată manual": "premium hand-painted gouache, rich opaque color, visible brush texture, elegant shapes, editorial European picture-book illustration",
    "Ilustrație 3D de poveste": "premium handcrafted 3D storybook illustration, tactile fabric and painted-paper textures, expressive sculpted characters, cinematic lighting, never glossy or plastic",
    "Creioane colorate premium": "premium colored-pencil and soft pastel illustration on fine paper, intricate texture, luminous color layering, elegant contemporary picture-book finish",
  };
  return directions[style] || directions["Acuarelă cinematografică"];
}

/** Builds the one image that becomes both the approved preview and final cover. */
export function buildAlbumPreviewPrompt(input: AlbumGenerationInput, worldLabel: string) {
  return [
    `Create one spectacular full-bleed A5 landscape cover illustration for a premium personalized children's picture book about ${input.name}, age ${input.age}.`,
    input.referenceMode === "photo" ? "The attached photograph is the authoritative identity reference. Translate the child's recognizable facial structure, skin tone, hair and apparent age faithfully into the selected illustration style without making the result photorealistic." : "Build the child's identity from the confirmed description and keep it precise.",
    `The child has ${input.hairStyle} ${input.hairColor} hair, ${input.eyeColor} eyes and ${input.skinTone} skin tone.`,
    `Signature outfit: ${input.outfit}. Favorite color accent: ${input.favoriteColor}.`,
    input.appearanceDetail ? `Distinctive visible details: ${input.appearanceDetail}.` : "",
    `The same child is the unmistakable hero, accompanied by ${input.companion.toLocaleLowerCase("ro-RO")}.`,
    input.secondaryCharacterName ? `A second, clearly distinct child character is ${input.secondaryCharacterName}, the hero's ${input.secondaryCharacterRole}, with this immutable appearance: ${input.secondaryCharacterAppearance || "age-appropriate appearance defined by the family"}. Keep both children visually separate and recognizable.` : "",
    `World and setting: ${worldLabel}. Emotional direction: ${input.lesson}. Mood: ${input.mood}.`,
    input.storyContext ? `Family story idea to express visually: ${input.storyContext}.` : "Show the beginning of an original magical adventure with a clear visual mystery.",
    input.personalDetail ? `Include this recognizable personal detail naturally: ${input.personalDetail}.` : "",
    "Treat every named commercial product as visual context only. Preserve the requested object type, proportions and color, but remove all brand names, trademarks, logos, decals, labels and printed markings from it.",
    `${visualDirection(input.artStyle)}. Dynamic narrative moment, sweeping movement, rich foreground-midground-background depth, expressive face, memorable silhouette and bookstore-quality art direction.`,
    "Keep the child and companion fully readable and large enough to become the authoritative visual reference for every later scene.",
    "Keep the upper-left third atmospheric and visually quiet for editorial title typography added later by the renderer.",
    `${input.secondaryCharacterName ? "Show exactly the two distinct requested children, each once." : "Show the child hero exactly once."} Show the selected magical companion exactly once. Supporting animals or characters explicitly required by the family story idea may appear once, remain visually secondary and must not duplicate the hero or companion. No unrelated people or characters, no title, no words, no letters, no logo, no watermark, no trademark, no border, no frame, no collage.`,
  ].filter(Boolean).join(" ");
}
