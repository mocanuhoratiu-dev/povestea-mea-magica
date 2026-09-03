import type { Metadata } from "next";
import AlbumDeliveryClient from "@/components/AlbumDeliveryClient";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Albumul tău este gata | Povestea Mea Magică",
  robots: { index: false, follow: false },
};

export default function AlbumDeliveryPage() {
  return (
    <>
      <main className="min-h-screen bg-brand-cream px-5 pb-20 pt-24 sm:px-6 md:pt-32">
        <section className="mx-auto max-w-5xl">
          <div className="border-b border-brand-navy/15 pb-9 text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Livrare securizată</p>
            <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy sm:text-5xl">Albumul vostru magic</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-brand-navy/65">Descarcă separat cartea ilustrată și caietul de activități. Linkul personal rămâne valabil 30 de zile.</p>
          </div>
          <div className="mt-10"><AlbumDeliveryClient /></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
