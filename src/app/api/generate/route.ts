import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import https from "node:https";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry, type TelemetryProduct } from "@/lib/telemetry";
import { generateVertexStoryCover } from "@/lib/vertexImage";

type GenerateRequest = {
  type?: "monster" | "story" | "emergency";
  name?: string;
  age?: string;
  theme?: string;
  lesson?: string;
  monster?: string;
  context?: string;
  interest?: string;
  duration?: string;
  activityMode?: string;
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
  minWords: number;
  maxOutputTokens: number;
};

type AiProvider = "gemini" | "vertex";

const SUPPORTED_TYPES = new Set<NonNullable<GenerateRequest["type"]>>(["monster", "story", "emergency"]);

const STORY_THEMES = {
  space: {
    label: "Spațiu",
    promptDetail: "un observator plutitor, planete somnoroase și pasarele de praf de stele",
    defaultDetail: "un observator plutitor deasupra unei planete adormite",
    path: "o pasarelă de lumină dintre stele",
    mirrorPlace: "o galerie de hublouri rotunde, care oglindeau emoții blânde",
    hiddenPlace: "lângă o constelație desenată în praf de stele",
    friend: "un pui de pasăre cu pene argintii",
    scenery: "hublourile, constelațiile, planetele și inelele de lumină",
  },
  forest: {
    label: "Pădure fermecată",
    promptDetail: "licurici albaștri, rădăcini moi și frunze care lucesc ca felinarele",
    defaultDetail: "o pădure fermecată cu licurici albaștri și poteci moi de mușchi",
    path: "un pod din rădăcini moi",
    mirrorPlace: "o poiană cu oglinzi rotunde, agățate între frunze",
    hiddenPlace: "printre clopoței de pădure și fire de iarbă",
    friend: "un pui de pasăre cu pene aurii",
    scenery: "frunzele, licuricii, ferestrele din copaci și potecile de mușchi",
  },
  castle: {
    label: "Castel din nori",
    promptDetail: "turnuri calde, scări plutitoare și vitralii care păstrează lumina serii",
    defaultDetail: "un castel din nori, cu turnuri calde și ferestre luminoase",
    path: "o punte de piatră albă dintre două turnuri",
    mirrorPlace: "o sală de oglinzi rotunde, cu vitralii de seară",
    hiddenPlace: "sub o scară plutitoare, lângă un ghiveci cu ierburi de argint",
    friend: "un pui de pasăre cu o pană aurie",
    scenery: "turnurile, vitraliile, ferestrele și podurile plutitoare",
  },
  ocean: {
    label: "Oceanul de cristal",
    promptDetail: "ape transparente, corali luminoși, scoici de perle și valuri liniștite",
    defaultDetail: "un ocean de cristal cu corali luminoși și scoici care șoptesc încet",
    path: "un pod de corali netezi, deasupra unei ape limpezi",
    mirrorPlace: "o grădină de bule rotunde, care oglindeau emoții blânde",
    hiddenPlace: "între corali mici și iarbă de mare care se legăna încet",
    friend: "o vidră mică cu mustăți argintii",
    scenery: "coralii, scoicile, valurile line și grădinile de lumină de sub apă",
  },
  dinosaurs: {
    label: "Valea dinozaurilor blânzi",
    promptDetail: "dinozauri prietenoși, frunze uriașe, lumini calde și munți rotunjiți",
    defaultDetail: "o vale cu dinozauri blânzi, frunze uriașe și felinare calde",
    path: "o pasarelă din frunze late, deasupra unui pârâu strălucitor",
    mirrorPlace: "o poiană cu pietre rotunde, care oglindeau emoții blânde",
    hiddenPlace: "sub o frunză uriașă, lângă semințe luminoase",
    friend: "un pui de brahiozaur cu pete aurii",
    scenery: "frunzele uriașe, urmele luminoase, munții rotunjiți și felinarele din vale",
  },
  clouds: {
    label: "Orașul din nori",
    promptDetail: "case mici pe nori, felinare plutitoare și poduri pufoase de seară",
    defaultDetail: "un oraș din nori cu felinare plutitoare și case cu acoperișuri rotunde",
    path: "un pod pufos dintre două case de nori",
    mirrorPlace: "o piațetă cu oglinzi rotunde, atârnate de felinare",
    hiddenPlace: "lângă o fereastră de nori, printre fire de ceață aurie",
    friend: "un iepuraș de nori cu urechi luminoase",
    scenery: "casele de nori, felinarele plutitoare, ferestrele și podurile pufoase",
  },
} as const;

