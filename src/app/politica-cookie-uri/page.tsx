import type { Metadata } from "next";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Politica de Cookie-uri | Povestea Mea Magică",
  description: "Informații despre stocarea locală și cookie-uri în Povestea Mea Magică.",
  alternates: { canonical: "/politica-cookie-uri" },
};

export default function CookiesPage() {
  return <CommercialPage eyebrow="Cookie-uri și stocare locală" title="Păstrăm browserul cât mai liniștit." description="Nu folosim cookie-uri de marketing și nu construim profiluri publicitare despre familie sau copil.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15 text-base font-medium leading-relaxed text-brand-navy/70"><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Ce folosim acum</h2><p>Site-ul poate păstra temporar în browser preferințe necesare pentru experiență, cum ar fi marcajul unei vizite în sesiunea curentă sau un răspuns local pentru următoarea recomandare a lui Lumi. Acestea nu sunt un cont și nu conțin un identificator persistent de client.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Ce nu folosim</h2><p>Nu instalăm cookie-uri de publicitate, nu urmărim comportamentul între site-uri și nu trimitem în telemetria operațională numele copilului, textul poveștii, dedicația sau conversațiile cu Lumi.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Când vom cere acordul</h2><p>Dacă vom introduce cookie-uri opționale, analiză identificabilă, publicitate sau o integrare care nu este strict necesară funcționării, actualizăm această pagină și cerem consimțământul înainte de a le activa, conform regulilor aplicabile.</p></section></div><p className="mx-auto mt-10 max-w-5xl text-sm font-semibold text-brand-navy/50">Ultima actualizare: 12 august 2026</p></section>
  </CommercialPage>;
}
