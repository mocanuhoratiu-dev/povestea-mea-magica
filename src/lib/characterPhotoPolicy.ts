export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIN_SIDE = 512;
export const PHOTO_MAX_PIXELS = 40_000_000;
export const PHOTO_MAX_SIDE = 1536;
export const PHOTO_REQUIREMENTS = "JPG, PNG sau WebP, maximum 10 MB și 40 megapixeli. Minimum 512 × 512 px; recomandat peste 1000 px. Un singur copil, cu fața vizibilă. HEIC, GIF și fotografiile animate nu sunt acceptate.";

export type PhotoTraits = {
  hairStyle: string; hairColor: string; eyeColor: string; skinTone: string;
  outfit: string; appearanceDetail: string;
};
export type ApprovedCharacter = {
  referenceImageDataUrl: string;
  characterImageDataUrl: string;
  characterToken: string;
  traits: PhotoTraits;
};
export function readPhotoTraits(value: unknown): PhotoTraits | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const result = {} as PhotoTraits;
  for (const key of ["hairStyle", "hairColor", "eyeColor", "skinTone", "outfit", "appearanceDetail"] as const) {
    if (typeof raw[key] !== "string" || raw[key].length > (key === "appearanceDetail" ? 240 : 100)) return null;
    result[key] = raw[key].replace(/[<>\u0000-\u001f]/g, " ").trim();
  }
  return result.hairStyle && result.hairColor && result.outfit ? result : null;
}
export function describePhotoTraits(traits: PhotoTraits) {
  return `Păr ${traits.hairColor}, ${traits.hairStyle}. Ochi: ${traits.eyeColor}. Piele: ${traits.skinTone}. Ținută: ${traits.outfit}. ${traits.appearanceDetail}`;
}
