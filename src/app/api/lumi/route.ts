import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";

type LumiRole = "user" | "model";
type LumiMessage = { role: LumiRole; text: string };
type ProductId = "story" | "monster" | "emergency" | "none";

type Recommendation = {
  product: ProductId;
  theme: string;
  tone: string;
  lesson: string;
  storyDetail: string;
  monsterType: string;
  fearLocation: string;
  calmingHelper: string;
  bedtimeRitual: string;
  emergencyContext: string;
  interest: string;
  duration: string;
  activityMode: string;
  label: string;
};

const PRODUCT_IDS = new Set<ProductId>(["story", "monster", "emergency", "none"]);
const STORY_THEMES = ["space", "forest", "castle", "ocean", "dinosaurs", "clouds"] as const;
const STORY_TONES = ["Liniștită de somn", "Aventură blândă", "Amuzantă", "Emoțională și caldă"] as const;
const STORY_LESSONS = ["Curaj și încredere 💪", "Împărțitul jucăriilor 🧸", "Rutina de somn 🌙", "Importanța prieteniei 🤝", "Descoperirea naturii 🌱"] as const;
const MONSTER_TYPES = ["umbrele noptii", "monstrul de sub pat", "zgomotele ciudate", "dulapul scartaitor", "frica de intuneric", "vise urate"] as const;
const EMERGENCY_CONTEXTS = ["la restaurant, asteptand mancarea", "la un drum lung cu masina", "in sala de asteptare la doctor", "in casa, ploua afara", "in aeroport sau avion", "la coada sau institutii"] as const;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function looksLikeQuestion(value: string) {
  return /[?？]/.test(value) || /^(cum|ce|unde|cine|când|cand|care|cât|cat|câți|cati|vrei|este|are|spune-mi)\b/i.test(value.trim());
}

function sanitizeSuggestions(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const suggestions = value
    .map((item) => cleanText(item, 80))
    .filter((item) => item && !looksLikeQuestion(item))
    .slice(0, 2);
  return suggestions.length > 0 ? suggestions : fallback;
}

function isOneOf<T extends readonly string[]>(value: unknown, choices: T, fallback = "") {
  return typeof value === "string" && choices.includes(value as T[number]) ? value : fallback;
}

function readHistory(value: unknown): LumiMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-4).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const data = item as Record<string, unknown>;
    const role = data.role === "model" ? "model" : data.role === "user" ? "user" : null;
    const text = cleanText(data.text, 360);
    return role && text ? [{ role, text }] : [];
  });
}

function getVertexCredentials() {
  const encodedCredentials = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encodedCredentials) return undefined;
  return JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
}

function getModelCandidates() {
  return Array.from(new Set([
    process.env.VERTEX_AI_LUMI_MODEL,
    process.env.VERTEX_AI_MODEL,
    ...(process.env.VERTEX_AI_FALLBACK_MODELS || "").split(","),
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ].map((model) => model?.trim()).filter((model): model is string => Boolean(model))))
    .slice(0, readBoundedDuration(process.env.LUMI_AI_FALLBACK_MAX_MODELS, 2, 1, 3));
}

function emptyRecommendation(): Recommendation {
  return { product: "none", theme: "", tone: "", lesson: "", storyDetail: "", monsterType: "", fearLocation: "", calmingHelper: "", bedtimeRitual: "", emergencyContext: "", interest: "", duration: "", activityMode: "", label: "" };
}

function fallbackFor(message: string) {
  const text = message.toLocaleLowerCase("ro-RO");
  if (/(fric|întuneric|intuneric|coșmar|cosmar|sub pat|zgomot|somn)/.test(text)) {
    return {
      reply: "Începeți cu lumină blândă și trei respirații împreună. Scutul de Noapte transformă acest mic ritual într-un pas simplu, repetabil.",
      suggestions: ["O lumină mică", "O îmbrățișare"],
      recommendation: { ...emptyRecommendation(), product: "monster" as const, monsterType: /coșmar|cosmar|vis/.test(text) ? "vise urate" : "frica de intuneric", fearLocation: "camera copilului", calmingHelper: "o lumină de veghe sau o îmbrățișare", bedtimeRitual: "trei respirații lente înainte de somn", label: "Deschide Scutul de Noapte" },
    };
  }
  if (/(restaurant|drum|mașin|masin|doctor|aeroport|avion|coad|aștept|astept)/.test(text)) {
    return {
      reply: "Pentru așteptare, ajută o activitate care începe imediat. Trusa de Răbdare pregătește misiuni calme, potrivite locului în care sunteți.",
      suggestions: ["Suntem la restaurant", "Suntem în mașină"],
      recommendation: { ...emptyRecommendation(), product: "emergency" as const, emergencyContext: /restaurant/.test(text) ? "la restaurant, asteptand mancarea" : /doctor/.test(text) ? "in sala de asteptare la doctor" : /aeroport|avion/.test(text) ? "in aeroport sau avion" : /coad/.test(text) ? "la coada sau institutii" : "la un drum lung cu masina", duration: "10-20 minute", activityMode: "mix", label: "Deschide Trusa de Răbdare" },
    };
  }
  return {
    reply: "O poveste bună începe cu un lucru deja drag copilului. Ce lume i-ar plăcea să exploreze azi?",
    suggestions: ["Stele și planete", "Dinozauri"],
    recommendation: { ...emptyRecommendation(), product: "story" as const, theme: /stele|spațiu|spatiu|planet/.test(text) ? "space" : /dino/.test(text) ? "dinosaurs" : /mare|ocean/.test(text) ? "ocean" : "forest", tone: "Liniștită de somn", lesson: "Curaj și încredere 💪", label: "Deschide Povestea de Seară" },
  };
}

