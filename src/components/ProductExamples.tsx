"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import { MobileProductId, openMobileProduct } from "@/lib/mobileProductFlow";

const examples: Array<{
  id: MobileProductId;
  moment: string;
  title: string;
  image: string;
  description: string;
  features: string[];
  price: string;
  href: string;
  cta: string;
  icon: typeof BookOpen;
  accent: string;
  accentText: string;
}> = [
  {
    id: "story",
    moment: "Pentru seară",
    title: "Povestea de Seară",
    image: "/examples/poveste-contact.png",
    description: "O aventură în care copilul tău este eroul. Alege o seară mai rapidă sau o variantă pentru citit pe îndelete.",
    features: ["Copertă ilustrată", "Dedicație de la familie", "Scurtă: 2 pagini · Lungă: 4"],
    price: "de la 19 lei",
    href: "#creator",
    cta: "Creează povestea",
    icon: BookOpen,
    accent: "bg-brand-purple",
    accentText: "text-brand-purple",
  },
  {
    id: "monster",
    moment: "Pentru noapte",
    title: "Scutul de Noapte",
    image: "/examples/scut-contact.png",
    description: "Un ritual blând pentru nopțile cu emoții, făcut din pași mici pe care îi puteți repeta împreună.",
    features: ["Certificat personalizat", "Ritual de seară", "Etichete pentru flacon"],
    price: "19 lei",
    href: "#monster-away",
    cta: "Creează scutul",
    icon: ShieldCheck,
    accent: "bg-brand-gold",
    accentText: "text-brand-navy",
  },
  {
    id: "emergency",
    moment: "Pentru așteptare",
    title: "Trusa de Răbdare",
    image: "/examples/trusa-contact.png",
    description: "Misiuni pentru drum, restaurant, medic sau orice moment în care timpul pare să treacă mai greu.",
    features: ["Activități pentru locul ales", "Misiuni de răbdare", "Diplomă de final"],
    price: "19 lei",
    href: "#emergency-kit",
    cta: "Pregătește trusa",
    icon: TimerReset,
    accent: "bg-brand-orange",
    accentText: "text-brand-orange",
  },
];

export default function ProductExamples() {
  return (
    <section id="alege-materialul" className="scroll-mt-16 bg-brand-cream px-5 py-14 sm:px-6 md:scroll-mt-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-brand-navy/15 pb-7 text-center md:hidden">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Alege un moment</p>
          <h2 className="mt-3 font-nunito text-3xl font-black leading-tight text-brand-navy">De ce aveți nevoie acum?</h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/65">Alege un material și configurăm doar ce vă este util.</p>
        </div>

        <div className="md:hidden">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <a
                key={example.id}
                href={example.href}
                onClick={(event) => {
                  event.preventDefault();
                  openMobileProduct(example.id);
                }}
                className="group flex items-center gap-4 border-b border-brand-navy/12 py-5 text-left"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center text-white ${example.accent}`}><Icon size={21} /></span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[10px] font-black uppercase tracking-[0.14em] ${example.accentText}`}>{example.moment}</span>
                  <span className="mt-1 block font-serif text-xl leading-tight text-brand-navy">{example.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-relaxed text-brand-navy/60">{example.description}</span>
                  <span className="mt-2 block text-sm font-black text-brand-navy">{example.price}</span>
                </span>
                <ArrowRight size={19} className="shrink-0 text-brand-navy/45 transition-transform group-hover:translate-x-1" />
              </a>
            );
          })}
          <a href="/modele" className="mt-6 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">
            Răsfoiește modelele <ArrowRight size={16} />
          </a>
        </div>

        <div className="hidden md:grid md:gap-6 md:border-b md:border-brand-navy/15 md:pb-9 md:text-center lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8 lg:pb-12 lg:text-left">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Alege un moment</p>
            <h2 className="mt-4 max-w-3xl font-nunito text-4xl font-black leading-tight text-brand-navy md:text-5xl">Ce v-ar ajuta chiar acum?</h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Fiecare material pornește de la o situație reală de familie și devine ceva ce puteți citi, folosi sau păstra.</p>
          </div>
          <a href="/modele" className="mx-auto inline-flex w-fit items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy lg:mx-0">
            Vezi toate modelele <ArrowRight size={16} />
          </a>
        </div>

        <div className="mt-10 hidden grid-cols-1 gap-6 md:grid lg:mt-12 lg:grid-cols-3">
          {examples.map((example, index) => (
            <motion.article
              key={example.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex min-h-full flex-col overflow-hidden border border-brand-navy/12 bg-white shadow-[0_12px_30px_rgba(36,50,79,0.08)]"
            >
              <div className={`h-1 ${example.accent}`} />
              <div className="relative aspect-[4/3] border-b border-brand-navy/10 bg-brand-navy/5 p-3">
                <Image src={example.image} alt={`Model al produsului ${example.title}`} fill sizes="33vw" className="object-cover" />
              </div>
              <div className="flex h-full flex-col p-7">
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${example.accentText}`}><example.icon size={17} /> {example.moment}</div>
                <h3 className="mt-4 font-serif text-3xl leading-tight text-brand-navy">{example.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-brand-navy/70">{example.description}</p>
                <ul className="mt-6 space-y-2 border-t border-brand-navy/10 pt-5 text-sm font-bold text-brand-navy/75">
                  {example.features.map((feature) => <li key={feature} className="flex gap-2"><span className={example.accentText}>✦</span>{feature}</li>)}
                </ul>
                <a href="/modele" className="mt-5 inline-flex w-fit items-center gap-2 border-b border-brand-navy/20 pb-1 text-sm font-black text-brand-navy/70 transition-colors hover:border-brand-purple hover:text-brand-purple">Răsfoiește pagini din model <ArrowRight size={15} /></a>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div><p className="font-nunito text-3xl font-black text-brand-navy">{example.price}</p><p className="text-xs font-bold text-brand-navy/50">preț de lansare comercială</p></div>
                  <a href={example.href} className="inline-flex items-center gap-2 bg-brand-navy px-4 py-3 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">{example.cta} <ArrowRight size={16} /></a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
