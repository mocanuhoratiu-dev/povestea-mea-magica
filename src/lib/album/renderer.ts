import { readFile } from "node:fs/promises";
import path from "node:path";
import { chooseEditorialLayout, albumDifferenceSvg, ALBUM_DIFFERENCE_ANSWERS } from "./editorial.ts";
import { jsPDF } from "jspdf";
import sharp from "sharp";
import { drawBookCover, drawBookDedication, drawBookScene, drawBookBack } from './bookDesign.ts';
import type { AlbumConfiguration, AlbumPlan, AlbumSceneLayout } from "@/lib/album/types";

const PAGE_W = 210;
const PAGE_H = 148;
const NAVY = "#402746";
const NAVY_SOFT = "#102c48";
const INK = "#14283a";
const CREAM = "#fffefa";
const CREAM_DARK = "#f3e8c9";
const GOLD = "#d9ad3f";
const GOLD_LIGHT = "#f3d77b";
const BLUE = "#20594f";

type AlbumAssets = {
  cover: Buffer;
  scenes: Buffer[];
  coloring: Buffer;
  differences: Buffer;
};

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function prepareBookArt(buffer: Buffer) {
  return toDataUrl(await sharp(buffer).resize({width:2400,withoutEnlargement:true}).jpeg({quality:95}).toBuffer(),'image/jpeg');
}


async function prepareColoringImage(buffer: Buffer) {
  const png = await sharp(buffer)
    .resize(1700, 920, { fit: "contain", background: "white" })
    .grayscale()
    .normalize()
    .threshold(210)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return toDataUrl(png, "image/png");
}


async function prepareDifferenceImages(buffer: Buffer) {
  void buffer;
  const [original, changed] = await Promise.all([false, true].map(changed => sharp(Buffer.from(albumDifferenceSvg(changed))).resize(1200, 840).jpeg({quality:95}).toBuffer()));
  return { original: toDataUrl(original, "image/jpeg"), changed: toDataUrl(changed, "image/jpeg") };
}


async function prepareLogo(buffer: Buffer) {
  const png = await sharp(buffer).resize(400, 400, { fit: "contain" }).png({ compressionLevel: 9 }).toBuffer();
  return toDataUrl(png, "image/png");
}

async function addFonts(doc: jsPDF) {
  const fontRoot = path.join(process.cwd(), "public", "fonts");
  const [regular, bold, italic] = await Promise.all([
    readFile(path.join(fontRoot, "LiberationSans-Regular.ttf")),
    readFile(path.join(fontRoot, "LiberationSans-Bold.ttf")),
    readFile(path.join(fontRoot, "LiberationSans-Italic.ttf")),
  ]);
  doc.addFileToVFS("LiberationSans-Regular.ttf", regular.toString("base64"));
  doc.addFileToVFS("LiberationSans-Bold.ttf", bold.toString("base64"));
  doc.addFileToVFS("LiberationSans-Italic.ttf", italic.toString("base64"));
  doc.addFont("LiberationSans-Regular.ttf", "Liberation", "normal");
  doc.addFont("LiberationSans-Bold.ttf", "Liberation", "bold");
  doc.addFont("LiberationSans-Italic.ttf", "Liberation", "italic");
  const serif = await readFile(path.join(fontRoot, "CrimsonText-Regular.ttf"));
  doc.addFileToVFS("CrimsonText-Regular.ttf", serif.toString("base64"));
  doc.addFont("CrimsonText-Regular.ttf", "AlbumSerif", "normal");
}

async function createDocument(title: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5", compress: true });
  await addFonts(doc);
  doc.setProperties({ title, author: "Povestea Mea Magică", creator: "Povestea Mea Magică" });
  return doc;
}

function outputBuffer(doc: jsPDF) {
  return Buffer.from(doc.output("arraybuffer"));
}

function drawSpark(doc: jsPDF, x: number, y: number, size: number, color = GOLD) {
  doc.setFillColor(color);
  doc.triangle(x, y - size, x + size * 0.22, y, x, y + size, "F");
  doc.triangle(x, y - size, x - size * 0.22, y, x, y + size, "F");
  doc.triangle(x - size, y, x, y - size * 0.22, x + size, y, "F");
  doc.triangle(x - size, y, x, y + size * 0.22, x + size, y, "F");
}

function drawBorder(doc: jsPDF, color = GOLD) {
  doc.setDrawColor(color);
  doc.setLineWidth(0.35);
  doc.roundedRect(8, 8, PAGE_W - 16, PAGE_H - 16, 2.4, 2.4, "S");
}

function drawLogo(doc: jsPDF, logo: string, x: number, y: number, size: number) {
  doc.addImage(logo, "PNG", x, y, size, size, undefined, "FAST");
}

function fitSingleLine(doc: jsPDF, text: string, maxWidth: number, preferredSize: number, minimumSize: number) {
  let size = preferredSize;
  doc.setFontSize(size);
  while (size > minimumSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }
  return size;
}

function companionInSentence(companion: string) {
  return companion ? companion.charAt(0).toLocaleLowerCase("ro-RO") + companion.slice(1) : "companionul";
}

