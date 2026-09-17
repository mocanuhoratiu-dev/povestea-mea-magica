import { imageSize } from "image-size";
import { PHOTO_MAX_BYTES, PHOTO_MAX_PIXELS, PHOTO_MAX_SIDE, checkPhotoDimensions } from "../characterPhotoPolicy";

// A separate worker can be terminated on cancel/timeout, including its decoder worker.
self.onmessage = async ({ data: file }: MessageEvent<File>) => {
  let bitmap: ImageBitmap | undefined;
  try {
    if (file.size > PHOTO_MAX_BYTES) throw new Error("Alege o fotografie de cel mult 10 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const size = imageSize(bytes);
    const brand = new TextDecoder().decode(bytes.subarray(8, 12));
    if (['msf1', 'hevc', 'hevx'].includes(brand)) throw new Error("Alege o fotografie HEIC statică, nu o secvență animată.");
    if (!['heic', 'heix', 'mif1'].includes(size.type || '')) throw new Error("Fișierul nu este o fotografie HEIC validă.");
    // HEIF can contain both tiles and a full-resolution image. Check all sizes before decoding.
    for (const entry of size.images || [size]) {
      if (!Number.isFinite(entry.width) || !Number.isFinite(entry.height) || entry.width <= 0 || entry.height <= 0) throw new Error("Fotografia HEIC nu a putut fi citită.");
      if (entry.width * entry.height > PHOTO_MAX_PIXELS) throw new Error("Fotografia depășește limita de 40 megapixeli.");
    }
    try { bitmap = await createImageBitmap(file); }
    catch {
      const { heicTo } = await import("heic-to/csp");
      bitmap = await heicTo({ blob: file, type: "bitmap" });
    }
    checkPhotoDimensions(bitmap.width, bitmap.height);
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Conversia HEIC nu este disponibilă în acest browser. Alege varianta JPG a fotografiei.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: .9 });
    self.postMessage({ blob });
  } catch (reason) {
    const message = reason instanceof Error && /^(Fotografia|Alege|Fișierul|Conversia)/.test(reason.message) ? reason.message : "Fotografia HEIC nu a putut fi convertită. Încearcă altă fotografie sau exportă această imagine în JPG.";
    self.postMessage({ error: message });
  } finally { bitmap?.close(); }
};
