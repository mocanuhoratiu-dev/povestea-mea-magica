"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, LoaderCircle, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { beginOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";

const themes = [
  ["space", "Spațiu"],
  ["forest", "Pădure fermecată"],
  ["castle", "Castel din nori"],
  ["ocean", "Oceanul de cristal"],
  ["dinosaurs", "Valea dinozaurilor"],
  ["clouds", "Orașul din nori"],
] as const;

const lessons = [
  "Curaj și încredere 💪",
  "Împărțitul jucăriilor 🧸",
  "Rutina de somn 🌙",
  "Importanța prieteniei 🤝",
  "Descoperirea naturii 🌱",
] as const;

const tones = ["Liniștită de somn", "Aventură blândă", "Amuzantă", "Emoțională și caldă"] as const;

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

const steps = [
  { title: "Povestea", icon: BookOpen },
  { title: "Scutul", icon: ShieldCheck },
  { title: "Trusa", icon: TimerReset },
  { title: "Rezumat", icon: Check },
];

const inputClass = "mt-2 min-h-12 w-full rounded-md border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition-colors focus:border-brand-purple";
const labelClass = "block text-sm font-black text-brand-navy";

function ChildReuse({ checked, onChange, name }: { checked: boolean; onChange: (value: boolean) => void; name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-brand-navy">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand-purple" />
      Același copil ca în poveste{ name ? `: ${name}` : "" }
    </label>
  );
}

