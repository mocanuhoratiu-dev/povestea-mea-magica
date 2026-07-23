"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Castle, Cloud, FileText, Footprints, Image as ImageIcon, RefreshCw, Rocket, ShieldCheck, Sparkles, Star, Trees, Waves } from "lucide-react";
import LanternSignature from "@/components/LanternSignature";
import MagicalLoader from "./MagicalLoader";
import FeedbackInvite from "./FeedbackInvite";
import QuickRating from "./QuickRating";
import EmailDelivery from "./EmailDelivery";
import { commerce, siteCopy } from "@/lib/siteMode";
import { trackEvent } from "@/lib/clientTelemetry";
import { playNarration, stopNarration, subscribeToNarration } from "@/lib/narrationPlayback";
import { useMobileProductVisibility } from "@/lib/mobileProductFlow";
import MobileFlowSteps from "./MobileFlowSteps";

const STORY_NARRATION_OWNER = "story-preview";

const STORY_PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

.story-pdf-page {
  width: 794px; height: 1123px;
  background-color: #fff9ee;
  position: relative; overflow: hidden;
  font-family: 'Crimson Pro', serif;
  box-sizing: border-box;
}
.story-pdf-bg {
  position: absolute; inset: 0;
  /* Complex gradients to simulate aged paper texture and dark corners */
  background: 
    radial-gradient(circle at 50% 50%, transparent 40%, rgba(139, 105, 20, 0.15) 100%),
    radial-gradient(circle at 10% 10%, rgba(201,168,76,0.12) 0%, transparent 30%),
    radial-gradient(circle at 90% 90%, rgba(201,168,76,0.12) 0%, transparent 30%),
    linear-gradient(to right, rgba(139, 105, 20, 0.05) 0%, transparent 5%, transparent 95%, rgba(139, 105, 20, 0.05) 100%);
  opacity: 0.9;
}
.story-pdf-border {
  position: absolute; inset: 30px;
  border: 1.5px solid #e5b84f; border-radius: 4px;
}
.story-pdf-inner-border {
  position: absolute; inset: 42px;
  border: 0.5px solid rgba(201,168,76,0.2); border-radius: 2px;
}
.story-pdf-content {
  position: relative; z-index: 10;
  padding: 52px 58px 84px; height: 100%; box-sizing: border-box;
  display: flex; flex-direction: column;
}

/* Cover Page */
.story-cover-title {
  font-family: 'Cinzel', serif; font-size: 34px; font-weight: 700;
  color: #24324f; text-align: center; margin-top: 34px; line-height: 1.15;
  max-width: 620px; margin-left: auto; margin-right: auto; overflow-wrap: anywhere;
}
.story-cover-subtitle {
  font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.24em;
  color: #e5b84f; text-align: center; margin-top: 15px; text-transform: uppercase;
}
.story-cover-name {
  font-family: 'Crimson Pro', serif; font-size: 22px; color: #8052a0;
  text-align: center; margin: 18px 0 0;
}
.story-cover-img-wrap {
  margin: 42px auto; width: 470px; height: 470px;
  border: 8px solid white; border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
}
.story-cover-footer {
  margin-top: auto; text-align: center;
  font-family: 'Cinzel', serif; font-size: 10px; color: #c9a84c;
  letter-spacing: 0.2em; opacity: 0.7;
}
.story-dedication-kicker {
  font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.22em;
  color: #e5b84f; text-align: center; text-transform: uppercase; margin: 170px 0 28px;
}
.story-dedication-text {
  font-size: 34px; line-height: 1.35; color: #24324f; text-align: center;
  max-width: 560px; margin: 0 auto;
}
.story-note-text {
  font-size: 24px; line-height: 1.5; color: #8052a0; text-align: center;
  max-width: 560px; margin: 42px auto 0;
}
.story-illustration-wrap {
  margin: auto; width: 610px; height: 760px; border: 8px solid white;
  border-radius: 22px; overflow: hidden; box-shadow: 0 18px 42px rgba(0,0,0,0.14);
}