function drawPageNumber(doc: jsPDF, pageNumber: number, dark = false) {
  doc.setTextColor(dark ? GOLD_LIGHT : INK);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.5);
  doc.text(String(pageNumber), PAGE_W - 9, PAGE_H - 6.6, { align: "center" });
}


function drawActivityHeader(doc: jsPDF, eyebrow: string, title: string, subtitle: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setDrawColor('#cbd5c7');doc.setLineWidth(.2);doc.line(10,30,200,30);
  drawSpark(doc, 11, 10, 2.2);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(BLUE);
  fitSingleLine(doc, eyebrow.toLocaleUpperCase("ro-RO"), 118, 5.8, 4.8);
  doc.text(eyebrow.toLocaleUpperCase("ro-RO"), 17, 10.5, { align: "left" });
  doc.setFont('AlbumSerif','normal');
  fitSingleLine(doc, title, 132, title.length > 36 ? 17 : 20, 13);
  doc.setTextColor(NAVY);
  doc.text(title, 10, 23, { align: "left" });
  doc.setFont("Liberation", "italic");
  fitSingleLine(doc, subtitle, 57, 6.8, 5.2);
  doc.setTextColor(BLUE);
  doc.text(subtitle, PAGE_W - 10, 21.5, { align: "right" });
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = state + 0x6d2b79f5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function buildMaze(cols: number, rows: number) {
  const random = seededRandom(29);
  const walls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => new Set(["N", "E", "S", "W"])));
  const seen = new Set(["0,0"]);
  const stack: Array<[number, number]> = [[0, 0]];
  const directions = [[0, -1, "N", "S"], [1, 0, "E", "W"], [0, 1, "S", "N"], [-1, 0, "W", "E"]] as const;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const choices = directions.filter(([dx, dy]) => x + dx >= 0 && x + dx < cols && y + dy >= 0 && y + dy < rows && !seen.has(`${x + dx},${y + dy}`));
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const [dx, dy, wall, opposite] = choices[Math.floor(random() * choices.length)];
    const nx = x + dx;
    const ny = y + dy;
    walls[y][x].delete(wall);
    walls[ny][nx].delete(opposite);
    seen.add(`${nx},${ny}`);
    stack.push([nx, ny]);
  }
  return walls;
}


function drawColoringPage(doc: jsPDF, coloring: string) {
  drawActivityHeader(doc, "Misiunea 1 · Culoare", "Dă culoare aventurii", "Culorile tale schimbă povestea");
  doc.setDrawColor(GOLD);
  doc.roundedRect(10, 36, PAGE_W - 20, PAGE_H - 47, 2, 2, "S");
  doc.addImage(coloring, "PNG", 14, 39, PAGE_W - 28, PAGE_H - 54, undefined, "FAST");
  drawPageNumber(doc, 1);
}

function drawMazePage(doc: jsPDF, companion: string) {
  drawActivityHeader(doc, "Misiunea 2 · Curaj", "Găsește drumul spre lumină", `Ajută ${companionInSentence(companion)} să ajungă la felinar`);
  const cols = 12;
  const rows = 6;
  const maze = buildMaze(cols, rows);
  const x0 = 14;
  const y0 = 38;
  const width = PAGE_W - 28;
  const height = PAGE_H - 51;
  const cw = width / cols;
  const ch = height / rows;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.35);
  doc.roundedRect(x0 - 2, y0 - 2, width + 4, height + 4, 2, 2, "S");
  doc.setDrawColor(NAVY_SOFT);
  doc.setLineWidth(0.5);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const left = x0 + col * cw;
      const top = y0 + row * ch;
      const walls = maze[row][col];
      if (walls.has("N")) doc.line(left, top, left + cw, top);
      if (walls.has("E")) doc.line(left + cw, top, left + cw, top + ch);
      if (walls.has("S")) doc.line(left, top + ch, left + cw, top + ch);
      if (walls.has("W")) doc.line(left, top, left, top + ch);
    }
  }
  doc.setFillColor(CREAM);
  doc.rect(x0, y0, 0.8, ch, "F");
  doc.rect(x0 + width - 0.8, y0 + height - ch, 0.8, ch, "F");
  doc.setFillColor(GOLD);
  doc.circle(x0 + cw / 2, y0 + ch / 2, 4.1, "F");
  drawSpark(doc, x0 + cw / 2, y0 + ch / 2, 2.1, NAVY);
  const finishX = x0 + width - cw * 0.5;
  const finishY = y0 + height - ch * 0.5;
  doc.setDrawColor(NAVY);
  doc.setLineWidth(0.65);
  doc.roundedRect(finishX - 3.3, finishY - 3.6, 6.6, 7.2, 1.2, 1.2, "S");
  doc.line(finishX - 2.3, finishY - 4.6, finishX + 2.3, finishY - 4.6);
  doc.setFillColor(GOLD);
  doc.circle(finishX, finishY, 1.7, "F");
  doc.setFont("Liberation", "bold");
  doc.setFontSize(5.2);
  doc.setTextColor(BLUE);
  doc.text("START", x0 + 1, y0 - 4.5);
  doc.text("LUMINĂ", x0 + width - 1, y0 + height + 6, { align: "right" });
  drawPageNumber(doc, 2);
}

