"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { captureCampaignAttribution, readMarketingConsent, saveMarketingConsent, type MarketingConsent } from "@/lib/campaignAttribution";
import { isMetaPixelConfigured, trackMetaPageView } from "@/lib/metaPixel";

export default function CampaignTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<MarketingConsent | "loading">("loading");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const preferencesRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const configured = isMetaPixelConfigured();

  useEffect(() => {
    captureCampaignAttribution();
    const timer = window.setTimeout(() => setConsent(readMarketingConsent()), 0);
    const openPreferences = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPreferencesOpen(true);
    };
    window.addEventListener("pmm:privacy-settings", openPreferences);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pmm:privacy-settings", openPreferences);
    };
  }, []);

  useEffect(() => {
    if (!configured || consent !== "accepted") return;
    trackMetaPageView();
  }, [configured, consent, pathname]);

  useEffect(() => {
    if (preferencesOpen) preferencesRef.current?.focus();
  }, [preferencesOpen]);

  if (consent === "loading" || (!preferencesOpen && (!configured || consent !== null))) return null;

  const choose = (value: Exclude<MarketingConsent, null>) => {
    saveMarketingConsent(value);
    setConsent(value);
    setPreferencesOpen(false);
    returnFocus.current?.focus();
  };

  return (
    <aside ref={preferencesRef} tabIndex={-1} className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[30000] mx-auto max-h-[80dvh] max-w-2xl overflow-y-auto border border-brand-gold/55 bg-brand-navy p-4 text-brand-cream shadow-[0_20px_65px_rgba(6,15,34,.45)] sm:inset-x-6 sm:flex sm:items-center sm:gap-5 sm:p-5" aria-label="Preferințe de confidențialitate">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">Preferințele tale de confidențialitate</p>
        <p className="mt-1 text-sm leading-relaxed text-brand-cream/80">{configured ? "Cookie-urile opționale ne ajută să înțelegem ce reclame sunt utile. Poți alege doar opțiunile necesare, fără să limitezi comanda." : "În acest moment nu sunt active instrumente opționale de măsurare publicitară. Folosim stocarea necesară funcționării site-ului."} <Link href="/politica-cookie-uri" className="text-brand-gold underline underline-offset-2">Detalii</Link></p>
      </div>
      <div className={`mt-4 grid gap-2 sm:mt-0 sm:shrink-0 ${configured ? "grid-cols-2" : "grid-cols-1"}`}>
        <button type="button" onClick={() => choose("rejected")} className="min-h-11 border border-brand-cream/30 px-3 text-xs font-black transition hover:bg-white/10">Doar necesare</button>
        {configured && <button type="button" onClick={() => choose("accepted")} className="min-h-11 bg-brand-gold px-3 text-xs font-black text-brand-navy transition hover:bg-brand-cream">Accept opționale</button>}
      </div>
    </aside>
  );
}
