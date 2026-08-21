import type { Metadata } from "next";
import BundleConfigurator from "@/components/BundleConfigurator";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Pachetul Familiei Magice | Povestea Mea Magică",
  description: "Personalizează separat o poveste lungă, un Scut de Noapte și o Trusă de Răbdare, într-un singur pachet.",
  alternates: { canonical: "/pachet" },
};

export default function BundlePage() {
  return (
    <CommercialPage eyebrow="Pachet complet · 49 lei" title="Trei materiale pentru trei momente ale familiei." description="Pregătești separat povestea, ritualul de seară și activitățile de așteptare. Pot fi pentru același copil sau pentru copii diferiți, iar plata se face o singură dată.">
      <BundleConfigurator />
    </CommercialPage>
  );
}
