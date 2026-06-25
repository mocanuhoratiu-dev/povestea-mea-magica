"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Castle, FileText, Image as ImageIcon, RefreshCw, Rocket, ShieldCheck, Sparkles, Star, Trees } from "lucide-react";
import MagicalLoader from "./MagicalLoader";

const STORY_PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

.story-pdf-page {
  width: 794px; height: 1123px;
  background-color: #f6e8c3; /* Papyrus/old paper base */
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
  border: 1.5px solid #c9a84c; border-radius: 4px;
}
.story-pdf-inner-border {
  position: absolute; inset: 42px;
  border: 0.5px solid rgba(201,168,76,0.2); border-radius: 2px;
}
.story-pdf-content {
  position: relative; z-index: 10;
  padding: 52px 58px 56px; height: 100%;
  display: flex; flex-direction: column;
}

/* Cover Page */
.story-cover-title {
  font-family: 'Cinzel', serif; font-size: 34px; font-weight: 700;
  color: #1a0a2e; text-align: center; margin-top: 34px; line-height: 1.15;
  max-width: 620px; margin-left: auto; margin-right: auto; overflow-wrap: anywhere;
}
.story-cover-subtitle {
  font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.24em;
  color: #c9a84c; text-align: center; margin-top: 15px; text-transform: uppercase;
}
.story-cover-name {
  font-family: 'Crimson Pro', serif; font-size: 22px; color: #4a2c5f;
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
  color: #c9a84c; text-align: center; text-transform: uppercase; margin: 170px 0 28px;
}
.story-dedication-text {
  font-size: 34px; line-height: 1.35; color: #1a0a2e; text-align: center;
  max-width: 560px; margin: 0 auto;
}
.story-note-text {
  font-size: 24px; line-height: 1.5; color: #4a2c5f; text-align: center;
  max-width: 560px; margin: 42px auto 0;
}
.story-profile-title {
  font-family: 'Cinzel', serif; font-size: 30px; color: #1a0a2e;
  text-align: center; margin: 52px 0 34px;
}
.story-profile-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
}
.story-profile-item {
  border: 1px solid rgba(201,168,76,0.45); background: rgba(255,255,255,0.24);
  padding: 18px 20px; min-height: 94px;
}
.story-profile-label {
  display: block; font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.16em;
  color: #a87f2a; text-transform: uppercase; margin-bottom: 8px;
}
.story-profile-value {
  font-size: 20px; line-height: 1.25; color: #2d3436;
  overflow-wrap: anywhere;
}
.story-illustration-wrap {
  margin: auto; width: 610px; height: 760px; border: 8px solid white;
  border-radius: 22px; overflow: hidden; box-shadow: 0 18px 42px rgba(0,0,0,0.14);
}

/* Text Page */
.story-text-body {
  font-size: 17.5px; line-height: 1.38; color: #2d3436;
  text-align: left;
}
.story-text-body--roomy {
  font-size: 19px; line-height: 1.5;
}
.story-text-body--compact {
  font-size: 16.6px; line-height: 1.34;
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
  position: absolute; bottom: 31px; left: 0; right: 0;
  text-align: center; font-family: 'Cinzel', serif; font-size: 10px;
  color: #c9a84c; opacity: 0.6;
}
.story-corner {
  position: absolute; width: 40px; height: 40px; opacity: 0.4;
}
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
      <path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="1.6" />
      <path d="M2 14 L14 2" stroke="#c9a84c" strokeWidth="0.9" opacity="0.55" />
      <path d="M2 22 L22 2" stroke="#c9a84c" strokeWidth="0.5" opacity="0.3" />
      <circle cx="2" cy="2" r="2.6" fill="#c9a84c" opacity="0.85" />
    </svg>
  );
}

