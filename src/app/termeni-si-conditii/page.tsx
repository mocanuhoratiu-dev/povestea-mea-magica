import type { Metadata } from "next";
import Link from "next/link";
import CommercialPage from "@/components/CommercialPage";
import { supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Termeni și Condiții | Povestea Mea Magică",
  description: "Regulile de folosire pentru materialele digitale personalizate Povestea Mea Magică.",
  alternates: { canonical: "/termeni-si-conditii" },
};

export default function TermsPage() {
  return <CommercialPage eyebrow="Termeni și condiții" title="Reguli simple pentru un spațiu de familie folosit cu grijă." description="Acești termeni explică ce oferim în beta, ce poți face cu materialele și cum pregătim activarea comercială.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15 text-base font-medium leading-relaxed text-brand-navy/70">
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Accesul beta</h2><div><p>În prezent, platforma oferă acces beta gratuit: poți crea, previzualiza și descărca materialele fără plată. Nu există cont de client și nu se încheie prin site un contract de vânzare cu plată.</p><p className="mt-4">Prețurile afișate sunt prețuri planificate pentru lansarea comercială. Înainte de activarea plăților vom publica identitatea completă a comerciantului, datele fiscale, facturarea, pașii checkout-ului și condițiile aplicabile comenzilor cu plată.</p></div></section>
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Ce oferim</h2><p>Povestea Mea Magică oferă povești, ritualuri simbolice și activități digitale personalizate, construite din alegerile introduse de adult. Rezultatul este creativ și poate varia. Te rugăm să verifici materialul înainte de a-l citi sau folosi împreună cu un copil.</p></section>
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Rolul adultului</h2><p>Folosește serviciul numai ca adult sau cu acordul și supravegherea unui adult. Nu introduce date sensibile, informații medicale, adrese sau alte date care nu sunt necesare personalizării. Materialele nu înlocuiesc sfatul medical, psihologic, educațional sau terapeutic.</p></section>
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Folosirea PDF-urilor</h2><p>Materialele generate sunt pentru uz personal și familial. Le poți salva, printa și folosi în familie. Nu le poți revinde, redistribui ca produs comercial, încărca într-o bibliotecă publică sau prezenta ca fiind create de tine.</p></section>
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Disponibilitate</h2><p>Facem eforturi ca generarea și livrarea să funcționeze bine, însă un serviciu digital poate avea perioade de mentenanță sau răspunsuri mai lente. Dacă materialul nu se generează, nu se descarcă sau nu corespunde alegerilor, scrie-ne și analizăm situația.</p></section>
      <section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Date și actualizări</h2><p>Prelucrarea datelor este explicată în <Link href="/politica-de-confidentialitate" className="font-black text-brand-purple underline underline-offset-4">Politica de Confidențialitate</Link>. Putem actualiza acești termeni atunci când schimbăm funcționalități relevante; data actualizării va fi afișată pe această pagină.</p></section>
    </div><a href={supportMailto("Termeni și acces beta - Povestea Mea Magică")} className="mx-auto mt-10 inline-flex max-w-5xl border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Întreabă-ne despre termeni</a><p className="mx-auto mt-10 max-w-5xl text-sm font-semibold text-brand-navy/50">Ultima actualizare: 12 august 2026</p></section>
  </CommercialPage>;
}
