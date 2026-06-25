import { NextResponse } from "next/server";

function configured(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function GET() {
  const checks = {
    geminiApiKey: configured(process.env.GEMINI_API_KEY),
    elevenlabsApiKey: configured(process.env.ELEVENLABS_API_KEY),
  };

  const ready = checks.geminiApiKey;

  return NextResponse.json(
    {
      ready,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      checks,
      features: {
        storyAi: checks.geminiApiKey,
        storyFallback: true,
        voicePreview: checks.elevenlabsApiKey,
        stripeCheckout: false,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
