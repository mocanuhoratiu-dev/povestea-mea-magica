import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const emblem = await readFile(new URL("public/brand/emblem.svg", root));
await mkdir(new URL("public/brand/", root), { recursive: true });
for (const [file, size] of [
  ["public/brand/email-emblem.png", 256],
  ["public/brand-mark.png", 256],
  ["public/icon.png", 192],
  ["src/app/icon.png", 64],
]) {
  await sharp(emblem).resize(size, size).png().toFile(new URL(file, root).pathname);
  console.log(file, size);
}
await sharp(emblem).resize(256, 256).webp({ quality: 90 }).toFile(new URL("public/brand-mark.webp", root).pathname);
