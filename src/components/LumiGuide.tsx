"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookHeart, BookOpen, LoaderCircle, MoonStar, Send, Sparkles, Square, TimerReset, Volume2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { trackEvent } from "@/lib/clientTelemetry";
import { wantsLumiMaterialRecommendation } from "@/lib/lumiIntent";
import { playNarration, stopNarration as stopSharedNarration, subscribeToNarration } from "@/lib/narrationPlayback";
import { openMobileProduct } from "@/lib/mobileProductFlow";

const LUMI_NARRATION_OWNER = "lumi-guide";

type ProductId = "story" | "album" | "monster" | "emergency" | "none";
type Recommendation = {
  product: ProductId;
  theme: string;
  tone: string;
  lesson: string;
  storyDetail: string;
  monsterType: string;
  fearLocation: string;
  calmingHelper: string;
  bedtimeRitual: string;
  emergencyContext: string;
  interest: string;
  duration: string;
  activityMode: string;
  label: string;
};
type ChatMessage = {
  role: "user" | "model";
  text: string;
  suggestions?: string[];
  recommendation?: Recommendation;
};
type MomentMemory = {
  product: Exclude<ProductId, "none">;
  helpful: boolean;
};

const quickPrompts = [
  { label: "O poveste pentru azi", prompt: "Vreau o poveste personalizată pentru seara asta.", icon: BookOpen },
  { label: "Un album ilustrat", prompt: "Vreau o poveste foarte vizuală, cu multe ilustrații și puțin text pe pagină.", icon: BookHeart },
  { label: "O seară mai liniștită", prompt: "Avem nevoie de un ritual blând înainte de culcare.", icon: MoonStar },
  { label: "Timp de așteptare", prompt: "Avem un drum sau o perioadă de așteptare și vreau o activitate potrivită.", icon: TimerReset },
];

const welcomeMessage: ChatMessage = {
  role: "model",
  text: "Spune-mi ce moment aveți. Te ajut să alegi, iar tu decizi ce aplicăm.",
};

const rememberedProducts: Record<MomentMemory["product"], string> = {
  story: "o poveste",
  album: "un album ilustrat",
  monster: "un Scut de Noapte",
  emergency: "o Trusă de Răbdare",
};

const recommendationLabels: Record<Exclude<ProductId, "none">, string> = {
  story: "Deschide Povestea de Seară",
  album: "Deschide Albumul Meu Magic",
  monster: "Deschide Scutul de Noapte",
  emergency: "Deschide Trusa de Răbdare",
};

function looksLikeQuestion(value: string) {
  return /[?？]/.test(value) || /^(cum|ce|unde|cine|când|cand|care|cât|cat|câți|cati|vrei|este|are|spune-mi)\b/i.test(value.trim());
}

function readMomentMemory(): MomentMemory | null {
  try {
    const value = window.sessionStorage.getItem("pmm-lumi-last-moment");
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<MomentMemory>;
    if ((parsed.product === "story" || parsed.product === "album" || parsed.product === "monster" || parsed.product === "emergency") && typeof parsed.helpful === "boolean") {
      return { product: parsed.product, helpful: parsed.helpful };
    }
  } catch {
    // The guide stays useful even when browser storage is unavailable.
  }
  return null;
}

function memoryPrompt(memory: MomentMemory) {
  if (memory.helpful) {
    return memory.product === "story"
      ? "Ne-a plăcut povestea de data trecută. Vreau o nouă aventură în același stil."
      : `Ne-a ajutat ${rememberedProducts[memory.product]}. Vrem o idee asemănătoare pentru azi.`;
  }
  return memory.product === "story"
    ? "Povestea de data trecută nu s-a potrivit. Vreau o recomandare diferită pentru azi."
    : `${rememberedProducts[memory.product]} de data trecută nu s-a potrivit. Vreau o alternativă pentru azi.`;
}

