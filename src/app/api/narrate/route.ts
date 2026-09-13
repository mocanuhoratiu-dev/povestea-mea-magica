import { NextResponse } from "next/server";
import { synthesizeRomanianSpeech } from "@/lib/googleTextToSpeech";
import { isNarrationKind, narrationBytes, normalizeNarration, NARRATION_MAX_BYTES } from "@/lib/narration";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { turnstileRejected, verifyTurnstileRequest } from "@/lib/turnstile";
import { readLimitedJson } from "@/lib/limitedJson";

export async function POST(request: Request) {
  try {
    if (requestExceedsBodyLimit(request, 8_000)) {
      return NextResponse.json({ error: "Textul pentru narare este prea lung." }, { status: 413 });
    }
    const limit = checkRateLimit(request, "narrate", { maxRequests: 60, windowMs: 60 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Ai ajuns la limita de ascultări audio. Încearcă din nou mai târziu." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }
    if (!(await verifyTurnstileRequest(request, "narrate"))) return turnstileRejected();

    let body: { text?: unknown; kind?: unknown };
    try { body = await readLimitedJson(request, 8_000); } catch (error) {
      return NextResponse.json({ error: "Cerere audio invalidă sau prea lungă." }, { status: error instanceof Error && error.message === "request_too_large" ? 413 : 400 });
    }
    if (!body || !isNarrationKind(body.kind)) return NextResponse.json({ error: "Tipul de narare nu este valid." }, { status: 400 });
    const text = typeof body.text === "string" ? normalizeNarration(body.text) : "";
    const kind = body.kind;
    if (!text) return NextResponse.json({ error: "Textul pentru narare lipsește." }, { status: 400 });
    if (narrationBytes(text) > NARRATION_MAX_BYTES) return NextResponse.json({ error: "Fragmentul pentru narare este prea lung." }, { status: 413 });

    const audio = await synthesizeRomanianSpeech(text, kind);
    return new Response(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("Narration unavailable:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Redarea audio nu este disponibilă chiar acum. Încearcă din nou în câteva clipe." }, { status: 503 });
  }
}
