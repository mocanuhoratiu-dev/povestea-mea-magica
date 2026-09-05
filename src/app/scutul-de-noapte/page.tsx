import type { Metadata } from "next";
import MonsterKit from "@/components/MonsterKit";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import MobileProductCTA from "@/components/MobileProductCTA";
import { commerce, siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Scutul de Noapte | Ritual personalizat pentru copii",
  description: "Un ritual de seară personalizat de 9 pagini, cu certificat, poveste, fișa «Camera mea», card pentru noptieră și audio ghidat de Lumi.",
  alternates: { canonical: "/scutul-de-noapte" },
  openGraph: {
    url: "/scutul-de-noapte",
    title: "Scutul de Noapte | Ritual personalizat pentru copii",
    description: "9 pagini personalizate și audio cu Lumi pentru serile în care copilul are nevoie de repere familiare.",
    images: [{ url: "/examples/scut-classic-plus-contact.png", width: 800, height: 1140, alt: "Scutul de Noapte, ritual personalizat pentru copii" }],
  },
  twitter: { card: "summary_large_image", title: "Scutul de Noapte", description: "Un ritual de seară personalizat, creat pentru copil și familia sa.", images: ["/examples/scut-classic-plus-contact.png"] },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Scutul de Noapte",
  image: [`${siteUrl}/examples/scut/certificat.png`, `${siteUrl}/examples/scut/etichete.png`],
  description: "Ritual personalizat de seară de 9 pagini A4, cu certificat, poveste, repere pentru cameră, card pentru noptieră și ghid audio.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" },
  sku: "PMM-SCUT-NOAPTE",
  category: "Material digital personalizat pentru copii",
  offers: { "@type": "Offer", url: `${siteUrl}/scutul-de-noapte`, priceCurrency: "RON", price: "19.00", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
};

export default function NightShieldPage() {
  return <main className="min-h-screen bg-brand-navy pt-16 md:pt-20"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /><MonsterKit /><Footer /><LumiGuideLoader /><MobileProductCTA product="monster" targetId="configureaza-scutul" title="Scutul de Noapte" action="Creează acum" price={commerce.prices.nightShield} tone="night" /></main>;
}
