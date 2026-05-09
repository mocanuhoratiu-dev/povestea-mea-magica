import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const audio = await elevenlabs.generate({
      voice: "Bella", // Poti schimba cu orice ID de voce (ex: EXAVITQu4qx7Cc9siWjx)
      model_id: "eleven_multilingual_v2",
      text: text,
    });

    // Convertim stream-ul in Buffer pentru a-l trimite catre frontend
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);

    return new Response(content, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err: any) {
    console.error("ElevenLabs Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
