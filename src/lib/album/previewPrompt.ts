import type { AlbumGenerationInput } from "./types";

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
  return `${input.name} și ${titleDirections[input.world] || "aventura magică"}`;
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
    `The child has ${input.hairStyle} ${input.hairColor} hair, ${input.eyeColor} eyes and ${input.skinTone} skin tone.`,
    `Signature outfit: ${input.outfit}. Favorite color accent: ${input.favoriteColor}.`,
    input.appearanceDetail ? `Distinctive visible details: ${input.appearanceDetail}.` : "",
    `The same child is the unmistakable hero, accompanied by ${input.companion.toLocaleLowerCase("ro-RO")}.`,
    `World and setting: ${worldLabel}. Emotional direction: ${input.lesson}. Mood: ${input.mood}.`,
    input.storyContext ? `Family story idea to express visually: ${input.storyContext}.` : "Show the beginning of an original magical adventure with a clear visual mystery.",
    input.personalDetail ? `Include this recognizable personal detail naturally: ${input.personalDetail}.` : "",
    `${visualDirection(input.artStyle)}. Dynamic narrative moment, sweeping movement, rich foreground-midground-background depth, expressive face, memorable silhouette and bookstore-quality art direction.`,
    "Keep the child and companion fully readable and large enough to become the authoritative visual reference for every later scene.",
    "Keep the upper-left third atmospheric and visually quiet for editorial title typography added later by the renderer.",
    "Exactly one child and one companion. No title, no words, no letters, no logo, no watermark, no border, no frame, no collage.",
  ].filter(Boolean).join(" ");
}
