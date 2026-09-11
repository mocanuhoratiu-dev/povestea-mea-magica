import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, FileQuestion, MessageCircle } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { legalOperator, publicContact, supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = { title: "Ajutor și contact | Povestea Mea Magică", description: "Ajutor cu o comandă, emailul de livrare sau prima poveste personalizată.", alternates: { canonical: "/contact" } };

const topics = [
  { title: "Nu am primit comanda", icon: Mail, text: "Verifică Spam și Promoții, apoi pagina de confirmare a comenzii. Dacă emailul nu apare, te ajutăm să găsești materialele. Nu este nevoie de o nouă comandă.", subject: "Ajutor: nu am primit comanda", label: "Cere ajutor pentru livrare" },
  { title: "Nu pot deschide materialul", icon: FileQuestion, text: "Spune-ne ce se întâmplă când deschizi linkul sau PDF-ul. Linkul de livrare este valabil 30 de zile; fișierele descărcate rămân la tine.", subject: "Ajutor: nu pot deschide materialul", label: "Cere ajutor pentru acces" },
  { title: "Am o întrebare", icon: MessageCircle, text: "Despre alegerea unui material, personalizare sau felul în care îl folosiți împreună. Primim cu drag și ideile sau impresiile voastre.", subject: "O întrebare pentru Povestea Mea Magică", label: "Scrie echipei" },
];

export default function ContactPage() {
  return <CommercialPage eyebrow="Suntem aici" title="Povestea continuă. Și când ai nevoie de ajutor." description="O comandă de găsit, o întrebare mică sau o idee de împărtășit. Alege de unde începem.">
    <section className="help-options" aria-label="Alege subiectul mesajului">{topics.map(topic => <article key={topic.title}><topic.icon size={28} strokeWidth={1.5} /><h2>{topic.title}</h2><p>{topic.text}</p><a href={supportMailto(topic.subject)}>{topic.label}<ArrowUpRight size={17} /></a></article>)}</section>
    <section className="help-direct"><p className="support-eyebrow">Direct, de la om la om</p><h2 className="text-2xl mb-4">Scrie-ne la <a href={supportMailto("Mesaj pentru Povestea Mea Magică")}>{publicContact.email}</a></h2><p>Pentru o comandă, scrie de la adresa folosită la cumpărare și include numărul comenzii sau data aproximativă. Nu trimite fotografii ale copilului, informații medicale sau date de card.</p><p className="mt-4"><Link href="/intrebari-frecvente">Vezi întrebările frecvente</Link></p><p className="mt-6 text-sm">Operator: {legalOperator.name}, CUI {legalOperator.cui}, nr. Registrul Comerțului {legalOperator.tradeRegisterNumber}, sediul social: {legalOperator.registeredOffice}.</p></section>
  </CommercialPage>;
}
