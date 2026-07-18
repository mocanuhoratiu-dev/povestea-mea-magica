"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Car, Stethoscope, CloudRain, Sparkles, Download, Plane, Clock3 } from "lucide-react";
import BrandMark from "./BrandMark";
import MagicalLoader from "./MagicalLoader";
import FeedbackInvite from "./FeedbackInvite";
import { trackEvent } from "@/lib/clientTelemetry";

type TrueFalseItem = {
  q: string;
  a: string;
};

type EmergencyKitData = {
  missionTitle?: string;
  missionNote?: string;
  radar?: string[];
  riddle?: string;
  drawing?: string;
  patience?: string;
  story_starters?: string[];
  true_or_false?: TrueFalseItem[];
};

const EMERGENCY_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Caveat:wght@700&display=swap');

.ek-page {
  width: 794px; height: 1123px;
  background-color: #fff9ee;
  position: relative; overflow: hidden;
  font-family: 'Nunito', sans-serif;
  box-sizing: border-box;
  border: 1px solid #eee;
}
.ek-border {
  position: absolute; inset: 20px;
  border: 4px dashed #d88b4a; border-radius: 8px;
  background-color: white;
  box-sizing: border-box;
  padding: 34px 42px;
}
.ek-header {
  text-align: center; margin: 0 0 30px;
}
.ek-activity-kicker {
  color: #d88b4a; font-size: 14px; font-weight: 900;
  letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;
}
.ek-title {
  font-family: 'Nunito', sans-serif; font-size: 38px; font-weight: 900;
  color: #d88b4a; text-transform: uppercase; letter-spacing: 2px;
  overflow-wrap: anywhere;
}
.ek-subtitle {
  font-family: 'Caveat', cursive; font-size: 29px; color: #2d3436; margin-top: 8px;
}
.ek-section {
  margin: 0;
}
.ek-section-title {
  font-size: 24px; font-weight: 900; color: #d88b4a;
  border-bottom: 2px solid #d88b4a; padding-bottom: 9px; margin-bottom: 18px;
  display: flex; align-items: center; gap: 10px;
}
.ek-activity-instruction {
  margin: 0 0 20px; color: #636e72; font-size: 17px;
  font-weight: 700; line-height: 1.45; text-align: center;
}
.ek-radar-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.ek-radar-item {
  display: flex; align-items: center; gap: 15px;
  min-height: 78px; box-sizing: border-box;
  background: #fff9f0; padding: 13px; border-radius: 12px; border: 2px solid #ffeaa7;
  font-size: 17px; font-weight: 700; color: #2d3436;
  overflow-wrap: anywhere;
}
.ek-checkbox {
  flex: 0 0 28px; width: 28px; height: 28px; border: 3px solid #d88b4a; border-radius: 8px; background: white;
}
.ek-riddle-box {
  background: #d88b4a15; padding: 22px; border-radius: 8px; border-left: 6px solid #d88b4a;
  font-size: 20px; font-weight: 700; line-height: 1.45; color: #2d3436; font-style: italic; text-align: center;
  overflow-wrap: anywhere;
}
.ek-riddle-section { margin-top: 34px; }
.ek-drawing-copy {
  margin: 0; font-size: 18px; line-height: 1.45; color: #2d3436; font-weight: 700;
  overflow-wrap: anywhere;
}
.ek-drawing-box {
  border: 3px dashed #d88b4a; height: 490px; border-radius: 8px;
  margin-top: 20px; background: #fafafa;
}
.ek-patience-page {
  height: 100%; display: flex; flex-direction: column;
}
.ek-patience-card {
  margin: 0 30px; padding: 32px 34px; border-radius: 24px;
  background: #fff9f0; border: 3px solid #ffe0af; text-align: center;
}
.ek-patience-box {
  text-align: center; font-size: 21px; line-height: 1.5; font-weight: 700; color: #2d3436;
  overflow-wrap: anywhere;
}
.ek-patience-prompt {
  margin: 18px 0 0; color: #636e72; font-size: 17px; font-weight: 700; line-height: 1.45;
}
.ek-patience-lines { margin: 20px 54px 0; flex: 1; }
.ek-patience-line { height: 52px; border-bottom: 2px dashed #f4be7d; }
.ek-story-starter {
  background: #f0f9ff; border-left: 6px solid #74b9ff; border-radius: 12px;
  padding: 14px 18px; margin-bottom: 13px;
  font-size: 17px; line-height: 1.38; font-weight: 700; color: #2d3436;
  overflow-wrap: anywhere;
}
.ek-story-line {
  margin-top: 8px; border-bottom: 2px dashed #b2bec3; height: 23px;
}
.ek-tf-item {
  background: #fdf0ff; border-radius: 12px; padding: 15px 18px; margin-bottom: 12px;
  border-left: 6px solid #a29bfe;
}
.ek-tf-q { font-size: 17px; line-height: 1.38; font-weight: 700; color: #2d3436; overflow-wrap: anywhere; }
.ek-tf-btns { display: flex; gap: 12px; margin-top: 10px; }
.ek-tf-btn {
  flex: 1; padding: 8px; border-radius: 10px; border: 3px solid #a29bfe;
  font-size: 15px; font-weight: 900; color: #a29bfe; text-align: center;
}
.ek-answer-item {
  background: #fdf0ff; border-radius: 16px; padding: 17px 20px; margin-bottom: 14px;
  border-left: 8px solid #a29bfe;
}
.ek-answer-label {
  display: inline-block; background: #a29bfe; color: white; border-radius: 999px;
  padding: 6px 14px; font-size: 14px; font-weight: 900; margin-bottom: 10px;
}
.ek-answer-text {
  font-size: 17px; font-weight: 700; color: #2d3436; line-height: 1.42;
  overflow-wrap: anywhere;
}
.ek-diploma {
  margin: 30px 60px; text-align: center; border: 4px double #d88b4a;
  border-radius: 20px; padding: 30px; background: #fff9f0;
}
.ek-diploma-title { font-size: 28px; font-weight: 900; color: #d88b4a; }
.ek-page::after {
  content: 'Povestea Mea Magică · Trusa de Răbdare';
  position: absolute; bottom: 8px; left: 0; right: 0;
  color: #d88b4a; font-size: 10px; font-weight: 900;
  letter-spacing: 1.4px; text-align: center; text-transform: uppercase;
}
.ek-diploma-name { font-size: 36px; font-weight: 900; color: #2d3436; font-family: 'Caveat', cursive; margin: 10px 0; }
.ek-diploma-stars { font-size: 36px; letter-spacing: 8px; }
`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (existing?.dataset.loading === "true") {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Nu am putut încărca ${src}.`)), { once: true });
      return;
    }

    existing?.remove();

    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error(`Încărcarea a durat prea mult: ${src}.`));
    }, 15000);

    script.src = src;
    script.dataset.loading = "true";
    script.onload = () => {
      window.clearTimeout(timeout);
      script.dataset.loading = "false";
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error(`Nu am putut încărca ${src}.`));
    };
    document.head.appendChild(script);
  });
}

