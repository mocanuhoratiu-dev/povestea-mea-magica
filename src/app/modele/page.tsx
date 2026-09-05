import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookHeart, ShieldCheck, TimerReset } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import Footer from "@/components/Footer";
import ProductReader from "@/components/ProductReader";
import { commerce } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Modele PDF | Povestea Mea Magică",
  description: "Răsfoiește pagini din Povestea Magică, Scutul de Noapte și Trusa de Răbdare.",
  alternates: { canonical: "/modele" },
  openGraph: {
    url: "/modele",
    title: "Modele PDF | Povestea Mea Magică",
    description: "Răsfoiește pagini din Povestea Magică, Scutul de Noapte și Trusa de Răbdare.",
  },
};

const fullPage = { left: 0, top: 0, width: 100, height: 100 };

const models = [
  {
    id: "povestea-magica",
    orientation: "landscape" as const,
    moment: "Pentru o poveste de păstrat",
    title: "Povestea Magică",
    price: commerce.prices.illustratedAlbum,
    pageCount: "16 + 5 pagini A5, format orizontal",
    description: "O carte ilustrată premium în care copilul devine eroul unei aventuri create pentru el.",
    readerNote: "Modelul arată structura vizuală a produsului: cartea are 13 scene ilustrate distinct, iar activitățile sunt livrate separat, ca să poată fi printate pe hârtie potrivită pentru creioane.",
    href: "/povestea-magica",
    cta: "Creează povestea",
    accent: "text-brand-gold",
    rule: "bg-brand-gold",
    icon: BookHeart,
    choices: ["aspectul, ținuta și semnele distinctive", "lumea, companionul și personajele apropiate", "propria idee de poveste, un detaliu din familie și dedicația"],
    source: "/examples/album/coperta.webp",
    pages: [
      { title: "Coperta", caption: "Copilul și lumea aleasă devin semnalul vizual principal.", crop: fullPage, source: "/examples/album/coperta.webp" },
      { title: "În mijlocul aventurii", caption: "Fiecare scenă are o compoziție proprie și continuă povestea.", crop: fullPage, source: "/examples/album/aventura.webp" },
      { title: "Pagina de colorat", caption: "Caietul separat păstrează spațiu real pentru creioane și joacă.", crop: fullPage, source: "/examples/album/colorat.webp" },
      { title: "Labirintul", caption: "Activitățile preiau simboluri și misiuni din universul poveștii.", crop: fullPage, source: "/examples/album/labirint.webp" },
      { title: "Găsește diferențele", caption: "Două imagini din aceeași aventură devin un joc de observație clar și printabil.", crop: fullPage, source: "/examples/album/diferente.webp" },
    ],
  },
  {
    id: "scutul-de-noapte",
    moment: "Pentru noapte",
    title: "Scutul de Noapte",
    price: commerce.prices.nightShield,
    pageCount: "9 pagini A4 + audio",
    description: "Un ritual magic de seară, cu certificat, rețetă imaginară și etichete, completat de poveste, fișa «Camera mea», respirație și ghid pentru părinte.",
    readerNote: "Jocul simbolic deschide experiența, apoi copilul recunoaște camera și pașii ritualului, iar părintele primește un limbaj blând, fără promisiuni medicale sau confirmarea pericolului imaginat.",
    href: "/scutul-de-noapte",
    cta: "Creează scutul",
    accent: "text-brand-gold",
    rule: "bg-brand-gold",
    icon: ShieldCheck,
    choices: ["numele copilului și teama aleasă", "locul din cameră și semnul de liniștire", "ritualul propriu al familiei"],
    source: "/examples/scut-classic-plus-contact.png",
    pages: [
      { title: "Certificatul de protecție magică", caption: "Copilul primește certificatul oficial original, cu clauze magice și sigiliul Dragonului Somnoros.", crop: { left: 2.5, top: 2.6, width: 45, height: 44.6 } },
      { title: "Rețeta imaginară", caption: "Ingredientele fantastice și formula personalizată fac ritualul memorabil.", crop: { left: 52.5, top: 2.6, width: 45, height: 44.6 } },
      { title: "Etichetele Scutului", caption: "Etichetele detașabile transformă un flacon gol într-un obiect de joacă simbolică.", crop: { left: 2.5, top: 52.6, width: 45, height: 44.6 } },
    ],
  },
  {
    id: "trusa-de-rabdare",
    moment: "Pentru așteptare",
    title: "Trusa de Răbdare",
    price: commerce.prices.patienceKit,
    pageCount: "10 pagini A4",
    description: "Opt activități pentru drum, restaurant, medic sau alte momente în care timpul pare să treacă mai greu.",
    readerNote: "Paginile alternează între observare, logică, desen, colorat și joc verbal. Labirintul și diferențele folosesc structuri validate, iar AI-ul personalizează restul selecției.",
    href: "/trusa-de-rabdare",
    cta: "Pregătește trusa",
    accent: "text-brand-orange",
    rule: "bg-brand-orange",
    icon: TimerReset,
    choices: ["numele și vârsta copilului", "locul și durata așteptării", "interesele și nivelul de dificultate"],
    source: "/examples/trusa-final-contact.png",
    pages: [
      { title: "Coperta-ghid", caption: "Momentul, durata, nivelul și modul de folosire sunt clare de la început.", crop: { left: 1.7, top: 2.6, width: 30, height: 44.6 } },
      { title: "Radarul exploratorului", caption: "Locul ales devine punctul de plecare pentru observații reale.", crop: { left: 35, top: 2.6, width: 30, height: 44.6 } },
      { title: "Labirint validat", caption: "Traseul este construit controlat și are o soluție clară.", crop: { left: 68.3, top: 2.6, width: 30, height: 44.6 } },
      { title: "Găsește diferențele", caption: "Cele cinci diferențe sunt intenționate și apar în pagina de răspunsuri.", crop: { left: 1.7, top: 52.6, width: 30, height: 44.6 } },
      { title: "Cartonașele", caption: "Opt misiuni scurte pot fi decupate și refolosite.", crop: { left: 35, top: 52.6, width: 30, height: 44.6 } },
      { title: "Soluții și certificat", caption: "Adultul are răspunsurile, iar copilul încheie trusa cu un certificat personalizat.", crop: { left: 68.3, top: 52.6, width: 30, height: 44.6 } },
    ],
  },
];

