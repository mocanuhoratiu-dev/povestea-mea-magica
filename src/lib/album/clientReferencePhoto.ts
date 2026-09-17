"use client";
import { PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, checkPhotoDimensions } from "../characterPhotoPolicy";

function convertHeic(file: File, signal?: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./heic.worker.ts", import.meta.url));
    let settled = false;
    const finish = (reason?: Error, blob?: Blob) => {
      if (settled) return;
      settled = true;
      worker.onmessage = null; worker.onerror = null;
      clearTimeout(timer); signal?.removeEventListener("abort", cancel); worker.terminate();
      if (reason) reject(reason); else if (blob) resolve(blob);
    };
    const cancel = () => finish(new DOMException("Photo cancelled", "AbortError"));
    const timer = setTimeout(() => finish(new Error("Conversia fotografiei durează prea mult. Încearcă o fotografie mai mică sau exportă imaginea în JPG.")), 45_000);
    worker.onmessage = ({ data }: MessageEvent<{ error?: string; blob?: Blob }>) => {
      if (data.blob?.type === "image/jpeg") finish(undefined, data.blob);
      else finish(new Error(data.error || "Fotografia HEIC nu a putut fi convertită. Alege varianta JPG."));
    };
    worker.onerror = (event) => { event.preventDefault(); finish(new Error("Conversia HEIC nu este disponibilă în acest browser. Alege varianta JPG a fotografiei.")); };
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel(); else worker.postMessage(file);
  });
}

export async function prepareReferencePhoto(file: File, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (file.size > PHOTO_MAX_BYTES) throw new Error("Alege o fotografie de cel mult 10 MB.");
  const heic = /^image\/(heic|heif)$/.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!heic && !file.type.match(/^image\/(?:jpeg|png|webp)$/)) {
    throw new Error("Alege o fotografie JPG, PNG, WebP sau HEIC de cel mult 10 MB.");
  }
  const source = URL.createObjectURL(heic ? await convertHeic(file, signal) : file);
  try {
    signal?.throwIfAborted();
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Fotografia nu a putut fi citită."));
      element.src = source;
    });
    signal?.throwIfAborted();
    checkPhotoDimensions(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fotografia nu a putut fi pregătită.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.86);
    canvas.width = canvas.height = 1;
    return result;
  } finally {
    URL.revokeObjectURL(source);
  }
}
