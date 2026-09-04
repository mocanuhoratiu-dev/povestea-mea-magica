"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookHeart, BookOpen, Camera, Check, Eye, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, TimerReset, Trash2 } from "lucide-react";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { albumArtStyleOptions, albumCompanionOptions, albumLessonOptions, albumMoodOptions, albumWorldOptions } from "@/lib/album/types";
import type { BundleVariant } from "@/lib/bundle";
import { beginOrderCheckout, beginPreparedOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";
import { prepareReferencePhoto } from "@/lib/album/clientReferencePhoto";

const themes = [
  ["space", "Spațiu"], ["forest", "Pădure fermecată"], ["castle", "Castel din nori"],
  ["ocean", "Oceanul de cristal"], ["dinosaurs", "Valea dinozaurilor"], ["clouds", "Orașul din nori"],
] as const;
const lessons = ["Curaj și încredere 💪", "Împărțitul jucăriilor 🧸", "Rutina de somn 🌙", "Importanța prieteniei 🤝", "Descoperirea naturii 🌱"] as const;
const tones = ["Liniștită de somn", "Aventură blândă", "Amuzantă", "Emoțională și caldă"] as const;
const monsters = [
  ["umbrele noptii", "Umbrele nopții"], ["monstrul de sub pat", "Monstrul de sub pat"],
  ["zgomotele ciudate", "Zgomotele ciudate"], ["dulapul scartaitor", "Dulapul scârțâitor"],
  ["frica de intuneric", "Frica de întuneric"], ["vise urate", "Visele urâte"],
] as const;
const contexts = [
  ["la restaurant, asteptand mancarea", "La restaurant"], ["la un drum lung cu masina", "La drum lung"],
  ["in sala de asteptare la doctor", "La doctor"], ["in casa, ploua afara", "Acasă, într-o zi ploioasă"],
  ["in aeroport sau avion", "În aeroport sau avion"], ["la coada sau institutii", "La coadă"],
] as const;

const familySteps = [
  { title: "Povestea", icon: BookOpen }, { title: "Scutul", icon: ShieldCheck },
  { title: "Trusa", icon: TimerReset }, { title: "Rezumat", icon: Check },
];
const completeSteps = [
  { title: "Povestea", icon: BookOpen }, { title: "Scutul", icon: ShieldCheck },
  { title: "Trusa", icon: TimerReset }, { title: "Albumul", icon: BookHeart }, { title: "Rezumat", icon: Check },
];
const inputClass = "mt-2 min-h-12 w-full rounded-md border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition-colors focus:border-brand-purple";
const labelClass = "block text-sm font-black text-brand-navy";

function ChildReuse({ checked, onChange, name }: { checked: boolean; onChange: (value: boolean) => void; name: string }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-md border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-brand-navy">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand-purple" />
    Același copil ca în poveste{name ? `: ${name}` : ""}
  </label>;
}

export default function BundleConfigurator({ variant = "family" }: { variant?: BundleVariant }) {
  const includesAlbum = variant === "complete";
  const steps = includesAlbum ? completeSteps : familySteps;
  const lastStep = steps.length - 1;
  const stepsRef = useRef<HTMLOListElement>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [referencePhoto, setReferencePhoto] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [albumPreview, setAlbumPreview] = useState<{ orderId: string; imageUrl: string; title: string; fingerprint: string; qualityChecked: boolean } | null>(null);
  const [story, setStory] = useState({ name: "", age: "5", theme: "forest", lesson: lessons[0] as string, tone: tones[0] as string, details: "", dedication: "", dedicationFrom: "" });
  const [monsterSameChild, setMonsterSameChild] = useState(true);
  const [monster, setMonster] = useState({ name: "", type: "frica de intuneric", location: "", helper: "", ritual: "" });
  const [emergencySameChild, setEmergencySameChild] = useState(true);
  const [emergency, setEmergency] = useState({ name: "", age: "5", context: contexts[0][0] as string, interest: "", duration: "10-20 minute", activityMode: "mix" });
  const [albumSameChild, setAlbumSameChild] = useState(true);
  const [albumSameDedication, setAlbumSameDedication] = useState(true);
  const [album, setAlbum] = useState({
    name: "", age: "5", hairStyle: "ondulat până la umeri", hairColor: "șaten", eyeColor: "căprui", skinTone: "deschisă",
    outfit: "pulover moale și pantaloni comozi", appearanceDetail: "",
    favoriteColor: "mov ametist", world: albumWorldOptions[0].id as string, companion: albumCompanionOptions[0] as string,
    lesson: albumLessonOptions[0] as string, mood: albumMoodOptions[0] as string, artStyle: albumArtStyleOptions[0] as string,
    personalDetail: "", storyContext: "", dedication: "", dedicationFrom: "",
  });

  const effectiveMonsterName = monsterSameChild ? story.name : monster.name;
  const effectiveEmergencyName = emergencySameChild ? story.name : emergency.name;
  const effectiveEmergencyAge = emergencySameChild ? story.age : emergency.age;
  const effectiveAlbumName = albumSameChild ? story.name : album.name;
  const effectiveAlbumAge = albumSameChild ? story.age : album.age;
  const effectiveAlbumDedication = albumSameDedication ? story.dedication : album.dedication;
  const effectiveAlbumDedicationFrom = albumSameDedication ? story.dedicationFrom : album.dedicationFrom;
  const draftKey = includesAlbum ? "pmm-complete-bundle-draft" : "pmm-family-bundle-draft";
  const bundleFingerprint = useMemo(() => JSON.stringify({ story, monsterSameChild, monster, emergencySameChild, emergency, albumSameChild, albumSameDedication, album, photo: Boolean(referencePhoto) }), [album, albumSameChild, albumSameDedication, emergency, emergencySameChild, monster, monsterSameChild, referencePhoto, story]);
  const activeAlbumPreview = albumPreview?.fingerprint === bundleFingerprint ? albumPreview : null;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("plata") !== "anulata") return;
      try {
        const stored = window.sessionStorage.getItem(draftKey);
        if (!stored) {
          setError("Plata nu a fost finalizată. Poți verifica alegerile și încerca din nou.");
          return;
        }
        const draft = JSON.parse(stored) as {
          story?: typeof story;
          monsterSameChild?: boolean;
          monster?: typeof monster;
          emergencySameChild?: boolean;
          emergency?: typeof emergency;
          albumSameChild?: boolean;
          albumSameDedication?: boolean;
          album?: typeof album;
          albumPreview?: typeof albumPreview;
        };
        if (draft.story) setStory(draft.story);
        if (typeof draft.monsterSameChild === "boolean") setMonsterSameChild(draft.monsterSameChild);
        if (draft.monster) setMonster(draft.monster);
        if (typeof draft.emergencySameChild === "boolean") setEmergencySameChild(draft.emergencySameChild);
        if (draft.emergency) setEmergency(draft.emergency);
        if (typeof draft.albumSameChild === "boolean") setAlbumSameChild(draft.albumSameChild);
        if (typeof draft.albumSameDedication === "boolean") setAlbumSameDedication(draft.albumSameDedication);
        if (draft.album) setAlbum(draft.album);
        if (draft.albumPreview) {
          const restoredFingerprint = JSON.stringify({
            story: draft.story || story,
            monsterSameChild: draft.monsterSameChild ?? monsterSameChild,
            monster: draft.monster || monster,
            emergencySameChild: draft.emergencySameChild ?? emergencySameChild,
            emergency: draft.emergency || emergency,
            albumSameChild: draft.albumSameChild ?? albumSameChild,
            albumSameDedication: draft.albumSameDedication ?? albumSameDedication,
            album: draft.album || album,
            photo: false,
          });
          setAlbumPreview({ ...draft.albumPreview, fingerprint: restoredFingerprint });
        }
        setStep(lastStep);
        setError("Plata nu a fost finalizată. Alegerile sunt păstrate și le poți verifica înainte să încerci din nou.");
      } catch {
        setError("Plata nu a fost finalizată. Poți verifica alegerile și încerca din nou.");
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  // The draft is intentionally restored only once, after Stripe returns here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaries = useMemo(() => {
    const items = [
      { icon: BookOpen, title: "Poveste lungă", name: story.name, detail: themes.find(([id]) => id === story.theme)?.[1] || "Lume magică" },
      { icon: ShieldCheck, title: "Scutul de Noapte", name: effectiveMonsterName, detail: monsters.find(([id]) => id === monster.type)?.[1] || "Ritual de noapte" },
      { icon: TimerReset, title: "Trusa de Răbdare", name: effectiveEmergencyName, detail: contexts.find(([id]) => id === emergency.context)?.[1] || "Moment de așteptare" },
    ];
    if (includesAlbum) items.push({ icon: BookHeart, title: "Albumul Meu Magic", name: effectiveAlbumName, detail: albumWorldOptions.find((option) => option.id === album.world)?.label || "Lume magică" });
    return items;
  }, [album.world, effectiveAlbumName, effectiveEmergencyName, effectiveMonsterName, emergency.context, includesAlbum, monster.type, story]);

  function goToStep(next: number) {
    setStep(next);
    window.setTimeout(() => stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function nextStep() {
    setError("");
    if (step === 0 && !story.name.trim()) return setError("Scrie numele copilului pentru poveste.");
    if (step === 1 && !effectiveMonsterName.trim()) return setError("Scrie numele copilului pentru Scut.");
    if (step === 2 && !effectiveEmergencyName.trim()) return setError("Scrie numele copilului pentru Trusă.");
    if (includesAlbum && step === 3 && !effectiveAlbumName.trim()) return setError("Scrie numele copilului pentru album.");
    goToStep(Math.min(step + 1, lastStep));
  }

  function buildItems() {
    const items: Array<{ product: "story" | "monster" | "emergency" | "album"; configuration: Record<string, unknown> }> = [
      { product: "story", configuration: { generation: { type: "story", name: story.name.trim(), age: story.age, theme: story.theme, lesson: story.lesson, context: story.details.trim(), tone: story.tone, themeDetail: "", lessonDetail: "", storyLength: "long" }, dedication: story.dedication.trim(), dedicationFrom: story.dedicationFrom.trim() } },
      { product: "monster", configuration: { generation: { type: "monster", name: effectiveMonsterName.trim(), monster: monster.type, context: monster.location.trim(), interest: monster.helper.trim(), tone: monster.ritual.trim() } } },
      { product: "emergency", configuration: { generation: { type: "emergency", name: effectiveEmergencyName.trim(), age: effectiveEmergencyAge, context: emergency.context, interest: emergency.interest.trim(), duration: emergency.duration, activityMode: emergency.activityMode } } },
    ];
    if (includesAlbum) items.push({ product: "album", configuration: {
      generation: { type: "album", name: effectiveAlbumName.trim(), age: effectiveAlbumAge, hairStyle: album.hairStyle, hairColor: album.hairColor, eyeColor: album.eyeColor, skinTone: album.skinTone, outfit: album.outfit.trim(), appearanceDetail: album.appearanceDetail.trim(), favoriteColor: album.favoriteColor, world: album.world, companion: album.companion, lesson: album.lesson, mood: album.mood, artStyle: album.artStyle, personalDetail: album.personalDetail.trim(), storyContext: album.storyContext.trim(), referenceMode: referencePhoto ? "photo" : "description" },
      dedication: effectiveAlbumDedication.trim(), dedicationFrom: effectiveAlbumDedicationFrom.trim(),
    } });
    return items;
  }

  async function createCompleteBundlePreview() {
    if (referencePhoto && !photoConsent) return setError("Confirmă permisiunea pentru fotografia copilului sau elimin-o.");
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/album-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "complete-bundle", bundleConfiguration: { items: buildItems() }, ...(referencePhoto ? { referenceImageDataUrl: referencePhoto, photoConsent: true } : {}) }),
      });
      const payload = await response.json() as { orderId?: string; previewUrl?: string; title?: string; qualityChecked?: boolean; error?: string };
      if (!response.ok || !payload.orderId || !payload.previewUrl || !payload.title) throw new Error(payload.error || "Coperta nu a putut fi creată.");
      setAlbumPreview({ orderId: payload.orderId, imageUrl: payload.previewUrl, title: payload.title, fingerprint: bundleFingerprint, qualityChecked: payload.qualityChecked === true });
      setHasConsent(false);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Coperta nu a putut fi creată.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startCheckout() {
    if (includesAlbum && !activeAlbumPreview) return createCompleteBundlePreview();
    if (!hasConsent) return setError("Confirmă livrarea imediată înainte de plată.");
    setError("");
    setIsLoading(true);
    trackEvent("product_started", { product: "bundle" });
    const items = buildItems();
    try {
      try {
        window.sessionStorage.setItem(draftKey, JSON.stringify({ story, monsterSameChild, monster, emergencySameChild, emergency, albumSameChild, albumSameDedication, album, albumPreview: activeAlbumPreview }));
      } catch {
        // Checkout remains available when browser storage is disabled.
      }
      if (includesAlbum && activeAlbumPreview) await beginPreparedOrderCheckout("complete-bundle", activeAlbumPreview.orderId);
      else await beginOrderCheckout("family-bundle", { items });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Nu am putut deschide plata.");
      setIsLoading(false);
    }
  }

  return <section className="px-5 py-12 sm:px-6 md:py-18"><div className="mx-auto max-w-5xl">
    <ol ref={stepsRef} className={`grid scroll-mt-28 ${includesAlbum ? "grid-cols-5" : "grid-cols-4"} border-y border-brand-navy/15`} aria-label="Pașii personalizării">
      {steps.map((item, index) => { const Icon = item.icon; const active = index === step; const complete = index < step; return <li key={item.title} className={`flex min-h-20 items-center justify-center gap-2 border-r border-brand-navy/10 px-1 text-center last:border-r-0 sm:px-2 ${active ? "bg-brand-navy text-brand-cream" : complete ? "bg-brand-gold/15 text-brand-navy" : "text-brand-navy/45"}`}><Icon size={18} /><span className="hidden text-xs font-black uppercase tracking-[0.1em] md:inline">{item.title}</span><span className="text-xs font-black md:hidden">{index + 1}</span></li>; })}
    </ol>
    <div className="mx-auto mt-10 max-w-3xl">
      {step === 0 && <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">1 din {steps.length} · Povestea lungă</p><h2 className="mt-3 font-serif text-4xl text-brand-navy">Începem cu aventura</h2><div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>Numele copilului<input className={inputClass} value={story.name} maxLength={40} onChange={(event) => setStory({ ...story, name: event.target.value })} placeholder="Exemplu: Eva" /></label>
        <label className={labelClass}>Vârsta<select className={inputClass} value={story.age} onChange={(event) => setStory({ ...story, age: event.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1} {index === 0 ? "an" : "ani"}</option>)}</select></label>
        <label className={labelClass}>Lumea poveștii<select className={inputClass} value={story.theme} onChange={(event) => setStory({ ...story, theme: event.target.value })}>{themes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className={labelClass}>Tonul<select className={inputClass} value={story.tone} onChange={(event) => setStory({ ...story, tone: event.target.value })}>{tones.map((tone) => <option key={tone}>{tone}</option>)}</select></label>
        <label className={`${labelClass} sm:col-span-2`}>Ce învățăm<select className={inputClass} value={story.lesson} onChange={(event) => setStory({ ...story, lesson: event.target.value })}>{lessons.map((lesson) => <option key={lesson}>{lesson}</option>)}</select></label>
        <label className={`${labelClass} sm:col-span-2`}>Un detaliu important<textarea className={`${inputClass} min-h-24 resize-y`} value={story.details} maxLength={420} onChange={(event) => setStory({ ...story, details: event.target.value })} placeholder="O jucărie iubită, o întâmplare sau ceva ce îl face să zâmbească" /></label>
        <label className={`${labelClass} sm:col-span-2`}>Dedicație<textarea className={`${inputClass} min-h-24 resize-y`} value={story.dedication} maxLength={320} onChange={(event) => setStory({ ...story, dedication: event.target.value })} placeholder="Mesajul vostru pentru copil" /></label>
        <label className={`${labelClass} sm:col-span-2`}>Din partea cui<input className={inputClass} value={story.dedicationFrom} maxLength={80} onChange={(event) => setStory({ ...story, dedicationFrom: event.target.value })} placeholder="Mama, tata, bunicii..." /></label>
      </div></div>}

      {step === 1 && <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">2 din {steps.length} · Scutul de Noapte</p><h2 className="mt-3 font-serif text-4xl text-brand-navy">Un ritual pentru mai mult curaj</h2><div className="mt-8 space-y-5">
        <ChildReuse checked={monsterSameChild} onChange={setMonsterSameChild} name={story.name} />
        {!monsterSameChild && <label className={labelClass}>Numele copilului<input className={inputClass} value={monster.name} maxLength={40} onChange={(event) => setMonster({ ...monster, name: event.target.value })} /></label>}
        <label className={labelClass}>Ce vrem să îmblânzim<select className={inputClass} value={monster.type} onChange={(event) => setMonster({ ...monster, type: event.target.value })}>{monsters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className={labelClass}>Unde apare cel mai des<input className={inputClass} value={monster.location} maxLength={180} onChange={(event) => setMonster({ ...monster, location: event.target.value })} placeholder="Lângă pat, în colțul camerei..." /></label>
        <label className={labelClass}>Ce îl liniștește<input className={inputClass} value={monster.helper} maxLength={180} onChange={(event) => setMonster({ ...monster, helper: event.target.value })} placeholder="O lumină de veghe, o îmbrățișare..." /></label>
        <label className={labelClass}>Ritualul vostru de seară<input className={inputClass} value={monster.ritual} maxLength={180} onChange={(event) => setMonster({ ...monster, ritual: event.target.value })} placeholder="Trei respirații și o poveste scurtă" /></label>
      </div></div>}

      {step === 2 && <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">3 din {steps.length} · Trusa de Răbdare</p><h2 className="mt-3 font-serif text-4xl text-brand-navy">Misiunea pentru următoarea așteptare</h2><div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><ChildReuse checked={emergencySameChild} onChange={setEmergencySameChild} name={story.name} /></div>
        {!emergencySameChild && <><label className={labelClass}>Numele copilului<input className={inputClass} value={emergency.name} maxLength={40} onChange={(event) => setEmergency({ ...emergency, name: event.target.value })} /></label><label className={labelClass}>Vârsta<select className={inputClass} value={emergency.age} onChange={(event) => setEmergency({ ...emergency, age: event.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1} {index === 0 ? "an" : "ani"}</option>)}</select></label></>}
        <label className={`${labelClass} sm:col-span-2`}>Unde va fi folosită<select className={inputClass} value={emergency.context} onChange={(event) => setEmergency({ ...emergency, context: event.target.value })}>{contexts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className={`${labelClass} sm:col-span-2`}>Ce îl pasionează<input className={inputClass} value={emergency.interest} maxLength={180} onChange={(event) => setEmergency({ ...emergency, interest: event.target.value })} placeholder="Dinozauri, mașini, desen, animale..." /></label>
        <label className={labelClass}>Cât durează așteptarea<select className={inputClass} value={emergency.duration} onChange={(event) => setEmergency({ ...emergency, duration: event.target.value })}><option>5-10 minute</option><option>10-20 minute</option><option>20+ minute</option></select></label>
        <label className={labelClass}>Tipul activităților<select className={inputClass} value={emergency.activityMode} onChange={(event) => setEmergency({ ...emergency, activityMode: event.target.value })}><option value="liniștite">Liniștite</option><option value="cu mișcare mică">Cu mișcare mică</option><option value="mix">Mix</option></select></label>
      </div></div>}

      {includesAlbum && step === 3 && <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">4 din 5 · Albumul Meu Magic</p><h2 className="mt-3 font-serif text-4xl text-brand-navy">Copilul devine eroul fiecărei ilustrații</h2><p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/60">Definim personajul, stilul vizual și aventura înainte de a crea cele 13 scene 2K.</p><div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><ChildReuse checked={albumSameChild} onChange={setAlbumSameChild} name={story.name} /></div>
        {!albumSameChild && <><label className={labelClass}>Numele copilului<input className={inputClass} value={album.name} maxLength={40} onChange={(event) => setAlbum({ ...album, name: event.target.value })} /></label><label className={labelClass}>Vârsta<select className={inputClass} value={album.age} onChange={(event) => setAlbum({ ...album, age: event.target.value })}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} ani</option>)}</select></label></>}
        <label className={labelClass}>Coafura<select className={inputClass} value={album.hairStyle} onChange={(event) => setAlbum({ ...album, hairStyle: event.target.value })}><option>scurt și drept</option><option>ondulat până la umeri</option><option>lung și drept</option><option>creț</option><option>două împletituri</option></select></label>
        <label className={labelClass}>Culoarea părului<select className={inputClass} value={album.hairColor} onChange={(event) => setAlbum({ ...album, hairColor: event.target.value })}><option>șaten</option><option>blond</option><option>brunet</option><option>roșcat</option><option>negru</option></select></label>
        <label className={labelClass}>Culoarea ochilor<select className={inputClass} value={album.eyeColor} onChange={(event) => setAlbum({ ...album, eyeColor: event.target.value })}><option>căprui</option><option>albaștri</option><option>verzi</option><option>cenușii</option><option>negri</option></select></label>
        <label className={labelClass}>Nuanța pielii<select className={inputClass} value={album.skinTone} onChange={(event) => setAlbum({ ...album, skinTone: event.target.value })}><option>deschisă</option><option>medie</option><option>măslinie</option><option>închisă</option></select></label>
        <label className={`${labelClass} sm:col-span-2`}>Ținuta personajului<input className={inputClass} value={album.outfit} maxLength={100} onChange={(event) => setAlbum({ ...album, outfit: event.target.value })} placeholder="Exemplu: rochiță galbenă și cizme mov" /></label>
        <label className={`${labelClass} sm:col-span-2`}>Alte detalii de aspect<textarea className={`${inputClass} min-h-20 resize-y`} value={album.appearanceDetail} maxLength={240} onChange={(event) => setAlbum({ ...album, appearanceDetail: event.target.value })} placeholder="Ochelari, pistrui sau un accesoriu preferat" /></label>
        <div className="rounded-md border border-brand-gold/50 bg-brand-gold/10 p-5 sm:col-span-2">
          <div className="flex gap-3"><Camera size={21} className="shrink-0 text-brand-purple" /><div><p className="text-sm font-black text-brand-navy">Fotografie de referință, opțional</p><p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">O folosim privat pentru a păstra trăsăturile copilului în personajul ilustrat.</p></div></div>
          {referencePhoto ? <div className="mt-4 grid gap-4 sm:grid-cols-[86px_1fr] sm:items-center">
            <Image src={referencePhoto} alt="Fotografia de referință selectată" width={86} height={86} unoptimized className="h-[86px] w-[86px] rounded-md border border-brand-gold/60 object-cover" />
            <div><label className="flex cursor-pointer items-start gap-3 text-xs font-bold leading-relaxed text-brand-navy/75"><input type="checkbox" checked={photoConsent} onChange={(event) => setPhotoConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-purple" />Confirm că am dreptul să folosesc fotografia copilului pentru această comandă.</label><button type="button" onClick={() => { setReferencePhoto(""); setPhotoConsent(false); setAlbumPreview(null); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-brand-purple"><Trash2 size={15} /> Elimină fotografia</button></div>
          </div> : <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-brand-navy/20 bg-white px-4 text-xs font-black text-brand-navy"><Camera size={16} /> Alege fotografia<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; void prepareReferencePhoto(file).then((prepared) => { setReferencePhoto(prepared); setPhotoConsent(false); setAlbumPreview(null); setError(""); }).catch((photoError) => setError(photoError instanceof Error ? photoError.message : "Fotografia nu a putut fi pregătită.")); }} /></label>}
        </div>
        <label className={labelClass}>Culoarea preferată<select className={inputClass} value={album.favoriteColor} onChange={(event) => setAlbum({ ...album, favoriteColor: event.target.value })}><option>mov ametist</option><option>albastru ceresc</option><option>verde smarald</option><option>roz zmeură</option><option>galben solar</option></select></label>
        <label className={labelClass}>Lumea albumului<select className={inputClass} value={album.world} onChange={(event) => setAlbum({ ...album, world: event.target.value })}>{albumWorldOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className={labelClass}>Companion<select className={inputClass} value={album.companion} onChange={(event) => setAlbum({ ...album, companion: event.target.value })}>{albumCompanionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className={labelClass}>Ce descoperim împreună<select className={inputClass} value={album.lesson} onChange={(event) => setAlbum({ ...album, lesson: event.target.value })}>{albumLessonOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className={labelClass}>Atmosfera<select className={inputClass} value={album.mood} onChange={(event) => setAlbum({ ...album, mood: event.target.value })}>{albumMoodOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className={labelClass}>Stilul ilustrațiilor<select className={inputClass} value={album.artStyle} onChange={(event) => setAlbum({ ...album, artStyle: event.target.value })}>{albumArtStyleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className={`${labelClass} sm:col-span-2`}>Ideea ta pentru poveste<textarea className={`${inputClass} min-h-32 resize-y`} value={album.storyContext} maxLength={700} onChange={(event) => setAlbum({ ...album, storyContext: event.target.value })} placeholder="Descrie pe scurt aventura pe care ți-o imaginezi sau lasă câmpul liber" /></label>
        <label className={`${labelClass} sm:col-span-2`}>Un detaliu pe care copilul îl va recunoaște<textarea className={`${inputClass} min-h-24 resize-y`} value={album.personalDetail} maxLength={240} onChange={(event) => setAlbum({ ...album, personalDetail: event.target.value })} placeholder="Un obiect iubit, o pasiune sau un obicei simpatic" /></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-brand-navy sm:col-span-2"><input type="checkbox" checked={albumSameDedication} onChange={(event) => setAlbumSameDedication(event.target.checked)} className="h-4 w-4 accent-brand-purple" /> Folosește dedicația din poveste și în album</label>
        {!albumSameDedication && <><label className={`${labelClass} sm:col-span-2`}>Dedicația albumului<textarea className={`${inputClass} min-h-24 resize-y`} value={album.dedication} maxLength={320} onChange={(event) => setAlbum({ ...album, dedication: event.target.value })} /></label><label className={`${labelClass} sm:col-span-2`}>Din partea cui<input className={inputClass} value={album.dedicationFrom} maxLength={80} onChange={(event) => setAlbum({ ...album, dedicationFrom: event.target.value })} /></label></>}
      </div></div>}

      {step === lastStep && <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">{steps.length} din {steps.length} · Rezumat</p><h2 className="mt-3 font-serif text-4xl text-brand-navy">{includesAlbum ? "Cinci PDF-uri, pregătite pentru familia voastră" : "Trei materiale, fiecare al vostru"}</h2><div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15">
        {summaries.map((item, index) => <div key={item.title} className="grid gap-3 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"><item.icon className="text-brand-purple" size={25} /><div><h3 className="font-serif text-2xl text-brand-navy">{item.title}</h3><p className="mt-1 text-sm font-bold text-brand-navy/65">Pentru {item.name} · {item.detail}</p></div><button type="button" onClick={() => goToStep(index)} className="w-fit border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Editează</button></div>)}
      </div>
      <div className="mt-8 flex flex-col gap-4 border-b border-brand-gold/50 bg-brand-gold/12 px-5 py-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/55">Valoare individuală {includesAlbum ? "126 lei" : "67 lei"}</p><p className="mt-1 font-serif text-2xl text-brand-navy">{includesAlbum ? "Pachetul Complet" : "Pachetul Familiei Magice"}</p>{includesAlbum && <p className="mt-2 text-xs font-bold text-brand-navy/55">Include povestea, cele două kituri, cartea ilustrată și caietul de activități.</p>}</div><p className="font-nunito text-4xl font-black text-brand-purple">{includesAlbum ? "99 lei" : "49 lei"}</p></div>
      {includesAlbum && <div className="mt-7">
        {activeAlbumPreview ? <div className="overflow-hidden rounded-md border border-brand-gold/60 bg-brand-navy">
          <div className="relative aspect-[3/2]">
            <Image src={activeAlbumPreview.imageUrl} alt={`Coperta albumului pentru ${effectiveAlbumName}`} fill unoptimized sizes="(max-width: 768px) 100vw, 768px" className="object-cover" onError={() => setAlbumPreview(null)} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,44,.78),rgba(7,24,44,.12)_60%,transparent)]" />
            <div className="absolute inset-y-0 left-0 flex w-[56%] flex-col justify-center p-6 text-brand-cream"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-gold">Preview album</p><p className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">{activeAlbumPreview.title}</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs font-bold text-brand-cream/75"><p className="flex items-center gap-2"><Check size={16} className="text-brand-gold" />Coperta fixează personajul pentru toate scenele{activeAlbumPreview.qualityChecked ? " și a trecut controlul automat" : ""}.</p><button type="button" onClick={() => { setAlbumPreview(null); setHasConsent(false); }} className="inline-flex min-h-9 items-center gap-2 border-b border-brand-gold text-[11px] font-black text-brand-gold"><RefreshCw size={14} /> Altă copertă</button></div>
        </div> : <div className="flex gap-4 rounded-md border border-brand-purple/25 bg-brand-purple/[0.06] p-5"><Eye size={23} className="shrink-0 text-brand-purple" /><div><p className="font-black text-brand-navy">Vezi coperta înainte de plată</p><p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">Creăm personajul albumului din alegerile tale. Plata se deschide numai după ce vezi rezultatul.</p></div></div>}
      </div>}
      {(!includesAlbum || activeAlbumPreview) && <div className="mt-7"><DigitalPurchaseConsent checked={hasConsent} onCheckedChange={setHasConsent} productLabel={includesAlbum ? "Pachetul Complet" : "Pachetul Familiei Magice"} /></div>}
      </div>}

      {error && <p role="alert" className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mb-20 mt-8 flex items-center justify-between gap-4 border-t border-brand-navy/12 pt-6 sm:mb-0">
        {step > 0 ? <button type="button" onClick={() => { setError(""); goToStep(step - 1); }} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-brand-navy/20 px-5 text-sm font-black text-brand-navy"><ArrowLeft size={18} /> Înapoi</button> : <span />}
        {step < lastStep ? <button type="button" onClick={nextStep} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-navy px-6 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Continuă <ArrowRight size={18} /></button> : <button type="button" onClick={startCheckout} disabled={isLoading} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-purple px-6 text-sm font-black text-white transition-colors hover:bg-brand-navy disabled:cursor-wait disabled:opacity-70">{isLoading ? <><LoaderCircle className="animate-spin" size={18} /> {includesAlbum && !activeAlbumPreview ? "Creăm coperta" : "Se deschide plata"}</> : <><Sparkles size={18} /> {includesAlbum && !activeAlbumPreview ? "Vezi coperta albumului" : "Continuă către plată"}</>}</button>}
      </div>
    </div>
  </div></section>;
}
