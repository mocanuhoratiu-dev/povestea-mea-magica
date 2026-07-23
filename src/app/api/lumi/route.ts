import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";

type LumiRole = "user" | "model";
type LumiMessage = { role: LumiRole; text: string };

const PRODUCT_IDS = ["story", "monster", "emergency"] as const;
const STORY_THEMES = ["space", "forest", "castle", "ocean", "dinosaurs", "clouds"] as const;
const STORY_TONES = ["Liniștită de somn", "Aventură blândă", "Amuzantă", "Emoțională și caldă"] as const;
const STORY_LESSONS = ["Curaj și încredere 💪", "Împărțitul jucăriilor 🧸", "Rutina de somn 🌙", "Importanța prieteniei 🤝", "Descoperirea naturii 🌱"] as const;
const MONSTER_TYPES = ["umbrele noptii", "monstrul de sub pat", "zgomotele ciudate", "dulapul scartaitor", "frica de intuneric", "vise urate"] as const;
const EMERGENCY_CONTEXTS = ["la restaurant, asteptand mancarea", "la un drum lung cu masina", "in sala de asteptare la doctor", "in casa, ploua afara", "in aeroport sau avion", "la coada sau institutii"] as const;
const EMERGENCY_DURATIONS = ["5-10 minute", "10-20 minute", "20+ minute"] as const;
const EMERGENCY_ACTIVITY_MODES = ["liniștite", "cu mișcare mică", "mix"] as const;

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
      required: ["product", "theme", "tone", "lesson", "storyDetail", "monsterType", "fearLocation", "calmingHelper", "bedtimeRitual", "emergencyContext", "interest", "duration", "activityMode", "label"],
      properties: {
        product: { type: "string", enum: [...PRODUCT_IDS, "none"] },
        theme: { type: "string", enum: [...STORY_THEMES, "none"] },
        tone: { type: "string", enum: [...STORY_TONES, "none"] },
        lesson: { type: "string", enum: [...STORY_LESSONS, "none"] },
        storyDetail: { type: "string" },
        monsterType: { type: "string", enum: [...MONSTER_TYPES, "none"] },
        fearLocation: { type: "string" },
        calmingHelper: { type: "string" },
        bedtimeRitual: { type: "string" },
        emergencyContext: { type: "string", enum: [...EMERGENCY_CONTEXTS, "none"] },
        interest: { type: "string" },
        duration: { type: "string", enum: [...EMERGENCY_DURATIONS, "none"] },
        activityMode: { type: "string", enum: [...EMERGENCY_ACTIVITY_MODES, "none"] },
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
- Răspunsul are maximum 52 de cuvinte, într-un singur paragraf scurt.
- Pune o singură întrebare de clarificare doar când chiar schimbă recomandarea.
- Nu pretinde că ești terapeut, medic sau educator acreditat. Pentru emoții puternice sau probleme de sănătate, îndrumă blând părintele către un specialist.
- Nu cere nume complet, adresă, fotografie, date de contact sau alte date sensibile despre copil.
- Nu inventa prețuri, garanții sau funcții care nu există.
- Recomandarea este opțională. Setează toate câmpurile nefolosite la "none" sau șir gol. Nu inventa detalii despre familie: completezi câmpurile de material doar când sunt susținute direct de conversație. Nu folosi un nume din conversație în câmpurile de material.
- Când recomanzi "Povestea de Seară", poți seta theme, tone, lesson și storyDetail. Când recomanzi "Scutul de Noapte", poți seta monsterType, fearLocation, calmingHelper și bedtimeRitual. Când recomanzi "Trusa de Răbdare", poți seta emergencyContext, interest, duration și activityMode. Label-ul spune concis ce va fi aplicat în formular.
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
        maxOutputTokens: 260,
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
    const lesson = STORY_LESSONS.includes(recommendation.lesson as (typeof STORY_LESSONS)[number]) ? recommendation.lesson : "none";
    const monsterType = MONSTER_TYPES.includes(recommendation.monsterType as (typeof MONSTER_TYPES)[number]) ? recommendation.monsterType : "none";
    const emergencyContext = EMERGENCY_CONTEXTS.includes(recommendation.emergencyContext as (typeof EMERGENCY_CONTEXTS)[number]) ? recommendation.emergencyContext : "none";
    const duration = EMERGENCY_DURATIONS.includes(recommendation.duration as (typeof EMERGENCY_DURATIONS)[number]) ? recommendation.duration : "none";
    const activityMode = EMERGENCY_ACTIVITY_MODES.includes(recommendation.activityMode as (typeof EMERGENCY_ACTIVITY_MODES)[number]) ? recommendation.activityMode : "none";

    logTelemetry("pmm_lumi_response", { result: "success", durationMs: Date.now() - startedAt, aiProvider: "vertex", model });

    return NextResponse.json({
      reply: cleanText(parsed.reply, 420) || "Lanterna mea caută încă firul potrivit. Mai spune-mi puțin despre momentul vostru.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((item) => cleanText(item, 90)).filter(Boolean).slice(0, 3) : [],
      recommendation: {
        product,
        theme,
        tone,
        lesson,
        storyDetail: cleanText(recommendation.storyDetail, 100),
        monsterType,
        fearLocation: cleanText(recommendation.fearLocation, 80),
        calmingHelper: cleanText(recommendation.calmingHelper, 80),
        bedtimeRitual: cleanText(recommendation.bedtimeRitual, 80),
        emergencyContext,
        interest: cleanText(recommendation.interest, 80),
        duration,
        activityMode,
        label: product === "none" ? "" : cleanText(recommendation.label, 80),
      },
    });
  } catch (error) {
    console.error("Lumi Vertex AI error:", error);
    logTelemetry("pmm_lumi_response_failed", { result: "error", durationMs: Date.now() - startedAt, errorCode: "ai_error", aiProvider: "vertex" });
    return NextResponse.json({ error: "Lumi nu poate aprinde Lanterna chiar acum. Încearcă din nou în câteva clipe." }, { status: 503 });
  }
}