export default function BundleConfigurator() {
  const stepsRef = useRef<HTMLOListElement>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  const [story, setStory] = useState({
    name: "",
    age: "5",
    theme: "forest",
    lesson: lessons[0] as string,
    tone: tones[0] as string,
    details: "",
    dedication: "",
    dedicationFrom: "",
  });
  const [monsterSameChild, setMonsterSameChild] = useState(true);
  const [monster, setMonster] = useState({ name: "", type: "frica de intuneric", location: "", helper: "", ritual: "" });
  const [emergencySameChild, setEmergencySameChild] = useState(true);
  const [emergency, setEmergency] = useState({ name: "", age: "5", context: contexts[0][0] as string, interest: "", duration: "10-20 minute", activityMode: "mix" });

  const effectiveMonsterName = monsterSameChild ? story.name : monster.name;
  const effectiveEmergencyName = emergencySameChild ? story.name : emergency.name;
  const effectiveEmergencyAge = emergencySameChild ? story.age : emergency.age;

  const summaries = useMemo(() => [
    { icon: BookOpen, title: "Poveste lungă", name: story.name, detail: themes.find(([id]) => id === story.theme)?.[1] || "Lume magică" },
    { icon: ShieldCheck, title: "Scutul de Noapte", name: effectiveMonsterName, detail: monsters.find(([id]) => id === monster.type)?.[1] || "Ritual de noapte" },
    { icon: TimerReset, title: "Trusa de Răbdare", name: effectiveEmergencyName, detail: contexts.find(([id]) => id === emergency.context)?.[1] || "Moment de așteptare" },
  ], [story, effectiveMonsterName, monster.type, effectiveEmergencyName, emergency.context]);

  function nextStep() {
    setError("");
    if (step === 0 && !story.name.trim()) {
      setError("Scrie numele copilului pentru poveste.");
      return;
    }
    if (step === 1 && !effectiveMonsterName.trim()) {
      setError("Scrie numele copilului pentru Scut.");
      return;
    }
    if (step === 2 && !effectiveEmergencyName.trim()) {
      setError("Scrie numele copilului pentru Trusă.");
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
    stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function startCheckout() {
    if (!hasConsent) {
      setError("Confirmă livrarea imediată înainte de plată.");
      return;
    }
    setError("");
    setIsLoading(true);
    trackEvent("product_started", { product: "bundle" });
    try {
      await beginOrderCheckout("family-bundle", {
        items: [
          {
            product: "story",
            configuration: {
              generation: { type: "story", name: story.name, age: story.age, theme: story.theme, lesson: story.lesson, context: story.details, tone: story.tone, themeDetail: "", lessonDetail: "", storyLength: "long" },
              dedication: story.dedication,
              dedicationFrom: story.dedicationFrom,
            },
          },
          {
            product: "monster",
            configuration: { generation: { type: "monster", name: effectiveMonsterName, monster: monster.type, context: monster.location, interest: monster.helper, tone: monster.ritual } },
          },
          {
            product: "emergency",
            configuration: { generation: { type: "emergency", name: effectiveEmergencyName, age: effectiveEmergencyAge, context: emergency.context, interest: emergency.interest, duration: emergency.duration, activityMode: emergency.activityMode } },
          },
        ],
      });
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
            return (
              <li key={item.title} className={`flex min-h-20 items-center justify-center gap-2 border-r border-brand-navy/10 px-2 text-center last:border-r-0 ${active ? "bg-brand-navy text-brand-cream" : complete ? "bg-brand-gold/15 text-brand-navy" : "text-brand-navy/45"}`}>
                <Icon size={18} />
                <span className="hidden text-xs font-black uppercase tracking-[0.1em] sm:inline">{item.title}</span>
                <span className="text-xs font-black sm:hidden">{index + 1}</span>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-10 max-w-3xl">
          {step === 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">1 din 4 · Poveste lungă</p>
              <h2 className="mt-3 font-serif text-4xl text-brand-navy">Prima lume din pachet</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Numele copilului<input className={inputClass} value={story.name} maxLength={40} onChange={(event) => setStory({ ...story, name: event.target.value })} /></label>
                <label className={labelClass}>Vârsta<select className={inputClass} value={story.age} onChange={(event) => setStory({ ...story, age: event.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1} ani</option>)}</select></label>
                <label className={labelClass}>Lumea poveștii<select className={inputClass} value={story.theme} onChange={(event) => setStory({ ...story, theme: event.target.value })}>{themes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className={labelClass}>Tonul<select className={inputClass} value={story.tone} onChange={(event) => setStory({ ...story, tone: event.target.value })}>{tones.map((tone) => <option key={tone}>{tone}</option>)}</select></label>
                <label className={`${labelClass} sm:col-span-2`}>Ce învățăm<select className={inputClass} value={story.lesson} onChange={(event) => setStory({ ...story, lesson: event.target.value })}>{lessons.map((lesson) => <option key={lesson}>{lesson}</option>)}</select></label>
                <label className={`${labelClass} sm:col-span-2`}>Un detaliu important<textarea className={`${inputClass} min-h-24 resize-y`} value={story.details} maxLength={420} onChange={(event) => setStory({ ...story, details: event.target.value })} placeholder="O jucărie iubită, o întâmplare sau ceva ce îl face să zâmbească" /></label>
                <label className={`${labelClass} sm:col-span-2`}>Dedicație<textarea className={`${inputClass} min-h-24 resize-y`} value={story.dedication} maxLength={320} onChange={(event) => setStory({ ...story, dedication: event.target.value })} placeholder="Mesajul vostru pentru copil" /></label>
                <label className={`${labelClass} sm:col-span-2`}>Din partea cui<input className={inputClass} value={story.dedicationFrom} maxLength={80} onChange={(event) => setStory({ ...story, dedicationFrom: event.target.value })} placeholder="Mama, tata, bunicii..." /></label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">2 din 4 · Scutul de Noapte</p>
              <h2 className="mt-3 font-serif text-4xl text-brand-navy">Un ritual pentru mai mult curaj</h2>
              <div className="mt-8 space-y-5">
                <ChildReuse checked={monsterSameChild} onChange={setMonsterSameChild} name={story.name} />
                {!monsterSameChild && <label className={labelClass}>Numele copilului<input className={inputClass} value={monster.name} maxLength={40} onChange={(event) => setMonster({ ...monster, name: event.target.value })} /></label>}
                <label className={labelClass}>Ce vrem să îmblânzim<select className={inputClass} value={monster.type} onChange={(event) => setMonster({ ...monster, type: event.target.value })}>{monsters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className={labelClass}>Unde apare cel mai des<input className={inputClass} value={monster.location} maxLength={180} onChange={(event) => setMonster({ ...monster, location: event.target.value })} placeholder="Lângă pat, în colțul camerei..." /></label>
                <label className={labelClass}>Ce îl liniștește<input className={inputClass} value={monster.helper} maxLength={180} onChange={(event) => setMonster({ ...monster, helper: event.target.value })} placeholder="O lumină de veghe, o îmbrățișare..." /></label>
                <label className={labelClass}>Ritualul vostru de seară<input className={inputClass} value={monster.ritual} maxLength={180} onChange={(event) => setMonster({ ...monster, ritual: event.target.value })} placeholder="Trei respirații și o poveste scurtă" /></label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">3 din 4 · Trusa de Răbdare</p>
              <h2 className="mt-3 font-serif text-4xl text-brand-navy">Misiunea pentru următoarea așteptare</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><ChildReuse checked={emergencySameChild} onChange={setEmergencySameChild} name={story.name} /></div>
                {!emergencySameChild && <><label className={labelClass}>Numele copilului<input className={inputClass} value={emergency.name} maxLength={40} onChange={(event) => setEmergency({ ...emergency, name: event.target.value })} /></label><label className={labelClass}>Vârsta<select className={inputClass} value={emergency.age} onChange={(event) => setEmergency({ ...emergency, age: event.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1} ani</option>)}</select></label></>}
                <label className={`${labelClass} sm:col-span-2`}>Unde va fi folosită<select className={inputClass} value={emergency.context} onChange={(event) => setEmergency({ ...emergency, context: event.target.value })}>{contexts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className={`${labelClass} sm:col-span-2`}>Ce îl pasionează<input className={inputClass} value={emergency.interest} maxLength={180} onChange={(event) => setEmergency({ ...emergency, interest: event.target.value })} placeholder="Dinozauri, mașini, desen, animale..." /></label>
                <label className={labelClass}>Cât durează așteptarea<select className={inputClass} value={emergency.duration} onChange={(event) => setEmergency({ ...emergency, duration: event.target.value })}><option>5-10 minute</option><option>10-20 minute</option><option>20+ minute</option></select></label>
                <label className={labelClass}>Tipul activităților<select className={inputClass} value={emergency.activityMode} onChange={(event) => setEmergency({ ...emergency, activityMode: event.target.value })}><option value="liniștite">Liniștite</option><option value="cu mișcare mică">Cu mișcare mică</option><option value="mix">Mix</option></select></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">4 din 4 · Rezumat</p>
              <h2 className="mt-3 font-serif text-4xl text-brand-navy">Trei materiale, fiecare al vostru</h2>
              <div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15">
                {summaries.map((item, index) => <div key={item.title} className="grid gap-3 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"><item.icon className="text-brand-purple" size={25} /><div><h3 className="font-serif text-2xl text-brand-navy">{item.title}</h3><p className="mt-1 text-sm font-bold text-brand-navy/65">Pentru {item.name} · {item.detail}</p></div><button type="button" onClick={() => setStep(index)} className="w-fit border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Editează</button></div>)}
              </div>
              <div className="mt-8 flex items-end justify-between gap-5 border-b border-brand-gold/50 bg-brand-gold/12 px-5 py-5"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/55">Valoare individuală 67 lei</p><p className="mt-1 font-serif text-2xl text-brand-navy">Pachetul Familiei Magice</p></div><p className="font-nunito text-4xl font-black text-brand-purple">49 lei</p></div>
              <div className="mt-7"><DigitalPurchaseConsent checked={hasConsent} onCheckedChange={setHasConsent} productLabel="Pachetul Familiei Magice" /></div>
            </div>
          )}

          {error && <p role="alert" className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-brand-navy/12 pt-6">
            {step > 0 ? <button type="button" onClick={() => { setError(""); setStep((current) => current - 1); }} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-brand-navy/20 px-5 text-sm font-black text-brand-navy"><ArrowLeft size={18} /> Înapoi</button> : <span />}
            {step < 3 ? <button type="button" onClick={nextStep} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-navy px-6 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Continuă <ArrowRight size={18} /></button> : <button type="button" onClick={startCheckout} disabled={isLoading} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-purple px-6 text-sm font-black text-white transition-colors hover:bg-brand-navy disabled:cursor-wait disabled:opacity-70">{isLoading ? <><LoaderCircle className="animate-spin" size={18} /> Se deschide plata</> : <><Sparkles size={18} /> Continuă către plată</>}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
