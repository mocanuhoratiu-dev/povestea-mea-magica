import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { publicContact } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Povestea noastră | Povestea Mea Magică",
  description:
    "Din serile lui Horațiu cu fetele sale, o idee pentru timpul petrecut împreună.",
  alternates: { canonical: "/despre" },
  openGraph: {
    url: "/despre",
    title: "Povestea noastră | Povestea Mea Magică",
    description:
      "Din serile lui Horațiu cu fetele sale, o idee pentru timpul petrecut împreună.",
  },
};

const principles = [
  {
    title: "Pornim de la un moment real",
    text: "Seara, frica de noapte sau timpul de așteptare sunt contexte pe care le recunoaște orice familie. Povestea și jocurile pornesc din viața de zi cu zi a familiei.",
    icon: HeartHandshake,
  },
  {
    title: "Personalizarea are un rol",
    text: "Un rucsac drag, sora mai mare sau un loc preferat pot intra în poveste. Sunt detaliile în care copilul se recunoaște.",
    icon: BookOpen,
  },
  {
    title: "Adultul rămâne ghidul",
    text: "Materialele sunt pentru citit, printat și folosit împreună. Nu înlocuiesc sfatul medical, psihologic sau sprijinul unui specialist.",
    icon: ShieldCheck,
  },
];

export default function AboutPage() {
  return (
    <main className="editorial-index min-h-screen bg-brand-cream pt-24">
      <section className="founder-opening">
        <div>
          <p className="text-sm text-brand-purple">
            Din familia noastră, pentru familia voastră
          </p>
          <h1>„Despre ce povestim astăzi?”</h1>
          <p>
            Sunt Horațiu. Așa începe o poveste la noi acasă: cu o întrebare
            pentru fetele mele și cu bucuria de a inventa împreună.
          </p>
          <p className="founder-signature">Horațiu</p>
          <p className="text-sm">Tată și fondator, Povestea Mea Magică</p>
        </div>
        <figure>
          <Image
            src="/examples/album/collection/dedicatie.webp"
            alt="Dedicația pentru Eva din cartea demonstrativă"
            width={1260}
            height={888}
            sizes="(max-width:700px) 90vw, 40vw"
          />
          <figcaption>
            O dedicație, la începutul unei povești numai a ei. Din modelul
            nostru ilustrat.
          </figcaption>
        </figure>
      </section>
      <section className="founder-letter">
        <h2>De la serile noastre la poveștile voastre</h2>
        <p>
          Oricât de multe cărți am avea în bibliotecă, cele care le aprind cel
          mai mult imaginația sunt poveștile în care se regăsesc.
        </p>
        <p>
          Uneori, fetele aleg lumea. Alteori, un personaj, un obiect drag sau o
          aventură pe care vor să o trăiască împreună. Eu ascult. Și, din
          răspunsurile lor, povestea începe să prindă formă.
        </p>
        <p>
          Așa s-a născut Povestea Mea Magică. Am vrut să aduc bucuria aceasta și
          în alte familii: un copil care se recunoaște într-o pagină și un
          părinte care are un nou motiv să mai rămână puțin lângă el.
        </p>
        <p>
          De aici au venit și ritualurile pentru seară, și jocurile pentru
          timpul de așteptare. Nu căutăm să umplem timpul. Căutăm mici ocazii de
          a fi împreună.
        </p>
      </section>
      <section className="px-6">
        <div className="mx-auto max-w-6xl grid gap-8 border-y border-brand-navy/15 py-9 md:grid-cols-3">
          {principles.map((p) => (
            <article key={p.title}>
              <p.icon size={24} className="text-brand-purple" />
              <h2 className="mt-5 text-3xl">{p.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-brand-navy/75">
                {p.text}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="px-6">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl">Povestește-ne cum a fost la voi.</h2>
            <p className="mt-3 text-brand-navy/70">
              Citim fiecare mesaj și învățăm din experiențele voastre.
            </p>
          </div>
          <a
            href={`mailto:${publicContact.feedbackEmail}`}
            className="editorial-button"
          >
            Scrie-ne <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
