import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookHeart,
  Check,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { commerce, siteCopy } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Prețuri | Povestea Mea Magică",
  description:
    "Prețurile pentru poveștile și materialele digitale personalizate Povestea Mea Magică.",
  alternates: { canonical: "/preturi" },
};

const offers = [
  {
    title: "Povestea Magică",
    price: commerce.prices.illustratedAlbum,
    description:
      "Cartea ilustrată în care copilul devine personajul principal, creată în jurul lumii și aventurii alese de familie.",
    details: [
      "16 pagini A5 în format orizontal și 13 scene ilustrate",
      "Personaj consecvent din descriere sau fotografie",
      "Caiet separat cu colorat, labirint și găsește diferențele",
    ],
    href: "/povestea-magica",
    cta: "Creează Povestea Magică",
    icon: BookHeart,
  },
  {
    title: "Atelierul Scutului Magic",
    price: commerce.prices.nightShield,
    description:
      "Un joc magic și un ritual blând pentru serile în care întunericul sau o teamă au nevoie de cuvinte și repere familiare.",
    details: [
      "Certificat, rețetă imaginară și etichete",
      "Poveste, fișa «Camera mea», respirație și ghid pentru părinte",
      "Card de noptieră, calendar și audio Lumi",
    ],
    href: "/scutul-de-noapte",
    cta: "Creează Scutul",
    icon: ShieldCheck,
  },
  {
    title: "Dosarul Micului Explorator",
    price: commerce.prices.patienceKit,
    description:
      "Activități personalizate pentru restaurant, drum, medic sau orice moment în care timpul trece mai greu.",
    details: [
      "10 pagini A4 economice la imprimare",
      "8 activități, inclusiv labirint și diferențe validate",
      "Cartonașe detașabile și trei niveluri",
    ],
    href: "/trusa-de-rabdare",
    cta: "Pregătește Trusa",
    icon: TimerReset,
  },
];

export default function PricingPage() {
  const images = [
    "/examples/album/collection/coperta.webp",
    "/examples/kits-v2/atelier-preview.webp",
    "/examples/kits-v2/explorer-preview.webp",
  ];
  return (
    <CommercialPage
      eyebrow="Colecția digitală"
      title="Alege momentul vostru"
      description="Personalizare inclusă. O singură plată pentru materialul ales, fără abonament."
    >
      <section className="px-6 py-8">
        <div className="pricing-grid">
          {offers.map((offer, index) => (
            <article key={offer.href} className="pricing-offer">
              <div className="price-visual">
                <Image
                  src={images[index]}
                  alt={`Model pentru ${offer.title}`}
                  fill
                  sizes="(max-width:700px) 110px, 33vw"
                />
              </div>
              <h2>{offer.title}</h2>
              <strong className="price">{offer.price}</strong>
              <p>{offer.description}</p>
              <ul>
                {offer.details.map((detail) => (
                  <li key={detail}>
                    <Check size={15} />
                    {detail}
                  </li>
                ))}
              </ul>
              <Link href={offer.href} className="editorial-button">
                Descoperă <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-5xl bg-brand-navy px-6 py-8 text-brand-cream">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl">Întreaga colecție</h2>
              <p className="mt-3 text-sm text-brand-cream/80">
                Trei produse personalizate separat. Patru PDF-uri. Economisești
                18 lei.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <strong className="text-3xl">
                {commerce.prices.completeBundle}
              </strong>
              <Link
                href="/pachet-complet"
                className="inline-flex min-h-12 items-center gap-3 rounded bg-brand-cream px-5 text-sm font-bold text-brand-navy"
              >
                Alege pachetul <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-5xl text-sm leading-relaxed text-brand-navy/70">
          {siteCopy.paymentNotice}
        </p>
      </section>
    </CommercialPage>
  );
}
