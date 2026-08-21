import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandMarkPath = path.join(root, "public", "brand-mark.png");
const outputPath = path.join(root, "public", "smartbill-pmm-logo.png");

const width = 1400;
const height = 320;
const iconSize = 280;

const wordmark = Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="340" y="58" width="8" height="204" rx="4" fill="#E5B84F"/>
    <text x="392" y="148" fill="#24324F" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700">Povestea Mea Magică</text>
    <text x="394" y="218" fill="#8052A0" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">Momente mici. Magie pe bune.</text>
    <text x="394" y="264" fill="#5B6475" font-family="Arial, Helvetica, sans-serif" font-size="24">povestea-mea-magica.ro</text>
  </svg>
`);

const icon = await sharp(brandMarkPath)
  .resize(iconSize, iconSize, { fit: "contain" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  },
})
  .composite([
    { input: icon, left: 20, top: 20 },
    { input: wordmark, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(outputPath);
