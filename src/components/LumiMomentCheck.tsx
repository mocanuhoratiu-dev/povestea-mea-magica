"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/clientTelemetry";
import type { TelemetryProduct } from "@/lib/telemetry";

type LumiMomentCheckProps = {
  product: TelemetryProduct;
};

const productQuestions: Record<TelemetryProduct, string> = {
  story: "povestea potrivită",
  monster: "Scutul de Noapte potrivit",
  emergency: "Trusa de Răbdare potrivită",
  bundle: "pachetul potrivit",
};

/** Keeps only a small, browser-local preference for Lumi's next suggestion. */
export default function LumiMomentCheck({ product }: LumiMomentCheckProps) {
  const [response, setResponse] = useState<"helpful" | "not_helpful" | null>(null);

  const answer = (helpful: boolean) => {
    const nextResponse = helpful ? "helpful" : "not_helpful";
    setResponse(nextResponse);
    window.sessionStorage.setItem("pmm-lumi-last-moment", JSON.stringify({ product, helpful, at: Date.now() }));
    window.dispatchEvent(new CustomEvent("pmm:lumi-moment-updated"));
    trackEvent(helpful ? "lumi_moment_helpful" : "lumi_moment_not_helpful", { product });
  };

  return (
    <aside className="mt-5 border-y border-brand-gold/35 bg-brand-gold/10 px-4 py-4 text-left" aria-live="polite">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 shrink-0 text-brand-purple" size={19} />
        <div className="min-w-0">
          <p className="font-serif text-lg leading-tight text-brand-navy">Întrebarea lui Lumi</p>
          {!response ? (
            <>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-brand-navy/70">A fost {productQuestions[product]} pentru momentul vostru?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => answer(true)} className="border border-brand-purple bg-brand-purple px-3 py-2 text-xs font-black text-white transition-colors hover:bg-brand-navy">Da, a fost potrivită</button>
                <button type="button" onClick={() => answer(false)} className="border border-brand-purple/30 bg-white/70 px-3 py-2 text-xs font-black text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple hover:text-white">Încercăm altfel</button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold leading-relaxed text-brand-navy/70">{response === "helpful" ? "Perfect. Lumi va păstra această direcție ca reper pentru următoarea alegere." : "Am înțeles. La următoarea alegere, Lumi vă va propune o direcție diferită."}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
