import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookHeart, PackageCheck, ShieldCheck, TimerReset } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { commerce, siteCopy } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Prețuri | Povestea Mea Magică",
  description: "Prețurile pentru poveștile și materialele digitale personalizate Povestea Mea Magică.",
  alternates: { canonical: "/preturi" },
};

const offers = [
  { title: "Povestea Magică", price: commerce.prices.illustratedAlbum, description: "Cartea ilustrată în care copilul devine personajul principal, creată în jurul lumii și aventurii alese de familie.", details: ["16 pagini A5 în format orizontal și 13 scene ilustrate", "Personaj consecvent din descriere sau fotografie", "Caiet separat cu colorat, labirint și găsește diferențele"], href: "/povestea-magica", cta: "Creează Povestea Magică", icon: BookHeart },
  { title: "Scutul de Noapte", price: commerce.prices.nightShield, description: "Un joc magic și un ritual blând pentru serile în care întunericul sau o teamă au nevoie de cuvinte și repere familiare.", details: ["Certificat, rețetă imaginară și etichete", "Poveste, fișa «Camera mea», respirație și ghid pentru părinte", "Card de noptieră, calendar și audio Lumi"], href: "/scutul-de-noapte", cta: "Creează Scutul", icon: ShieldCheck },
  { title: "Trusa de Răbdare", price: commerce.prices.patienceKit, description: "Activități personalizate pentru restaurant, drum, medic sau orice moment în care timpul trece mai greu.", details: ["10 pagini A4 economice la imprimare", "8 activități, inclusiv labirint și diferențe validate", "Cartonașe detașabile și trei niveluri"], href: "/trusa-de-rabdare", cta: "Pregătește Trusa", icon: TimerReset },
];

export default function PricingPage() {
  return (
    <CommercialPage eyebrow="Prețuri transparente" title="Trei produse. Fiecare creat pentru un moment real." description="Prețurile sunt finale și apar înainte de plata securizată. Personalizarea și previzualizarea Poveștii Magice încep fără plată.">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl border-y border-brand-gold/45 bg-brand-gold/10 px-6 py-6 text-center">
          <p className="text-sm font-black text-brand-navy">{siteCopy.paymentNotice}</p>
        </div>
        <div className="mx-auto mt-14 max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">
          {offers.map((offer) => {
            const Icon = offer.icon;
            return <article key={offer.title} className="grid gap-8 py-10 md:grid-cols-[.78fr_1.22fr] md:gap-14">
              <div><Icon className="text-brand-purple" size={29} /><h2 className="mt-5 font-serif text-3xl text-brand-navy">{offer.title}</h2><p className="mt-4 font-nunito text-2xl font-black text-brand-navy">{offer.price}</p></div>
              <div><p className="text-base font-medium leading-relaxed text-brand-navy/70">{offer.description}</p><ul className="mt-6 space-y-3 border-t border-brand-navy/12 pt-5 text-sm font-bold leading-relaxed text-brand-navy/75">{offer.details.map((detail) => <li key={detail} className="flex gap-3"><span className="text-brand-purple">✦</span>{detail}</li>)}</ul><Link href={offer.href} className="mt-7 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">{offer.cta}<ArrowRight size={16} /></Link></div>
            </article>;
          })}
        </div>
        <article className="mx-auto mt-12 grid max-w-5xl gap-7 bg-brand-navy px-7 py-9 text-brand-cream md:grid-cols-[auto_1fr_auto] md:items-center md:px-10">
          <PackageCheck className="text-brand-gold" size={36} />
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-gold">Pachetul Complet · economisești 18 lei</p><h2 className="mt-2 font-serif text-3xl">Toate cele trei produse, într-o singură comandă</h2><p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-brand-cream/70">Primești cartea ilustrată, caietul de activități, Scutul de Noapte și Trusa de Răbdare. Fiecare poate fi personalizat separat.</p></div>
          <div className="md:text-right"><p className="font-nunito text-4xl font-black text-brand-gold">{commerce.prices.completeBundle}</p><Link href="/pachet-complet" className="mt-4 inline-flex min-h-11 items-center gap-2 bg-brand-gold px-5 text-sm font-black text-brand-navy">Alege pachetul<ArrowRight size={16} /></Link></div>
        </article>
      </section>
    </CommercialPage>
  );
}
