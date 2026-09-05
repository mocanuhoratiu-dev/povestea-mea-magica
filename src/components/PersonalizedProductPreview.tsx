"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, MoonStar, Sparkles, X } from "lucide-react";
import { useEffect } from "react";

type NightPreview = {
  kind: "night";
  childName: string;
  fearLabel: string;
  helper: string;
};

type PatiencePreview = {
  kind: "patience";
  childName: string;
  contextLabel: string;
  duration: string;
  difficultyLabel: string;
  missionTitle: string;
};

type PersonalizedProductPreviewProps = (NightPreview | PatiencePreview) & {
  open: boolean;
  price: string;
  isContinuing: boolean;
  paymentsEnabled: boolean;
  onClose: () => void;
  onContinue: () => void;
};

function Watermark() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-hidden text-center font-nunito text-[clamp(1.1rem,4.4vw,3.2rem)] font-black uppercase tracking-[0.16em] text-white/16 [transform:rotate(-28deg)]">Previzualizare</span>;
}

function NightCertificate({ childName, fearLabel, helper }: NightPreview) {
  return (
    <div className="relative aspect-[.707] w-full overflow-hidden bg-[#0d1535] p-[4.5%] text-[#f4e4a0] shadow-[0_28px_70px_rgba(6,12,30,.35)]">
      <div className="absolute inset-[2.2%] border-2 border-[#c9a84c]" />
      <div className="absolute inset-[3.8%] border border-[#c9a84c]/30" />
      <div className="relative z-10 flex h-full flex-col items-center px-[5%] py-[4%] text-center">
        <p className="text-[clamp(5px,1vw,10px)] font-black uppercase tracking-[0.24em] text-[#c9a84c]">Povestea Mea Magică · Scutul de Noapte</p>
        <MoonStar className="mt-[4%] text-[#c9a84c]" size={34} strokeWidth={1.4} />
        <h3 className="mt-[3%] font-serif text-[clamp(17px,3.5vw,38px)] leading-[1.12] text-[#f4e4a0]">Certificat oficial<br />de protecție magică</h3>
        <p className="mt-[2%] text-[clamp(6px,1.15vw,12px)] uppercase tracking-[0.16em] text-[#c9a84c]">Ritual creat în jurul: {fearLabel.toLocaleLowerCase("ro-RO")}</p>
        <div className="my-[5%] flex w-full items-center gap-3"><span className="h-px flex-1 bg-[#c9a84c]/50" /><span>✦ ✦ ✦</span><span className="h-px flex-1 bg-[#c9a84c]/50" /></div>
        <div className="w-[88%] border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-[5%] py-[4%]">
          <span className="block text-[clamp(6px,1vw,10px)] font-black uppercase tracking-[0.2em] text-[#c9a84c]">Se acordă copilului curajos</span>
          <strong className="mt-[3%] block overflow-hidden text-ellipsis font-serif text-[clamp(24px,5vw,54px)] leading-none text-[#fff3c4]">{childName}</strong>
        </div>
        <p className="mt-[5%] max-w-[88%] font-serif text-[clamp(8px,1.45vw,16px)] leading-relaxed text-[#d4c5e8]">Camera lui {childName} primește un ritual blând, creat în jurul reperelor sale familiare. Poate apela oricând la <span className="text-[#f4e4a0]">{helper}</span>, alături de un adult de încredere.</p>
        <div className="mt-auto grid w-full grid-cols-2 gap-[3%] text-left text-[clamp(6px,1vw,11px)] leading-relaxed text-[#bfb3d4]">
          <p className="border border-[#c9a84c]/20 p-[6%]"><b className="mb-1 block uppercase tracking-[0.12em] text-[#c9a84c]">Art. I</b>Emoția este ascultată și numită fără grabă.</p>
          <p className="border border-[#c9a84c]/20 p-[6%]"><b className="mb-1 block uppercase tracking-[0.12em] text-[#c9a84c]">Art. II</b>Scutul se activează prin citire și apropiere.</p>
        </div>
        <p className="mt-[4%] text-[clamp(5px,.9vw,9px)] uppercase tracking-[0.16em] text-[#c9a84c]/65">Mostră personalizată · Materialul final conține 9 pagini</p>
      </div>
      <Watermark />
    </div>
  );
}

