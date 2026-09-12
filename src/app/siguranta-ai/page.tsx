import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, Eye, HeartHandshake, ArrowRight } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = { title: "Siguranță și confidențialitate | Povestea Mea Magică", description: "Fotografie opțională, linkuri private și alegeri pe care le confirmi tu. Află cum sunt pregătite materialele.", alternates: { canonical: "/siguranta-ai" } };

const sections = [
  { id: "alegerile-tale", title: "Tu alegi ce ne povestești.", text: "Pornim de la prenume, vârstă, preferințe și detaliile pe care vrei să le regăsești în material. Nu avem nevoie de adresa copilului, informații medicale sau alte date sensibile.", extra: "Fotografia este opțională pentru toate cele trei produse. Poți începe numai cu o descriere. Dacă alegi o fotografie, trebuie să ai dreptul și acordul necesar pentru folosirea ei." },
  { id: "verificari", title: "Imaginație, cu verificări.", text: "Folosim modele AI și tehnologie proprie pentru a construi textul, ilustrațiile și așezarea în pagină. Aplicăm verificări automate pentru conținut, coerența personajului și lizibilitate.", extra: "Aceste verificări reduc riscurile, dar nu garantează un rezultat perfect. Citește materialul înainte de a-l folosi cu copilul. Dacă observi o problemă, scrie-ne: o analizăm împreună." },
  { id: "lumi", title: "Lumi te însoțește. Tu confirmi.", text: "Lumi, păzitoarea lanternei, te ajută să aduni detaliile poveștii. Poți reveni asupra răspunsurilor sau poți completa singur configuratorul.", extra: "Înainte de plată, Povestea Magică are o mostră cu coperta și două pagini personalizate. Pentru Atelier și Dosar, coperta orientativă arată stilul și numele; ilustrațiile personalizate sunt create după plată." },
  { id: "date-private", title: "Detalii personale, acces privat.", text: "Fotografiile de referință și materialele comenzii sunt stocate privat. Fotografia originală nu este inclusă în carte și nu este transmisă procesatorului de plăți. Nu folosim detaliile copilului pentru publicitate.", extra: "Linkul mostrei este valabil 24 de ore, iar linkul de livrare 30 de zile. Termenele de păstrare și ștergere sunt explicate în politica de confidențialitate. Salvează PDF-urile pe dispozitivul tău înainte de expirarea linkului." },
  { id: "impreuna", title: "Joacă, nu tratament.", text: "Atelierul și celelalte materiale sunt experiențe creative pentru familie. Nu confirmă existența unui pericol imaginar și nu promit să trateze o teamă.", extra: "Adultul rămâne alături de copil și alege ce i se potrivește. Materialele nu înlocuiesc sprijinul unui specialist." },
];

export default function AiSafetyPage() {
  return <CommercialPage eyebrow="Grijă pentru detaliile voastre" title="O lume inventată. Grijă reală." description="Ce ne spui, ce verificăm și ce rămâne în controlul tău. Fără promisiuni de perfecțiune.">
    <div className="support-layout"><nav className="support-links" aria-label="Pe această pagină">{sections.map(s => <a key={s.id} href={"#" + s.id}>{s.title}</a>)}<Link href="/politica-de-confidentialitate">Politica de confidențialitate</Link></nav><div>
      <div className="trust-summary"><span><Eye size={18} /> Fotografie opțională</span><span><LockKeyhole size={18} /> Linkuri private</span><span><HeartHandshake size={18} /> Alegeri confirmate de tine</span></div>
      {sections.map(s => <section className="trust-article" id={s.id} key={s.id}><h2>{s.title}</h2><p>{s.text}</p><p>{s.extra}</p></section>)}
      <div className="support-contact"><p>Ai o întrebare despre date sau despre un material?</p><Link href="/contact" className="editorial-button">Vorbește cu echipa <ArrowRight size={16} /></Link><p className="mt-6 text-sm">Actualizat la 11 septembrie 2026</p></div>
    </div></div>
  </CommercialPage>;
}
