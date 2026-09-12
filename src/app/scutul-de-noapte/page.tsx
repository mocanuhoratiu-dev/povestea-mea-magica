import type { Metadata } from "next";
import MonsterKit from "@/components/MonsterKit";
import Footer from "@/components/Footer";
import PrintedEditionNotice from "@/components/PrintedEditionNotice";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import MobileProductCTA from "@/components/MobileProductCTA";
import { commerce, siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Atelierul Scutului Magic | Ritual personalizat pentru copii",
  description: "Un ritual de seară personalizat de 13 pagini, cu certificat, poveste, fișa «Camera mea», card pentru noptieră și audio ghidat de Lumi.",
  alternates: { canonical: "/scutul-de-noapte" },
  openGraph: {
    url: "/scutul-de-noapte",
    title: "Atelierul Scutului Magic | Ritual personalizat pentru copii",
    description: "13 pagini personalizate și audio cu Lumi pentru serile în care copilul are nevoie de repere familiare.",
    images: [{ url: "/social/og-scutul-de-noapte.webp", width: 1200, height: 630, alt: "Atelierul Scutului Magic, ritual personalizat pentru copii" }],
  },
  twitter: { card: "summary_large_image", title: "Atelierul Scutului Magic", description: "Un ritual de seară personalizat, creat pentru copil și familia sa.", images: ["/social/og-scutul-de-noapte.webp"] },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Atelierul Scutului Magic",
  image: [`${siteUrl}/social/og-scutul-de-noapte.webp`, `${siteUrl}/examples/kits-v2/atelier-preview.webp`],
  description: "Ritual personalizat de seară de 13 pagini A4, cu certificat, poveste, repere pentru cameră, card pentru noptieră și ghid audio.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" },
  sku: "PMM-SCUT-NOAPTE",
  category: "Material digital personalizat pentru copii",
  offers: { "@type": "Offer", url: `${siteUrl}/scutul-de-noapte`, priceCurrency: "RON", price: "19.00", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
};

export default function NightShieldPage() {
  return <main className="min-h-screen bg-brand-navy pt-16 md:pt-20"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /><MonsterKit /><PrintedEditionNotice product="monster" /><Footer /><LumiGuideLoader /><MobileProductCTA product="monster" targetId="configureaza-scutul" title="Atelierul Scutului Magic" action="Creează acum" price={commerce.prices.nightShield} tone="night" /></main>;
}
