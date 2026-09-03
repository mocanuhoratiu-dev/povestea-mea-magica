import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import sharp from "sharp";
import type { AlbumConfiguration, AlbumPanelPosition, AlbumPlan } from "@/lib/album/types";

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
};

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function prepareLandscapeImage(buffer: Buffer) {
  const jpeg = await sharp(buffer)
    .resize(1600, 1128, { fit: "cover", position: "centre" })
    .jpeg({ quality: 84, progressive: true })
    .toBuffer();
  return toDataUrl(jpeg, "image/jpeg");
}

async function prepareColoringImage(buffer: Buffer) {
  const png = await sharp(buffer)
    .resize(1450, 850, { fit: "contain", background: "white" })
    .grayscale()
    .normalize()
    .threshold(205)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return toDataUrl(png, "image/png");
}

async function preparePortraitImage(buffer: Buffer) {
  const jpeg = await sharp(buffer)
    .resize(720, 1220, { fit: "cover", position: "attention" })
    .jpeg({ quality: 84, progressive: true })
    .toBuffer();
  return toDataUrl(jpeg, "image/jpeg");
}

async function prepareLogo(buffer: Buffer) {
  const png = await sharp(buffer)
    .resize(400, 400, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toBuffer();
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

function drawPageNumber(doc: jsPDF, pageNumber: number, darkPanel = false) {
  doc.setFillColor(darkPanel ? GOLD : NAVY);
  doc.circle(PAGE_W - 9, PAGE_H - 7.4, 3.2, "F");
  doc.setTextColor(darkPanel ? NAVY : CREAM);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.5);
  doc.text(String(pageNumber), PAGE_W - 9, PAGE_H - 6.6, { align: "center" });
}

function storyPanelRect(position: AlbumPanelPosition) {
  const margin = 7;
  const width = position === "bottom" ? PAGE_W - margin * 2 : 100;
  const height = position === "bottom" ? 35 : 47;
  const positions: Record<AlbumPanelPosition, [number, number]> = {
    "top-left": [margin, margin],
    "top-right": [PAGE_W - width - margin, margin],
    "bottom-left": [margin, PAGE_H - height - margin],
    "bottom-right": [PAGE_W - width - margin, PAGE_H - height - margin],
    bottom: [margin, PAGE_H - height - margin],
  };
  return { x: positions[position][0], y: positions[position][1], width, height };
}

function drawStoryPanel(doc: jsPDF, scene: AlbumPlan["scenes"][number], pageNumber: number) {
  const { x, y, width, height } = storyPanelRect(scene.panelPosition);
  const dark = scene.panelTone === "navy";
  doc.setFillColor(dark ? NAVY : CREAM);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2.2, 2.2, "FD");
  doc.roundedRect(x + 1.4, y + 1.4, width - 2.8, height - 2.8, 1.5, 1.5, "S");

  doc.setFont("Liberation", "bold");
  doc.setFontSize(8);
  doc.setTextColor(dark ? GOLD_LIGHT : BLUE);
  const headingLines = doc.splitTextToSize(scene.heading.toLocaleUpperCase("ro-RO"), width - 10) as string[];
  if (headingLines.length > 2) throw new Error(`Titlul scenei ${pageNumber} nu încape în panou.`);
  doc.text(headingLines, x + 5, y + 7.2, { lineHeightFactor: 1.08 });

  doc.setFont("Liberation", "normal");
  doc.setTextColor(dark ? CREAM : INK);
  const bodyY = y + 9.5 + headingLines.length * 3.2;
  const availableHeight = y + height - 5 - bodyY;
  let bodyFontSize = scene.panelPosition === "bottom" ? 11.2 : 10.8;
  let lines: string[] = [];
  let lineHeight = 0;
  while (bodyFontSize >= 9.2) {
    doc.setFontSize(bodyFontSize);
    lines = doc.splitTextToSize(scene.text, width - 10) as string[];
    lineHeight = bodyFontSize * 0.3528 * 1.18;
    if (lines.length * lineHeight <= availableHeight) break;
    bodyFontSize -= 0.25;
  }
  if (bodyFontSize < 9.2 || lines.length * lineHeight > availableHeight) {
    throw new Error(`Textul scenei ${pageNumber} nu încape în panou.`);
  }
  doc.text(lines, x + 5, bodyY, { lineHeightFactor: 1.18 });
  drawPageNumber(doc, pageNumber, dark);
}

