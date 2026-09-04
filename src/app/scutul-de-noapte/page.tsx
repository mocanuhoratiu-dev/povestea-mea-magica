import type { Metadata } from "next";
import MonsterKit from "@/components/MonsterKit";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";

export const metadata: Metadata = { title: "Scutul de Noapte | Ritual personalizat", description: "Creează un ritual de seară personalizat pentru nopțile cu emoții.", alternates: { canonical: "/scutul-de-noapte" } };

export default function NightShieldPage() {
  return <main className="min-h-screen bg-brand-navy pt-16 md:pt-20"><MonsterKit /><Footer /><LumiGuideLoader /></main>;
}
