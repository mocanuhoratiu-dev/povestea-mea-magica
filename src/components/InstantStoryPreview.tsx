"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import LanternSignature from "@/components/LanternSignature";
import { trackEvent } from "@/lib/clientTelemetry";

const worlds = [
  {
    id: "space",
    label: "Printre stele",
    title: "Lanterna dintre stele",
    line: "a găsit o lumină mică ce știa drumul spre o planetă adormită.",
    accent: "bg-brand-blue",
  },
  {
    id: "forest",
    label: "Prin pădure",
    title: "Pădurea cu licurici",
    line: "a auzit un licurici chemându-l spre o cărare care apărea numai seara.",
    accent: "bg-brand-green",
  },
  {
    id: "castle",
    label: "Spre castel",
    title: "Cheia din turnul de nori",
    line: "a descoperit o cheie aurie ascunsă sub prima stea de pe cer.",
    accent: "bg-brand-orange",
  },
] as const;

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-ZĂÂÎȘȚăâîșț\-\s]/g, "").replace(/\s+/g, " ").slice(0, 24);
}

export default function InstantStoryPreview() {
  const [name, setName] = useState("");
  const [worldId, setWorldId] = useState<(typeof worlds)[number]["id"]>("space");
  const hasTrackedPreview = useRef(false);
  const world = worlds.find((item) => item.id === worldId) ?? worlds[0];
  const childName = useMemo(() => sanitizeName(name).trim() || "un mic explorator", [name]);
  const href = `/?nume=${encodeURIComponent(sanitizeName(name).trim())}&lume=${worldId}#creator`;

  return (
    <div className="relative overflow-hidden border border-brand-cream/25 bg-brand-navy/60 p-5 shadow-[0_22px_54px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-6">
      <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-brand-purple/45 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-4">
          <LanternSignature className="shrink-0" size="sm" label="Lanterna care aprinde povestea" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-gold">Prima scânteie</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-brand-cream/80">Scrie prenumele și vezi cum începe povestea.</p>
          </div>
        </div>

        <label className="sr-only" htmlFor="instant-story-name">Prenumele copilului</label>
        <input
          id="instant-story-name"
          value={name}
          onChange={(event) => {
            const nextName = sanitizeName(event.target.value);
            if (nextName && !hasTrackedPreview.current) {
              trackEvent("story_preview_started", { product: "story" });
              hasTrackedPreview.current = true;
            }
            setName(nextName);
          }}
          placeholder="Ex: Eva"
          className="mt-6 w-full border border-brand-cream/25 bg-brand-cream px-4 py-3.5 text-base font-black text-brand-navy outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40"
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {worlds.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setWorldId(item.id)}
              className={`relative overflow-hidden border px-2 py-2.5 text-xs font-black transition ${
                worldId === item.id
                  ? "border-brand-gold bg-brand-cream text-brand-navy"
                  : "border-brand-cream/20 bg-brand-navy/30 text-brand-cream/75 hover:border-brand-cream/60"
              }`}
            >
              {worldId === item.id && <span className={`absolute inset-x-0 top-0 h-0.5 ${item.accent}`} />}
              {item.label}
            </button>
          ))}
        </div>

        <motion.div
          key={`${childName}-${worldId}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mt-5 border-l-2 border-brand-gold bg-black/15 px-4 py-4"
        >
          <p className="font-serif text-xl leading-tight text-brand-cream">{world.title}</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-brand-cream/85">
            În seara aceasta, <strong className="font-black text-brand-gold">{childName}</strong> {world.line}
          </p>
        </motion.div>

        <a
          href={href}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-brand-gold px-4 py-3.5 text-sm font-black text-brand-navy transition hover:bg-brand-cream"
        >
          Continuă cu această poveste <ArrowRight size={16} />
        </a>
        <p className="mt-3 flex items-center gap-2 text-xs font-semibold leading-relaxed text-brand-cream/60">
          <Sparkles size={13} className="shrink-0 text-brand-gold" /> Povestea finală se construiește din alegerile familiei voastre.
        </p>
      </div>
    </div>
  );
}
