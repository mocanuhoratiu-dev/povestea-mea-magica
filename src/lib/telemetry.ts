export const telemetryProducts = ["story", "monster", "emergency", "bundle", "album"] as const;

export type TelemetryProduct = (typeof telemetryProducts)[number];

export type GenerationMode = "ai" | "fallback" | "template";
export type StoryLength = "short" | "long";
export type OperationalOrderStage = "generation" | "rendering" | "audio" | "email" | "delivery";

export type TelemetryFields = {
  product?: TelemetryProduct;
  result?: "success" | "error" | "rejected" | "pending";
  generationMode?: GenerationMode;
  durationMs?: number;
  continuationCount?: number;
  attempt?: number;
  wordCount?: number;
  pageCount?: number;
  storyLength?: StoryLength;
  errorCode?: "ai_error" | "provider_busy" | "provider_unavailable" | "provider_rejected" | "quality_rejected" | "quality_unavailable" | "generation_failed" | "configuration" | "invalid_request" | "rate_limited" | "render_error" | "image_duplicate" | "image_low_resolution" | "image_quality_rejected" | "budget_limit" | "payment_failed" | "checkout_expired" | "unknown";
  aiProvider?: "gemini" | "vertex";
  model?: string;
  albumStage?: "plan" | "cover" | "preview" | "scene" | "coloring" | "render" | "audio" | "delivery";
  kitStage?: "text" | "cover" | "scene";
  samplePage?: number;
  estimatedCostMicros?: number;
  identityScore?: number;
  storyScore?: number;
  technicalScore?: number;
  qualityFallback?: boolean;
  amountMinor?: number;
  discountAmountMinor?: number;
  currency?: string;
  liveMode?: boolean;
  promotionCode?: string;
  reviewRating?: number;
  mediaAttached?: boolean;
  webVitalName?: "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
  webVitalValue?: number;
  webVitalRating?: "good" | "needs-improvement" | "poor";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPath?: string;
  referrerHost?: string;
  orderStage?: OperationalOrderStage;
  staleMinutes?: number;
};

export type TelemetryEvent =
  | "pmm_site_visited"
  | "pmm_story_preview_started"
  | "pmm_album_preview_started"
  | "pmm_album_preview_completed"
  | "pmm_album_preview_failed"
  | "pmm_album_sample_page_viewed"
  | "pmm_album_sample_audio_played"
  | "pmm_album_sample_expanded"
  | "pmm_album_sample_cta_clicked"
  | "pmm_album_product_cta_clicked"
  | "pmm_product_sample_page_viewed"
  | "pmm_product_page_cta_clicked"
  | "pmm_product_started"
  | "pmm_product_preview_opened"
  | "pmm_product_preview_checkout_clicked"
  | "pmm_product_video_played"
  | "pmm_purchase_completed"
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
  | "pmm_lumi_moment_helpful"
  | "pmm_lumi_moment_not_helpful"
  | "pmm_lumi_voice_played"
  | "pmm_lumi_response"
  | "pmm_lumi_response_failed"
  | "pmm_checkout_started"
  | "pmm_checkout_awaiting_payment"
  | "pmm_checkout_completed"
  | "pmm_checkout_failed"
  | "pmm_checkout_expired"
  | "pmm_payment_succeeded"
  | "pmm_payment_failed"
  | "pmm_promotion_applied"
  | "pmm_conversion_completed"
  | "pmm_invoice_started"
  | "pmm_invoice_completed"
  | "pmm_invoice_failed"
  | "pmm_invoice_needs_review"
  | "pmm_order_delivered"
  | "pmm_order_failed"
  | "pmm_order_watchdog_checked"
  | "pmm_order_recovery_enqueued"
  | "pmm_order_recovery_failed"
  | "pmm_order_attention_required"
  | "pmm_verified_review_submitted"
  | "pmm_verified_review_failed"
  | "pmm_album_stage_completed"
  | "pmm_album_stage_failed"
  | "pmm_kit_stage_completed"
  | "pmm_kit_stage_failed"
  | "pmm_web_vital_recorded";

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
    album_stage: fields.albumStage,
    kit_stage: fields.kitStage,
    sample_page: fields.samplePage,
    estimated_cost_micros: fields.estimatedCostMicros,
    identity_score: fields.identityScore,
    story_score: fields.storyScore,
    technical_score: fields.technicalScore,
    quality_fallback: fields.qualityFallback,
    amount_minor: fields.amountMinor,
    discount_amount_minor: fields.discountAmountMinor,
    currency: fields.currency,
    live_mode: fields.liveMode,
    promotion_code: fields.promotionCode,
    review_rating: fields.reviewRating,
    media_attached: fields.mediaAttached,
    web_vital_name: fields.webVitalName,
    web_vital_value: fields.webVitalValue,
    web_vital_rating: fields.webVitalRating,
    utm_source: fields.utmSource,
    utm_medium: fields.utmMedium,
    utm_campaign: fields.utmCampaign,
    utm_content: fields.utmContent,
    utm_term: fields.utmTerm,
    landing_path: fields.landingPath,
    referrer_host: fields.referrerHost,
    order_stage: fields.orderStage,
    stale_minutes: fields.staleMinutes,
  };

  // Omit absent keys so log-based metric labels stay clean and predictable.
  console.info(JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined))));
}

export function isTelemetryProduct(value: unknown): value is TelemetryProduct {
  return typeof value === "string" && telemetryProducts.includes(value as TelemetryProduct);
}
