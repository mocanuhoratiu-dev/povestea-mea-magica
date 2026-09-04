import type { Metadata } from "next";
import EmergencyKit from "@/components/EmergencyKit";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";

export const metadata: Metadata = { title: "Trusa de Răbdare | Activități personalizate", description: "Creează activități printabile pentru restaurant, drum și alte momente de așteptare.", alternates: { canonical: "/trusa-de-rabdare" } };

export default function PatienceKitPage() {
  return <main className="min-h-screen bg-brand-cream pt-16 md:pt-20"><EmergencyKit /><Footer /><LumiGuideLoader /></main>;
}
