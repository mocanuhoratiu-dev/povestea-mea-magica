import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";

type LumiRole = "user" | "model";
type LumiMessage = { role: LumiRole; text: string };

const PRODUCT_IDS = ["story", "monster", "emergency"] as const;
const STORY_THEMES = ["space", "forest", "castle", "ocean", "dinosaurs", "clouds"] as const;
const STORY_TONES = ["Liniștită de somn", "Aventură blândă", "Amuzantă", "Emoțională și caldă"] as const;

const LUMI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "suggestions", "recommendation"],
  properties: {
    reply: { type: "string" },
    suggestions: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: { type: "string" },
    },
    recommendation: {
      type: "object",
      additionalProperties: false,
      required: ["product", "theme", "tone", "label"],
      properties: {
        product: { type: "string", enum: [...PRODUCT_IDS, "none"] },
        theme: { type: "string", enum: [...STORY_THEMES, "none"] },
        tone: { type: "string", enum: [...STORY_TONES, "none"] },
        label: { type: "string" },
      },
    },
  },
} as const;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function readHistory(value: unknown): LumiMessage[] {
  if (!Array.isArray(value)) return [];

  return value.slice(-6).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const data = item as Record<string, unknown>;
    const role = data.role === "model" ? "model" : data.role === "user" ? "user" : null;
    const text = cleanText(data.text, 500);
    return role && text ? [{ role, text }] : [];
  });
}

function getVertexCredentials() {
  const encodedCredentials = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encodedCredentials) return undefined;

  try {
    return JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
  } catch {
    throw new Error("Configurarea de autentificare Vertex AI este invalidă.");
  }
}

function lumiPrompt(history: LumiMessage[], message: string) {
  const transcript = [...history, { role: "user" as const, text: message }]
    .map((item) => `${item.role === "model" ? "Lumi" : "Părinte"}: ${item.text}`)
    .join("\n");

  return `Ești Lumi, păzitoarea Lanternei de la Povestea Mea Magică, un ghid AI pentru PĂRINȚI.

Vocea ta este caldă, imaginativă și precisă. Începe de preferat cu o imagine concretă legată de situația părintelui (de exemplu, o scoică ce păstrează liniștea serii), nu cu formulări publicitare. Alege un singur detaliu senzorial, un verb viu și o idee practică. Evită clișee precum „aripile viselor”, „o cale minunată”, „aventură magică” și excesul de diminutive. Răspunzi exclusiv în română. Ajută părintele să aleagă între produsele cu denumirile exacte: „Povestea de Seară”, „Scutul de Noapte” și „Trusa de Răbdare”. Pentru povești poți propune o lume și un ton din opțiunile disponibile.

Reguli ferme:
- Răspunsul are maximum 85 de cuvinte și maximum două paragrafe scurte.
- Pune o singură întrebare de clarificare doar când chiar schimbă recomandarea.
- Nu pretinde că ești terapeut, medic sau educator acreditat. Pentru emoții puternice sau probleme de sănătate, îndrumă blând părintele către un specialist.
- Nu cere nume complet, adresă, fotografie, date de contact sau alte date sensibile despre copil.
- Nu inventa prețuri, garanții sau funcții care nu există.
- Recomandarea este opțională. Setează product/theme/tone la "none" când nu există o alegere sigură; label devine șir gol.
- Sugestiile sunt maximum 3 întrebări scurte ori direcții de continuare, nu propoziții lungi.

Conversația de până acum:
${transcript}`;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    if (requestExceedsBodyLimit(request, 8_000)) {
      return NextResponse.json({ error: "Mesajul pentru Lumi este prea lung." }, { status: 413 });
    }

    const limit = checkRateLimit(request, "lumi", {
      windowMs: Number.parseInt(process.env.LUMI_RATE_LIMIT_WINDOW_MS || "3600000", 10) || 3_600_000,
      maxRequests: Number.parseInt(process.env.LUMI_RATE_LIMIT_MAX || "30", 10) || 30,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Lanterna lui Lumi se odihnește puțin. Încearcă din nou mai târziu." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const message = cleanText(body.message, 500);
    const history = readHistory(body.history);
    if (!message) {
      return NextResponse.json({ error: "Scrie un mesaj pentru Lumi." }, { status: 400 });
    }

    const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
    if (!project) {
      return NextResponse.json({ error: "Lumi nu este configurată încă." }, { status: 503 });
    }

    const credentials = getVertexCredentials();
    const client = new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.VERTEX_AI_LOCATION?.trim() || "global",
      ...(credentials ? { googleAuthOptions: { credentials } } : {}),
    });
    const model = process.env.VERTEX_AI_LUMI_MODEL?.trim() || process.env.VERTEX_AI_MODEL?.trim() || "gemini-2.5-flash";
    const response = await client.models.generateContent({
      model,
      contents: lumiPrompt(history, message),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: LUMI_RESPONSE_SCHEMA,
        maxOutputTokens: 320,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.95,
      },
    });

    const rawResponse = response.text?.trim();
    if (!rawResponse) throw new Error("Lumi nu a găsit încă un răspuns.");

    const parsed = JSON.parse(rawResponse) as {
      reply?: unknown;
      suggestions?: unknown;
      recommendation?: Record<string, unknown>;
    };
    const recommendation = parsed.recommendation || {};
    const product = PRODUCT_IDS.includes(recommendation.product as (typeof PRODUCT_IDS)[number]) ? recommendation.product : "none";
    const theme = STORY_THEMES.includes(recommendation.theme as (typeof STORY_THEMES)[number]) ? recommendation.theme : "none";
    const tone = STORY_TONES.includes(recommendation.tone as (typeof STORY_TONES)[number]) ? recommendation.tone : "none";

    logTelemetry("pmm_lumi_response", { result: "success", durationMs: Date.now() - startedAt, aiProvider: "vertex", model });

    return NextResponse.json({
      reply: cleanText(parsed.reply, 700) || "Lanterna mea caută încă firul potrivit. Mai spune-mi puțin despre momentul vostru.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((item) => cleanText(item, 90)).filter(Boolean).slice(0, 3) : [],
      recommendation: {
        product,
        theme,
        tone,
        label: product === "none" ? "" : cleanText(recommendation.label, 80),
      },
    });
  } catch (error) {
    console.error("Lumi Vertex AI error:", error);
    logTelemetry("pmm_lumi_response_failed", { result: "error", durationMs: Date.now() - startedAt, errorCode: "ai_error", aiProvider: "vertex" });
    return NextResponse.json({ error: "Lumi nu poate aprinde Lanterna chiar acum. Încearcă din nou în câteva clipe." }, { status: 503 });
  }
}
