import Link from "next/link";
import { BadgeCheck, Eye, LockKeyhole, ShieldCheck } from "lucide-react";

const promises = [
  {
    icon: BadgeCheck,
    title: "Verificare înainte de livrare",
    text: "Textul, ilustrațiile, continuitatea personajului și așezarea în pagină trec prin verificări automate înainte să primești cartea.",
  },
  {
    icon: Eye,
    title: "Vezi înainte să plătești",
    text: "Pentru Povestea Magică primești o previzualizare personalizată cu coperta și două pagini interioare. Poți reveni asupra alegerilor tale.",
  },
  {
    icon: LockKeyhole,
    title: "Date folosite doar pentru comandă",
    text: "Cerem numai detaliile necesare personalizării. Fotografia este opțională, iar informațiile copilului nu sunt folosite pentru publicitate.",
  },
  {
    icon: ShieldCheck,
    title: "Creat pentru familie",
    text: "Conținutul evită teme nepotrivite vârstei și păstrează un ton cald, blând și ușor de citit împreună.",
  },
];

export default function QualityTrust() {
  return (
    <section className="bg-brand-navy px-5 py-16 text-brand-cream sm:px-6 md:py-24" aria-labelledby="quality-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-brand-cream/15 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Calitate și grijă, nu doar tehnologie</p>
            <h2 id="quality-title" className="mt-4 font-nunito text-4xl font-black leading-tight sm:text-5xl">O poveste frumoasă trebuie să fie și una în care ai încredere.</h2>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-base font-semibold leading-relaxed text-brand-cream/70 sm:text-lg">Fiecare etapă este construită în jurul unui principiu simplu: părintele păstrează controlul, iar copilul rămâne în siguranță.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-black">
              <Link href="/politica-de-confidentialitate" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Confidențialitate</Link>
              <Link href="/siguranta-ai" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Siguranța datelor</Link>
              <Link href="/termeni-si-conditii" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Termeni</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid border-y border-brand-cream/15 md:grid-cols-2 xl:grid-cols-4">
          {promises.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border-b border-brand-cream/15 px-0 py-8 md:px-7 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                <Icon size={27} strokeWidth={1.7} className="text-brand-gold" />
                <h3 className="mt-7 font-serif text-2xl leading-tight text-brand-cream">{item.title}</h3>
                <p className="mt-4 text-sm font-semibold leading-relaxed text-brand-cream/65">{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
