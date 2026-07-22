"use client";

import type { GenerationMode, StoryLength, TelemetryProduct } from "@/lib/telemetry";

type ClientEvent =
  | "site_visited"
  | "story_preview_started"
  | "product_started"
  | "generation_completed"
  | "pdf_downloaded"
  | "feedback_requested"
  | "pdf_feedback_helpful"
  | "pdf_feedback_not_helpful"
  | "lumi_opened"
  | "lumi_message_sent"
  | "lumi_recommendation_applied"
  | "lumi_voice_played"
  | "lumi_response_failed";

type ClientTelemetryFields = {
  product?: TelemetryProduct;
  generationMode?: GenerationMode;
  pageCount?: number;
  wordCount?: number;
  storyLength?: StoryLength;
};

function postTelemetry(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const sent = navigator.sendBeacon("/api/telemetry", new Blob([body], { type: "application/json" }));
    if (sent) return;
  }

  void fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Sends a small, allow-listed aggregate event only; no form values are sent. */
export function trackEvent(event: ClientEvent, fields: ClientTelemetryFields = {}) {
  postTelemetry({
    event,
    product: fields.product,
    generationMode: fields.generationMode,
    pageCount: fields.pageCount,
    wordCount: fields.wordCount,
    storyLength: fields.storyLength,
  });
}

export function trackSiteVisit() {
  if (typeof window === "undefined") return;

  const key = "pmm-site-visit-tracked";
  if (window.sessionStorage.getItem(key)) return;

  window.sessionStorage.setItem(key, "1");
  trackEvent("site_visited");
}
