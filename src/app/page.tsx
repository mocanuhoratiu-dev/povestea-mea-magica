import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ProductExamples from "@/components/ProductExamples";
import HowItWorks from "@/components/HowItWorks";
import AlbumFlipbook from "@/components/AlbumFlipbook";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import PersonalizationProof from "@/components/PersonalizationProof";
import QualityTrust from "@/components/QualityTrust";
import FinalStoryCTA from "@/components/FinalStoryCTA";
import { faqs } from "@/lib/faq";
import { siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    images: [{ url: "/examples/album/hero-v2.webp", width: 1677, height: 942, alt: "Povestea Mea Magică, povești ilustrate personalizate" }],
  },
  twitter: { card: "summary_large_image", images: ["/examples/album/hero-v2.webp"] },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
  url: siteUrl,
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Hero />
      <AlbumFlipbook />
      <PersonalizationProof />
      <ProductExamples />
      <HowItWorks />
      <QualityTrust />
      <Reviews />
      <FAQ />
      <FinalStoryCTA />
      <Footer />
      <LumiGuideLoader />
    </main>
  );
}
