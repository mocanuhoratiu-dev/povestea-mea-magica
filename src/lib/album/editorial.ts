import type { AlbumSceneLayout } from './types.ts';

/** Content selects the composition; the story itself is never constrained to a fixed plot. */
export function chooseEditorialLayout(ratio: number, words: number, preferred: AlbumSceneLayout): AlbumSceneLayout {
  if (ratio >= 1.6 || words > 42) return 'cinematic';
  return preferred;
}
export const ALBUM_DIFFERENCE_ANSWERS = ['Steaua din vârf are un punct în plus.', 'Steagul are altă formă.', 'Turnul are o fereastră în plus.', 'Ușa are altă formă.', 'Norul din dreapta lipsește.'];
export function albumDifferenceSvg(changed = false) {
  const points = (n: number) => Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n-Math.PI/2,r=i%2?12:25;return `${225+Math.cos(a)*r},${55+Math.sin(a)*r}`;}).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="white"/><g stroke="#304d45" stroke-width="5" stroke-linejoin="round" fill="none"><path d="M35 350Q145 300 250 340T565 345M62 357v24m17-28v24m458-29v20"/><path d="M155 321V147h138v176M130 147l93-68 95 68Z" fill="#edf1eb"/><polygon points="${points(changed?6:5)}" fill="#f2df94"/><path d="M294 323V210h155v115M281 211l90-59 94 59Z" fill="#f6efdf"/><path d="M372 153V69"/>${changed?'<rect x="372" y="68" width="62" height="35" fill="#d8b7c5"/>':'<path d="M372 68l62 18-62 18Z" fill="#d8b7c5"/>'}<rect x="181" y="175" width="28" height="36" rx="14"/><rect x="238" y="175" width="28" height="36" rx="14"/>${changed?'<rect x="210" y="227" width="28" height="36" rx="14"/>':''}${changed?'<rect x="344" y="258" width="56" height="67"/>':'<path d="M344 325v-43a28 28 0 0 1 56 0v43Z"/>'}<circle cx="386" cy="293" r="3"/><path d="M65 94c-15-29 26-49 42-26 26-23 61 10 42 26Z"/>${changed?'':'<path d="M462 128c-15-29 26-49 42-26 26-23 61 10 42 26Z"/>'}<path d="M80 290v52m-16-37q-8-20 16-15 24-5 16 15m416-28v61m-18-40q-8-22 18-17 26-5 18 17"/></g></svg>`;
}
