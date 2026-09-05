"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import LumiOpenButton from "@/components/LumiOpenButton";
import { trackEvent } from "@/lib/clientTelemetry";

export default function MobileAlbumCTA({ price }: { price: string }) {
  const [isConfiguratorVisible, setConfiguratorVisible] = useState(false);
  const [isLumiOpen, setLumiOpen] = useState(false);

  useEffect(() => {
    const configurator = document.getElementById("configureaza-albumul");
    if (!configurator) return;
    const observer = new IntersectionObserver(([entry]) => setConfiguratorVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(configurator);
    const onLumi = (event: Event) => setLumiOpen((event as CustomEvent<{ isOpen: boolean }>).detail.isOpen);
    window.addEventListener("pmm:lumi-open-change", onLumi);
    return () => {
      observer.disconnect();
      window.removeEventListener("pmm:lumi-open-change", onLumi);
    };
  }, []);

  if (isConfiguratorVisible || isLumiOpen) return null;

  return (
    <div id="mobile-album-cta" className="fixed inset-x-0 bottom-0 z-[70] border-t border-brand-navy/15 bg-brand-cream/96 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(36,50,79,.15)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto] gap-2">
        <a
          href="#configureaza-albumul"
          onClick={() => trackEvent("album_product_cta_clicked", { product: "album" })}
          className="flex min-h-13 min-w-0 items-center justify-between bg-brand-navy px-4 text-brand-cream"
        >
          <span className="min-w-0"><span className="block truncate text-[9px] font-black uppercase tracking-[0.1em] text-brand-gold">Povestea Magică</span><span className="block truncate text-sm font-black">Creează acum · {price}</span></span>
          <ArrowRight size={19} className="ml-2 shrink-0" />
        </a>
        <LumiOpenButton label="Cu Lumi" className="inline-flex min-h-13 items-center justify-center gap-1.5 border border-brand-purple bg-white px-3 text-xs font-black text-brand-purple" />
      </div>
    </div>
  );
}
