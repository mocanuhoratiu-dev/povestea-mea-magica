import { NextResponse } from "next/server";
import { checkTelemetryRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { isTelemetryProduct, logTelemetry, type GenerationMode } from "@/lib/telemetry";

const CLIENT_EVENTS = new Set([
  "site_visited", "story_preview_started", "product_started", "generation_completed", "pdf_downloaded", "feedback_requested",
  "pdf_feedback_helpful", "pdf_feedback_not_helpful", "lumi_opened", "lumi_message_sent", "lumi_recommendation_applied", "lumi_response_failed",
]);
const GENERATION_MODES = new Set<GenerationMode>(["ai", "fallback", "template"]);

function readBoundedInteger(value: unknown, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : undefined;
}

export async function POST(request: Request) {
  if (requestExceedsBodyLimit(request, 1_500)) {
    return NextResponse.json({ error: "Eveniment prea mare." }, { status: 413 });
  }

  const limit = checkTelemetryRateLimit(request);
  if (!limit.allowed) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const event = payload.event;
    if (typeof event !== "string" || !CLIENT_EVENTS.has(event)) {
      return NextResponse.json({ error: "Eveniment necunoscut." }, { status: 400 });
    }

    const product = payload.product;
    const productEvents = new Set(["story_preview_started", "product_started", "generation_completed", "pdf_downloaded", "feedback_requested", "pdf_feedback_helpful", "pdf_feedback_not_helpful", "lumi_recommendation_applied"]);
    if (productEvents.has(event) && !isTelemetryProduct(product)) {
      return NextResponse.json({ error: "Produs necunoscut." }, { status: 400 });
    }

    const generationMode = payload.generationMode;
    if (generationMode !== undefined && (typeof generationMode !== "string" || !GENERATION_MODES.has(generationMode as GenerationMode))) {
      return NextResponse.json({ error: "Sursă de generare necunoscută." }, { status: 400 });
    }

    logTelemetry(`pmm_${event}` as "pmm_site_visited" | "pmm_story_preview_started" | "pmm_product_started" | "pmm_generation_completed" | "pmm_pdf_downloaded" | "pmm_feedback_requested" | "pmm_pdf_feedback_helpful" | "pmm_pdf_feedback_not_helpful" | "pmm_lumi_opened" | "pmm_lumi_message_sent" | "pmm_lumi_recommendation_applied" | "pmm_lumi_response_failed", {
      ...(isTelemetryProduct(product) ? { product } : {}),
      result: "success",
      ...(generationMode ? { generationMode: generationMode as GenerationMode } : {}),
      pageCount: readBoundedInteger(payload.pageCount, 50),
      wordCount: readBoundedInteger(payload.wordCount, 20_000),
    });

    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Eveniment invalid." }, { status: 400 });
  }
}
