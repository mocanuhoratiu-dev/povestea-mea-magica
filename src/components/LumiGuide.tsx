"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, Sparkles, Square, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { albumArtStyleOptions, albumCompanionOptions, albumLessonOptions, albumMoodOptions, albumWorldOptions } from "@/lib/album/types";
import { trackEvent } from "@/lib/clientTelemetry";
import { playNarration, stopNarration as stopSharedNarration, subscribeToNarration } from "@/lib/narrationPlayback";

const LUMI_NARRATION_OWNER = "lumi-guide";
const totalSteps = 8;

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
  "Bună, sunt Lumi. Sunt aici să te ajut să creăm Povestea Magică a copilului tău. Începem cu cel mai important detaliu: cum îl cheamă?",
  "Ce vârstă are? Voi potrivi ritmul, vocabularul și lungimea scenelor pentru el.",
  "Cum arată eroul nostru? Fixăm chipul și ținuta pe care le păstrăm de la copertă până la ultima pagină.",
  "În ce lume intră și ce culoare o face să pară a lui? Poți alege un loc sau inventa unul nou.",
  "Cine merge alături de el? Poate avea un companion magic și, opțional, o persoană dragă în poveste.",
  "Ce descoperă în aventură și cum vrei să arate cartea? Alegem sensul, atmosfera și stilul ilustrațiilor.",
  "Dă-mi un detaliu pe care copilul îl va recunoaște imediat. Poți descrie și propria idee pentru aventură.",
  "Ultimul strop de magie: vrei să lăsăm o dedicație din partea familiei?",
] as const;

function LumiSpirit() {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/lumi-guardian.webp");
  const sparkles = useMemo(() => new Float32Array([-1.15, .82, 0, -.92, -.42, .1, -.58, 1.12, -.1, .98, .72, 0, 1.18, -.34, -.1, .45, 1.28, .05, .72, -.92, .12, -.2, -1.08, .05]), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.position.y = Math.sin(time * 1.4) * .07;
      group.current.rotation.y = Math.sin(time * .55) * .07 + state.pointer.x * .1;
    }
    if (orbit.current) orbit.current.rotation.z = time * .22;
  });

  return <group ref={group}>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[sparkles, 3]} /></bufferGeometry><pointsMaterial color="#e5b84f" size={.055} sizeAttenuation transparent opacity={.9} depthWrite={false} /></points>
    <mesh ref={orbit} position={[0, -.08, -.2]}><torusGeometry args={[1.02, .012, 8, 48]} /><meshBasicMaterial color="#e5b84f" transparent opacity={.7} /></mesh>
    <sprite scale={[1.72, 2.58, 1]} position={[0, -.12, .15]}><spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} /></sprite>
  </group>;
}

