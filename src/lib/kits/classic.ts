type ClassicShieldKit = {
  target: string;
  order: string;
  ingredients: { name: string; detail: string }[];
  spell: string;
};

export const classicShieldKits: Record<string, ClassicShieldKit> = {
  "frica de intuneric": {
    target: "întunericului",
    order: "Ordinul Felinarelor de Veghe",
    ingredients: [
      { name: "Apă de Stea Liniștită", detail: "o măsură imaginară" },
      { name: "Miere de Gând Bun", detail: "o picătură imaginară" },
      { name: "Cristale de Lumină Mică", detail: "trei sclipiri imaginare" },
    ],
    spell: "Noapte bună, noapte lină, camera mea păstrează lumină. Privesc, respir și cer ajutor, iar seara vine mai ușor.",
  },
  "umbrele noptii": {
    target: "umbrelor nopții",
    order: "Ordinul Umbrelor Cuminți",
    ingredients: [
      { name: "Apă de Lună Plină", detail: "o măsură imaginară" },
      { name: "Esență de Lămâie-Soare", detail: "o rază imaginară" },
      { name: "Cristale de Curaj", detail: "trei sclipiri imaginare" },
    ],
    spell: "Umbre mici și umbre mari, vă privesc așa cum sunteți. Camera mea îmi este cunoscută, iar eu nu sunt singur.",
  },
  "monstrul de sub pat": {
    target: "grijilor de sub pat",
    order: "Ordinul Dragonilor Somnoroși",
    ingredients: [
      { name: "Râu de Somn Liniștit", detail: "o măsură imaginară" },
      { name: "Firimituri de Curaj", detail: "două zâmbete imaginare" },
      { name: "Pulbere de Dragon Somnoros", detail: "trei sclipiri imaginare" },
    ],
    spell: "Sub pat este loc cunoscut, privit o dată și apoi lăsat. Adultul meu rămâne aproape, iar somnul poate să înceapă.",
  },
  "zgomotele ciudate": {
    target: "zgomotelor de noapte",
    order: "Ordinul Ecourilor Liniștite",
    ingredients: [
      { name: "Lac de Liniște", detail: "o măsură imaginară" },
      { name: "Miere de Șoaptă", detail: "o picătură imaginară" },
      { name: "Praf de Ecou Adormit", detail: "trei sclipiri imaginare" },
    ],
    spell: "Aud un sunet, îl numesc, lângă adult îl deslușesc. Casa respiră uneori, iar eu respir încet de trei ori.",
  },
  "dulapul scartaitor": {
    target: "ușilor și umbrelor din dulap",
    order: "Ordinul Hainelor Adormite",
    ingredients: [
      { name: "Picături de Pace", detail: "o măsură imaginară" },
      { name: "Lumină Galbenă de Curaj", detail: "o rază imaginară" },
      { name: "Cristale pentru Uși Cuminți", detail: "trei sclipiri imaginare" },
    ],
    spell: "Uși de dulap, haine moi, vă privesc și știu ce sunteți voi. Camera mea e loc știut, iar eu mă simt văzut.",
  },
  "vise urate": {
    target: "viselor încurcate",
    order: "Ordinul Norilor de Vis Bun",
    ingredients: [
      { name: "Rouă de Vis Bun", detail: "o măsură imaginară" },
      { name: "Rază de Dimineață", detail: "o lumină imaginară" },
      { name: "Pulbere de Nor Pufos", detail: "trei sclipiri imaginare" },
    ],
    spell: "Visul vine, visul trece, eu pot spune ce mă sperie. Cer ajutor, respir ușor și aleg un gând ocrotitor.",
  },
};


