export type OfferProduct = "album" | "monster" | "emergency" | "bundle";

export const productOffers = {
  album: {
    content: "Carte A5 orizontală de 16 pagini, caiet de 5 pagini și audio cu Lumi.",
    personalization: "Personaj din descriere sau fotografie, lume și aventură alese de voi.",
    preview: "Coperta și două pagini create pentru copil, înainte de plată.",
  },
  monster: {
    content: "13 pagini: poveste, ritual, diplomă, rețetă, etichete și audio cu Lumi.",
    personalization: "Numele, reperele serii și două ilustrații din descriere sau fotografie.",
    preview: "Copertă orientativă cu numele. Ilustrațiile personalizate se creează după plată.",
  },
  emergency: {
    content: "10 pagini: mister, jocuri, cartonașe și diplomă. Trei niveluri de dificultate.",
    personalization: "Copilul, pasiunile, locul și durata așteptării; două ilustrații personalizate.",
    preview: "Copertă orientativă cu numele. Ilustrațiile personalizate se creează după plată.",
  },
  bundle: {
    content: "Toate cele trei produse, în patru PDF-uri, plus audio pentru poveste și Atelier.",
    personalization: "Același copil sau copii diferiți. Detalii proprii pentru fiecare produs.",
    preview: "Copertă și două pagini personalizate din poveste; modele publice pentru cele două kituri.",
  },
} as const;

export function offerFacts(product: OfferProduct) {
  const offer = productOffers[product];
  return [
    { label: "Format digital", text: "PDF pe email. Tipărirea nu este inclusă." },
    { label: "Ce primești", text: offer.content },
    { label: "Personalizare inclusă", text: offer.personalization },
    { label: "Înainte de plată", text: offer.preview },
  ];
}
