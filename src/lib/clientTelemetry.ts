"use client";

import type { GenerationMode, StoryLength, TelemetryProduct } from "@/lib/telemetry";

type ClientEvent =
  | "site_visited"
  | "story_preview_started"
  | "album_sample_page_viewed"
  | "album_sample_audio_played"
  | "album_sample_expanded"
  | "album_sample_cta_clicked"
  | "album_product_cta_clicked"
  | "product_sample_page_viewed"
  | "product_page_cta_clicked"
  | "product_started"
  | "product_preview_opened"
  | "product_preview_checkout_clicked"
  | "product_video_played"
  | "generation_completed"
  | "pdf_render_started"
  | "pdf_render_completed"
  | "pdf_render_failed"
  | "pdf_downloaded"
  | "feedback_requested"
  | "pdf_feedback_helpful"
  | "pdf_feedback_not_helpful"
  | "lumi_opened"
  | "lumi_message_sent"
  | "lumi_recommendation_applied"
  | "lumi_moment_helpful"
  | "lumi_moment_not_helpful"
  | "lumi_voice_played"
  | "lumi_response_failed"
  | "web_vital_recorded";

type ClientTelemetryFields = {
  product?: TelemetryProduct;
  generationMode?: GenerationMode;
  pageCount?: number;
  wordCount?: number;
  storyLength?: StoryLength;
  durationMs?: number;
  samplePage?: number;
  webVitalName?: "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
  webVitalValue?: number;
  webVitalRating?: "good" | "needs-improvement" | "poor";
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
    durationMs: fields.durationMs,
    samplePage: fields.samplePage,
    webVitalName: fields.webVitalName,
    webVitalValue: fields.webVitalValue,
    webVitalRating: fields.webVitalRating,
  });
}

export function trackSiteVisit() {
  if (typeof window === "undefined") return;

  const key = "pmm-site-visit-tracked";
  if (window.sessionStorage.getItem(key)) return;

  window.sessionStorage.setItem(key, "1");
  trackEvent("site_visited");
}