function PatienceCover({ childName, contextLabel, duration, difficultyLabel, missionTitle }: PatiencePreview) {
  return (
    <div className="relative aspect-[.707] w-full overflow-hidden bg-white p-[4.5%] text-brand-navy shadow-[0_28px_70px_rgba(18,27,52,.24)]">
      <div className="absolute inset-[2.2%] border-2 border-brand-navy" />
      <div className="relative z-10 flex h-full flex-col">
        <header className="-mx-[1%] bg-brand-navy px-[7%] py-[6%] text-white">
          <p className="text-[clamp(6px,1vw,10px)] font-black uppercase tracking-[0.2em] text-brand-orange">Activități pentru momente reale</p>
          <h3 className="mt-[2%] font-nunito text-[clamp(20px,4vw,44px)] font-black leading-none">Trusa de Răbdare</h3>
        </header>
        <div className="flex flex-1 flex-col items-center px-[6%] py-[7%] text-center">
          <div className="text-[clamp(18px,3.5vw,40px)] tracking-[0.35em] text-brand-orange">✦ ✦ ✦</div>
          <p className="mt-[5%] text-[clamp(8px,1.3vw,14px)] font-bold text-brand-navy/55">Misiune pregătită special pentru</p>
          <strong className="mt-[2%] block max-w-full overflow-hidden text-ellipsis font-serif text-[clamp(28px,5.4vw,60px)] leading-none text-brand-purple">{childName}</strong>
          <h4 className="mt-[6%] max-w-[92%] font-serif text-[clamp(15px,2.7vw,30px)] leading-tight">{missionTitle}</h4>
          <div className="mt-[7%] grid w-full grid-cols-3 border-y-2 border-brand-navy text-left">
            {[["Moment", contextLabel], ["Timp", duration], ["Nivel", difficultyLabel]].map(([label, value]) => <p key={label} className="min-w-0 border-r border-brand-navy/20 px-[8%] py-[9%] last:border-r-0"><span className="block text-[clamp(5px,.9vw,9px)] font-black uppercase tracking-[0.12em] text-brand-purple">{label}</span><b className="mt-1 block overflow-hidden text-ellipsis text-[clamp(7px,1.15vw,13px)] leading-tight">{value}</b></p>)}
          </div>
          <div className="mt-auto flex w-full items-center justify-between border-t border-brand-navy/15 pt-[5%] text-left">
            <div><p className="text-[clamp(6px,1vw,10px)] font-black uppercase tracking-[0.14em] text-brand-purple">Înăuntru</p><p className="mt-1 text-[clamp(8px,1.2vw,13px)] font-bold">Radar · Labirint · Jocuri · Cartonașe</p></div>
            <BadgeCheck className="shrink-0 text-brand-orange" size={34} />
          </div>
        </div>
      </div>
      <Watermark />
    </div>
  );
}

export default function PersonalizedProductPreview(props: PersonalizedProductPreviewProps) {
  const { open, onClose } = props;
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, onClose]);

  const title = props.kind === "night" ? `Scutul lui ${props.childName}` : `Trusa lui ${props.childName}`;
  const description = props.kind === "night"
    ? "Așa va începe certificatul personalizat. În materialul final primești și rețeta, etichetele, povestea, fișa ritualului, cardul și audio cu Lumi."
    : "Așa va începe trusa personalizată. În materialul final primești activitățile adaptate momentului, timpului și nivelului ales.";

  return <AnimatePresence>{props.open && (
    <motion.div role="dialog" aria-modal="true" aria-label={`Previzualizare ${title}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] overflow-y-auto bg-brand-navy/92 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-8" onMouseDown={(event) => { if (event.currentTarget === event.target) props.onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`relative mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-hidden bg-brand-cream shadow-2xl sm:min-h-0 lg:grid-cols-[1.12fr_.88fr] ${props.kind === "night" ? "border border-brand-gold/55" : "border border-white/60"}`}>
        <button type="button" onClick={props.onClose} className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center border border-brand-navy/15 bg-white/90 text-brand-navy backdrop-blur-sm" aria-label="Închide previzualizarea"><X size={19} /></button>
        <div className={`flex items-center justify-center p-4 pt-16 sm:p-8 lg:min-h-[720px] lg:p-10 ${props.kind === "night" ? "bg-[#111b37]" : "bg-[#efe7d8]"}`}>
          <div className="w-full max-w-[470px]">{props.kind === "night" ? <NightCertificate {...props} /> : <PatienceCover {...props} />}</div>
        </div>
        <div className="flex flex-col justify-center px-5 py-8 text-brand-navy sm:px-9 sm:py-10 lg:px-12">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Previzualizare gratuită</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-brand-navy/65 sm:text-base">{description}</p>
          <div className="mt-7 border-y border-brand-navy/12 py-5">
            <div className="flex items-end justify-between gap-4"><span className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/65">Material digital complet</span><strong className="font-nunito text-3xl font-black text-brand-purple">{props.price}</strong></div>
            <p className="mt-2 text-xs font-bold leading-relaxed text-brand-navy/52">Watermark-ul apare doar în previzualizare. Fișierul livrat este curat și pregătit pentru print.</p>
          </div>
          <button type="button" onClick={props.onContinue} disabled={props.isContinuing} className={`mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 px-5 text-sm font-black transition disabled:opacity-55 ${props.kind === "night" ? "bg-brand-purple text-white hover:bg-brand-navy" : "bg-brand-orange text-brand-navy hover:bg-brand-navy hover:text-white"}`}>
            {props.isContinuing ? "Pregătim următorul pas..." : props.paymentsEnabled ? `Continuă către plată · ${props.price}` : "Generează materialul complet"}<ArrowRight size={18} />
          </button>
          <button type="button" onClick={props.onClose} className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 text-xs font-black text-brand-navy/60 hover:text-brand-purple"><ArrowLeft size={15} /> Modifică alegerile</button>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-bold leading-relaxed text-brand-navy/60"><Sparkles size={14} className="text-brand-gold" /> Conținutul complet este generat și livrat numai după confirmare.</p>
        </div>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>;
}