function parseJsonObject(value: string) {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("Lumi nu a trimis un răspuns complet.");
  return JSON.parse(trimmed.slice(first, last + 1)) as Record<string, unknown>;
}

function sanitizeResponse(value: Record<string, unknown>, fallback: ReturnType<typeof fallbackFor>) {
  const recommendation = value.recommendation && typeof value.recommendation === "object" ? value.recommendation as Record<string, unknown> : {};
  const requestedProduct = PRODUCT_IDS.has(recommendation.product as ProductId) ? recommendation.product as ProductId : fallback.recommendation.product;
  return {
    reply: cleanText(value.reply, 560) || fallback.reply,
    suggestions: sanitizeSuggestions(value.suggestions, fallback.suggestions),
    recommendation: {
      ...fallback.recommendation,
      product: requestedProduct,
      theme: isOneOf(recommendation.theme, STORY_THEMES, fallback.recommendation.theme),
      tone: isOneOf(recommendation.tone, STORY_TONES, fallback.recommendation.tone),
      lesson: isOneOf(recommendation.lesson, STORY_LESSONS, fallback.recommendation.lesson),
      storyDetail: cleanText(recommendation.storyDetail, 100) || fallback.recommendation.storyDetail,
      monsterType: isOneOf(recommendation.monsterType, MONSTER_TYPES, fallback.recommendation.monsterType),
      fearLocation: cleanText(recommendation.fearLocation, 80) || fallback.recommendation.fearLocation,
      calmingHelper: cleanText(recommendation.calmingHelper, 80) || fallback.recommendation.calmingHelper,
      bedtimeRitual: cleanText(recommendation.bedtimeRitual, 80) || fallback.recommendation.bedtimeRitual,
      emergencyContext: isOneOf(recommendation.emergencyContext, EMERGENCY_CONTEXTS, fallback.recommendation.emergencyContext),
      interest: cleanText(recommendation.interest, 80) || fallback.recommendation.interest,
      duration: ["5-10 minute", "10-20 minute", "20+ minute"].includes(String(recommendation.duration)) ? String(recommendation.duration) : fallback.recommendation.duration,
      activityMode: ["liniștite", "cu mișcare mică", "mix"].includes(String(recommendation.activityMode)) ? String(recommendation.activityMode) : fallback.recommendation.activityMode,
      label: cleanText(recommendation.label, 72) || fallback.recommendation.label,
    },
  };
}

