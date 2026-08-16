import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, ListChecks, Wand2 } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Cum Funcționează | Povestea Mea Magică",
  description: "Află cum creezi, verifici și descarci un material personalizat pentru copilul tău.",
  alternates: { canonical: "/cum-functioneaza" },
};

const steps = [
  { number: "01", title: "Alegi un moment", text: "Începi cu o poveste de seară, un ritual de noapte sau o activitate pentru așteptare. Poți vedea modele reale înainte să alegi.", icon: ListChecks },
  { number: "02", title: "Adaugi doar ce e util", text: "Numele, vârsta, lumea sau contextul ajută materialul să se potrivească familiei voastre. Nu cere fotografii și nu ai nevoie de cont.", icon: Wand2 },
  { number: "03", title: "Verifici și îl folosiți", text: "Vezi rezultatul, ajustezi ce dorești, apoi îl descarci ca PDF. Pentru poveste poți trimite PDF-ul și pe email.", icon: Download },
];

export default function HowItWorksPage() {
  return <CommercialPage eyebrow="Cum funcționează" title="De la o alegere mică la un material de folosit împreună." description="Procesul este gândit să fie simplu pentru adult și relevant pentru copil. Tu alegi direcția; rezultatul rămâne al vostru.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">{steps.map((step) => { const Icon = step.icon; return <article key={step.number} className="grid gap-5 py-9 md:grid-cols-[96px_.7fr_1.3fr] md:items-start"><p className="font-mono text-sm font-black text-brand-gold">{step.number}</p><div><Icon size={28} className="text-brand-purple" /><h2 className="mt-5 font-serif text-3xl text-brand-navy">{step.title}</h2></div><p className="text-base font-medium leading-relaxed text-brand-navy/70">{step.text}</p></article>; })}</div><div className="mx-auto mt-14 flex max-w-5xl flex-col justify-between gap-6 border-y border-brand-navy/15 py-9 md:flex-row md:items-center"><p className="max-w-2xl text-base font-medium leading-relaxed text-brand-navy/70">Lumi poate recomanda de unde să începi, dar tu păstrezi controlul asupra alegerilor și generării.</p><Link href="/#alege-materialul" className="inline-flex shrink-0 items-center gap-2 bg-brand-navy px-5 py-3 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Alege un moment <ArrowRight size={16} /></Link></div></section>
  </CommercialPage>;
}
