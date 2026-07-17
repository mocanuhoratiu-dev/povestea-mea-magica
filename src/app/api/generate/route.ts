import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import https from "node:https";

type GenerateRequest = {
  type?: "monster" | "story" | "emergency";
  name?: string;
  age?: string;
  theme?: string;
  lesson?: string;
  monster?: string;
  context?: string;
  tone?: string;
  themeDetail?: string;
  lessonDetail?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GeminiTextResult = { text: string; model: string; error?: never } | { text?: never; model?: never; error: string };

type StoryPromptConfig = {
  prompt: string;
  wordTarget: string;
  maxOutputTokens: number;
};

type AiProvider = "gemini" | "vertex";

function getAiProvider(): AiProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "vertex" ? "vertex" : "gemini";
}

function getVertexCredentials() {
  const encodedCredentials = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encodedCredentials) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
  } catch {
    throw new Error("VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64 nu conține un JSON Base64 valid.");
  }
}

function isAiConfigured() {
  if (getAiProvider() === "vertex") {
    return Boolean(process.env.VERTEX_AI_PROJECT_ID?.trim());
  }

  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function stripHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?em[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeEmHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<em[^>]*>/gi, "[[EM]]")
    .replace(/<\/em>/gi, "[[/EM]]")
    .replace(/<[^>]*>/g, "")
    .replace(/\[\[EM\]\]/g, "<em>")
    .replace(/\[\[\/EM\]\]/g, "</em>")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRomanianText(value: string): string {
  return value
    .replace(/\bUrsii\b/g, "Urșii")
    .replace(/\bursii\b/g, "urșii")
    .replace(/\bPestii\b/g, "Peștii")
    .replace(/\bpestii\b/g, "peștii")
    .replace(/\bsosea\b/g, "șosea")
    .replace(/\bconteaza\b/g, "contează")
    .replace(/\bcasutele\b/g, "căsuțele")
    .replace(/\bmasina\b/g, "mașina")
    .replace(/\bmancarea\b/g, "mâncarea");
}

function removeDecorativeEmoji(value: string): string {
  return value
    .replace(/[\uFE0E\uFE0F]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeLeadingChildReference(value: string, name: string): string {
  const escapedName = escapeRegExp(name);
  return value
    .replace(new RegExp(`^${escapedName}\\s+(iubește|adora|îi plac|ii plac|are|vrea|prinde|învață|invata)\\s+`, "i"), "")
    .replace(new RegExp(`^${escapedName}\\s+`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeStoryText(value: unknown): string {
  return normalizeRomanianText(
    String(value ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function sanitizeStoryPayload(value: unknown, fallbackName: string, themeLabel: string) {
  const story = value as {
    title?: unknown;
    text?: unknown;
    imagePrompt?: unknown;
  };
  const name = stripHtml(fallbackName) || "Eroul";
  const title = stripHtml(story.title) || `Povestea lui ${name}`;
  const text = sanitizeStoryText(story.text);
  const imagePrompt = stripHtml(story.imagePrompt) ||
    `warm square children's book cover illustration of ${name} inside a ${themeLabel} world, based on the bedtime story, soft magical light, expressive friendly character, watercolor and gouache texture, no text`;

  return { title, text, imagePrompt };
}

function parseJsonObject(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Nu am găsit un obiect JSON în răspunsul AI.");
    }
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Some otherwise-valid model responses contain literal paragraph breaks in a JSON string.
      // JSON requires those characters to be escaped, so normalize them before the final parse.
      let repaired = "";
      let insideString = false;
      let escaped = false;

      for (const character of candidate) {
        if (escaped) {
          repaired += character;
          escaped = false;
          continue;
        }
        if (character === "\\") {
          repaired += character;
          escaped = true;
          continue;
        }
        if (character === '"') {
          insideString = !insideString;
          repaired += character;
          continue;
        }
        if (insideString && character === "\n") {
          repaired += "\\n";
          continue;
        }
        if (insideString && character === "\r") {
          repaired += "\\r";
          continue;
        }
        if (insideString && character === "\t") {
          repaired += "\\t";
          continue;
        }
        repaired += character;
      }

      return JSON.parse(repaired.replace(/,(\s*[}\]])/g, "$1"));
    }
  }
}

function buildStableStoryPayload(data: GenerateRequest, themeLabel: string) {
  const name = stripHtml(data.name) || "Eroul";
  const age = stripHtml(data.age) || "4";
  const lesson = removeDecorativeEmoji(stripHtml(data.lesson)) || "curaj și încredere";
  const worldDetail = stripHtml(data.themeDetail) || `o lume ${themeLabel.toLocaleLowerCase("ro-RO")} plină de lumină blândă`;
  const lessonDetail = stripHtml(data.lessonDetail) || "lecția apare printr-o alegere mică, făcută cu răbdare";
  const childDetails = removeLeadingChildReference(stripHtml(data.context), name);
  const cleanLessonDetail = removeLeadingChildReference(lessonDetail, name);
  const personalToken = childDetails
    ? `Pe marginea potecii au apărut semne care păreau alese special pentru ${name}: ${childDetails}.`
    : `Pe marginea potecii au apărut semne mici, ca niște indicii pregătite anume pentru ${name}.`;
  const lessonChoice = data.lessonDetail
    ? `${name} și-a amintit ce avea de încercat: ${cleanLessonDetail}.`
    : `${name} a înțeles că ${lesson.toLocaleLowerCase("ro-RO")} începe cu un pas mic și sincer.`;
  const title = `${name} și Lumina din ${themeLabel}`;

  const text = [
    `În seara aceea, ${name}, care avea ${age} ani, a găsit pe pernă o luminiță cât un nasture. Nu pâlpâia ca o lampă și nici nu stătea locului ca o stea. Se mișca încet, ca și cum ar fi vrut să arate drumul către ${worldDetail}. Când ${name} a atins-o cu vârful degetului, camera s-a umplut de o lumină caldă, iar podeaua s-a transformat într-o potecă nouă.`,
    `${name} a pășit cu grijă. Lumea de dincolo mirosea a seară bună și a aventură blândă. ${personalToken} În depărtare, o lumină mare, rotundă, tremura prinsă într-un felinar închis. Fără ea, visele bune nu mai știau drumul spre copii.`,
    `Lângă felinar stătea un paznic mic, cu o cheie prea grea pentru buzunarul lui. „Felinarul se deschide doar când cineva învață ${lesson.toLocaleLowerCase("ro-RO")} printr-o faptă adevărată”, a spus el. ${name} s-a uitat la cheie. Nu părea o misiune de forță, ci una în care trebuia să asculți ce simți și să alegi cu grijă.`,
    `Drumul până la felinar trecea peste un pod subțire. Podul scârțâia ușor și se legăna ca o panglică în vânt. ${name} a simțit un nod mic în burtică. În loc să fugă, s-a oprit, a respirat încet și a spus cu voce joasă: „Am emoții, dar pot încerca pas cu pas.” Atunci prima scândură s-a aprins sub tălpi.`,
    `La mijlocul podului, luminița de pe pernă s-a schimbat într-o busolă mică. ${lessonChoice} A cerut ajutor paznicului, care a ținut capătul podului, iar ${name} a continuat. Cu fiecare pas, podul devenea mai sigur, ca și cum ar fi prins încredere odată cu copilul care mergea pe el.`,
    `Când a ajuns la felinar, cheia nu mai părea grea. ${name} a pus-o în încuietoare și a rostit încet: „Pot să fiu curajos/curajoasă în felul meu.” Felinarul s-a deschis, iar lumina lui a alergat prin ${themeLabel.toLocaleLowerCase("ro-RO")}, aprinzând potecile, frunzele, ferestrele și toate colțurile care așteptau un vis bun.`,
    `În clipa următoare, ${name} era din nou în pat. Pe pernă nu mai era luminița, dar în piept rămăsese o căldură mică și sigură. Camera era liniștită, noaptea era prietenoasă, iar ${name} știa că, ori de câte ori va avea emoții, poate începe cu un pas mic, o vorbă sinceră și puțin curaj.`,
  ].join("\n\n");

  return {
    title,
    text: normalizeRomanianText(text),
    imagePrompt: `English prompt: square children's book cover of ${name}, age ${age}, holding a tiny warm light on a path through ${themeLabel}, include ${childDetails || worldDetail}, gentle bedtime adventure about ${lesson}, premium watercolor and gouache, soft bedtime light, no text`,
    fallback: true,
    note: `Am folosit varianta stabilă pentru că serviciul AI este temporar aglomerat. Textul poate fi editat înainte de PDF.`,
  };
}

function cleanPromptValue(value: unknown, fallback = "") {
  return stripHtml(value).slice(0, 180) || fallback;
}

function getStoryLengthConfig(age: string | undefined) {
  const ageNumber = Number.parseInt(age || "", 10) || 4;
  if (ageNumber <= 3) {
    return { wordTarget: "520-680", paragraphTarget: "6-7", maxOutputTokens: 1400 };
  }
  if (ageNumber <= 6) {
    return { wordTarget: "650-820", paragraphTarget: "7-8", maxOutputTokens: 1700 };
  }
  return { wordTarget: "760-950", paragraphTarget: "8-9", maxOutputTokens: 2100 };
}

function buildStoryPrompt(data: GenerateRequest, themeLabel: string): StoryPromptConfig {
  const name = cleanPromptValue(data.name, "Eroul");
  const age = cleanPromptValue(data.age, "4");
  const lesson = cleanPromptValue(data.lesson, "Curaj și încredere");
  const tone = cleanPromptValue(data.tone, "Liniștită de somn");
  const worldDetail = cleanPromptValue(data.themeDetail);
  const lessonDetail = cleanPromptValue(data.lessonDetail);
  const childDetails = cleanPromptValue(data.context);
  const { wordTarget, paragraphTarget, maxOutputTokens } = getStoryLengthConfig(age);

  const requiredDetails = [
    `numele copilului: ${name}`,
    `vârsta: ${age} ani`,
    `lumea aleasă: ${themeLabel}`,
    `lecția: ${lesson}`,
    worldDetail ? `detaliu de lume: ${worldDetail}` : "",
    lessonDetail ? `cum apare lecția: ${lessonDetail}` : "",
    childDetails ? `detalii despre copil: ${childDetails}` : "",
  ].filter(Boolean);

  const prompt = `Scrie o poveste premium, personalizată, pentru un copil.

CONTEXT OBLIGATORIU:
${requiredDetails.map((detail, index) => `${index + 1}. ${detail}`).join("\n")}

STIL:
- Limba: română naturală, caldă, fără romgleză.
- Ton: ${tone}.
- Potrivită pentru ${age} ani: propoziții clare, imagini concrete, emoții blânde.
- Fără violență, sarcasm, sperieturi intense, morală ținută ca discurs, markdown sau emoji.

REGULI DE PERSONALIZARE:
- ${name} este protagonistul/protagonista activ(ă), nu doar un nume lipit în text.
- Folosește numele "${name}" în titlu, în prima propoziție și apoi natural de 5-8 ori.
- Dacă există detalii despre copil, transformă cel puțin unul într-un obiect, gest, prieten sau indiciu important din poveste.
- Dacă există detalii despre lume, ele trebuie să schimbe decorul și soluția, nu să apară doar într-o frază decorativă.
- Lecția "${lesson}" trebuie învățată printr-o alegere concretă făcută de ${name}, nu explicată de narator.
- Povestea trebuie să aibă început, problemă mică, încercare, alegere, rezolvare și final liniștitor de seară.

STRUCTURĂ:
- ${wordTarget} de cuvinte.
- ${paragraphTarget} paragrafe separate prin două newline-uri.
- Fiecare paragraf trebuie să avanseze acțiunea.
- Nu inventa detalii personale sensibile. Nu inventa frați, boli, școală sau părinți dacă nu au fost menționați.

Returnează DOAR JSON valid, fără \`\`\`json și fără text înainte/după:
{
  "title": "titlu scurt în română, cu numele copilului",
  "text": "povestea completă, cu paragrafe separate prin două newline-uri",
  "imagePrompt": "English prompt for one square children's book cover showing the main scene from this exact story, including the child protagonist, the chosen world, one meaningful personalized detail if provided, premium watercolor and gouache, soft bedtime light, no text"
}`;

  return { prompt, wordTarget, maxOutputTokens };
}

function sanitizeMonsterKit(value: unknown) {
  const kit = value as {
    body?: unknown;
    ingredients?: Array<{ num?: unknown; icon?: unknown; name?: unknown; detail?: unknown }>;
    steps?: Array<{ roman?: unknown; l1?: unknown; l2?: unknown }>;
    spell?: unknown;
  };

  return {
    body: sanitizeEmHtml(kit.body),
    ingredients: Array.isArray(kit.ingredients)
      ? kit.ingredients.slice(0, 4).map((ingredient, index) => ({
          num: stripHtml(ingredient.num) || String(index + 1),
          icon: stripHtml(ingredient.icon),
          name: stripHtml(ingredient.name),
          detail: stripHtml(ingredient.detail),
        }))
      : [],
    steps: Array.isArray(kit.steps)
      ? kit.steps.slice(0, 3).map((step, index) => ({
          roman: stripHtml(step.roman) || ["I", "II", "III"][index] || String(index + 1),
          l1: stripHtml(step.l1),
          l2: stripHtml(step.l2),
        }))
      : [],
    spell: stripHtml(kit.spell),
  };
}

function sanitizeEmergencyKit(value: unknown) {
  const kit = value as {
    radar?: unknown[];
    riddle?: unknown;
    drawing?: unknown;
    patience?: unknown;
    story_starters?: unknown[];
    true_or_false?: Array<{ q?: unknown; a?: unknown }>;
  };

  return {
    radar: Array.isArray(kit.radar)
      ? kit.radar.slice(0, 4).map((item) => normalizeRomanianText(stripHtml(item)))
      : [],
    riddle: normalizeRomanianText(stripHtml(kit.riddle)),
    drawing: normalizeRomanianText(stripHtml(kit.drawing)),
    patience: normalizeRomanianText(stripHtml(kit.patience)),
    story_starters: Array.isArray(kit.story_starters)
      ? kit.story_starters.slice(0, 3).map((item) => normalizeRomanianText(stripHtml(item)))
      : [],
    true_or_false: Array.isArray(kit.true_or_false)
      ? kit.true_or_false.slice(0, 3).map((item) => ({
          q: normalizeRomanianText(stripHtml(item.q)),
          a: normalizeRomanianText(stripHtml(item.a)),
        }))
      : [],
  };
}

async function generateGeminiText({
  apiKey,
  prompt,
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  responseMimeType,
  maxOutputTokens,
  temperature = 0.8,
}: {
  apiKey: string;
  prompt: string;
  model?: string;
  responseMimeType?: "application/json";
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<GeminiTextResult> {
  const generationConfig = {
    ...(responseMimeType ? { responseMimeType } : {}),
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
    temperature,
  };
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  });

  const { statusCode, responseBody, requestError } = await new Promise<{
    statusCode: number;
    responseBody: string;
    requestError?: string;
  }>(
    (resolve) => {
      const request = https.request(
        {
          hostname: "generativelanguage.googleapis.com",
          path: `/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            "x-goog-api-key": apiKey,
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 500,
              responseBody: Buffer.concat(chunks).toString("utf8"),
            });
          });
        }
      );

      request.on("error", (error) => {
        resolve({ statusCode: 500, responseBody: "", requestError: error.message });
      });
      request.setTimeout(30000, () => {
        request.destroy(new Error(`Modelul ${model} a depășit timpul de răspuns.`));
      });
      request.write(body);
      request.end();
    }
  );

  if (requestError) {
    return { error: requestError };
  }

  let payload: GeminiResponse;
  try {
    payload = JSON.parse(responseBody || "{}") as GeminiResponse;
  } catch {
    return { error: "Gemini API nu a returnat JSON valid." };
  }

  if (statusCode < 200 || statusCode >= 300) {
    return { error: payload.error?.message || `Gemini API a returnat o eroare pentru ${model}.` };
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    return { error: `Gemini nu a returnat conținut pentru această cerere (${model}).` };
  }

  return { text, model };
}

async function generateVertexText({
  prompt,
  model = process.env.VERTEX_AI_MODEL || "gemini-2.5-flash",
  responseMimeType,
  maxOutputTokens,
  temperature = 0.8,
}: Omit<Parameters<typeof generateGeminiText>[0], "apiKey">): Promise<GeminiTextResult> {
  const project = process.env.VERTEX_AI_PROJECT_ID?.trim();
  if (!project) {
    return { error: "VERTEX_AI_PROJECT_ID lipsește din configurare." };
  }

  try {
    const credentials = getVertexCredentials();
    const client = new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.VERTEX_AI_LOCATION?.trim() || "global",
      ...(credentials ? { googleAuthOptions: { credentials } } : {}),
    });
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...(responseMimeType ? { responseMimeType } : {}),
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
        temperature,
      },
    });
    const text = response.text?.trim();
    if (!text) {
      return { error: `Vertex AI nu a returnat conținut pentru această cerere (${model}).` };
    }

    return { text, model };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Vertex AI nu a putut genera conținut." };
  }
}

async function generateAiText({
  prompt,
  model,
  responseMimeType,
  maxOutputTokens,
  temperature,
}: Omit<Parameters<typeof generateGeminiText>[0], "apiKey">): Promise<GeminiTextResult> {
  if (getAiProvider() === "vertex") {
    return generateVertexText({ prompt, model, responseMimeType, maxOutputTokens, temperature });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY lipsește din configurare." };
  }

  return generateGeminiText({ apiKey, prompt, model, responseMimeType, maxOutputTokens, temperature });
}

function getGeminiModelCandidates() {
  const isVertex = getAiProvider() === "vertex";
  const configuredModels = [
    isVertex ? process.env.VERTEX_AI_MODEL : process.env.GEMINI_MODEL,
    ...((isVertex ? process.env.VERTEX_AI_FALLBACK_MODELS : process.env.GEMINI_FALLBACK_MODELS) || "").split(","),
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];

  return Array.from(
    new Set(
      configuredModels
        .map((model) => model?.trim())
        .filter((model): model is string => Boolean(model))
    )
  );
}

async function generateStoryWithModelFallback({
  prompt,
  maxOutputTokens,
}: {
  prompt: string;
  maxOutputTokens: number;
}): Promise<GeminiTextResult> {
  const errors: string[] = [];

  for (const model of getGeminiModelCandidates()) {
    const generated = await generateAiText({
      prompt,
      model,
      responseMimeType: "application/json",
      maxOutputTokens,
      temperature: 0.75,
    });

    if (!("error" in generated)) {
      return generated;
    }

    errors.push(`${model}: ${generated.error}`);
  }

  return { error: errors.join(" | ") || "Gemini nu a răspuns cu niciun model disponibil." };
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as GenerateRequest;
    if (!isAiConfigured()) {
      if (data.type === "story") {
        const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
        return NextResponse.json({ success: true, data: buildStableStoryPayload(data, themeLabel) });
      }

      return NextResponse.json(
        {
          success: false,
          error: getAiProvider() === "vertex"
            ? "VERTEX_AI_PROJECT_ID lipsește din .env.local."
            : "GEMINI_API_KEY lipsește din .env.local.",
        },
        { status: 500 }
      );
    }

    if (data.type === "monster") {
      const prompt = `Ești reprezentantul Ministerului Protecției Magice. 
      Sarcina ta: Inventează o rețetă magică amuzantă și un descântec pentru a alunga monstrul/frica de: "${data.monster}" din camera eroului/eroinei: "${data.name}".
      REGULĂ CRITICĂ: Părintele va prepara fizic această rețetă într-o STICLĂ CU PULVERIZATOR (spray). Prin urmare, ingredientele trebuie să fie DOAR LICHIDE SAU PULBERI INOFENSIVE care se găsesc în bucătărie și pot fi amestecate cu apă (ex: apă de la robinet, 2 picături de zeamă de lămâie, un praf de sare, un praf de scorțișoară, o picătură de colorant alimentar, puțin zahăr). NU folosi obiecte solide (cum ar fi perne, șosete, jucării).
      Tu le vei da o denumire magică în câmpul "detail".
      Returnează răspunsul în format JSON STRICT. Nu adăuga block-uri markdown de tip \`\`\`json.
      Format JSON necesar:
      {
        "body": "podeaua acestei camere este protejată de... (poți folosi doar tag-uri HTML <em> pentru 1-2 accente scurte)",
        "ingredients": [ 
          { "num": "1", "icon": "emoji", "name": "nume comun obiect (ex: Apa)", "detail": "denumire magică (ex: Lacrimi de dragon)" },
          { "num": "2", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" },
          { "num": "3", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" }
        ],
        "steps": [ 
          { "roman": "I", "l1": "pasul 1 linia 1 (1/2 propoziție, FĂRĂ tag-uri HTML)", "l2": "pasul 1 linia 2 (continuare, FĂRĂ tag-uri HTML)" }, 
          { "roman": "II", "l1": "pasul 2 linia 1", "l2": "pasul 2 linia 2" } 
        ],
        "spell": "Un descântec vesel și magic în RIME PERFECTE (format AABB), compus din exact 4 versuri scurte, fără HTML. TREBUIE să includă numele copilului și să alunge monstrul/frica respectivă."
      }`;

      const generated = await generateAiText({
        prompt,
        responseMimeType: "application/json",
      });
      if ("error" in generated) {
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const result = sanitizeMonsterKit(parseJsonObject(generated.text));

      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
      const { prompt, maxOutputTokens } = buildStoryPrompt(data, themeLabel);

      const generated = await generateStoryWithModelFallback({
        prompt,
        maxOutputTokens,
      });
      if ("error" in generated) {
        return NextResponse.json({
          success: true,
          data: buildStableStoryPayload(data, themeLabel),
          warning: generated.error,
        });
      }
      let result: ReturnType<typeof sanitizeStoryPayload>;
      try {
        result = sanitizeStoryPayload(parseJsonObject(generated.text), data.name || "Eroul", themeLabel);
      } catch {
        return NextResponse.json({
          success: true,
          data: buildStableStoryPayload(data, themeLabel),
          warning: "Răspunsul AI nu a putut fi citit ca JSON.",
        });
      }

      return NextResponse.json({ success: true, data: { ...result, model: generated.model } });
    }

    if (data.type === "emergency") {
      const prompt = `Ești un educator creativ și asistent pentru părinți.
      Sarcina ta: Generează un "Kit de Urgență" pentru copilul ${data.name} (vârsta: ${data.age} ani) care se află în situația: "${data.context}".
      Trebuie să oferi 6 secțiuni adaptate STRICT la restricțiile locației și la vârsta copilului.
      Returnează răspunsul în format JSON STRICT. Nu adăuga block-uri markdown de tip \`\`\`json.
      Format JSON necesar:
      {
        "radar": [
          "1. ceva specific locației de găsit cu privirea (ex: o mașină roșie / un om cu ochelari)",
          "2. altceva de căutat vizual",
          "3. altceva de căutat vizual",
          "4. altceva de căutat vizual"
        ],
        "riddle": "O ghicitoare scurtă și amuzantă, în rime (2-4 versuri), legată de locația respectivă.",
        "drawing": "O provocare creativă și amuzantă de desen legată de situație.",
        "patience": "Un mini-joc de răbdare/respirație potrivit pentru acel loc.",
        "story_starters": [
          "Odată, un dragon a intrat în... (continuă tu!)",
          "Alt început de poveste amuzant #2...",
          "Alt început de poveste amuzant #3..."
        ],
        "true_or_false": [
          { "q": "O întrebare amuzantă adevărat/fals despre lume, natură sau animale, potrivită pentru vârsta copilului.", "a": "Adevărat/Fals + explicație scurtă pentru pagina de răspunsuri" },
          { "q": "O altă întrebare amuzantă.", "a": "Adevărat sau Fals + explicație scurtă" },
          { "q": "O altă întrebare amuzantă.", "a": "Adevărat sau Fals + explicație scurtă" }
        ]
      }`;

      const generated = await generateAiText({
        prompt,
        responseMimeType: "application/json",
      });
      if ("error" in generated) {
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const result = sanitizeEmergencyKit(parseJsonObject(generated.text));

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Tip necunoscut" }, { status: 400 });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    const message = error instanceof Error ? error.message : "Magia a întârziat puțin. Încearcă din nou!";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
