"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookHeart, Camera, Check, Eye, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, TimerReset, Trash2 } from "lucide-react";
import AlbumPreviewFlipbook, { type AlbumPreviewPage } from "@/components/AlbumPreviewFlipbook";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { prepareReferencePhoto } from "@/lib/album/clientReferencePhoto";
import { albumArtStyleOptions, albumCompanionOptions, albumLessonOptions, albumMoodOptions, albumWorldOptions } from "@/lib/album/types";
import { beginPreparedOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";

const steps = [
  { title: "Povestea", icon: BookHeart },
  { title: "Scutul", icon: ShieldCheck },
  { title: "Trusa", icon: TimerReset },
  { title: "Rezumat", icon: Check },
];

const monsters = [
  ["umbrele noptii", "Umbrele nopții"],
  ["monstrul de sub pat", "Monstrul de sub pat"],
  ["zgomotele ciudate", "Zgomotele ciudate"],
  ["dulapul scartaitor", "Dulapul scârțâitor"],
  ["frica de intuneric", "Frica de întuneric"],
  ["vise urate", "Visele urâte"],
] as const;

const contexts = [
  ["la restaurant, asteptand mancarea", "La restaurant"],
  ["la un drum lung cu masina", "La drum lung"],
  ["in sala de asteptare la doctor", "La doctor"],
  ["in casa, ploua afara", "Acasă, într-o zi ploioasă"],
  ["in aeroport sau avion", "În aeroport sau avion"],
  ["la coada sau institutii", "La coadă"],
] as const;

const inputClass = "mt-2 min-h-12 w-full rounded-md border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition-colors focus:border-brand-purple";
const labelClass = "block text-sm font-black text-brand-navy";
const draftKey = "pmm-complete-bundle-draft";

function ChildReuse({ checked, onChange, name }: { checked: boolean; onChange: (value: boolean) => void; name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-brand-navy">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand-purple" />
      Același copil ca în Povestea Magică{name ? `: ${name}` : ""}
    </label>
  );
}

export default function BundleConfigurator() {
  const lastStep = steps.length - 1;
  const stepsRef = useRef<HTMLOListElement>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [referencePhoto, setReferencePhoto] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [albumPreview, setAlbumPreview] = useState<{ orderId: string; imageUrl: string; statusUrl: string; title: string; fingerprint: string; qualityChecked: boolean; pages: AlbumPreviewPage[]; ready: boolean } | null>(null);
  const [album, setAlbum] = useState({
    name: "", age: "5", hairStyle: "ondulat până la umeri", hairColor: "șaten", eyeColor: "căprui", skinTone: "deschisă",
    outfit: "pulover moale și pantaloni comozi", appearanceDetail: "", favoriteColor: "mov ametist",
    world: albumWorldOptions[0].id as string, customWorld: "", companion: albumCompanionOptions[0] as string,
    secondaryCharacterName: "", secondaryCharacterRole: "", secondaryCharacterAppearance: "",
    lesson: albumLessonOptions[0] as string, mood: albumMoodOptions[0] as string, artStyle: albumArtStyleOptions[0] as string,
    personalDetail: "", storyContext: "", dedication: "", dedicationFrom: "",
  });
  const [monsterSameChild, setMonsterSameChild] = useState(true);
  const [monster, setMonster] = useState({ name: "", type: "frica de intuneric", location: "", helper: "", ritual: "" });
  const [emergencySameChild, setEmergencySameChild] = useState(true);
  const [emergency, setEmergency] = useState({ name: "", age: "5", context: contexts[0][0] as string, interest: "", duration: "10-20 minute", activityMode: "mix" });

  const effectiveMonsterName = monsterSameChild ? album.name : monster.name;
  const effectiveEmergencyName = emergencySameChild ? album.name : emergency.name;
  const effectiveEmergencyAge = emergencySameChild ? album.age : emergency.age;
  const bundleFingerprint = useMemo(
    () => JSON.stringify({ album, monsterSameChild, monster, emergencySameChild, emergency, photo: Boolean(referencePhoto) }),
    [album, emergency, emergencySameChild, monster, monsterSameChild, referencePhoto],
  );
  const activeAlbumPreview = albumPreview?.fingerprint === bundleFingerprint ? albumPreview : null;

  useEffect(() => {
    if (!activeAlbumPreview?.statusUrl || activeAlbumPreview.ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const response = await fetch(activeAlbumPreview.statusUrl, { cache: "no-store" });
        const payload = await response.json() as { status?: string; title?: string; pages?: AlbumPreviewPage[]; qualityChecked?: boolean; progress?: number; error?: string };
        if (cancelled) return;
        if (payload.status === "ready" && payload.pages?.length === 3) {
          setAlbumPreview({ ...activeAlbumPreview, title: payload.title || activeAlbumPreview.title, qualityChecked: payload.qualityChecked === true, pages: payload.pages, ready: true });
          setError("Mostra Poveștii Magice este gata. Răsfoiește cele trei pagini înainte de plată.");
          return;
        }
        if (payload.status === "failed") throw new Error(payload.error || "Mostra nu a putut fi creată.");
        setError(`Pregătim paginile interioare ${Math.max(0, payload.progress || 0)} din 2. Plata se deschide după ce le poți răsfoi.`);
      } catch (previewError) {
        if (cancelled) return;
        if (attempts >= 100) {
          setAlbumPreview(null);
          setError(previewError instanceof Error ? previewError.message : "Mostra nu a putut fi verificată.");
          return;
        }
      }
      timer = setTimeout(poll, 4_000);
    };
    timer = setTimeout(poll, 1_500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeAlbumPreview]);

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
          album?: typeof album;
          monsterSameChild?: boolean;
          monster?: typeof monster;
          emergencySameChild?: boolean;
          emergency?: typeof emergency;
          albumPreview?: typeof albumPreview;
        };
        if (draft.album) setAlbum(draft.album);
        if (typeof draft.monsterSameChild === "boolean") setMonsterSameChild(draft.monsterSameChild);
        if (draft.monster) setMonster(draft.monster);
        if (typeof draft.emergencySameChild === "boolean") setEmergencySameChild(draft.emergencySameChild);
        if (draft.emergency) setEmergency(draft.emergency);
        if (draft.albumPreview) {
          const restoredFingerprint = JSON.stringify({
            album: draft.album || album,
            monsterSameChild: draft.monsterSameChild ?? monsterSameChild,
            monster: draft.monster || monster,
            emergencySameChild: draft.emergencySameChild ?? emergencySameChild,
            emergency: draft.emergency || emergency,
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

  const summaries = useMemo(() => [
    { icon: BookHeart, title: "Povestea Magică", name: album.name, detail: albumWorldOptions.find((option) => option.id === album.world)?.label || "Lume magică" },
    { icon: ShieldCheck, title: "Scutul de Noapte", name: effectiveMonsterName, detail: monsters.find(([id]) => id === monster.type)?.[1] || "Ritual de noapte" },
    { icon: TimerReset, title: "Trusa de Răbdare", name: effectiveEmergencyName, detail: contexts.find(([id]) => id === emergency.context)?.[1] || "Moment de așteptare" },
  ], [album.name, album.world, effectiveEmergencyName, effectiveMonsterName, emergency.context, monster.type]);

  function goToStep(next: number) {
    setStep(next);
    window.setTimeout(() => stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function nextStep() {
    setError("");
    if (step === 0 && !album.name.trim()) return setError("Scrie numele copilului pentru Povestea Magică.");
    if (step === 1 && !effectiveMonsterName.trim()) return setError("Scrie numele copilului pentru Scut.");
    if (step === 2 && !effectiveEmergencyName.trim()) return setError("Scrie numele copilului pentru Trusă.");
    goToStep(Math.min(step + 1, lastStep));
  }

  function buildItems() {
    return [
      { product: "album" as const, configuration: {
        generation: {
          type: "album", name: album.name.trim(), age: album.age, hairStyle: album.hairStyle, hairColor: album.hairColor,
          eyeColor: album.eyeColor, skinTone: album.skinTone, outfit: album.outfit.trim(), appearanceDetail: album.appearanceDetail.trim(),
          favoriteColor: album.favoriteColor, world: album.world, customWorld: album.customWorld.trim(), companion: album.companion,
          secondaryCharacterName: album.secondaryCharacterName.trim(), secondaryCharacterRole: album.secondaryCharacterRole.trim(),
          secondaryCharacterAppearance: album.secondaryCharacterAppearance.trim(), lesson: album.lesson, mood: album.mood, artStyle: album.artStyle,
          personalDetail: album.personalDetail.trim(), storyContext: album.storyContext.trim(), referenceMode: referencePhoto ? "photo" : "description",
        },
        dedication: album.dedication.trim(), dedicationFrom: album.dedicationFrom.trim(),
      } },
      { product: "monster" as const, configuration: { generation: { type: "monster", name: effectiveMonsterName.trim(), monster: monster.type, context: monster.location.trim(), interest: monster.helper.trim(), tone: monster.ritual.trim() } } },
      { product: "emergency" as const, configuration: { generation: { type: "emergency", name: effectiveEmergencyName.trim(), age: effectiveEmergencyAge, context: emergency.context, interest: emergency.interest.trim(), duration: emergency.duration, activityMode: emergency.activityMode } } },
    ];
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
      const payload = await response.json() as { orderId?: string; previewUrl?: string; statusUrl?: string; title?: string; qualityChecked?: boolean; error?: string };
      if (!response.ok || !payload.orderId || !payload.previewUrl || !payload.statusUrl || !payload.title) throw new Error(payload.error || "Coperta nu a putut fi creată.");
      setAlbumPreview({ orderId: payload.orderId, imageUrl: payload.previewUrl, statusUrl: payload.statusUrl, title: payload.title, fingerprint: bundleFingerprint, qualityChecked: payload.qualityChecked === true, pages: [{ kind: "cover", imageUrl: payload.previewUrl, eyebrow: "Povestea Magică", title: payload.title, text: `O aventură creată pentru ${album.name}` }], ready: false });
      setHasConsent(false);
      setError("Coperta este gata. Pregătim două pagini reale din poveste înainte să deschidem plata.");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Coperta nu a putut fi creată.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startCheckout() {
    if (!activeAlbumPreview) return createCompleteBundlePreview();
    if (!activeAlbumPreview.ready) return setError("Așteaptă câteva momente: cele două pagini de preview sunt încă în lucru.");
    if (!hasConsent) return setError("Confirmă livrarea imediată înainte de plată.");
    setError("");
    setIsLoading(true);
    trackEvent("product_started", { product: "bundle" });
    try {
      try {
        window.sessionStorage.setItem(draftKey, JSON.stringify({ album, monsterSameChild, monster, emergencySameChild, emergency, albumPreview: activeAlbumPreview }));
      } catch {
        // Checkout remains available when browser storage is disabled.
      }
      await beginPreparedOrderCheckout("complete-bundle", activeAlbumPreview.orderId);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Nu am putut deschide plata.");
      setIsLoading(false);
    }
  }

  return (
    <section className="px-5 py-12 sm:px-6 md:py-18">
      <div className="mx-auto max-w-5xl">
        <ol ref={stepsRef} className="grid scroll-mt-28 grid-cols-4 border-y border-brand-navy/15" aria-label="Pașii personalizării">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const complete = index < step;
            return <li key={item.title} className={`flex min-h-20 items-center justify-center gap-2 border-r border-brand-navy/10 px-1 text-center last:border-r-0 sm:px-2 ${active ? "bg-brand-navy text-brand-cream" : complete ? "bg-brand-gold/15 text-brand-navy" : "text-brand-navy/45"}`}><Icon size={18} /><span className="hidden text-xs font-black uppercase tracking-[0.1em] md:inline">{item.title}</span><span className="text-xs font-black md:hidden">{index + 1}</span></li>;
          })}
        </ol>

        <div className="mx-auto mt-10 max-w-3xl">
          {step === 0 && <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">1 din 4 · Povestea Magică</p>
            <h2 className="mt-3 font-serif text-4xl text-brand-navy">Personajul, lumea și aventura</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/60">Cartea ilustrată și caietul de activități pornesc din aceleași detalii, pentru o experiență coerentă.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Numele copilului<input className={inputClass} value={album.name} maxLength={40} onChange={(event) => setAlbum({ ...album, name: event.target.value })} placeholder="Exemplu: Eva" /></label>
              <label className={labelClass}>Vârsta<select className={inputClass} value={album.age} onChange={(event) => setAlbum({ ...album, age: event.target.value })}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} ani</option>)}</select></label>
              <label className={labelClass}>Coafura<select className={inputClass} value={album.hairStyle} onChange={(event) => setAlbum({ ...album, hairStyle: event.target.value })}><option>scurt și drept</option><option>ondulat până la umeri</option><option>lung și drept</option><option>creț</option><option>două împletituri</option></select></label>
              <label className={labelClass}>Culoarea părului<select className={inputClass} value={album.hairColor} onChange={(event) => setAlbum({ ...album, hairColor: event.target.value })}><option>șaten</option><option>blond</option><option>brunet</option><option>roșcat</option><option>negru</option></select></label>
              <label className={labelClass}>Culoarea ochilor<select className={inputClass} value={album.eyeColor} onChange={(event) => setAlbum({ ...album, eyeColor: event.target.value })}><option>căprui</option><option>albaștri</option><option>verzi</option><option>cenușii</option><option>negri</option></select></label>
              <label className={labelClass}>Nuanța pielii<select className={inputClass} value={album.skinTone} onChange={(event) => setAlbum({ ...album, skinTone: event.target.value })}><option>deschisă</option><option>medie</option><option>măslinie</option><option>închisă</option></select></label>
              <label className={`${labelClass} sm:col-span-2`}>Ținuta personajului<input className={inputClass} value={album.outfit} maxLength={100} onChange={(event) => setAlbum({ ...album, outfit: event.target.value })} placeholder="Exemplu: rochiță galbenă și cizme mov" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Alte detalii de aspect<textarea className={`${inputClass} min-h-20 resize-y`} value={album.appearanceDetail} maxLength={240} onChange={(event) => setAlbum({ ...album, appearanceDetail: event.target.value })} placeholder="Ochelari, pistrui sau un accesoriu preferat" /></label>

              <div className="rounded-md border border-brand-gold/50 bg-brand-gold/10 p-5 sm:col-span-2">
                <div className="flex gap-3"><Camera size={21} className="shrink-0 text-brand-purple" /><div><p className="text-sm font-black text-brand-navy">Fotografie de referință, opțional</p><p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">O folosim privat pentru a păstra mai bine trăsăturile personajului ilustrat.</p></div></div>
                {referencePhoto ? <div className="mt-4 grid gap-4 sm:grid-cols-[86px_1fr] sm:items-center">
                  <Image src={referencePhoto} alt="Fotografia de referință selectată" width={86} height={86} unoptimized className="h-[86px] w-[86px] rounded-md border border-brand-gold/60 object-cover" />
                  <div><label className="flex cursor-pointer items-start gap-3 text-xs font-bold leading-relaxed text-brand-navy/75"><input type="checkbox" checked={photoConsent} onChange={(event) => setPhotoConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-purple" />Confirm că am dreptul să folosesc fotografia copilului pentru această comandă.</label><button type="button" onClick={() => { setReferencePhoto(""); setPhotoConsent(false); setAlbumPreview(null); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-brand-purple"><Trash2 size={15} /> Elimină fotografia</button></div>
                </div> : <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-brand-navy/20 bg-white px-4 text-xs font-black text-brand-navy"><Camera size={16} /> Alege fotografia<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; void prepareReferencePhoto(file).then((prepared) => { setReferencePhoto(prepared); setPhotoConsent(false); setAlbumPreview(null); setError(""); }).catch((photoError) => setError(photoError instanceof Error ? photoError.message : "Fotografia nu a putut fi pregătită.")); }} /></label>}
              </div>

              <label className={labelClass}>Culoarea preferată<select className={inputClass} value={album.favoriteColor} onChange={(event) => setAlbum({ ...album, favoriteColor: event.target.value })}><option>mov ametist</option><option>albastru ceresc</option><option>verde smarald</option><option>roz zmeură</option><option>galben solar</option></select></label>
              <label className={labelClass}>Lumea poveștii<select className={inputClass} value={album.world} onChange={(event) => setAlbum({ ...album, world: event.target.value })}>{albumWorldOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              {album.world === "custom" && <label className={`${labelClass} sm:col-span-2`}>Descrie lumea voastră<input className={inputClass} value={album.customWorld} maxLength={180} onChange={(event) => setAlbum({ ...album, customWorld: event.target.value })} placeholder="Un oraș din dulciuri, o insulă cu balene zburătoare..." /></label>}
              <label className={labelClass}>Companion<select className={inputClass} value={album.companion} onChange={(event) => setAlbum({ ...album, companion: event.target.value })}>{albumCompanionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className={labelClass}>Ce descoperim împreună<select className={inputClass} value={album.lesson} onChange={(event) => setAlbum({ ...album, lesson: event.target.value })}>{albumLessonOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className={labelClass}>Atmosfera<select className={inputClass} value={album.mood} onChange={(event) => setAlbum({ ...album, mood: event.target.value })}>{albumMoodOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className={labelClass}>Stilul ilustrațiilor<select className={inputClass} value={album.artStyle} onChange={(event) => setAlbum({ ...album, artStyle: event.target.value })}>{albumArtStyleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>

              <div className="border-y border-brand-navy/12 py-5 sm:col-span-2"><p className="text-sm font-black text-brand-navy">Un al doilea personaj, opțional</p><p className="mt-1 text-xs font-semibold text-brand-navy/55">Poate fi un frate, o soră, un prieten sau un adult apropiat.</p></div>
              <label className={labelClass}>Numele lui<input className={inputClass} value={album.secondaryCharacterName} maxLength={40} onChange={(event) => setAlbum({ ...album, secondaryCharacterName: event.target.value })} placeholder="Exemplu: Eva" /></label>
              <label className={labelClass}>Rolul în poveste<input className={inputClass} value={album.secondaryCharacterRole} maxLength={80} onChange={(event) => setAlbum({ ...album, secondaryCharacterRole: event.target.value })} placeholder="Sora mai mare" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Cum arată<input className={inputClass} value={album.secondaryCharacterAppearance} maxLength={180} onChange={(event) => setAlbum({ ...album, secondaryCharacterAppearance: event.target.value })} placeholder="Blondă, cu părul creț și salopetă albastră" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Ideea ta pentru poveste<textarea className={`${inputClass} min-h-32 resize-y`} value={album.storyContext} maxLength={700} onChange={(event) => setAlbum({ ...album, storyContext: event.target.value })} placeholder="Descrie aventura pe care ți-o imaginezi sau lasă câmpul liber" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Un detaliu pe care copilul îl va recunoaște<textarea className={`${inputClass} min-h-24 resize-y`} value={album.personalDetail} maxLength={240} onChange={(event) => setAlbum({ ...album, personalDetail: event.target.value })} placeholder="Un obiect iubit, o pasiune sau un obicei simpatic" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Dedicație<textarea className={`${inputClass} min-h-24 resize-y`} value={album.dedication} maxLength={320} onChange={(event) => setAlbum({ ...album, dedication: event.target.value })} placeholder="Mesajul vostru pentru copil" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Din partea cui<input className={inputClass} value={album.dedicationFrom} maxLength={80} onChange={(event) => setAlbum({ ...album, dedicationFrom: event.target.value })} placeholder="Mama, tata, bunicii..." /></label>
            </div>
          </div>}

          {step === 1 && <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">2 din 4 · Scutul de Noapte</p>
            <h2 className="mt-3 font-serif text-4xl text-brand-navy">Un ritual pentru mai mult curaj</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/60">Șase pagini pentru copil și părinte: poveste, ritual, plan practic și calendar de șapte seri.</p>
            <div className="mt-8 space-y-5">
              <ChildReuse checked={monsterSameChild} onChange={setMonsterSameChild} name={album.name} />
              {!monsterSameChild && <label className={labelClass}>Numele copilului<input className={inputClass} value={monster.name} maxLength={40} onChange={(event) => setMonster({ ...monster, name: event.target.value })} /></label>}
              <label className={labelClass}>Ce vrem să îmblânzim<select className={inputClass} value={monster.type} onChange={(event) => setMonster({ ...monster, type: event.target.value })}>{monsters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className={labelClass}>Unde apare cel mai des<input className={inputClass} value={monster.location} maxLength={180} onChange={(event) => setMonster({ ...monster, location: event.target.value })} placeholder="Lângă pat, în colțul camerei..." /></label>
              <label className={labelClass}>Ce îl liniștește<input className={inputClass} value={monster.helper} maxLength={180} onChange={(event) => setMonster({ ...monster, helper: event.target.value })} placeholder="O lumină de veghe, o îmbrățișare..." /></label>
              <label className={labelClass}>Ritualul vostru de seară<input className={inputClass} value={monster.ritual} maxLength={180} onChange={(event) => setMonster({ ...monster, ritual: event.target.value })} placeholder="Trei respirații și o poveste scurtă" /></label>
            </div>
          </div>}

          {step === 2 && <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">3 din 4 · Trusa de Răbdare</p>
            <h2 className="mt-3 font-serif text-4xl text-brand-navy">Misiuni pentru următoarea așteptare</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/60">Șapte pagini clare, ușor de tipărit și folosit de părinte exact când e nevoie.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><ChildReuse checked={emergencySameChild} onChange={setEmergencySameChild} name={album.name} /></div>
              {!emergencySameChild && <><label className={labelClass}>Numele copilului<input className={inputClass} value={emergency.name} maxLength={40} onChange={(event) => setEmergency({ ...emergency, name: event.target.value })} /></label><label className={labelClass}>Vârsta<select className={inputClass} value={emergency.age} onChange={(event) => setEmergency({ ...emergency, age: event.target.value })}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} ani</option>)}</select></label></>}
              <label className={`${labelClass} sm:col-span-2`}>Unde va fi folosită<select className={inputClass} value={emergency.context} onChange={(event) => setEmergency({ ...emergency, context: event.target.value })}>{contexts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className={`${labelClass} sm:col-span-2`}>Ce îl pasionează<input className={inputClass} value={emergency.interest} maxLength={180} onChange={(event) => setEmergency({ ...emergency, interest: event.target.value })} placeholder="Dinozauri, mașini, desen, animale..." /></label>
              <label className={labelClass}>Cât durează așteptarea<select className={inputClass} value={emergency.duration} onChange={(event) => setEmergency({ ...emergency, duration: event.target.value })}><option>5-10 minute</option><option>10-20 minute</option><option>20+ minute</option></select></label>
              <label className={labelClass}>Tipul activităților<select className={inputClass} value={emergency.activityMode} onChange={(event) => setEmergency({ ...emergency, activityMode: event.target.value })}><option value="liniștite">Liniștite</option><option value="cu mișcare mică">Cu mișcare mică</option><option value="mix">Mix</option></select></label>
            </div>
          </div>}

          {step === lastStep && <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">4 din 4 · Rezumat</p>
            <h2 className="mt-3 font-serif text-4xl text-brand-navy">Trei produse, patru PDF-uri personalizate</h2>
            <div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15">
              {summaries.map((item, index) => <div key={item.title} className="grid gap-3 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"><item.icon className="text-brand-purple" size={25} /><div><h3 className="font-serif text-2xl text-brand-navy">{item.title}</h3><p className="mt-1 text-sm font-bold text-brand-navy/65">Pentru {item.name} · {item.detail}</p></div><button type="button" onClick={() => goToStep(index)} className="w-fit border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Editează</button></div>)}
            </div>
            <div className="mt-8 flex flex-col gap-4 border-b border-brand-gold/50 bg-brand-gold/12 px-5 py-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/55">Valoare individuală 97 lei · economisești 18 lei</p><p className="mt-1 font-serif text-2xl text-brand-navy">Pachetul Complet</p><p className="mt-2 text-xs font-bold text-brand-navy/55">Include cartea ilustrată, caietul de activități, Scutul de Noapte și Trusa de Răbdare.</p></div><p className="font-nunito text-4xl font-black text-brand-purple">79 lei</p></div>

            <div className="mt-7">
              {activeAlbumPreview ? <div>
                {activeAlbumPreview.ready && activeAlbumPreview.pages.length === 3 ? <AlbumPreviewFlipbook pages={activeAlbumPreview.pages} childName={album.name} /> : <div className="overflow-hidden rounded-md border border-brand-gold/60 bg-brand-navy"><div className="relative aspect-[3/2]"><Image src={activeAlbumPreview.imageUrl} alt={`Coperta albumului pentru ${album.name}`} fill unoptimized sizes="(max-width: 768px) 100vw, 768px" className="object-cover" onError={() => setAlbumPreview(null)} /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,44,.78),rgba(7,24,44,.12)_60%,transparent)]" /><div className="absolute inset-y-0 left-0 flex w-[56%] flex-col justify-center p-6 text-brand-cream"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-gold">Preview personalizat</p><p className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">{activeAlbumPreview.title}</p></div></div><div className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-cream/75"><LoaderCircle size={16} className="animate-spin text-brand-gold" />Scriem povestea și ilustrăm două pagini pentru mostră.</div></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-x border-b border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-xs font-bold text-brand-navy/70"><p className="flex items-center gap-2">{activeAlbumPreview.ready ? <Check size={16} className="text-brand-purple" /> : <LoaderCircle size={16} className="animate-spin text-brand-purple" />}{activeAlbumPreview.ready ? `Cele trei pagini vor fi refolosite în carte${activeAlbumPreview.qualityChecked ? " și au trecut controlul automat" : ""}.` : "Plata rămâne blocată până când mostra este completă."}</p><button type="button" onClick={() => { setAlbumPreview(null); setHasConsent(false); }} className="inline-flex min-h-9 items-center gap-2 border-b border-brand-purple text-[11px] font-black text-brand-purple"><RefreshCw size={14} /> Altă variantă</button></div>
              </div> : <div className="flex gap-4 rounded-md border border-brand-purple/25 bg-brand-purple/[0.06] p-5"><Eye size={23} className="shrink-0 text-brand-purple" /><div><p className="font-black text-brand-navy">Răsfoiește înainte de plată</p><p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">Creăm coperta și două pagini reale. Plata se deschide numai după ce vezi rezultatul.</p></div></div>}
            </div>
            {activeAlbumPreview?.ready && <div className="mt-7"><DigitalPurchaseConsent checked={hasConsent} onCheckedChange={setHasConsent} productLabel="Pachetul Complet" /></div>}
          </div>}

          {error && <p role="alert" className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
          <div className="mb-20 mt-8 flex items-center justify-between gap-4 border-t border-brand-navy/12 pt-6 sm:mb-0">
            {step > 0 ? <button type="button" onClick={() => { setError(""); goToStep(step - 1); }} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-brand-navy/20 px-5 text-sm font-black text-brand-navy"><ArrowLeft size={18} /> Înapoi</button> : <span />}
            {step < lastStep ? <button type="button" onClick={nextStep} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-navy px-6 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Continuă <ArrowRight size={18} /></button> : <button type="button" onClick={startCheckout} disabled={isLoading || Boolean(activeAlbumPreview && !activeAlbumPreview.ready)} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-purple px-6 text-sm font-black text-white transition-colors hover:bg-brand-navy disabled:cursor-wait disabled:opacity-70">{isLoading ? <><LoaderCircle className="animate-spin" size={18} /> {!activeAlbumPreview ? "Creăm coperta" : "Se deschide plata"}</> : <><Sparkles size={18} /> {!activeAlbumPreview ? "Vezi mostra" : !activeAlbumPreview.ready ? "Pregătim paginile" : "Continuă către plată"}</>}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