function LumiSpirit() {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/lumi-guardian.webp");
  const sparkles = useMemo(
    () => new Float32Array([
      -1.15, 0.82, 0, -0.92, -0.42, 0.1, -0.58, 1.12, -0.1,
      0.98, 0.72, 0, 1.18, -0.34, -0.1, 0.45, 1.28, 0.05,
      0.72, -0.92, 0.12, -0.2, -1.08, 0.05,
    ]),
    []
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.position.y = Math.sin(time * 1.4) * 0.07;
      group.current.rotation.y = Math.sin(time * 0.55) * 0.07 + state.pointer.x * 0.1;
      group.current.rotation.x = state.pointer.y * 0.04;
    }
    if (orbit.current) {
      orbit.current.rotation.z = time * 0.22;
      orbit.current.rotation.x = 0.58 + Math.sin(time * 0.4) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[sparkles, 3]} /></bufferGeometry>
        <pointsMaterial color="#e5b84f" size={0.055} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <mesh ref={orbit} position={[0, -0.08, -0.2]}>
        <torusGeometry args={[1.02, 0.012, 8, 48]} />
        <meshBasicMaterial color="#e5b84f" transparent opacity={0.7} />
      </mesh>
      <sprite scale={[1.72, 2.58, 1]} position={[0, -0.12, 0.15]}>
        <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

function LumiVisual({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <Canvas className="!h-full !w-full" style={{ width: "100%", height: "100%" }} camera={{ position: [0, 0, 4], fov: 30 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <LumiSpirit />
      </Canvas>
    </div>
  );
}

function recommendationTarget(product: ProductId) {
  if (product === "story") return "creator";
  if (product === "album") return "album";
  if (product === "monster") return "monster-away";
  if (product === "emergency") return "emergency-kit";
  return null;
}

export default function LumiGuide() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [heroIsVisible, setHeroIsVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [inputHint, setInputHint] = useState("Sau scrie un detaliu...");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [speakingMessage, setSpeakingMessage] = useState<number | null>(null);
  const [lastMoment, setLastMoment] = useState<MomentMemory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroIsVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 220);
  }, [isOpen]);

  useEffect(() => {
    const openGuide = () => {
      trackEvent("lumi_opened");
      setIsOpen(true);
    };
    window.addEventListener("pmm:lumi-open", openGuide);
    return () => window.removeEventListener("pmm:lumi-open", openGuide);
  }, []);

  useEffect(() => {
    const updateMomentMemory = () => setLastMoment(readMomentMemory());
    updateMomentMemory();
    window.addEventListener("pmm:lumi-moment-updated", updateMomentMemory);
    return () => window.removeEventListener("pmm:lumi-moment-updated", updateMomentMemory);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pmm:lumi-open-change", { detail: { isOpen } }));
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration(({ owner, phase }) => {
      if (owner !== LUMI_NARRATION_OWNER || phase === "idle") setSpeakingMessage(null);
    });
    return () => {
      unsubscribe();
      stopSharedNarration(LUMI_NARRATION_OWNER);
    };
  }, []);

  const stopLumiNarration = () => {
    stopSharedNarration(LUMI_NARRATION_OWNER);
    setSpeakingMessage(null);
  };

  const toggleLumiVoice = async (text: string, index: number) => {
    if (speakingMessage === index) {
      stopLumiNarration();
      return;
    }

    stopLumiNarration();
    setSpeakingMessage(index);
    try {
      const started = await playNarration(LUMI_NARRATION_OWNER, text, "lumi");
      if (started) trackEvent("lumi_voice_played");
    } catch {
      setSpeakingMessage(null);
      setError("Vocea lui Lumi nu poate fi pregătită chiar acum.");
    }
  };

  const resetGuide = () => {
    stopLumiNarration();
    setIsOpen(false);
    setMessages([welcomeMessage]);
    setInput("");
    setInputHint("Sau scrie un detaliu...");
    setError("");
  };

  const applyRecommendation = (recommendation: Recommendation) => {
    const target = recommendationTarget(recommendation.product);
    if (!target) return;
    if (recommendation.product === "story" || recommendation.product === "album" || recommendation.product === "monster" || recommendation.product === "emergency") {
      trackEvent("lumi_recommendation_applied", { product: recommendation.product });
    }
    if (recommendation.product === "story") {
      window.dispatchEvent(new CustomEvent("pmm:lumi-story-choice", { detail: recommendation }));
    }
    if (recommendation.product === "album") {
      if (window.location.pathname !== "/album-ilustrat") {
        window.sessionStorage.setItem("pmm-lumi-album-choice", JSON.stringify(recommendation));
        setIsOpen(false);
        router.push("/album-ilustrat?lumi=1");
        return;
      }
      window.dispatchEvent(new CustomEvent("pmm:lumi-album-choice", { detail: recommendation }));
    }
    window.dispatchEvent(new CustomEvent("pmm:lumi-material-choice", { detail: recommendation }));
    if (recommendation.product === "story" || recommendation.product === "monster" || recommendation.product === "emergency") {
      openMobileProduct(recommendation.product);
    } else if (recommendation.product === "none") {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.replace(/\s+/g, " ").trim().slice(0, 500);
    if (!message || isThinking) return;

    trackEvent("lumi_message_sent");
    const history = messages.slice(-6).map(({ role, text }) => ({ role, text }));
    const previousModelMessage = [...messages].reverse().find((item) => item.role === "model")?.text || "";
    const allowRecommendation = wantsLumiMaterialRecommendation(message, previousModelMessage);
    const userMessage: ChatMessage = { role: "user", text: message };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setInputHint("Sau scrie un detaliu...");
    setError("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/lumi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const payload = await response.json() as { reply?: string; suggestions?: string[]; recommendation?: Recommendation; error?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.error || "Lumi nu poate răspunde chiar acum.");
      const modelMessage: ChatMessage = {
        role: "model",
        text: payload.reply,
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        recommendation: allowRecommendation ? payload.recommendation : undefined,
      };
      setMessages((current) => [...current, modelMessage]);
    } catch (caught) {
      trackEvent("lumi_response_failed");
      setError(caught instanceof Error ? caught.message : "Lumi nu poate răspunde chiar acum.");
    } finally {
      setIsThinking(false);
    }
  };

  const chooseSuggestion = (suggestion: string) => {
    // Older responses or a model regression must never turn Lumi's question into the parent's message.
    if (looksLikeQuestion(suggestion)) {
      setMessages((current) => [...current, { role: "model", text: suggestion }]);
      setInput("");
      setInputHint("Scrie răspunsul tău...");
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    void sendMessage(suggestion);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const latestMessage = messages[messages.length - 1];

  return (
  <aside className={`fixed bottom-3 right-3 z-[9990] w-[calc(100vw-1.5rem)] max-w-[352px] transition-[opacity,width] duration-300 sm:bottom-5 sm:right-7 ${!isOpen && heroIsVisible ? "pointer-events-none opacity-0" : ""}`} aria-label="Ghidul Lumi">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section
            key="guide"
            initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative max-h-[min(490px,calc(100dvh-1.5rem))] overflow-hidden border border-brand-gold/50 bg-brand-cream shadow-[0_20px_55px_rgba(36,50,79,0.3)]"
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-brand-gold" />
            <header className="relative min-h-[64px] border-b border-brand-navy/12 px-4 py-3 pr-20">
              <LumiVisual className="absolute right-8 -top-6 h-20 w-[68px]" />
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-brand-purple">Cu Lumi</p>
              <h2 className="mt-0.5 max-w-[215px] font-serif text-lg leading-tight text-brand-navy">Ce pregătim acum?</h2>
              <button type="button" onClick={resetGuide} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center text-brand-navy/55 transition-colors hover:bg-brand-navy hover:text-brand-cream" aria-label="Închide ghidul Lumi"><X size={17} /></button>
            </header>

            <div
              className="max-h-[190px] space-y-2 overflow-y-auto overscroll-contain px-3 py-2.5 touch-pan-y [-webkit-overflow-scrolling:touch]"
              data-lenis-prevent
              aria-live="polite"
            >
              {messages.map((message, index) => {
                const recommendation = message.recommendation;
                return (
                <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-7 bg-brand-navy px-3 py-2 text-brand-cream" : "mr-3 border border-brand-purple/14 bg-white/65 px-3 py-2 text-brand-navy"}>
                  {message.role === "model" && (
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-purple">Lumi</p>
                      <button
                        type="button"
                        onClick={() => void toggleLumiVoice(message.text, index)}
                        className="grid h-7 w-7 shrink-0 place-items-center border border-brand-purple/20 text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"
                        aria-label={speakingMessage === index ? "Oprește vocea lui Lumi" : "Ascultă vocea lui Lumi"}
                        title={speakingMessage === index ? "Oprește vocea" : "Ascultă răspunsul"}
                      >
                        {speakingMessage === index ? <Square size={12} fill="currentColor" /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  )}
                  <p className="text-[13px] font-semibold leading-relaxed">{message.text}</p>
                  {message.role === "model" && index === messages.length - 1 && index > 0 && (!recommendation || recommendation.product === "none") && (
                    <p className="mt-2 border-t border-brand-navy/10 pt-1.5 text-[10px] font-bold text-brand-navy/50">Formularul a rămas neschimbat.</p>
                  )}
                  {recommendation && recommendation.product !== "none" && recommendationTarget(recommendation.product) && (
                    <button type="button" onClick={() => applyRecommendation(recommendation)} className="mt-2 flex w-full items-center justify-center gap-2 bg-brand-purple px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-brand-navy">
                      <Sparkles size={14} /> {recommendationLabels[recommendation.product]} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                );
              })}
              {isThinking && <div className="mr-3 flex items-center gap-2 border border-brand-purple/14 bg-white/65 px-3 py-2 text-xs font-bold text-brand-navy/65"><LoaderCircle size={14} className="animate-spin text-brand-purple" /> Lumi se gândește...</div>}
            </div>

            {!isThinking && messages.length === 1 && (
              <div className="border-t border-brand-navy/10 px-3 py-2.5">
                {lastMoment && (
                  <div className="mb-2 border border-brand-gold/35 bg-brand-gold/10 px-2.5 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-brand-purple">Lumi își amintește</p>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-brand-navy/70">Data trecută ați ales {rememberedProducts[lastMoment.product]}. {lastMoment.helpful ? "Continuăm pe firul care a funcționat?" : "Hai să găsim o idee mai potrivită."}</p>
                    <button type="button" onClick={() => void sendMessage(memoryPrompt(lastMoment))} className="mt-2 border-b border-brand-purple pb-0.5 text-[10px] font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">Pornește de aici</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {quickPrompts.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => void sendMessage(prompt)} className="min-h-14 border border-brand-purple/20 bg-white/70 px-2 py-2 text-left text-[10px] font-black leading-tight text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"><Icon size={14} className="mb-1" /> {label}</button>)}
                </div>
              </div>
            )}

            {!isThinking && latestMessage?.role === "model" && latestMessage.suggestions && latestMessage.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-brand-navy/10 px-3 py-2.5">
                {latestMessage.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => chooseSuggestion(suggestion)} className="border border-brand-purple/20 px-2 py-1.5 text-left text-[10px] font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white">{suggestion}</button>)}
              </div>
            )}

            <form onSubmit={onSubmit} className="border-t border-brand-navy/12 p-2.5">
              <label className="sr-only" htmlFor="lumi-message">Mesaj pentru Lumi</label>
              <div className="flex gap-2">
                <input ref={inputRef} id="lumi-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder={inputHint} className="min-w-0 flex-1 border border-brand-navy/18 bg-white px-3 py-2 text-[13px] font-semibold text-brand-navy outline-none placeholder:text-brand-navy/40 focus:border-brand-purple" />
                <button type="submit" disabled={!input.trim() || isThinking} className="grid h-9 w-9 shrink-0 place-items-center bg-brand-navy text-brand-cream transition-colors hover:bg-brand-purple disabled:cursor-not-allowed disabled:opacity-40" aria-label="Trimite mesajul"><Send size={15} /></button>
              </div>
              {error && <p className="mt-2 text-xs font-bold leading-relaxed text-red-700">{error}</p>}
              <p className="mt-1.5 text-[9px] font-semibold leading-relaxed text-brand-navy/48">Nu include date personale sau sensibile.</p>
            </form>
          </motion.section>
        ) : (
          <motion.button
            key="trigger" type="button" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { trackEvent("lumi_opened"); setIsOpen(true); }} className="group relative ml-auto flex h-14 w-[148px] items-center justify-start overflow-visible border border-brand-gold/70 bg-brand-navy pl-3 text-left shadow-[0_14px_35px_rgba(36,50,79,0.32)] sm:h-16 sm:w-[160px]" aria-label="Deschide ghidul Lumi"
          >
            <LumiVisual className="absolute right-1 top-1/2 h-[66px] w-[58px] -translate-y-1/2 transition-transform duration-300 group-hover:-translate-y-[54%] sm:h-[74px] sm:w-[64px]" />
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-brand-cream">Alege cu<br/><span className="text-brand-gold">Lumi</span></span>
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
