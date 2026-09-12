import type { AlbumGenerationInput, AlbumQualityResult } from "./types";
import { albumArtDirection } from "./artDirection.ts";
import { illustrationPalette } from "../storyColors.ts";

/** Temporary cover label, replaced by the author's title when the story plan is ready. */
export function albumPreviewTitle(input: AlbumGenerationInput) {
  return `O poveste pentru ${input.name}`;
}

export function buildAlbumPreviewRetryPrompt(prompt: string, quality: AlbumQualityResult) {
  const feedback = quality.notes.length > 0
    ? quality.notes.join("; ")
    : "strengthen scene relevance, composition and character consistency";
  return `${prompt}\n\nEDITORIAL RETRY. The previous candidate was rejected. Correct these issues: ${feedback}. Preserve every requested child, companion, world, color, object appearance and story detail, but never reproduce a commercial brand name, trademark, logo, decal, label or printed marking. Named products are visual references only and must become unbranded objects. Keep the hero and selected companion singular and consistent; supporting characters explicitly required by the family story may appear once and remain visually secondary. Use clean anatomy and a polished premium picture-book composition. No title, no words, no letters, no logo, no watermark.`;
}

/** Builds the one image that becomes both the approved preview and final cover. */
export function buildAlbumPreviewPrompt(input: AlbumGenerationInput, worldLabel: string) {
  return [
    `Create one spectacular full-bleed A5 landscape cover illustration for a premium personalized children's picture book about ${input.name}, age ${input.age}.`,
    albumArtDirection(input.artStyle),
    input.referenceMode === "photo" ? "The attached approved ILLUSTRATED CHARACTER is the authoritative identity reference, already translated from the parent photo. Preserve it faithfully. Do not redesign facial features, hairstyle, outfit or apparent age." : "Build the child's identity from the confirmed description and keep it precise.",
    `The child has ${input.hairStyle} ${input.hairColor} hair, ${input.eyeColor} eyes and ${input.skinTone} skin tone.`,
    `Signature outfit: ${input.outfit}. Favorite color accent: ${input.favoriteColor}.`,
    `Art-direction palette, not story vocabulary: ${illustrationPalette(input.favoriteColor)}.`,
    input.appearanceDetail ? `Distinctive visible details: ${input.appearanceDetail}.` : "",
    `The same child is the unmistakable hero, accompanied by ${input.companion.toLocaleLowerCase("ro-RO")}.`,
    input.secondaryCharacterName ? `A second, clearly distinct child character is ${input.secondaryCharacterName}, the hero's ${input.secondaryCharacterRole}, with this immutable appearance: ${input.secondaryCharacterAppearance || "age-appropriate appearance defined by the family"}. Keep both children visually separate and recognizable.` : "",
    `World and setting: ${worldLabel}. Emotional direction: ${input.lesson}. Mood: ${input.mood}.`,
    input.storyContext ? `Family story idea to express visually: ${input.storyContext}.` : "Show the beginning of an original magical adventure with a clear visual mystery.",
    input.personalDetail ? `Include this recognizable personal detail naturally: ${input.personalDetail}.` : "",
    "Treat every named commercial product as visual context only. Preserve the requested object type, proportions and color, but remove all brand names, trademarks, logos, decals, labels and printed markings from it.",
    "Dynamic narrative moment, sweeping movement, rich foreground-midground-background depth, expressive face, memorable silhouette and bookstore-quality art direction.",
    "Keep the child and companion fully readable and large enough to become the authoritative visual reference for every later scene.",
    "Keep the upper-left third atmospheric and visually quiet for editorial title typography added later by the renderer.",
    `${input.secondaryCharacterName ? "Show exactly the two distinct requested children, each once." : "Show the child hero exactly once."} Show the selected magical companion exactly once. Supporting animals or characters explicitly required by the family story idea may appear once, remain visually secondary and must not duplicate the hero or companion. No unrelated people or characters, no title, no words, no letters, no logo, no watermark, no trademark, no border, no frame, no collage.`,
  ].filter(Boolean).join(" ");
}
