import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("❌ ElevenLabs API Key is missing!");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
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
  } catch (err: any) {
    console.error("❌ ElevenLabs Catch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
