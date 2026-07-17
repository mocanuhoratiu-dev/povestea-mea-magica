import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Modele PDF | Povestea Mea Magică",
  description: "Vezi structura poveștii personalizate, a Scutului Magic pentru Noapte și a Trusei Magice de Urgență.",
};

const models = [
  {
    title: "Poveste personalizată",
    price: "29 lei",
    description: "Copertă cu numele copilului, dedicație și patru pagini de aventură pentru citit seara.",
    image: "/examples/poveste-contact.png",
    href: "/#creator",
    cta: "Creează povestea",
    accent: "text-brand-purple",
    icon: BookOpen,
  },
  {
    title: "Scut Magic pentru Noapte",
    price: "19 lei",
    description: "Certificat de curaj, ritual simbolic, rețeta spray-ului magic și etichete printabile.",
    image: "/examples/scut-contact.png",
    href: "/#monster-away",
    cta: "Creează scutul",
    accent: "text-brand-gold",
    icon: ShieldCheck,
  },
  {
    title: "Trusa Magică de Urgență",
    price: "19 lei",
    description: "Misiuni și jocuri adaptate locului, întrebări care țin copilul implicat și diplomă finală.",
    image: "/examples/trusa-contact.png",
    href: "/#emergency-kit",
    cta: "Creează trusa",
    accent: "text-orange-500",
    icon: Sparkles,
  },
];

export default function ModelsPage() {
  return (
    <main className="min-h-screen bg-brand-cream pt-32 pb-24">
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-purple/10 px-4 py-2 text-sm font-black uppercase tracking-widest text-brand-purple">
              <BookOpen size={16} /> Modele PDF
            </p>
            <h1 className="mt-6 font-nunito text-4xl font-extrabold leading-tight text-brand-navy md:text-6xl">
              Vezi forma fiecărui material
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">
              Aceste modele arată structura PDF-urilor. La generare, numele, detaliile și conținutul sunt adaptate alegerilor tale.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-3">
          {models.map((model) => {
            const Icon = model.icon;

            return (
              <article key={model.title} className="flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-brand-navy/10 bg-white shadow-xl">
                  <Image
                    src={model.image}
                    alt={`Model ${model.title}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-nunito text-2xl font-black text-brand-navy">{model.title}</h2>
                    <span className={`inline-flex shrink-0 items-center gap-2 font-black ${model.accent}`}>
                      <Icon size={19} /> {model.price}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-medium leading-relaxed text-brand-navy/65">{model.description}</p>
                  <Link
                    href={model.href}
                    className="mt-6 inline-flex items-center gap-2 font-black text-brand-purple transition-colors hover:text-brand-navy"
                  >
                    {model.cta} <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-24 border-y border-brand-navy/10 bg-white px-6 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-nunito text-3xl font-black text-brand-navy">Pachetul complet: 49 lei</p>
            <p className="mt-2 max-w-xl font-medium text-brand-navy/65">Povestea, Scutul Magic și Trusa de Urgență, fiecare adaptată pentru copilul tău.</p>
          </div>
          <Link
            href="/#creator"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-6 py-4 font-black text-white transition-colors hover:bg-brand-purple"
          >
            Începe cu o poveste <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
