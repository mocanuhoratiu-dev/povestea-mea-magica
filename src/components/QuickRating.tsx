"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { TelemetryProduct } from "@/lib/telemetry";
import { trackEvent } from "@/lib/clientTelemetry";

export default function QuickRating({ product }: { product: TelemetryProduct }) {
  const [rating, setRating] = useState<"helpful" | "not_helpful" | null>(null);

  const chooseRating = (nextRating: "helpful" | "not_helpful") => {
    if (rating) return;
    setRating(nextRating);
    trackEvent(nextRating === "helpful" ? "pdf_feedback_helpful" : "pdf_feedback_not_helpful", { product });
  };

  return (
    <aside className="mt-5 border-t border-brand-navy/10 pt-5" aria-live="polite">
      {rating ? (
        <p className="text-sm font-bold text-brand-navy/65">Mulțumim. Răspunsul tău ne ajută să facem următorul material mai bun.</p>
      ) : (
        <>
          <p className="text-sm font-black text-brand-navy">A fost util?</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-brand-navy/55">Un răspuns rapid, anonim, ne ajută să îmbunătățim materialele.</p>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => chooseRating("helpful")} className="inline-flex items-center gap-2 border border-brand-green/35 px-3 py-2 text-xs font-black text-brand-green transition-colors hover:bg-brand-green hover:text-white"><ThumbsUp size={14} /> Da</button>
            <button type="button" onClick={() => chooseRating("not_helpful")} className="inline-flex items-center gap-2 border border-brand-navy/20 px-3 py-2 text-xs font-black text-brand-navy/65 transition-colors hover:bg-brand-navy hover:text-brand-cream"><ThumbsDown size={14} /> Încă nu</button>
          </div>
        </>
      )}
    </aside>
  );
}
