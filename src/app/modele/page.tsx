import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import ProductReader, { type ReaderPage } from "@/components/ProductReader";

export const metadata: Metadata = {
  title: "Modele PDF | Povestea Mea Magică",
  description: "Răsfoiește exemple complete din Povestea de Seară, Scutul de Noapte și Trusa de Răbdare.",
};

const fullPage = { left: 0, top: 0, width: 100, height: 100 };

const twoByTwoPages: ReaderPage[] = [
  { title: "Coperta", caption: "Numele și lumea aleasă deschid aventura.", crop: { left: 2.5, top: 2.6, width: 45, height: 44.6 } },
  { title: "Prima parte", caption: "Primele detalii ale copilului intră firesc în poveste.", crop: { left: 52.5, top: 2.6, width: 45, height: 44.6 } },
  { title: "Aventura prinde curaj", caption: "Lecția se întâmplă prin acțiune, nu ca o morală pusă la final.", crop: { left: 2.5, top: 52.6, width: 45, height: 44.6 } },
  { title: "Ultima parte", caption: "Povestea încheie aventura într-un ton liniștit, potrivit pentru seară.", crop: { left: 52.5, top: 52.6, width: 45, height: 44.6 } },
];

const models = [
  {
    moment: "Pentru seară",
    title: "Povestea de Seară",
    price: "29 lei",
    pageCount: "6+ pagini în materialul final",
    description: "O aventură pentru citit împreună. Începe cu o copertă ilustrată, păstrează un mesaj de dedicație și continuă cu patru pagini de poveste.",
    readerNote: "Aici vezi cinci pagini reale dintr-o poveste creată pentru Eva. Materialul nou include copertă, dedicație și minimum patru pagini de poveste, construite din alegerile familiei tale.",
    href: "/#creator",
    cta: "Creează povestea",
    accent: "text-brand-purple",
    rule: "bg-brand-purple",
    icon: BookOpen,
    choices: ["numele și vârsta copilului", "lumea, lecția și tonul", "detalii din familie și dedicația"],
    source: "/examples/poveste-contact.png",
    pages: [
      { title: "Coperta", caption: "Numele și lumea aleasă deschid aventura.", crop: fullPage, source: "/examples/story/coperta.png" },
      { title: "Dedicația", caption: "Mesajul familiei devine prima pagină de păstrat.", crop: fullPage, source: "/examples/story/dedicatie.png" },
      ...twoByTwoPages.slice(1),
    ],
  },
  {
    moment: "Pentru noapte",
    title: "Scutul de Noapte",
    price: "19 lei",
    pageCount: "3 pagini printabile",
    description: "Un ritual simbolic de seară, cu certificat, pași ușor de repetat și etichete pentru flacon.",
    readerNote: "Fiecare parte are un rol simplu: validați curajul, pregătiți ritualul și lăsați o ancoră vizuală la îndemână.",
    href: "/#monster-away",
    cta: "Creează scutul",
    accent: "text-brand-gold",
    rule: "bg-brand-gold",
    icon: ShieldCheck,
    choices: ["numele copilului", "teama și locul în care apare", "lucrurile care îl/o liniștesc"],
    source: "/examples/scut-contact.png",
    pages: [
      { title: "Certificatul", caption: "Curajul primește un nume și o misiune pe măsura copilului.", crop: { left: 2.5, top: 2.6, width: 45, height: 44.6 } },
      { title: "Rețeta ritualului", caption: "Pașii urmăresc teama și ritualul pe care îl alegeți împreună.", crop: { left: 52.5, top: 2.6, width: 45, height: 44.6 } },
      { title: "Etichetele", caption: "Flaconul rămâne o ancoră jucăușă pentru rutina de seară.", crop: { left: 2.5, top: 52.6, width: 45, height: 44.6 } },
    ],
  },
  {
    moment: "Pentru așteptare",
    title: "Trusa de Răbdare",
    price: "19 lei",
    pageCount: "5 pagini de activități",
    description: "Activități pentru drum, restaurant, medic sau alte momente în care timpul pare să treacă mai greu.",
    readerNote: "Paginile alternează între observare, desen, joc de cuvinte și o mică reușită de final. Le puteți folosi în orice ordine.",
    href: "/#emergency-kit",
    cta: "Pregătește trusa",
    accent: "text-brand-orange",
    rule: "bg-brand-orange",
    icon: TimerReset,
    choices: ["numele și vârsta copilului", "locul în care așteptați", "interesele și ritmul activităților"],
    source: "/examples/trusa-contact.png",
    pages: [
      { title: "Radarul Magic", caption: "Locul ales devine punctul de plecare pentru prima misiune.", crop: { left: 1.7, top: 2.6, width: 30, height: 44.6 } },
      { title: "Creativitate și răbdare", caption: "O provocare scurtă lasă loc pentru desen și imaginație.", crop: { left: 35, top: 2.6, width: 30, height: 44.6 } },
      { title: "Continuă povestea", caption: "Interesele copilului dau direcție provocării narative.", crop: { left: 68.3, top: 2.6, width: 30, height: 44.6 } },
      { title: "Provocarea finală", caption: "Întrebările și micile sarcini sunt potrivite contextului vostru.", crop: { left: 1.7, top: 52.6, width: 30, height: 44.6 } },
      { title: "Diploma de onoare", caption: "O încheiere simplă pentru o așteptare dusă cu bine.", crop: { left: 35, top: 52.6, width: 30, height: 44.6 } },
    ],
  },
];