type PdfInstance = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
  setFont: (fontName: string, fontStyle?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  text: (text: string | string[], x: number, y: number, options?: { lineHeightFactor?: number }) => void;
};

type PdfConstructor = new (orientation: "p", unit: "mm", format: "a4") => PdfInstance;
type Html2Canvas = (
  element: HTMLElement,
  options: {
    scale: number;
    useCORS?: boolean;
    logging?: boolean;
    windowWidth?: number;
    windowHeight?: number;
  }
) => Promise<HTMLCanvasElement>;
type WindowWithPdfLibraries = Window & typeof globalThis & {
  jspdf: { jsPDF: PdfConstructor };
  html2canvas: Html2Canvas;
};

const contexts = [
  { id: "la restaurant, asteptand mancarea", label: "La Restaurant", icon: <Utensils /> },
  { id: "la un drum lung cu masina", label: "La Drum Lung", icon: <Car /> },
  { id: "in sala de asteptare la doctor", label: "La Doctor", icon: <Stethoscope /> },
  { id: "in casa, ploua afara", label: "Acasă (Ploaie)", icon: <CloudRain /> },
  { id: "in aeroport sau avion", label: "Aeroport/Avion", icon: <Plane /> },
  { id: "la coada sau institutii", label: "La Coadă", icon: <Clock3 /> },
];

const durationOptions = [
  { id: "5-10 minute", label: "5-10 min" },
  { id: "10-20 minute", label: "10-20 min" },
  { id: "20+ minute", label: "20+ min" },
];

const activityModes = [
  { id: "liniștite", label: "Liniștite" },
  { id: "cu mișcare mică", label: "Mișcare mică" },
  { id: "mix", label: "Mix" },
];