export default function ModelsPage() {
  return (
    <>
      <main className="min-h-screen bg-brand-cream pb-24 pt-32">
      <section className="px-6">
        <div className="mx-auto max-w-7xl border-b border-brand-navy/15 pb-14">
          <div className="grid max-w-5xl gap-8 md:grid-cols-[auto_1fr] md:items-start">
            <BrandMark className="h-16 w-16" title="Lanterna Magică" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Răsfoiește înainte să alegi</p>
              <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">Nu alegi o promisiune. Vezi paginile.</h1>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-brand-navy/70">Fiecare model de mai jos arată pagini reale ale produsului. La generare, structura rămâne clară, iar textul, misiunile și detaliile sunt construite pentru copilul vostru.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pt-16">
        <div className="mx-auto max-w-7xl space-y-24">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <article id={model.id} key={model.title} className="scroll-mt-28 border-t border-brand-navy/15 pt-10 first:border-t-0 first:pt-0">
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
                    <ProductReader title={model.title} source={model.source} pages={model.pages} orientation={"orientation" in model ? model.orientation : undefined} />
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
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Materiale pentru momente reale</p><p className="mt-3 font-serif text-4xl">Începe cu povestea lor.</p><p className="mt-3 max-w-xl font-medium leading-relaxed text-brand-cream/75">Alegi o carte ilustrată, un ritual de noapte sau activități pentru timpul de așteptare și le personalizezi pentru familia voastră.</p></div>
          <Link href="/povestea-magica" className="inline-flex items-center gap-2 bg-brand-gold px-6 py-4 font-black text-brand-navy transition-colors hover:bg-brand-cream">Creează Povestea Magică <ArrowRight size={18} /></Link>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
