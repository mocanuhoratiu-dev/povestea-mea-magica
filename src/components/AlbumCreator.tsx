"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookHeart, Check, Clock3, Download, Mail, Palette, Printer, Sparkles } from "lucide-react";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { albumWorldFromLumi } from "@/lib/album/presentation";
import { albumCompanionOptions, albumLessonOptions, albumWorldOptions } from "@/lib/album/types";
import { beginOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";
import { commerce } from "@/lib/siteMode";

const steps = ["Copilul", "Aventura", "Mesajul vostru", "Confirmare"];
const colors = [
  { label: "Mov ametist", value: "mov ametist", swatch: "#8052a0" },
  { label: "Albastru ceresc", value: "albastru ceresc", swatch: "#5b93af" },
  { label: "Verde smarald", value: "verde smarald", swatch: "#5e967a" },
  { label: "Roz zmeură", value: "roz zmeură", swatch: "#d97786" },
  { label: "Galben solar", value: "galben solar", swatch: "#e5b84f" },
];

const inputClass = "mt-2 min-h-12 w-full border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15";
const labelClass = "block text-xs font-black uppercase tracking-[0.12em] text-brand-navy/60";
const albumDraftKey = "pmm-album-draft";

export default function AlbumCreator() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [hairStyle, setHairStyle] = useState("ondulat până la umeri");
  const [hairColor, setHairColor] = useState("șaten");
  const [skinTone, setSkinTone] = useState("deschisă");
  const [favoriteColor, setFavoriteColor] = useState(colors[0].value);
  const [world, setWorld] = useState<string>(albumWorldOptions[0].id);
  const [companion, setCompanion] = useState<string>(albumCompanionOptions[0]);
  const [lesson, setLesson] = useState<string>(albumLessonOptions[0]);
  const [personalDetail, setPersonalDetail] = useState("");
  const [dedication, setDedication] = useState("");
  const [dedicationFrom, setDedicationFrom] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const worldLabel = useMemo(() => albumWorldOptions.find((option) => option.id === world)?.label || "Lume magică", [world]);
  const canContinue = step === 0 ? Boolean(name.trim() && age && hairStyle && hairColor && skinTone) : true;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = window.sessionStorage.getItem(albumDraftKey);
        if (stored) {
          const draft = JSON.parse(stored) as Record<string, unknown>;
          if (typeof draft.name === "string") setName(draft.name.slice(0, 40));
          if (typeof draft.age === "string") setAge(draft.age);
          if (typeof draft.hairStyle === "string") setHairStyle(draft.hairStyle);
          if (typeof draft.hairColor === "string") setHairColor(draft.hairColor);
          if (typeof draft.skinTone === "string") setSkinTone(draft.skinTone);
          if (typeof draft.favoriteColor === "string") setFavoriteColor(draft.favoriteColor);
          if (typeof draft.world === "string" && albumWorldOptions.some((option) => option.id === draft.world)) setWorld(draft.world);
          if (typeof draft.companion === "string" && albumCompanionOptions.includes(draft.companion as (typeof albumCompanionOptions)[number])) setCompanion(draft.companion);
          if (typeof draft.lesson === "string" && albumLessonOptions.includes(draft.lesson as (typeof albumLessonOptions)[number])) setLesson(draft.lesson);
          if (typeof draft.personalDetail === "string") setPersonalDetail(draft.personalDetail.slice(0, 180));
          if (typeof draft.dedication === "string") setDedication(draft.dedication.slice(0, 320));
          if (typeof draft.dedicationFrom === "string") setDedicationFrom(draft.dedicationFrom.slice(0, 80));
          setStep(3);
        }
        if (new URLSearchParams(window.location.search).get("plata") === "anulata") {
          setNotice("Plata nu a fost finalizată. Alegerile albumului sunt păstrate și le poți verifica înainte să încerci din nou.");
        }
      } catch {
        // Browser storage is optional; the configurator remains fully usable without it.
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    const lessonMap: Record<string, string> = {
      "Curaj și încredere 💪": "Curaj și încredere",
      "Împărțitul jucăriilor 🧸": "Prietenie și bunătate",
      "Rutina de somn 🌙": "Înțelegerea emoțiilor",
      "Importanța prieteniei 🤝": "Prietenie și bunătate",
      "Descoperirea naturii 🌱": "Curiozitate și descoperire",
    };
    const applyChoice = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      if (typeof detail.theme === "string") {
        const recommendedWorld = albumWorldFromLumi(detail.theme);
        if (recommendedWorld) setWorld(recommendedWorld);
      }
      if (typeof detail.lesson === "string" && lessonMap[detail.lesson]) setLesson(lessonMap[detail.lesson]);
      if (typeof detail.storyDetail === "string" && detail.storyDetail.trim()) setPersonalDetail(detail.storyDetail.trim().slice(0, 180));
      setNotice("Am aplicat în album lumea și tema discutate cu Lumi. Tu completezi datele copilului.");
    };
    window.addEventListener("pmm:lumi-album-choice", applyChoice);
    const rememberedChoice = window.sessionStorage.getItem("pmm-lumi-album-choice");
    if (rememberedChoice) {
      window.sessionStorage.removeItem("pmm-lumi-album-choice");
      try {
        applyChoice(new CustomEvent("pmm:lumi-album-choice", { detail: JSON.parse(rememberedChoice) }));
      } catch {
        // The configurator remains usable if browser storage contains invalid data.
      }
    }
    return () => window.removeEventListener("pmm:lumi-album-choice", applyChoice);
  }, []);

  const goNext = () => {
    if (!canContinue) {
      setNotice("Completează numele și aspectul copilului pentru a continua.");
      return;
    }
    setNotice("");
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    if (!commerce.acceptsPayments) {
      setNotice("Comenzile pentru album se deschid odată cu activarea plăților.");
      return;
    }
    if (!hasConsent) {
      setNotice("Confirmă livrarea imediată a produsului digital înainte de plată.");
      return;
    }

    setIsLoading(true);
    setNotice("");
    trackEvent("product_started", { product: "album" });
    try {
      try {
        window.sessionStorage.setItem(albumDraftKey, JSON.stringify({
          name: name.trim(), age, hairStyle, hairColor, skinTone, favoriteColor, world, companion, lesson,
          personalDetail: personalDetail.trim(), dedication: dedication.trim(), dedicationFrom: dedicationFrom.trim(),
        }));
      } catch {
        // Checkout must remain available when session storage is disabled.
      }
      await beginOrderCheckout("illustrated-album-digital", {
        generation: {
          type: "album",
          name: name.trim(),
          age,
          hairStyle,
          hairColor,
          skinTone,
          favoriteColor,
          world,
          companion,
          lesson,
          personalDetail: personalDetail.trim(),
        },
        dedication: dedication.trim(),
        dedicationFrom: dedicationFrom.trim(),
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Plata nu a putut fi deschisă acum.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="border-y border-brand-navy/15 bg-white">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <div className="px-5 py-8 sm:px-8 md:px-12 md:py-12">
          <div className="grid grid-cols-4 border-y border-brand-navy/12" aria-label="Pașii configurării">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`min-h-16 border-r border-brand-navy/10 px-2 py-3 text-center last:border-r-0 ${index === step ? "bg-brand-navy text-brand-cream" : index < step ? "text-brand-purple" : "text-brand-navy/35"}`}
              >
                <span className="block font-mono text-[10px] font-black">0{index + 1}</span>
                <span className="mt-1 block text-[11px] font-black sm:text-xs">{label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[470px] pt-9">
            {step === 0 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Cum apare copilul în poveste?</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Folosim aceste detalii pentru ca personajul să rămână recognoscibil în toate cele 13 ilustrații.</p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>Prenume<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Exemplu: Eva" autoComplete="off" required /></label>
                  <label className={labelClass}>Vârsta<select className={inputClass} value={age} onChange={(event) => setAge(event.target.value)}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} ani</option>)}</select></label>
                  <label className={labelClass}>Coafura<select className={inputClass} value={hairStyle} onChange={(event) => setHairStyle(event.target.value)}><option>scurt și drept</option><option>ondulat până la umeri</option><option>lung și drept</option><option>creț</option><option>două împletituri</option></select></label>
                  <label className={labelClass}>Culoarea părului<select className={inputClass} value={hairColor} onChange={(event) => setHairColor(event.target.value)}><option>șaten</option><option>blond</option><option>brunet</option><option>roșcat</option><option>negru</option></select></label>
                  <label className={labelClass}>Nuanța pielii<select className={inputClass} value={skinTone} onChange={(event) => setSkinTone(event.target.value)}><option>deschisă</option><option>medie</option><option>măslinie</option><option>închisă</option></select></label>
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Alege lumea și firul aventurii</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Alegerile devin întâmplări, decoruri și momente reale din poveste.</p>
                <div className="mt-8">
                  <p className={labelClass}>Lumea poveștii</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {albumWorldOptions.map((option) => <button key={option.id} type="button" onClick={() => setWorld(option.id)} className={`min-h-12 border px-4 py-3 text-left text-sm font-black ${world === option.id ? "border-brand-purple bg-brand-purple text-white" : "border-brand-navy/15 bg-brand-cream text-brand-navy"}`}>{option.label}</button>)}
                  </div>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>Companion<select className={inputClass} value={companion} onChange={(event) => setCompanion(event.target.value)}>{albumCompanionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className={labelClass}>Ce descoperim împreună<select className={inputClass} value={lesson} onChange={(event) => setLesson(event.target.value)}>{albumLessonOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Culoarea preferată</p>
                  <div className="mt-3 flex flex-wrap gap-2">{colors.map((color) => <button key={color.value} type="button" onClick={() => setFavoriteColor(color.value)} aria-pressed={favoriteColor === color.value} className={`inline-flex min-h-11 items-center gap-2 border px-3 text-xs font-black ${favoriteColor === color.value ? "border-brand-navy bg-brand-navy text-white" : "border-brand-navy/15 text-brand-navy"}`}><span className="h-4 w-4 border border-white/70" style={{ backgroundColor: color.swatch }} />{color.label}</button>)}</div>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Puneți o bucățică din familie în album</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Detaliul personal intră în acțiune. Dedicația rămâne pe pagina ei, exact cum o scrieți.</p>
                <div className="mt-8 space-y-6">
                  <label className={labelClass}>Un detaliu pe care copilul îl va recunoaște<textarea className={`${inputClass} min-h-24 resize-y`} value={personalDetail} onChange={(event) => setPersonalDetail(event.target.value)} maxLength={180} placeholder="Exemplu: poartă mereu un rucsac cu stele și adoră clătitele cu afine" /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{personalDetail.length}/180</span></label>
                  <label className={labelClass}>Dedicație<textarea className={`${inputClass} min-h-28 resize-y`} value={dedication} onChange={(event) => setDedication(event.target.value)} maxLength={320} placeholder={`Pentru ${name || "micuțul vostru"}, care găsește lumină în fiecare aventură...`} /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{dedication.length}/320</span></label>
                  <label className={labelClass}>Semnătura familiei<input className={inputClass} value={dedicationFrom} onChange={(event) => setDedicationFrom(event.target.value)} maxLength={80} placeholder="Cu drag, Mama și Tata" /></label>
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-serif text-3xl text-brand-navy sm:text-4xl">Albumul este pregătit pentru comandă</h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Verifică alegerile. După plată, generarea continuă pe server și primești email când ambele PDF-uri sunt gata.</p>
                <div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15 text-sm">
                  {[['Pentru', `${name}, ${age} ani`], ['Lume', worldLabel], ['Companion', companion], ['Temă', lesson], ['Culoare', favoriteColor]].map(([label, value]) => <div key={label} className="grid grid-cols-[110px_1fr] gap-4 py-3"><span className="font-black text-brand-navy/45">{label}</span><span className="font-bold text-brand-navy">{value}</span></div>)}
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4"><BookHeart className="text-brand-purple" size={22} /><p className="mt-3 font-black text-brand-navy">Cartea ilustrată</p><p className="mt-1 text-xs font-semibold text-brand-navy/60">16 pagini, 13 ilustrații unice</p></div>
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4"><Palette className="text-brand-purple" size={22} /><p className="mt-3 font-black text-brand-navy">Caietul de activități</p><p className="mt-1 text-xs font-semibold text-brand-navy/60">8 pagini, 6 activități printabile</p></div>
                </div>
                <div className="mt-7 flex items-end justify-between border-y border-brand-navy/15 py-5"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/45">Preț final</p><p className="mt-1 font-nunito text-4xl font-black text-brand-purple">{commerce.prices.illustratedAlbum}</p></div><p className="max-w-[190px] text-right text-xs font-bold leading-relaxed text-brand-navy/55">Include generarea, cele 13 ilustrații și ambele PDF-uri.</p></div>
                {commerce.acceptsPayments && <div className="mt-6"><DigitalPurchaseConsent checked={hasConsent} onCheckedChange={setHasConsent} productLabel="Albumul Meu Magic - Digital" /></div>}
              </div>
            )}
          </div>

          {notice && <p role="alert" className="mb-5 border-l-4 border-brand-purple bg-brand-purple/8 px-4 py-3 text-sm font-bold text-brand-navy">{notice}</p>}
          <div className="flex items-center justify-between gap-3 border-t border-brand-navy/12 pt-6">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isLoading} className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-black text-brand-navy disabled:opacity-25"><ArrowLeft size={17} /> Înapoi</button>
            {step < 3 ? <button type="submit" className="inline-flex min-h-12 items-center gap-2 bg-brand-navy px-6 text-sm font-black text-brand-cream transition hover:bg-brand-purple">Continuă <ArrowRight size={17} /></button> : <button type="submit" disabled={isLoading || !commerce.acceptsPayments} className="inline-flex min-h-14 items-center gap-2 bg-brand-purple px-6 text-sm font-black text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-45">{isLoading ? "Deschidem plata..." : "Continuă către plată"} <Sparkles size={18} /></button>}
          </div>
        </div>

        <aside className="border-t border-brand-navy/15 bg-brand-navy px-5 py-9 text-brand-cream sm:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-gold">Vezi ce primești</p>
          <div className="mt-5 overflow-hidden border border-brand-gold/50"><Image src="/examples/album/coperta.webp" alt="Coperta modelului Albumul Meu Magic" width={960} height={676} priority className="h-auto w-full" /></div>
          <div className="mt-3 grid grid-cols-3 gap-2"><Image src="/examples/album/aventura.webp" alt="Pagină ilustrată" width={480} height={338} className="aspect-[1.42] w-full object-cover" /><Image src="/examples/album/colorat.webp" alt="Pagină de colorat" width={480} height={338} className="aspect-[1.42] w-full object-cover" /><Image src="/examples/album/labirint.webp" alt="Pagină cu labirint" width={480} height={338} className="aspect-[1.42] w-full object-cover" /></div>
          <p className="mt-5 font-serif text-2xl">O ilustrație nouă pe fiecare pagină.</p>
          <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/75">{["Format real A5 landscape", "Cartea și activitățile sunt separate", "Link securizat, valabil 30 de zile", "Livrare automată pe email"].map((item) => <li key={item} className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-brand-gold" />{item}</li>)}</ul>
          <div className="mt-8 grid grid-cols-3 border-y border-brand-cream/15 py-5 text-center"><div><Clock3 className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">4-8 minute</p></div><div><Mail className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">Primești email</p></div><div><Download className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">2 PDF-uri</p></div></div>
          <Link href="/modele#albumul-meu-magic" className="mt-7 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-sm font-black text-brand-gold">Vezi paginile modelului <ArrowRight size={16} /></Link>
        </aside>
      </div>
    </form>
  );
}

export function AlbumPrintTeaser() {
  return (
    <section className="bg-brand-cream px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 border-y border-brand-navy/15 py-10 md:grid-cols-[auto_1fr_auto] md:items-center">
        <span className="grid h-14 w-14 place-items-center bg-brand-gold text-brand-navy"><Printer size={27} /></span>
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">În curând</p><h2 className="mt-2 font-serif text-3xl text-brand-navy">Pachetul tipărit, gândit pentru fiecare fel de pagină</h2><p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-brand-navy/65">Cartea ilustrată va putea avea copertă cartonată. Jocurile vor veni într-un caiet separat, pe hârtie mată pe care copilul poate desena și colora ușor.</p></div>
        <span className="w-fit border border-brand-navy/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-navy/50">Preț în curs de stabilire</span>
      </div>
    </section>
  );
}