/* Text Page */
.story-text-body {
  font-size: 18.5px; line-height: 1.38; color: #24324f;
  text-align: left;
  flex: 0 0 auto;
  margin: auto 0;
}
.story-text-body--roomy {
  font-size: 20px; line-height: 1.5;
}
.story-text-body--compact {
  font-size: 17.6px; line-height: 1.34;
}
.story-text-body--final {
  padding-bottom: 76px;
}
.story-paragraph {
  margin: 0 0 9px;
}
.story-text-body--roomy .story-paragraph {
  margin-bottom: 13px;
}
.story-paragraph:last-child {
  margin-bottom: 0;
}
.story-text-page-num {
  position: absolute; bottom: 50px; left: 0; right: 0;
  text-align: center; font-family: 'Cinzel', serif; font-size: 10px;
  color: #e5b84f; opacity: 0.8;
}
.story-endmark {
  position: absolute; bottom: 81px; left: 0; right: 0;
  text-align: center; font-family: 'Cinzel', serif; font-size: 25px;
  line-height: 1; letter-spacing: 0.08em;
  color: #8052a0;
}
.story-corner {
  position: absolute; width: 40px; height: 40px; opacity: 0.4;
}
`;

function CornerSVG({ pos }: { pos: 'tl'|'tr'|'bl'|'br' }) {
  const sx = (pos === 'tr' || pos === 'br') ? -1 : 1;
  const sy = (pos === 'bl' || pos === 'br') ? -1 : 1;
  const style: React.CSSProperties = {
    position: 'absolute', width: 42, height: 42,
    top:    pos.startsWith('t') ? 16 : undefined,
    bottom: pos.startsWith('b') ? 16 : undefined,
    left:   pos.endsWith('l')   ? 16 : undefined,
    right:  pos.endsWith('r')   ? 16 : undefined,
    transform: `scale(${sx}, ${sy})`,
  };
  return (
    <svg style={style} viewBox="0 0 52 52" fill="none">
      <path d="M2 30 L2 2 L30 2" stroke="#e5b84f" strokeWidth="1.6" />
      <path d="M2 14 L14 2" stroke="#e5b84f" strokeWidth="0.9" opacity="0.55" />
      <path d="M2 22 L22 2" stroke="#e5b84f" strokeWidth="0.5" opacity="0.3" />
      <circle cx="2" cy="2" r="2.6" fill="#e5b84f" opacity="0.85" />
    </svg>
  );
}

const themes = [
  { id: "space", label: "Spațiu", icon: <Rocket />, color: "bg-blue-400 text-white", lumiHint: "o rachetă prietenoasă și o planetă care adoarme", detailHint: "o rachetă roz care știe să găsească stelele" },
  { id: "forest", label: "Pădure fermecată", icon: <Trees />, color: "bg-green-400 text-white", lumiHint: "licurici care aprind o potecă de mușchi", detailHint: "licurici albaștri care arată drumul" },
  { id: "castle", label: "Castel din nori", icon: <Castle />, color: "bg-orange-400 text-white", lumiHint: "o cheie aurie și turnuri calde de seară", detailHint: "o cheie aurie ascunsă într-un turn de nori" },
  { id: "ocean", label: "Oceanul de cristal", icon: <Waves />, color: "bg-cyan-500 text-white", lumiHint: "o scoică luminoasă și corali care șoptesc", detailHint: "o scoică luminoasă care știe drumul spre corali" },
  { id: "dinosaurs", label: "Valea dinozaurilor", icon: <Footprints />, color: "bg-lime-500 text-white", lumiHint: "un pui de dinozaur blând și frunze uriașe", detailHint: "un pui de brahiozaur blând cu pete aurii" },
  { id: "clouds", label: "Orașul din nori", icon: <Cloud />, color: "bg-sky-400 text-white", lumiHint: "felinare plutitoare și poduri pufoase", detailHint: "un felinar plutitor care se aprinde cu o idee curajoasă" },
];

const lessons = [
  "Curaj și încredere 💪",
  "Împărțitul jucăriilor 🧸",
  "Rutina de somn 🌙",
  "Importanța prieteniei 🤝",
  "Descoperirea naturii 🌱",
];

const toneOptions = [
  "Liniștită de somn",
  "Aventură blândă",
  "Amuzantă",
  "Emoțională și caldă",
];

const lessonHints: Record<string, string> = {
  "Curaj și încredere 💪": "să încerce un pas mic, chiar dacă are emoții",
  "Împărțitul jucăriilor 🧸": "să ofere ceva drag și să observe bucuria celuilalt",
  "Rutina de somn 🌙": "să pregătească seara prin trei pași liniștiți",
  "Importanța prieteniei 🤝": "să asculte un prieten și să ceară ajutor cu încredere",
  "Descoperirea naturii 🌱": "să observe un lucru mic din natură și să îl protejeze",
};

type StoryLength = "short" | "long";

const storyLengths: Array<{
  id: StoryLength;
  name: string;
  readingTime: string;
  storyPageCount: number;
  price: string;
  description: string;
}> = [
  {
    id: "short",
    name: "Poveste scurtă",
    readingTime: "5-7 minute",
    storyPageCount: 2,
    price: commerce.prices.storyShort,
    description: "Copertă, dedicație și două pagini de aventură pentru serile în care vreți o poveste întreagă, dar mai rapidă.",
  },
  {
    id: "long",
    name: "Poveste lungă",
    readingTime: "12-15 minute",
    storyPageCount: 4,
    price: commerce.prices.storyLong,
    description: "Copertă, dedicație și patru pagini de aventură pentru ritualul de seară pe îndelete.",
  },
];

const backgroundStars = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  top: `${(i * 37 + 11) % 100}%`,
  left: `${(i * 53 + 7) % 100}%`,
  size: (i * 7) % 10 + 5,
}));

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

type StoryApiData = {
  title?: string;
  text?: string;
  imagePrompt?: string;
  coverImage?: string;
  coverModel?: string;
  coverWarning?: string;
  fallback?: boolean;
  note?: string;
  model?: string;
};

function buildPollinationsFallbackUrl(theme: string, lesson: string) {
  const themeLabel = themes.find((item) => item.id === theme)?.label || "lume magică";
  const cleanLesson = lesson
    .replace(/[\uFE0E\uFE0F]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const finalPrompt = [
    "single square children's book cover illustration",
    `an unnamed child protagonist in a gentle ${themeLabel} adventure`,
    cleanLesson ? `a visual theme of ${cleanLesson}` : "a warm bedtime lesson",
    "premium watercolor and gouache children's book art",
    "soft bedtime lighting",
    "expressive child protagonist",
    "no text, no letters, no watermark",
  ].join(", ");
  const seed = encodeURIComponent(`${theme}-${cleanLesson}`.replace(/\s+/g, "-").slice(0, 80));

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true&width=1024&height=1024&seed=${seed}-cover-${Date.now()}`;
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitLongText(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.map((s) => s.trim()).filter(Boolean)) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    const words = sentence.split(/\s+/);
    let wordChunk = "";
    for (const word of words) {
      const wordCandidate = wordChunk ? `${wordChunk} ${word}` : word;
      if (wordCandidate.length > maxChars && wordChunk) {
        chunks.push(wordChunk);
        wordChunk = word;
      } else {
        wordChunk = wordCandidate;
      }
    }
    current = wordChunk;
  }

  if (current) chunks.push(current);
  return chunks;
}

