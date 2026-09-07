"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { captureCampaignAttribution, readMarketingConsent, saveMarketingConsent, type MarketingConsent } from "@/lib/campaignAttribution";
import { isMetaPixelConfigured, trackMetaPageView } from "@/lib/metaPixel";

export default function CampaignTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<MarketingConsent | "loading">("loading");
  const configured = isMetaPixelConfigured();

  useEffect(() => {
    captureCampaignAttribution();
    const timer = window.setTimeout(() => setConsent(readMarketingConsent()), 0);
    const openPreferences = () => setConsent(null);
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

  if (!configured || consent === "loading" || consent !== null) return null;

  const choose = (value: Exclude<MarketingConsent, null>) => {
    saveMarketingConsent(value);
    setConsent(value);
  };

  return (
    <aside className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[30000] mx-auto max-w-2xl border border-brand-gold/55 bg-brand-navy p-4 text-brand-cream shadow-[0_20px_65px_rgba(6,15,34,.45)] sm:inset-x-6 sm:flex sm:items-center sm:gap-5 sm:p-5" aria-label="Preferințe de confidențialitate">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">Tu alegi cum măsurăm campaniile</p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-cream/75">Cookie-urile opționale ne ajută să înțelegem ce reclame sunt utile. Site-ul și plata funcționează la fel dacă alegi doar opțiunile necesare. <Link href="/politica-cookie-uri" className="text-brand-gold underline underline-offset-2">Detalii</Link></p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:shrink-0">
        <button type="button" onClick={() => choose("rejected")} className="min-h-11 border border-brand-cream/30 px-3 text-xs font-black transition hover:bg-white/10">Doar necesare</button>
        <button type="button" onClick={() => choose("accepted")} className="min-h-11 bg-brand-gold px-3 text-xs font-black text-brand-navy transition hover:bg-brand-cream">Accept opționale</button>
      </div>
    </aside>
  );
}
