"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Car, Stethoscope, CloudRain, Sparkles, Download, ShieldCheck, Plane, Clock3 } from "lucide-react";
import MagicalLoader from "./MagicalLoader";
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
  background-color: #fdfaf0;
  position: relative; overflow: hidden;
  font-family: 'Nunito', sans-serif;
  box-sizing: border-box;
  border: 1px solid #eee;
}
.ek-border {
  position: absolute; inset: 20px;
  border: 4px dashed #ff9f43; border-radius: 20px;
  background-color: white;
}
.ek-header {
  text-align: center; margin-top: 40px;
}
.ek-activity-kicker {
  color: #ff9f43; font-size: 14px; font-weight: 900;
  letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px;
}
.ek-title {
  font-family: 'Nunito', sans-serif; font-size: 42px; font-weight: 900;
  color: #ff9f43; text-transform: uppercase; letter-spacing: 2px;
  overflow-wrap: anywhere;
}
.ek-subtitle {
  font-family: 'Caveat', cursive; font-size: 32px; color: #2d3436; margin-top: 10px;
}
.ek-section {
  margin: 40px 60px;
}
.ek-section-title {
  font-size: 24px; font-weight: 900; color: #ff9f43;
  border-bottom: 2px solid #ff9f43; padding-bottom: 10px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 10px;
}
.ek-activity-instruction {
  margin: 0 0 24px; color: #636e72; font-size: 18px;
  font-weight: 700; line-height: 1.45; text-align: center;
}
.ek-radar-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
}
.ek-radar-item {
  display: flex; align-items: center; gap: 15px;
  background: #fff9f0; padding: 15px; border-radius: 12px; border: 2px solid #ffeaa7;
  font-size: 18px; font-weight: 700; color: #2d3436;
  overflow-wrap: anywhere;
}
.ek-checkbox {
  width: 30px; height: 30px; border: 3px solid #ff9f43; border-radius: 8px; background: white;
}
.ek-riddle-box {
  background: #ff9f4315; padding: 25px; border-radius: 15px; border-left: 6px solid #ff9f43;
  font-size: 22px; font-weight: 700; color: #2d3436; font-style: italic; text-align: center;
  overflow-wrap: anywhere;
}
.ek-drawing-box {
  border: 3px dashed #ff9f43; height: 400px; border-radius: 20px;
  margin-top: 20px; background: #fafafa;
}
.ek-patience-box {
  text-align: center; font-size: 20px; font-weight: 700; color: #2d3436;
  background: #fff9f0; padding: 20px; border-radius: 15px;
  overflow-wrap: anywhere;
}
.ek-story-starter {
  background: #f0f9ff; border-left: 6px solid #74b9ff; border-radius: 12px;
  padding: 18px 22px; margin-bottom: 16px;
  font-size: 19px; font-weight: 700; color: #2d3436;
  overflow-wrap: anywhere;
}
.ek-story-line {
  margin-top: 10px; border-bottom: 2px dashed #b2bec3; height: 32px;
}
.ek-tf-item {
  background: #fdf0ff; border-radius: 12px; padding: 18px 22px; margin-bottom: 14px;
  border-left: 6px solid #a29bfe;
}
.ek-tf-q { font-size: 18px; font-weight: 700; color: #2d3436; overflow-wrap: anywhere; }
.ek-tf-btns { display: flex; gap: 12px; margin-top: 12px; }
.ek-tf-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: 3px solid #a29bfe;
  font-size: 16px; font-weight: 900; color: #a29bfe; text-align: center;
}
.ek-answer-item {
  background: #fdf0ff; border-radius: 16px; padding: 22px 26px; margin-bottom: 18px;
  border-left: 8px solid #a29bfe;
}
.ek-answer-label {
  display: inline-block; background: #a29bfe; color: white; border-radius: 999px;
  padding: 6px 14px; font-size: 14px; font-weight: 900; margin-bottom: 10px;
}
.ek-answer-text {
  font-size: 18px; font-weight: 700; color: #2d3436; line-height: 1.45;
  overflow-wrap: anywhere;
}
.ek-diploma {
  margin: 30px 60px; text-align: center; border: 4px double #ff9f43;
  border-radius: 20px; padding: 30px; background: #fff9f0;
}
.ek-diploma-title { font-size: 28px; font-weight: 900; color: #ff9f43; }
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
    drawing: `${base.drawing} Agentul ${heroName} poate include în desen și ${favorite}.`,
    patience: `${base.patience} ${modeGuidance} ${ageGuidance} Dacă mai este timp, transformă ${favorite} într-un cod secret de liniștire.`,
    story_starters: (base.story_starters || []).map((starter, index) => (
      index === 0
        ? `${starter} În poveste apare și ${favorite}.`
        : starter
    )),
    true_or_false: [
      ...(base.true_or_false || []).slice(0, 2),
      {
        q: `Într-o misiune de ${selectedDuration}, un agent bun poate alterna observația cu imaginația.`,
        a: "Adevărat. Când schimbăm activitatea, așteptarea pare mai scurtă și creierul rămâne ocupat.",
      },
    ],
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
    trackEvent("generation_completed", { product: "emergency", generationMode: "template", pageCount: 6 });
    setEkData(buildEmergencyKit({ name, age, selectedContext, interest, duration, activityMode }));
    setShowResult(true);
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
    <section id="emergency-kit" className="py-20 md:py-32 bg-[#fffdf5] relative overflow-hidden px-4">
      <MagicalLoader isVisible={isLoading} />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-600 font-bold text-sm uppercase tracking-widest mb-6">
            <ShieldCheck size={16} /> Salvare pentru Părinți
          </div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-navy leading-tight">
            Trusa Magică <span className="text-orange-500">de Urgență</span> 🚨
          </h2>
          <p className="mt-4 text-brand-navy/60 text-lg max-w-xl mx-auto">
            Așteptarea e grea? Copilul și-a pierdut răbdarea? Generează un PDF cu misiuni secrete adaptate locului în care sunteți.
          </p>
          <p className="mt-3 text-sm font-bold text-orange-600">
            Preț de lansare: 19 lei. Generează direct, fără plată online în această etapă.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl border-4 border-orange-100"
        >
          <form onSubmit={handleGenerate} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-nunito font-black text-brand-navy text-lg mb-3">
                  Cum îl cheamă pe Erou?
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
                        ? 'border-orange-500 bg-orange-50 scale-105 shadow-lg'
                        : 'border-gray-100 bg-white hover:border-orange-200'
                    }`}
                  >
                    <span className={`p-3 rounded-full ${selectedContext === c.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
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
                  Cât timp salvăm?
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
                  Stil activități
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
              className="w-full bg-orange-500 text-white py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl border-b-8 border-orange-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <Sparkles size={28} /> Generează trusa
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ════ HIDDEN PDF TEMPLATES ════ */}
      {ekData && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          <style>{EMERGENCY_STYLES}</style>
          
          {/* Page 1: Radar & Riddle */}
          <div id="ek-page-0" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 1</div>
                <div className="ek-title">Radarul Magic</div>
                <div className="ek-subtitle">Observă, găsește, bifează</div>
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

              <div className="ek-section" style={{marginTop: 60}}>
                <div className="ek-section-title">✨ Ghicitoarea Locului</div>
                <div className="ek-riddle-box">
                  {ekData.riddle}
                </div>
              </div>
            </div>
          </div>

          {/* Page 2: Drawing & Patience */}
          <div id="ek-page-1" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 2</div>
                <div className="ek-title">Creionul Agentului</div>
                <div className="ek-subtitle">Desenează și ai răbdare</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🎨 Provocarea Desenatorului</div>
                <p style={{fontSize: 18, color: '#2d3436', fontWeight: 700}}>{ekData.drawing}</p>
                <div className="ek-drawing-box"></div>
              </div>

              <div className="ek-section" style={{marginTop: 60}}>
                <div className="ek-section-title">🧘 Misiune de Răbdare</div>
                <div className="ek-patience-box">
                  {ekData.patience}
                </div>
              </div>
            </div>
          </div>

          {/* Page 3: Story Starters only */}
          <div id="ek-page-2" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 3</div>
                <div className="ek-title">Povestea Continuă</div>
                <div className="ek-subtitle">Alege un început și inventează mai departe</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">📖 Continuă Povestea!</div>
                <p style={{fontSize: 16, color: '#999', marginBottom: 28}}>Alege un început magic și inventează ce se întâmplă mai departe!</p>
                {ekData.story_starters?.map((s: string, idx: number) => (
                  <div key={idx} className="ek-story-starter">
                    {s}
                    <div className="ek-story-line" />
                    <div className="ek-story-line" />
                    <div className="ek-story-line" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 4: True/False questions */}
          <div id="ek-page-3" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-activity-kicker">Activitatea 4</div>
                <div className="ek-title">Adevărat sau Fals</div>
                <div className="ek-subtitle">Gândește, alege și încercuiește</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🧠 Adevărat sau Fals?</div>
                <p style={{fontSize: 16, color: '#999', marginBottom: 20}}>Încercuiește răspunsul tău. Răspunsurile sunt pe pagina următoare, pentru părinte.</p>
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

          {/* Page 5: Parent answer key */}
          <div id="ek-page-4" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-title">Răspunsuri</div>
                <div className="ek-subtitle">Pagina părintelui</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">✅ Cheia provocării</div>
                <p style={{fontSize: 16, color: '#999', marginBottom: 26}}>Folosește pagina aceasta doar după ce copilul a încercuit răspunsurile.</p>
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

          {/* Page 6: Diploma */}
          <div id="ek-page-5" className="ek-page">
            <div className="ek-border" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{textAlign: 'center', padding: '60px 80px'}}>
                <div style={{fontSize: 80, marginBottom: 30}}>🏅</div>
                <div style={{fontSize: 16, color: '#ff9f43', fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20}}>Ministerul Misiunilor Magice</div>
                <div style={{fontSize: 48, fontWeight: 900, color: '#ff9f43', fontFamily: 'Nunito, sans-serif', borderBottom: '3px solid #ff9f43', paddingBottom: 16, marginBottom: 16}}>DIPLOMĂ DE ONOARE</div>
                <div style={{fontSize: 22, color: '#636e72', fontWeight: 600, marginBottom: 20}}>Se acordă agentului special</div>
                <div style={{fontFamily: 'Caveat, cursive', fontSize: 72, fontWeight: 900, color: '#2d3436', marginBottom: 20}}>{name}</div>
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
              className="bg-white max-w-lg w-full rounded-[3rem] border-4 border-orange-400 relative flex flex-col overflow-hidden shadow-2xl"
            >
              <button onClick={() => setShowResult(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-500 transition-all z-10">
                ✕
              </button>
              <div className="p-10 text-center">
                <div className="text-7xl mb-6 block">🚨</div>
                <h3 className="font-nunito font-black text-3xl text-brand-navy mb-3">Misiunea a fost creată!</h3>
                <p className="text-gray-600 font-medium mb-8">
                  Agentul <span className="text-orange-500 font-black">{name}</span> are activități noi pentru <strong>{contexts.find(c => c.id === selectedContext)?.label}</strong>. Trusa are <strong>6 pagini A4</strong>: radar magic, desen creativ, completare de povești, adevărat/fals, răspunsuri pentru părinte și o diplomă de agent magic.
                </p>
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg border-b-8 border-orange-600 flex items-center justify-center gap-3 shadow-xl transition-all"
                >
                  <Download size={22} /> Descarcă Trusa PDF
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
