import type { Metadata } from "next";
import BundleConfigurator from "@/components/BundleConfigurator";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Pachetul Complet | Povestea Mea Magică",
  description: "Personalizează Povestea Magică, Scutul de Noapte și Trusa de Răbdare într-o singură comandă cu patru PDF-uri.",
  alternates: { canonical: "/pachet-complet" },
};

export default function CompleteBundlePage() {
  return (
    <CommercialPage eyebrow="Pachetul Complet · 79 lei" title="Toată magia într-o singură comandă." description="Primești Povestea Magică, Scutul de Noapte și Trusa de Răbdare. Cartea ilustrată vine cu propriul caiet de activități, fiecare produs se personalizează separat, iar plata se face o singură dată.">
      <BundleConfigurator />
    </CommercialPage>
  );
}
