import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import StoryCreator from "@/components/StoryCreator";
import MonsterKit from "@/components/MonsterKit";
import EmergencyKit from "@/components/EmergencyKit";
import Pricing from "@/components/Pricing";
import ProductExamples from "@/components/ProductExamples";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <StoryCreator />
      <ProductExamples />
      <MonsterKit />
      <EmergencyKit />
      <Pricing />
      <Reviews />
      <FAQ />
      <Footer />
    </main>
  );
}