export default function ModelsPage() {
  return (
    <main className="min-h-screen bg-brand-cream pb-24 pt-32">
      <section className="px-6">
        <div className="mx-auto max-w-7xl border-b border-brand-navy/15 pb-14">
          <div className="grid max-w-5xl gap-8 md:grid-cols-[auto_1fr] md:items-start">
            <BrandMark className="h-16 w-16" title="Lanterna Magică" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Răsfoiește înainte să alegi</p>
              <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">Nu alegi o promisiune. Vezi paginile.</h1>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-brand-navy/70">Fiecare reader de mai jos arată pagini reale ale produsului. La generare, structura rămâne clară, iar textul, misiunile și detaliile sunt construite pentru copilul vostru.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pt-16">
        <div className="mx-auto max-w-7xl space-y-24">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <article key={model.title} className="border-t border-brand-navy/15 pt-10 first:border-t-0 first:pt-0">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:gap-16">
                  <div className="lg:sticky lg:top-28 lg:self-start">
                    <div className={`h-1 w-16 ${model.rule}`} />
                    <div className={`mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${model.accent}`}><Icon size={17} /> {model.moment}</div>
                    <h2 className="mt-4 font-serif text-4xl leading-tight text-brand-navy">{model.title}</h2>
                    <p className="mt-4 text-lg font-medium leading-relaxed text-brand-navy/70">{model.description}</p>
                    <div className="mt-7 flex items-baseline gap-4"><p className="font-nunito text-3xl font-black text-brand-navy">{model.price}</p><p className="text-xs font-black uppercase tracking-[0.1em] text-brand-navy/45">{model.pageCount}</p></div>

                    <div className="mt-8 border-y border-brand-navy/12 py-5">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-navy/50">Se personalizează</p>
                      <ul className="mt-4 space-y-3 text-sm font-bold leading-relaxed text-brand-navy/75">
                        {model.choices.map((choice) => <li key={choice} className="flex gap-3"><span className={model.accent}>✦</span>{choice}</li>)}
                      </ul>
                    </div>

                    <Link href={model.href} className="mt-8 inline-flex items-center gap-2 bg-brand-navy px-6 py-4 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">
                      {model.cta} <ArrowRight size={17} />
                    </Link>
                  </div>

                  <div>
                    <ProductReader title={model.title} source={model.source} pages={model.pages} />
                    <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-brand-navy/60">{model.readerNote}</p>
                  </div>
                </div>
                {index < models.length - 1 && <div className="mt-24 h-px bg-brand-navy/15" />}
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
