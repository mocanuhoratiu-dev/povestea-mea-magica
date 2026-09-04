"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Award, BedDouble, Download, Headphones, HeartHandshake, Map, MoonStar, Pause, Play, ShieldCheck, Sparkles, Wind, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import DigitalPurchaseConsent from "./DigitalPurchaseConsent";
import EmailDelivery from "./EmailDelivery";
import FeedbackInvite from "./FeedbackInvite";
import MagicalLoader from "./MagicalLoader";
import MobileFlowSteps from "./MobileFlowSteps";
import { CLASSIC_SHIELD_STYLES, ClassicShieldPages } from "./NightShieldClassicPages";
import QuickRating from "./QuickRating";
import { beginOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";
import { buildNightShieldContent, nightShieldNarration, sanitizeNightShieldContent, type NightShieldContent } from "@/lib/nightShield";
import { playNarration, stopNarration, subscribeToNarration } from "@/lib/narrationPlayback";
import { commerce } from "@/lib/siteMode";

const PAGE_COUNT = 9;
const AUDIO_OWNER = "night-shield-lumi";

const fears = [
  { id: "frica de intuneric", label: "Întunericul", icon: MoonStar },
  { id: "umbrele noptii", label: "Umbrele", icon: Sparkles },
  { id: "monstrul de sub pat", label: "Sub pat", icon: BedDouble },
  { id: "zgomotele ciudate", label: "Zgomotele", icon: Wind },
  { id: "dulapul scartaitor", label: "Dulapul", icon: ShieldCheck },
  { id: "vise urate", label: "Visele urâte", icon: MoonStar },
];

const defaults: Record<string, { location: string; helper: string; ritual: string }> = {
  "frica de intuneric": { location: "colțurile camerei", helper: "lumina de veghe", ritual: "o îmbrățișare și trei respirații lente" },
  "umbrele noptii": { location: "perdeaua și colțul de lângă ușă", helper: "lanterna mică", ritual: "numim împreună trei lucruri cunoscute" },
  "monstrul de sub pat": { location: "spațiul de sub pat", helper: "jucăria preferată", ritual: "verificăm o dată împreună și spunem noapte bună" },
  "zgomotele ciudate": { location: "ușa, fereastra și pereții", helper: "vocea calmă a părintelui", ritual: "ascultăm și numim trei sunete obișnuite" },
  "dulapul scartaitor": { location: "ușile dulapului", helper: "pătura preferată", ritual: "spunem noapte bună hainelor" },
  "vise urate": { location: "patul și noptiera", helper: "o poveste cu final bun", ritual: "alegem un gând liniștit pentru vis" },
};

type ClassicShieldKit = {
  target: string;
  order: string;
  ingredients: { name: string; detail: string }[];
  spell: string;
};

const classicShieldKits: Record<string, ClassicShieldKit> = {
  "frica de intuneric": {
    target: "întunericului",
    order: "Ordinul Felinarelor de Veghe",
    ingredients: [
      { name: "Apă de Stea Liniștită", detail: "o măsură imaginară" },
      { name: "Miere de Gând Bun", detail: "o picătură imaginară" },
      { name: "Cristale de Lumină Mică", detail: "trei sclipiri imaginare" },
    ],
    spell: "Noapte bună, noapte lină, camera mea păstrează lumină. Privesc, respir și cer ajutor, iar seara vine mai ușor.",
  },
  "umbrele noptii": {
    target: "umbrelor nopții",
    order: "Ordinul Umbrelor Cuminți",
    ingredients: [
      { name: "Apă de Lună Plină", detail: "o măsură imaginară" },
      { name: "Esență de Lămâie-Soare", detail: "o rază imaginară" },
      { name: "Cristale de Curaj", detail: "trei sclipiri imaginare" },
    ],
    spell: "Umbre mici și umbre mari, vă privesc așa cum sunteți. Camera mea îmi este cunoscută, iar eu nu sunt singur.",
  },
  "monstrul de sub pat": {
    target: "grijilor de sub pat",
    order: "Ordinul Dragonilor Somnoroși",
    ingredients: [
      { name: "Râu de Somn Liniștit", detail: "o măsură imaginară" },
      { name: "Firimituri de Curaj", detail: "două zâmbete imaginare" },
      { name: "Pulbere de Dragon Somnoros", detail: "trei sclipiri imaginare" },
    ],
    spell: "Sub pat este loc cunoscut, privit o dată și apoi lăsat. Adultul meu rămâne aproape, iar somnul poate să înceapă.",
  },
  "zgomotele ciudate": {
    target: "zgomotelor de noapte",
    order: "Ordinul Ecourilor Liniștite",
    ingredients: [
      { name: "Lac de Liniște", detail: "o măsură imaginară" },
      { name: "Miere de Șoaptă", detail: "o picătură imaginară" },
      { name: "Praf de Ecou Adormit", detail: "trei sclipiri imaginare" },
    ],
    spell: "Aud un sunet, îl numesc, lângă adult îl deslușesc. Casa respiră uneori, iar eu respir încet de trei ori.",
  },
  "dulapul scartaitor": {
    target: "ușilor și umbrelor din dulap",
    order: "Ordinul Hainelor Adormite",
    ingredients: [
      { name: "Picături de Pace", detail: "o măsură imaginară" },
      { name: "Lumină Galbenă de Curaj", detail: "o rază imaginară" },
      { name: "Cristale pentru Uși Cuminți", detail: "trei sclipiri imaginare" },
    ],
    spell: "Uși de dulap, haine moi, vă privesc și știu ce sunteți voi. Camera mea e loc știut, iar eu mă simt văzut.",
  },
  "vise urate": {
    target: "viselor încurcate",
    order: "Ordinul Norilor de Vis Bun",
    ingredients: [
      { name: "Rouă de Vis Bun", detail: "o măsură imaginară" },
      { name: "Rază de Dimineață", detail: "o lumină imaginară" },
      { name: "Pulbere de Nor Pufos", detail: "trei sclipiri imaginare" },
    ],
    spell: "Visul vine, visul trece, eu pot spune ce mă sperie. Cer ajutor, respir ușor și aleg un gând ocrotitor.",
  },
};

type PdfInstance = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
  output: (type: "blob") => Blob;
  setFont: (fontName: string, fontStyle?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  text: (text: string | string[], x: number, y: number, options?: { lineHeightFactor?: number }) => void;
};

function addSearchableText(pdf: PdfInstance, text: string, width: number) {
  pdf.setFont("times", "normal"); pdf.setFontSize(6); pdf.setTextColor(255, 255, 255);
  pdf.text(pdf.splitTextToSize(text.replace(/\s+/g, " ").trim(), width - 20).slice(0, 90), 10, 10, { lineHeightFactor: 1.05 });
}

const NEW_PDF_CSS = `
.ns-page{width:794px;height:1123px;position:relative;overflow:hidden;box-sizing:border-box;background:linear-gradient(160deg,#090f25,#0d1b3b 56%,#090f25);color:#f7efd9;font-family:Arial,sans-serif}.ns-page *{box-sizing:border-box}.ns-frame{position:absolute;inset:24px;border:2px solid rgba(226,190,92,.7);padding:56px 62px;background:rgba(10,24,52,.86);box-shadow:inset 0 0 0 10px rgba(226,190,92,.025)}.ns-frame:before,.ns-frame:after{content:"✦";position:absolute;color:#e2be5c;font-size:20px}.ns-frame:before{left:20px;top:17px}.ns-frame:after{right:20px;bottom:17px}.ns-kicker{font-size:11px;font-weight:800;letter-spacing:2.4px;text-transform:uppercase;color:#e2be5c}.ns-title{font-family:Georgia,serif;font-size:43px;line-height:1.08;margin:16px 0 10px;color:#fff8e7}.ns-rule{height:1px;background:#e2be5c;margin:24px 0;opacity:.65}.ns-footer{position:absolute;left:62px;right:62px;bottom:30px;display:flex;justify-content:space-between;color:#b9c4d5;font-size:9px;letter-spacing:1.1px;text-transform:uppercase}.ns-body{font-family:Georgia,serif;font-size:23px;line-height:1.58;color:#f8f2e4}.ns-body p{margin:0 0 23px}.ns-panel{border:1px solid rgba(226,190,92,.52);padding:22px;background:#132a49}.ns-list{display:grid;gap:14px;margin-top:24px}.ns-item{display:flex;gap:16px;align-items:flex-start;border-bottom:1px solid rgba(226,190,92,.24);padding:0 0 15px}.ns-num{flex:0 0 40px;height:40px;border:1px solid #e2be5c;display:grid;place-items:center;color:#e2be5c;font-family:Georgia,serif;font-size:18px}.ns-item h3{font-family:Georgia,serif;font-size:21px;margin:0 0 6px;color:#fff8e7}.ns-item p{font-size:15px;line-height:1.45;margin:0;color:#d9dfeb}.ns-map{height:390px;position:relative;border:1px solid rgba(226,190,92,.5);background:#112744;margin-top:18px}.ns-bed{position:absolute;left:60px;bottom:46px;width:250px;height:125px;border:3px solid #e2be5c}.ns-bed:before{content:"PAT";position:absolute;left:18px;top:18px;color:#e2be5c;font-weight:800}.ns-window{position:absolute;right:65px;top:45px;width:135px;height:105px;border:3px solid #8db5c9}.ns-door{position:absolute;right:55px;bottom:46px;width:105px;height:150px;border:3px solid #8db5c9}.ns-safe{position:absolute;width:32px;height:32px;border-radius:50%;background:#e2be5c;color:#08162d;display:grid;place-items:center;font-weight:900}.ns-map>span:nth-child(4){left:105px!important;top:70px!important}.ns-map>span:nth-child(5){right:220px!important;top:190px!important}.ns-map>span:nth-child(6){left:330px!important;bottom:68px!important}.ns-note{font-size:14px;line-height:1.45;color:#cbd4e1}.ns-breathe{width:280px;height:280px;margin:22px auto;border:2px solid #e2be5c;border-radius:50%;display:grid;place-items:center;text-align:center;padding:40px;box-shadow:0 0 0 22px rgba(226,190,92,.07),0 0 0 44px rgba(226,190,92,.035)}.ns-breathe strong{display:block;font-family:Georgia,serif;font-size:36px;color:#fff8e7}.ns-breathe span{font-size:16px;line-height:1.45;color:#d9dfeb}.ns-quote{font-family:Georgia,serif;font-size:25px;line-height:1.4;text-align:center;color:#fff8e7;border-top:1px solid #e2be5c;border-bottom:1px solid #e2be5c;padding:34px 20px;margin:0}.ns-parent{background:#f7efd9;color:#14233b}.ns-parent .ns-frame{background:#fffaf0;border-color:#a9812d}.ns-parent .ns-title,.ns-parent .ns-body,.ns-parent .ns-item h3{color:#14233b}.ns-parent .ns-kicker{color:#8052a0}.ns-parent .ns-footer,.ns-parent .ns-note{color:#596476}.ns-card-page,.ns-label-page{background:#eee5cf;color:#14233b}.ns-cut{margin-top:28px;border:2px dashed #7d6b49;padding:22px}.ns-card{height:480px;border:4px double #b28b35;background:#fffaf0;padding:50px;text-align:center;display:flex;flex-direction:column;justify-content:center}.ns-card h2{font-family:Georgia,serif;font-size:40px;margin:0 0 26px;color:#14233b}.ns-card p{font-family:Georgia,serif;font-size:25px;line-height:1.5;margin:0;color:#263752}.ns-stars{font-size:28px;letter-spacing:16px;color:#e2be5c}.ns-ministry{text-align:center;text-transform:uppercase;letter-spacing:3px;font-size:8px;font-weight:800;color:#e2be5c;opacity:.8}.ns-crest{width:78px;height:78px;margin:17px auto 13px;border:2px solid #e2be5c;border-radius:50%;display:grid;place-items:center;font-family:Georgia,serif;font-size:34px;color:#e2be5c;box-shadow:0 0 0 7px rgba(226,190,92,.06)}.ns-official{text-align:center;font-family:Georgia,serif;font-size:33px;line-height:1.13;color:#fff8e7;margin:8px auto;max-width:590px}.ns-official-sub{text-align:center;text-transform:uppercase;letter-spacing:2.2px;font-size:9px;color:#e2be5c}.ns-beneficiary{margin:20px auto 15px;padding:14px 32px;width:82%;border:1px solid rgba(226,190,92,.35);text-align:center;background:rgba(226,190,92,.055)}.ns-beneficiary span{display:block;text-transform:uppercase;letter-spacing:2px;font-size:8px;color:#b9c4d5}.ns-beneficiary strong{display:block;margin-top:8px;font-family:Georgia,serif;font-size:34px;color:#fff8e7}.ns-cert-copy{font-family:Georgia,serif;font-size:16px;line-height:1.5;text-align:center;color:#d8d3e5}.ns-clauses{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:17px}.ns-clause{min-height:90px;border:1px solid rgba(226,190,92,.25);background:rgba(255,255,255,.025);padding:12px;font-size:12px;line-height:1.4;color:#cbd4e1}.ns-clause b{display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1.4px;font-size:8px;color:#e2be5c}.ns-seal-row{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:15px;color:#e2be5c;font-size:9px;text-transform:uppercase;letter-spacing:1.5px}.ns-recipe{display:grid;grid-template-columns:.92fr 1.08fr;gap:30px;margin-top:17px}.ns-recipe-col+.ns-recipe-col{border-left:1px solid rgba(226,190,92,.25);padding-left:30px}.ns-section-title{margin:0 0 20px;text-transform:uppercase;letter-spacing:2px;font-size:10px;color:#e2be5c}.ns-ingredient{display:grid;grid-template-columns:30px 1fr;gap:12px;margin-bottom:22px}.ns-ingredient-num{font-family:Georgia,serif;font-size:26px;line-height:1;color:rgba(226,190,92,.34)}.ns-ingredient strong,.ns-prep strong{display:block;font-family:Georgia,serif;font-size:16px;color:#fff8e7}.ns-ingredient small,.ns-prep small{display:block;margin-top:4px;font-size:12px;line-height:1.3;color:#aebbd0;font-style:italic}.ns-prep{display:grid;grid-template-columns:35px 1fr;gap:12px;margin-bottom:18px}.ns-prep-num{width:31px;height:31px;border:1px solid rgba(226,190,92,.65);border-radius:50%;display:grid;place-items:center;font-family:Georgia,serif;color:#e2be5c}.ns-incantation{margin-top:23px;border:1px solid rgba(226,190,92,.4);padding:17px 24px;text-align:center;background:rgba(226,190,92,.05)}.ns-incantation span{display:block;text-transform:uppercase;letter-spacing:2px;font-size:8px;color:#e2be5c}.ns-incantation p{margin:10px 0 0;font-family:Georgia,serif;font-size:17px;line-height:1.42;font-style:italic;color:#efe6fa}.ns-safety{margin-top:9px;text-align:center;font-size:9px;line-height:1.4;color:#9faabd}.ns-label-page .ns-frame{background:#f8f1df;border:1px solid #9b7a33}.ns-label-board{margin:18px auto 0;border:2px solid #e2be5c;background:linear-gradient(150deg,#0b132d,#101f42);padding:24px 38px;text-align:center;color:#fff8e7}.ns-label-board h3{margin:9px 0 3px;font-family:Georgia,serif;font-size:35px}.ns-label-board .owner{margin:13px auto;padding:9px;border-top:1px solid rgba(226,190,92,.4);border-bottom:1px solid rgba(226,190,92,.4);font-size:16px}.ns-label-board .formula{font-family:Georgia,serif;font-size:15px;line-height:1.4;font-style:italic;color:#d8cdea}.ns-cut-grid{display:grid;grid-template-columns:.76fr 1.24fr;gap:16px;margin-top:17px}.ns-round-label{aspect-ratio:1;border:2px dashed #9b7a33;padding:10px}.ns-round-label div{height:100%;border-radius:50%;background:#0d203c;border:2px solid #e2be5c;display:grid;place-items:center;text-align:center;color:#e2be5c;font-size:12px;line-height:1.3;text-transform:uppercase;letter-spacing:1px}.ns-instruction-label{border:2px dashed #9b7a33;padding:10px}.ns-instruction-label div{height:100%;background:#0d203c;border:2px solid #e2be5c;padding:17px;color:#f7efd9}.ns-instruction-label h4{text-align:center;text-transform:uppercase;letter-spacing:2px;color:#e2be5c;margin:0 0 11px}.ns-instruction-label p{margin:6px 0;font-size:12px;line-height:1.3}.ns-combo{display:grid;grid-template-columns:1fr .9fr;gap:26px;align-items:center}.ns-parent-plan{display:grid;gap:11px;margin-top:14px}.ns-parent-step{display:grid;grid-template-columns:42px 1fr;gap:15px;border-left:5px solid #8052a0;background:#f4edf5;padding:14px 17px}.ns-parent-step b{font-family:Georgia,serif;font-size:22px;color:#a9812d}.ns-parent-step h3{margin:0 0 4px;font-family:Georgia,serif;font-size:18px;color:#14233b}.ns-parent-step p{margin:0;font-size:13px;line-height:1.4;color:#536078}.ns-parent-phrase{margin-top:15px;background:#14233b;border:1px solid #a9812d;padding:15px 21px;text-align:center;font-family:Georgia,serif;font-size:16px;line-height:1.35;color:#fff8e7}.ns-tracker-intro{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 15px}.ns-tracker-intro div{border:1px solid rgba(226,190,92,.32);padding:11px 13px}.ns-tracker-intro span{display:block;text-transform:uppercase;letter-spacing:1.4px;font-size:7px;color:#e2be5c}.ns-tracker-intro strong{display:block;margin-top:6px;font-size:12px;line-height:1.25;color:#fff8e7}.ns-tracker{border:1px solid rgba(226,190,92,.4)}.ns-tracker-row{display:grid;grid-template-columns:55px 1fr 1fr 1.15fr;min-height:51px;border-bottom:1px solid rgba(226,190,92,.22);align-items:center;text-align:center}.ns-tracker-row:last-child{border-bottom:0}.ns-tracker-row>*{height:100%;display:grid;place-items:center;border-right:1px solid rgba(226,190,92,.22);padding:6px}.ns-tracker-row>*:last-child{border-right:0}.ns-tracker-head{min-height:43px;background:rgba(226,190,92,.09);text-transform:uppercase;letter-spacing:.8px;font-size:7px;color:#e2be5c}.ns-tracker-row strong{font-family:Georgia,serif;font-size:16px;color:#fff8e7}.ns-tracker-check{font-size:22px;color:#d8d3e5}.ns-tracker-moods{font-size:15px;color:#e2be5c}
#ns-page-5 .ns-map{height:320px;margin-top:14px}
#ns-page-5 .ns-list{gap:10px;margin-top:14px}
#ns-page-5 .ns-item{padding-bottom:10px}
#ns-page-5 .ns-item h3{font-size:19px;margin-bottom:3px}
.ns-label-strips{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
.ns-label-strip{border:2px dashed #9b7a33;padding:8px}
.ns-label-strip span{min-height:62px;background:#0d203c;border:1px solid #e2be5c;display:grid;place-items:center;padding:10px;text-align:center;color:#e2be5c;font-size:10px;line-height:1.3;font-weight:800;letter-spacing:1.1px;text-transform:uppercase}
.ns-label-note{margin:14px auto 0;max-width:520px;text-align:center;color:#596476;font-size:10px;line-height:1.45}
`;

const PDF_CSS = `${CLASSIC_SHIELD_STYLES}\n${NEW_PDF_CSS}`;

export default function MonsterKit() {
  const [name, setName] = useState(""); const [age, setAge] = useState("4"); const [fear, setFear] = useState(fears[0].id);
  const [location, setLocation] = useState(""); const [helper, setHelper] = useState(""); const [ritual, setRitual] = useState("");
  const [content, setContent] = useState<NightShieldContent | null>(null); const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); const [isDownloading, setIsDownloading] = useState(false); const [resultNote, setResultNote] = useState("");
  const [showRating, setShowRating] = useState(false); const [consent, setConsent] = useState(false); const [consentError, setConsentError] = useState("");
  const [audioPhase, setAudioPhase] = useState<"idle" | "loading" | "playing">("idle");
  const selectedFear = fears.find((item) => item.id === fear) || fears[0];
  const fallback = useMemo(() => buildNightShieldContent({ name, age, fear, fearLabel: selectedFear.label, location: location || defaults[fear]?.location, helper: helper || defaults[fear]?.helper, ritual: ritual || defaults[fear]?.ritual }), [age, fear, helper, location, name, ritual, selectedFear.label]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration((state) => setAudioPhase(state.owner === AUDIO_OWNER ? state.phase : "idle"));
    return () => { unsubscribe(); };
  }, []);
  useEffect(() => () => stopNarration(AUDIO_OWNER), []);
  useEffect(() => {
    const listener = (event: Event) => { const detail = (event as CustomEvent<Record<string, string>>).detail; if (detail?.product !== "monster") return; if (detail.monsterType && fears.some((item) => item.id === detail.monsterType)) setFear(detail.monsterType); if (detail.fearLocation) setLocation(detail.fearLocation); if (detail.calmingHelper) setHelper(detail.calmingHelper); if (detail.bedtimeRitual) setRitual(detail.bedtimeRitual); };
    window.addEventListener("pmm:lumi-material-choice", listener); return () => window.removeEventListener("pmm:lumi-material-choice", listener);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const orderId = params.get("order"); const token = params.get("token");
    if (!orderId || !token || (params.get("item") && params.get("item") !== "monster")) return;
    void fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}&item=monster`).then(async (response) => response.ok ? response.json() : null).then((delivery: { product?: string; configuration?: Record<string, unknown>; output?: unknown } | null) => {
      if (!delivery || delivery.product !== "monster" || !delivery.output) return; const generation = delivery.configuration?.generation as Record<string, unknown> | undefined;
      const deliveredFear = typeof generation?.monster === "string" ? generation.monster : fears[0].id; const deliveredName = typeof generation?.name === "string" ? generation.name : ""; const deliveredAge = typeof generation?.age === "string" ? generation.age : "4";
      const deliveredLocation = typeof generation?.context === "string" ? generation.context : ""; const deliveredHelper = typeof generation?.interest === "string" ? generation.interest : ""; const deliveredRitual = typeof generation?.tone === "string" ? generation.tone : ""; const deliveredLabel = fears.find((item) => item.id === deliveredFear)?.label || fears[0].label;
      setName(deliveredName); setAge(deliveredAge); setFear(deliveredFear); setLocation(deliveredLocation); setHelper(deliveredHelper); setRitual(deliveredRitual);
      setContent(sanitizeNightShieldContent(delivery.output, buildNightShieldContent({ name: deliveredName, age: deliveredAge, fear: deliveredFear, fearLabel: deliveredLabel, location: deliveredLocation, helper: deliveredHelper, ritual: deliveredRitual }))); setShowResult(true);
    }).catch(() => undefined);
  }, []);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!name.trim()) return; if (commerce.acceptsPayments && !consent) { setConsentError("Confirmă livrarea imediată înainte de a continua către plată."); return; }
    setConsentError(""); setIsGenerating(true); setShowRating(false); setResultNote(""); trackEvent("product_started", { product: "monster" });
    const generation = { type: "monster", name, age, monster: fear, context: location, interest: helper, tone: ritual };
    if (commerce.acceptsPayments) { try { await beginOrderCheckout("night-shield", { generation }); } catch (error) { alert(error instanceof Error ? error.message : "Nu am putut pregăti plata."); } finally { setIsGenerating(false); } return; }
    try { const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(generation) }); const payload = await response.json() as { success?: boolean; data?: unknown }; if (!response.ok || !payload.success || !payload.data) throw new Error("generation"); setContent(sanitizeNightShieldContent(payload.data, fallback)); trackEvent("generation_completed", { product: "monster", generationMode: "ai", pageCount: PAGE_COUNT }); }
    catch { setContent(fallback); setResultNote("Ritualul este pregătit într-o variantă sigură și personalizată. Îl poți regenera pentru o formulare nouă."); trackEvent("generation_completed", { product: "monster", generationMode: "template", pageCount: PAGE_COUNT }); }
    finally { setIsGenerating(false); setShowResult(true); }
  };

  const renderPdf = async (quality: "download" | "email" = "download") => {
    const [{ jsPDF }, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")]); const pdf = new jsPDF("p", "mm", "a4"); const width = pdf.internal.pageSize.getWidth(); const height = pdf.internal.pageSize.getHeight();
    await document.fonts.ready;
    for (let index = 1; index <= PAGE_COUNT; index += 1) { const element = document.getElementById(`ns-page-${index}`); if (!element) continue; element.style.display = "block"; try { await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); const canvas = await html2canvasModule.default(element, { scale: quality === "email" ? 1.65 : 2.35, useCORS: true, logging: false, windowWidth: 794, windowHeight: 1123 }); addSearchableText(pdf, element.innerText, width); pdf.addImage(canvas.toDataURL("image/jpeg", quality === "email" ? .84 : .96), "JPEG", 0, 0,width, height); } finally { element.style.display = "none"; } if (index < PAGE_COUNT) pdf.addPage(); }
    return pdf;
  };
  const download = async () => { setIsDownloading(true); const started = Date.now(); trackEvent("pdf_render_started", { product: "monster" }); try { const pdf = await renderPdf(); pdf.save(`Scutul_de_Noapte_${name.trim()}.pdf`); trackEvent("pdf_render_completed", { product: "monster", durationMs: Date.now() - started }); trackEvent("pdf_downloaded", { product: "monster", pageCount: PAGE_COUNT }); setShowRating(true); } catch { trackEvent("pdf_render_failed", { product: "monster", durationMs: Date.now() - started }); } finally { setIsDownloading(false); } };
  const toggleAudio = async () => { if (!content) return; if (audioPhase !== "idle") { stopNarration(AUDIO_OWNER); return; } try { await playNarration(AUDIO_OWNER, nightShieldNarration(name, content), "lumi"); } catch { setResultNote("Audio-ul nu este disponibil momentan. Ritualul rămâne pregătit pentru citit împreună."); } };

  return <section id="monster-away" className="relative overflow-hidden bg-brand-navy px-4 py-14 text-brand-cream md:px-8 md:py-20"><div className="mx-auto max-w-6xl"><div className="mx-auto mb-10 max-w-3xl text-center"><p className="text-xs font-black uppercase tracking-[0.22em] text-brand-gold">Ritual personalizat de seară</p><h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">Scutul de Noapte</h1><p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-brand-cream/72 md:text-lg">Certificatul, rețeta imaginară și etichetele îndrăgite se întâlnesc cu o poveste scurtă, repere pentru cameră și pași blânzi pentru întreaga familie.</p></div>
    <div className="grid items-start gap-10 lg:grid-cols-[.85fr_1.15fr]"><aside className="border border-brand-gold/30 bg-white/5 p-6 md:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">În PDF</p><h2 className="mt-3 font-serif text-3xl">Jocul magic, completat cu repere reale</h2><div className="mt-7 grid gap-4 text-sm text-brand-cream/78">{[[Award,"Certificat oficial de protecție magică"],[Sparkles,"Rețeta și etichetele originale pentru flacon"],[MoonStar,"Poveste scurtă despre emoția aleasă"],[Map,"Harta camerei și locurile sigure"],[Wind,"Respirație și formulă de curaj"],[HeartHandshake,"Ghid pentru părinte, card și calendar"],[Headphones,"Audio ghidat de Lumi"]].map(([Icon,label]) => <div key={String(label)} className="flex items-center gap-3"><Icon className="shrink-0 text-brand-gold" size={19}/><span>{String(label)}</span></div>)}</div></aside>
      <form onSubmit={generate} className="bg-brand-cream p-5 text-brand-navy shadow-2xl md:p-9"><MobileFlowSteps items={["Copilul","Seara","Ritualul"]} accentClass="bg-brand-purple"/><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-black">Numele copilului<input required value={name} onChange={(event)=>setName(event.target.value)} maxLength={32} placeholder="Ex: Erica" className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Vârsta copilului<select value={age} onChange={(event)=>setAge(event.target.value)} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple">{[2,3,4,5,6,7,8,9].map((value)=><option key={value} value={value}>{value} ani</option>)}</select></label></div>
        <fieldset className="mt-7"><legend className="text-sm font-black">Ce face seara mai dificilă?</legend><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{fears.map((item)=>{const Icon=item.icon;const active=fear===item.id;return <button key={item.id} type="button" onClick={()=>setFear(item.id)} className={`flex min-h-20 flex-col items-center justify-center gap-2 border px-2 text-xs font-black transition ${active?"border-brand-purple bg-brand-purple text-white":"border-brand-navy/15 bg-white hover:border-brand-purple"}`}><Icon size={20}/>{item.label}</button>})}</div></fieldset>
        <div className="mt-7 grid gap-5"><label className="text-sm font-black">Locul care atrage atenția copilului<input value={location} onChange={(event)=>setLocation(event.target.value)} maxLength={88} placeholder={defaults[fear]?.location} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Ce îl liniștește de obicei?<input value={helper} onChange={(event)=>setHelper(event.target.value)} maxLength={88} placeholder={defaults[fear]?.helper} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Ritualul vostru de seară<input value={ritual} onChange={(event)=>setRitual(event.target.value)} maxLength={96} placeholder={defaults[fear]?.ritual} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label></div>
        {commerce.acceptsPayments&&<div className="mt-7"><DigitalPurchaseConsent checked={consent} onCheckedChange={setConsent} productLabel="Scutul de Noapte" error={consentError}/></div>}<button disabled={isGenerating||!name.trim()} className="mt-7 flex w-full items-center justify-center gap-3 bg-brand-purple px-5 py-4 text-base font-black text-white transition hover:bg-brand-navy disabled:opacity-50"><ShieldCheck size={22}/>{isGenerating?"Pregătim ritualul...":commerce.acceptsPayments?`Continuă către plată · ${commerce.prices.nightShield}`:"Creează Scutul de Noapte"}</button>
      </form></div></div><MagicalLoader isVisible={isGenerating}/>
    <AnimatePresence>{showResult&&content&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-navy/88 p-3 backdrop-blur-sm" onClick={()=>setShowResult(false)}><motion.div initial={{y:22,opacity:0}} animate={{y:0,opacity:1}} onClick={(event)=>event.stopPropagation()} className="max-h-[88dvh] w-full max-w-xl overflow-y-auto bg-brand-cream p-5 text-center text-brand-navy shadow-2xl md:p-8"><button type="button" onClick={()=>setShowResult(false)} className="ml-auto grid h-9 w-9 place-items-center border border-brand-navy/15" aria-label="Închide"><X size={18}/></button><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-navy text-brand-gold"><MoonStar size={30}/></div><p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-brand-purple">9 pagini personalizate</p><h2 className="mt-2 font-serif text-3xl">Scutul lui {name}</h2><p className="mt-3 text-sm leading-relaxed text-brand-navy/65">Certificatul, rețeta, etichetele, povestea, harta, cardul și calendarul de seară sunt gata.</p>{resultNote&&<p className="mt-4 border border-brand-gold/35 bg-white px-4 py-3 text-xs font-bold leading-relaxed">{resultNote}</p>}<button type="button" onClick={toggleAudio} disabled={audioPhase==="loading"} className="mt-6 flex w-full items-center justify-center gap-3 border border-brand-purple px-5 py-3 font-black text-brand-purple hover:bg-brand-purple hover:text-white disabled:opacity-50">{audioPhase==="playing"?<Pause size={20}/>:<Play size={20}/>} {audioPhase==="loading"?"Lumi pregătește vocea...":audioPhase==="playing"?"Oprește ghidul audio":"Ascultă ritualul cu Lumi"}</button><button type="button" onClick={download} disabled={isDownloading} className="mt-3 flex w-full items-center justify-center gap-3 bg-brand-navy px-5 py-4 font-black text-white disabled:opacity-50"><Download size={20}/>{isDownloading?"Pregătim PDF-ul...":"Descarcă Scutul de Noapte"}</button><EmailDelivery product="monster" filename={`Scutul_de_Noapte_${name.trim()}.pdf`} childName={name} createPdf={async()=>(await renderPdf("email")).output("blob")}/>{showRating&&<QuickRating product="monster"/>}<FeedbackInvite product="monster"/></motion.div></motion.div>}</AnimatePresence>
    {showResult&&content&&<div aria-hidden="true" style={{position:"fixed",left:0,top:0,zIndex:-10,pointerEvents:"none"}}><style>{PDF_CSS}</style><NightShieldPages name={name} fear={fear} fearLabel={selectedFear.label} location={location||defaults[fear]?.location} helper={helper||defaults[fear]?.helper} ritual={ritual||defaults[fear]?.ritual} content={content}/></div>}
  </section>;
}

function Page({index,kicker,title,children,light=false}:{index:number;kicker:string;title:string;children:React.ReactNode;light?:boolean}){return <div id={`ns-page-${index}`} className={`ns-page${light?" ns-parent":""}`} style={{display:"none"}}><div className="ns-frame"><div className="ns-kicker">{kicker}</div><h2 className="ns-title">{title}</h2><div className="ns-rule"/>{children}<div className="ns-footer"><span>Povestea Mea Magică · Scutul de Noapte</span><span>{index} / {PAGE_COUNT}</span></div></div></div>}

function NightShieldPages({name,fear,fearLabel,location,helper,ritual,content}:{name:string;fear:string;fearLabel:string;location:string;helper:string;ritual:string;content:NightShieldContent}){
  const kit=classicShieldKits[fear]||classicShieldKits["frica de intuneric"];
  return <>
    <ClassicShieldPages name={name} fearLabel={fearLabel} location={location} helper={helper} ritual={ritual} kit={kit}/>
    <Page index={4} kicker="Povestea serii" title={content.storyTitle}><div className="ns-body">{content.storyParagraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div><div className="ns-incantation"><span>Formula serii</span><p>„{kit.spell}”</p></div></Page>
    <Page index={5} kicker="Camera cunoscută" title="Harta locurilor sigure"><p className="ns-note">Desenați împreună camera, apoi marcați cele trei repere. Harta nu caută pericole; îl ajută pe copil să recunoască locurile familiare.</p><div className="ns-map"><div className="ns-window"/><div className="ns-door"/><div className="ns-bed"/><span className="ns-safe">1</span><span className="ns-safe">2</span><span className="ns-safe">3</span></div><div className="ns-list">{content.safePlaces.map((place,index)=><div className="ns-item" key={place}><span className="ns-num">{index+1}</span><div><h3>{place}</h3></div></div>)}</div></Page>
    <Page index={6} kicker={`Cuvintele lui ${name}`} title="Respirație și formulă"><div className="ns-combo"><div className="ns-breathe"><div><strong>3 × 4</strong><span>Inspirăm până la 3<br/>Expirăm până la 4</span></div></div><div className="ns-quote">„{content.courageFormula}”</div></div><div className="ns-panel" style={{marginTop:28}}><p className="ns-body" style={{fontSize:18,margin:0}}>{content.breathingCue}</p></div><p className="ns-note" style={{marginTop:18,textAlign:"center"}}>Respirația rămâne naturală. Opriți exercițiul dacă devine inconfortabil.</p></Page>
    <Page index={7} kicker="Pentru adultul de încredere" title="Planul serii" light><p className="ns-note" style={{fontSize:16}}>{content.parentMessage}</p><div className="ns-parent-plan">{content.ritualSteps.map((step,index)=><div className="ns-parent-step" key={step.title}><b>0{index+1}</b><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="ns-parent-phrase">„Te cred. Sunt aici. Facem împreună următorul pas mic.”</div><p className="ns-note" style={{marginTop:18,textAlign:"center"}}>Scutul este un joc de conectare pentru familie. Nu înlocuiește sfatul unui medic sau specialist atunci când frica persistă ori afectează puternic somnul copilului.</p></Page>
    <div id="ns-page-8" className="ns-page ns-card-page" style={{display:"none"}}><div className="ns-frame" style={{background:"#fffaf0",borderColor:"#a9812d"}}><div className="ns-kicker" style={{color:"#8052a0"}}>Decupează pe linia punctată</div><h2 className="ns-title" style={{color:"#14233b"}}>Card pentru noptieră</h2><div className="ns-cut"><div className="ns-card"><div className="ns-stars">✦ ✦ ✦</div><h2>Scutul lui {name}</h2><p>{content.bedsideMessage}</p></div></div><div className="ns-footer" style={{color:"#596476"}}><span>Povestea Mea Magică · Scutul de Noapte</span><span>8 / {PAGE_COUNT}</span></div></div></div>
    <Page index={9} kicker="O săptămână de pași mici" title="Calendarul curajului"><div className="ns-tracker-intro"><div><span>Semnul care ajută</span><strong>{helper}</strong></div><div><span>Ritualul nostru</span><strong>{ritual}</strong></div></div><div className="ns-tracker"><div className="ns-tracker-row ns-tracker-head"><span>Seara</span><span>Am numit emoția</span><span>Am făcut ritualul</span><span>Cum m-am simțit</span></div>{Array.from({length:7},(_,index)=><div className="ns-tracker-row" key={index}><strong>{index+1}</strong><span className="ns-tracker-check">□</span><span className="ns-tracker-check">□</span><span className="ns-tracker-moods">☾ &nbsp; ◡ &nbsp; ★</span></div>)}</div><div className="ns-incantation"><span>După șapte seri</span><p style={{fontSize:15}}>Observăm dacă {name} a putut să numească emoția, să ceară ajutor și să urmeze ritualul împreună cu un adult.</p></div></Page>
  </>;
}
