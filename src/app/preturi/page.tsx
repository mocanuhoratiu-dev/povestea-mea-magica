import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookHeart, BookOpen, Gift, ShieldCheck, TimerReset } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { commerce, siteCopy } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Prețuri | Povestea Mea Magică",
  description: "Prețurile pentru poveștile și materialele digitale personalizate Povestea Mea Magică.",
  alternates: { canonical: "/preturi" },
};

const offers = [
  { title: "Povestea de Seară", price: `Scurtă ${commerce.prices.storyShort} · Lungă ${commerce.prices.storyLong}`, description: "O aventură ilustrată, cu dedicație de la familie și text adaptat alegerilor voastre.", details: ["Scurtă: copertă, dedicație și 2 pagini de poveste", "Lungă: copertă, dedicație și 4 pagini de poveste", "Verificare, editare și PDF pentru descărcare"], href: "/#creator", cta: "Personalizează povestea", icon: BookOpen },
  { title: "Albumul Meu Magic", price: commerce.prices.illustratedAlbum, description: "O aventură vizuală premium, construită în 13 scene ilustrate și însoțită de un caiet separat pentru joacă.", details: ["Carte ilustrată de 16 pagini A5 landscape", "13 ilustrații unice, create pentru aceeași poveste", "Caiet separat de 8 pagini, cu 6 activități printabile"], href: "/album-ilustrat", cta: "Personalizează albumul", icon: BookHeart },
  { title: "Scutul de Noapte", price: commerce.prices.nightShield, description: "Un ritual simbolic pentru seară, construit în jurul unei frici și a lucrurilor care liniștesc copilul.", details: ["Certificat personalizat", "Ritual simplu, de repetat împreună", "Etichete pentru flacon"], href: "/#monster-away", cta: "Personalizează Scutul", icon: ShieldCheck },
  { title: "Trusa de Răbdare", price: commerce.prices.patienceKit, description: "Activități printabile pentru momentele de așteptare: drum, restaurant, doctor, aeroport sau acasă.", details: ["7 pagini A4 de activități", "Misiuni adaptate contextului", "Diplomă de final"], href: "/#emergency-kit", cta: "Personalizează Trusa", icon: TimerReset },
  { title: "Pachetul Familiei Magice", price: commerce.prices.familyBundle, description: "Toate cele trei materiale într-o singură comandă, cu personalizare independentă pentru fiecare copil și fiecare moment.", details: ["Poveste lungă, Scut de Noapte și Trusă de Răbdare", "Poți folosi aceleași date sau copii diferiți", "O singură plată și trei materiale de descărcat"], href: "/pachet", cta: "Personalizează pachetul", icon: Gift },
  { title: "Pachetul Complet", price: commerce.prices.completeBundle, description: "Întreaga colecție digitală: cele trei materiale ale familiei și experiența vizuală premium a albumului.", details: ["Poveste lungă, Scut de Noapte și Trusă de Răbdare", "Carte ilustrată de 16 pagini și caiet de activități de 8 pagini", "Cinci PDF-uri, personalizate separat, într-o singură comandă"], href: "/pachet-complet", cta: "Alege pachetul complet", icon: BookHeart },
];

export default function PricingPage() {
  return (
    <CommercialPage eyebrow="Prețuri transparente" title="Alegi materialul, vezi prețul, apoi începi." description="Prețurile sunt finale și sunt afișate înainte de plata securizată. Poți alege un singur produs, pachetul familiei sau întreaga colecție digitală.">
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
      </section>
    </CommercialPage>
  );
}
