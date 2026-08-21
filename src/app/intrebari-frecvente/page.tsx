import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Întrebări Frecvente | Povestea Mea Magică",
  description: "Răspunsuri despre personalizare, PDF-uri, livrare și accesul la Povestea Mea Magică.",
  alternates: { canonical: "/intrebari-frecvente" },
};

const questions = [
  ["Ce primesc?", "Primești un PDF personalizat. Povestea are copertă, dedicație și 2 sau 4 pagini de aventură. Scutul are certificat, ritual și etichete. Trusa are activități adaptate contextului și diplomă."],
  ["Este personalizat cu adevărat?", "Da. Alegerile despre copil, lume, lecție, context și interese schimbă povestea sau misiunile. Pentru poveste poți adăuga și o dedicație de la familie."],
  ["Cât durează?", "De regulă, materialul este gata în mai puțin de un minut. Povestea și coperta pot dura mai mult deoarece sunt create pornind de la alegerile tale."],
  ["Pot modifica ceva înainte de PDF?", "Da. Poți ajusta alegerile și crea o variantă nouă. Pentru poveste poți edita textul înainte de descărcare și poți regenera coperta."],
  ["Pot printa materialele?", "Da. Sunt gândite pentru A4 și funcționează bine atât pe ecran, cât și printate acasă sau la un centru de print."],
  ["Care sunt prețurile?", "Povestea scurtă costă 19 lei, cea lungă 29 lei, iar fiecare kit costă 19 lei. Pachetul Familiei Magice costă 49 lei și include toate cele trei materiale, cu personalizare separată."],
  ["Sunt materialele un sfat medical sau terapeutic?", "Nu. Sunt povești, activități și ritualuri de joacă. Dacă o teamă sau o situație este intensă ori persistă, cel mai potrivit este să discuți cu un specialist."],
];

export default function FaqPage() {
  return <CommercialPage eyebrow="Întrebări frecvente" title="Lucrurile pe care e bine să le știi înainte să începi." description="Răspunsuri clare despre personalizare, PDF-uri, accesul la platformă și felul în care folosim datele introduse.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">{questions.map(([question,answer],index)=><article key={question} className="grid gap-4 py-8 md:grid-cols-[96px_.7fr_1.3fr]"><p className="font-mono text-sm font-black text-brand-gold">0{index+1}</p><h2 className="font-serif text-3xl leading-tight text-brand-navy">{question}</h2><p className="text-base font-medium leading-relaxed text-brand-navy/70">{answer}</p></article>)}</div><div className="mx-auto mt-12 flex max-w-5xl flex-col justify-between gap-5 border-y border-brand-navy/15 py-8 md:flex-row md:items-center"><p className="font-medium text-brand-navy/70">Nu ai găsit răspunsul?</p><Link href="/contact" className="inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Scrie-ne <ArrowRight size={16}/></Link></div></section>
  </CommercialPage>;
}
