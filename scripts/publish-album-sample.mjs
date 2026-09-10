import { execFileSync } from "node:child_process";
import { mkdir, copyFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), "pmm-sample-"));
const story = process.argv[2] || "output/pdf/povestea-magica-eva-colectie.pdf";
const activity = process.argv[3] || "output/pdf/caietul-evei-colectie.pdf";
const dest = path.join(root, "public/examples/album/collection");
await mkdir(path.join(dest, "flipbook"), { recursive: true });
for (const [pdf, prefix] of [
  [story, "story"],
  [activity, "activity"],
]) {
  execFileSync(process.env.PDFTOPPM || "pdftoppm", [
    "-scale-to",
    "1600",
    "-png",
    pdf,
    path.join(temp, prefix),
  ]);
}
for (let n = 1; n <= 16; n++) {
  const num = String(n).padStart(2, "0");
  await sharp(path.join(temp, `story-${num}.png`))
    .webp({ quality: 86 })
    .toFile(path.join(dest, `flipbook/page-${num}.webp`));
}
for (const [name, index] of [
  ["coperta", 1],
  ["dedicatie", 2],
  ["aventura", 4],
]) {
  await copyFile(
    path.join(dest, `flipbook/page-${String(index).padStart(2, "0")}.webp`),
    path.join(dest, `${name}.webp`),
  );
}
for (const [name, index] of [
  ["colorat", 2],
  ["labirint", 3],
  ["diferente", 4],
]) {
  await sharp(path.join(temp, `activity-${index}.png`))
    .webp({ quality: 86 })
    .toFile(path.join(dest, `${name}.webp`));
}
await copyFile(story, path.join(dest, "povestea-magica-model.pdf"));
await copyFile(activity, path.join(dest, "caiet-activitati-model.pdf"));
console.log(
  "Published 16 story pages, activity samples and both matching PDFs.",
);
