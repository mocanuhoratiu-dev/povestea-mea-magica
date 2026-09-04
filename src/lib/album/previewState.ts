import type { AlbumOrderOutput } from "@/lib/album/types";

export function isAlbumPreviewReady(output: AlbumOrderOutput | null | undefined) {
  return Boolean(output?.plan && output.assets.cover && output.assets.scenes[0] && output.assets.scenes[1]);
}
