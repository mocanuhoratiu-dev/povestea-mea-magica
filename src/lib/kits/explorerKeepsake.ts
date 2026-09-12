import type { KitInput } from "./content.ts";
import type { KitPageOrientation } from "./pageGeometry.ts";
import { escapeHtml as e } from "./graphics.ts";

export function explorerDiplomaName(name: string) {
  const characters = Array.from(name.trim().toLocaleUpperCase("ro-RO"));
  let lines = [characters.join("")];
  if (characters.length > 20) {
    const middle = characters.length / 2;
    const spaces = characters.map((c, i) => c === " " ? i : -1).filter(i => i > 0);
    const split = spaces.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0] ?? Math.ceil(middle);
    lines = [characters.slice(0, split).join("").trim(), characters.slice(split).join("").trim()];
  }
  // Conservative glyph widths keep the fixed name slot safe before browser fonts load.
  const units = (text: string) => Array.from(text).reduce((sum, c) => sum + (/[MW]/.test(c) ? 1.15 : /[IÎJLȚT '’\-]/.test(c) ? .6 : .88), 0);
  const fontSize = Math.floor(Math.min(lines.length > 1 ? 35 : 76, 418 / Math.max(1, ...lines.map(units))));
  return { lines, fontSize };
}

export function explorerKeepsakePage(input: KitInput): {
  title: string; html: string; extra: string; orientation: KitPageOrientation;
} {
  const name = explorerDiplomaName(input.name);
  return {
    title: "Diploma Micilor Descoperiri",
    extra: "explorer-diploma",
    orientation: "landscape",
    html: `<img class="explorer-diploma-art" src="/examples/kits-v2/explorer-diploma-map.webp" alt="Diploma Micilor Descoperiri. O aventură întreagă începe cu o întrebare. Ai observat, ai imaginat și ai transformat așteptarea într-o aventură. Lumi, prietena aventurilor tale."><h3 class="explorer-diploma-name" aria-label="${e(input.name)}" style="font-size:${name.fontSize}px">${name.lines.map(line => `<span>${e(line)}</span>`).join("")}</h3>`,
  };
}
