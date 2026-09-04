import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import sharp from "sharp";
import type { AlbumConfiguration, AlbumPlan, AlbumSceneLayout } from "@/lib/album/types";

const PAGE_W = 210;
const PAGE_H = 148;
const NAVY = "#07182c";
const NAVY_SOFT = "#102c48";
const INK = "#14283a";
const CREAM = "#fff8e8";
const CREAM_DARK = "#f3e8c9";
const GOLD = "#d9ad3f";
const GOLD_LIGHT = "#f3d77b";
const BLUE = "#477a9f";

type AlbumAssets = {
  cover: Buffer;
  scenes: Buffer[];
  coloring: Buffer;
  differences: Buffer;
};

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function prepareCoverImage(buffer: Buffer) {
  const width = 2100;
  const height = 1480;
  const veil = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="v" x1="0" x2="1"><stop offset="0" stop-color="#07182c" stop-opacity="0.92"/><stop offset="0.34" stop-color="#07182c" stop-opacity="0.62"/><stop offset="0.62" stop-color="#07182c" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
  const jpeg = await sharp(buffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .composite([{ input: veil }])
    .sharpen({ sigma: 0.7 })
    .jpeg({ quality: 91, progressive: true })
    .toBuffer();
  return toDataUrl(jpeg, "image/jpeg");
}

async function prepareStoryImage(buffer: Buffer, layout: AlbumSceneLayout) {
  const cinematic = layout === "cinematic";
  const jpeg = await sharp(buffer)
    .resize(cinematic ? 2100 : 1240, cinematic ? 910 : 1480, {
      fit: "cover",
      position: cinematic ? "attention" : layout === "image-left" ? "west" : "east",
    })
    .sharpen({ sigma: 0.55 })
    .jpeg({ quality: 89, progressive: true })
    .toBuffer();
  return toDataUrl(jpeg, "image/jpeg");
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

async function prepareActivityCoverImage(buffer: Buffer) {
  const width = 2100;
  const height = 1480;
  const veil = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="v" x1="0" x2="1"><stop offset="0" stop-color="#07182c" stop-opacity="0.96"/><stop offset="0.42" stop-color="#07182c" stop-opacity="0.76"/><stop offset="0.72" stop-color="#07182c" stop-opacity="0.08"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
  const jpeg = await sharp(buffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .composite([{ input: veil }])
    .sharpen({ sigma: 0.55 })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();
  return toDataUrl(jpeg, "image/jpeg");
}

async function prepareDifferenceImages(buffer: Buffer) {
  const width = 1200;
  const height = 900;
  const base = await sharp(buffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .sharpen({ sigma: 0.55 })
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();
  const variations = [
    { left: 80, top: 80, size: 150, hue: 78 },
    { left: 970, top: 90, size: 145, hue: 145 },
    { left: 70, top: 390, size: 150, hue: 215 },
    { left: 970, top: 410, size: 150, hue: 285 },
    { left: 520, top: 690, size: 155, hue: 120 },
  ];
  const patches = await Promise.all(variations.map(async ({ left, top, size, hue }) => {
    const mask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="soft"><feGaussianBlur stdDeviation="8"/></filter></defs><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="white" filter="url(#soft)"/></svg>`);
    const patch = await sharp(base)
      .extract({ left, top, width: size, height: size })
      .modulate({ saturation: 1.45, hue })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
    return { input: patch, left, top };
  }));
  const changed = await sharp(base).composite(patches).jpeg({ quality: 89, progressive: true }).toBuffer();
  return { original: toDataUrl(base, "image/jpeg"), changed: toDataUrl(changed, "image/jpeg") };
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
  doc.setFillColor(dark ? GOLD : NAVY);
  doc.circle(PAGE_W - 9, PAGE_H - 7.4, 3.2, "F");
  doc.setTextColor(dark ? NAVY : CREAM);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.5);
  doc.text(String(pageNumber), PAGE_W - 9, PAGE_H - 6.6, { align: "center" });
}

function drawCover(doc: jsPDF, cover: string, title: string, childName: string, logo: string) {
  doc.addImage(cover, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "MEDIUM");
  drawSpark(doc, 16, 18, 2.5, GOLD_LIGHT);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.55);
  doc.line(22, 18, 54, 18);
  doc.setFont("Liberation", "bold");
  doc.setTextColor(GOLD_LIGHT);
  doc.setFontSize(6.5);
  doc.text("ALBUM ILUSTRAT PERSONALIZAT", 15, 27);

  const titleLines = (doc.splitTextToSize(title, 94) as string[]).slice(0, 3);
  let titleSize = titleLines.length > 2 ? 19 : 23;
  doc.setFontSize(titleSize);
  while (titleSize > 17 && titleLines.some((line) => doc.getTextWidth(line) > 94)) {
    titleSize -= 0.5;
    doc.setFontSize(titleSize);
  }
  doc.setTextColor(NAVY);
  doc.text(titleLines, 15.8, 42.8, { lineHeightFactor: 1.08 });
  doc.setTextColor(CREAM);
  doc.text(titleLines, 15, 42, { lineHeightFactor: 1.08 });

  const titleHeight = titleLines.length * titleSize * 0.3528 * 1.08;
  const subtitleY = Math.min(112, 48 + titleHeight);
  doc.setFont("Liberation", "italic");
  doc.setTextColor(GOLD_LIGHT);
  const subtitle = `O aventură creată pentru ${childName}`;
  fitSingleLine(doc, subtitle, 92, 9, 7);
  doc.text(subtitle, 15, subtitleY);
  doc.setDrawColor(GOLD);
  doc.line(15, subtitleY + 5, 50, subtitleY + 5);

  drawLogo(doc, logo, 15, 120, 16);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(CREAM_DARK);
  doc.text("POVESTEA MEA MAGICĂ", 35, 130);
}

function drawDedication(doc: jsPDF, config: AlbumConfiguration, logo: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawBorder(doc);
  drawLogo(doc, logo, PAGE_W - 55, 43, 35);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BLUE);
  doc.text("O POVESTE CREATĂ SPECIAL PENTRU", 18, 28);
  fitSingleLine(doc, config.generation.name, 82, 23, 13);
  doc.setTextColor(NAVY);
  doc.text(config.generation.name, 18, 43);
  doc.setDrawColor(GOLD);
  doc.line(18, 48, 78, 48);
  doc.setFont("Liberation", "normal");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  const dedication = config.dedication || `Pentru ${config.generation.name}, cu drag și cu lumină pentru fiecare aventură.`;
  const dedicationLines = (doc.splitTextToSize(dedication, 105) as string[]).slice(0, 6);
  doc.text(dedicationLines, 70.5, 66, { align: "center", maxWidth: 105, lineHeightFactor: 1.4 });
  if (config.dedicationFrom) {
    doc.setFont("Liberation", "italic");
    doc.setTextColor(BLUE);
    doc.setFontSize(10);
    const signatureLines = (doc.splitTextToSize(config.dedicationFrom, 105) as string[]).slice(0, 2);
    doc.text(signatureLines, 80, 108, { align: "center", lineHeightFactor: 1.25 });
  }
}

function drawStoryPage(doc: jsPDF, image: string, scene: AlbumPlan["scenes"][number], pageNumber: number, isFinal: boolean) {
  const dark = scene.panelTone === "navy";
  const cinematic = scene.layout === "cinematic";
  const imageW = 124;
  const panelX = scene.layout === "image-left" ? imageW : 0;
  const imageX = scene.layout === "image-right" ? PAGE_W - imageW : 0;
  const panelW = cinematic ? PAGE_W : PAGE_W - imageW;
  const panelY = cinematic ? 91 : 0;
  const panelH = cinematic ? PAGE_H - panelY : PAGE_H;

  if (cinematic) doc.addImage(image, "JPEG", 0, 0, PAGE_W, panelY, undefined, "MEDIUM");
  else doc.addImage(image, "JPEG", imageX, 0, imageW, PAGE_H, undefined, "MEDIUM");
  doc.setFillColor(dark ? NAVY : CREAM);
  doc.rect(panelX, panelY, panelW, panelH, "F");
  doc.setFillColor(GOLD);
  if (cinematic) doc.rect(0, panelY, PAGE_W, 1.2, "F");
  else doc.rect(scene.layout === "image-left" ? imageW - 1.2 : panelW, 0, 1.2, PAGE_H, "F");

  const textX = cinematic ? 18 : panelX + 11;
  const headingY = cinematic ? 103 : 31;
  drawSpark(doc, cinematic ? 13 : panelX + 7, cinematic ? 102 : 18, 1.7, dark ? GOLD_LIGHT : GOLD);

  doc.setFont("Liberation", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(dark ? GOLD_LIGHT : BLUE);
  const heading = scene.heading.toLocaleUpperCase("ro-RO");
  fitSingleLine(doc, heading, cinematic ? 132 : panelW - 22, cinematic ? 7.4 : 8.3, 6.2);
  doc.text(heading, textX, headingY);

  const maxWidth = cinematic ? (isFinal ? 150 : 178) : panelW - 22;
  const maxHeight = cinematic ? 26 : (isFinal ? 69 : 82);
  let bodySize = cinematic ? 10.6 : 10.2;
  let lines: string[] = [];
  let lineHeight = 0;
  doc.setFont("Liberation", "normal");
  doc.setTextColor(dark ? CREAM : INK);
  while (bodySize >= 9.4) {
    doc.setFontSize(bodySize);
    lines = doc.splitTextToSize(scene.text, maxWidth) as string[];
    lineHeight = bodySize * 0.3528 * 1.2;
    if (lines.length * lineHeight <= maxHeight) break;
    bodySize -= 0.2;
  }
  if (lines.length * lineHeight > maxHeight) throw new Error(`Textul scenei ${pageNumber} nu încape în zona editorială.`);
  doc.text(lines, cinematic ? 14 : textX, cinematic ? 113 : 47, { lineHeightFactor: 1.2 });

  if (isFinal) {
    doc.setFont("Liberation", "italic");
    doc.setFontSize(13);
    doc.setTextColor(dark ? GOLD_LIGHT : BLUE);
    const endingX = cinematic ? 180 : panelX + panelW / 2;
    const endingY = cinematic ? 134 : 130;
    doc.text("Sfârșit", endingX, endingY, { align: "center" });
    drawSpark(doc, endingX, endingY - 11, 1.8, dark ? GOLD_LIGHT : GOLD);
  }
  drawPageNumber(doc, pageNumber, dark);
}

function drawBackCover(doc: jsPDF, logo: string) {
  doc.setFillColor(NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  [[26, 25, 1.6], [44, 121, 1], [174, 31, 1.8], [187, 117, 1.1]].forEach(([x, y, size]) => drawSpark(doc, x, y, size));
  drawLogo(doc, logo, PAGE_W / 2 - 16, 50, 32);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(13);
  doc.setTextColor(CREAM);
  doc.text("Povestea Mea Magică", PAGE_W / 2, 91, { align: "center" });
  doc.setFontSize(6.2);
  doc.setTextColor(GOLD);
  doc.text("O POVESTE ÎN CARE COPILUL TĂU CONTEAZĂ", PAGE_W / 2, 100, { align: "center" });
  doc.setFont("Liberation", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(CREAM_DARK);
  doc.text("povestea-mea-magica.ro", PAGE_W / 2, 136, { align: "center" });
}

function drawActivityHeader(doc: jsPDF, eyebrow: string, title: string, subtitle: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(NAVY);
  doc.rect(0, 0, PAGE_W, 29, "F");
  drawSpark(doc, 11, 10, 2.2);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(GOLD);
  fitSingleLine(doc, eyebrow.toLocaleUpperCase("ro-RO"), 118, 5.8, 4.8);
  doc.text(eyebrow.toLocaleUpperCase("ro-RO"), 17, 10.5, { align: "left" });
  fitSingleLine(doc, title, 132, title.length > 36 ? 14 : 16, 10.8);
  doc.setTextColor(CREAM);
  doc.text(title, 10, 23, { align: "left" });
  doc.setFont("Liberation", "italic");
  fitSingleLine(doc, subtitle, 57, 6.8, 5.2);
  doc.setTextColor(GOLD_LIGHT);
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

function drawActivityCover(doc: jsPDF, config: AlbumConfiguration, cover: string, logo: string) {
  doc.addImage(cover, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "MEDIUM");
  drawSpark(doc, 16, 18, 2.4, GOLD_LIGHT);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.45);
  doc.line(22, 18, 52, 18);
  doc.setFont("Liberation", "bold");
  doc.setTextColor(GOLD);
  doc.setFontSize(6.5);
  doc.text("CAIET DE ACTIVITĂȚI INCLUS", 15, 29);
  doc.setTextColor(CREAM);
  doc.setFontSize(22);
  doc.text("Trei misiuni", 15, 52);
  fitSingleLine(doc, `pentru ${config.generation.name}`, 82, 22, 13);
  doc.text(`pentru ${config.generation.name}`, 15, 65);
  doc.setDrawColor(GOLD);
  doc.line(15, 79, 50, 79);
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8.2);
  doc.setTextColor(GOLD_LIGHT);
  doc.text(["Colorat · Labirint", "Găsește diferențele"], 15, 89, { lineHeightFactor: 1.35 });
  drawLogo(doc, logo, 15, 117, 16);
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
  const imageH = 76;
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
  doc.text("Caută cinci schimbări de culoare și încercuiește-le în imaginea B.", PAGE_W / 2, 136, { align: "center" });
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
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(BLUE);
  doc.text("POVESTEA-MEA-MAGICA.RO", PAGE_W / 2, 130, { align: "center" });
}

export async function renderAlbumDocuments(config: AlbumConfiguration, plan: AlbumPlan, assets: AlbumAssets) {
  if (assets.scenes.length !== 13) throw new Error("Albumul are nevoie de exact 13 ilustrații distincte.");
  const [cover, activityCover, coloring, differenceImages, logo] = await Promise.all([
    prepareCoverImage(assets.cover),
    prepareActivityCoverImage(assets.cover),
    prepareColoringImage(assets.coloring),
    prepareDifferenceImages(assets.differences),
    readFile(path.join(process.cwd(), "public", "brand-mark.png")).then(prepareLogo),
  ]);
  const sceneImages = await Promise.all(assets.scenes.map((image, index) => prepareStoryImage(image, plan.scenes[index].layout)));

  const storybook = await createDocument(`${plan.title} - Album ilustrat`);
  drawCover(storybook, cover, plan.title, config.generation.name, logo);
  storybook.addPage();
  drawDedication(storybook, config, logo);
  plan.scenes.forEach((scene, index) => {
    storybook.addPage();
    drawStoryPage(storybook, sceneImages[index], scene, index + 1, index === plan.scenes.length - 1);
  });
  storybook.addPage();
  drawBackCover(storybook, logo);

  const activities = await createDocument(`Caietul magic pentru ${config.generation.name}`);
  drawActivityCover(activities, config, activityCover, logo);
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
