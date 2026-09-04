"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { albumProgressPresentation, type AlbumPublicProgress } from "@/lib/album/presentation";

type OrderProduct = "story" | "monster" | "emergency" | "bundle" | "album";
type OrderStatus = "draft" | "pending_payment" | "paid" | "processing" | "delivered" | "failed";
type CheckoutStatus = {
  status: OrderStatus;
  product?: OrderProduct;
  productId?: string;
  progress?: AlbumPublicProgress;
  deliveryUrl?: string;
  delayed?: boolean;
};

const productNames: Record<OrderProduct, string> = {
  story: "povestea",
  monster: "Scutul de Noapte",
  emergency: "Trusa de Răbdare",
  bundle: "Pachetul Familiei Magice",
  album: "Povestea Magică",
};

function activePresentation(status?: CheckoutStatus) {
  if (!status || status.status === "draft" || status.status === "pending_payment") {
    return { label: "Confirmăm plata", detail: "Stripe ne trimite confirmarea securizată a comenzii.", percent: 4 };
  }
  if (status.status === "paid") {
    return { label: "Comanda este confirmată", detail: "Atelierul pornește în câteva clipe.", percent: 8 };
  }
  if (status.product === "album" || status.productId === "complete-bundle") return albumProgressPresentation(status.progress);
  return { label: "Creăm materialul vostru", detail: "Personalizarea și documentul sunt în lucru.", percent: 58 };
}

export default function OrderConfirmationClient() {
  const [order, setOrder] = useState<CheckoutStatus | null>(null);
  const [state, setState] = useState<"checking" | "active" | "ready" | "failed" | "error" | "missing">("checking");
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
    if (!sessionId) {
      timer.current = setTimeout(() => {
        if (!cancelled) setState("missing");
      }, 0);
      return () => {
        cancelled = true;
        if (timer.current) clearTimeout(timer.current);
      };
    }

    const load = async () => {
      const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("status_unavailable");
      const payload = await response.json() as CheckoutStatus;
      if (cancelled) return;
      setOrder(payload);
      if (payload.status === "delivered" && payload.deliveryUrl) {
        if (payload.product === "album") window.sessionStorage.removeItem("pmm-album-draft");
        setState("ready");
        return;
      }
      if (payload.status === "failed") {
        setState("failed");
        return;
      }
      setState("active");
      timer.current = setTimeout(() => setAttempt((current) => current + 1), payload.delayed ? 8_000 : 4_000);
    };

    void load().catch(() => {
      if (!cancelled) setState("error");
    });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [attempt]);

  const presentation = useMemo(() => activePresentation(order || undefined), [order]);
  const productName = order?.productId === "complete-bundle"
    ? "Pachetul Complet"
    : order?.product
      ? productNames[order.product]
      : "materialul vostru";

  if (state === "ready" && order?.deliveryUrl) {
    return (
      <div className="border-y border-brand-gold/55 bg-white px-6 py-10 text-center sm:px-9">
        <span className="mx-auto grid h-14 w-14 place-items-center bg-brand-navy text-brand-gold"><CheckCircle2 size={30} /></span>
        <h2 className="mt-6 font-serif text-3xl text-brand-navy">Totul este gata</h2>
        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-brand-navy/65">{productName.charAt(0).toUpperCase() + productName.slice(1)} poate fi deschis acum. Am trimis același link și pe email.</p>
        <a href={order.deliveryUrl} className="mt-7 inline-flex min-h-13 items-center gap-2 bg-brand-purple px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-navy">
          Deschide materialul <ArrowRight size={17} />
        </a>
      </div>
    );
  }

  if (state === "failed" || state === "error" || state === "missing") {
    const heading = state === "missing" ? "Linkul comenzii este incomplet" : "Avem nevoie de încă o verificare";
    const detail = state === "failed"
      ? "Comanda nu a putut fi finalizată automat. Plata rămâne înregistrată, iar echipa noastră poate relua livrarea fără o nouă comandă."
      : state === "missing"
        ? "Deschide linkul primit după plată sau pe email. Dacă nu îl mai găsești, scrie-ne și identificăm comanda."
        : "Nu putem citi starea comenzii chiar acum. Încearcă din nou; dacă plata a fost confirmată, generarea de pe server continuă între timp.";
    return (
      <div className="border-y border-red-300 bg-red-50 px-6 py-10 text-center sm:px-9">
        <h2 className="font-serif text-3xl text-brand-navy">{heading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-relaxed text-red-800">{detail}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {state !== "missing" ? <button type="button" onClick={() => { setState("checking"); setAttempt((current) => current + 1); }} className="inline-flex min-h-11 items-center gap-2 border border-red-300 px-4 text-sm font-black text-red-800"><RefreshCw size={16} /> Verifică din nou</button> : null}
          <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 border-b border-brand-purple px-2 text-sm font-black text-brand-purple">Contactează-ne <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y border-brand-gold/55 bg-white px-6 py-9 sm:px-9 sm:py-11" aria-live="polite">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
        <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand-navy text-brand-gold">
          {state === "checking" ? <LoaderCircle className="animate-spin" size={24} /> : <Clock3 size={24} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">{productName}</p>
          <h2 className="mt-2 font-serif text-3xl text-brand-navy">{presentation.label}</h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/65">{order?.delayed ? "Generarea durează mai mult decât de obicei, dar continuă. Nu este nevoie să plătești sau să comanzi din nou." : presentation.detail}</p>
          <div className="mt-6 h-2 overflow-hidden bg-brand-navy/10" aria-label={`Progres ${presentation.percent}%`}>
            <div className="h-full bg-brand-purple transition-[width] duration-700" style={{ width: `${presentation.percent}%` }} />
          </div>
          <div className="mt-5 flex gap-3 border-t border-brand-navy/10 pt-5 text-xs font-bold leading-relaxed text-brand-navy/55">
            <Mail className="mt-0.5 shrink-0 text-brand-purple" size={17} />
            <p>Poți închide pagina. Primești automat un email cu linkul de descărcare imediat ce materialul este gata.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
