import sharp from "sharp";

const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MIN_SIDE = 256;

function decodeImageDataUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(value);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_SOURCE_BYTES) return null;
  return buffer;
}

export async function sanitizeAlbumReferencePhoto(value: unknown) {
  const source = decodeImageDataUrl(value);
  if (!source) throw new Error("Fotografia trebuie să fie JPG, PNG sau WebP și să aibă cel mult 4 MB.");

  const metadata = await sharp(source, { failOn: "warning" }).metadata();
  if (!metadata.width || !metadata.height || metadata.width < MIN_SIDE || metadata.height < MIN_SIDE) {
    throw new Error("Fotografia este prea mică. Folosește una de cel puțin 256 × 256 pixeli.");
  }

  const buffer = await sharp(source)
    .rotate()
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#f7f0df" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`,
    mimeType: "image/jpeg" as const,
  };
}
