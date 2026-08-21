import type { Metadata } from "next";
import BundleDeliveryClient from "@/components/BundleDeliveryClient";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Pachetul tău este gata | Povestea Mea Magică",
  robots: { index: false, follow: false },
};

export default function BundleDeliveryPage() {
  return (
    <CommercialPage eyebrow="Pachetul vostru" title="Toate cele trei materiale sunt gata." description="Deschide fiecare material, verifică rezultatul și descarcă PDF-urile separat. Linkul personal rămâne valabil 30 de zile.">
      <section className="px-5 py-12 sm:px-6 md:py-18"><div className="mx-auto max-w-4xl"><BundleDeliveryClient /></div></section>
    </CommercialPage>
  );
}