const themes = [
  { id: "space", label: "Spațiu", icon: <Rocket />, color: "bg-blue-400 text-white" },
  { id: "forest", label: "Pădure", icon: <Trees />, color: "bg-green-400 text-white" },
  { id: "castle", label: "Castel", icon: <Castle />, color: "bg-orange-400 text-white" },
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

const packages = [
  { id: "pdf", name: "Poveste PDF", desc: "Generează și descarcă o previzualizare", price: "PDF" },
  { id: "full", name: "Poveste + Audio", desc: "PDF + test de voce în browser", price: "Audio" }
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

type StoryApiData = {
  title?: string;
  text?: string;
  imagePrompt?: string;
  fallback?: boolean;
  note?: string;
  model?: string;
};

function buildStoryImageUrl(prompt: string, seedParts: string[]) {
  const finalPrompt = [
    prompt,
    "single square cover illustration",
    "premium watercolor and gouache children's book art",
    "soft bedtime lighting",
    "expressive child protagonist",
    "no text, no letters, no watermark",
  ].join(", ");
  const seed = encodeURIComponent(seedParts.join("-").replace(/\s+/g, "-").slice(0, 80));

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true&width=1024&height=1024&seed=${seed}-cover-${Date.now()}`;
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getThemeLabel(themeId: string) {
  return themes.find((theme) => theme.id === themeId)?.label || themeId;
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

function rebalanceShortFinalPage(pages: string[][], targetChars: number) {
  const minFinalChars = Math.floor(targetChars * 0.78);

  while (pages.length > 1) {
    const lastPage = pages[pages.length - 1];
    const previousPage = pages[pages.length - 2];
    const lastLength = pageTextLength(lastPage);
    const previousLength = pageTextLength(previousPage);

    if (lastLength >= minFinalChars || previousPage.length < 2 || previousLength <= targetChars * 0.9) {
      break;
    }

    lastPage.unshift(previousPage.pop() as string);
  }
}

function paginateStory(text: string, maxChars = 3650): string[] {
  const units = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((paragraph) => (
      paragraph.length > maxChars * 0.82
        ? splitLongText(paragraph, Math.floor(maxChars * 0.64))
        : [paragraph]
    ));

  if (!units.length) return [text];

  const totalLength = pageTextLength(units);
  const pageCount = Math.max(1, Math.ceil(totalLength / maxChars));
  const targetChars = Math.ceil(totalLength / pageCount);
  const pages: string[][] = [];
  let current: string[] = [];

  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    const remainingPages = pageCount - pages.length - 1;
    const candidate = [...current, unit];
    const candidateLength = pageTextLength(candidate);
    const remainingLength = pageTextLength(units.slice(index + 1));
    const restCanFit = remainingPages <= 0 || remainingLength <= remainingPages * maxChars;

    if (current.length && candidateLength > maxChars) {
      pages.push(current);
      current = [unit];
      continue;
    }

    if (current.length && candidateLength > targetChars && restCanFit) {
      pages.push(current);
      current = [unit];
      continue;
    }

    current = candidate;
  }

  if (current.length) pages.push(current);
  rebalanceShortFinalPage(pages, targetChars);

  return pages.map((page) => page.join("\n\n"));
}

function storyTextDensityClass(chunk: string) {
  if (chunk.length < 2500) return "story-text-body story-text-body--roomy";
  if (chunk.length > 3500) return "story-text-body story-text-body--compact";
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
  const [name, setName] = useState("");
  const [age, setAge] = useState("1");
  const [selectedTheme, setSelectedTheme] = useState("space");
  const [lesson, setLesson] = useState(lessons[0]);
  const [packageType, setPackageType] = useState("full");
  const [isLoading, setIsLoading] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyDetails, setStoryDetails] = useState("");
  const [themeDetail, setThemeDetail] = useState("");
  const [lessonDetail, setLessonDetail] = useState("");
  const [tone, setTone] = useState(toneOptions[0]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generationNote, setGenerationNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const refreshImage = (coverPrompt: string, title: string) => {
    setImageUrl(buildStoryImageUrl(coverPrompt, [name, selectedTheme, title]));
  };

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
    package: packageType,
  });

  const handleCheckout = async () => {
    if (!name) return;
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
        setGenerationNote(
          data.fallback
            ? data.note || "Am folosit varianta stabilă. Poți edita povestea înainte de PDF."
            : data.model ? `Generată cu AI (${data.model}).` : ""
        );
        refreshImage(coverPrompt, title);
        setShowResult(true);
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

  const handleRegenerateImages = () => {
    if (!storyText || !storyTitle) return;
    const fallbackPrompt = imagePrompt || `${storyTitle}. ${storyText.slice(0, 700)}`;
    refreshImage(fallbackPrompt, storyTitle);
  };

  const handleTestVoice = async () => {
    if (!name) {
      alert("Introdu un nume pentru test!");
      return;
    }
    setIsVoiceLoading(true);
    try {
      const testText = `Salut, ${name}! Sunt gata să-ți citesc o poveste magică. Ești pregătit?`;
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      });
      
      if (!response.ok) {
        const errJson = await response.json();
        alert(`❌ Eroare Voce: ${errJson.error?.message || errJson.detail?.status || "Ceva nu a mers bine"}`);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error(err);
      alert("Eroare la voce.");
    } finally {
      setIsVoiceLoading(false);
    }
  };

    const [isSpeaking, setIsSpeaking] = useState(false);

    const toggleSpeech = () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(storyText);
      utterance.lang = "ro-RO";
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    };

    const downloadPDF = async () => {
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

        const pages = document.querySelectorAll('[id^="story-page-"]');
        
        for (let i = 0; i < pages.length; i++) {
          const el = pages[i] as HTMLElement;
          el.style.display = 'block';
          
          try {
            const canvas = await html2canvas(el, {
              scale: 2.5,
              useCORS: true,
              logging: false,
              windowWidth: 794,
              windowHeight: 1123
            });
            
            addSearchableTextLayer(pdf, el.innerText, W);
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H);
          } finally {
            el.style.display = 'none';
          }
          
          if (i < pages.length - 1) pdf.addPage();
        }

        pdf.save(`Povestea_lui_${name.trim() || "Erou"}.pdf`);
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Nu am putut genera PDF-ul.");
      } finally {
        setIsLoading(false);
      }
    };

    const storyChunks = paginateStory(storyText);
    const selectedThemeLabel = getThemeLabel(selectedTheme);
    const wordCount = getWordCount(storyText);
    const profileItems = [
      ["Vârstă", `${age} ani`],
      ["Lumea", themeDetail || selectedThemeLabel],
      ["Lecția", lessonDetail || lesson],
      ["Ton", tone],
      ["Detalii copil", storyDetails],
    ].filter(([, value]) => Boolean(value));
    const pdfPageCount = storyText
      ? 3 + storyChunks.length
      : 0;

    return (
      <section id="creator" className="py-20 md:py-32 magic-gradient relative overflow-hidden px-4">
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
            <p className="story-cover-subtitle">O Aventură Magică Creată Pentru</p>
            <h1 className="story-cover-title">{(storyTitle || `Povestea lui ${name}`).toUpperCase()}</h1>
            <p className="story-cover-name">Creată pentru {name || "micul erou"}</p>
            <div className="story-cover-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <p className="story-cover-footer">Povestea Mea Magică · Previzualizare</p>
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
              <p className="story-dedication-text">Pentru {name || "micul erou"}, cu toată magia unei seri liniștite.</p>
            </div>
          </div>
        )}

        {storyText && (
          <div id="story-page-profile" className="story-pdf-page" style={{ display: 'none' }}>
            <div className="story-pdf-bg" />
            <div className="story-pdf-border" />
            <div className="story-pdf-inner-border" />
            {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}
            <div className="story-pdf-content">
              <h2 className="story-profile-title">Creată special pentru {name || "micul erou"}</h2>
              <div className="story-profile-grid">
                {profileItems.slice(0, 8).map(([label, value]) => (
                  <div key={label} className="story-profile-item">
                    <span className="story-profile-label">{label}</span>
                    <span className="story-profile-value">{value}</span>
                  </div>
                ))}
              </div>
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
              <div className={storyTextDensityClass(chunk)}>
                {chunk.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="story-paragraph">{paragraph}</p>
                ))}
              </div>
              <div className="story-text-page-num">Pagina {idx + 1}</div>
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
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
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
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-white text-brand-purple border-2 border-brand-purple/20 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-brand-cream transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerează povestea
                  </button>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={!storyText}
                    className="flex items-center justify-center gap-2 bg-white text-brand-purple border-2 border-brand-purple/20 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-brand-cream transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" /> Regenerează coperta
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
                  ) : "Ascultă Povestea 🎧"}
                  
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
                  className="bg-brand-pink text-white py-4 rounded-xl font-black text-sm md:text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Descarcă PDF 📥
                </button>
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
        <div className="text-center mb-12 md:mb-16 px-4">
          <motion.div initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} className="inline-block">
            <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-cream drop-shadow-lg leading-tight">
              Atelierul de Povești 🎨
            </h2>
          </motion.div>
          <p className="mt-4 text-brand-cream/90 text-lg md:text-xl font-medium">
            Testează o poveste personalizată înainte să activăm comenzile plătite
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden p-6 md:p-16 border-4 md:border-8 border-brand-purple/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
            <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Numele Micuțului 👦
                </label>
                <input
                  type="text"
                  placeholder="Vladimir, Exploratorul..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg md:text-xl shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                    Vârstă 🎂
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
                    Lumea 🌟
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
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Detalii despre lume
                </label>
                <input
                  type="text"
                  placeholder="Ex: o rachetă roz, o pădure cu licurici, un castel din nori..."
                  value={themeDetail}
                  onChange={(e) => setThemeDetail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Ce învățăm astăzi? 💡
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
                  Cum să apară lecția
                </label>
                <input
                  type="text"
                  placeholder="Ex: să prindă curaj fără să fie împinsă, să împartă când simte că e pregătită..."
                  value={lessonDetail}
                  onChange={(e) => setLessonDetail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner"
                />
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

              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Detalii despre copil
                </label>
                <textarea
                  placeholder="Opțional: iubește trenurile, are o pisică pe nume Mimi, e curioasă, adoarme greu seara..."
                  value={storyDetails}
                  onChange={(e) => setStoryDetails(e.target.value)}
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-base md:text-lg shadow-inner resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-8">
              <div className="bg-brand-cream/30 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-brand-purple/20">
                <h4 className="font-black text-brand-navy text-lg mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-brand-purple" /> Alege previzualizarea
                </h4>
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setPackageType(pkg.id)}
                      className={`w-full p-4 md:p-5 rounded-2xl border-4 transition-all text-left ${
                        packageType === pkg.id
                          ? "border-brand-purple bg-white shadow-lg scale-[1.02]"
                          : "border-transparent bg-white/50 opacity-70"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-navy text-sm md:text-base">{pkg.name}</span>
                        <span className="font-black text-brand-purple">{pkg.price}</span>
                      </div>
                      <p className="mt-2 text-sm text-brand-navy/50 font-bold">{pkg.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  disabled={!name}
                  className="w-full bg-brand-purple text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl hover:bg-brand-navy transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  Generează previzualizarea <Sparkles className="group-hover:rotate-12 transition-transform" />
                </button>

                <button
                  onClick={handleTestVoice}
                  disabled={isVoiceLoading || !name}
                  className="w-full bg-brand-cream text-brand-purple py-4 rounded-2xl font-bold text-lg shadow-md hover:bg-white transition-all flex items-center justify-center gap-2 border-2 border-brand-purple/20"
                >
                  {isVoiceLoading ? <Sparkles className="animate-spin w-5 h-5" /> : "🎧 Ascultă un test (Previzualizare)"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
