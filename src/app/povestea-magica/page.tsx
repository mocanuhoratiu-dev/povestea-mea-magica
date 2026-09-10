import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BookOpen, Headphones, Mail, Palette, ShieldCheck } from "lucide-react";
import AlbumCreator, { AlbumPrintTeaser } from "@/components/AlbumCreator";
import AlbumFlipbook from "@/components/AlbumFlipbook";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import LumiOpenButton from "@/components/LumiOpenButton";
import MobileAlbumCTA from "@/components/MobileAlbumCTA";
import Reviews from "@/components/Reviews";
import { commerce, siteUrl } from "@/lib/siteMode";
import "@/components/album-editorial.css";

export const metadata: Metadata = {
  title: "Povestea Magică | Cartea ilustrată a copilului tău",
  description: "16 pagini A5 orizontale, 13 scene ilustrate plus copertă, audio în română și un caiet de activități. Vezi o mostră personalizată înainte de plată.",
  alternates: { canonical: "/povestea-magica" },
  openGraph: { url: "/povestea-magica", title: "Povestea Magică", description: "Copilul tău, într-o aventură numai a lui. Carte digitală, audio și activități.", images: [{ url: "/social/og-povestea-magica.webp", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/social/og-povestea-magica.webp"] },
};
const productSchema = {
  "@context": "https://schema.org", "@type": "Product", name: "Povestea Magică - Digital",
  image: [`${siteUrl}/examples/album/collection/coperta.webp`], description: "16 pagini, 13 scene ilustrate plus copertă, audio în română și caiet separat de activități.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" }, sku: "PMM-ALBUM-DIGITAL",
  offers: { "@type": "Offer", url: `${siteUrl}/povestea-magica`, priceCurrency: "RON", price: "59.00", availability: "https://schema.org/InStock" },
};
export default function MagicalStoryPage() {
  return <main className="album-editorial">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}/>
    <header className="album-hero">
      <Image src="/examples/album/hero-v2.webp" alt="Eva și steluța ei, pe cărarea luminoasă din poveste" fill priority sizes="100vw" className="album-hero-art"/>
      <div className="album-hero-copy"><p>O aventură pe care o va recunoaște ca fiind a lui.</p><h1>Povestea Magică</h1><p className="album-hero-description">Chipul, lumea și micile lui bucurii devin o carte de citit împreună.</p><a id="album-primary-cta" href="#configureaza-albumul" className="album-action">Creează Povestea Magică <ArrowRight size={18}/></a><a href="#rasfoieste-povestea" className="album-hero-link">Răsfoiește povestea</a></div>
    </header>
    <div className="album-facts"><strong>{commerce.prices.illustratedAlbum} <small>ediția digitală</small></strong><span><BookOpen size={18}/>16 pagini · 13 scene + copertă</span><span><Headphones size={18}/>Audio în română</span><span><Palette size={18}/>Caiet de activități</span><span><Mail size={18}/>Pe email</span></div>
    <div id="rasfoieste-povestea" className="album-sample"><AlbumFlipbook/></div>
    <section className="album-family-band"><div><p className="album-eyebrow">Nu doar numele pe copertă</p><h2>Detaliile mici fac<br/>povestea lor.</h2><p>O bicicletă albastră. Sora mai mare. Un rucsac care merge peste tot. Tu ne spui ce contează, iar aventura începe de acolo.</p><LumiOpenButton label="Construim împreună cu Lumi" className="album-inline-link"/></div><ol><li><b>01</b><div><h3>Îl cunoaștem pe erou</h3><p>Din descriere sau dintr-o fotografie opțională.</p></div></li><li><b>02</b><div><h3>Deschideți o lume</h3><p>Alegeți un univers sau povestiți-ne ideea voastră.</p></div></li><li><b>03</b><div><h3>Vedeți, apoi alegeți</h3><p>Coperta și două pagini personalizate, înainte de plată.</p></div></li></ol></section>
    <section id="configureaza-albumul" className="album-configure"><div className="album-section-heading"><p className="album-eyebrow">Acum începe povestea voastră</p><h2>Pe cine întâlnim în prima pagină?</h2></div><AlbumCreator/></section>
    <section className="album-included"><div><p className="album-eyebrow">Dincolo de ultima pagină</p><h2>Povestea se termină.<br/>Joaca, nu.</h2><p>Cartea și caietul sosesc separat: răsfoiți aventura pe tabletă, apoi imprimați doar paginile pe care vreți să desenați.</p><p>Colorat, un labirint cu soluție și diferențe de descoperit inclusiv pe hârtie alb-negru.</p></div><Image src="/examples/album/collection/colorat.webp" alt="O pagină reală din caietul de activități al Evei" width={960} height={676} sizes="(max-width: 700px) 90vw, 45vw"/></section>
    <section className="album-trust"><ShieldCheck size={26}/><div><h2>O lume inventată. Grijă reală.</h2><p>Fotografia este opțională. Materialele sunt livrate prin link privat. Ilustrațiile sunt verificate înainte de a intra în album.</p></div><a href="/politica-de-confidentialitate">Despre confidențialitate <ArrowRight size={17}/></a></section>
    <Reviews/>
    <section className="album-questions"><h2>Înainte de prima pagină</h2>{[
      ["Primesc o carte tipărită?", "În prezent primești ediția digitală: cartea PDF, caietul PDF și audio. Variantele tipărite vor fi disponibile ulterior."],
      ["Ce văd înainte să plătesc?", "O copertă și două pagini interioare create pentru copil, cu marcaj de mostră. Poți reveni la detalii dacă vrei să corectezi aspectul. Mostrele sunt limitate pentru a păstra generarea disponibilă tuturor."],
      ["Cât durează?", "Mostra și albumul complet se creează în mai multe etape și pot dura câteva minute. După plată, povestea continuă să se pregătească și dacă închizi pagina; primești livrarea pe email."],
      ["Pot folosi o idee proprie?", "Da. Poți inventa lumea, firul poveștii și poți include o persoană dragă. AI-ul construiește o aventură nouă din alegerile tale, fără un scenariu unic pentru toate familiile."],
    ].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <AlbumPrintTeaser/><Footer/><LumiGuideLoader/><MobileAlbumCTA price={commerce.prices.illustratedAlbum}/>
  </main>;
}
