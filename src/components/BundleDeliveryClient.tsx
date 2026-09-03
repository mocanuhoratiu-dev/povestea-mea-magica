"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookHeart, BookOpen, Download, LoaderCircle, ShieldCheck, TimerReset } from "lucide-react";
import { trackEvent } from "@/lib/clientTelemetry";
import type { BundleProduct } from "@/lib/bundle";

type DeliveryItem = {
  product: BundleProduct;
  configuration: Record<string, unknown>;
};

const productPresentation: Record<BundleProduct, { title: string; description: string; anchor: string; icon: typeof BookOpen }> = {
  story: { title: "Povestea lungă", description: "Copertă, dedicație și patru pagini de aventură", anchor: "creator", icon: BookOpen },
  monster: { title: "Scutul de Noapte", description: "Certificat, ritual și etichete pentru seară", anchor: "monster-away", icon: ShieldCheck },
  emergency: { title: "Trusa de Răbdare", description: "Misiuni și activități pentru momentul ales", anchor: "emergency-kit", icon: TimerReset },
  album: { title: "Albumul Meu Magic", description: "Carte ilustrată de 16 pagini și caiet separat de activități", anchor: "album", icon: BookHeart },
};

function childName(item: DeliveryItem) {
  const generation = item.configuration.generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) return "copilul vostru";
  const name = (generation as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : "copilul vostru";
}

export default function BundleDeliveryClient() {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [access, setAccess] = useState({ order: "", token: "" });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    async function loadBundle() {
      const params = new URLSearchParams(window.location.search);
      const order = params.get("order") || "";
      const token = params.get("token") || "";
      if (!order || !token) throw new Error("invalid");
      const response = await fetch(`/api/orders/${encodeURIComponent(order)}?token=${encodeURIComponent(token)}`);
      if (!response.ok) throw new Error("invalid");
      const delivery = await response.json() as { product?: string; items?: DeliveryItem[] };
      if (delivery.product !== "bundle" || !Array.isArray(delivery.items) || ![3, 4].includes(delivery.items.length)) throw new Error("invalid");
      setAccess({ order, token });
      setItems(delivery.items);
      setStatus("ready");
    }

    void loadBundle().catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <div className="flex min-h-52 items-center justify-center gap-3 text-sm font-black text-brand-navy/65"><LoaderCircle className="animate-spin" size={20} /> Deschidem pachetul...</div>;
  if (status === "error") return <div className="border-y border-red-300 bg-red-50 px-6 py-8 text-center text-sm font-bold text-red-700">Linkul nu este valid, a expirat sau pachetul nu este încă pregătit. Scrie-ne din pagina de contact și verificăm comanda.</div>;

  return (
    <div className="divide-y divide-brand-navy/12 border-y border-brand-navy/15">
      {items.map((item) => {
        const presentation = productPresentation[item.product];
        const Icon = presentation.icon;
        const query = `order=${encodeURIComponent(access.order)}&token=${encodeURIComponent(access.token)}&item=${item.product}`;
        const albumDocumentUrl = (file: "storybook" | "activities") => `/api/orders/${encodeURIComponent(access.order)}/document?token=${encodeURIComponent(access.token)}&item=album&file=${file}`;
        return (
          <article key={item.product} className="grid gap-5 py-8 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-navy text-brand-gold"><Icon size={23} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-purple">Pentru {childName(item)}</p>
              <h2 className="mt-2 font-serif text-3xl text-brand-navy">{presentation.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-navy/65">{presentation.description}</p>
            </div>
            {item.product === "album" ? (
              <div className="flex flex-col gap-2 sm:min-w-44">
                <a href={albumDocumentUrl("storybook")} onClick={() => trackEvent("pdf_downloaded", { product: "album", pageCount: 16 })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-purple px-4 text-xs font-black text-white transition-colors hover:bg-brand-navy"><Download size={16} /> Cartea ilustrată</a>
                <a href={albumDocumentUrl("activities")} onClick={() => trackEvent("pdf_downloaded", { product: "album", pageCount: 8 })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-brand-purple px-4 text-xs font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"><Download size={16} /> Caietul de activități</a>
              </div>
            ) : <a href={`/?${query}#${presentation.anchor}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-purple px-5 text-sm font-black text-white transition-colors hover:bg-brand-navy">Deschide <ArrowRight size={17} /></a>}
          </article>
        );
      })}
    </div>
  );
}
