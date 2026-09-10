import { createPatienceMaze } from "../patienceActivities.ts";
import type { PatienceDifficulty } from "../patienceKit.ts";

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
export function shieldSVG(initial: string, color: string, blank = false) {
  return `<svg class="${blank ? 'cut-shield' : 'shield-design'}" viewBox="0 0 300 350" aria-label="Scutul de construit"><path d="M238 26C146 1 25 66 25 179S146 341 248 295C128 270 103 104 238 26Z" fill="${blank ? '#fff' : color}" stroke="#b29260" stroke-width="3" ${blank ? 'stroke-dasharray="6 5"' : ''}/><path d="M196 31C113 28 41 90 41 179S120 319 203 300" fill="none" stroke="#d5c396" stroke-width="1.5"/><text x="84" y="205" text-anchor="middle" font-family="Georgia" font-size="71" fill="${blank ? '#fff' : '#f3e3b3'}" stroke="${blank ? '#899780' : 'none'}" stroke-width="1">${escapeHtml(initial)}</text><g fill="${blank ? 'none' : '#efd99c'}" stroke="#c8b688"><path d="m93 83 4 10 11 2-9 7 2 11-8-6-9 6 2-11-9-7 11-2Z"/><path d="m89 235 4 10 11 2-9 7 2 11-8-6-9 6 2-11-9-7 11-2Z"/><path d="m143 273 4 10 11 2-9 7 2 11-8-6-9 6 2-11-9-7 11-2Z"/></g></svg>`;
}
export function mazeSVG(difficulty: PatienceDifficulty, solution = false) {
  const { size, cells, solution: path } = createPatienceMaze(difficulty);
  const cell = 32, margin = 18, total = size * cell + 36;
  let lines = '';
  cells.forEach((open, i) => { const x=margin+i%size*cell,y=margin+Math.floor(i/size)*cell;
    if(!(open&1)&&i!==0)lines+=`M${x},${y}h${cell}`;
    if(!(open&8))lines+=`M${x},${y}v${cell}`;
    if(i%size===size-1&&!(open&2))lines+=`M${x+cell},${y}v${cell}`;
    if(Math.floor(i/size)===size-1&&!(open&4)&&i!==size*size-1)lines+=`M${x},${y+cell}h${cell}`;
  });
  const points = path.map(i=>`${margin+(i%size+.5)*cell},${margin+(Math.floor(i/size)+.5)*cell}`).join(' ');
  return `<svg viewBox="0 0 ${total} ${total}" aria-label="Labirint cu traseu verificat"><rect width="${total}" height="${total}" fill="#fffdf6"/><path d="${lines}" stroke="#356e62" stroke-width="2.5" fill="none"/><polyline class="${solution?'':'solution'}" points="${points}" fill="none" stroke="#c56a50" stroke-width="3.5"/><circle cx="${margin+cell/2}" cy="${margin+cell/2}" r="8" fill="#c56a50"/><rect x="${margin+(size-.5)*cell-9}" y="${margin+(size-.5)*cell-7}" width="18" height="14" fill="#367867"/></svg>`;
}
export const DIFFERENCE_ANSWERS = ['Steagul nu mai are vârful decupat.', 'Pe farfurie rămân două cercuri în loc de trei.', 'Ceașca nu mai are toartă.'];
export function differencesSVG(altered: boolean) {
  return `<div class="difference-scene"><span>${altered?'B':'A'}</span><svg viewBox="0 0 500 172" aria-label="Scenă cu trei diferențe"><path d="M15 130h470M50 131v25m401-25v25" stroke="#507e68" stroke-width="3" fill="none"/><path d="m83 128 55-66 55 66Z" fill="#e2dbc3" stroke="#51786c" stroke-width="2"/><path d="m115 91 22-29 23 29" fill="#fffefa"/><path d="${altered?'M138 62V27m0 0h35v18h-35Z':'M138 62V27m0 0h35l-10 9 10 9h-35Z'}" fill="#6b9780" stroke="#477467" stroke-width="2"/><ellipse cx="269" cy="128" rx="53" ry="9" fill="#f5e4c1" stroke="#b58f60" stroke-width="2"/><g fill="#e9bc58" stroke="#c0923d"><circle cx="252" cy="126" r="9"/><circle cx="272" cy="126" r="9"/>${altered?'':'<circle cx="291" cy="125" r="9"/>'}</g><path d="M335 71h59v43q-29 28-59 0Z" fill="#f2e6cd" stroke="#497969" stroke-width="3"/>${altered?'':'<path d="M394 81c32-6 32 39 0 26" fill="none" stroke="#497969" stroke-width="4"/>'}<g class="diff-ring" fill="none" stroke="#d2654d" stroke-width="2" stroke-dasharray="4 3"><circle cx="156" cy="37" r="25"/><ellipse cx="273" cy="126" rx="45" ry="18"/><ellipse cx="411" cy="95" rx="21" ry="29"/></g></svg></div>`;
}
export function envelopeSVG(name: string) {
  return `<div class="envelope-net"><svg viewBox="0 0 500 205" aria-label="Plic de decupat"><path d="M160 62 250 8 340 62 405 108 340 154 250 199 160 154 95 108Z" fill="#e5eee3" stroke="#598373" stroke-width="1.5"/><path d="M160 62h180v92H160Z" fill="#faf9ec" stroke="#739480" stroke-dasharray="5 4"/><text x="250" y="108" text-anchor="middle" fill="#276e60" font-family="Georgia" font-size="${name.length>16?14:23}">${escapeHtml(name)}</text></svg><p>Un adult decupează pe contur. Pliați pe liniile punctate și lipiți clapeta de jos peste cele laterale.</p></div>`;
}
