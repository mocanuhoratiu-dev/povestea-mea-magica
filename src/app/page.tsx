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

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <main className="min-h-screen">
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
