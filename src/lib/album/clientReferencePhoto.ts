"use client";
import { PHOTO_MAX_BYTES, PHOTO_MIN_SIDE, PHOTO_MAX_PIXELS, PHOTO_MAX_SIDE } from "../characterPhotoPolicy";

export async function prepareReferencePhoto(file: File) {
  if (!file.type.match(/^image\/(?:jpeg|png|webp)$/) || file.size > PHOTO_MAX_BYTES) {
    throw new Error("Alege o fotografie JPG, PNG sau WebP de cel mult 10 MB.");
  }
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Fotografia nu a putut fi citită."));
      element.src = source;
    });
    if (image.naturalWidth < PHOTO_MIN_SIDE || image.naturalHeight < PHOTO_MIN_SIDE) throw new Error("Fotografia trebuie să aibă cel puțin 512 × 512 pixeli.");
    if (image.naturalWidth * image.naturalHeight > PHOTO_MAX_PIXELS) throw new Error("Fotografia depășește limita de 40 megapixeli.");
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fotografia nu a putut fi pregătită.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(source);
  }
}
