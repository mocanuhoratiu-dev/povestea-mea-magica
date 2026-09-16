export type SampleShortcut = { label: string; index: number };

export function kitSampleShortcuts(pages: { title: string }[]): SampleShortcut[] {
  const definitions: [string, RegExp][] = [
    ["Coperta", /^(Atelierul|Dosarul)/],
    ["Scutul", /^Scutul de construit$/],
    ["Camera", /^Camera mea/],
    ["Labirintul", /^Traseul curierului$/],
    ["Diferențele", /^Ce s-a schimbat/],
    ["Cartonașele", /^Misiuni de buzunar$/],
    ["Diploma", /diplom|certificat/i],
    ["Rețeta", /rețet/i],
    ["Etichetele", /etichete/i],
  ];
  return definitions.flatMap(([label, match]) => {
    const index = pages.findIndex(page => match.test(page.title));
    return index < 0 ? [] : [{ label, index }];
  });
}

export const albumSampleShortcuts: SampleShortcut[] = [
  { label: "Coperta", index: 0 },
  { label: "Dedicația", index: 1 },
  { label: "Începutul", index: 2 },
  { label: "Aventura", index: 8 },
  { label: "Finalul", index: 14 },
];
