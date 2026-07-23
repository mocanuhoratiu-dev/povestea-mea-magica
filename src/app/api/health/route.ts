import { NextResponse } from "next/server";
import { commerce, siteMode } from "@/lib/siteMode";

function configured(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function canReadDiagnostics(request: Request) {
  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  return Boolean(token && request.headers.get("x-healthcheck-token") === token);
}

export function GET(request: Request) {
  const aiProvider = process.env.AI_PROVIDER?.trim().toLowerCase() === "vertex" ? "vertex" : "gemini";
  const checks = {
    geminiApiKey: configured(process.env.GEMINI_API_KEY),
    vertexAiProject: configured(process.env.VERTEX_AI_PROJECT_ID),
    vertexAiImageModel: configured(process.env.VERTEX_AI_IMAGE_MODEL),
    vertexAiCredentials:
      configured(process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64) ||
      configured(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      configured(process.env.K_SERVICE),
    googleTextToSpeech: configured(process.env.VERTEX_AI_PROJECT_ID) &&
      (configured(process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64) ||
        configured(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
        configured(process.env.K_SERVICE)),
    emailDelivery: configured(process.env.RESEND_API_KEY) && configured(process.env.EMAIL_FROM),
  };

  // Cloud Run exposes application default credentials through its runtime identity.
  const storyAiReady = aiProvider === "vertex"
    ? checks.vertexAiProject && checks.vertexAiCredentials
    : checks.geminiApiKey;
  const ready = storyAiReady;

  const diagnostics = canReadDiagnostics(request);
  const payload = diagnostics
    ? {
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
        voicePreview: checks.googleTextToSpeech,
        emailDelivery: checks.emailDelivery,
        stripeCheckout: commerce.acceptsPayments,
      },
      timestamp: new Date().toISOString(),
    }
    : {
      ready,
      siteMode,
      timestamp: new Date().toISOString(),
    };

  return NextResponse.json(payload, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
