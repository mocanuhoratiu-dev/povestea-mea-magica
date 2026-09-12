import type { Metadata } from "next";
import EmergencyKit from "@/components/EmergencyKit";
import Footer from "@/components/Footer";
import PrintedEditionNotice from "@/components/PrintedEditionNotice";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import MobileProductCTA from "@/components/MobileProductCTA";
import { commerce, siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Dosarul Micului Explorator | Activități personalizate fără ecrane",
  description: "10 pagini de activități personalizate pentru restaurant, drum și alte momente de așteptare, adaptate vârstei și timpului disponibil.",
  alternates: { canonical: "/trusa-de-rabdare" },
  openGraph: {
    url: "/trusa-de-rabdare",
    title: "Dosarul Micului Explorator | Activități personalizate fără ecrane",
    description: "O misiune de 10 pagini creată pentru locul, timpul și pasiunile copilului tău.",
    images: [{ url: "/social/og-trusa-de-rabdare.webp", width: 1200, height: 630, alt: "Dosarul Micului Explorator, activități personalizate pentru copii" }],
  },
  twitter: { card: "summary_large_image", title: "Dosarul Micului Explorator", description: "Activități personalizate, fără ecrane, pentru momentele de așteptare.", images: ["/social/og-trusa-de-rabdare.webp"] },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Dosarul Micului Explorator",
  image: [`${siteUrl}/social/og-trusa-de-rabdare.webp`, `${siteUrl}/examples/trusa-premium/page-3-display.webp`],
  description: "Trusă digitală personalizată de 10 pagini A4, cu activități fără ecrane, trei niveluri de dificultate și trasee pentru 10-30+ minute.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" },
  sku: "PMM-TRUSA-RABDARE",
  category: "Activități printabile personalizate pentru copii",
  offers: { "@type": "Offer", url: `${siteUrl}/trusa-de-rabdare`, priceCurrency: "RON", price: "19.00", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
};

export default function PatienceKitPage() {
  return <main className="min-h-screen bg-brand-cream pt-16 md:pt-20"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /><EmergencyKit /><PrintedEditionNotice product="emergency" /><Footer /><LumiGuideLoader /><MobileProductCTA product="emergency" targetId="configureaza-trusa" title="Dosarul Micului Explorator" action="Pregătește acum" price={commerce.prices.patienceKit} tone="day" /></main>;
}