function drawDifferencesPage(doc: jsPDF, images: { original: string; changed: string }) {
  drawActivityHeader(doc, "Misiunea 3 · Observație", "Găsește cele 5 diferențe", "Compară imaginile A și B");
  const imageW = 89;
  const imageH = 62.3;
  const leftX = 10;
  const rightX = 111;
  const imageY = 46;
  doc.setFont("Liberation", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BLUE);
  doc.text("IMAGINEA A", leftX, 41);
  doc.text("IMAGINEA B", rightX, 41);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX - 1.5, imageY - 1.5, imageW + 3, imageH + 3, 2, 2, "S");
  doc.roundedRect(rightX - 1.5, imageY - 1.5, imageW + 3, imageH + 3, 2, 2, "S");
  doc.addImage(images.original, "JPEG", leftX, imageY, imageW, imageH, undefined, "MEDIUM");
  doc.addImage(images.changed, "JPEG", rightX, imageY, imageW, imageH, undefined, "MEDIUM");
  doc.setFont("Liberation", "italic");
  doc.setFontSize(7.2);
  doc.setTextColor(INK);
  doc.text("Caută cinci schimbări de formă sau obiecte și încercuiește-le în imaginea B.", PAGE_W / 2, 136, { align: "center" });
  drawPageNumber(doc, 3);
}

function drawActivityBack(doc: jsPDF, childName: string, logo: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawBorder(doc);
  drawLogo(doc, logo, PAGE_W / 2 - 14, 40, 28);
  doc.setFont("Liberation", "bold");
  fitSingleLine(doc, `Bravo, ${childName}!`, 130, 17, 11);
  doc.setTextColor(NAVY);
  doc.text(`Bravo, ${childName}!`, PAGE_W / 2, 83, { align: "center" });
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(INK);
  doc.text("Ai dus toate cele trei misiuni până la capăt.", PAGE_W / 2, 94, { align: "center" });
  doc.setFontSize(7);
  doc.text(doc.splitTextToSize(`Soluții pentru părinte: ${ALBUM_DIFFERENCE_ANSWERS.join("; ")}.`, 166), 22, 108);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(BLUE);
  doc.text("POVESTEA-MEA-MAGICA.RO", PAGE_W / 2, 130, { align: "center" });
}

export async function renderAlbumDocuments(config: AlbumConfiguration, plan: AlbumPlan, assets: AlbumAssets) {
  if (assets.scenes.length !== 13) throw new Error("Albumul are nevoie de exact 13 ilustrații distincte.");
  const [cover, activityCover, coloring, differenceImages, logo, lumi] = await Promise.all([
    prepareBookArt(assets.cover),
    prepareBookArt(assets.cover),
    prepareColoringImage(assets.coloring),
    prepareDifferenceImages(assets.differences),
    readFile(path.join(process.cwd(), "public", "brand-mark.png")).then(prepareLogo),
    readFile(path.join(process.cwd(), "public", "lumi-guardian.webp")).then(async buffer => toDataUrl(await sharp(buffer).png().toBuffer(),'image/png')),
  ]);
  const layouts = await Promise.all(assets.scenes.map(async (image, index) => {
    const metadata = await sharp(image).metadata();
    return chooseEditorialLayout((metadata.width || 1) / (metadata.height || 1), plan.scenes[index].text.trim().split(/\s+/u).length, plan.scenes[index].layout);
  }));
  const sceneImages = await Promise.all(assets.scenes.map(prepareBookArt));

  const storybook = await createDocument(`${plan.title} - Album ilustrat`);
  drawBookCover(storybook, cover, plan.title, config.generation.name, logo);
  storybook.addPage();
  drawBookDedication(storybook, config, logo, lumi);
  plan.scenes.forEach((scene, index) => {
    storybook.addPage();
    drawBookScene(storybook, sceneImages[index], { ...scene, layout: layouts[index] }, index + 1, index === plan.scenes.length - 1);
  });
  storybook.addPage();
  drawBookBack(storybook, logo, lumi);

  const activities = await createDocument(`Caietul magic pentru ${config.generation.name}`);
  drawBookCover(activities, activityCover, 'Joaca merge mai departe', config.generation.name, logo, true);
  activities.addPage();
  drawColoringPage(activities, coloring);
  activities.addPage();
  drawMazePage(activities, config.generation.companion);
  activities.addPage();
  drawDifferencesPage(activities, differenceImages);
  activities.addPage();
  drawActivityBack(activities, config.generation.name, logo);

  const storybookBuffer = outputBuffer(storybook);
  const activityBookletBuffer = outputBuffer(activities);
  const maximumBytes = 24 * 1024 * 1024;
  if (storybookBuffer.length > maximumBytes || activityBookletBuffer.length > maximumBytes) {
    throw new Error("Documentul depășește limita de 24 MB.");
  }
  return { storybook: storybookBuffer, activityBooklet: activityBookletBuffer };
}
