import type { Metadata } from "next";
import BundleConfigurator from "@/components/BundleConfigurator";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Pachetul Complet | Povestea Mea Magică",
  description: "Personalizează o poveste lungă, două kituri și Albumul Meu Magic într-o singură comandă cu cinci PDF-uri.",
  alternates: { canonical: "/pachet-complet" },
};

export default function CompleteBundlePage() {
  return (
    <CommercialPage eyebrow="Pachetul Complet · 99 lei" title="Toată magia într-o singură comandă." description="Primești povestea lungă, Scutul de Noapte, Trusa de Răbdare, cartea ilustrată și caietul de activități. Personalizezi fiecare produs separat și plătești o singură dată.">
      <BundleConfigurator variant="complete" />
    </CommercialPage>
  );
}
