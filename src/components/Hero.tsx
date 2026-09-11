import Image from "next/image";
import { ArrowRight } from "lucide-react";
export default function Hero() {
  return (
    <section id="home-hero" className="home-editorial-hero">
      <Image
        src="/examples/album/hero-cinematic.webp"
        alt="Eva și steluța ei, pe poteca luminoasă din poveste"
        fill
        priority
        fetchPriority="high"
        quality={85}
        sizes="(max-width:700px) 1500px, 100vw"
        className="home-editorial-art"
      />
      <div className="home-editorial-copy">
        <p>Povești. Curaj. Descoperiri.</p>
        <h1>Povestea Mea Magică</h1>
        <p>
          O lume întreagă, cu copilul tău în centru.
          <br className="hidden sm:block" /> O poveste de citit și de păstrat împreună.
        </p>
        <p className="hero-format">Carte digitală personalizată · PDF + audio</p>
        <a
          href="/povestea-magica#configureaza-albumul"
          className="editorial-button"
        >
          Creează Povestea Magică <ArrowRight size={18} />
        </a>
        <a href="#album-sample-title" className="home-editorial-browse">
          Răsfoiește povestea
        </a>
      </div>
    </section>
  );
}