type StoryThemeId = keyof typeof STORY_THEMES;

function getStoryTheme(theme: string | undefined) {
  return STORY_THEMES[theme as StoryThemeId] ?? STORY_THEMES.space;
}

function cleanRequestText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeGenerateRequest(value: unknown): GenerateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const data = value as Record<string, unknown>;
  if (!SUPPORTED_TYPES.has(data.type as NonNullable<GenerateRequest["type"]>)) return null;

  const normalized: GenerateRequest = {
    type: data.type as GenerateRequest["type"],
    name: cleanRequestText(data.name, 80),
    age: cleanRequestText(data.age, 2),
    theme: cleanRequestText(data.theme, 24),
    lesson: cleanRequestText(data.lesson, 120),
    monster: cleanRequestText(data.monster, 100),
    context: cleanRequestText(data.context, 280),
    interest: cleanRequestText(data.interest, 100),
    duration: cleanRequestText(data.duration, 24),
    activityMode: cleanRequestText(data.activityMode, 32),
    tone: cleanRequestText(data.tone, 80),
    themeDetail: cleanRequestText(data.themeDetail, 180),
    lessonDetail: cleanRequestText(data.lessonDetail, 180),
  };

  if (!normalized.name) return null;
  if (normalized.age && !/^(?:[1-9]|10)$/.test(normalized.age)) return null;
  if (normalized.theme && !(normalized.theme in STORY_THEMES)) return null;

  return normalized;
}

const STORY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "text", "imagePrompt"],
  properties: {
    title: { type: "string" },
    text: { type: "string" },
    imagePrompt: { type: "string" },
  },
} as const;

const MONSTER_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["body", "ingredients", "steps", "spell"],
  properties: {
    body: { type: "string" },
    ingredients: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["num", "icon", "name", "detail"],
        properties: {
          num: { type: "string" },
          icon: { type: "string" },
          name: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    steps: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["roman", "l1", "l2"],
        properties: {
          roman: { type: "string" },
          l1: { type: "string" },
          l2: { type: "string" },
        },
      },
    },
    spell: { type: "string" },
  },
} as const;

const EMERGENCY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["missionTitle", "missionNote", "radar", "riddle", "drawing", "patience", "story_starters", "true_or_false"],
  properties: {
    missionTitle: { type: "string" },
    missionNote: { type: "string" },
    radar: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
    riddle: { type: "string" },
    drawing: { type: "string" },
    patience: { type: "string" },
    story_starters: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    true_or_false: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["q", "a"],
        properties: { q: { type: "string" }, a: { type: "string" } },
      },
    },
  },
} as const;

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

function decodeLooseJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseStoryJson(text: string): unknown {
  try {
    return parseJsonObject(text);
  } catch {
    const source = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const titleMatch = source.match(/"title"\s*:\s*"([\s\S]*?)"\s*,\s*"text"\s*:/i);
    const textMatch = source.match(/"text"\s*:\s*"([\s\S]*?)"\s*,\s*"imagePrompt"\s*:/i);
    const imagePromptMatch = source.match(/"imagePrompt"\s*:\s*"([\s\S]*?)"\s*}\s*$/i);

    if (!titleMatch || !textMatch || !imagePromptMatch) {
      throw new Error("Răspunsul AI nu conține câmpurile necesare pentru poveste.");
    }

    return {
      title: decodeLooseJsonString(titleMatch[1]),
      text: decodeLooseJsonString(textMatch[1]),
      imagePrompt: decodeLooseJsonString(imagePromptMatch[1]),
    };
  }
}

