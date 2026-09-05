"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookHeart, BookOpen, Download, LoaderCircle, ShieldCheck, TimerReset } from "lucide-react";
import PersonalizedAlbumFlipbook, { type PersonalizedAlbumPage } from "@/components/PersonalizedAlbumFlipbook";
import { trackEvent } from "@/lib/clientTelemetry";
import type { BundleProduct } from "@/lib/bundle";
import VerifiedReviewForm from "@/components/VerifiedReviewForm";

type DeliveryItem = {
  product: BundleProduct;
  configuration: Record<string, unknown>;
};

const productPresentation: Record<BundleProduct, { title: string; description: string; path: string; anchor: string; icon: typeof BookOpen }> = {
  story: { title: "Povestea lungă", description: "Copertă, dedicație și patru pagini de aventură", path: "/", anchor: "creator", icon: BookOpen },
  monster: { title: "Scutul de Noapte", description: "Nouă pagini cu poveste, fișa «Camera mea», ritual, respirație și card de noptieră", path: "/scutul-de-noapte", anchor: "monster-away", icon: ShieldCheck },
  emergency: { title: "Trusa de Răbdare", description: "Zece pagini cu opt activități și trei niveluri de dificultate", path: "/trusa-de-rabdare", anchor: "emergency-kit", icon: TimerReset },
  album: { title: "Povestea Magică", description: "Carte ilustrată de 16 pagini și caiet separat de activități", path: "/album-ilustrat", anchor: "album", icon: BookHeart },
};

function childName(item: DeliveryItem) {
  const generation = item.configuration.generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) return "copilul vostru";
  const name = (generation as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : "copilul vostru";
}

type AlbumDelivery = {
  product: "album";
  childName: string;
  title: string;
  pages: PersonalizedAlbumPage[];
  audioUrl?: string;
  qualitySummary: { accepted: number; checked: number };
};

function BundleAlbumDelivery({ item, order, token }: { item: DeliveryItem; order: string; token: string }) {
  const [delivery, setDelivery] = useState<AlbumDelivery | null>(null);
  const [failed, setFailed] = useState(false);
  const albumDocumentUrl = (file: "storybook" | "activities") => `/api/orders/${encodeURIComponent(order)}/document?token=${encodeURIComponent(token)}&item=album&file=${file}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch(`/api/orders/${encodeURIComponent(order)}?token=${encodeURIComponent(token)}&item=album`, { cache: "no-store" });
      if (!response.ok) throw new Error("invalid");
      const payload = await response.json() as AlbumDelivery;
      if (payload.product !== "album" || payload.pages?.length !== 16) throw new Error("invalid");
      if (!cancelled) setDelivery(payload);
    };
    void load().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [order, token]);

  if (!delivery && !failed) {
    return <div className="flex min-h-48 items-center justify-center gap-3 py-8 text-sm font-black text-brand-navy/65"><LoaderCircle className="animate-spin" size={20} /> Deschidem albumul...</div>;
  }

  return (
    <article className="py-9">
      <div className="mb-6 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-navy text-brand-gold"><BookHeart size={23} /></span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-purple">Pentru {delivery?.childName || childName(item)}</p>
          <h2 className="mt-2 font-serif text-3xl text-brand-navy">{delivery?.title || "Povestea Magică"}</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-navy/65">Carte ilustrată de 16 pagini, narațiune și caiet separat de activități.</p>
        </div>
      </div>
      {delivery && <PersonalizedAlbumFlipbook pages={delivery.pages} audioUrl={delivery.audioUrl} title={delivery.title} qualitySummary={delivery.qualitySummary} />}
      {failed && <p className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Previzualizarea nu a putut fi încărcată, dar documentele sunt pregătite pentru descărcare.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={albumDocumentUrl("storybook")} onClick={() => trackEvent("pdf_downloaded", { product: "album", pageCount: 16 })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-purple px-4 text-sm font-black text-white transition-colors hover:bg-brand-navy"><Download size={17} /> Descarcă albumul</a>
        <a href={albumDocumentUrl("activities")} onClick={() => trackEvent("pdf_downloaded", { product: "album", pageCount: 5 })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-brand-purple px-4 text-sm font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white"><Download size={17} /> Descarcă activitățile</a>
      </div>
    </article>
  );
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
    <div>
      <div className="divide-y divide-brand-navy/12 border-y border-brand-navy/15">
        {items.map((item) => {
        if (item.product === "album") {
          return <BundleAlbumDelivery key={item.product} item={item} order={access.order} token={access.token} />;
        }
        const presentation = productPresentation[item.product];
        const Icon = presentation.icon;
        const query = `order=${encodeURIComponent(access.order)}&token=${encodeURIComponent(access.token)}&item=${item.product}`;
        return (
          <article key={item.product} className="grid gap-5 py-8 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-navy text-brand-gold"><Icon size={23} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-purple">Pentru {childName(item)}</p>
              <h2 className="mt-2 font-serif text-3xl text-brand-navy">{presentation.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-navy/65">{presentation.description}</p>
            </div>
            <a href={`${presentation.path}?${query}#${presentation.anchor}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-purple px-5 text-sm font-black text-white transition-colors hover:bg-brand-navy">Deschide <ArrowRight size={17} /></a>
          </article>
        );
        })}
      </div>
      <VerifiedReviewForm orderId={access.order} token={access.token} product="bundle" />
    </div>
  );
}
