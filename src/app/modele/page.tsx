import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Modele PDF | Povestea Mea Magică",
  description: "Răsfoiește pagini reale din Povestea de Seară, Scutul de Noapte și Trusa de Răbdare.",
};

const models = [
  {
    moment: "Pentru seară",
    title: "Povestea de Seară",
    price: "29 lei",
    description: "O aventură pentru citit împreună, cu o copertă ilustrată, dedicație și patru pagini de poveste.",
    href: "/#creator",
    cta: "Creează povestea",
    accent: "text-brand-purple",
    rule: "bg-brand-purple",
    icon: BookOpen,
    choices: ["numele și vârsta copilului", "lumea, lecția și tonul", "detalii din familie și dedicația"],
    pages: [
      { src: "/examples/story/coperta.png", title: "Coperta", caption: "Lumea și numele devin prima invitație în poveste." },
      { src: "/examples/story/dedicatie.png", title: "Dedicația", caption: "Mesajul familiei face materialul un mic obiect de păstrat." },
      { src: "/examples/story/aventura.png", title: "Aventura", caption: "Alegerile copilului schimbă decorul, acțiunea și rezolvarea." },
    ],
  },
  {
    moment: "Pentru noapte",
    title: "Scutul de Noapte",
    price: "19 lei",
    description: "Un ritual simbolic de seară, cu certificat, pași ușor de repetat și etichete pentru flacon.",
    href: "/#monster-away",
    cta: "Creează scutul",
    accent: "text-brand-gold",
    rule: "bg-brand-gold",
    icon: ShieldCheck,
    choices: ["numele copilului", "teama și locul în care apare", "lucrurile care îl/o liniștesc"],
    pages: [
      { src: "/examples/scut/certificat.png", title: "Certificatul", caption: "Curajul primește un nume și o misiune pe măsura copilului." },
      { src: "/examples/scut/ritual.png", title: "Ritualul", caption: "Pașii urmăresc frica și ritualul pe care îl alegeți împreună." },
      { src: "/examples/scut/etichete.png", title: "Etichetele", caption: "Flaconul rămâne o ancoră jucăușă pentru rutina de seară." },
    ],
  },
  {
    moment: "Pentru așteptare",
    title: "Trusa de Răbdare",
    price: "19 lei",
    description: "Șapte pagini de activități pentru drum, restaurant, medic sau alte momente în care timpul trece mai greu.",
    href: "/#emergency-kit",
    cta: "Pregătește trusa",
    accent: "text-brand-orange",
    rule: "bg-brand-orange",
    icon: TimerReset,
    choices: ["numele și vârsta copilului", "locul în care așteptați", "interesele și ritmul activităților"],
    pages: [
      { src: "/examples/trusa/radar.png", title: "Radarul", caption: "Locul ales devine punctul de plecare pentru prima misiune." },
      { src: "/examples/trusa/rabdare.png", title: "Povestea continuă", caption: "Interesele copilului dau direcție provocării narative." },
      { src: "/examples/trusa/provocare.png", title: "Provocarea finală", caption: "Întrebările și micile sarcini sunt potrivite contextului vostru." },
    ],
  },
];

export default function ModelsPage() {
  return (
    <main className="min-h-screen bg-brand-cream pb-24 pt-32">
      <section className="px-6">
        <div className="mx-auto max-w-7xl border-b border-brand-navy/15 pb-14">
          <div className="flex max-w-3xl items-start gap-5">
            <BrandMark className="mt-1 h-12 w-12 shrink-0" title="Lanterna Magică" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Răsfoiește înainte să alegi</p>
              <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">Vezi materialul înainte să îl creezi</h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Fiecare serie de mai jos arată pagini reale dintr-un model. La generare, alegerile tale schimbă textul, misiunile și detaliile care apar în PDF.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pt-16">
        <div className="mx-auto max-w-7xl space-y-20">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <article key={model.title} className="border-t border-brand-navy/15 pt-8 first:border-t-0 first:pt-0">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.4fr)] lg:gap-16">
                  <div className="lg:sticky lg:top-28 lg:self-start">
                    <div className={`h-1 w-16 ${model.rule}`} />
                    <div className={`mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${model.accent}`}><Icon size={17} /> {model.moment}</div>
                    <h2 className="mt-4 font-serif text-4xl leading-tight text-brand-navy">{model.title}</h2>
                    <p className="mt-4 text-lg font-medium leading-relaxed text-brand-navy/70">{model.description}</p>
                    <p className="mt-8 font-nunito text-3xl font-black text-brand-navy">{model.price}</p>
                    <p className="mt-1 text-xs font-bold text-brand-navy/50">preț de lansare comercială</p>

                    <div className="mt-8 border-y border-brand-navy/12 py-5">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-navy/50">În model se schimbă</p>
                      <ul className="mt-4 space-y-3 text-sm font-bold leading-relaxed text-brand-navy/75">
                        {model.choices.map((choice) => <li key={choice} className="flex gap-3"><span className={model.accent}>✦</span>{choice}</li>)}
                      </ul>
                    </div>

                    <Link href={model.href} className="mt-8 inline-flex items-center gap-2 bg-brand-navy px-6 py-4 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">
                      {model.cta} <ArrowRight size={17} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {model.pages.map((page) => (
                      <figure key={page.src} className="min-w-0">
                        <div className="relative aspect-[0.707] overflow-hidden border border-brand-navy/15 bg-white shadow-[0_14px_28px_rgba(36,50,79,0.12)]">
                          <Image src={page.src} alt={`${model.title}: ${page.title}`} fill sizes="(min-width: 640px) 28vw, 88vw" className="object-cover" />
                        </div>
                        <figcaption className="pt-4">
                          <p className="font-serif text-xl text-brand-navy">{page.title}</p>
                          <p className="mt-2 text-sm font-medium leading-relaxed text-brand-navy/65">{page.caption}</p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
                {index < models.length - 1 && <div className="mt-20 h-px bg-brand-navy/15" />}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-24 bg-brand-navy px-6 py-14 text-brand-cream">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Pachet complet</p><p className="mt-3 font-serif text-4xl">Toate cele trei materiale, 49 lei.</p><p className="mt-3 max-w-xl font-medium leading-relaxed text-brand-cream/75">O poveste, un ritual de noapte și o trusă pentru așteptare, fiecare pornind de la alegerile familiei voastre.</p></div>
          <Link href="/#alege-materialul" className="inline-flex items-center gap-2 bg-brand-gold px-6 py-4 font-black text-brand-navy transition-colors hover:bg-brand-cream">Alege un moment <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