function drawCover(doc: jsPDF, cover: string, title: string, childName: string, logo: string) {
  doc.addImage(cover, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
  doc.setFillColor(NAVY);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.35);
  doc.roundedRect(10, 34, 106, 88, 2.5, 2.5, "FD");
  doc.roundedRect(12, 36, 102, 84, 1.8, 1.8, "S");
  doc.setTextColor(GOLD);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.5);
  doc.text("ALBUM ILUSTRAT PERSONALIZAT", 18, 46);
  doc.setTextColor(CREAM);
  doc.setFontSize(title.length > 58 ? 18 : 21);
  const titleLines = (doc.splitTextToSize(title, 88) as string[]).slice(0, 3);
  doc.text(titleLines, 18, 60, { lineHeightFactor: 1.12 });
  doc.setDrawColor(GOLD);
  doc.line(18, 96, 55, 96);
  doc.setTextColor(GOLD_LIGHT);
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8.5);
  doc.text(`O aventură creată pentru ${childName}`, 18, 104);
  drawLogo(doc, logo, PAGE_W - 23, 7, 15);
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
  doc.setFontSize(23);
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
    doc.text(config.dedicationFrom, 80, 111, { align: "center" });
  }
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

function drawEndMark(doc: jsPDF) {
  doc.setFillColor(NAVY);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE_W / 2 - 18, PAGE_H - 15, 36, 9, 2, 2, "FD");
  doc.setFont("Liberation", "italic");
  doc.setFontSize(11);
  doc.setTextColor(GOLD_LIGHT);
  doc.text("Sfârșit", PAGE_W / 2, PAGE_H - 8.8, { align: "center" });
}

function drawActivityHeader(doc: jsPDF, eyebrow: string, title: string, subtitle: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(NAVY);
  doc.rect(0, 0, PAGE_W, 29, "F");
  drawSpark(doc, 11, 10, 2.2);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(GOLD);
  doc.text(eyebrow.toLocaleUpperCase("ro-RO"), 17, 11);
  doc.setFontSize(title.length > 36 ? 15 : 17);
  doc.setTextColor(CREAM);
  doc.text(title, 10, 22);
  doc.setFont("Liberation", "italic");
  doc.setFontSize(7.2);
  doc.setTextColor(GOLD_LIGHT);
  doc.text(subtitle, PAGE_W - 10, 20, { align: "right" });
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

function drawFivePointStar(doc: jsPDF, x: number, y: number, radius: number) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = Math.PI * (-0.5 + index / 5);
    const pointRadius = index % 2 === 0 ? radius : radius * 0.42;
    return [x + Math.cos(angle) * pointRadius, y + Math.sin(angle) * pointRadius] as [number, number];
  });
  doc.setDrawColor(NAVY_SOFT);
  doc.setLineWidth(0.55);
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    doc.line(points[index][0], points[index][1], next[0], next[1]);
  }
}

