import type { Metadata } from "next";
import { ArrowRight, Download, Mail, Printer } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Livrare Digitală | Povestea Mea Magică",
  description: "Cum primești PDF-urile personalizate Povestea Mea Magică.",
  alternates: { canonical: "/livrare-digitala" },
};

export default function DigitalDeliveryPage() {
  return <CommercialPage eyebrow="Livrare digitală" title="Materialul tău ajunge direct la tine, gata de folosit." description="Povestea Mea Magică livrează materiale digitale, nu produse fizice. Nu există costuri de transport și nu trebuie să aștepți curierul.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl grid border-y border-brand-navy/15 md:grid-cols-3">{[{icon:Download,title:"Descărcare simplă",text:"După generare, verifici fiecare material și descarci PDF-ul direct din browser."},{icon:Mail,title:"Linkul ajunge pe email",text:"După confirmarea plății pregătim materialul. Când este gata, primești linkul personal, valabil 30 de zile. Salvează PDF-urile în acest interval."},{icon:Printer,title:"A4 sau A5 orizontal",text:"Atelierul și Dosarul sunt A4, cu diploma Atelierului în format orizontal. Povestea Magică și caietul ei de activități sunt pregătite în format A5 orizontal."}].map(({icon:Icon,title,text},index)=><article key={title} className="min-h-64 border-b border-brand-navy/15 px-0 py-9 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><Icon size={29} className="text-brand-purple"/><h2 className="mt-8 font-serif text-3xl text-brand-navy">{title}</h2><p className="mt-4 text-base font-medium leading-relaxed text-brand-navy/70">{text}</p><p className="mt-7 font-mono text-sm font-black text-brand-gold">0{index+1}</p></article>)}</div><div className="mx-auto mt-14 max-w-5xl border-y border-brand-navy/15 px-0 py-8"><h2 className="font-serif text-3xl text-brand-navy">Dacă ceva nu ajunge</h2><p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-brand-navy/70">Verifică mai întâi Spam și Promoții și pagina de confirmare a comenzii. Dacă materialul lipsește sau nu se deschide, scrie-ne de la adresa comenzii, cu numărul ei ori data aproximativă. Nu plasa încă o comandă pentru a primi din nou emailul.</p><a href={supportMailto("Ajutor livrare PDF - Povestea Mea Magică")} className="mt-6 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Contactează suportul <ArrowRight size={16}/></a></div></section>
  </CommercialPage>;
}
