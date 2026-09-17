import Link from "next/link";
import { BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";

const promises = [
  {
    icon: BadgeCheck,
    title: "Verificare înainte de livrare",
    text: "Verificăm automat textul, ilustrațiile și așezarea în pagină înainte de livrare.",
  },
  {
    icon: LockKeyhole,
    title: "Date folosite doar pentru comandă",
    text: "Fotografia este opțională. Detaliile copilului nu sunt folosite pentru publicitate.",
  },
  {
    icon: ShieldCheck,
    title: "Creat pentru familie",
    text: "Un ton blând, potrivit vârstei, pentru citit și joacă împreună.",
  },
];

export default function QualityTrust() {
  return (
    <section className="quality-band bg-brand-navy px-5 py-16 text-brand-cream sm:px-6 md:py-24" aria-labelledby="quality-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-brand-cream/15 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Calitate și grijă, nu doar tehnologie</p>
            <h2 id="quality-title" className="mt-4 font-nunito text-4xl font-black leading-tight sm:text-5xl">Imaginație, cu grijă.</h2>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-base font-semibold leading-relaxed text-brand-cream/70 sm:text-lg">Ai o întrebare sau ceva nu este în regulă? Suntem aici să te ajutăm.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-black">
              <Link href="/politica-de-confidentialitate" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Confidențialitate</Link>
              <Link href="/siguranta-ai" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Cum avem grijă</Link>
              <Link href="/termeni-si-conditii" className="border-b border-brand-gold/60 pb-1 text-brand-gold transition-colors hover:text-brand-cream">Termeni</Link>
            </div>
          </div>
        </div>

        <div className="quality-points mt-10 grid border-y border-brand-cream/15 md:grid-cols-3">
          {promises.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border-b border-brand-cream/15 px-0 py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
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