function buildStableStoryPayload(data: GenerateRequest, theme: (typeof STORY_THEMES)[StoryThemeId]) {
  const name = stripHtml(data.name) || "Eroul";
  const age = stripHtml(data.age) || "4";
  const themeLabel = theme.label;
  const lesson = removeDecorativeEmoji(stripHtml(data.lesson)) || "curaj și încredere";
  const worldDetail = stripHtml(data.themeDetail) || theme.defaultDetail;
  const lessonDetail = stripHtml(data.lessonDetail) || "lecția apare printr-o alegere mică, făcută cu răbdare";
  const childDetails = removeLeadingChildReference(stripHtml(data.context), name);
  const cleanLessonDetail = removeLeadingChildReference(lessonDetail, name);
  const personalToken = childDetails
    ? `Pe marginea drumului au apărut semne care păreau alese special pentru ${name}: ${childDetails}.`
    : `Pe marginea drumului au apărut semne mici, ca niște indicii pregătite anume pentru ${name}.`;
  const lessonChoice = data.lessonDetail
    ? `${name} și-a amintit ce avea de încercat: ${cleanLessonDetail}.`
    : `${name} a înțeles că ${lesson.toLocaleLowerCase("ro-RO")} începe cu un pas mic și sincer.`;
  const title = `${name} și Lumina din ${themeLabel}`;

  const text = [
    `În seara aceea, ${name}, care avea ${age} ani, a găsit pe pernă o luminiță cât un nasture. Nu pâlpâia ca o lampă și nici nu stătea locului ca o stea. Se mișca încet, ca și cum ar fi vrut să arate drumul către ${worldDetail}. Când ${name} a atins-o cu vârful degetului, camera s-a umplut de o lumină caldă, iar podeaua s-a transformat într-o potecă nouă.`,
    `${name} a pășit cu grijă. Lumea de dincolo mirosea a seară bună și a aventură blândă. ${personalToken} În depărtare, o lumină mare, rotundă, tremura prinsă într-un felinar închis. Fără ea, visele bune nu mai știau drumul spre copii.`,
    `Lângă felinar stătea un paznic mic, cu o cheie prea grea pentru buzunarul lui. „Felinarul se deschide doar când cineva învață ${lesson.toLocaleLowerCase("ro-RO")} printr-o faptă adevărată”, a spus el. ${name} s-a uitat la cheie. Nu părea o misiune de forță, ci una în care trebuia să asculți ce simți și să alegi cu grijă.`,
    `Drumul până la felinar trecea peste ${theme.path}. Se legăna ușor, ca o panglică în vânt. ${name} a simțit un nod mic în burtică. În loc să fugă, s-a oprit, a respirat încet și a spus cu voce joasă: „Am emoții, dar pot încerca pas cu pas.” Atunci prima treaptă s-a aprins sub tălpi.`,
    `La mijlocul drumului, luminița de pe pernă s-a schimbat într-o busolă mică. ${lessonChoice} A cerut ajutor paznicului, care a rămas aproape, iar ${name} a continuat. Cu fiecare pas, drumul devenea mai sigur, ca și cum ar fi prins încredere odată cu copilul care mergea pe el.`,
    `Dincolo de drum se afla ${theme.mirrorPlace}. Fiecare oglindă arăta o emoție: una era tremurată, alta curioasă, alta puțin supărată că drumul fusese greu. ${name} a privit cu atenție și a ales oglinda care semăna cel mai mult cu ce simțea. Când a spus cu voce tare ce vede, oglinda s-a făcut mică, cât o monedă, și i-a arătat o potecă nouă către felinar.`,
    `Pe potecă au apărut trei porți. Prima promitea o scurtătură strălucitoare, dar era încuiată. A doua avea o sonerie care făcea mult zgomot. A treia părea simplă și liniștită, însă cerea răbdare. ${name} s-a gândit la semnele de pe drum și a ales poarta care îi lăsa timp să observe, să respire și să meargă în ritmul său. Paznicul a zâmbit: aceasta era alegerea pe care o aștepta.`,
    `După poartă, busola a început să arate spre un clopoțel ascuns ${theme.hiddenPlace}. ${name} l-a găsit cu grijă și l-a scuturat o singură dată. Sunetul lui nu era tare, ci cald, ca atunci când se închide ușa camerei înainte de somn. Deodată, lumina a trecut ușor prin ${theme.scenery}, iar felinarul a primit o dâră subțire de lumină.`,
    `Mai rămânea doar o rotiță lipsă, ascunsă ${theme.hiddenPlace}. Acolo, ${theme.friend} nu îndrăznea să se miște. ${name} nu s-a grăbit să ia rotița. I-a vorbit blând, a rămas aproape și i-a lăsat timp să se liniștească. Când prietenul cel mic a simțit că e în siguranță, a împins rotița spre ${name}. Chiar și lucrurile mici se pot mișca atunci când cineva le oferă răbdare.`,
    `Cu rotița în palmă, ${name} s-a întors la felinar. Cheia nu mai părea grea, iar busola nu mai tremura. Paznicul a ținut felinarul, iar ${name} a potrivit rotița, a răsucit cheia și a rostit încet: „Pot să fiu curajos/curajoasă în felul meu.” Felinarul s-a deschis, iar lumina lui a alergat prin ${theme.scenery}, aprinzând toate colțurile care așteptau un vis bun.`,
    `Lumina a ajuns și la grădina de oglinzi. Emoțiile din ele nu au dispărut, dar au început să lumineze pe rând, ca niște felinare mici. ${name} a înțeles că nu trebuie să alunge fiecare emoție ca să poată merge mai departe. Uneori e de ajuns să o observe, să o numească și să aleagă următorul pas cu grijă. Atunci, drumul devine mai ușor de văzut.`,
    `Paznicul i-a dăruit lui ${name} o scânteie rotundă, pe care nu trebuia să o țină în buzunar. „O vei găsi de fiecare dată când respiri, când ceri ajutor sau când alegi să încerci încă o dată”, a spus el. ${name} a pus mâna pe inimă și a simțit că scânteia știa deja drumul spre casă.`,
    `În clipa următoare, ${name} era din nou în pat. Pe pernă nu mai era luminița, dar în piept rămăsese o căldură mică și sigură. Camera era liniștită, noaptea era prietenoasă, iar ${name} știa că, ori de câte ori va avea emoții, poate începe cu un pas mic, o vorbă sinceră și puțin curaj.`,
  ].join("\n\n");

  return {
    title,
    text: normalizeRomanianText(text),
    imagePrompt: `English prompt: square children's book cover of ${name}, age ${age}, holding a tiny warm light on a path through ${themeLabel}, include ${theme.promptDetail}, ${childDetails || worldDetail}, gentle bedtime adventure about ${lesson}, premium watercolor and gouache, soft bedtime light, no text`,
    fallback: true,
    note: `Am folosit varianta stabilă pentru că serviciul AI este temporar aglomerat. Textul poate fi editat înainte de PDF.`,
  };
}

