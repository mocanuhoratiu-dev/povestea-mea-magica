import { Printer } from "lucide-react";

export default function PrintedEditionNotice({ product }: { product: "monster" | "emergency" }) {
  return <section className="border-y border-brand-navy/15 bg-white px-6 py-8 text-brand-navy">
    <div className="mx-auto flex max-w-5xl items-start gap-4">
      <Printer className="mt-1 shrink-0" size={24} aria-hidden="true" />
      <div><h2 className="font-serif text-xl">În curând, și în mâinile voastre</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">{product === "monster" ? "Pregătim o ediție tipărită a Atelierului, cu diplomă, etichete și materialele ritualului de seară." : "Pregătim un caiet tipărit cu activități și cartonașe pentru micii exploratori."} Până atunci, primești PDF-urile digitale, pe care le poți imprima acasă. Ediția tipărită nu este inclusă în prețul afișat.</p>
      </div>
    </div>
  </section>;
}
