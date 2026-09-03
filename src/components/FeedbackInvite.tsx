"use client";

import { HeartHandshake } from "lucide-react";
import { trackEvent } from "@/lib/clientTelemetry";
import { publicContact } from "@/lib/publicContact";
import type { TelemetryProduct } from "@/lib/telemetry";

type FeedbackInviteProps = {
  product: TelemetryProduct;
  compact?: boolean;
};

const productNames: Record<TelemetryProduct, string> = {
  story: "Povestea de Seară",
  monster: "Scutul de Noapte",
  emergency: "Trusa de Răbdare",
  bundle: "Pachetul Familiei Magice",
  album: "Albumul Meu Magic",
};

export default function FeedbackInvite({ product, compact = false }: FeedbackInviteProps) {
  const productName = productNames[product];
  const href = `mailto:${publicContact.feedbackEmail}?subject=${encodeURIComponent(`Recenzie - ${productName}`)}&body=${encodeURIComponent(`Am folosit ${productName} și vreau să las o recenzie.\n\nCe ne-a plăcut:\n\nCe am îmbunătăți:\n\nSunteți de acord să publicăm un scurt fragment anonim? Da / Nu:\n`)}`;

  return (
    <aside className={`${compact ? "mt-5 border-t border-brand-navy/10 pt-5" : "border-y border-brand-navy/15 py-12"} flex items-start gap-4 text-left`}>
      <HeartHandshake className="mt-0.5 shrink-0 text-brand-purple" size={24} strokeWidth={1.8} />
      <div>
        <p className="font-serif text-xl leading-tight text-brand-navy">Cum a fost pentru voi?</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-brand-navy/65">Fiecare recenzie ne ajută să îmbunătățim materialele. Publicăm un fragment doar cu acordul familiei.</p>
        <a href={href} onClick={() => trackEvent("feedback_requested", { product })} className="mt-3 inline-block border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">Lasă o recenzie</a>
      </div>
    </aside>
  );
}