async function attachVertexCover<T extends { imagePrompt: string }>(story: T) {
  const cover = await generateVertexStoryCover(story.imagePrompt);
  if ("error" in cover) {
    // The browser uses a generic, non-personal Pollinations image only if Vertex is unavailable.
    console.warn("Vertex cover generation failed");
    return {
      ...story,
      coverWarning: "Coperta AI nu este disponibilă momentan.",
    };
  }

  return {
    ...story,
    coverImage: cover.imageDataUrl,
    coverModel: cover.model,
  };
}

function cleanPromptValue(value: unknown, fallback = "") {
  return stripHtml(value).slice(0, 180) || fallback;
}

function getStoryLengthConfig(age: string | undefined) {
  const ageNumber = Number.parseInt(age || "", 10) || 4;
  if (ageNumber <= 3) {
    return { wordTarget: "1.800-2.000", minWords: 1800, paragraphTarget: "20-22", maxOutputTokens: 6200 };
  }
  if (ageNumber <= 6) {
    return { wordTarget: "2.000-2.200", minWords: 2000, paragraphTarget: "22-24", maxOutputTokens: 7000 };
  }
  return { wordTarget: "2.200-2.400", minWords: 2200, paragraphTarget: "24-26", maxOutputTokens: 7800 };
}

function getWordCount(value: string) {
  return sanitizeStoryText(value).split(/\s+/).filter(Boolean).length;
}

function buildStoryContinuationPrompt({
  data,
  themeLabel,
  title,
  storySoFar,
  targetWords,
}: {
  data: GenerateRequest;
  themeLabel: string;
  title: string;
  storySoFar: string;
  targetWords: number;
}) {
  const name = cleanPromptValue(data.name, "Eroul");
  const age = cleanPromptValue(data.age, "4");
  const lesson = cleanPromptValue(data.lesson, "Curaj și încredere");
  const tone = cleanPromptValue(data.tone, "Liniștită de somn");
  const worldDetail = cleanPromptValue(data.themeDetail);
  const lessonDetail = cleanPromptValue(data.lessonDetail);
  const childDetails = cleanPromptValue(data.context);
  const worldSignature = getStoryTheme(data.theme).promptDetail;

  return `Continuă această poveste personalizată pentru copil. Povestea de mai jos este deja prima parte; NU o repeta și NU o rezuma.

DATE OBLIGATORII:
- copil: ${name}, ${age} ani
- lume: ${themeLabel}${worldDetail ? `, cu detaliul: ${worldDetail}` : ""}
- repere care trebuie să apară firesc: ${worldSignature}
- lecție: ${lesson}${lessonDetail ? `, arătată prin: ${lessonDetail}` : ""}${childDetails ? `
- detaliu personal de păstrat: ${childDetails}` : ""}
- ton: ${tone}

PARTEA SCRISĂ DEJA:
${storySoFar}

SARCINĂ:
- Scrie EXCLUSIV continuarea, nu rescrie partea de mai sus.
- Continuarea începe cu o nouă mică întorsătură firească în aceeași aventură, apoi dezvoltă două-trei scene noi și se încheie din nou liniștitor, pregătind somnul.
- Scrie aproximativ ${targetWords} cuvinte, în 10-12 paragrafe separate prin două newline-uri. Fiecare paragraf are o acțiune, un dialog sau o observație senzorială. Nu comprima finalul.
- ${name} rămâne personaj activ; lumea aleasă și lecția schimbă în mod real ce se întâmplă.
- Română naturală, potrivită pentru ${age} ani. Fără markdown, emoji, violență sau explicații morale.

Returnează DOAR JSON valid, fără \`\`\`json și fără text înainte/după:
{
  "title": "${title}",
  "text": "doar continuarea, cu paragrafe separate prin două newline-uri",
  "imagePrompt": "English prompt for the same square children's book cover, based on the completed story, no text"
}`;
}

