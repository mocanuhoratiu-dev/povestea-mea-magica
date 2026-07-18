import { NextResponse } from "next/server";
import { siteMode } from "@/lib/siteMode";

function configured(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function GET() {
  const aiProvider = process.env.AI_PROVIDER?.trim().toLowerCase() === "vertex" ? "vertex" : "gemini";
  const checks = {
    geminiApiKey: configured(process.env.GEMINI_API_KEY),
    vertexAiProject: configured(process.env.VERTEX_AI_PROJECT_ID),
    vertexAiImageModel: configured(process.env.VERTEX_AI_IMAGE_MODEL),
    vertexAiCredentials:
      configured(process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64) ||
      configured(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      configured(process.env.K_SERVICE),
    elevenlabsApiKey: configured(process.env.ELEVENLABS_API_KEY),
  };

  // Cloud Run exposes application default credentials through its runtime identity.
  const storyAiReady = aiProvider === "vertex"
    ? checks.vertexAiProject && checks.vertexAiCredentials
    : checks.geminiApiKey;
  const ready = storyAiReady;

  return NextResponse.json(
    {
      ready,
      siteMode,
      aiProvider,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      checks,
      features: {
        storyAi: storyAiReady,
        storyCoverAi: aiProvider === "vertex" && storyAiReady,
        storyCoverFallback: true,
        storyFallback: true,
        voicePreview: checks.elevenlabsApiKey,
        stripeCheckout: false,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
