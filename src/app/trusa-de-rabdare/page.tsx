import type { Metadata } from "next";
import EmergencyKit from "@/components/EmergencyKit";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import MobileProductCTA from "@/components/MobileProductCTA";
import { commerce, siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Trusa de Răbdare | Activități personalizate fără ecrane",
  description: "10 pagini de activități personalizate pentru restaurant, drum și alte momente de așteptare, adaptate vârstei și timpului disponibil.",
  alternates: { canonical: "/trusa-de-rabdare" },
  openGraph: {
    url: "/trusa-de-rabdare",
    title: "Trusa de Răbdare | Activități personalizate fără ecrane",
    description: "O misiune de 10 pagini creată pentru locul, timpul și pasiunile copilului tău.",
    images: [{ url: "/examples/trusa-final-contact.png", width: 1200, height: 1140, alt: "Trusa de Răbdare, activități personalizate pentru copii" }],
  },
  twitter: { card: "summary_large_image", title: "Trusa de Răbdare", description: "Activități personalizate, fără ecrane, pentru momentele de așteptare.", images: ["/examples/trusa-final-contact.png"] },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Trusa de Răbdare",
  image: [`${siteUrl}/examples/trusa-final-contact.png`, `${siteUrl}/examples/trusa-premium/page-3.png`],
  description: "Trusă digitală personalizată de 10 pagini A4, cu activități fără ecrane, trei niveluri de dificultate și trasee pentru 10-30+ minute.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" },
  sku: "PMM-TRUSA-RABDARE",
  category: "Activități printabile personalizate pentru copii",
  offers: { "@type": "Offer", url: `${siteUrl}/trusa-de-rabdare`, priceCurrency: "RON", price: "19.00", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
};

export default function PatienceKitPage() {
  return <main className="min-h-screen bg-brand-cream pt-16 md:pt-20"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /><EmergencyKit /><Footer /><LumiGuideLoader /><MobileProductCTA product="emergency" targetId="configureaza-trusa" title="Trusa de Răbdare" action="Pregătește acum" price={commerce.prices.patienceKit} tone="day" /></main>;
}