function buildStoryPrompt(data: GenerateRequest, themeLabel: string): StoryPromptConfig {
  const name = cleanPromptValue(data.name, "Eroul");
  const age = cleanPromptValue(data.age, "4");
  const lesson = cleanPromptValue(data.lesson, "Curaj și încredere");
  const tone = cleanPromptValue(data.tone, "Liniștită de somn");
  const worldDetail = cleanPromptValue(data.themeDetail);
  const lessonDetail = cleanPromptValue(data.lessonDetail);
  const childDetails = cleanPromptValue(data.context);
  const worldSignature = getStoryTheme(data.theme).promptDetail;
  const { wordTarget, minWords, paragraphTarget, maxOutputTokens } = getStoryLengthConfig(age);

  const requiredDetails = [
    `numele copilului: ${name}`,
    `vârsta: ${age} ani`,
    `lumea aleasă: ${themeLabel}`,
    `repere esențiale ale lumii: ${worldSignature}`,
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
- Textul va fi așezat pe exact patru pagini de poveste, după copertă și dedicație. Scrie patru capitole echilibrate, fiecare de aproximativ 450-550 de cuvinte: 1) plecarea, 2) explorarea, 3) alegerea curajoasă, 4) întoarcerea liniștită.
- Nu scrie sub ${minWords} cuvinte. Numără cu atenție înainte de răspuns. Povestea trebuie să aibă substanță pentru citit seara, nu un rezumat.
- Nu comprima finalul. Fiecare dintre cele patru capitole trebuie să conțină acțiune, dialog sau observații senzoriale și o mică schimbare pentru ${name}.
- Fiecare paragraf trebuie să avanseze acțiunea.
- Nu inventa detalii personale sensibile. Nu inventa frați, boli, școală sau părinți dacă nu au fost menționați.

Returnează DOAR JSON valid, fără \`\`\`json și fără text înainte/după:
{
  "title": "titlu scurt în română, cu numele copilului",
  "text": "povestea completă, cu paragrafe separate prin două newline-uri",
  "imagePrompt": "English prompt for one square children's book cover showing the main scene from this exact story, including the child protagonist, the chosen world, one meaningful personalized detail if provided, premium watercolor and gouache, soft bedtime light, no text"
}`;

  return { prompt, wordTarget, minWords, maxOutputTokens };
}

function limitMonsterText(value: unknown, maxLength: number) {
  const clean = stripHtml(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function sanitizeMonsterBody(value: unknown) {
  const clean = sanitizeEmHtml(value);
  if (stripHtml(clean).length <= 320) return clean;
  return limitMonsterText(clean, 320);
}

function sanitizeMonsterSpell(value: unknown) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => limitMonsterText(line, 56))
    .join("\n");
}