function LumiVisual({ className }: { className: string }) {
  return <div aria-hidden="true" className={`pointer-events-none ${className}`}><Canvas className="!h-full !w-full" camera={{ position: [0, 0, 4], fov: 30 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}><LumiSpirit /></Canvas></div>;
}

const inputClass = "mt-2 min-h-12 w-full border border-brand-navy/18 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15";
const labelClass = "block text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/55";

function choiceClass(active: boolean) {
  return `min-h-11 border px-3 py-2 text-left text-xs font-black transition ${active ? "border-brand-purple bg-brand-purple text-white" : "border-brand-navy/14 bg-white text-brand-navy hover:border-brand-purple/50"}`;
}

export default function LumiGuide() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<LumiDraft>(initialDraft);
  const [error, setError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const openGuide = () => { trackEvent("lumi_opened"); setIsOpen(true); };
    window.addEventListener("pmm:lumi-open", openGuide);
    return () => window.removeEventListener("pmm:lumi-open", openGuide);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pmm:lumi-open-change", { detail: { isOpen } }));
    if (!isOpen) stopSharedNarration(LUMI_NARRATION_OWNER);
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration(({ owner, phase }) => setIsSpeaking(owner === LUMI_NARRATION_OWNER && phase !== "idle"));
    return () => { unsubscribe(); stopSharedNarration(LUMI_NARRATION_OWNER); };
  }, []);

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

  const toggleVoice = async () => {
    if (isSpeaking) { stopSharedNarration(LUMI_NARRATION_OWNER); return; }
    const text = step < totalSteps ? prompts[step] : `Povestea Magică pentru ${draft.name} este pregătită pentru preview. Poți verifica toate alegerile înainte să continuăm.`;
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
    <aside className="fixed bottom-3 left-2 right-2 z-[9990] sm:bottom-5 sm:left-auto sm:right-6 sm:w-[400px]" aria-label="Lumi, ghidul pentru Povestea Magică">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section key="guide" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .97 }} className="flex max-h-[min(660px,calc(100dvh-5rem))] min-h-0 flex-col overflow-hidden border border-brand-gold/55 bg-brand-cream shadow-[0_24px_70px_rgba(15,25,48,.35)]">
            <header className="relative shrink-0 border-b border-brand-navy/12 bg-brand-navy px-4 py-3 pr-20 text-brand-cream">
              <LumiVisual className="absolute right-8 -top-5 h-20 w-[70px]" />
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-gold">Lumi, păzitoarea Lanternei</p>
              <h2 className="mt-1 max-w-[245px] font-serif text-lg leading-tight">Creăm Povestea Magică</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center border border-white/15 text-brand-cream/70 hover:bg-white/10" aria-label="Închide Lumi"><X size={17} /></button>
            </header>

            <div className="shrink-0 border-b border-brand-navy/10 px-4 py-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/48"><span>{step < totalSteps ? `Pasul ${step + 1} din ${totalSteps}` : "Povestea este conturată"}</span><span>{Math.round((step / totalSteps) * 100)}%</span></div>
              <div className="mt-2 h-1 bg-brand-navy/10"><div className="h-full bg-brand-gold transition-[width]" style={{ width: `${Math.max(4, (step / totalSteps) * 100)}%` }} /></div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 custom-scrollbar" data-lenis-prevent>
              <div className="border-l-2 border-brand-gold pl-3 pr-1">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold leading-relaxed text-brand-navy">{step < totalSteps ? prompts[step] : `Am adunat toate firele poveștii lui ${draft.name}. Verifică-le și schimbă orice detaliu înainte să le așez în configurator.`}</p><button type="button" onClick={() => void toggleVoice()} className="grid h-8 w-8 shrink-0 place-items-center border border-brand-purple/20 text-brand-purple" aria-label={isSpeaking ? "Oprește vocea" : "Ascultă mesajul"}>{isSpeaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={15} />}</button></div>
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

            <footer className="shrink-0 border-t border-brand-navy/12 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => step > 0 ? setStep((current) => current - 1) : reset()} className="inline-flex min-h-10 items-center gap-2 px-1 text-xs font-black text-brand-navy/65"><ArrowLeft size={15} /> {step > 0 ? "Înapoi" : "Reîncepe"}</button>
                {step < totalSteps ? <button type="button" onClick={next} className="inline-flex min-h-11 items-center gap-2 bg-brand-navy px-5 text-xs font-black text-brand-cream">Continuă <ArrowRight size={16} /></button> : <button type="button" onClick={apply} disabled={isApplying} className="inline-flex min-h-11 items-center gap-2 bg-brand-purple px-5 text-xs font-black text-white disabled:opacity-60">{isApplying ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Așază în poveste</button>}
              </div>
              {step > 0 && <button type="button" onClick={reset} className="mx-auto mt-2 flex items-center gap-1.5 text-[10px] font-black text-brand-navy/42"><RotateCcw size={12} /> Începe din nou</button>}
            </footer>
          </motion.section>
        ) : (
          <motion.button key="launcher" type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => { trackEvent("lumi_opened"); setIsOpen(true); }} className="ml-auto flex h-14 items-center gap-2 border border-brand-gold/55 bg-brand-navy pl-3 pr-5 text-brand-cream shadow-[0_14px_35px_rgba(15,25,48,.28)] transition hover:bg-brand-purple" aria-label="Creează Povestea Magică împreună cu Lumi">
            <span className="relative h-12 w-12 overflow-hidden"><LumiVisual className="absolute -inset-2" /></span><span className="text-left"><span className="block text-[9px] font-black uppercase tracking-[0.12em] text-brand-gold">Cu Lumi</span><span className="block text-xs font-black">Creează povestea</span></span><Sparkles size={16} className="text-brand-gold" />
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
