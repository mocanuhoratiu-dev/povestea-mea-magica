import type { Metadata } from "next";
import CommercialPage from "@/components/CommercialPage";
import ProductJourney from "@/components/ProductJourney";

export const metadata: Metadata = { title: "Cum funcționează | Povestea Mea Magică", description: "De la detaliile copilului la materialele primite pe email. Vezi pașii pentru fiecare experiență.", alternates: { canonical: "/cum-functioneaza" } };

export default function HowItWorksPage() {
  return <CommercialPage eyebrow="Din câteva detalii, ceva numai al vostru" title="Alegeți. Descoperiți. Păstrați." description="Trei experiențe, același început: tu ne povestești despre copil. Vezi mai jos ce urmează pentru fiecare."><ProductJourney /></CommercialPage>;
}
