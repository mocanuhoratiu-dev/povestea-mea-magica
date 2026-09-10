"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, Sparkles, Square, Volume2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { albumArtStyleOptions, albumCompanionOptions, albumLessonOptions, albumMoodOptions, albumWorldOptions } from "@/lib/album/types";
import { trackEvent } from "@/lib/clientTelemetry";
import { lumiContextPrompt, lumiGenerationCopy, lumiStateCopy, lumiStateForGuideStep, type LumiGenerationDetail } from "@/lib/lumiExperience";
import { playNarration, stopNarration as stopSharedNarration, subscribeToNarration } from "@/lib/narrationPlayback";

const LUMI_NARRATION_OWNER = "lumi-guide";
const totalSteps = 8;
const LumiVisual3D = dynamic(() => import("./LumiVisual3D"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full w-full bg-[url('/lumi-guardian.webp')] bg-contain bg-center bg-no-repeat" />,
});

type LumiDraft = {
  name: string;
  age: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: string;
  appearanceDetail: string;
  favoriteColor: string;
  world: string;
  customWorld: string;
  companion: string;
  secondaryCharacterName: string;
  secondaryCharacterRole: string;
  secondaryCharacterAppearance: string;
  lesson: string;
  mood: string;
  artStyle: string;
  storyContext: string;
  personalDetail: string;
  dedication: string;
  dedicationFrom: string;
};

const initialDraft: LumiDraft = {
  name: "",
  age: "5",
  hairStyle: "ondulat până la umeri",
  hairColor: "șaten",
  eyeColor: "căprui",
  skinTone: "deschisă",
  outfit: "pulover moale și pantaloni comozi",
  appearanceDetail: "",
  favoriteColor: "mov ametist",
  world: albumWorldOptions[0].id,
  customWorld: "",
  companion: albumCompanionOptions[0],
  secondaryCharacterName: "",
  secondaryCharacterRole: "",
  secondaryCharacterAppearance: "",
  lesson: albumLessonOptions[0],
  mood: albumMoodOptions[0],
  artStyle: albumArtStyleOptions[0],
  storyContext: "",
  personalDetail: "",
  dedication: "",
  dedicationFrom: "",
};

const prompts = [
  "Bună, sunt Lumi. Cum îl cheamă pe eroul nostru?",
  "Câți ani are? Voi potrivi povestea vârstei lui.",
  "Cum arată? Păstrăm aceste trăsături în fiecare scenă.",
  "În ce lume începe aventura? Poți alege sau inventa una.",
  "Cine îl însoțește? Alegem un companion și, dacă vrei, o persoană dragă.",
  "Ce descoperă și ce atmosferă va avea cartea?",
  "Spune-mi un detaliu pe care îl va recunoaște imediat.",
  "Lăsăm și un mesaj din partea familiei?",
] as const;

const chapterLabels = ["Eroul", "Vârsta", "Portretul", "Lumea", "Companionii", "Firul poveștii", "Detaliul vostru", "Dedicația"] as const;

const inputClass = "mt-2 min-h-12 w-full rounded-[4px] border border-brand-navy/18 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15";
const labelClass = "block text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/55";

function choiceClass(active: boolean) {
  return `min-h-11 rounded-[4px] border px-3 py-2 text-left text-xs font-black transition ${active ? "border-brand-purple bg-brand-purple text-white" : "border-brand-navy/14 bg-white text-brand-navy hover:border-brand-purple/50"}`;
}

