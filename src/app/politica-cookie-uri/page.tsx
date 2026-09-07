import type { Metadata } from "next";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Politica de Cookie-uri | Povestea Mea Magică",
  description: "Informații despre stocarea locală și cookie-uri în Povestea Mea Magică.",
  alternates: { canonical: "/politica-cookie-uri" },
};

export default function CookiesPage() {
  return <CommercialPage eyebrow="Cookie-uri și stocare locală" title="Tu alegi ce rămâne în browser." description="Folosim implicit doar datele necesare funcționării. Măsurarea publicitară opțională pornește numai după acordul tău.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15 text-base font-medium leading-relaxed text-brand-navy/70"><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Strict necesare</h2><p>Site-ul poate păstra în sesiunea curentă alegerile pentru material, progresul configurării și sursa agregată a campaniei prin care ai ajuns aici. Aceste informații mențin fluxul între pagini și ne arată, fără datele copilului, ce tip de conținut este util.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Măsurare opțională</h2><p>Doar dacă alegi „Accept opționale”, putem încărca instrumente de măsurare publicitară pentru vizite, interes față de produs, începutul checkout-ului și cumpărare. Acestea pot folosi identificatori de browser. Nu trimitem numele copilului, fotografia, povestea, dedicația sau conversațiile cu Lumi.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Alegerea ta</h2><p>Poți continua cu „Doar necesare” fără nicio limitare a produsului sau plății. Îți poți schimba oricând alegerea din legătura „Preferințe cookie” aflată în subsolul site-ului.</p></section></div><p className="mx-auto mt-10 max-w-5xl text-sm font-semibold text-brand-navy/50">Ultima actualizare: 7 septembrie 2026</p></section>
  </CommercialPage>;
}
