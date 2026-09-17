export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIN_SIDE = 512;
export const PHOTO_MAX_PIXELS = 40_000_000;
export const PHOTO_MAX_SIDE = 1536;
export const PHOTO_REQUIREMENTS = "O fotografie clară, cu un singur copil. JPG, PNG, WebP sau HEIC de pe iPhone, maximum 10 MB.";
export const PHOTO_TECHNICAL_DETAILS = "Minimum 512 × 512 pixeli; recomandăm peste 1000 px pe fiecare latură. Maximum 40 megapixeli. HEIC și HEIF sunt convertite în JPG pe dispozitivul tău. GIF, fotografiile animate și fișierele video nu sunt acceptate.";
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export function checkPhotoDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < PHOTO_MIN_SIDE || height < PHOTO_MIN_SIDE) throw new Error("Fotografia trebuie să aibă cel puțin 512 × 512 pixeli.");
  if (width * height > PHOTO_MAX_PIXELS) throw new Error("Fotografia depășește limita de 40 megapixeli.");
}

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
