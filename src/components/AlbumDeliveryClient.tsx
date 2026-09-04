"use client";

import { useEffect, useRef, useState } from "react";
import { BookHeart, Download, LoaderCircle, Palette, RefreshCw } from "lucide-react";
import QuickRating from "@/components/QuickRating";
import { trackEvent } from "@/lib/clientTelemetry";
import PersonalizedAlbumFlipbook, { type PersonalizedAlbumPage } from "@/components/PersonalizedAlbumFlipbook";

type AlbumDelivery = {
  product: "album";
  childName: string;
  title: string;
  pages: PersonalizedAlbumPage[];
  audioUrl?: string;
  referenceMode: "description" | "photo";
  qualitySummary: { accepted: number; checked: number };
  documents: Array<{ id: "storybook" | "activities"; label: string; pages: number }>;
};

const documentPresentation = {
  storybook: {
    description: "16 pagini A5 landscape, cu 13 ilustrații create special pentru aventură.",
    icon: BookHeart,
  },
  activities: {
    description: "5 pagini A5 landscape, cu colorat, labirint și joc de diferențe.",
    icon: Palette,
  },
} as const;

export default function AlbumDeliveryClient() {
  const [delivery, setDelivery] = useState<AlbumDelivery | null>(null);
  const [access, setAccess] = useState({ order: "", token: "" });
  const [status, setStatus] = useState<"loading" | "processing" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order") || "";
    const token = params.get("token") || "";

    const loadAlbum = async () => {
      if (!order || !token) throw new Error("invalid");
      const response = await fetch(`/api/orders/${encodeURIComponent(order)}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (response.status === 202) {
        if (!cancelled) {
          setStatus("processing");
          timer.current = setTimeout(() => setAttempt((current) => current + 1), 5_000);
        }
        return;
      }
      if (!response.ok) throw new Error("invalid");
      const payload = await response.json() as AlbumDelivery;
      if (payload.product !== "album" || payload.documents?.length !== 2 || payload.pages?.length !== 16) throw new Error("invalid");
      if (!cancelled) {
        setAccess({ order, token });
        setDelivery(payload);
        setStatus("ready");
      }
    };

    void loadAlbum().catch(() => {
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [attempt]);

  if (status === "loading" || status === "processing") {
    return (
      <div className="border-y border-brand-navy/15 bg-white px-6 py-14 text-center">
        <LoaderCircle className="mx-auto animate-spin text-brand-purple" size={30} />
        <h2 className="mt-5 font-serif text-3xl text-brand-navy">Povestea Magică este în lucru</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/65">Creăm fiecare ilustrație separat și pregătim cele două documente. Pagina se actualizează singură când sunt gata.</p>
      </div>
    );
  }

  if (status === "error" || !delivery) {
    return (
      <div className="border-y border-red-300 bg-red-50 px-6 py-10 text-center">
        <p className="text-sm font-bold leading-relaxed text-red-700">Linkul nu este valid, a expirat sau Povestea Magică nu este încă pregătită.</p>
        <button type="button" onClick={() => { setStatus("loading"); setAttempt((current) => current + 1); }} className="mt-5 inline-flex min-h-11 items-center gap-2 border border-red-300 px-4 text-sm font-black text-red-700">
          <RefreshCw size={16} /> Verifică din nou
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 border-l-4 border-brand-gold bg-brand-navy px-5 py-5 text-brand-cream sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-gold">Creat pentru {delivery.childName}</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{delivery.title}</h2>
      </div>
      <PersonalizedAlbumFlipbook pages={delivery.pages} audioUrl={delivery.audioUrl} title={delivery.title} qualitySummary={delivery.qualitySummary} />
      <div className="border-y border-brand-navy/15 bg-white">
        {delivery.documents.map((document) => {
          const presentation = documentPresentation[document.id];
          const Icon = presentation.icon;
          const href = `/api/orders/${encodeURIComponent(access.order)}/document?token=${encodeURIComponent(access.token)}&file=${document.id}`;
          return (
            <article key={document.id} className="grid gap-5 border-b border-brand-navy/12 px-5 py-8 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-8">
              <span className="grid h-12 w-12 place-items-center bg-brand-navy text-brand-gold"><Icon size={23} /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-purple">{document.pages} pagini</p>
                <h2 className="mt-2 font-serif text-3xl text-brand-navy">{document.label}</h2>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/65">{presentation.description}</p>
              </div>
              <a
                href={href}
                onClick={() => trackEvent("pdf_downloaded", { product: "album", pageCount: document.pages })}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-brand-purple px-5 text-sm font-black text-white transition-colors hover:bg-brand-navy"
              >
                <Download size={17} /> Descarcă PDF
              </a>
            </article>
          );
        })}
      </div>
      <div className="mx-auto max-w-md text-center"><QuickRating product="album" /></div>
    </div>
  );
}
