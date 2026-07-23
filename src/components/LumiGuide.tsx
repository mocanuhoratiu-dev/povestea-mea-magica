"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, LoaderCircle, MoonStar, Send, Sparkles, Square, TimerReset, Volume2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { trackEvent } from "@/lib/clientTelemetry";
import { playNarration, stopNarration as stopSharedNarration, subscribeToNarration } from "@/lib/narrationPlayback";
import { openMobileProduct } from "@/lib/mobileProductFlow";

const LUMI_NARRATION_OWNER = "lumi-guide";

type ProductId = "story" | "monster" | "emergency" | "none";
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

const quickPrompts = [
  { label: "O poveste", prompt: "Vreau o idee de poveste personalizată pentru copilul meu.", icon: BookOpen },
  { label: "O seară", prompt: "Copilul meu are nevoie de un ritual mai liniștit înainte de culcare.", icon: MoonStar },
  { label: "O așteptare", prompt: "Avem un drum sau o perioadă de așteptare și vreau o activitate potrivită.", icon: TimerReset },
];

const welcomeMessage: ChatMessage = {
  role: "model",
  text: "Spune-mi ce se întâmplă acum: vrei o poveste pentru seara asta, un ritual pentru culcare sau o activitate pentru un timp de așteptare?",
};

function LumiSpirit() {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/lumi-guardian.png");
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
    <div aria-hidden="true" className={`pointer-events-none relative ${className}`}>
      <Canvas className="!h-full !w-full" style={{ width: "100%", height: "100%" }} camera={{ position: [0, 0, 4], fov: 30 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <LumiSpirit />
      </Canvas>
    </div>
  );
}

function recommendationTarget(product: ProductId) {
  if (product === "story") return "creator";
  if (product === "monster") return "monster-away";
  if (product === "emergency") return "emergency-kit";
  return null;
}

export default function LumiGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [heroIsVisible, setHeroIsVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [speakingMessage, setSpeakingMessage] = useState<number | null>(null);
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
    setError("");
  };

  const applyRecommendation = (recommendation: Recommendation) => {
    const target = recommendationTarget(recommendation.product);
    if (!target) return;
    if (recommendation.product === "story" || recommendation.product === "monster" || recommendation.product === "emergency") {
      trackEvent("lumi_recommendation_applied", { product: recommendation.product });
    }
    if (recommendation.product === "story") {
      window.dispatchEvent(new CustomEvent("pmm:lumi-story-choice", { detail: recommendation }));
    }
    window.dispatchEvent(new CustomEvent("pmm:lumi-material-choice", { detail: recommendation }));
    if (recommendation.product !== "none") {
      openMobileProduct(recommendation.product);
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.replace(/\s+/g, " ").trim().slice(0, 500);
    if (!message || isThinking) return;

    trackEvent("lumi_message_sent");
    const history = messages.slice(-6).map(({ role, text }) => ({ role, text }));
    const userMessage: ChatMessage = { role: "user", text: message };
    setMessages((current) => [...current, userMessage]);
    setInput("");
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
        recommendation: payload.recommendation,
      };
      setMessages((current) => [...current, modelMessage]);
    } catch (caught) {
      trackEvent("lumi_response_failed");
      setError(caught instanceof Error ? caught.message : "Lumi nu poate răspunde chiar acum.");
    } finally {
      setIsThinking(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <aside className={`fixed bottom-3 right-5 z-[9990] w-[calc(100vw-2.5rem)] max-w-[304px] transition-[opacity,width] duration-300 sm:bottom-5 sm:right-7 ${isOpen ? "max-md:w-[calc(100vw-2.5rem)] max-md:max-w-[380px]" : ""} ${!isOpen && heroIsVisible ? "max-md:pointer-events-none max-md:opacity-0" : ""}`} aria-label="Ghidul Lumi">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section
            key="guide"
            initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative max-h-[min(470px,calc(100dvh-1.5rem))] overflow-hidden border border-brand-gold/50 bg-brand-cream shadow-[0_20px_55px_rgba(36,50,79,0.3)] max-md:max-h-[min(430px,calc(100dvh-1.5rem))]"
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-brand-gold" />
            <header className="relative min-h-[66px] border-b border-brand-navy/12 px-3 pb-2.5 pt-3 pr-16 max-md:min-h-[62px]">
              <LumiVisual className="absolute right-1 -top-7 h-24 w-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-brand-purple">Lanterna Magică</p>
              <h2 className="mt-0.5 max-w-[175px] font-serif text-base leading-tight text-brand-navy">Lumi, păzitoarea Lanternei</h2>
              <button type="button" onClick={resetGuide} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center text-brand-navy/55 transition-colors hover:bg-brand-navy hover:text-brand-cream" aria-label="Închide ghidul Lumi"><X size={17} /></button>
            </header>

            <div
              className="max-h-[212px] space-y-2 overflow-y-auto overscroll-contain px-3 py-2.5 touch-pan-y max-md:max-h-[172px] [-webkit-overflow-scrolling:touch]"
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
                  {recommendation && recommendation.product !== "none" && recommendationTarget(recommendation.product) && (
                    <button type="button" onClick={() => applyRecommendation(recommendation)} className="mt-2 flex w-full items-center justify-center gap-2 bg-brand-purple px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-brand-navy">
                      <Sparkles size={14} /> {recommendation.label || "Aplică recomandarea"} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                );
              })}
              {isThinking && <div className="mr-3 flex items-center gap-2 border border-brand-purple/14 bg-white/65 px-3 py-2 text-xs font-bold text-brand-navy/65"><LoaderCircle size={14} className="animate-spin text-brand-purple" /> Lumi se gândește...</div>}
            </div>

            {!isThinking && messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 border-t border-brand-navy/10 px-3 py-2.5">
                {quickPrompts.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => void sendMessage(prompt)} className="flex items-center gap-1.5 border border-brand-purple/20 px-2 py-1.5 text-left text-[10px] font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"><Icon size={12} /> {label}</button>)}
              </div>
            )}

            {!isThinking && latestMessage?.role === "model" && latestMessage.suggestions && latestMessage.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-brand-navy/10 px-3 py-2.5">
                {latestMessage.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="border border-brand-purple/20 px-2 py-1.5 text-left text-[10px] font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white">{suggestion}</button>)}
              </div>
            )}

            <form onSubmit={onSubmit} className="border-t border-brand-navy/12 p-2.5">
              <label className="sr-only" htmlFor="lumi-message">Mesaj pentru Lumi</label>
              <div className="flex gap-2">
                <input ref={inputRef} id="lumi-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder="Spune-i lui Lumi..." className="min-w-0 flex-1 border border-brand-navy/18 bg-white px-3 py-2 text-[13px] font-semibold text-brand-navy outline-none placeholder:text-brand-navy/40 focus:border-brand-purple" />
                <button type="submit" disabled={!input.trim() || isThinking} className="grid h-9 w-9 shrink-0 place-items-center bg-brand-navy text-brand-cream transition-colors hover:bg-brand-purple disabled:cursor-not-allowed disabled:opacity-40" aria-label="Trimite mesajul"><Send size={15} /></button>
              </div>
              {error && <p className="mt-2 text-xs font-bold leading-relaxed text-red-700">{error}</p>}
              <p className="mt-1.5 text-[9px] font-semibold leading-relaxed text-brand-navy/48">Nu introduce date personale sau sensibile.</p>
            </form>
          </motion.section>
        ) : (
          <motion.button
            key="trigger" type="button" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { trackEvent("lumi_opened"); setIsOpen(true); }} className="group relative ml-auto grid h-14 w-14 place-items-center overflow-visible rounded-full border border-brand-gold/70 bg-brand-navy shadow-[0_14px_35px_rgba(36,50,79,0.32)] sm:h-16 sm:w-16" aria-label="Vorbește cu Lumi"
          >
            <LumiVisual className="absolute left-[45%] top-1/2 h-[72px] w-[64px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:-translate-y-[54%] sm:h-[78px] sm:w-[68px]" />
            <span className="absolute -bottom-2 right-0 hidden whitespace-nowrap bg-brand-cream px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-navy shadow-sm sm:block">Întreab-o pe Lumi</span>
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
