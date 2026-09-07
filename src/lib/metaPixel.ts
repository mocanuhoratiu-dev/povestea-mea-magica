"use client";

import type { TelemetryProduct } from "@/lib/telemetry";
import { readMarketingConsent } from "@/lib/campaignAttribution";

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

const productData: Record<TelemetryProduct, { id: string; name: string; value: number }> = {
  story: { id: "legacy-story", name: "Poveste personalizată", value: 0 },
  monster: { id: "night-shield", name: "Scutul de Noapte", value: 19 },
  emergency: { id: "patience-kit", name: "Trusa de Răbdare", value: 19 },
  bundle: { id: "complete-bundle", name: "Pachetul Complet", value: 79 },
  album: { id: "illustrated-album-digital", name: "Povestea Magică", value: 59 },
};

export function isMetaPixelConfigured() {
  return Boolean(pixelId);
}

export function loadMetaPixel() {
  if (typeof window === "undefined" || !pixelId || readMarketingConsent() !== "accepted") return undefined;
  if (window.fbq) return window.fbq;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as MetaPixelFunction;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
  return fbq;
}

export function trackMetaPageView() {
  loadMetaPixel()?.("track", "PageView");
}

export function trackMetaClientEvent(event: string, product?: TelemetryProduct) {
  const fbq = loadMetaPixel();
  if (!fbq) return;
  const data = product ? productData[product] : undefined;
  const payload = data ? {
    content_ids: [data.id],
    content_name: data.name,
    content_type: "product",
    currency: "RON",
    value: data.value,
  } : {};

  if (["album_product_cta_clicked", "product_page_cta_clicked", "product_started", "story_preview_started"].includes(event)) {
    fbq("track", "ViewContent", payload);
  }
  if (event === "product_preview_checkout_clicked") {
    fbq("track", "InitiateCheckout", payload);
  }
}

function cookieValue(name: string) {
  return document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function trackMetaPurchase(sessionId: string, product: TelemetryProduct) {
  const fbq = loadMetaPixel();
  if (!fbq || !sessionId) return;
  const data = productData[product];
  // Stable across refreshes so Meta can deduplicate both browser/server events
  // and repeated visits to the confirmation URL.
  const eventId = `purchase-${sessionId.slice(-64)}`;
  const payload = {
    content_ids: [data.id],
    content_name: data.name,
    content_type: "product",
    currency: "RON",
    value: data.value,
  };
  fbq("track", "Purchase", payload, { eventID: eventId });

  await fetch("/api/marketing-conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      eventId,
      consent: true,
      fbc: cookieValue("_fbc"),
      fbp: cookieValue("_fbp"),
    }),
    keepalive: true,
  }).catch(() => undefined);
}
