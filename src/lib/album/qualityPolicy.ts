import type { AlbumQualityResult } from './types.ts';

export const ALBUM_QUALITY_MINIMUM = { identity: 85, story: 75, technical: 75 } as const;
export class AlbumQualityUnavailableError extends Error {
  constructor(cause?: unknown) { super('album_quality_unavailable', { cause }); }
}
export function meetsAlbumQuality(quality: AlbumQualityResult, identityRequired: boolean) {
  return quality.mode === 'ai' && !quality.hardFailure
    && quality.technicalScore >= ALBUM_QUALITY_MINIMUM.technical
    && quality.storyScore >= ALBUM_QUALITY_MINIMUM.story
    && (!identityRequired || quality.identityScore >= ALBUM_QUALITY_MINIMUM.identity);
}
/** Retry the check, never the billable illustration, when the evaluator is unavailable. */
export async function retryAlbumQuality<T>(check: () => Promise<T>, wait: () => Promise<void>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try { return await check(); } catch (error) {
      if (!(error instanceof AlbumQualityUnavailableError) || i === attempts - 1) throw error;
      await wait();
    }
  }
  throw new AlbumQualityUnavailableError();
}
