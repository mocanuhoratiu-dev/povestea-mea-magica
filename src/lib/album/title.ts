export const ALBUM_TITLE_INSTRUCTIONS = `Alege titlul DUPĂ ce ai construit aventura: 4-10 cuvinte firești, memorabile, care trezesc curiozitatea și trimit la o întâmplare, o dorință sau o descoperire concretă din această poveste. Numele copilului poate apărea, dar nu este obligatoriu. Nu folosi simpla formulă nume + numele lumii, nici "aventura magică", "poveste personalizată", "Mostra 2" sau alte numere de variantă. Nu copia exemple și nu inventa în titlu obiecte absente din poveste. Fiecare scenă primește și ea un titlu scurt, expresiv, nu "Scena 1", "Capitolul 2" sau numele lumii urmat de un număr. Numerotarea paginilor este adăugată separat de aplicație.`;

/** Strip model formatting, never add sample numbers or replace an author's title with the world. */
export function readEditorialTitle(value: unknown, maxLength = 100): string {
  if (typeof value !== "string") throw new Error("Titlul editorial lipsește.");
  const title = value.trim().replace(/^#+\s*/, "").replace(/\*\*/g, "")
    .replace(/^(?:(?:titlu(?:l)?|scena|capitolul|mostr[ăa]|varianta)\s*(?:\d+|[IVXLCDM]+)?\s*[:.)\-–—]\s*|\d+[.)]\s+)/iu, "")
    .replace(/\s*[\-–—|]\s*(?:mostr[ăa]|varianta)\s*\d+\s*$/iu, "")
    .replace(/^[„“"«]|[”"»]$/gu, "").replace(/\s+/g, " ").trim();
  if (!/\p{L}/u.test(title) || title.length > maxLength || /^(?:(?:scena|capitolul|mostr[ăa]|varianta)\s*)?(?:\d+|[IVXLCDM]+)$/iu.test(title)) {
    throw new Error("Titlul trebuie să descrie povestea, nu să fie un număr de variantă.");
  }
  return title;
}
