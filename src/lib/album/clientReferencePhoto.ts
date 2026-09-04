"use client";

export async function prepareReferencePhoto(file: File) {
  if (!file.type.match(/^image\/(?:jpeg|png|webp)$/) || file.size > 8 * 1024 * 1024) {
    throw new Error("Alege o fotografie JPG, PNG sau WebP de cel mult 8 MB.");
  }
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Fotografia nu a putut fi citită."));
      element.src = source;
    });
    if (image.naturalWidth < 256 || image.naturalHeight < 256) throw new Error("Fotografia trebuie să aibă cel puțin 256 × 256 pixeli.");
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
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