const EMERGENCY_KITS: Record<string, EmergencyKitData> = {
  "la restaurant, asteptand mancarea": {
    missionTitle: "Operațiunea Farfuria Secretă",
    missionNote: "Creată pentru momentele dintre comandă și mâncare, când masa devine teren de observație.",
    radar: [
      "Un obiect rotund pe masă",
      "O culoare care apare de 3 ori în restaurant",
      "Un chelner sau o chelneriță care se mișcă repede",
      "Un sunet făcut de tacâmuri sau pahare",
    ],
    riddle: "Stau pe masă lângă tine, țin supă, paste sau măsline. Cine sunt?",
    drawing: "Desenează o farfurie magică în care fiecare aliment are o superputere.",
    patience: "Misiunea Micului Degustător: alege 3 mirosuri, 3 culori și 3 sunete din restaurant, apoi spune-le în șoaptă adultului.",
    story_starters: [
      "În restaurantul secret al dragonilor politicoși, meniul începea să vorbească...",
      "O linguriță curajoasă a pornit într-o misiune printre farfurii...",
      "Când bucătarul a scăpat un strop de magie în supă, masa noastră s-a transformat în...",
    ],
    true_or_false: [
      { q: "Papilele gustative ne ajută să simțim gustul mâncării.", a: "Adevărat. Ele sunt mici ajutoare de pe limbă." },
      { q: "Toate restaurantele gătesc mâncarea în exact același fel.", a: "Fals. Fiecare bucătar are rețete și trucuri diferite." },
      { q: "Mirosul ne poate ajuta să ghicim ce mâncare se pregătește.", a: "Adevărat. Nasul trimite creierului indicii despre mâncare." },
    ],
  },
  "la un drum lung cu masina": {
    missionTitle: "Expediția Kilometrilor Magici",
    missionNote: "Creată pentru drumuri lungi, când geamul mașinii devine ecran de explorator.",
    radar: [
      "Un indicator rutier albastru sau verde",
      "O mașină cu o culoare rară",
      "Un camion, autobuz sau tractor",
      "Un pod, o benzinărie sau un câmp mare",
    ],
    riddle: "Am roți și nu sunt pantof, duc familia loc cu loc. Cine sunt?",
    drawing: "Desenează mașina voastră transformată într-un vehicul de aventură.",
    patience: "Radarul Kilometrilor: numără 10 mașini, apoi inventează pentru fiecare o destinație amuzantă.",
    story_starters: [
      "La kilometrul 100, drumul a deschis o poartă spre un oraș făcut din indicatoare...",
      "O mașină roșie a clipit din faruri și ne-a invitat la o cursă magică...",
      "Pe marginea drumului, un nor coborât pe câmp căuta un copilot curajos...",
    ],
    true_or_false: [
      { q: "Centura de siguranță ajută corpul să stea protejat în mașină.", a: "Adevărat. Centura este unul dintre cei mai buni paznici ai pasagerilor." },
      { q: "Mașinile au nevoie de mâncare ca oamenii.", a: "Fals. Ele au nevoie de combustibil sau energie electrică." },
      { q: "Indicatoarele rutiere ajută șoferii să înțeleagă drumul.", a: "Adevărat. Ele dau reguli și indicii importante." },
    ],
  },
  "in sala de asteptare la doctor": {
    missionTitle: "Misiunea Curajului Calm",
    missionNote: "Creată pentru sala de așteptare, unde răbdarea și curajul lucrează în echipă.",
    radar: [
      "Un ceas, un afiș sau un număr de ordine",
      "Un scaun de o culoare interesantă",
      "O plantă, o revistă sau o jucărie",
      "Un obiect care ajută doctorii sau asistentele",
    ],
    riddle: "Ascult inimioare și respir, port halat și ajut zâmbind. Cine sunt?",
    drawing: "Desenează o insignă de curaj pentru un agent care merge la doctor.",
    patience: "Misiunea Respirației Curajoase: inspiră 4 secunde, ține aerul 2 secunde, expiră 4 secunde. Repetă de 4 ori.",
    story_starters: [
      "În sala de așteptare, un stetoscop mic a început să spună povești despre curaj...",
      "Un plasture cu pelerină căuta un agent special care să-l ajute...",
      "Când ușa cabinetului s-a deschis, de acolo a ieșit o lumină calmă care șoptea...",
    ],
    true_or_false: [
      { q: "Doctorii și asistentele îi ajută pe oameni să aibă grijă de corpul lor.", a: "Adevărat. Ei verifică, explică și ajută când ceva ne supără." },
      { q: "Respirația lentă poate ajuta corpul să se liniștească.", a: "Adevărat. Când respirăm încet, corpul primește semnal că este în siguranță." },
      { q: "Trebuie să fii perfect nemișcat ca să fii curajos.", a: "Fals. Curajul înseamnă să încerci, chiar dacă ai emoții." },
    ],
  },
  "in casa, ploua afara": {
    missionTitle: "Laboratorul Ploii de Acasă",
    missionNote: "Creată pentru zile ploioase, când casa se transformă în stație de cercetare.",
    radar: [
      "O picătură pe geam sau pe balcon",
      "Un obiect moale bun de cuibărit",
      "O umbră interesantă pe perete",
      "Un sunet făcut de ploaie, vânt sau casă",
    ],
    riddle: "Cad din nori, dansez pe geam, ud pământul fără ham. Cine sunt?",
    drawing: "Desenează un castel din nori care trimite picături-vrăjitori pe pământ.",
    patience: "Concertul Ploii: ascultă 5 sunete din casă și dă fiecăruia un nume de instrument magic.",
    story_starters: [
      "Când prima picătură a bătut în geam, casa a primit o invitație la balul norilor...",
      "O umbrelă uitată în hol a început să povestească despre o insulă ploioasă...",
      "Într-o zi cu ploaie, pernele din sufragerie s-au transformat în munți moi...",
    ],
    true_or_false: [
      { q: "Ploaia ajută plantele să crească.", a: "Adevărat. Apa din ploaie hrănește plantele și pământul." },
      { q: "Norii sunt făcuți din vată de zahăr.", a: "Fals. Norii sunt formați din picături foarte mici de apă sau cristale de gheață." },
      { q: "Putem inventa jocuri interesante chiar și când stăm în casă.", a: "Adevărat. Imaginația poate transforma camera într-o lume întreagă." },
    ],
  },
  "in aeroport sau avion": {
    missionTitle: "Expediția Norilor Cuminți",
    missionNote: "Creată pentru aeroporturi, porți de îmbarcare și zboruri, când răbdarea trebuie să stea pe scaun cu centura pusă.",
    radar: [
      "Un panou cu litere sau numere",
      "O valiză cu o culoare interesantă",
      "Un avion, o poartă sau o uniformă",
      "Un sunet făcut de roți, anunțuri sau motoare",
    ],
    riddle: "Am aripi, dar nu sunt pasăre, duc oameni peste zare. Cine sunt?",
    drawing: "Desenează avionul vostru transformat într-o navă care adună nori pufoși.",
    patience: "Turnul de Control Calm: inspiră când vezi o valiză, expiră când auzi un anunț. Repetă de 5 ori.",
    story_starters: [
      "La poarta de îmbarcare, o valiză mov a început să șoptească o hartă secretă...",
      "Avionul cu aripi de nor căuta un copilot curajos care să numere stelele...",
      "Un pașaport magic a deschis o ușă către o țară făcută din nori pufoși...",
    ],
    true_or_false: [
      { q: "Avioanele au aripi care le ajută să se ridice în aer.", a: "Adevărat. Forma aripilor ajută avionul să zboare." },
      { q: "Centura din avion este doar decor.", a: "Fals. Centura ajută pasagerii să stea în siguranță." },
      { q: "În aeroport, panourile ajută oamenii să găsească zborul potrivit.", a: "Adevărat. Ele arată porți, ore și destinații." },
    ],
  },
  "la coada sau institutii": {
    missionTitle: "Misiunea Răbdării Oficiale",
    missionNote: "Creată pentru cozi, ghișee și instituții, când timpul trece mai încet și copilul are nevoie de o misiune discretă.",
    radar: [
      "Un număr afișat, un tichet sau un ceas",
      "O persoană cu un obiect albastru",
      "Un scaun liber sau o plantă",
      "Un semn cu litere mari",
    ],
    riddle: "Stau la rând fără să fug, aștept calm și nu mă smulg. Ce exersez?",
    drawing: "Desenează un robot politicos care știe să stea la rând și să zâmbească.",
    patience: "Agentul Tăcut: alege 5 obiecte din jur și inventează pentru fiecare o superputere în șoaptă.",
    story_starters: [
      "Într-o instituție foarte serioasă, un creion a primit misiunea să facă lumea să zâmbească...",
      "Un tichet de ordine a fugit de pe ecran și a cerut ajutorul unui agent răbdător...",
      "Când coada a devenit prea lungă, podeaua s-a transformat într-o hartă secretă...",
    ],
    true_or_false: [
      { q: "Când stăm la rând, fiecare persoană își așteaptă rândul.", a: "Adevărat. Rândul ajută oamenii să fie tratați corect." },
      { q: "Răbdarea înseamnă să nu ai niciodată emoții.", a: "Fals. Poți avea emoții și totuși poți aștepta cu ajutor." },
      { q: "Un joc de observație poate face așteptarea să pară mai scurtă.", a: "Adevărat. Când mintea are o misiune, timpul trece mai ușor." },
    ],
  },
};

