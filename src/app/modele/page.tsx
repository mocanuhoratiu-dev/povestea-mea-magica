import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Modele PDF | Povestea Mea Magică",
  description: "Vezi forma Poveștii de Seară, a Scutului de Noapte și a Trusei de Răbdare.",
};

const models = [
  {
    moment: "Pentru seară",
    title: "Povestea de Seară",
    price: "29 lei",
    description: "Copertă cu numele copilului, dedicație de la familie și patru pagini de aventură pentru citit împreună.",
    image: "/examples/poveste-contact.png",
    href: "/#creator",
    cta: "Creează povestea",
    accent: "text-brand-purple",
    border: "border-brand-purple",
    icon: BookOpen,
  },
  {
    moment: "Pentru noapte",
    title: "Scutul de Noapte",
    price: "19 lei",
    description: "Certificat personalizat, ritual blând, rețetă simbolică și etichete care transformă seara într-un moment repetabil.",
    image: "/examples/scut-contact.png",
    href: "/#monster-away",
    cta: "Creează scutul",
    accent: "text-brand-gold",
    border: "border-brand-gold",
    icon: ShieldCheck,
  },
  {
    moment: "Pentru așteptare",
    title: "Trusa de Răbdare",
    price: "19 lei",
    description: "Misiuni și jocuri adaptate locului, provocări pentru copil și o diplomă de final pentru păstrat.",
    image: "/examples/trusa-contact.png",
    href: "/#emergency-kit",
    cta: "Pregătește trusa",
    accent: "text-brand-orange",
    border: "border-brand-orange",
    icon: TimerReset,
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
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Modele reale</p>
              <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">Vezi cum prinde formă fiecare moment</h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Modelele arată structura materialelor. La generare, textul, alegerile și detaliile sunt adaptate copilului și contextului vostru.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pt-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-3">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <article key={model.title} className="flex flex-col bg-white shadow-[0_12px_30px_rgba(36,50,79,0.08)]">
                <div className={`border-t-4 ${model.border}`} />
                <div className="relative aspect-[4/3] overflow-hidden border-b border-brand-navy/10 bg-brand-navy/5">
                  <Image src={model.image} alt={`Model ${model.title}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${model.accent}`}><Icon size={17} /> {model.moment}</div>
                  <h2 className="mt-4 font-serif text-3xl leading-tight text-brand-navy">{model.title}</h2>
                  <p className="mt-3 text-base font-medium leading-relaxed text-brand-navy/70">{model.description}</p>
                  <div className="mt-7 flex items-end justify-between gap-5 border-t border-brand-navy/10 pt-5">
                    <div><p className="text-2xl font-black text-brand-navy">{model.price}</p><p className="text-xs font-bold text-brand-navy/50">la lansarea comercială</p></div>
                    <Link href={model.href} className="inline-flex items-center gap-2 text-sm font-black text-brand-purple transition-colors hover:text-brand-navy">{model.cta}<ArrowRight size={17} /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-24 bg-brand-navy px-6 py-14 text-brand-cream">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Pachet complet</p><p className="mt-3 font-serif text-4xl">Toate cele trei materiale, 49 lei.</p><p className="mt-3 max-w-xl font-medium leading-relaxed text-brand-cream/75">O poveste, un ritual de noapte și o trusă pentru așteptare, fiecare adaptată pentru copilul tău.</p></div>
          <Link href="/#alege-materialul" className="inline-flex items-center gap-2 bg-brand-gold px-6 py-4 font-black text-brand-navy transition-colors hover:bg-brand-cream">Alege un moment <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
