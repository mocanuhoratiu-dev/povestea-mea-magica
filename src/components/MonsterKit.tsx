"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, BedDouble, BookOpen, Check, Clock3, Download, Headphones, HeartHandshake, Mail, MoonStar, Pause, Play, Printer, ShieldCheck, Sparkles, Wind, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import DigitalPurchaseConsent from "./DigitalPurchaseConsent";
import EmailDelivery from "./EmailDelivery";
import FeedbackInvite from "./FeedbackInvite";
import MagicalLoader from "./MagicalLoader";
import MobileFlowSteps from "./MobileFlowSteps";
import PersonalizedProductPreview from "./PersonalizedProductPreview";
import { CLASSIC_SHIELD_STYLES, ClassicShieldPages } from "./NightShieldClassicPages";
import ProductSampleGallery from "./ProductSampleGallery";
import ProductWalkthroughVideo from "./ProductWalkthroughVideo";
import QuickRating from "./QuickRating";
import VerifiedReviewForm from "./VerifiedReviewForm";
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
.ns-room-instruction{margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#40506a}.ns-room-workspace{height:390px;position:relative;margin-top:16px;border:2px solid #a9812d;background-color:#fffef9;background-image:radial-gradient(circle,#cad0d8 1.2px,transparent 1.2px);background-size:24px 24px}.ns-room-workspace:before{content:"DESENEAZĂ CAMERA AICI";position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);color:#14233b;font-size:12px;font-weight:900;letter-spacing:2px;opacity:.28;white-space:nowrap}.ns-room-workspace:after{content:"pat · ușă · fereastră · lumină";position:absolute;left:50%;top:55%;transform:translateX(-50%);color:#596476;font-size:10px;font-weight:700;letter-spacing:1px;opacity:.45;white-space:nowrap}.ns-room-pencil{position:absolute;right:14px;top:12px;padding:7px 10px;background:#14233b;color:#fff8e7;font-size:9px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.ns-concern-zone{display:grid;grid-template-columns:175px 1fr;gap:16px;align-items:center;margin-top:14px;border:1px dashed #8052a0;background:#f4edf5;padding:13px 16px}.ns-concern-zone strong{display:block;color:#8052a0;font-family:Georgia,serif;font-size:15px;line-height:1.25}.ns-concern-zone span{display:block;margin-top:4px;color:#596476;font-size:10px;line-height:1.35}.ns-concern-line{min-height:42px;border-bottom:2px solid rgba(128,82,160,.45);display:flex;align-items:flex-end;padding:0 6px 7px;color:#14233b;font-size:13px;font-weight:800}.ns-room-route{display:grid;grid-template-columns:1fr 34px 1fr 34px 1fr;align-items:stretch;margin-top:15px}.ns-room-stop{min-height:116px;border:1px solid #c6ad70;background:#fffaf0;padding:11px;text-align:center}.ns-room-stop-head{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:7px}.ns-room-stop b{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#14233b;color:#e2be5c;font-family:Georgia,serif;font-size:14px}.ns-room-icon{color:#8052a0}.ns-room-stop strong{display:block;color:#14233b;font-family:Georgia,serif;font-size:14px;line-height:1.2}.ns-room-stop span{display:block;margin-top:5px;color:#596476;font-size:9px;line-height:1.35}.ns-room-arrow{display:grid;place-items:center;color:#8052a0;font-size:25px;font-weight:900}.ns-room-caption{margin:11px 0 0;text-align:center;color:#596476;font-size:10px;line-height:1.4;font-weight:700}
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
  const [deliveryAccess, setDeliveryAccess] = useState({ orderId: "", token: "" });
  const [audioPhase, setAudioPhase] = useState<"idle" | "loading" | "playing">("idle");
  const [formStep, setFormStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
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
      setContent(sanitizeNightShieldContent(delivery.output, buildNightShieldContent({ name: deliveredName, age: deliveredAge, fear: deliveredFear, fearLabel: deliveredLabel, location: deliveredLocation, helper: deliveredHelper, ritual: deliveredRitual }))); setDeliveryAccess({ orderId, token }); setShowResult(true);
    }).catch(() => undefined);
  }, []);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!name.trim()) return; if (commerce.acceptsPayments && !consent) { setConsentError("Confirmă livrarea imediată înainte de a continua către plată."); return; }
    setConsentError(""); setShowRating(false); setResultNote(""); setShowPreview(true); trackEvent("product_started", { product: "monster" }); trackEvent("product_preview_opened", { product: "monster" });
  };

  const continueFromPreview = async () => {
    setIsGenerating(true); trackEvent("product_preview_checkout_clicked", { product: "monster" });
    const generation = { type: "monster", name, age, monster: fear, context: location, interest: helper, tone: ritual };
    if (commerce.acceptsPayments) { try { await beginOrderCheckout("night-shield", { generation }); } catch (error) { alert(error instanceof Error ? error.message : "Nu am putut pregăti plata."); } finally { setIsGenerating(false); } return; }
    setShowPreview(false);
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

  return <section id="monster-away" className="relative overflow-hidden bg-brand-navy text-brand-cream">
    <div className="relative px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-brand-gold/55" />
      <div className="mx-auto grid max-w-7xl gap-12 lg:min-h-[690px] lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:gap-16">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-gold"><MoonStar size={16}/> Ritual personalizat de seară</p>
          <h1 className="mt-5 max-w-2xl font-nunito text-5xl font-black leading-[1.02] sm:text-6xl md:text-7xl">Scutul<br/><span className="text-brand-gold">de Noapte</span></h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-brand-cream/74 sm:text-lg">Un ritual creat pentru camera, emoția și reperele copilului tău. Îl ajută să numească ce simte și să parcurgă seara alături de adultul său de încredere.</p>
          <div className="mt-7 flex items-end gap-4 border-y border-white/15 py-5"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-cream/45">Produs digital</p><p className="mt-1 font-nunito text-4xl font-black leading-none text-brand-gold">{commerce.prices.nightShield}</p></div><p className="max-w-[260px] pb-0.5 text-xs font-bold leading-relaxed text-brand-cream/55">9 pagini A4 și un ghid audio, livrate după personalizare.</p></div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold text-brand-cream/72 sm:grid-cols-3">{[[BookOpen,"9 pagini"],[Printer,"Format A4"],[Headphones,"Audio cu Lumi"],[Clock3,"Gata rapid"],[Mail,"Livrare pe email"],[Check,"Fără promisiuni medicale"]].map(([Icon,label])=><span key={String(label)} className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-brand-gold"/>{String(label)}</span>)}</div>
          <a href="#configureaza-scutul" className="mt-8 inline-flex min-h-13 items-center bg-brand-gold px-6 text-sm font-black text-brand-navy transition hover:bg-brand-cream">Creează Scutul copilului<ArrowRight className="ml-2" size={18}/></a>
        </div>
        <div className="relative mx-auto w-full max-w-[710px] pb-10 pt-4">
          <div aria-hidden="true" className="absolute inset-[16%_7%_4%_12%] bg-brand-purple/35 blur-3xl"/>
          <div className="relative mx-auto aspect-[.702] w-[55%] overflow-hidden border border-brand-gold/65 bg-brand-navy shadow-[18px_28px_65px_rgba(0,0,0,.4)] [transform:rotate(-3deg)]"><Image src="/examples/scut/certificat.png" alt="Certificatul personalizat din Scutul de Noapte" fill priority sizes="360px" className="object-cover"/></div>
          <div className="absolute bottom-[2%] right-[1%] aspect-[.702] w-[43%] overflow-hidden border border-brand-gold/55 bg-brand-cream shadow-[14px_24px_50px_rgba(0,0,0,.36)] [transform:rotate(4deg)]"><Image src="/examples/scut/etichete.png" alt="Etichetele detașabile din Scutul de Noapte" fill sizes="290px" className="object-cover"/></div>
          <div className="absolute left-[1%] top-[10%] border border-brand-gold/50 bg-brand-navy/94 px-4 py-3 shadow-xl backdrop-blur-sm"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-gold">Începe cu magia cunoscută</p><p className="mt-1 text-xs font-black text-brand-cream">Certificat · Rețetă · Etichete</p></div>
          <div className="absolute bottom-0 left-[2%] flex items-center gap-3 border border-white/20 bg-brand-cream px-4 py-3 text-brand-navy shadow-xl"><span className="grid h-9 w-9 place-items-center bg-brand-purple text-white"><Play size={15} fill="currentColor"/></span><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-brand-purple">Audio ghidat</p><p className="mt-0.5 text-xs font-black">Lumi conduce ritualul</p></div></div>
        </div>
      </div>
    </div>

    <ProductSampleGallery product="monster" tone="night" eyebrow="Primele trei pagini rămân exact cum le iubești" title="Răsfoiește începutul ritualului." description="Certificatul, rețeta imaginară și etichetele deschid experiența. Urmează povestea serii, fișa «Camera mea», respirația, cardul pentru noptieră și calendarul de șapte seri." facts={["Conținut personalizat cu numele copilului","Repere familiare din camera lui","Card și etichete gata de decupat","Vocea lui Lumi pentru ritual"]} ctaHref="#configureaza-scutul" ctaLabel="Personalizează Scutul" pages={[
      {image:"/examples/scut/certificat.png",eyebrow:"Pagina 1",title:"Certificatul oficial",description:"Momentul în care copilul primește propriul Scut de Noapte.",alt:"Certificat oficial personalizat pentru Eva"},
      {image:"/examples/scut/reteta.png",eyebrow:"Pagina 2",title:"Rețeta secretă",description:"Un joc simbolic pregătit pentru ritualul vostru de seară.",alt:"Rețeta secretă din Scutul de Noapte"},
      {image:"/examples/scut/etichete.png",eyebrow:"Pagina 3",title:"Etichetele detașabile",description:"Piese printabile care transformă ritualul într-un obiect real.",alt:"Etichete detașabile pentru Scutul de Noapte"},
    ]}/>

    <ProductWalkthroughVideo product="monster" tone="night" eyebrow="Scutul, în câteva secunde" title="Vezi cum intră ritualul în seara voastră." description="De la certificat la etichete și ghidul lui Lumi: o privire rapidă asupra materialului pe care îl personalizezi, îl printezi și îl folosiți împreună." src="/videos/scutul-de-noapte.mp4" poster="/examples/scut/certificat.png" />

    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-white/15 pb-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-brand-gold">O seară, pas cu pas</p><h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Magia deschide conversația. Adultul rămâne reperul real.</h2></div><p className="max-w-2xl text-base font-semibold leading-relaxed text-brand-cream/68 sm:text-lg">Scutul nu promite dispariția fricii. Îi oferă copilului un limbaj pentru emoție, trei gesturi repetabile și o experiență pe care familia o poate relua seară de seară.</p></div>
        <div className="grid border-b border-white/15 md:grid-cols-3">{[["01","Observăm","Numiți împreună locul, sunetul sau umbra care atrage atenția."],["02","Respirăm","Lumi ghidează o respirație blândă și o formulă creată pentru copil."],["03","Încheiem","Cardul rămâne pe noptieră, iar calendarul păstrează ritmul celor șapte seri."]].map(([number,title,text])=><article key={number} className="min-h-56 border-b border-white/15 py-8 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><p className="font-mono text-sm font-black text-brand-gold">{number}</p><h3 className="mt-8 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm font-semibold leading-relaxed text-brand-cream/62">{text}</p></article>)}</div>
        <blockquote className="mt-12 max-w-4xl border-l-4 border-brand-gold pl-6 font-serif text-2xl leading-relaxed text-brand-cream sm:text-3xl">„Am găsit ceva distractiv care o ajută pe fetița mea să se liniștească atunci când îi este teamă de întuneric.”<footer className="mt-5 text-sm font-black text-brand-gold">Antonia · mamă a unei fetițe</footer></blockquote>
      </div>
    </div>

    <div id="configureaza-scutul" className="scroll-mt-24 bg-[#f7f0df] px-4 py-16 text-brand-navy sm:px-6 md:py-24">
      <div className="mx-auto max-w-6xl"><div className="mb-9 max-w-3xl"><p className="text-xs font-black uppercase tracking-[.16em] text-brand-purple">Ritualul vostru</p><h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Trei pași simpli până la Scutul copilului.</h2><p className="mt-4 text-base font-semibold leading-relaxed text-brand-navy/65">Completezi doar ce cunoști. Pentru câmpurile lăsate libere folosim variante blânde, potrivite emoției alese.</p></div>
        <div className="grid items-start gap-8 lg:grid-cols-[.75fr_1.25fr]"><aside className="border-y border-brand-navy/15 py-7 lg:sticky lg:top-28"><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Primești</p><div className="mt-6 grid gap-4 text-sm font-bold text-brand-navy/70">{[[Award,"Certificat, rețetă și etichete"],[MoonStar,"Poveste și fișa «Camera mea»"],[Wind,"Respirație și formulă de curaj"],[HeartHandshake,"Ghid, card și calendar"],[Headphones,"Audio ghidat de Lumi"]].map(([Icon,label])=><div key={String(label)} className="flex items-center gap-3"><Icon className="shrink-0 text-brand-purple" size={19}/><span>{String(label)}</span></div>)}</div></aside>
          <form onSubmit={generate} className="border border-brand-navy/12 bg-white p-5 shadow-[0_24px_65px_rgba(18,27,52,.12)] sm:p-8 md:p-10"><MobileFlowSteps items={["Copilul","Seara","Ritualul"]} accentClass="bg-brand-purple"/><div className="mb-7 flex items-center justify-between border-b border-brand-navy/10 pb-4"><p className="text-xs font-black uppercase tracking-[.14em] text-brand-purple">Pasul {formStep+1} din 3</p><p className="text-xs font-bold text-brand-navy/45">{["Despre copil","Ce se întâmplă seara","Reperele voastre"][formStep]}</p></div>
            {formStep===0&&<div><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-black">Numele copilului<input required value={name} onChange={(event)=>setName(event.target.value)} maxLength={32} placeholder="Ex: Erica" className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Vârsta copilului<select value={age} onChange={(event)=>setAge(event.target.value)} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple">{[2,3,4,5,6,7,8,9].map((value)=><option key={value} value={value}>{value} ani</option>)}</select></label></div><p className="mt-5 text-sm font-semibold leading-relaxed text-brand-navy/55">Numele va apărea pe certificat, card și în formula de curaj.</p></div>}
            {formStep===1&&<fieldset><legend className="text-sm font-black">Ce face seara mai dificilă?</legend><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{fears.map((item)=>{const Icon=item.icon;const active=fear===item.id;return <button key={item.id} type="button" onClick={()=>setFear(item.id)} className={`flex min-h-24 flex-col items-center justify-center gap-2 border px-2 text-xs font-black transition ${active?"border-brand-purple bg-brand-purple text-white":"border-brand-navy/15 bg-brand-cream/35 hover:border-brand-purple"}`}><Icon size={21}/>{item.label}</button>})}</div><p className="mt-5 text-sm font-semibold leading-relaxed text-brand-navy/55">Scutul recunoaște emoția fără să confirme existența unui pericol imaginar.</p></fieldset>}
            {formStep===2&&<div><div className="grid gap-5"><label className="text-sm font-black">Locul care atrage atenția copilului<input value={location} onChange={(event)=>setLocation(event.target.value)} maxLength={88} placeholder={defaults[fear]?.location} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Ce îl liniștește de obicei?<input value={helper} onChange={(event)=>setHelper(event.target.value)} maxLength={88} placeholder={defaults[fear]?.helper} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label><label className="text-sm font-black">Ritualul vostru de seară<input value={ritual} onChange={(event)=>setRitual(event.target.value)} maxLength={96} placeholder={defaults[fear]?.ritual} className="mt-2 w-full border border-brand-navy/20 bg-white px-4 py-3 font-semibold outline-none focus:border-brand-purple"/></label></div>{commerce.acceptsPayments&&<div className="mt-7"><DigitalPurchaseConsent checked={consent} onCheckedChange={setConsent} productLabel="Scutul de Noapte" error={consentError}/></div>}</div>}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-brand-navy/10 pt-6">{formStep>0?<button type="button" onClick={()=>setFormStep((step)=>step-1)} className="min-h-12 border border-brand-navy/20 px-5 text-sm font-black text-brand-navy transition hover:border-brand-purple hover:text-brand-purple">Înapoi</button>:<span/>}{formStep<2?<button type="button" disabled={formStep===0&&!name.trim()} onClick={()=>setFormStep((step)=>step+1)} className="ml-auto inline-flex min-h-12 items-center bg-brand-navy px-6 text-sm font-black text-white transition hover:bg-brand-purple disabled:opacity-40">Continuă<ArrowRight className="ml-2" size={17}/></button>:<button disabled={isGenerating||!name.trim()} className="ml-auto flex min-h-13 items-center justify-center gap-3 bg-brand-purple px-6 text-sm font-black text-white transition hover:bg-brand-navy disabled:opacity-50"><ShieldCheck size={20}/>Vezi previzualizarea gratuită</button>}</div>
          </form></div></div>
    </div>
    <PersonalizedProductPreview kind="night" open={showPreview} childName={name.trim()} fearLabel={selectedFear.label} helper={helper || defaults[fear]?.helper} price={commerce.prices.nightShield} paymentsEnabled={commerce.acceptsPayments} isContinuing={isGenerating} onClose={()=>setShowPreview(false)} onContinue={continueFromPreview}/>
    <MagicalLoader isVisible={isGenerating&&!showPreview}/>
    <AnimatePresence>{showResult&&content&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-navy/88 p-3 backdrop-blur-sm" onClick={()=>setShowResult(false)}><motion.div initial={{y:22,opacity:0}} animate={{y:0,opacity:1}} onClick={(event)=>event.stopPropagation()} className="max-h-[88dvh] w-full max-w-xl overflow-y-auto bg-brand-cream p-5 text-center text-brand-navy shadow-2xl md:p-8"><button type="button" onClick={()=>setShowResult(false)} className="ml-auto grid h-9 w-9 place-items-center border border-brand-navy/15" aria-label="Închide"><X size={18}/></button><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-navy text-brand-gold"><MoonStar size={30}/></div><p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-brand-purple">9 pagini personalizate</p><h2 className="mt-2 font-serif text-3xl">Scutul lui {name}</h2><p className="mt-3 text-sm leading-relaxed text-brand-navy/65">Certificatul, rețeta, etichetele, povestea, fișa „Camera mea”, cardul și calendarul de seară sunt gata.</p>{resultNote&&<p className="mt-4 border border-brand-gold/35 bg-white px-4 py-3 text-xs font-bold leading-relaxed">{resultNote}</p>}<button type="button" onClick={toggleAudio} disabled={audioPhase==="loading"} className="mt-6 flex w-full items-center justify-center gap-3 border border-brand-purple px-5 py-3 font-black text-brand-purple hover:bg-brand-purple hover:text-white disabled:opacity-50">{audioPhase==="playing"?<Pause size={20}/>:<Play size={20}/>} {audioPhase==="loading"?"Lumi pregătește vocea...":audioPhase==="playing"?"Oprește ghidul audio":"Ascultă ritualul cu Lumi"}</button><button type="button" onClick={download} disabled={isDownloading} className="mt-3 flex w-full items-center justify-center gap-3 bg-brand-navy px-5 py-4 font-black text-white disabled:opacity-50"><Download size={20}/>{isDownloading?"Pregătim PDF-ul...":"Descarcă Scutul de Noapte"}</button><EmailDelivery product="monster" filename={`Scutul_de_Noapte_${name.trim()}.pdf`} childName={name} createPdf={async()=>(await renderPdf("email")).output("blob")}/>{showRating&&<QuickRating product="monster"/>}{deliveryAccess.orderId&&<VerifiedReviewForm orderId={deliveryAccess.orderId} token={deliveryAccess.token} product="monster"/>}<FeedbackInvite product="monster"/></motion.div></motion.div>}</AnimatePresence>
    {showResult&&content&&<div aria-hidden="true" style={{position:"fixed",left:0,top:0,zIndex:-10,pointerEvents:"none"}}><style>{PDF_CSS}</style><NightShieldPages name={name} fear={fear} fearLabel={selectedFear.label} location={location||defaults[fear]?.location} helper={helper||defaults[fear]?.helper} ritual={ritual||defaults[fear]?.ritual} content={content}/></div>}
  </section>;
}

function Page({index,kicker,title,children,light=false}:{index:number;kicker:string;title:string;children:React.ReactNode;light?:boolean}){return <div id={`ns-page-${index}`} className={`ns-page${light?" ns-parent":""}`} style={{display:"none"}}><div className="ns-frame"><div className="ns-kicker">{kicker}</div><h2 className="ns-title">{title}</h2><div className="ns-rule"/>{children}<div className="ns-footer"><span>Povestea Mea Magică · Scutul de Noapte</span><span>{index} / {PAGE_COUNT}</span></div></div></div>}

function NightShieldPages({name,fear,fearLabel,location,helper,ritual,content}:{name:string;fear:string;fearLabel:string;location:string;helper:string;ritual:string;content:NightShieldContent}){
  const kit=classicShieldKits[fear]||classicShieldKits["frica de intuneric"];
  return <>
    <ClassicShieldPages name={name} fearLabel={fearLabel} location={location} helper={helper} ritual={ritual} kit={kit}/>
    <Page index={4} kicker="Povestea serii" title={content.storyTitle}><div className="ns-body">{content.storyParagraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div><div className="ns-incantation"><span>Formula serii</span><p>„{kit.spell}”</p></div></Page>
    <Page index={5} kicker="Fișa ritualului" title="Camera mea, pas cu pas" light><p className="ns-room-instruction">Desenați împreună camera, apoi uniți cele trei opriri în ordinea în care le vizitați seara. Nu căutăm pericole; recunoaștem locurile și oamenii care îi sunt familiari lui {name}.</p><div className="ns-room-workspace"><span className="ns-room-pencil">Spațiu de desen</span></div><div className="ns-concern-zone"><div><strong>Aici apare umbra sau sunetul care mă neliniștește</strong><span>Îl marcăm o singură dată, fără să îl transformăm într-un pericol.</span></div><div className="ns-concern-line">{location}</div></div><div className="ns-room-route"><div className="ns-room-stop"><div className="ns-room-stop-head"><b>1</b><BedDouble className="ns-room-icon" size={25}/></div><strong>Patul meu</strong><span>Desenez locul de unde începe ritualul.</span></div><div className="ns-room-arrow">→</div><div className="ns-room-stop"><div className="ns-room-stop-head"><b>2</b><MoonStar className="ns-room-icon" size={25}/></div><strong>Lumina mea</strong><span>Marchez semnul care mă ajută: {helper}.</span></div><div className="ns-room-arrow">→</div><div className="ns-room-stop"><div className="ns-room-stop-head"><b>3</b><HeartHandshake className="ns-room-icon" size={25}/></div><strong>Adultul meu de încredere</strong><span>Desenez unde îl pot găsi sau chema.</span></div></div><p className="ns-room-caption">Desenează camera și unește locurile în ordinea în care le vizitați seara.</p></Page>
    <Page index={6} kicker={`Cuvintele lui ${name}`} title="Respirație și formulă"><div className="ns-combo"><div className="ns-breathe"><div><strong>3 × 4</strong><span>Inspirăm până la 3<br/>Expirăm până la 4</span></div></div><div className="ns-quote">„{content.courageFormula}”</div></div><div className="ns-panel" style={{marginTop:28}}><p className="ns-body" style={{fontSize:18,margin:0}}>{content.breathingCue}</p></div><p className="ns-note" style={{marginTop:18,textAlign:"center"}}>Respirația rămâne naturală. Opriți exercițiul dacă devine inconfortabil.</p></Page>
    <Page index={7} kicker="Pentru adultul de încredere" title="Planul serii" light><p className="ns-note" style={{fontSize:16}}>{content.parentMessage}</p><div className="ns-parent-plan">{content.ritualSteps.map((step,index)=><div className="ns-parent-step" key={step.title}><b>0{index+1}</b><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="ns-parent-phrase">„Te cred. Sunt aici. Facem împreună următorul pas mic.”</div><p className="ns-note" style={{marginTop:18,textAlign:"center"}}>Scutul este un joc de conectare pentru familie. Nu înlocuiește sfatul unui medic sau specialist atunci când frica persistă ori afectează puternic somnul copilului.</p></Page>
    <div id="ns-page-8" className="ns-page ns-card-page" style={{display:"none"}}><div className="ns-frame" style={{background:"#fffaf0",borderColor:"#a9812d"}}><div className="ns-kicker" style={{color:"#8052a0"}}>Decupează pe linia punctată</div><h2 className="ns-title" style={{color:"#14233b"}}>Card pentru noptieră</h2><div className="ns-cut"><div className="ns-card"><div className="ns-stars">✦ ✦ ✦</div><h2>Scutul lui {name}</h2><p>{content.bedsideMessage}</p></div></div><div className="ns-footer" style={{color:"#596476"}}><span>Povestea Mea Magică · Scutul de Noapte</span><span>8 / {PAGE_COUNT}</span></div></div></div>
    <Page index={9} kicker="O săptămână de pași mici" title="Calendarul curajului"><div className="ns-tracker-intro"><div><span>Semnul care ajută</span><strong>{helper}</strong></div><div><span>Ritualul nostru</span><strong>{ritual}</strong></div></div><div className="ns-tracker"><div className="ns-tracker-row ns-tracker-head"><span>Seara</span><span>Am numit emoția</span><span>Am făcut ritualul</span><span>Cum m-am simțit</span></div>{Array.from({length:7},(_,index)=><div className="ns-tracker-row" key={index}><strong>{index+1}</strong><span className="ns-tracker-check">□</span><span className="ns-tracker-check">□</span><span className="ns-tracker-moods">☾ &nbsp; ◡ &nbsp; ★</span></div>)}</div><div className="ns-incantation"><span>După șapte seri</span><p style={{fontSize:15}}>Observăm dacă {name} a putut să numească emoția, să ceară ajutor și să urmeze ritualul împreună cu un adult.</p></div></Page>
  </>;
}
