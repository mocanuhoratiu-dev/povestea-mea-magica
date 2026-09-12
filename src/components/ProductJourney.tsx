"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const journeys = [
  { id: "album", label: "Povestea Magică", path: "/povestea-magica#configureaza-albumul", action: "Creează povestea", steps: [
    { title: "Ne povestești despre copil", text: "Prenumele, vârsta, lumea și un detaliu drag. Completezi singur sau cu Lumi; fotografia este opțională.", image: "/brand/how-album.webp", alt: "Configuratorul Povestea Magică, înainte de introducerea detaliilor" },
    { title: "Vezi, apoi alegi", text: "Primești o mostră cu coperta și două pagini personalizate. Confirmi varianta dorită înainte de plată.", image: "/examples/album/collection/coperta.webp", alt: "Coperta Evei din modelul public, exemplu de prezentare" },
    { title: "Primești și păstrezi", text: "După plată pregătim cartea completă și caietul. Îți trimitem pe email linkul de acces, valabil 30 de zile.", image: "/examples/album/collection/colorat.webp", alt: "Pagina de colorat din caietul demonstrativ" },
  ] },
  { id: "atelier", label: "Atelierul Scutului Magic", path: "/scutul-de-noapte#creator", action: "Descoperă Atelierul", steps: [
    { title: "Pornim de la seara voastră", text: "Ne spui ce îl neliniștește și ce îi este familiar. Nu cerem fotografie; poți descrie aspectul copilului.", image: "/brand/how-atelier.webp", alt: "Formularul Atelierului, cu detaliile pentru copil" },
    { title: "Vezi coperta orientativă", text: "Numele apare în modelul de copertă. Acesta arată stilul; povestea și cele două ilustrații personale sunt create după plată.", image: "/examples/kits-v2/atelier-cover.webp", alt: "Ilustrația din coperta demonstrativă a Atelierului" },
    { title: "Construiți ritualul", text: "Primești 13 pagini și audio cu Lumi: poveste, jocuri de seară, apoi diploma, rețeta și etichetele la final. Le salvezi și le imprimi când aveți nevoie.", image: "/examples/kits-v2/atelier-room.webp", alt: "Scenă ilustrată din modelul public al Atelierului" },
  ] },
  { id: "explorator", label: "Dosarul Micului Explorator", path: "/trusa-de-rabdare#creator", action: "Descoperă Dosarul", steps: [
    { title: "Alegeți următoarea oprire", text: "Restaurant, drum sau o altă așteptare. Alegi vârsta, timpul disponibil și interesele copilului.", image: "/brand/how-explorator.webp", alt: "Formularul Dosarului Micului Explorator" },
    { title: "Verifici numele și alegerile", text: "Vezi o copertă orientativă cu numele copilului. După plată creăm aventura și ilustrațiile din detaliile confirmate.", image: "/examples/kits-v2/explorer-cover.webp", alt: "Ilustrația din coperta demonstrativă a Dosarului" },
    { title: "Luați aventura cu voi", text: "Primești pe email cele 10 pagini. Descarci, imprimi și alegi misiunile potrivite momentului: observație, logică, desen și joacă împreună.", image: "/examples/kits-v2/explorer-town.webp", alt: "Orașul miniatural din modelul public al Exploratorului" },
  ] },
] as const;

export default function ProductJourney() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const journey = journeys[active];
  return <section className="journey-section">
    <div className="journey-tabs" role="tablist" aria-label="Cum funcționează fiecare produs">{journeys.map((item, index) => <button key={item.id} id={"tab-" + item.id} ref={node => { tabs.current[index] = node; }} role="tab" aria-selected={index === active} aria-controls={"journey-" + item.id} tabIndex={index === active ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (active + (event.key === "ArrowRight" ? 1 : 2)) % 3;
      setActive(next); tabs.current[next]?.focus();
    }}>{item.label}</button>)}</div>
    <div role="tabpanel" id={"journey-" + journey.id} aria-labelledby={"tab-" + journey.id} tabIndex={0}>
      <div className="journey-steps">{journey.steps.map((step, i) => <article key={step.title}><figure><Image src={step.image} alt={step.alt} fill sizes="(max-width:700px) 90vw, 340px" /></figure><p className="step-label">0{i + 1}</p><h2>{step.title}</h2><p>{step.text}</p></article>)}</div>
      <div className="journey-action"><p>Imaginile sunt exemple din site și din modelele publice. Comanda ta pornește din alegerile voastre.</p><Link href={journey.path.split("#")[0]} className="editorial-button">{journey.action}<ArrowRight size={16} /></Link></div>
    </div>
  </section>;
}
