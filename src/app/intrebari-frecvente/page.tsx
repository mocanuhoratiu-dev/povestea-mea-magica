import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { faqGroups } from "@/lib/faq";
import FaqAnchor from "@/components/FaqAnchor";

export const metadata: Metadata = {
  title: "Întrebări frecvente | Povestea Mea Magică",
  description: "Tot ce vrei să știi despre mostre, personalizare, plată, livrare și fotografii.",
  alternates: { canonical: "/intrebari-frecvente" },
};

export default function FaqPage() {
  return <CommercialPage eyebrow="Întrebări frecvente" title="Mai întâi, răspunsurile." description="Despre prima mostră, comanda ta și felul în care avem grijă de detaliile voastre.">
    <FaqAnchor />
    <div className="support-layout">
      <nav className="support-links" aria-label="Subiecte de ajutor"><p className="support-eyebrow">Ce vrei să afli?</p>{faqGroups.map(group => <a key={group.id} href={"#" + group.id}>{group.title}</a>)}<Link href="/contact">Ajutor cu o comandă <ArrowRight className="inline" size={15} /></Link></nav>
      <div>{faqGroups.map(group => <section className="support-group" id={group.id} key={group.id} aria-labelledby={group.id + "-title"}><h2 id={group.id + "-title"}>{group.title}</h2>{group.questions.map(item => <details className="support-faq" id={item.id} key={item.id}><summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</section>)}
        <div className="support-contact"><h2>Mai povestim?</h2><p>Dacă răspunsul tău nu este aici, ne poți scrie direct.</p><Link href="/contact" className="editorial-button">Contactează echipa <ArrowRight size={16} /></Link></div>
      </div>
    </div>
  </CommercialPage>;
}