function sanitizeMonsterKit(value: unknown) {
  const kit = value as {
    body?: unknown;
    ingredients?: Array<{ num?: unknown; icon?: unknown; name?: unknown; detail?: unknown }>;
    steps?: Array<{ roman?: unknown; l1?: unknown; l2?: unknown }>;
    spell?: unknown;
  };

  return {
    body: sanitizeMonsterBody(kit.body),
    ingredients: Array.isArray(kit.ingredients)
      ? kit.ingredients.slice(0, 4).map((ingredient, index) => ({
          num: stripHtml(ingredient.num) || String(index + 1),
          icon: stripHtml(ingredient.icon).slice(0, 8),
          name: limitMonsterText(ingredient.name, 26),
          detail: limitMonsterText(ingredient.detail, 34),
        }))
      : [],
    steps: Array.isArray(kit.steps)
      ? kit.steps.slice(0, 3).map((step, index) => ({
          roman: stripHtml(step.roman) || ["I", "II", "III"][index] || String(index + 1),
          l1: limitMonsterText(step.l1, 56),
          l2: limitMonsterText(step.l2, 56),
        }))
      : [],
    spell: sanitizeMonsterSpell(kit.spell),
  };
}

function limitEmergencyText(value: unknown, maxLength: number) {
  const clean = normalizeRomanianText(stripHtml(value));
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function sanitizeEmergencyKit(value: unknown) {
  const kit = value as {
    missionTitle?: unknown;
    missionNote?: unknown;
    radar?: unknown[];
    riddle?: unknown;
    drawing?: unknown;
    patience?: unknown;
    story_starters?: unknown[];
    true_or_false?: Array<{ q?: unknown; a?: unknown }>;
  };

  return {
    missionTitle: limitEmergencyText(kit.missionTitle, 48),
    missionNote: limitEmergencyText(kit.missionNote, 130),
    radar: Array.isArray(kit.radar)
      ? kit.radar.slice(0, 4).map((item) => limitEmergencyText(item, 68))
      : [],
    riddle: limitEmergencyText(kit.riddle, 210),
    drawing: limitEmergencyText(kit.drawing, 210),
    patience: limitEmergencyText(kit.patience, 270),
    story_starters: Array.isArray(kit.story_starters)
      ? kit.story_starters.slice(0, 3).map((item) => limitEmergencyText(item, 150))
      : [],
    true_or_false: Array.isArray(kit.true_or_false)
      ? kit.true_or_false.slice(0, 3).map((item) => ({
          q: limitEmergencyText(item.q, 155),
          a: limitEmergencyText(item.a, 200),
        }))
      : [],
  };
}

async function generateGeminiText({
  apiKey,
  prompt,
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  responseMimeType,
  responseJsonSchema,
  maxOutputTokens,
  thinkingBudget,
  temperature = 0.8,
}: {
  apiKey: string;
  prompt: string;
  model?: string;
  responseMimeType?: "application/json";
  responseJsonSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  temperature?: number;
}): Promise<GeminiTextResult> {
  const generationConfig = {
    ...(responseMimeType ? { responseMimeType } : {}),
    ...(responseJsonSchema ? { responseJsonSchema } : {}),
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
    ...(thinkingBudget === undefined ? {} : { thinkingConfig: { thinkingBudget } }),
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
  responseJsonSchema,
  maxOutputTokens,
  thinkingBudget,
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
        ...(responseJsonSchema ? { responseJsonSchema } : {}),
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
        ...(thinkingBudget === undefined ? {} : { thinkingConfig: { thinkingBudget } }),
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
  responseJsonSchema,
  maxOutputTokens,
  thinkingBudget,
  temperature,
}: Omit<Parameters<typeof generateGeminiText>[0], "apiKey">): Promise<GeminiTextResult> {
  if (getAiProvider() === "vertex") {
    return generateVertexText({ prompt, model, responseMimeType, responseJsonSchema, maxOutputTokens, thinkingBudget, temperature });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY lipsește din configurare." };
  }

  return generateGeminiText({ apiKey, prompt, model, responseMimeType, responseJsonSchema, maxOutputTokens, thinkingBudget, temperature });
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
      responseJsonSchema: STORY_RESPONSE_SCHEMA,
      maxOutputTokens,
      thinkingBudget: 0,
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
  const startedAt = Date.now();
  let product: TelemetryProduct | undefined;

  try {
    if (requestExceedsBodyLimit(req)) {
      return NextResponse.json(
        { success: false, error: "Cererea este prea mare. Păstrează detaliile scurte și încearcă din nou." },
        { status: 413 }
      );
    }

    const limit = checkRateLimit(req, "generate");
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Ai ajuns la limita de generări pentru moment. Încearcă din nou mai târziu." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const data = normalizeGenerateRequest(await req.json());
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Verifică numele copilului și opțiunile alese, apoi încearcă din nou." },
        { status: 400 }
      );
    }

    product = data.type;

    if (!isAiConfigured()) {
      if (data.type === "story") {
        const theme = getStoryTheme(data.theme);
        const fallback = buildStableStoryPayload(data, theme);
        const storyWithCover = await attachVertexCover(fallback);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: true, data: storyWithCover });
      }

      logTelemetry("pmm_generation_failed", {
        product,
        result: "error",
        errorCode: "configuration",
        durationMs: Date.now() - startedAt,
        aiProvider: getAiProvider(),
      });
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
      const location = data.context || "camera copilului";
      const helper = data.interest || "o îmbrățișare și o lumină de veghe";
      const ritual = data.tone || "trei respirații lente înainte de somn";
      const prompt = `Ești reprezentantul Ministerului Protecției Magice. Creezi un kit blând, cald și printabil pentru copilul "${data.name}", care se pregătește de somn și are nevoie de ajutor cu: "${data.monster}".

Detalii alese de părinte:
- Locul care are nevoie de protecție: "${location}".
- Ce îl/o liniștește pe copil: "${helper}".
- Ritualul de seară: "${ritual}".

Creează conținut personalizat: folosește natural numele copilului, frica aleasă și cel puțin două dintre detaliile de mai sus. Tonul este jucăuș și liniștitor; nu confirma că monștrii există și nu promite rezultate medicale. Este un joc de imaginație: nu spune că umbrele, obiectele, ingredientele sau jucăriile prind viață, au puteri reale, păzesc copilul ori alungă ceva în mod real. Evită formulele de adresare precum „vrăjitoare” sau „vrăjitor”.

Siguranță: spray-ul este un ritual simbolic pregătit de un adult. Ingredientele trebuie să fie sigure pentru un spray de joacă: apă potabilă și, cel mult, o singură picătură de colorant alimentar. Nu propune uleiuri esențiale, parfum, detergent, oțet, bicarbonat, sare, zahăr, miere, scorțișoară, lichide acide sau aplicare pe corp, față, ochi, pernă, suprafețe ori animale. În pași, spune că spray-ul se pulverizează o singură dată în aer de către un adult. Dacă ai nevoie de un al treilea ingredient, îl poți numi "un gând curajos" și precizezi în pas că nu se pune în flacon.

Conținutul intră într-un template cu spațiu fix. Respectă exact:
- body: 1-2 propoziții, maximum 320 de caractere; poți folosi cel mult două accente <em>...</em>.
- ingredients: exact 3; numele comun maximum 26 de caractere, fără paranteze sau cantități, iar denumirea magică maximum 34 de caractere.
- steps: exact 3, marcate I, II, III; fiecare l1 și l2 maximum 56 de caractere, fără HTML.
- spell: exact 4 versuri separate prin caracterul newline \\n, fiecare de maximum 56 de caractere, fără HTML; include numele copilului.

Returnează doar JSON valid conform schemei, fără Markdown.`;

      const generated = await generateAiText({
        prompt,
        responseMimeType: "application/json",
        responseJsonSchema: MONSTER_RESPONSE_SCHEMA,
        maxOutputTokens: 1000,
        thinkingBudget: 0,
        temperature: 0.8,
      });
      if ("error" in generated) {
        logTelemetry("pmm_generation_failed", {
          product,
          result: "error",
          errorCode: "ai_error",
          durationMs: Date.now() - startedAt,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const result = sanitizeMonsterKit(parseJsonObject(generated.text));

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode: "ai",
        durationMs: Date.now() - startedAt,
        aiProvider: getAiProvider(),
        model: generated.model,
      });
      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const theme = getStoryTheme(data.theme);
      const themeLabel = theme.label;
      const { prompt, maxOutputTokens, minWords } = buildStoryPrompt(data, themeLabel);

      const generated = await generateStoryWithModelFallback({
        prompt,
        maxOutputTokens,
      });
      if ("error" in generated) {
        const fallback = buildStableStoryPayload(data, theme);
        const storyWithCover = await attachVertexCover(fallback);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({
          success: true,
          data: storyWithCover,
          warning: generated.error,
        });
      }
      let result: ReturnType<typeof sanitizeStoryPayload>;
      try {
        result = sanitizeStoryPayload(parseStoryJson(generated.text), data.name || "Eroul", themeLabel);
      } catch {
        const fallback = buildStableStoryPayload(data, theme);
        const storyWithCover = await attachVertexCover(fallback);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({
          success: true,
          data: storyWithCover,
          warning: "Răspunsul AI nu a putut fi citit ca JSON.",
        });
      }

      // Gemini can occasionally stop early even with a generous output limit. Add a coherent
      // second act instead of returning a thin story that leaves most PDF pages blank.
      let wordCount = getWordCount(result.text);
      for (let attempt = 0; wordCount < minWords && attempt < 2; attempt += 1) {
        const targetWords = Math.max(1200, minWords - wordCount + 400);
        const continuation = await generateStoryWithModelFallback({
          prompt: buildStoryContinuationPrompt({
            data,
            themeLabel,
            title: result.title,
            storySoFar: result.text,
            targetWords,
          }),
          maxOutputTokens: Math.max(maxOutputTokens, 6200),
        });

        if ("error" in continuation) {
          break;
        }

        try {
          const addition = sanitizeStoryPayload(parseStoryJson(continuation.text), data.name || "Eroul", themeLabel).text;
          if (getWordCount(addition) < 400) {
            break;
          }
          result = { ...result, text: `${result.text}\n\n${addition}` };
          wordCount = getWordCount(result.text);
        } catch {
          break;
        }
      }

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode: "ai",
        durationMs: Date.now() - startedAt,
        wordCount,
        aiProvider: getAiProvider(),
        model: generated.model,
      });
      const storyWithCover = await attachVertexCover(result);
      return NextResponse.json({
        success: true,
        data: { ...storyWithCover, model: generated.model },
        ...(wordCount < minWords ? { warning: "Povestea este mai scurtă decât ținta din cauza unui răspuns AI incomplet." } : {}),
      });
    }

    if (data.type === "emergency") {
      const prompt = `Ești un educator creativ român. Creezi o Trusă Magică de Urgență care va fi tipărită pe A4 și folosită imediat de un părinte cu copilul.

Datele copilului:
- Nume: ${data.name}
- Vârstă: ${data.age || "nespecificată"} ani
- Locul/situația: ${data.context || "o perioadă de așteptare"}
- Interes preferat: ${data.interest || "imaginația și joaca"}
- Timp disponibil: ${data.duration || "10-20 minute"}
- Stil preferat: ${data.activityMode || "mix"}

Scrie numai în română naturală, caldă și clară. Toate activitățile trebuie să fie sigure, liniștite, fără materiale obligatorii și posibile chiar în locul indicat. Respectă cu strictețe locul: nu propune alergat la restaurant, în aeroport, la doctor sau la coadă. Leagă interesul copilului firesc de cel puțin două activități. Evită limbajul medical, fricile, pedepsele și promisiunile de tipul „vei sta cuminte”.

Conținutul intră într-un template cu spațiu fix. Respectă exact limitele:
- missionTitle: 2-6 cuvinte, maximum 48 de caractere.
- missionNote: o singură propoziție, maximum 130 de caractere.
- radar: exact 4 indicii observabile, fără numere, fiecare maximum 68 de caractere.
- riddle: 2 versuri scurte, maximum 210 caractere în total.
- drawing: o singură propoziție, maximum 210 caractere.
- patience: 2-3 propoziții scurte, maximum 270 de caractere; un joc calm, adaptat timpului disponibil.
- story_starters: exact 3 începuturi de poveste, fiecare maximum 150 de caractere.
- true_or_false: exact 3 întrebări. q are maximum 155 caractere. a începe obligatoriu cu „Adevărat.” sau „Fals.” și are maximum 200 de caractere.

Returnează exclusiv un obiect JSON valid, conform schemei cerute. Fără Markdown, fără explicații în afara JSON-ului.`;

      const generated = await generateAiText({
        prompt,
        responseMimeType: "application/json",
        responseJsonSchema: EMERGENCY_RESPONSE_SCHEMA,
        maxOutputTokens: 1500,
        thinkingBudget: 0,
        temperature: 0.8,
      });
      if ("error" in generated) {
        logTelemetry("pmm_generation_failed", {
          product,
          result: "error",
          errorCode: "ai_error",
          durationMs: Date.now() - startedAt,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const result = sanitizeEmergencyKit(parseJsonObject(generated.text));

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode: "ai",
        durationMs: Date.now() - startedAt,
        aiProvider: getAiProvider(),
        model: generated.model,
      });
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Tip necunoscut" }, { status: 400 });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    logTelemetry("pmm_generation_failed", {
      product,
      result: "error",
      errorCode: "unknown",
      durationMs: Date.now() - startedAt,
      aiProvider: getAiProvider(),
    });
    const message = error instanceof Error ? error.message : "Magia a întârziat puțin. Încearcă din nou!";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
