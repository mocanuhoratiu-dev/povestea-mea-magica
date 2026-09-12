import sharp from "sharp";
import { PHOTO_MAX_BYTES, PHOTO_MIN_SIDE, PHOTO_MAX_PIXELS, PHOTO_MAX_SIDE } from "../characterPhotoPolicy.ts";

function decodeImageDataUrl(value: unknown) {
  if (typeof value !== "string" || value.length > Math.ceil(PHOTO_MAX_BYTES * 4 / 3) + 64) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(value);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > PHOTO_MAX_BYTES) return null;
  return buffer;
}

export async function sanitizeAlbumReferencePhoto(value: unknown) {
  const source = decodeImageDataUrl(value);
  if (!source) throw new Error("Fotografia trebuie să fie JPG, PNG sau WebP și să aibă cel mult 10 MB.");

  const metadata = await sharp(source, { failOn: "warning", limitInputPixels: PHOTO_MAX_PIXELS }).metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error("Folosește o fotografie statică JPG, PNG sau WebP.");
  if (!metadata.width || !metadata.height || metadata.width < PHOTO_MIN_SIDE || metadata.height < PHOTO_MIN_SIDE) {
    throw new Error("Fotografia este prea mică. Folosește una de cel puțin 512 × 512 pixeli.");
  }

  const buffer = await sharp(source, { limitInputPixels: PHOTO_MAX_PIXELS })
    .rotate()
    .resize(PHOTO_MAX_SIDE, PHOTO_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#f7f0df" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`,
    mimeType: "image/jpeg" as const,
  };
}
