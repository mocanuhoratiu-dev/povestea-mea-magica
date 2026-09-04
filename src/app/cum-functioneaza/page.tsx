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
  { number: "01", title: "Alegi produsul", text: "Începi cu Povestea Magică, Scutul de Noapte sau Trusa de Răbdare. Poți răsfoi pagini reale înainte să alegi.", icon: ListChecks },
  { number: "02", title: "Construiești împreună cu Lumi", text: "Lumi te conduce prin întrebările care contează. Pentru Povestea Magică poți descrie personajul sau poți adăuga opțional o fotografie de referință; nu ai nevoie de cont.", icon: Wand2 },
  { number: "03", title: "Verifici și îl folosiți", text: "Vezi coperta Poveștii Magice înainte de plată. După generare o poți răsfoi și asculta online, apoi descarci cartea și caietul de activități ca PDF.", icon: Download },
];

export default function HowItWorksPage() {
  return <CommercialPage eyebrow="Cum funcționează" title="De la o idee de familie la o carte numai a lor." description="Procesul este simplu pentru adult și profund personal pentru copil. Lumi te ghidează, iar tu păstrezi controlul asupra fiecărei alegeri.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">{steps.map((step) => { const Icon = step.icon; return <article key={step.number} className="grid gap-5 py-9 md:grid-cols-[96px_.7fr_1.3fr] md:items-start"><p className="font-mono text-sm font-black text-brand-gold">{step.number}</p><div><Icon size={28} className="text-brand-purple" /><h2 className="mt-5 font-serif text-3xl text-brand-navy">{step.title}</h2></div><p className="text-base font-medium leading-relaxed text-brand-navy/70">{step.text}</p></article>; })}</div><div className="mx-auto mt-14 flex max-w-5xl flex-col justify-between gap-6 border-y border-brand-navy/15 py-9 md:flex-row md:items-center"><p className="max-w-2xl text-base font-medium leading-relaxed text-brand-navy/70">Poți completa singur configuratorul sau o poți lăsa pe Lumi să așeze răspunsurile direct în Povestea Magică.</p><Link href="/povestea-magica" className="inline-flex shrink-0 items-center gap-2 bg-brand-navy px-5 py-3 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Creează povestea <ArrowRight size={16} /></Link></div></section>
  </CommercialPage>;
}