function addSearchableTextLayer(pdf: PdfInstance, text: string, pageWidth: number) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return;

  pdf.setFont("times", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  const lines = pdf.splitTextToSize(cleanText, pageWidth - 20).slice(0, 80);
  pdf.text(lines, 10, 10, { lineHeightFactor: 1.05 });
}

function parseTrueFalseAnswer(answer: string) {
  const clean = answer.replace(/\s+/g, " ").trim();
  const isFalse = /^fals\b/i.test(clean);
  const isTrue = /^adev[ăa]rat\b/i.test(clean);
  const label = isFalse ? "Fals" : isTrue ? "Adevărat" : "Răspuns";
  const explanation = clean.replace(/^(adev[ăa]rat|fals)\s*[:.-]?\s*/i, "");
  return { label, explanation: explanation || clean };
}

function cleanText(value: string, fallback: string, maxLength = 50) {
  const clean = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim() || fallback;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function getAgeGuidance(age: string) {
  const ageNumber = Number.parseInt(age, 10) || 4;
  if (ageNumber <= 3) return "Alege un singur pas pe rând și bifează fiecare descoperire împreună cu copilul.";
  if (ageNumber <= 6) return "Citește câte o cerință, apoi lasă copilul să aleagă următorul pas.";
  return "Invită copilul să inventeze propriile indicii înainte de următoarea activitate.";
}

function buildEmergencyKit({
  name,
  age,
  selectedContext,
  interest,
  duration,
  activityMode,
}: {
  name: string;
  age: string;
  selectedContext: string;
  interest: string;
  duration: string;
  activityMode: string;
}): EmergencyKitData {
  const base = EMERGENCY_KITS[selectedContext] || EMERGENCY_KITS[contexts[0].id];
  const heroName = cleanText(name, "agentul special", 28);
  const favorite = cleanText(interest, "imaginația lui/ei", 42);
  const selectedDuration = cleanText(duration, "10-20 minute", 18);
  const selectedMode = cleanText(activityMode, "mix", 24);
  const ageGuidance = getAgeGuidance(age);
  const modeGuidance = selectedMode === "liniștite"
    ? "Păstrează misiunea în șoaptă și fă fiecare pas pe rând."
    : selectedMode === "cu mișcare mică"
      ? "Adaugă trei mișcări mici, ca un cod secret de agent."
      : "Alternează observația liniștită cu o mișcare mică de agent."

  return {
    ...base,
    drawing: cleanText(`${base.drawing} Agentul ${heroName} poate include în desen și ${favorite}.`, base.drawing || "Desenează o misiune magică.", 210),
    patience: cleanText(`${base.patience} ${modeGuidance} ${ageGuidance}`, base.patience || "Alege o activitate liniștită și fă-o pas cu pas.", 270),
    story_starters: (base.story_starters || []).map((starter, index) => (
      index === 0
        ? cleanText(`${starter} În poveste apare și ${favorite}.`, starter, 150)
        : cleanText(starter, "Începe o poveste magică...", 150)
    )),
    true_or_false: [
      ...(base.true_or_false || []).slice(0, 2),
      {
        q: cleanText(`Într-o misiune de ${selectedDuration}, un agent bun poate alterna observația cu imaginația.`, "Un agent bun poate alterna observația cu imaginația.", 150),
        a: "Adevărat. Când schimbăm activitatea, așteptarea pare mai scurtă și creierul rămâne ocupat.",
      },
    ],
  };
}

function mergeEmergencyKit(generated: Partial<EmergencyKitData>, fallback: EmergencyKitData): EmergencyKitData {
  const fallbackRadar = fallback.radar || [];
  const generatedRadar = Array.isArray(generated.radar) ? generated.radar : [];
  const fallbackStories = fallback.story_starters || [];
  const generatedStories = Array.isArray(generated.story_starters) ? generated.story_starters : [];
  const fallbackAnswers = fallback.true_or_false || [];
  const generatedAnswers = Array.isArray(generated.true_or_false) ? generated.true_or_false : [];

  return {
    missionTitle: cleanText(generated.missionTitle || "", fallback.missionTitle || "Misiunea Agentului Calm", 48),
    missionNote: cleanText(generated.missionNote || "", fallback.missionNote || "O misiune creată pentru momentul vostru.", 130),
    radar: Array.from({ length: 4 }, (_, index) => cleanText(generatedRadar[index] || "", fallbackRadar[index] || "Un indiciu secret din jurul tău", 68)),
    riddle: cleanText(generated.riddle || "", fallback.riddle || "Găsește indiciul magic din jurul tău.", 210),
    drawing: cleanText(generated.drawing || "", fallback.drawing || "Desenează o aventură magică.", 210),
    patience: cleanText(generated.patience || "", fallback.patience || "Alege un pas liniștit și fă-l pe rând.", 270),
    story_starters: Array.from({ length: 3 }, (_, index) => cleanText(generatedStories[index] || "", fallbackStories[index] || "Începe aici o poveste magică...", 150)),
    true_or_false: Array.from({ length: 3 }, (_, index) => {
      const generatedItem = generatedAnswers[index];
      const fallbackItem = fallbackAnswers[index] || { q: "O întrebare de agent.", a: "Adevărat. Fiecare observație poate deveni o descoperire." };

      return {
        q: cleanText(generatedItem?.q || "", fallbackItem.q, 155),
        a: cleanText(generatedItem?.a || "", fallbackItem.a, 200),
      };
    }),
  };
}

export default function EmergencyKit() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("1");
  const [selectedContext, setSelectedContext] = useState(contexts[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [ekData, setEkData] = useState<EmergencyKitData | null>(null);
  const [interest, setInterest] = useState("");
  const [duration, setDuration] = useState(durationOptions[1].id);
  const [activityMode, setActivityMode] = useState(activityModes[2].id);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    trackEvent("product_started", { product: "emergency" });
    setIsLoading(true);

    const fallback = buildEmergencyKit({ name, age, selectedContext, interest, duration, activityMode });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "emergency",
          name,
          age,
          context: selectedContext,
          interest,
          duration,
          activityMode,
        }),
      });
      const payload = await response.json() as { success?: boolean; data?: Partial<EmergencyKitData> };
      if (response.ok && payload.success && payload.data) {
        setEkData(mergeEmergencyKit(payload.data, fallback));
        trackEvent("generation_completed", { product: "emergency", generationMode: "ai", pageCount: 7 });
      } else {
        setEkData(fallback);
        trackEvent("generation_completed", { product: "emergency", generationMode: "template", pageCount: 7 });
      }
    } catch (error) {
      console.error("Nu am putut genera trusa cu AI:", error);
      setEkData(fallback);
      trackEvent("generation_completed", { product: "emergency", generationMode: "template", pageCount: 7 });
    } finally {
      setIsLoading(false);
      setShowResult(true);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      ]);

      const { jsPDF } = (window as WindowWithPdfLibraries).jspdf;
      const html2canvas = (window as WindowWithPdfLibraries).html2canvas;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();

      const pages = document.querySelectorAll('[id^="ek-page-"]');
      
      for (let i = 0; i < pages.length; i++) {
        const el = pages[i] as HTMLElement;
        el.style.display = 'block';
        
        try {
          const canvas = await html2canvas(el, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            windowWidth: 794,
            windowHeight: 1123,
          });
          addSearchableTextLayer(pdf, el.innerText, W);
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H);
        } finally {
          el.style.display = 'none';
        }
        
        if (i < pages.length - 1) pdf.addPage();
      }

      pdf.save(`Trusa_Urgenta_${name.trim()}.pdf`);
      trackEvent("pdf_downloaded", { product: "emergency", pageCount: pages.length });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Nu am putut genera PDF-ul.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="emergency-kit" className="relative overflow-hidden bg-brand-cream px-4 py-20 md:py-32">
      <MagicalLoader isVisible={isLoading} />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="mb-6 inline-flex items-center gap-2 border border-brand-orange/30 bg-brand-orange/10 px-5 py-2 text-sm font-bold uppercase tracking-widest text-brand-orange">
            <BrandMark className="h-5 w-5" /> Pentru timpul de așteptare
          </div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-navy leading-tight">
            Trusa de <span className="text-brand-orange">Răbdare</span>
          </h2>
          <p className="mt-4 text-brand-navy/60 text-lg max-w-xl mx-auto">
            Misiuni mici pentru drum, restaurant, medic sau orice moment în care timpul pare să treacă mai greu.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-brand-orange/25 bg-white p-8 shadow-2xl md:p-14"
        >
          <form onSubmit={handleGenerate} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-nunito font-black text-brand-navy text-lg mb-3">
                  Cum îl cheamă copilul?
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Sofia"
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-6 py-4 text-brand-navy font-bold text-xl outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-lg mb-3">
                  Ce vârstă are?
                </label>
                <input
                  type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="10"
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-6 py-4 text-brand-navy font-bold text-xl outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-nunito font-black text-brand-navy text-lg mb-4 text-center">
                Unde vă aflați acum?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {contexts.map(c => (
                  <button key={c.id} type="button" onClick={() => setSelectedContext(c.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-4 transition-all duration-200 ${
                      selectedContext === c.id
                        ? 'border-brand-orange bg-brand-orange/10 scale-105 shadow-lg'
                        : 'border-gray-100 bg-white hover:border-brand-orange/30'
                    }`}
                  >
                    <span className={`p-3 rounded-full ${selectedContext === c.id ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {c.icon}
                    </span>
                    <span className="text-sm font-black text-brand-navy text-center">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Ce îl/o captivează?
                </label>
                <input
                  type="text"
                  value={interest}
                  onChange={e => setInterest(e.target.value)}
                  placeholder="dinozauri, pisici, mașini..."
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Cât timp aveți?
                </label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all appearance-none"
                >
                  {durationOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Ritmul activităților
                </label>
                <select
                  value={activityMode}
                  onChange={e => setActivityMode(e.target.value)}
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all appearance-none"
                >
                  {activityModes.map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              type="submit" disabled={!name.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-3 bg-brand-orange py-6 text-xl font-black text-white shadow-xl transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-30 md:text-2xl"
            >
              <Sparkles size={28} /> Pregătește trusa
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ════ HIDDEN PDF TEMPLATES ════ */}
      {ekData && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          <style>{EMERGENCY_STYLES}</style>
          
          {/* Page 1: Radar & riddle */}
          <div id="ek-page-0" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Misiunea lui {cleanText(name, "agentul special", 28)}</div>
                <div className="ek-title">Radarul Magic</div>
                <div className="ek-subtitle">{ekData.missionTitle}</div>
              </div>

              <div className="ek-section">
                <p className="ek-activity-instruction">Găsește cele patru lucruri din jurul tău și bifează fiecare descoperire.</p>
                <div className="ek-radar-grid">
                  {ekData.radar?.map((r: string, idx: number) => (
                    <div key={idx} className="ek-radar-item">
                      <div className="ek-checkbox"></div>
                      <span>{r.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ek-section ek-riddle-section">
                <div className="ek-section-title">✨ Ghicitoarea Locului</div>
                <div className="ek-riddle-box">
                  {ekData.riddle}
                </div>
              </div>
            </div>
          </div>

          {/* Page 2: Drawing */}
          <div id="ek-page-1" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 2</div>
                <div className="ek-title">Creionul Agentului</div>
                <div className="ek-subtitle">Desenează o idee care apare doar la voi</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🎨 Provocarea Desenatorului</div>
                <p className="ek-drawing-copy">{ekData.drawing}</p>
                <div className="ek-drawing-box"></div>
              </div>
            </div>
          </div>

          {/* Page 3: Patience mission */}
          <div id="ek-page-2" className="ek-page">
            <div className="ek-border ek-patience-page">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 3 · {ekData.missionTitle}</div>
                <div className="ek-title">Misiunea de Răbdare</div>
                <div className="ek-subtitle">Fă un pas mic, apoi încă unul</div>
              </div>

              <div className="ek-patience-card">
                <div className="ek-patience-box">{ekData.patience}</div>
                <p className="ek-patience-prompt">După fiecare pas, bifează-l în minte ca un agent care își termină misiunea.</p>
              </div>
              <div className="ek-patience-lines" aria-hidden="true">
                <div className="ek-patience-line"></div>
                <div className="ek-patience-line"></div>
                <div className="ek-patience-line"></div>
                <div className="ek-patience-line"></div>
                <div className="ek-patience-line"></div>
              </div>
            </div>
          </div>

          {/* Page 4: Story starters */}
          <div id="ek-page-3" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 4</div>
                <div className="ek-title">Povestea Continuă</div>
                <div className="ek-subtitle">Alege un început și inventează mai departe</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">📖 Continuă Povestea!</div>
                <p style={{fontSize: 16, color: '#777', fontWeight: 700, margin: '0 0 18px'}}>Alege un început magic și spune ce se întâmplă mai departe.</p>
                {ekData.story_starters?.map((s: string, idx: number) => (
                  <div key={idx} className="ek-story-starter">
                    {s}
                    <div className="ek-story-line" />
                    <div className="ek-story-line" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 5: True/false questions */}
          <div id="ek-page-4" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 5</div>
                <div className="ek-title">Adevărat sau Fals</div>
                <div className="ek-subtitle">Gândește, alege și încercuiește</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🧠 Adevărat sau Fals?</div>
                <p style={{fontSize: 16, color: '#777', fontWeight: 700, margin: '0 0 18px'}}>Încercuiește răspunsul tău. Răspunsurile sunt pe pagina următoare, pentru părinte.</p>
                {ekData.true_or_false?.map((item, idx) => (
                  <div key={idx} className="ek-tf-item">
                    <div className="ek-tf-q">{idx + 1}. {item.q}</div>
                    <div className="ek-tf-btns">
                      <div className="ek-tf-btn">ADEVĂRAT</div>
                      <div className="ek-tf-btn">FALS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 6: Parent answer key */}
          <div id="ek-page-5" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Pentru părinte</div>
                <div className="ek-title">Răspunsuri</div>
                <div className="ek-subtitle">Cheia provocării</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">✅ Cheia provocării</div>
                <p style={{fontSize: 16, color: '#777', fontWeight: 700, margin: '0 0 20px'}}>Folosește pagina aceasta doar după ce copilul a încercuit răspunsurile.</p>
                {ekData.true_or_false?.map((item, idx) => {
                  const answer = parseTrueFalseAnswer(item.a);
                  return (
                    <div key={idx} className="ek-answer-item">
                      <div className="ek-answer-label">{idx + 1}. {answer.label}</div>
                      <div className="ek-answer-text">{answer.explanation}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Page 7: Diploma */}
          <div id="ek-page-6" className="ek-page">
            <div className="ek-border" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{textAlign: 'center', padding: '40px 30px', width: '100%', boxSizing: 'border-box'}}>
                <div style={{fontSize: 72, marginBottom: 24}}>🏅</div>
                <div style={{fontSize: 16, color: '#d88b4a', fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20}}>Povestea Mea Magică · Trusa de Răbdare</div>
                <div style={{fontSize: 44, fontWeight: 900, color: '#d88b4a', fontFamily: 'Nunito, sans-serif', borderBottom: '3px solid #d88b4a', paddingBottom: 16, marginBottom: 16}}>DIPLOMĂ DE RĂBDARE</div>
                <div style={{fontSize: 22, color: '#636e72', fontWeight: 600, marginBottom: 20}}>Se acordă agentului special</div>
                <div style={{fontFamily: 'Caveat, cursive', fontSize: 64, fontWeight: 900, color: '#2d3436', marginBottom: 20, overflowWrap: 'anywhere'}}>{cleanText(name, "Agentul Special", 28)}</div>
                <div style={{fontSize: 20, color: '#636e72', fontWeight: 600, marginBottom: 40, lineHeight: 1.6}}>
                  pentru finalizarea cu brio a tuturor misiunilor secrete<br/>și demonstrarea unui curaj excepțional!
                </div>
                <div style={{fontSize: 48, letterSpacing: 12}}>⭐⭐⭐</div>
                <div style={{marginTop: 50, display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderTop: '2px solid #636e72', width: 180, marginBottom: 8}}></div>
                    <div style={{fontSize: 14, color: '#636e72', fontWeight: 700}}>Ministrul Magiei</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderTop: '2px solid #636e72', width: 180, marginBottom: 8}}></div>
                    <div style={{fontSize: 14, color: '#636e72', fontWeight: 700}}>Agentul Special</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="relative flex w-full max-w-lg flex-col overflow-hidden border border-brand-orange/40 bg-white shadow-2xl"
            >
              <button onClick={() => setShowResult(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-500 transition-all z-10">
                ✕
              </button>
              <div className="p-10 text-center">
                <div className="text-7xl mb-6 block">🚨</div>
                <h3 className="font-nunito font-black text-3xl text-brand-navy mb-3">Trusa este pregătită!</h3>
                <p className="text-gray-600 font-medium mb-8">
                  {name} are activități create pentru <strong>{contexts.find(c => c.id === selectedContext)?.label}</strong>. Trusa are <strong>7 pagini A4</strong>: radar, desen, misiune de răbdare, poveste, adevărat/fals, răspunsuri pentru părinte și diplomă.
                </p>
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex w-full items-center justify-center gap-3 bg-brand-orange py-5 text-lg font-black text-white shadow-xl transition-colors hover:bg-brand-navy"
                >
                  <Download size={22} /> Descarcă Trusa PDF
                </motion.button>
                <FeedbackInvite product="emergency" compact />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
