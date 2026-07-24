import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ProductExamples from "@/components/ProductExamples";
import HowItWorks from "@/components/HowItWorks";
import StoryCreator from "@/components/StoryCreator";
import MonsterKit from "@/components/MonsterKit";
import EmergencyKit from "@/components/EmergencyKit";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProductExamples />
      <HowItWorks />
      <StoryCreator />
      <MonsterKit />
      <EmergencyKit />
      <Reviews />
      <FAQ />
      <Footer />
      <LumiGuideLoader />
    </main>
  );
}