function lumiPrompt(history: LumiMessage[], message: string) {
  const transcript = [...history, { role: "user" as const, text: message }].map((item) => `${item.role === "model" ? "Lumi" : "Părinte"}: ${item.text}`).join("\n");
  const firstParentMessage = !history.some((item) => item.role === "user");
  const responseLength = firstParentMessage
    ? "Este primul răspuns: maximum 35 de cuvinte. Spune întâi materialul recomandat și un singur motiv concret. Nu explica rutina în pași decât dacă părintele cere asta."
    : "Maximum 55 de cuvinte. Răspunde direct la întrebarea părintelui și oferă cel mult o idee practică.";
  return `Ești Lumi, ghidul cald și pragmatic pentru părinții de la Povestea Mea Magică. Răspunzi exclusiv în română. ${responseLength} Nu ești terapeut și nu ceri date sensibile. Ajută părintele să aleagă un singur material: Povestea de Seară, Scutul de Noapte sau Trusa de Răbdare. Fără limbaj publicitar.

Rolurile din conversație sunt obligatorii: doar liniile care încep cu „Părinte:” sunt mesaje ale părintelui. Nu răspunde niciodată la o întrebare pusă de Lumi ca și cum ar fi fost răspunsul părintelui. Nu inventa niciodată prenumele, vârsta sau preferințele copilului. Nu cere prenumele copilului: formularul îl va cere numai când părintele alege să creeze materialul.

„suggestions” sunt butoane pe care părintele le poate apăsa și care vor fi trimise literal ca următorul mesaj al Părintelui. Prin urmare, ele trebuie să fie doar răspunsuri sau opțiuni scurte, formulate la persoana părintelui, niciodată întrebări. Nu folosi semnul întrebării și nu începe cu „Cum”, „Ce”, „Unde”, „Cine”, „Când”, „Care”, „Vrei”, „Este” sau „Are”. Pune întrebarea necesară în „reply”, apoi oferă cel mult două răspunsuri posibile în „suggestions”. Exemplu bun: reply „Ce lume îl atrage azi?”, suggestions [„Stele și planete”, „Dinozauri”].

Răspunde numai cu JSON valid, fără Markdown:
{"reply":"text scurt; include aici o întrebare dacă mai ai nevoie de un detaliu","suggestions":["maximum două răspunsuri scurte, nu întrebări"],"recommendation":{"product":"story|monster|emergency|none","theme":"space|forest|castle|ocean|dinosaurs|clouds sau gol","tone":"Liniștită de somn|Aventură blândă|Amuzantă|Emoțională și caldă sau gol","lesson":"Curaj și încredere 💪|Împărțitul jucăriilor 🧸|Rutina de somn 🌙|Importanța prieteniei 🤝|Descoperirea naturii 🌱 sau gol","storyDetail":"","monsterType":"umbrele noptii|monstrul de sub pat|zgomotele ciudate|dulapul scartaitor|frica de intuneric|vise urate sau gol","fearLocation":"","calmingHelper":"","bedtimeRitual":"","emergencyContext":"la restaurant, asteptand mancarea|la un drum lung cu masina|in sala de asteptare la doctor|in casa, ploua afara|in aeroport sau avion|la coada sau institutii sau gol","interest":"","duration":"5-10 minute|10-20 minute|20+ minute sau gol","activityMode":"liniștite|cu mișcare mică|mix sau gol","label":"un CTA scurt"}}

Conversație:\n${transcript}`;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (requestExceedsBodyLimit(request, 8_000)) return NextResponse.json({ error: "Mesajul este prea lung." }, { status: 413 });
  const limit = checkRateLimit(request, "lumi", { windowMs: Number.parseInt(process.env.LUMI_RATE_LIMIT_WINDOW_MS || "3600000", 10) || 3_600_000, maxRequests: Number.parseInt(process.env.LUMI_RATE_LIMIT_MAX || "30", 10) || 30 });
  if (!limit.allowed) return NextResponse.json({ error: "Lumi se odihnește puțin. Încearcă din nou mai târziu." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const body = await request.json() as Record<string, unknown>;
    const message = cleanText(body.message, 500);
    if (!message) return NextResponse.json({ error: "Scrie un mesaj pentru Lumi." }, { status: 400 });
    const fallback = fallbackFor(message);
    const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
    if (!project) return NextResponse.json({ ...fallback, fallback: true });

    const client = new GoogleGenAI({ vertexai: true, project, location: process.env.VERTEX_AI_LOCATION?.trim() || "global", ...(getVertexCredentials() ? { googleAuthOptions: { credentials: getVertexCredentials() } } : {}) });
    const prompt = lumiPrompt(readHistory(body.history), message);
    const timeoutMs = readBoundedDuration(process.env.VERTEX_AI_LUMI_TIMEOUT_MS, 18_000, 5_000, 45_000);
    for (const model of getModelCandidates()) {
      try {
        const response = await withTimeout(client.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", maxOutputTokens: 260, thinkingConfig: { thinkingBudget: 0 }, temperature: 0.8 } }), timeoutMs, "Lumi a depășit timpul de răspuns.");
        const result = sanitizeResponse(parseJsonObject(response.text || ""), fallback);
        logTelemetry("pmm_lumi_response", { result: "success", durationMs: Date.now() - startedAt, aiProvider: "vertex", model });
        return NextResponse.json(result);
      } catch {
        // A conversational helper should never interrupt the product flow because one model is busy.
      }
    }
    logTelemetry("pmm_lumi_response", { result: "success", generationMode: "fallback", durationMs: Date.now() - startedAt, aiProvider: "vertex" });
    return NextResponse.json({ ...fallback, fallback: true });
  } catch {
    logTelemetry("pmm_lumi_response_failed", { result: "error", durationMs: Date.now() - startedAt, errorCode: "unknown", aiProvider: "vertex" });
    return NextResponse.json({ ...fallbackFor("poveste"), fallback: true });
  }
}
