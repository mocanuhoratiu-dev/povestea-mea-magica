import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";

export async function POST(req: Request) {
  try {
    if (requestExceedsBodyLimit(req, 8_000)) {
      return NextResponse.json({ error: "Textul pentru narare este prea lung." }, { status: 413 });
    }

    const limit = checkRateLimit(req, "narrate");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Ai ajuns la limita de previzualizări audio. Încearcă din nou mai târziu." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { text } = (await req.json()) as { text?: unknown };
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const safeText = typeof text === "string" ? text.replace(/\s+/g, " ").trim().slice(0, 4_000) : "";

    if (!safeText) {
      return NextResponse.json({ error: "Textul pentru narare lipsește." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY lipsește din .env.local." }, { status: 500 });
    }

    // Vocea Rachel (21m00Tcm4TlvDq8ikWAM) este stabilă pentru previzualizarea în limba română.
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: safeText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ ElevenLabs API Error:", errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err: unknown) {
    console.error("❌ ElevenLabs Catch Error:", err);
    const message = err instanceof Error ? err.message : "Eroare necunoscută";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
