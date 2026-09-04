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
  ["Ce primesc?", "Povestea Magică include o carte ilustrată de 16 pagini și un caiet separat de 5 pagini, cu colorat, labirint și găsește diferențele. Scutul de Noapte are 6 pagini, iar Trusa de Răbdare are 7 pagini, toate personalizate și pregătite pentru print."],
  ["Este personalizat cu adevărat?", "Da. Alegerile despre copil, aspect, lume, personaje, lecție și context schimbă povestea și ilustrațiile. Povestea Magică folosește un plan narativ și o fișă vizuală pentru coerență, iar personajul poate fi construit din descriere sau cu ajutorul unei fotografii opționale."],
  ["Cât durează?", "Scutul și Trusa sunt gata, de regulă, în mai puțin de un minut. Povestea Magică poate dura 6-10 minute, deoarece personajul, coperta, cele 13 scene și activitățile sunt create și verificate separat."],
  ["Pot modifica ceva înainte de PDF?", "Da. Pentru Povestea Magică răsfoiești înainte de plată coperta și două pagini interioare personalizate, cu watermark discret. Dacă schimbi alegerile sau fotografia, creezi un preview nou. Coperta confirmată devine reperul vizual al personajului în întreaga carte."],
  ["Cum este folosită fotografia copilului?", "Fotografia este opțională și necesită confirmarea părintelui sau a reprezentantului legal. Este redimensionată, curățată de metadate și folosită privat pentru personaj; nu apare ca fotografie în carte, nu ajunge la Stripe și este programată pentru ștergere automată împreună cu materialele comenzii."],
  ["Pot printa materialele?", "Da. Povestea Magică și caietul de activități folosesc format A5 landscape. Scutul și Trusa sunt pregătite pentru A4. Toate pot fi tipărite acasă sau la un centru de print."],
  ["Care sunt prețurile?", "Povestea Magică costă 59 lei. Scutul de Noapte și Trusa de Răbdare costă câte 19 lei. Pachetul Complet le include pe toate la 79 lei, în loc de 97 lei. Prețul final este afișat înainte de plata securizată."],
  ["Sunt materialele un sfat medical sau terapeutic?", "Nu. Sunt povești, activități și ritualuri de joacă. Dacă o teamă sau o situație este intensă ori persistă, cel mai potrivit este să discuți cu un specialist."],
];

export default function FaqPage() {
  return <CommercialPage eyebrow="Întrebări frecvente" title="Lucrurile pe care e bine să le știi înainte să începi." description="Răspunsuri clare despre personalizare, PDF-uri, accesul la platformă și felul în care folosim datele introduse.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">{questions.map(([question,answer],index)=><article key={question} className="grid gap-4 py-8 md:grid-cols-[96px_.7fr_1.3fr]"><p className="font-mono text-sm font-black text-brand-gold">0{index+1}</p><h2 className="font-serif text-3xl leading-tight text-brand-navy">{question}</h2><p className="text-base font-medium leading-relaxed text-brand-navy/70">{answer}</p></article>)}</div><div className="mx-auto mt-12 flex max-w-5xl flex-col justify-between gap-5 border-y border-brand-navy/15 py-8 md:flex-row md:items-center"><p className="font-medium text-brand-navy/70">Nu ai găsit răspunsul?</p><Link href="/contact" className="inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Scrie-ne <ArrowRight size={16}/></Link></div></section>
  </CommercialPage>;
}