function pageTextLength(units: string[]) {
  return units.reduce((total, unit, index) => total + unit.length + (index > 0 ? 2 : 0), 0);
}

function rebalanceShortFinalPage(pages: string[][], targetChars: number, maxChars: number) {
  const minFinalChars = Math.floor(targetChars * 0.78);

  while (pages.length > 1) {
    const lastPage = pages[pages.length - 1];
    const previousPage = pages[pages.length - 2];
    const lastLength = pageTextLength(lastPage);
    const previousLength = pageTextLength(previousPage);

    const movedUnit = previousPage[previousPage.length - 1];

    if (
      lastLength >= minFinalChars ||
      previousPage.length < 2 ||
      previousLength <= targetChars * 0.9 ||
      !movedUnit ||
      lastLength + movedUnit.length + 2 > maxChars
    ) {
      break;
    }

    lastPage.unshift(previousPage.pop() as string);
  }
}

function paginateStory(text: string, minimumPageCount = 4): string[] {
  const maxUnitChars = 620;
  const maxPageChars = 2550;
  let units = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongText(paragraph, maxUnitChars));

  if (!units.length) return [text];

  // Keep at least four balanced story pages, but add a page whenever the printable
  // area would otherwise overflow. Each unit ends at a sentence whenever possible.
  while (units.length < minimumPageCount) {
    const longestIndex = units.reduce(
      (longest, unit, index) => (unit.length > units[longest].length ? index : longest),
      0
    );
    const splitUnits = splitLongText(units[longestIndex], Math.max(420, Math.ceil(units[longestIndex].length / 2)));

    if (splitUnits.length < 2) break;
    units = [...units.slice(0, longestIndex), ...splitUnits, ...units.slice(longestIndex + 1)];
  }

  const totalChars = pageTextLength(units);
  const plannedPageCount = Math.max(minimumPageCount, Math.ceil(totalChars / maxPageChars));
  const targetChars = Math.ceil(totalChars / plannedPageCount);
  const preferredPageLimit = Math.min(maxPageChars, Math.ceil(targetChars * 1.12));
  const pages: string[][] = [];
  let current: string[] = [];

  for (const unit of units) {
    const candidateLength = pageTextLength([...current, unit]);
    const mayUsePlannedBreak = pages.length < plannedPageCount - 1;

    if (
      current.length &&
      (candidateLength > maxPageChars || (mayUsePlannedBreak && candidateLength > preferredPageLimit))
    ) {
      pages.push(current);
      current = [unit];
      continue;
    }

    current.push(unit);
  }

  if (current.length) pages.push(current);

  if (pages.length > 1) {
    rebalanceShortFinalPage(pages, Math.ceil(totalChars / pages.length), maxPageChars);
  }

  return pages.map((page) => page.join("\n\n"));
}

