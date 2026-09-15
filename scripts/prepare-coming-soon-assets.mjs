import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDays, ArrowDown } from "lucide-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/launch");
const references = process.argv[2];
if (!references) throw new Error("Supply the directory of the approved Friday launch stills.");
await mkdir(output, { recursive: true });
for (const [source, target] of [["01-povestea-magica.png", "story"], ["02-atelier.png", "atelier"], ["03-explorator.png", "explorer"]]) {
  await sharp(path.join(references, source)).resize({ width: 760, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(output, `${target}.webp`));
}
for (const [name, Icon] of [["calendar", CalendarDays], ["arrow-down", ArrowDown]]) {
  await writeFile(path.join(output, `${name}.svg`), renderToStaticMarkup(createElement(Icon, { xmlns: "http://www.w3.org/2000/svg", color: "#173d3d", width: 24, height: 24, strokeWidth: 1.7 })));
}
// Reuse the existing brand-network icons verbatim from the site's footer.
const footer = await readFile(path.join(root, "src/components/Footer.tsx"), "utf8");
for (const name of ["Instagram", "Facebook", "TikTok"]) {
  const segment = footer.slice(footer.indexOf(`function ${name}Icon`));
  const svg = segment.match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw new Error(`Missing existing ${name} icon`);
  await writeFile(path.join(output, `${name.toLowerCase()}.svg`), svg.replace('className={className}', 'xmlns="http://www.w3.org/2000/svg" color="#173d3d"').replaceAll('strokeWidth=', 'stroke-width='));
}
// Self-host the two existing brand fonts, including Romanian diacritics.
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĂÂÎȘȚăâîșț0123456789 .,:;!?-/©·";
for (const [family, file, weights] of [["Fraunces", "fraunces", "100..900"], ["Nunito", "nunito", "200..1000"]]) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap&text=${encodeURIComponent(charset)}`;
  const cssResponse = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36" } });
  if (!cssResponse.ok) throw new Error(`Font stylesheet: ${cssResponse.status}`);
  const css = await cssResponse.text();
  const source = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!source) throw new Error(`No font file for ${family}`);
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Font download: ${response.status}`);
  await writeFile(path.join(output, `${file}.woff2`), Buffer.from(await response.arrayBuffer()));
}
console.log("Launch assets prepared. No new AI generation calls.");
