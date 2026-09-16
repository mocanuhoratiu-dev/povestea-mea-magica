export type OfferProduct = "album" | "monster" | "emergency" | "bundle";

export const productOffers = {
  album: {
    content: "Carte A5 orizontală de 16 pagini, audio cu Lumi și caiet de 5 pagini pentru joaca din poveste, inclus în preț.",
    personalization: "Personaj din descriere sau fotografie, lume și aventură alese de voi.",
    preview: "Coperta și două pagini create pentru copil, înainte de plată.",
  },
  monster: {
    content: "13 pagini: poveste, ritual, diplomă, rețetă, etichete și audio cu Lumi.",
    personalization: "Numele, reperele serii și două ilustrații din descriere sau fotografie.",
    preview: "Copertă orientativă cu numele. Ilustrațiile personalizate se creează după plată.",
  },
  emergency: {
    content: "O aventură separată pentru așteptare: 10 pagini cu mister, jocuri, cartonașe și diplomă. Nu este caietul inclus în poveste.",
    personalization: "Copilul, pasiunile, locul și durata așteptării; două ilustrații personalizate.",
    preview: "Copertă orientativă cu numele. Ilustrațiile personalizate se creează după plată.",
  },
  bundle: {
    content: "Cartea, caietul ei de 5 pagini, Atelierul și Dosarul de 10 pagini: patru PDF-uri, plus audio pentru poveste și Atelier.",
    personalization: "Același copil sau copii diferiți. Detalii proprii pentru fiecare produs.",
    preview: "Copertă și două pagini personalizate din poveste; modele publice pentru cele două kituri.",
  },
} as const;

export const activityComparison = [
  {
    title: "Caietul poveștii",
    purpose: "Continuă joaca după lectură.",
    detail: "5 pagini A5 orizontale, inspirate de aventura copilului: colorat, labirint cu soluție și găsește diferențele.",
    inclusion: "Inclus în prețul Poveștii Magice. Nu se cumpără separat.",
    image: "/examples/album/collection/colorat.webp",
    imageAlt: "Pagină de colorat din caietul demonstrativ al poveștii",
  },
  {
    title: "Dosarul Micului Explorator",
    purpose: "O aventură nouă pentru timpul de așteptare.",
    detail: "10 pagini A4, cu un mister propriu, radar, jocuri, cartonașe și diplomă. Alegi locul, durata, pasiunile și dificultatea.",
    inclusion: "Produs de sine stătător. Nu ai nevoie de Povestea Magică pentru a-l folosi.",
    image: "/examples/kits-v2/explorer-preview.webp",
    imageAlt: "Coperta demonstrativă a Dosarului Micului Explorator",
  },
] as const;

export function offerFacts(product: OfferProduct) {
  const offer = productOffers[product];
  return [
    { label: "Format digital", text: "PDF pe email. Tipărirea nu este inclusă." },
    { label: "Ce primești", text: offer.content },
    { label: "Personalizare inclusă", text: offer.personalization },
    { label: "Înainte de plată", text: offer.preview },
  ];
}