export default function LumiGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [launcherCompact, setLauncherCompact] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(max-width: 700px)").matches) setLauncherCompact(true);
    const compact = () => { if (window.scrollY > 160) setLauncherCompact(true); };
    const timer = window.setTimeout(() => setLauncherCompact(true), 8000);
    window.addEventListener("scroll", compact, {passive:true});
    return () => {window.clearTimeout(timer); window.removeEventListener("scroll", compact);};
  }, []);
  const [isAlbumEditing, setAlbumEditing] = useState(false);
  useEffect(() => {
    const node = document.getElementById("configureaza-albumul");
    if (!node) { setAlbumEditing(false); return; }
    const observer = new IntersectionObserver(([entry]) => setAlbumEditing(entry.isIntersecting), {threshold:0});
    observer.observe(node); return () => observer.disconnect();
  }, [pathname]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<LumiDraft>(initialDraft);
  const [error, setError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [contextStep, setContextStep] = useState(0);
  const [contextName, setContextName] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const [generation, setGeneration] = useState<LumiGenerationDetail>({ phase: "idle", progress: 0 });
  const generationResetTimer = useRef<number | null>(null);

  const guideVisualState = lumiStateForGuideStep(step, totalSteps);
  const visualState = generation.phase !== "idle" ? lumiGenerationCopy[generation.phase].visualState : guideVisualState;
  const visualTitle = generation.phase !== "idle" ? lumiGenerationCopy[generation.phase].title : lumiStateCopy[visualState].label;
  const contextualLauncherLabel = pathname === "/povestea-magica"
    ? ["Începem cu eroul", "Alegem lumea", "Adăugăm detaliul vostru", "Verificăm mostra"][contextStep]
    : "Construim povestea";
  const launcherCopy = useMemo(() => {
    if (generation.phase !== "idle") return generation.message || lumiGenerationCopy[generation.phase].message;
    if (pathname === "/povestea-magica") return lumiContextPrompt(contextStep, contextName);
    return "Bună, sunt Lumi. Construim împreună o poveste numai a copilului tău?";
  }, [contextName, contextStep, generation, pathname]);

  useEffect(() => {
    const openGuide = () => {
      trackEvent("lumi_opened");
      setIsOpen(true);
      setShowNudge(false);
      try { window.sessionStorage.setItem("pmm-lumi-nudge-seen", "1"); } catch {}
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("pmm:lumi-request-context")), 0);
    };
    window.addEventListener("pmm:lumi-open", openGuide);
    return () => window.removeEventListener("pmm:lumi-open", openGuide);
  }, []);

  useEffect(() => {
    const receiveContext = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
      if (typeof detail.step === "number") setContextStep(Math.max(0, Math.min(3, detail.step)));
      if (typeof detail.name === "string") setContextName(detail.name.slice(0, 40));
      const incoming = detail.draft;
      if (!incoming || typeof incoming !== "object") return;
      const next = incoming as Partial<LumiDraft>;
      setDraft((current) => {
        const merged = { ...current };
        for (const key of Object.keys(current) as (keyof LumiDraft)[]) {
          const value = next[key];
          if (typeof value === "string") Object.assign(merged, { [key]: value });
        }
        return merged;
      });
    };
    const receiveGeneration = (event: Event) => {
      const detail = (event as CustomEvent<LumiGenerationDetail>).detail;
      if (!detail || !lumiGenerationCopy[detail.phase]) return;
      if (generationResetTimer.current !== null) {
        window.clearTimeout(generationResetTimer.current);
        generationResetTimer.current = null;
      }
      setGeneration({ phase: detail.phase, progress: Math.max(0, Math.min(100, detail.progress)), message: detail.message });
      if (detail.phase === "ready") {
        generationResetTimer.current = window.setTimeout(() => {
          setGeneration({ phase: "idle", progress: 0 });
          generationResetTimer.current = null;
        }, 8_000);
      }
    };
    window.addEventListener("pmm:album-context-change", receiveContext);
    window.addEventListener("pmm:lumi-generation-state", receiveGeneration);
    return () => {
      window.removeEventListener("pmm:album-context-change", receiveContext);
      window.removeEventListener("pmm:lumi-generation-state", receiveGeneration);
      if (generationResetTimer.current !== null) window.clearTimeout(generationResetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem("pmm-lumi-nudge-seen");
    if (dismissed) return;
    const timer = window.setTimeout(() => setShowNudge(true), 2_800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pmm:lumi-open-change", { detail: { isOpen } }));
    if (!isOpen) stopSharedNarration(LUMI_NARRATION_OWNER);
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setIsOpen(false); setLauncherCompact(true); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration(({ owner, phase }) => setIsSpeaking(owner === LUMI_NARRATION_OWNER && phase !== "idle"));
    return () => { unsubscribe(); stopSharedNarration(LUMI_NARRATION_OWNER); };
  }, []);

  useEffect(() => {
    if (!isOpen || !draft.name.trim() || pathname !== "/povestea-magica") return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("pmm:lumi-album-draft", { detail: { ...draft, partial: true } }));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [draft, isOpen, pathname]);

  const update = <K extends keyof LumiDraft>(key: K, value: LumiDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const validate = () => {
    if (step === 0 && draft.name.trim().length < 2) return "Scrie prenumele copilului pentru a continua.";
    if (step === 3 && draft.world === "custom" && draft.customWorld.trim().length < 5) return "Descrie lumea inventată în câteva cuvinte.";
    if (step === 4 && draft.secondaryCharacterName.trim() && !draft.secondaryCharacterRole.trim()) return "Spune-ne ce legătură are acest personaj cu copilul.";
    return "";
  };

  const next = () => {
    const message = validate();
    if (message) { setError(message); return; }
    setError("");
    setStep((current) => Math.min(totalSteps, current + 1));
  };

  const reset = () => {
    stopSharedNarration(LUMI_NARRATION_OWNER);
    setDraft(initialDraft);
    setStep(0);
    setError("");
  };

  const dismissNudge = () => {
    setShowNudge(false);
    try { window.sessionStorage.setItem("pmm-lumi-nudge-seen", "1"); } catch {}
  };

  const toggleVoice = async () => {
    if (isSpeaking) { stopSharedNarration(LUMI_NARRATION_OWNER); return; }
    const text = step < totalSteps ? prompts[step] : `Povestea Magică pentru ${draft.name} este pregătită pentru mostră. Poți verifica toate alegerile înainte să continuăm.`;
    try {
      const started = await playNarration(LUMI_NARRATION_OWNER, text, "lumi");
      if (started) trackEvent("lumi_voice_played");
    } catch {
      setError("Vocea lui Lumi nu poate fi pregătită chiar acum.");
    }
  };

  const apply = () => {
    setIsApplying(true);
    const payload = { ...draft, name: draft.name.trim(), appearanceDetail: draft.appearanceDetail.trim(), customWorld: draft.customWorld.trim(), secondaryCharacterName: draft.secondaryCharacterName.trim(), secondaryCharacterRole: draft.secondaryCharacterRole.trim(), secondaryCharacterAppearance: draft.secondaryCharacterAppearance.trim(), storyContext: draft.storyContext.trim(), personalDetail: draft.personalDetail.trim(), dedication: draft.dedication.trim(), dedicationFrom: draft.dedicationFrom.trim() };
    try {
      window.sessionStorage.setItem("pmm-lumi-album-choice", JSON.stringify(payload));
    } catch {
      // The event below still applies the choices on the current page.
    }
    trackEvent("lumi_recommendation_applied", { product: "album" });
    if (window.location.pathname === "/povestea-magica") {
      try { window.sessionStorage.removeItem("pmm-lumi-album-choice"); } catch {}
      window.dispatchEvent(new CustomEvent("pmm:lumi-album-choice", { detail: payload }));
      document.getElementById("configureaza-albumul")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/povestea-magica?lumi=1#configureaza-albumul");
    }
    window.setTimeout(() => { setIsApplying(false); setIsOpen(false); }, 250);
  };

  const summaryRows = [
    ["Erou", `${draft.name}, ${draft.age} ani`],
    ["Aspect", `${draft.hairStyle}, păr ${draft.hairColor}, ochi ${draft.eyeColor}, ${draft.outfit}${draft.appearanceDetail ? `, ${draft.appearanceDetail}` : ""}`],
    ["Lume", draft.world === "custom" ? draft.customWorld : albumWorldOptions.find((option) => option.id === draft.world)?.label || "Lume magică"],
    ["Companion", draft.companion],
    ...(draft.secondaryCharacterName ? [["Alături de", `${draft.secondaryCharacterName}, ${draft.secondaryCharacterRole}`]] : []),
    ["Descoperă", draft.lesson],
    ["Stil", `${draft.mood} · ${draft.artStyle}`],
  ];

  return (
    <aside className={`fixed z-[80] ${isAlbumEditing && !isOpen ? "hidden" : "bottom-3 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-6 sm:w-[400px]"}`} aria-label="Lumi, ghidul pentru Povestea Magică" data-lumi-state={visualState} data-lumi-compact={isAlbumEditing && !isOpen}>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section key="guide" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .97 }} className="relative min-h-0">
            <span aria-hidden="true" className="pointer-events-none absolute -inset-x-1 bottom-0 top-4 bg-brand-cream/70 [clip-path:polygon(0_1%,48%_0,50%_1%,52%_0,100%_1%,100%_98%,52%_100%,50%_99%,48%_100%,0_98%)] shadow-[0_24px_70px_rgba(15,25,48,.28)]" />
            <div role="dialog" aria-label="Creează povestea cu Lumi" className="relative flex max-h-[min(640px,calc(100dvh-5rem))] min-h-0 flex-col overflow-hidden rounded-[8px] border border-brand-gold/55 bg-brand-cream shadow-[0_24px_70px_rgba(15,25,48,.32)]">
              <header className="relative min-h-[96px] shrink-0 overflow-hidden border-b border-brand-navy/10 bg-brand-cream px-5 pb-4 pt-4 pr-28">
                <span aria-hidden="true" className="absolute inset-y-4 left-1/2 w-px bg-brand-navy/[.05]" />
                <p className="text-xs text-brand-purple">Povestea voastră, cu Lumi</p>
                <h2 className="mt-2 max-w-[240px] font-serif text-[25px] leading-tight text-brand-navy">{step < totalSteps ? chapterLabels[step] : "Ultima privire"}</h2>
                <LumiVisual3D state={visualState} className="absolute -bottom-2 right-12 h-[88px] w-[65px]" />
                <button type="button" onClick={() => {setIsOpen(false);setLauncherCompact(true);}} className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-[4px] text-brand-navy/70 transition-colors hover:bg-white hover:text-brand-purple" aria-label="Închide Lumi"><X size={20} /></button>
              </header>

              <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-brand-navy/10 bg-white/45 px-5 py-3">
                <span className="whitespace-nowrap font-serif text-[11px] italic text-brand-navy/52">{step < totalSteps ? `Pasul ${step + 1} din ${totalSteps}` : "Ultima filă"}</span>
                <span className="flex flex-1 items-center justify-center gap-1.5" aria-label={`${Math.round((step / totalSteps) * 100)}% complet`}>
                  {Array.from({ length: totalSteps }, (_, index) => <span key={index} className={`h-1.5 w-1.5 rounded-full border transition-colors ${index < step || step === totalSteps ? "border-brand-gold bg-brand-gold" : index === step ? "border-brand-purple bg-brand-purple shadow-[0_0_0_3px_rgba(128,82,160,.12)]" : "border-brand-navy/20 bg-transparent"}`} />)}
                </span>
              </div>

              <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 custom-scrollbar" data-lenis-prevent>
                <div className="border-b border-brand-navy/10 pb-5">
                  <div className="float-right ml-3"><button type="button" onClick={() => void toggleVoice()} className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] border border-brand-purple/20 bg-white text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple hover:text-white" title={isSpeaking ? "Oprește vocea" : "Ascultă mesajul"} aria-label={isSpeaking ? "Oprește vocea" : "Ascultă mesajul"}>{isSpeaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={18} />}</button></div>
                  <p className="mt-2 font-serif text-[19px] font-bold leading-[1.25] text-brand-navy">{step < totalSteps ? prompts[step] : `Am adunat toate firele poveștii lui ${draft.name}. Verifică-le înainte să le așez în configurator.`}</p>
                </div>

              <div className="mt-5">
                {step === 0 && <label className={labelClass}>Prenumele copilului<input autoFocus className={inputClass} value={draft.name} onChange={(event) => update("name", event.target.value.slice(0, 40))} placeholder="Exemplu: Erica" onKeyDown={(event) => { if (event.key === "Enter") next(); }} /></label>}
                {step === 1 && <div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }, (_, index) => String(index + 2)).map((age) => <button key={age} type="button" onClick={() => update("age", age)} className={choiceClass(draft.age === age)}>{age} ani</button>)}</div>}
                {step === 2 && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className={labelClass}>Coafura<select className={inputClass} value={draft.hairStyle} onChange={(event) => update("hairStyle", event.target.value)}><option>scurt și drept</option><option>ondulat până la umeri</option><option>lung și drept</option><option>creț</option><option>două împletituri</option></select></label><label className={labelClass}>Culoarea părului<select className={inputClass} value={draft.hairColor} onChange={(event) => update("hairColor", event.target.value)}><option>șaten</option><option>blond</option><option>brunet</option><option>roșcat</option><option>negru</option></select></label><label className={labelClass}>Ochii<select className={inputClass} value={draft.eyeColor} onChange={(event) => update("eyeColor", event.target.value)}><option>căprui</option><option>albaștri</option><option>verzi</option><option>cenușii</option><option>negri</option></select></label><label className={labelClass}>Nuanța pielii<select className={inputClass} value={draft.skinTone} onChange={(event) => update("skinTone", event.target.value)}><option>deschisă</option><option>medie</option><option>măslinie</option><option>închisă</option></select></label></div><label className={labelClass}>Ținuta<input className={inputClass} value={draft.outfit} onChange={(event) => update("outfit", event.target.value.slice(0, 100))} placeholder="Rochie galbenă și cizme mov" /></label><label className={labelClass}>Semne distinctive, opțional<textarea className={`${inputClass} min-h-20 resize-y`} value={draft.appearanceDetail} onChange={(event) => update("appearanceDetail", event.target.value.slice(0, 240))} placeholder="Pistrui, ochelari, accesoriul preferat..." /></label><p className="text-xs font-semibold leading-relaxed text-brand-navy/55">Fotografia poate fi adăugată în configurator după ce Lumi așază alegerile.</p></div>}
                {step === 3 && <div><div className="grid gap-2 sm:grid-cols-2">{albumWorldOptions.map((option) => <button key={option.id} type="button" onClick={() => update("world", option.id)} className={choiceClass(draft.world === option.id)}>{option.label}</button>)}{draft.world === "custom" && <label className={`${labelClass} sm:col-span-2`}>Descrie lumea<textarea autoFocus className={`${inputClass} min-h-24 resize-y`} value={draft.customWorld} onChange={(event) => update("customWorld", event.target.value.slice(0, 280))} placeholder="O lume roz a zânelor, cu poduri din flori și stele care cântă..." /></label>}</div><label className={`${labelClass} mt-4`}>Culoarea preferată<select className={inputClass} value={draft.favoriteColor} onChange={(event) => update("favoriteColor", event.target.value)}><option>mov ametist</option><option>albastru ceresc</option><option>verde smarald</option><option>roz zmeură</option><option>galben solar</option></select></label></div>}
                {step === 4 && <div className="space-y-4"><label className={labelClass}>Companion magic<select className={inputClass} value={draft.companion} onChange={(event) => update("companion", event.target.value)}>{albumCompanionOptions.map((option) => <option key={option}>{option}</option>)}</select></label><div className="border-t border-brand-navy/10 pt-4"><p className="text-xs font-black text-brand-navy">Adăugăm și o persoană dragă? <span className="font-semibold text-brand-navy/50">Opțional</span></p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={labelClass}>Prenume<input className={inputClass} value={draft.secondaryCharacterName} onChange={(event) => update("secondaryCharacterName", event.target.value.slice(0, 40))} placeholder="Exemplu: Eva" /></label><label className={labelClass}>Relația<input className={inputClass} value={draft.secondaryCharacterRole} onChange={(event) => update("secondaryCharacterRole", event.target.value.slice(0, 60))} placeholder="sora mai mare" /></label></div><label className={`${labelClass} mt-3`}>Cum arată?<input className={inputClass} value={draft.secondaryCharacterAppearance} onChange={(event) => update("secondaryCharacterAppearance", event.target.value.slice(0, 180))} placeholder="blondă, cu părul creț și rochie albastră" /></label></div></div>}
                {step === 5 && <div className="space-y-4"><div className="grid gap-2">{albumLessonOptions.map((option) => <button key={option} type="button" onClick={() => update("lesson", option)} className={choiceClass(draft.lesson === option)}>{option}</button>)}</div><div className="grid grid-cols-2 gap-3 border-t border-brand-navy/10 pt-4"><label className={labelClass}>Atmosfera<select className={inputClass} value={draft.mood} onChange={(event) => update("mood", event.target.value)}>{albumMoodOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label className={labelClass}>Stilul<select className={inputClass} value={draft.artStyle} onChange={(event) => update("artStyle", event.target.value)}>{albumArtStyleOptions.map((option) => <option key={option}>{option}</option>)}</select></label></div></div>}
                {step === 6 && <div className="space-y-4"><label className={labelClass}>Ideea aventurii, opțional<textarea className={`${inputClass} min-h-28 resize-y`} value={draft.storyContext} onChange={(event) => update("storyContext", event.target.value.slice(0, 700))} placeholder="Lasă povestea liberă sau spune ce ți-ai imaginat..." /></label><label className={labelClass}>Un detaliu pe care îl va recunoaște<textarea className={`${inputClass} min-h-20 resize-y`} value={draft.personalDetail} onChange={(event) => update("personalDetail", event.target.value.slice(0, 240))} placeholder="Iubește clătitele cu afine și poartă un rucsac cu stele..." /></label></div>}
                {step === 7 && <div className="space-y-4"><label className={labelClass}>Dedicație<textarea className={`${inputClass} min-h-28 resize-y`} value={draft.dedication} onChange={(event) => update("dedication", event.target.value.slice(0, 320))} placeholder={`Pentru ${draft.name || "micuțul nostru"}, cu drag...`} /></label><label className={labelClass}>Semnătura familiei<input className={inputClass} value={draft.dedicationFrom} onChange={(event) => update("dedicationFrom", event.target.value.slice(0, 80))} placeholder="Cu drag, Mama și Tata" /></label></div>}
                {step === totalSteps && <div className="divide-y divide-brand-navy/10 border-y border-brand-navy/12">{summaryRows.map(([label, value]) => <div key={label} className="grid grid-cols-[86px_1fr] gap-3 py-3 text-xs"><span className="font-black text-brand-navy/45">{label}</span><span className="font-bold leading-relaxed text-brand-navy">{value}</span></div>)}</div>}
              </div>
              {error && <p role="alert" className="mt-4 border-l-4 border-brand-pink bg-brand-pink/10 px-3 py-2 text-xs font-bold text-brand-navy">{error}</p>}
            </div>

              <footer className="relative z-10 shrink-0 border-t border-brand-navy/12 bg-brand-cream px-5 pb-[max(.8rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => step > 0 ? setStep((current) => current - 1) : reset()} className="inline-flex min-h-10 items-center gap-2 px-1 font-serif text-[11px] italic text-brand-navy/55 transition-colors hover:text-brand-purple"><ArrowLeft size={14} /> {step > 0 ? "Fila anterioară" : "Reîncepe"}</button>
                  {step < totalSteps ? <button type="button" onClick={next} className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-brand-navy px-5 text-xs font-black text-brand-cream transition-colors hover:bg-brand-purple">Întoarce pagina <ArrowRight size={16} /></button> : <button type="button" onClick={apply} disabled={isApplying} className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-brand-purple px-5 text-xs font-black text-white transition-colors hover:bg-brand-navy disabled:opacity-60">{isApplying ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Așază în poveste</button>}
                </div>
                {step > 0 && <button type="button" onClick={reset} className="mx-auto mt-2 flex items-center gap-1.5 text-[9px] font-black text-brand-navy/38 transition-colors hover:text-brand-purple"><RotateCcw size={11} /> Începe din nou</button>}
              </footer>
            </div>
          </motion.section>
        ) : (
          <motion.div key="launcher" data-launcher-compact={launcherCompact && generation.phase === "idle"} initial={{ opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="lumi-launcher ml-auto w-fit max-w-full">
            {isAlbumEditing ? <button type="button" title="Ajutor de la Lumi" aria-label="Deschide ghidul Lumi și creează povestea" onClick={()=>{setIsOpen(true);dismissNudge();trackEvent("lumi_opened");}} className="flex h-11 items-center gap-2 rounded-full border border-brand-purple/25 bg-white px-3 text-xs font-bold text-brand-purple shadow-md"><img src="/lumi-guardian.webp" alt="" className="h-9 w-6 object-contain"/>Lumi</button> : <>
            <motion.button type="button" aria-label={generation.phase === "idle" ? "Deschide ghidul Lumi și creează povestea" : `Deschide Lumi. ${visualTitle}`} title={showNudge && generation.phase === "idle" ? launcherCopy : undefined} onClick={() => { trackEvent("lumi_opened"); setIsOpen(true); dismissNudge(); window.setTimeout(() => window.dispatchEvent(new CustomEvent("pmm:lumi-request-context")), 0); }} whileHover={{ y: -4 }} whileTap={{ scale: .98 }} className="group relative ml-auto h-[92px] w-[min(292px,calc(100vw-1.5rem))] border-0 bg-transparent text-left text-brand-navy drop-shadow-[0_17px_20px_rgba(15,25,48,.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-4 sm:h-[108px] sm:w-[330px]">
              <span aria-hidden="true" className="lumi-page-left absolute bottom-0 left-0 h-[68px] w-[58%] border border-brand-navy/14 bg-brand-cream [clip-path:polygon(0_0,90%_7%,100%_100%,0_91%)] transition-colors group-hover:border-brand-gold sm:h-20" />
              <span aria-hidden="true" className="lumi-page-right absolute bottom-0 right-0 h-[68px] w-[58%] border border-brand-navy/14 bg-brand-cream [clip-path:polygon(10%_7%,100%_0,100%_91%,0_100%)] transition-colors group-hover:border-brand-gold sm:h-20" />
              <span aria-hidden="true" className="lumi-page-fold absolute bottom-2 left-1/2 z-10 h-[53px] w-px -translate-x-1/2 bg-brand-navy/10 sm:h-16" />
              <span aria-hidden="true" className="lumi-page-sparkles absolute left-[68px] top-0 z-30 flex items-center gap-1 text-brand-gold sm:left-[78px]"><Sparkles size={15} /><span className="text-[10px]">✦</span><span className="text-[8px]">✦</span></span>
              <span aria-hidden="true" className="lumi-launcher-character absolute bottom-1 left-2 z-20 h-[84px] w-[72px] bg-[url('/lumi-guardian.webp')] bg-contain bg-bottom bg-no-repeat sm:left-3 sm:h-[102px] sm:w-[86px]" />
              <span className="lumi-page-copy absolute bottom-[13px] left-[86px] right-8 z-20 min-w-0 sm:bottom-[15px] sm:left-[104px] sm:right-10">
                <span className="block truncate text-[8px] font-black uppercase tracking-[0.12em] text-brand-purple sm:text-[9px]">{generation.phase === "idle" ? "Creează alături de Lumi" : "Lumi lucrează"}</span>
                <span className="mt-1 block font-serif text-[14px] font-bold leading-tight text-brand-navy sm:text-[16px]">{generation.phase === "idle" ? "Deschidem povestea?" : visualTitle}</span>
                <span className={`mt-0.5 block truncate text-[9px] font-bold text-brand-navy/50 transition-opacity sm:text-[10px] ${showNudge ? "opacity-100" : "opacity-75"}`}>{generation.phase === "idle" ? contextualLauncherLabel : "Urmărește progresul"}</span>
              </span>
              <span aria-hidden="true" className="lumi-page-arrow absolute bottom-[25px] right-2.5 z-20 text-lg font-bold text-brand-purple transition-transform group-hover:translate-x-1 sm:bottom-[30px] sm:right-3.5">→</span>
            </motion.button></>}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
