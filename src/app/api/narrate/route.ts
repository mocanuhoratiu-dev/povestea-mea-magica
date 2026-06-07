import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!text) {
      return NextResponse.json({ error: "Textul pentru narare lipsește." }, { status: 400 });
    }

    if (!apiKey) {
      console.error("❌ ElevenLabs API Key is missing!");
      return NextResponse.json({ error: "ELEVENLABS_API_KEY lipsește din .env.local." }, { status: 500 });
    }

    console.log("🎙️ Trimit cerere către ElevenLabs pentru textul:", text.substring(0, 30) + "...");

    // Folosim Fetch direct pentru control total asupra stream-ului
    // Vocea Rachel (21m00Tcm4TlvDq8ikWAM) este cea mai stabila pt limba romana
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text,
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
    console.log("✅ Audio primit cu succes, mărime:", audioBuffer.byteLength);

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