function storyTextDensityClass(chunk: string) {
  if (chunk.length < 1700) return "story-text-body story-text-body--roomy";
  if (chunk.length > 2500) return "story-text-body story-text-body--compact";
  return "story-text-body";
}

function addSearchableTextLayer(pdf: PdfInstance, text: string, pageWidth: number) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return;

  pdf.setFont("times", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  const lines = pdf.splitTextToSize(cleanText, pageWidth - 20).slice(0, 80);
  pdf.text(lines, 10, 10, { lineHeightFactor: 1.05 });
}

export default function StoryCreator() {
  const isMobileStorySelected = useMobileProductVisibility("story");
  const [name, setName] = useState("");
  const [age, setAge] = useState("1");
  const [selectedTheme, setSelectedTheme] = useState("space");
  const [lesson, setLesson] = useState(lessons[0]);
  const [storyLength, setStoryLength] = useState<StoryLength>("short");
  const [isLoading, setIsLoading] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyDetails, setStoryDetails] = useState("");
  const [themeDetail, setThemeDetail] = useState("");
  const [lessonDetail, setLessonDetail] = useState("");
  const [dedication, setDedication] = useState("");
  const [dedicationFrom, setDedicationFrom] = useState("");
  const [tone, setTone] = useState(toneOptions[0]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generationNote, setGenerationNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showQuickRating, setShowQuickRating] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const coverRequestId = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const applyLumiStoryChoice = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: string; tone?: string; lesson?: string; storyDetail?: string }>).detail;
      if (detail?.theme && themes.some((theme) => theme.id === detail.theme)) {
        setSelectedTheme(detail.theme);
      }
      if (detail?.tone && toneOptions.includes(detail.tone)) {
        setTone(detail.tone);
      }
      if (detail?.lesson && lessons.includes(detail.lesson)) {
        setLesson(detail.lesson);
      }
      if (detail?.storyDetail) {
        setThemeDetail(detail.storyDetail);
      }
    };

    window.addEventListener("pmm:lumi-story-choice", applyLumiStoryChoice);
    return () => window.removeEventListener("pmm:lumi-story-choice", applyLumiStoryChoice);
  }, []);

  const activeTheme = themes.find((theme) => theme.id === selectedTheme) ?? themes[0];
  const activeStoryLength = storyLengths.find((option) => option.id === storyLength) ?? storyLengths[0];
  const activeLessonHint = lessonHints[lesson] ?? "să transforme lecția într-o alegere mică și sinceră";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialName = params.get("nume")?.replace(/[^a-zA-ZĂÂÎȘȚăâîșț\-\s]/g, "").trim().slice(0, 24);
    const initialTheme = params.get("lume");

    const frame = window.requestAnimationFrame(() => {
      if (initialName) setName(initialName);
      if (initialTheme && themes.some((theme) => theme.id === initialTheme)) setSelectedTheme(initialTheme);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const buildStoryRequest = () => ({
    type: "story",
    name,
    age,
    theme: selectedTheme,
    lesson,
    context: storyDetails,
    tone,
    themeDetail,
    lessonDetail,
    storyLength,
  });

  const generateCoverInBackground = async (coverPrompt: string) => {
    const requestId = ++coverRequestId.current;
    setIsCoverLoading(true);

    try {
      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt: coverPrompt }),
      });
      const result = await response.json();
      const coverImage = result.data?.imageDataUrl;

      if (!response.ok || !result.success || !coverImage) {
        if (requestId === coverRequestId.current) {
          setGenerationNote("Povestea este gata. Coperta personalizată poate fi încercată din nou puțin mai târziu.");
        }
        return;
      }

      if (requestId === coverRequestId.current) {
        setImageUrl(coverImage);
        setGenerationNote("");
      }
    } catch {
      if (requestId === coverRequestId.current) {
        setGenerationNote("Povestea este gata. Coperta personalizată poate fi încercată din nou puțin mai târziu.");
      }
    } finally {
      if (requestId === coverRequestId.current) {
        setIsCoverLoading(false);
      }
    }
  };

  const handleGenerateStory = async () => {
    if (!name) return;
    coverRequestId.current += 1;
    setIsCoverLoading(false);
    trackEvent("product_started", { product: "story", storyLength });
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStoryRequest()),
      });

      const result = await response.json();
      
      if (result.success) {
        const data = (result.data || {}) as StoryApiData;
        const title = data.title || `Povestea lui ${name.trim()}`;
        const text = data.text || result.data?.choices?.[0]?.message?.content || "Magia a sosit!";
        const coverPrompt = data.imagePrompt || `${title}. ${text.slice(0, 700)}`;
        
        setStoryTitle(title);
        setStoryText(text);
        setImagePrompt(coverPrompt);
        const notes = [
          data.fallback ? data.note || "Am pregătit o poveste completă pe baza alegerilor tale." : "",
          "Povestea este gata. Coperta personalizată se pregătește în fundal.",
        ].filter(Boolean);
        setGenerationNote(notes.join(" "));
        setImageUrl(buildPollinationsFallbackUrl(selectedTheme, lesson));
        setShowQuickRating(false);
        setShowResult(true);
        void generateCoverInBackground(coverPrompt);
      } else {
        throw new Error(result.error || "Eroare API");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ceva n-a mers bine. Încearcă din nou.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateImages = async () => {
    if (!storyText || !storyTitle) return;
    setGenerationNote("Pregătim o copertă personalizată nouă.");
    await generateCoverInBackground(imagePrompt || `${storyTitle}. ${storyText.slice(0, 700)}`);
  };

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);

    useEffect(() => {
      const unsubscribe = subscribeToNarration(({ owner, phase }) => {
        const ownsNarration = owner === STORY_NARRATION_OWNER;
        setIsSpeaking(ownsNarration && phase === "playing");
        setIsNarrationLoading(ownsNarration && phase === "loading");
      });
      return () => {
        unsubscribe();
        stopNarration(STORY_NARRATION_OWNER);
      };
    }, []);

    const toggleSpeech = async () => {
      if (isSpeaking || isNarrationLoading) {
        stopNarration(STORY_NARRATION_OWNER);
        return;
      }

      try {
        await playNarration(STORY_NARRATION_OWNER, storyText, "story");
      } catch {
        setGenerationNote("Nararea audio nu este disponibilă chiar acum. Încearcă din nou în câteva clipe.");
      }
    };

    const renderStoryPdf = async (quality: "download" | "email" = "download") => {
        const [{ jsPDF }, html2canvasModule] = await Promise.all([
          import("jspdf"),
          import("html2canvas"),
        ]);
        const html2canvas = html2canvasModule.default;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const W = pdf.internal.pageSize.getWidth();
        const H = pdf.internal.pageSize.getHeight();

        const pages = document.querySelectorAll('[id^="story-page-"]');
        
        for (let i = 0; i < pages.length; i++) {
          const el = pages[i] as HTMLElement;
          el.style.display = 'block';
          
          try {
            const canvas = await html2canvas(el, {
              scale: quality === "email" ? 1.7 : 2.5,
              useCORS: true,
              logging: false,
              windowWidth: 794,
              windowHeight: 1123
            });
            
            addSearchableTextLayer(pdf, el.innerText, W);
            pdf.addImage(canvas.toDataURL('image/jpeg', quality === "email" ? 0.86 : 0.95), 'JPEG', 0, 0, W, H);
          } finally {
            el.style.display = 'none';
          }
          
          if (i < pages.length - 1) pdf.addPage();
        }

        return pdf;
    };

    const createStoryPdfBlob = async () => (await renderStoryPdf("email")).output("blob");

    const downloadPDF = async () => {
      setIsLoading(true);
      const renderStartedAt = Date.now();
      trackEvent("pdf_render_started", { product: "story" });
      try {
        const pdf = await renderStoryPdf();
        pdf.save(`Povestea_lui_${name.trim() || "Erou"}.pdf`);
        trackEvent("pdf_render_completed", { product: "story", durationMs: Date.now() - renderStartedAt });
        trackEvent("pdf_downloaded", {
          product: "story",
          pageCount: document.querySelectorAll('[id^="story-page-"]').length,
          wordCount: getWordCount(storyText),
          storyLength,
        });
        setShowQuickRating(true);
      } catch (error) {
        trackEvent("pdf_render_failed", { product: "story", durationMs: Date.now() - renderStartedAt });
        console.error(error);
        alert(error instanceof Error ? error.message : "Nu am putut genera PDF-ul.");
      } finally {
        setIsLoading(false);
      }
    };

    const storyChunks = paginateStory(storyText, activeStoryLength.storyPageCount);
    const wordCount = getWordCount(storyText);
    const pdfPageCount = storyText
      ? 2 + storyChunks.length
      : 0;
    const dedicationText = dedication.trim() || `Pentru ${name || "micul erou"}, cu toată magia unei seri liniștite.`;

    return (
      <section id="creator" className={`scroll-mt-16 py-14 md:scroll-mt-24 md:py-32 magic-gradient relative overflow-hidden px-4 ${isMobileStorySelected ? "" : "max-md:hidden"}`}>
        <MagicalLoader isVisible={isLoading} />
  
        {/* ════ HIDDEN PDF TEMPLATES ════ */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <style>{STORY_PDF_STYLES}</style>
        
        {/* Page 1: Cover */}
        <div id="story-page-0" className="story-pdf-page" style={{ display: 'none' }}>
          <div className="story-pdf-bg" />
          <div className="story-pdf-border" />
          <div className="story-pdf-inner-border" />
          {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}
          <div className="story-pdf-content" style={{ justifyContent: 'center' }}>
            <p className="story-cover-subtitle">{activeStoryLength.name}</p>
            <h1 className="story-cover-title">{(storyTitle || `Povestea lui ${name}`).toUpperCase()}</h1>
            <p className="story-cover-name">Creată pentru {name || "micul erou"}</p>
            <div className="story-cover-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <p className="story-cover-footer">Povestea Mea Magică · Lanterna Magică</p>
          </div>
        </div>

        {storyText && (
          <div id="story-page-dedication" className="story-pdf-page" style={{ display: 'none' }}>
            <div className="story-pdf-bg" />
            <div className="story-pdf-border" />
            <div className="story-pdf-inner-border" />
            {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}
            <div className="story-pdf-content">
              <p className="story-dedication-kicker">Dedicație</p>
              <p className="story-dedication-text">{dedicationText}</p>
              {dedicationFrom.trim() && <p className="story-note-text">Cu drag, {dedicationFrom.trim()}</p>}
            </div>
          </div>
        )}

        {/* Story Pages */}
        {storyChunks.map((chunk, idx) => (
          <div key={idx} id={`story-page-${idx + 1}`} className="story-pdf-page" style={{ display: 'none' }}>
            <div className="story-pdf-bg" />
            <div className="story-pdf-border" />
            {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}
            <div className="story-pdf-content">
              <div className={`${storyTextDensityClass(chunk)}${idx === storyChunks.length - 1 ? " story-text-body--final" : ""}`}>
                {chunk.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="story-paragraph">{paragraph}</p>
                ))}
              </div>
              {idx === storyChunks.length - 1 && <p className="story-endmark">Sfârșit</p>}
              <div className="story-text-page-num">Povestea Mea Magică · Pagina {idx + 1}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Result Modal */}
        {showResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-2 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-cream max-w-2xl w-full h-full max-h-[90vh] md:max-h-[85vh] rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-brand-purple/20 relative shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => {
                    setShowResult(false);
                    stopNarration(STORY_NARRATION_OWNER);
                }}
                className="absolute top-4 right-4 text-brand-navy/40 hover:text-brand-purple font-black text-xl z-20 bg-white/80 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all"
              >
                ✕
              </button>
  
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar" id="story-content">
                <div className="text-center mb-8 pt-4">
                  <Sparkles className="text-brand-purple w-10 h-10 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-nunito font-black text-2xl md:text-3xl text-brand-navy px-4">{storyTitle || `Povestea lui ${name}`} ✨</h3>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-white/70 p-3 border border-brand-purple/10">
                      <p className="text-xs font-black uppercase tracking-wider text-brand-navy/45">Cuvinte</p>
                      <p className="font-black text-brand-purple text-lg">{wordCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3 border border-brand-purple/10">
                      <p className="text-xs font-black uppercase tracking-wider text-brand-navy/45">Pagini PDF</p>
                      <p className="font-black text-brand-purple text-lg">{pdfPageCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3 border border-brand-purple/10">
                      <p className="text-xs font-black uppercase tracking-wider text-brand-navy/45">Ilustrații</p>
                      <p className="font-black text-brand-purple text-lg">1</p>
                    </div>
                  </div>
                  {generationNote && (
                    <p className="mt-4 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 px-4 py-3 text-sm font-bold text-brand-navy/70">
                      {generationNote}
                    </p>
                  )}
                </div>
  
                {imageUrl && (
                  <div className="mb-8 relative group mx-auto max-w-[500px]">
                    <motion.div 
                      key={`img-${imageUrl}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-brand-navy/5 aspect-square relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/5 via-brand-purple/10 to-brand-navy/5 animate-pulse z-0" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        key={imageUrl}
                        src={imageUrl} 
                        alt={storyTitle || "Ilustrație Magică"} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block relative z-10 transition-opacity duration-500"
                        onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                        style={{ opacity: 0 }}
                      />
                    </motion.div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={handleGenerateStory}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-white text-brand-purple border-2 border-brand-purple/20 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-brand-cream transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerează povestea
                  </button>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={!storyText || isLoading || isCoverLoading}
                    className="flex items-center justify-center gap-2 bg-white text-brand-purple border-2 border-brand-purple/20 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-brand-cream transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" /> {isCoverLoading ? "Pregătim coperta..." : "Regenerează coperta"}
                  </button>
                </div>
  
                <div className="mb-4 flex items-center gap-2 text-brand-navy/70 font-black uppercase tracking-wider text-xs">
                  <FileText className="w-4 h-4" /> Editează textul înainte de PDF
                </div>
                <textarea
                  value={storyText}
                  onChange={(event) => setStoryText(event.target.value)}
                  className="w-full min-h-[420px] rounded-2xl bg-white/75 border-2 border-brand-purple/10 focus:border-brand-purple outline-none p-5 text-brand-navy/85 font-medium leading-relaxed text-base md:text-lg resize-y shadow-inner"
                />
              </div>
  
              <div className="p-6 md:p-8 bg-white/50 border-t border-brand-navy/5 backdrop-blur-sm grid grid-cols-2 gap-4">
                <button 
                  onClick={toggleSpeech}
                  disabled={!storyText || isNarrationLoading}
                  className={`flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm md:text-base shadow-lg transition-all overflow-hidden relative ${
                    isSpeaking ? "bg-brand-navy text-white" : "bg-brand-purple text-white"
                  }`}
                >
                  {isSpeaking ? (
                    <span className="flex items-center gap-2 relative z-10">
                      <div className="flex gap-1 items-end h-4">
                        {[1,2,3].map(i => (
                          <motion.div key={i} animate={{ height: ["30%", "100%", "30%"] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-brand-gold rounded-full" />
                        ))}
                      </div>
                      Oprește Vocea
                    </span>
                  ) : isNarrationLoading ? "Pregătim vocea..." : "Ascultă Povestea 🎧"}
                  
                  {/* Subtle background glow when playing */}
                  {isSpeaking && (
                    <motion.div 
                      animate={{ opacity: [0.1, 0.3, 0.1] }} 
                      transition={{ duration: 2, repeat: Infinity }} 
                      className="absolute inset-0 bg-brand-purple mix-blend-screen pointer-events-none" 
                    />
                  )}
                </button>
                <button 
                  onClick={downloadPDF}
                  disabled={isLoading || isCoverLoading}
                  className="bg-brand-pink text-white py-4 rounded-xl font-black text-sm md:text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:cursor-wait disabled:opacity-60"
                >
                  {isCoverLoading ? "Pregătim coperta..." : "Descarcă PDF 📥"}
                </button>
              </div>
              <div className="bg-white/50 px-6 pb-6 md:px-8 md:pb-8">
                <EmailDelivery product="story" filename={`Povestea_lui_${name.trim() || "Erou"}.pdf`} childName={name} createPdf={createStoryPdfBlob} />
                {showQuickRating && <QuickRating product="story" />}
                <FeedbackInvite product="story" compact />
              </div>
            </motion.div>
          </motion.div>
        )}
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {backgroundStars.map((star) => (
          <motion.div
            key={star.id}
            animate={{ 
              x: mousePos.x * (star.id % 5 + 1),
              y: mousePos.y * (star.id % 3 + 1),
            }}
            className="absolute text-white"
            style={{ top: star.top, left: star.left }}
          >
            <Star size={star.size} fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-8 px-4 text-center md:mb-16">
          <motion.div initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} className="inline-flex flex-col items-center">
            <LanternSignature className="mb-5" size="sm" tone="paper" label="Lanterna Magică" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Pentru seară</p>
            <h2 className="mt-3 font-nunito text-3xl font-extrabold leading-tight text-brand-cream md:text-6xl">Povestea de Seară</h2>
          </motion.div>
          <p className="mt-4 text-brand-cream/90 text-lg md:text-xl font-medium">
            {siteCopy.storyIntro}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden border border-brand-purple/20 bg-white p-4 shadow-2xl md:p-16"
        >
          <MobileFlowSteps items={["Copilul", "Povestea", "PDF-ul"]} accentClass="bg-brand-purple" />
          <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5 md:space-y-8">
              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Numele copilului
                </label>
                <input
                  type="text"
                  placeholder="Vladimir, Exploratorul..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg md:text-xl shadow-inner"
                />
                <p className="mt-3 text-sm font-bold leading-relaxed text-brand-navy/55">
                  Nu cerem fotografii. Folosim aceste detalii doar pentru materialul pe care îl generezi. <a href="/politica-de-confidentialitate" className="text-brand-purple underline underline-offset-2">Citește politica de confidențialitate</a>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                    Vârstă
                  </label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => <option key={v} value={v}>{v} ani</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                    Lumea
                  </label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                  >
                    {themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-brand-navy md:mb-3 md:text-base">
                  Cât timp aveți pentru poveste?
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {storyLengths.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStoryLength(option.id)}
                      aria-pressed={storyLength === option.id}
                      className={`min-h-[116px] rounded-2xl border-4 p-4 text-left transition-all ${
                        storyLength === option.id
                          ? "border-brand-purple bg-white text-brand-purple shadow-md"
                          : "border-transparent bg-brand-cream/30 text-brand-navy/65"
                      }`}
                    >
                      <span className="block text-base font-black">{option.name}</span>
                      <span className="mt-2 block text-sm font-bold leading-relaxed">{option.readingTime} · {option.storyPageCount} pagini de poveste</span>
                      <span className="mt-1 block text-sm font-black">{option.price}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold leading-relaxed text-brand-navy/55">
                  Varianta scurtă păstrează o aventură completă; cea lungă lasă mai mult loc pentru explorare și dialog.
                </p>
              </div>

              <aside className="border-y border-brand-purple/15 py-4" aria-live="polite">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">Ideea lui Lumi</p>
                <p className="mt-2 text-sm font-bold leading-relaxed text-brand-navy/70">În {activeTheme.label}, {activeTheme.lumiHint}. Pentru lecția de azi, {activeLessonHint}.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setThemeDetail((current) => current || activeTheme.detailHint)} className="border border-brand-purple/25 px-3 py-2 text-xs font-black text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple hover:text-white">Adaugă ideea lumii</button>
                  <button type="button" onClick={() => setLessonDetail((current) => current || activeLessonHint)} className="border border-brand-purple/25 px-3 py-2 text-xs font-black text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple hover:text-white">Adaugă ideea lecției</button>
                </div>
              </aside>

              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Ce învățăm astăzi?
                </label>
                <select
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                >
                  {lessons.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Tonul poveștii
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTone(option)}
                      className={`px-4 py-3 rounded-2xl border-4 text-left font-black text-sm transition-all ${
                        tone === option
                          ? "border-brand-purple bg-white text-brand-purple shadow-md"
                          : "border-transparent bg-brand-cream/30 text-brand-navy/65"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <details className="rounded-2xl border-2 border-brand-purple/15 bg-brand-cream/30 p-5">
                <summary className="cursor-pointer list-none font-black text-brand-navy">
                  Mai adaugă detalii pentru o poveste și mai personală <span className="text-sm text-brand-navy/55">(opțional)</span>
                </summary>
                <div className="mt-6 space-y-6 border-t border-brand-purple/15 pt-6">
                  <div>
                    <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">Detalii despre lume</label>
                    <p className="mb-3 text-sm font-bold leading-relaxed text-brand-navy/45">Scrie una sau două imagini concrete: o rachetă roz, licurici albaștri sau un castel din nori.</p>
                    <input type="text" placeholder="Ex: o rachetă roz, o pădure cu licurici..." value={themeDetail} onChange={(e) => setThemeDetail(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">Cum să apară lecția</label>
                    <p className="mb-3 text-sm font-bold leading-relaxed text-brand-navy/45">Spune ce vrei să exerseze copilul prin acțiune, nu ca morală.</p>
                    <input type="text" placeholder="Ex: să ceară ajutor sau să spună ce simte..." value={lessonDetail} onChange={(e) => setLessonDetail(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">Detalii despre copil</label>
                    <p className="mb-3 text-sm font-bold leading-relaxed text-brand-navy/45">O jucărie preferată, o culoare, un animal iubit sau ceva ce îl/o liniștește pot face aventura mai apropiată.</p>
                    <textarea placeholder="Opțional: iubește trenurile, are o pisică pe nume Mimi..." value={storyDetails} onChange={(e) => setStoryDetails(e.target.value)} rows={4} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">Mesaj de dedicație</label>
                    <textarea placeholder="Ex: Pentru Eva, să ai mereu curajul să explorezi lumea în felul tău." value={dedication} onChange={(e) => setDedication(e.target.value)} rows={3} maxLength={280} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">Semnat de</label>
                    <input type="text" placeholder="Ex: Mama și Tata, Bunica Ana..." value={dedicationFrom} onChange={(e) => setDedicationFrom(e.target.value)} maxLength={80} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner" />
                  </div>
                </div>
              </details>
            </div>

            <div className="flex flex-col justify-between space-y-8">
              <div className="border border-dashed border-brand-purple/30 bg-brand-cream/50 p-6 md:p-8">
                <h4 className="font-black text-brand-navy text-lg mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-brand-purple" /> {siteCopy.storyPackageTitle}
                </h4>
                <div className="border border-brand-purple bg-white p-4 md:p-5">
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-bold text-brand-navy text-sm md:text-base">{activeStoryLength.name}</span>
                    <span className="font-black text-brand-purple">{activeStoryLength.price}</span>
                  </div>
                  <p className="mt-2 text-sm text-brand-navy/50 font-bold">{activeStoryLength.description}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-brand-purple/75">{activeStoryLength.readingTime} · {activeStoryLength.storyPageCount} pagini de poveste</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGenerateStory}
                  disabled={!name}
                  className="flex w-full items-center justify-center gap-4 bg-brand-purple py-5 text-xl font-black text-white shadow-2xl transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-30 md:py-6 md:text-2xl"
                >
                  Creează povestea {storyLength === "short" ? "scurtă" : "lungă"} <Sparkles className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
