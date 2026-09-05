import Image from "next/image";
import { BookOpen, Headphones, Printer } from "lucide-react";

const items = [
  {
    icon: BookOpen,
    eyebrow: "Cartea ilustrată",
    title: "16 pagini construite editorial",
    text: "Copertă, dedicație și 13 scene distincte, așezate într-un format A5 orizontal.",
    visual: "book",
  },
  {
    icon: Headphones,
    eyebrow: "Poveste de ascultat",
    title: "Audio în limba română",
    text: "Povestea poate fi răsfoită și ascultată direct de pe telefon, tabletă sau computer.",
    visual: "phone",
  },
  {
    icon: Printer,
    eyebrow: "Activități incluse",
    title: "Un caiet separat, gata de print",
    text: "Colorat, labirint și găsește diferențele, fără să fie nevoie să scrieți în carte.",
    visual: "print",
  },
] as const;

function ProductVisual({ visual }: { visual: (typeof items)[number]["visual"] }) {
  if (visual === "book") {
    return (
      <div className="relative mx-auto aspect-[1.18] w-[92%] [perspective:1200px]">
        <div className="absolute inset-[8%_3%_5%_8%] bg-brand-navy/22 blur-xl" />
        <div className="absolute inset-[2%_7%_8%_5%] origin-left overflow-hidden border border-brand-gold/70 bg-brand-navy shadow-[18px_20px_38px_rgba(6,15,34,.34)] [transform:rotateY(-9deg)_rotateZ(-1deg)]">
          <Image src="/examples/album/coperta.webp" alt="Povestea Magică prezentată ca o carte ilustrată" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
        </div>
        <span className="absolute bottom-[7%] left-[3%] top-[5%] w-[3.5%] bg-gradient-to-r from-brand-gold/80 via-brand-cream to-brand-gold/55 shadow-lg" aria-hidden="true" />
      </div>
    );
  }

  if (visual === "phone") {
    return (
      <div className="relative mx-auto aspect-[1.18] w-[92%]">
        <div className="absolute left-[8%] top-[12%] h-[72%] w-[58%] rotate-[-5deg] overflow-hidden border-[8px] border-brand-cream bg-brand-navy shadow-[0_18px_45px_rgba(6,15,34,.32)]">
          <Image src="/examples/album/flipbook/page-06.webp" alt="Pagină ilustrată redată pe telefon" fill sizes="26vw" className="object-cover" />
        </div>
        <div className="absolute bottom-[5%] right-[7%] h-[82%] w-[42%] overflow-hidden rounded-[24px] border-[7px] border-brand-navy bg-brand-navy shadow-[0_18px_45px_rgba(6,15,34,.38)]">
          <Image src="/examples/album/flipbook/page-01.webp" alt="Coperta poveștii pe telefon" fill sizes="18vw" className="object-cover" />
          <div className="absolute inset-x-4 bottom-4 bg-brand-cream/95 px-3 py-3 text-brand-navy shadow-xl backdrop-blur-sm">
            <span className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.08em]"><Headphones size={14} /> Ascultă povestea</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[1.18] w-[92%]">
      <div className="absolute inset-[8%_4%_4%_12%] rotate-3 bg-brand-navy/18 shadow-[0_18px_40px_rgba(6,15,34,.25)]" />
      <div className="absolute inset-[2%_11%_10%_3%] -rotate-2 overflow-hidden border-[7px] border-white bg-white shadow-[0_20px_48px_rgba(6,15,34,.28)]">
        <Image src="/examples/album/colorat.webp" alt="Exemplu de pagină printată pentru colorat" fill sizes="28vw" className="object-cover" />
      </div>
      <div className="absolute bottom-[2%] right-[2%] h-[46%] w-[47%] rotate-3 overflow-hidden border-[6px] border-white bg-white shadow-[0_16px_34px_rgba(6,15,34,.3)]">
        <Image src="/examples/album/labirint.webp" alt="Exemplu de labirint inclus în caiet" fill sizes="20vw" className="object-cover" />
      </div>
    </div>
  );
}

export default function AlbumProductGallery() {
  return (
    <section className="bg-[#edf2ee] px-5 py-16 sm:px-6 md:py-24" aria-labelledby="album-product-gallery-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-brand-navy/15 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Ce ajunge la voi</p>
            <h2 id="album-product-gallery-title" className="mt-4 font-serif text-4xl leading-tight text-brand-navy sm:text-5xl">O experiență completă, nu doar un PDF.</h2>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">Povestea, imaginile, vocea și activitățile sunt create ca părți ale aceluiași produs, apoi livrate împreună pe email.</p>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden border border-brand-navy/12 bg-brand-navy/12 lg:grid-cols-3">
          {items.map(({ icon: Icon, eyebrow, title, text, visual }) => (
            <article key={title} className="flex min-h-[520px] flex-col bg-brand-cream px-5 pb-8 pt-6 sm:px-7">
              <ProductVisual visual={visual} />
              <div className="mt-auto border-t border-brand-navy/12 pt-6">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-purple"><Icon size={16} /> {eyebrow}</p>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-brand-navy">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/65">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
