import type { AlbumQualityResult } from "./types";

export type AlbumImageCandidate<T> = {
  value: T;
  quality: AlbumQualityResult;
};

function candidateScore(quality: AlbumQualityResult, identityRequired: boolean) {
  const identity = identityRequired ? quality.identityScore : 100;
  return quality.technicalScore * 0.4 + quality.storyScore * 0.35 + identity * 0.25;
}

export function isSafeSoftQualityCandidate(quality: AlbumQualityResult, identityRequired: boolean) {
  return !quality.hardFailure
    && quality.technicalScore >= 55
    && quality.storyScore >= 50
    && (!identityRequired || quality.identityScore >= 50);
}

export function chooseBetterAlbumCandidate<T>(
  current: AlbumImageCandidate<T> | undefined,
  next: AlbumImageCandidate<T>,
  identityRequired: boolean,
) {
  if (!current) return next;
  return candidateScore(next.quality, identityRequired) > candidateScore(current.quality, identityRequired) ? next : current;
}

export function acceptBestSafeCandidate(quality: AlbumQualityResult): AlbumQualityResult {
  return {
    ...quality,
    accepted: true,
    notes: [
      ...quality.notes,
      "Selectată drept cea mai bună variantă sigură după verificări editoriale suplimentare.",
    ].slice(0, 5),
  };
}

export function buildAlbumImageRetryPrompt(
  originalPrompt: string,
  quality: AlbumQualityResult,
  identityRequired: boolean,
) {
  const corrections: string[] = [];
  if (identityRequired && quality.identityScore < 58) {
    corrections.push("Preserve the exact face, apparent age, hairstyle, outfit and recurring character details from the reference image.");
  }
  if (quality.storyScore < 58) {
    corrections.push("Show the requested action, location, characters and important props more literally and clearly.");
  }
  if (quality.technicalScore < 62) {
    corrections.push("Improve anatomy, hands, facial expressions, perspective, composition and premium editorial finish.");
  }
  corrections.push("Do not add letters, words, logos, watermarks, frames or text boxes inside the image.");
  return `${originalPrompt}\n\nEDITORIAL REVISION ${corrections.join(" ")}`;
}
