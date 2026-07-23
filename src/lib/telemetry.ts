export const telemetryProducts = ["story", "monster", "emergency"] as const;

export type TelemetryProduct = (typeof telemetryProducts)[number];

export type GenerationMode = "ai" | "fallback" | "template";
export type StoryLength = "short" | "long";

type TelemetryFields = {
  product?: TelemetryProduct;
  result?: "success" | "error" | "rejected";
  generationMode?: GenerationMode;
  durationMs?: number;
  continuationCount?: number;
  attempt?: number;
  wordCount?: number;
  pageCount?: number;
  storyLength?: StoryLength;
  errorCode?: "ai_error" | "configuration" | "invalid_request" | "rate_limited" | "unknown";
  aiProvider?: "gemini" | "vertex";
  model?: string;
};

type TelemetryEvent =
  | "pmm_site_visited"
  | "pmm_story_preview_started"
  | "pmm_product_started"
  | "pmm_generation_completed"
  | "pmm_generation_failed"
  | "pmm_story_text_completed"
  | "pmm_story_text_failed"
  | "pmm_story_continuation_completed"
  | "pmm_story_continuation_failed"
  | "pmm_story_cover_started"
  | "pmm_story_cover_completed"
  | "pmm_story_cover_failed"
  | "pmm_pdf_render_started"
  | "pmm_pdf_render_completed"
  | "pmm_pdf_render_failed"
  | "pmm_email_delivery_started"
  | "pmm_email_delivery_completed"
  | "pmm_email_delivery_failed"
  | "pmm_pdf_downloaded"
  | "pmm_feedback_requested"
  | "pmm_pdf_feedback_helpful"
  | "pmm_pdf_feedback_not_helpful"
  | "pmm_lumi_opened"
  | "pmm_lumi_message_sent"
  | "pmm_lumi_recommendation_applied"
  | "pmm_lumi_voice_played"
  | "pmm_lumi_response"
  | "pmm_lumi_response_failed";

/**
 * Emits aggregate product events to Cloud Run logs. Never add child names,
 * story text, prompts, IP addresses, or other free-form customer input here.
 */
export function logTelemetry(event: TelemetryEvent, fields: TelemetryFields = {}) {
  const entry = {
    severity: "INFO",
    event,
    product: fields.product,
    result: fields.result,
    generation_mode: fields.generationMode,
    duration_ms: fields.durationMs,
    continuation_count: fields.continuationCount,
    attempt: fields.attempt,
    word_count: fields.wordCount,
    page_count: fields.pageCount,
    story_length: fields.storyLength,
    error_code: fields.errorCode,
    ai_provider: fields.aiProvider,
    model: fields.model,
  };

  // Omit absent keys so log-based metric labels stay clean and predictable.
  console.info(JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined))));
}

export function isTelemetryProduct(value: unknown): value is TelemetryProduct {
  return typeof value === "string" && telemetryProducts.includes(value as TelemetryProduct);
}
