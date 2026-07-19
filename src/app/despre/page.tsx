import type { Metadata } from "next";
import { ArrowRight, BookOpen, HeartHandshake, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Despre | Povestea Mea Magică",
  description: "De ce există Povestea Mea Magică și cum sunt construite materialele pentru familii.",
};

const principles = [
  { title: "Pornim de la un moment real", text: "Seara, frica de noapte sau timpul de așteptare sunt contexte pe care le recunoaște orice familie. Fiecare material începe de aici, nu de la o idee generică.", icon: HeartHandshake },
  { title: "Personalizarea are un rol", text: "Numele, vârsta, lumea, interesul copilului și ritualurile familiei nu sunt doar decor. Ele schimbă structura, vocabularul și activitățile din material.", icon: BookOpen },
  { title: "Adultul rămâne ghidul", text: "Materialele sunt pentru citit, printat și folosit împreună. Nu înlocuiesc sfatul medical, psihologic sau sprijinul unui specialist.", icon: ShieldCheck },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-cream pb-24 pt-32">
      <section className="px-6">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-brand-navy/15 pb-16 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <BrandMark className="h-14 w-14" title="Lanterna Magică" />
            <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Despre Povestea Mea Magică</p>
            <h1 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">Poveștile în care copilul se recunoaște rămân cel mai aproape de inimă.</h1>
          </div>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Povestea Mea Magică este un loc pentru familiile care vor să transforme o seară, un drum lung sau o emoție dificilă într-un moment de apropiere.</p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">De unde a pornit</p>
            <p className="mt-5 font-serif text-3xl leading-tight text-brand-navy md:text-4xl">„Despre ce povestim astăzi?”</p>
          </div>
          <div className="space-y-6 text-lg font-medium leading-relaxed text-brand-navy/70">
            <p>Sunt Horațiu și cred că, oricât de multe cărți am avea în bibliotecă, cele care rămân cel mai aproape de inimă sunt cele în care copilul se recunoaște.</p>
            <p>Acasă, obișnuiesc să le întreb pe fetele mele despre ce povestim astăzi. Uneori aleg o lume nouă, alteori un personaj curajos, o seară liniștită sau o mică aventură care să facă așteptarea mai ușoară. Din răspunsurile lor, din întrebările lor și din bucuria de a inventa împreună s-a născut Povestea Mea Magică.</p>
            <p>Am creat acest loc pentru părinții care vor mai mult decât un PDF frumos: cuvinte potrivite, imaginație și un mic spațiu în care familia lor să fie personajul principal.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Cum lucrăm</p>
          <div className="mt-10 grid border-y border-brand-navy/15 md:grid-cols-3">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="min-h-[290px] border-brand-navy/15 py-8 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
                  <Icon className="text-brand-purple" size={30} strokeWidth={1.8} />
                  <h2 className="mt-10 font-serif text-3xl leading-tight text-brand-navy">{principle.title}</h2>
                  <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-brand-navy/70">{principle.text}</p>
                  <span className="mt-6 block font-mono text-sm font-black text-brand-gold">0{index + 1}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Ce primești acum</p>
            <h2 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy">Un material pentru folosit împreună, nu un fișier uitat într-un folder.</h2>
          </div>
          <div className="space-y-7 text-lg font-medium leading-relaxed text-brand-navy/70">
            <p>Fiecare produs are o structură proprie: povestea are o aventură și o dedicație, Scutul de Noapte are un ritual simbolic, iar Trusa de Răbdare are activități legate de contextul ales.</p>
            <p>Poți vedea exemplele înainte de a începe și poți ajusta povestea înainte de descărcarea PDF-ului. Nu cerem fotografii pentru personalizare, iar materialele generate nu sunt păstrate într-o bibliotecă de conturi.</p>
            <p>Păstrăm promisiunea simplă: conținut cald, clar și potrivit pentru timpul petrecut în familie.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 border-y border-brand-navy/15 py-12 md:flex-row md:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Vrem să învățăm din folosire reală</p><h2 className="mt-4 font-serif text-4xl leading-tight text-brand-navy">Ai o idee după ce ați folosit un material?</h2></div>
          <a href="mailto:horatiu@zenithcustomersuccess.com?subject=Recenzie%20beta%20-%20Povestea%20Mea%20Magic%C4%83&body=Am%20folosit%20Povestea%20Mea%20Magic%C4%83%20%C3%AEn%20beta%20%C8%99i%20vreau%20s%C4%83%20las%20o%20recenzie.%0A%0ACe%20ne-a%20pl%C4%83cut%3A%0A%0ACe%20am%20%C3%AEmbun%C4%83t%C4%83%C8%9Bi%3A%0A%0ASunte%C8%9Bi%20de%20acord%20s%C4%83%20public%C4%83m%20un%20scurt%20fragment%20anonim%3F%20Da%20%2F%20Nu%3A" className="inline-flex items-center gap-2 bg-brand-navy px-6 py-4 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Lasă o recenzie de beta <ArrowRight size={17} /></a>
        </div>
      </section>
    </main>
  );
}
