import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import StoryCreator from "@/components/StoryCreator";
import MonsterKit from "@/components/MonsterKit";
import EmergencyKit from "@/components/EmergencyKit";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <StoryCreator />
      <MonsterKit />
      <EmergencyKit />
      <Reviews />
      <FAQ />
      <Footer />
    </main>
  );
}
