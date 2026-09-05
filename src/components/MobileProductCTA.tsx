"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/clientTelemetry";

export default function MobileProductCTA({
  product,
  targetId,
  title,
  action,
  price,
  tone,
}: {
  product: "monster" | "emergency";
  targetId: string;
  title: string;
  action: string;
  price: string;
  tone: "night" | "day";
}) {
  const [isConfiguratorVisible, setConfiguratorVisible] = useState(false);
  const [isLumiOpen, setLumiOpen] = useState(false);

  useEffect(() => {
    const configurator = document.getElementById(targetId);
    if (!configurator) return;
    const observer = new IntersectionObserver(([entry]) => setConfiguratorVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(configurator);
    const onLumi = (event: Event) => setLumiOpen((event as CustomEvent<{ isOpen: boolean }>).detail.isOpen);
    window.addEventListener("pmm:lumi-open-change", onLumi);
    return () => {
      observer.disconnect();
      window.removeEventListener("pmm:lumi-open-change", onLumi);
    };
  }, [targetId]);

  if (isConfiguratorVisible || isLumiOpen) return null;

  return (
    <div id="mobile-product-cta" className={`fixed inset-x-0 bottom-0 z-[70] border-t px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(12,20,40,.18)] backdrop-blur-xl lg:hidden ${tone === "night" ? "border-brand-gold/35 bg-brand-navy/96" : "border-brand-navy/15 bg-brand-cream/96"}`}>
      <a href={`#${targetId}`} onClick={() => trackEvent("product_page_cta_clicked", { product })} className={`mx-auto flex min-h-13 max-w-xl items-center justify-between px-4 ${tone === "night" ? "bg-brand-gold text-brand-navy" : "bg-brand-navy text-brand-cream"}`}>
        <span className="min-w-0"><span className={`block truncate text-[9px] font-black uppercase tracking-[0.1em] ${tone === "night" ? "text-brand-navy/60" : "text-brand-gold"}`}>{title}</span><span className="block truncate text-sm font-black">{action} · {price}</span></span>
        <ArrowRight size={19} className="ml-2 shrink-0" />
      </a>
    </div>
  );
}
