import { NextResponse } from "next/server";
import { synthesizeRomanianSpeech, type NarrationKind } from "@/lib/googleTextToSpeech";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";

export async function POST(request: Request) {
  try {
    if (requestExceedsBodyLimit(request, 8_000)) {
      return NextResponse.json({ error: "Textul pentru narare este prea lung." }, { status: 413 });
    }
    const limit = checkRateLimit(request, "narrate");
    if (!limit.allowed) {
      return NextResponse.json({ error: "Ai ajuns la limita de previzualizări audio. Încearcă din nou mai târziu." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }

    const body = (await request.json()) as { text?: unknown; kind?: unknown };
    const text = typeof body.text === "string" ? body.text.replace(/\s+/g, " ").trim().slice(0, 4_000) : "";
    const kind: NarrationKind = body.kind === "lumi" ? "lumi" : "story";
    if (!text) return NextResponse.json({ error: "Textul pentru narare lipsește." }, { status: 400 });

    const audio = await synthesizeRomanianSpeech(text, kind);
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Google Cloud Text-to-Speech error:", error);
    return NextResponse.json({ error: "Previzualizarea audio nu este disponibilă chiar acum. Încearcă din nou în câteva clipe." }, { status: 503 });
  }
}