function drawActivityCover(doc: jsPDF, config: AlbumConfiguration, cover: string, logo: string) {
  doc.setFillColor(NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawBorder(doc);
  doc.addImage(cover, "JPEG", 121, 13, 72, 122, undefined, "FAST");
  doc.setFillColor(CREAM);
  doc.roundedRect(118, 10, 78, 128, 2, 2, "S");
  doc.setFont("Liberation", "bold");
  doc.setTextColor(GOLD);
  doc.setFontSize(6.5);
  doc.text("CAIET DE ACTIVITĂȚI PERSONALIZAT", 17, 27);
  doc.setTextColor(CREAM);
  doc.setFontSize(22);
  doc.text(["Caietul magic", `pentru ${config.generation.name}`], 17, 48, { lineHeightFactor: 1.15 });
  doc.setDrawColor(GOLD);
  doc.line(17, 78, 55, 78);
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(GOLD_LIGHT);
  doc.text("6 jocuri inspirate din poveste", 17, 87);
  drawLogo(doc, logo, 17, 102, 16);
  doc.setFont("Liberation", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(CREAM_DARK);
  doc.text("Pentru creioane colorate, joacă și imaginație", 17, 129);
}

function drawColoringPage(doc: jsPDF, coloring: string) {
  drawActivityHeader(doc, "Joacă după poveste", "Dă culoare aventurii", "Poți inventa propriile culori");
  doc.setDrawColor(GOLD);
  doc.roundedRect(10, 36, PAGE_W - 20, PAGE_H - 47, 2, 2, "S");
  doc.addImage(coloring, "PNG", 14, 39, PAGE_W - 28, PAGE_H - 54, undefined, "FAST");
  drawPageNumber(doc, 1);
}

function drawMazePage(doc: jsPDF) {
  drawActivityHeader(doc, "Misiunea companionului", "Găsește drumul spre lumină", "Începe de la steluță");
  const cols = 12;
  const rows = 6;
  const maze = buildMaze(cols, rows);
  const x0 = 14;
  const y0 = 38;
  const width = PAGE_W - 28;
  const height = PAGE_H - 51;
  const cw = width / cols;
  const ch = height / rows;
  doc.setDrawColor(NAVY_SOFT);
  doc.setLineWidth(0.55);
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
  drawSpark(doc, x0 + cw / 2, y0 + ch / 2, 2.2);
  doc.setFillColor(NAVY);
  doc.rect(x0 + width - cw * 0.72, y0 + height - ch * 0.78, cw * 0.44, ch * 0.44, "F");
  doc.setFillColor(GOLD);
  doc.circle(x0 + width - cw * 0.5, y0 + height - ch * 0.25, 1.8, "F");
  drawPageNumber(doc, 2);
}

function drawContinuePage(doc: jsPDF, childName: string) {
  drawActivityHeader(doc, "Povestea merge mai departe", "Desenează următoarea aventură", `${childName} alege ce se întâmplă`);
  doc.setDrawColor(GOLD);
  doc.roundedRect(12, 40, PAGE_W - 24, PAGE_H - 53, 2.3, 2.3, "S");
  [["UNDE MERGE?", 27], ["CE DESCOPERĂ?", PAGE_W / 2], ["CINE AJUTĂ?", PAGE_W - 27]].forEach(([label, x]) => {
    drawSpark(doc, Number(x), 37, 1.5);
    doc.setFont("Liberation", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(BLUE);
    doc.text(String(label), Number(x), 45, { align: "center" });
  });
  drawPageNumber(doc, 3);
}

function drawConnectDotsPage(doc: jsPDF) {
  drawActivityHeader(doc, "Joc de observație", "Unește punctele și descoperă steaua", "La final, unește punctul 10 cu 1");
  const centerX = PAGE_W / 2;
  const centerY = 84;
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = Math.PI * (-0.5 + index / 5);
    const radius = index % 2 === 0 ? 40 : 17;
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius] as [number, number];
  });
  doc.setDrawColor(BLUE);
  doc.setLineWidth(0.45);
  points.forEach(([x, y], index) => {
    doc.setFillColor(CREAM);
    doc.circle(x, y, 1.6, "FD");
    doc.setFont("Liberation", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(BLUE);
    doc.text(String(index + 1), x + (x < centerX ? -4 : 4), y + (y < centerY ? -2 : 4), { align: "center" });
  });
  [[30, 48], [178, 48], [34, 127], [174, 124]].forEach(([x, y]) => drawSpark(doc, x, y, 1.6, GOLD_LIGHT));
  drawPageNumber(doc, 4);
}

function drawHiddenStarsPage(doc: jsPDF) {
  drawActivityHeader(doc, "Misiunea grădinii", "Găsește cele 7 steluțe", "Încercuiește-le pe toate");
  doc.setDrawColor(GOLD);
  doc.roundedRect(12, 40, PAGE_W - 24, PAGE_H - 53, 2.2, 2.2, "S");
  [[30, 60, 5], [61, 111, 4], [89, 54, 5], [119, 85, 4.5], [150, 59, 3.8], [175, 112, 5], [185, 80, 4]].forEach(([x, y, r]) => drawFivePointStar(doc, x, y, r));
  doc.setDrawColor(BLUE);
  [[45, 83], [77, 72], [104, 115], [139, 104], [163, 86]].forEach(([x, y]) => {
    doc.circle(x, y, 4, "S");
    doc.circle(x + 1.5, y - 0.8, 3, "S");
  });
  [[50, 51], [96, 93], [133, 51], [166, 51], [34, 119]].forEach(([x, y]) => {
    for (let angle = 0; angle < 360; angle += 60) {
      const radians = angle * Math.PI / 180;
      doc.circle(x + Math.cos(radians) * 4, y + Math.sin(radians) * 4, 1.2, "S");
    }
    doc.circle(x, y, 1.5, "S");
  });
  drawPageNumber(doc, 5);
}

function drawMemoryPage(doc: jsPDF) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawBorder(doc);
  drawSpark(doc, 12, 12, 1.8);
  drawSpark(doc, PAGE_W - 12, PAGE_H - 12, 1.8);
  doc.setFont("Liberation", "bold");
  doc.setTextColor(BLUE);
  doc.setFontSize(6.5);
  doc.text("PAGINA NOASTRĂ DE AMINTIRE", PAGE_W / 2, 24, { align: "center" });
  doc.setTextColor(NAVY);
  doc.setFontSize(19);
  doc.text("Când am citit povestea", PAGE_W / 2, 38, { align: "center" });
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8);
  doc.setTextColor(INK);
  doc.text("Un loc pentru clipa voastră de lumină", PAGE_W / 2, 48, { align: "center" });
  [["DATA", 68], ["CINE A CITIT", 88], ["MOMENTUL NOSTRU PREFERAT", 112]].forEach(([label, y]) => {
    doc.setFont("Liberation", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(BLUE);
    doc.text(String(label), 24, Number(y) - 3);
    doc.setDrawColor(BLUE);
    doc.setLineWidth(0.25);
    doc.line(24, Number(y), PAGE_W - 24, Number(y));
  });
  drawPageNumber(doc, 6);
}

