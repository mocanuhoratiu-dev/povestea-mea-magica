import type { Metadata } from "next";
import { Mail, MessageSquareText } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { publicContact, supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Contact | Povestea Mea Magică",
  description: "Contactează echipa Povestea Mea Magică pentru ajutor, feedback sau întrebări despre materiale.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <CommercialPage eyebrow="Contact" title="Ai o întrebare? Suntem aici." description="Scrie-ne pentru ajutor la un PDF, feedback despre produse sau o întrebare legată de accesul beta.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto grid max-w-5xl border-y border-brand-navy/15 md:grid-cols-2"><div className="border-b border-brand-navy/15 py-10 md:border-b-0 md:border-r md:pr-12"><Mail className="text-brand-purple" size={30}/><h2 className="mt-7 font-serif text-3xl text-brand-navy">Suport pentru materiale</h2><p className="mt-4 text-base font-medium leading-relaxed text-brand-navy/70">Pentru descărcare, email, conținut sau acces, scrie-ne direct. Include produsul și ce s-a întâmplat, fără detalii sensibile despre copil.</p><a href={supportMailto("Mesaj pentru Povestea Mea Magică")} className="mt-7 inline-flex bg-brand-navy px-5 py-3 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">{publicContact.email}</a></div><div className="py-10 md:pl-12"><MessageSquareText className="text-brand-purple" size={30}/><h2 className="mt-7 font-serif text-3xl text-brand-navy">Feedback de beta</h2><p className="mt-4 text-base font-medium leading-relaxed text-brand-navy/70">Învățăm din felul în care familiile folosesc produsele. Spune-ne ce a funcționat și ce ai schimba.</p><a href={`mailto:${publicContact.betaFeedbackEmail}?subject=${encodeURIComponent("Feedback beta - Povestea Mea Magică")}`} className="mt-7 inline-flex border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Trimite feedback</a></div></div></section>
  </CommercialPage>;
}
