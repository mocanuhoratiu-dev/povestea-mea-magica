import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { commerce } from "@/lib/siteMode";
import PremiumBookMockup from "./PremiumBookMockup";
const products = [
  {
    title: "Povestea Magică",
    tag: "Pentru citit împreună",
    description:
      "Copilul devine eroul unei aventuri ilustrate, din lumea și micile lui bucurii.",
    features: [
      "16 pagini ilustrate · A5 orizontal",
      "Audio și caiet de activități",
    ],
    image: "/examples/album/collection/coperta.webp",
    href: "/povestea-magica",
    price: commerce.prices.illustratedAlbum,
  },
  {
    title: "Atelierul Scutului Magic",
    tag: "Pentru serile cu emoții",
    description:
      "Un ritual de apropiere, construit din reperele familiare ale copilului.",
    features: [
      "13 pagini · certificat și ritual",
      "Scut de construit și audio Lumi",
    ],
    image: "/examples/kits-v2/atelier-preview.webp",
    href: "/scutul-de-noapte",
    price: commerce.prices.nightShield,
  },
  {
    title: "Dosarul Micului Explorator",
    tag: "Pentru timpul de așteptare",
    description:
      "Un mister de descoperit prin joacă, potrivit locului și vârstei copilului.",
    features: [
      "10 pagini · misiuni și jocuri",
      "Labirint, diferențe și cartonașe",
    ],
    image: "/examples/kits-v2/explorer-preview.webp",
    href: "/trusa-de-rabdare",
    price: commerce.prices.patienceKit,
  },
];
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
        <div className="collection-grid">
          {products.map((p, i) => (
            <article key={p.href} className="collection-item">
              <Link
                href={p.href}
                className="collection-image"
                aria-label={`Descoperă ${p.title}`}
              >
                {i === 0 ? (
                  <PremiumBookMockup
                    src={p.image}
                    alt="Cartea ilustrată a Evei"
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
              <p>{p.description}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>
                    <Check size={14} />
                    {f}
                  </li>
                ))}
              </ul>
              <footer>
                <strong>{p.price}</strong>
                <Link href={p.href}>
                  Descoperă <ArrowRight size={17} />
                </Link>
              </footer>
            </article>
          ))}
        </div>
        <div className="collection-bundle">
          <div>
            <h3>Întreaga colecție, {commerce.prices.completeBundle}</h3>
            <p>
              Trei produse, personalizate separat. Patru PDF-uri. Economisești
              18 lei.
            </p>
          </div>
          <Link className="editorial-button" href="/pachet-complet">
            Alege pachetul <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
