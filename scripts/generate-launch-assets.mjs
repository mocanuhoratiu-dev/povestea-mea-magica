import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const colors = {
  navy: "#0b1730",
  cream: "#f7f0df",
  gold: "#efc75e",
  purple: "#9c62bd",
  orange: "#e99556",
  ink: "#24324f",
};

function file(relativePath) {
  return path.join(root, relativePath);
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function webpPage(source, destination) {
  await sharp(file(source))
    .resize({ width: 1120, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(file(destination));
}

async function pageCard(source, width, height, angle) {
  const page = await sharp(file(source))
    .resize({ width, height, fit: "cover", position: "top" })
    .extend({ top: 8, right: 8, bottom: 8, left: 8, background: "#fffdf8" })
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const metadata = await sharp(page).metadata();
  return { input: page, width: metadata.width || width, height: metadata.height || height };
}

function copySvg({ eyebrow, lines, detail, price, dark }) {
  const foreground = dark ? colors.cream : colors.ink;
  const accent = dark ? colors.gold : colors.purple;
  const safeEyebrow = escapeXml(eyebrow);
  const safeDetail = escapeXml(detail);
  const title = lines.map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 72}">${escapeXml(line)}</tspan>`).join("");

  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <style>
        .eyebrow { font: 700 20px Arial, sans-serif; letter-spacing: 3px; fill: ${accent}; }
        .title { font: 700 67px Georgia, serif; fill: ${foreground}; }
        .detail { font: 600 24px Arial, sans-serif; fill: ${foreground}; opacity: .82; }
        .price { font: 800 27px Arial, sans-serif; fill: ${dark ? colors.navy : "#ffffff"}; }
        .brand { font: 700 21px Georgia, serif; fill: ${foreground}; }
      </style>
      <text x="72" y="98" class="eyebrow">${safeEyebrow}</text>
      <text x="72" y="194" class="title">${title}</text>
      <text x="72" y="387" class="detail">${safeDetail}</text>
      <rect x="72" y="430" width="150" height="54" rx="2" fill="${accent}"/>
      <text x="98" y="466" class="price">${escapeXml(price)}</text>
      <line x1="72" y1="546" x2="432" y2="546" stroke="${accent}" stroke-width="2" opacity=".65"/>
      <text x="72" y="583" class="brand">Povestea Mea Magică</text>
    </svg>
  `);
}

async function socialCard({ output, background, eyebrow, lines, detail, price, pages, dark }) {
  const [brand, first, second] = await Promise.all([
    sharp(file("public/brand-mark.webp")).resize(58, 58).webp({ quality: 90 }).toBuffer(),
    pageCard(pages[0], 310, 438, -4),
    pageCard(pages[1], 250, 354, 5),
  ]);

  const stage = sharp({
    create: { width: 1200, height: 630, channels: 4, background },
  });

  const cardAccent = dark ? "rgba(156,98,189,.22)" : "rgba(239,199,94,.22)";
  const decoration = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="1200" height="8" fill="${dark ? colors.gold : colors.orange}"/>
      <rect x="700" y="0" width="500" height="630" fill="${cardAccent}"/>
      <circle cx="1110" cy="92" r="4" fill="${colors.gold}"/>
      <circle cx="1066" cy="132" r="7" fill="${colors.gold}"/>
      <path d="M1105 150l8 18 18 8-18 8-8 18-8-18-18-8 18-8z" fill="${colors.gold}"/>
    </svg>
  `);

  await stage
    .composite([
      { input: decoration, left: 0, top: 0 },
      { input: copySvg({ eyebrow, lines, detail, price, dark }), left: 0, top: 0 },
      { input: second.input, left: 919, top: 154 },
      { input: first.input, left: 685, top: 92 },
      { input: brand, left: 420, top: 535 },
    ])
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(file(output));
}

await fs.mkdir(file("public/social"), { recursive: true });

await sharp(file("public/brand-mark.webp"))
  .resize(256, 256, { fit: "cover" })
  .png({ compressionLevel: 9, palette: true, quality: 92 })
  .toFile(file("src/app/icon.optimized.png"));

const pageAssets = [
  ["public/examples/scut/certificat.png", "public/examples/scut/certificat-display.webp"],
  ["public/examples/scut/reteta.png", "public/examples/scut/reteta-display.webp"],
  ["public/examples/scut/etichete.png", "public/examples/scut/etichete-display.webp"],
  ["public/examples/scut/ritual.png", "public/examples/scut/ritual-display.webp"],
  ...[1, 2, 3, 4, 5, 6].map((number) => [
    `public/examples/trusa-premium/page-${number}.png`,
    `public/examples/trusa-premium/page-${number}-display.webp`,
  ]),
];

await Promise.all(pageAssets.map(([source, destination]) => webpPage(source, destination)));

await Promise.all([
  socialCard({
    output: "public/social/og-scutul-de-noapte.webp",
    background: colors.navy,
    eyebrow: "RITUAL PERSONALIZAT DE SEARĂ",
    lines: ["Scutul", "de Noapte"],
    detail: "9 pagini personalizate + audio cu Lumi",
    price: "19 lei",
    pages: ["public/examples/scut/certificat-display.webp", "public/examples/scut/etichete-display.webp"],
    dark: true,
  }),
  socialCard({
    output: "public/social/og-trusa-de-rabdare.webp",
    background: colors.cream,
    eyebrow: "ACTIVITĂȚI FĂRĂ ECRANE",
    lines: ["Trusa", "de Răbdare"],
    detail: "10 pagini create pentru momentul vostru",
    price: "19 lei",
    pages: ["public/examples/trusa-premium/page-1-display.webp", "public/examples/trusa-premium/page-3-display.webp"],
    dark: false,
  }),
]);

await fs.rename(file("src/app/icon.optimized.png"), file("src/app/icon.png"));

console.log("Asset-urile de lansare au fost regenerate.");
