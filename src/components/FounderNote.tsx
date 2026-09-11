import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";

export default function FounderNote() {
  return <section className="brand-founder" aria-labelledby="founder-note-title"><div className="brand-founder-inner">
    <div><p className="eyebrow">Din familia noastră, pentru familia voastră</p><h2 id="founder-note-title" className="sr-only">Povestea noastră</h2><blockquote>„Despre ce povestim astăzi?”</blockquote><p className="founder-byline">Horațiu · tată și fondator</p></div>
    <div><p>Așa începe o poveste la noi acasă. Fetele mele aleg lumea, personajele sau un obiect drag. Eu ascult. Din serile acestea s-a născut Povestea Mea Magică.</p><Link href="/despre">Citește povestea noastră <ArrowRight size={17} /></Link><div className="brand-founder-mark mt-6"><BrandMark className="h-9 w-9" /><span className="text-sm text-brand-navy/70">Un proiect pornit din timpul petrecut împreună.</span></div></div>
  </div></section>;
}
