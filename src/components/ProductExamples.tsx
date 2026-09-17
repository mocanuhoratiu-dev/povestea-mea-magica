import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Mail } from "lucide-react";
import { commerce } from "@/lib/siteMode";
import { productOffers, type OfferProduct } from "@/lib/productOffer";
import PremiumBookMockup from "./PremiumBookMockup";
const products = [
  {
    product: "album",
    title: "Povestea Magică",
    tag: "Pentru citit împreună",
    features: [
      "16 pagini ilustrate · A5 orizontal",
      "Audio cu Lumi + caiet de 5 pagini inclus",
    ],
    image: "/examples/album/collection/coperta.webp",
    href: "/povestea-magica",
    price: commerce.prices.illustratedAlbum,
  },
  {
    product: "monster",
    title: "Atelierul Scutului Magic",
    tag: "Pentru serile cu emoții",
    features: [
      "13 pagini · poveste, ritual și audio Lumi",
      "Diplomă, rețetă și etichete",
    ],
    image: "/examples/kits-v2/atelier-preview.webp",
    href: "/scutul-de-noapte",
    price: commerce.prices.nightShield,
  },
  {
    product: "emergency",
    title: "Dosarul Micului Explorator",
    tag: "Pentru timpul de așteptare",
    features: [
      "10 pagini A4 · jocuri, cartonașe și diplomă",
      "Aventură separată de caietul poveștii",
    ],
    image: "/examples/kits-v2/explorer-preview.webp",
    href: "/trusa-de-rabdare",
    price: commerce.prices.patienceKit,
  },
] satisfies { product: OfferProduct; title: string; tag: string; features: string[]; image: string; href: string; price: string }[];
export default function ProductExamples() {
  return (
    <section id="colectia" className="px-5 sm:px-6 bg-brand-cream">
      <div className="mx-auto max-w-7xl">
        <header className="collection-heading">
          <h2>
            Trei momente.
            <br />
            Aceeași grijă.
          </h2>
          <p>
            Povești pentru citit, ritualuri pentru seară și aventuri pentru
            timpul care trece greu. Toate, personalizate.
          </p>
        </header>
        <p className="collection-format"><Mail size={18} aria-hidden="true" /><span>PDF pe email · Personalizare din descriere sau fotografie · O singură plată. Tipărirea nu este inclusă.</span></p>
        <div className="collection-grid">
          {products.map((p, i) => (
            <article key={p.href} className="collection-item" data-offer-product={p.product} data-lumi-obstacle>
              <Link
                href={p.href}
                className="collection-image"
                aria-label={`Descoperă ${p.title}`}
              >
                {i === 0 ? (
                  <PremiumBookMockup
                    src={p.image}
                    alt="Cartea ilustrată a Evei"
                    sizes="(max-width:700px) 116px, 33vw"
                  />
                ) : (
                  <Image
                    src={p.image}
                    alt={`Coperta ${p.title}`}
                    fill
                    sizes="(max-width:700px) 116px, 33vw"
                  />
                )}
              </Link>
              <p className="collection-tag">{p.tag}</p>
              <h3>{p.title}</h3>
              <ul>{p.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
              <p className="collection-preview"><Eye size={17} aria-hidden="true" /><span><strong>Înainte de plată:</strong> {productOffers[p.product].preview}</span></p>
              <footer>
                <strong>{p.price}</strong>
                <Link href={p.href} aria-label={`Descoperă ${p.title}`}>
                  Descoperă <ArrowRight size={17} />
                </Link>
              </footer>
            </article>
          ))}
        </div>
        <div className="collection-bundle" data-offer-product="bundle" data-lumi-obstacle>
          <div>
            <h3>Întreaga colecție, {commerce.prices.completeBundle}</h3>
            <p>
              Patru PDF-uri + audio. Același copil sau copii diferiți. Economisești 18 lei.
            </p>
            <p className="collection-bundle-preview"><strong>Înainte de plată:</strong> {productOffers.bundle.preview}</p>
          </div>
          <Link className="editorial-button" href="/pachet-complet">
            Alege pachetul <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