function drawActivityBack(doc: jsPDF, childName: string, logo: string) {
  doc.setFillColor(CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawBorder(doc);
  drawLogo(doc, logo, PAGE_W / 2 - 14, 40, 28);
  doc.setFont("Liberation", "bold");
  doc.setFontSize(17);
  doc.setTextColor(NAVY);
  doc.text(`Bravo, ${childName}!`, PAGE_W / 2, 83, { align: "center" });
  doc.setFont("Liberation", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(INK);
  doc.text("Ai dus toate misiunile până la capăt.", PAGE_W / 2, 94, { align: "center" });
  doc.setFont("Liberation", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(BLUE);
  doc.text("POVESTEA-MEA-MAGICA.RO", PAGE_W / 2, 130, { align: "center" });
}

export async function renderAlbumDocuments(config: AlbumConfiguration, plan: AlbumPlan, assets: AlbumAssets) {
  if (assets.scenes.length !== 13) throw new Error("Albumul are nevoie de exact 13 ilustrații distincte.");
  const [cover, activityCover, coloring, logo] = await Promise.all([
    prepareLandscapeImage(assets.cover),
    preparePortraitImage(assets.cover),
    prepareColoringImage(assets.coloring),
    readFile(path.join(process.cwd(), "public", "brand-mark.png")).then(prepareLogo),
  ]);
  const sceneImages = await Promise.all(assets.scenes.map(prepareLandscapeImage));

  const storybook = await createDocument(`${plan.title} - Album ilustrat`);
  drawCover(storybook, cover, plan.title, config.generation.name, logo);
  storybook.addPage();
  drawDedication(storybook, config, logo);
  plan.scenes.forEach((scene, index) => {
    storybook.addPage();
    storybook.addImage(sceneImages[index], "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
    const isFinal = index === plan.scenes.length - 1;
    const finalScene = isFinal && (scene.panelPosition === "bottom" || scene.panelPosition.startsWith("bottom-"))
      ? { ...scene, panelPosition: "top-left" as const }
      : scene;
    drawStoryPanel(storybook, finalScene, index + 1);
    if (isFinal) drawEndMark(storybook);
  });
  storybook.addPage();
  drawBackCover(storybook, logo);

  const activities = await createDocument(`Caietul magic pentru ${config.generation.name}`);
  drawActivityCover(activities, config, activityCover, logo);
  activities.addPage();
  drawColoringPage(activities, coloring);
  activities.addPage();
  drawMazePage(activities);
  activities.addPage();
  drawContinuePage(activities, config.generation.name);
  activities.addPage();
  drawConnectDotsPage(activities);
  activities.addPage();
  drawHiddenStarsPage(activities);
  activities.addPage();
  drawMemoryPage(activities);
  activities.addPage();
  drawActivityBack(activities, config.generation.name, logo);

  return { storybook: outputBuffer(storybook), activityBooklet: outputBuffer(activities) };
}
