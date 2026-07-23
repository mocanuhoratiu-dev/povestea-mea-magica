import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexStoryCover } from "@/lib/vertexImage";

function readPrompt(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1_800);
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  if (requestExceedsBodyLimit(req)) {
    return NextResponse.json(
      { success: false, error: "Cererea pentru copertă este prea mare." },
      { status: 413 }
    );
  }

  const limit = checkRateLimit(req, "generate-cover");
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Ai ajuns la limita de regenerări ale copertei pentru moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const prompt = readPrompt(body?.imagePrompt);
    if (!prompt) {
      return NextResponse.json({ success: false, error: "Nu am primit detaliile pentru copertă." }, { status: 400 });
    }

    const generated = await generateVertexStoryCover(prompt);
    if ("error" in generated) {
      // The browser will use the non-personal Pollinations fallback. Do not log the prompt.
      console.warn("Vertex cover generation failed");
      logTelemetry("pmm_story_cover_failed", {
        product: "story",
        result: "error",
        errorCode: "ai_error",
        durationMs: Date.now() - startedAt,
        aiProvider: "vertex",
      });
      return NextResponse.json(
        { success: false, error: "Coperta Vertex nu este disponibilă momentan." },
        { status: 503 }
      );
    }

    logTelemetry("pmm_story_cover_completed", {
      product: "story",
      result: "success",
      durationMs: Date.now() - startedAt,
      aiProvider: "vertex",
      model: generated.model,
    });

    return NextResponse.json({
      success: true,
      data: { imageDataUrl: generated.imageDataUrl, model: generated.model },
    });
  } catch (error) {
    console.error("Cover generation request failed", error);
    logTelemetry("pmm_story_cover_failed", {
      product: "story",
      result: "error",
      errorCode: "unknown",
      durationMs: Date.now() - startedAt,
      aiProvider: "vertex",
    });
    return NextResponse.json(
      { success: false, error: "Nu am putut regenera coperta acum." },
      { status: 500 }
    );
  }
}
