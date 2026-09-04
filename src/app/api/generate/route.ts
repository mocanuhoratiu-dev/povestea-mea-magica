import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import https from "node:https";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry, type TelemetryProduct } from "@/lib/telemetry";
import { readBoundedDuration, withTimeout } from "@/lib/aiTimeout";
import { isTrustedOrderWorker } from "@/lib/orders";
import { buildNightShieldContent, sanitizeNightShieldContent } from "@/lib/nightShield";
import { buildPatienceKitContent, recommendedDifficulty, sanitizePatienceKitContent, type PatienceDifficulty } from "@/lib/patienceKit";

type GenerateRequest = {
  type?: "monster" | "story" | "emergency";
  storyLength?: StoryLength;
  name?: string;
  age?: string;
  theme?: string;
  lesson?: string;
  monster?: string;
  context?: string;
  interest?: string;
  duration?: string;
  activityMode?: string;
  difficulty?: PatienceDifficulty;
  tone?: string;
  themeDetail?: string;
  lessonDetail?: string;
};

type StoryLength = "short" | "long";

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
  continuationParagraphTarget: string;
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
    storyLength: data.storyLength === "long" ? "long" : "short",
    name: cleanRequestText(data.name, 80),
    age: cleanRequestText(data.age, 2),
    theme: cleanRequestText(data.theme, 24),
    lesson: cleanRequestText(data.lesson, 120),
    monster: cleanRequestText(data.monster, 100),
    context: cleanRequestText(data.context, 280),
    interest: cleanRequestText(data.interest, 100),
    duration: cleanRequestText(data.duration, 24),
    activityMode: cleanRequestText(data.activityMode, 32),
    difficulty: data.difficulty === "easy" || data.difficulty === "medium" || data.difficulty === "advanced" ? data.difficulty : undefined,
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
  required: ["storyTitle", "storyParagraphs", "safePlaces", "ritualSteps", "breathingCue", "courageFormula", "parentMessage", "bedsideMessage", "certificateLine"],
  properties: {
    storyTitle: { type: "string" },
    storyParagraphs: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    safePlaces: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    ritualSteps: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "text"],
        properties: { title: { type: "string" }, text: { type: "string" } },
      },
    },
    breathingCue: { type: "string" },
    courageFormula: { type: "string" },
    parentMessage: { type: "string" },
    bedsideMessage: { type: "string" },
    certificateLine: { type: "string" },
  },
} as const;

const EMERGENCY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["missionTitle", "missionNote", "radar", "drawingPrompt", "coloringPrompt", "verbalPrompts", "cards", "levelChallenges"],
  properties: {
    missionTitle: { type: "string" },
    missionNote: { type: "string" },
    radar: { type: "array", minItems: 6, maxItems: 6, items: { type: "string" } },
    drawingPrompt: { type: "string" },
    coloringPrompt: { type: "string" },
    verbalPrompts: { type: "array", minItems: 6, maxItems: 6, items: { type: "string" } },
    cards: { type: "array", minItems: 8, maxItems: 8, items: { type: "string" } },
    levelChallenges: {
      type: "object",
      additionalProperties: false,
      required: ["easy", "medium", "advanced"],
      properties: {
        easy: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
        medium: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
        advanced: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
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
  const isShortStory = data.storyLength === "short";

  const paragraphs = [
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
  ];

  // The long edition is also the final safety net when a model cannot finish its answer.
  // It needs to feel like a full evening story, not a shortened template with a longer label.
  const longJourney = [
    `După ce a făcut primul pas, ${name} a observat că poteca avea pe margini niște semne rotunde, ca niște ferestre minuscule. În fiecare se vedea o parte din ${worldDetail}: o lumină, o culoare sau un obiect care părea că așteaptă să fie ales. Paznicul i-a explicat că nu există un singur drum bun. Fiecare călător își face drumul mai clar atunci când observă cu atenție ce are deja în jurul lui. ${name} a privit încet, fără să se grăbească, și a ales semnul care îi amintea cel mai mult de acasă.`,
    `Semnul s-a deschis ca o hartă mică, desenată pe o frunză luminoasă. Nu avea săgeți mari sau porți care să sperie, ci patru cercuri aurii. Primul cerc arăta locul unde urma să învețe să asculte. Al doilea, locul unde trebuia să aleagă. Al treilea, locul unde putea cere ajutor. Ultimul avea desenat felinarul. „Nu trebuie să faci totul dintr-odată”, i-a spus paznicul. „Harta se citește pas cu pas.” ${name} a împăturit frunza cu grijă și a mers mai departe.`,
    `În curând au ajuns la o încăpere rotundă, plină de ${theme.scenery}. Acolo, fiecare lucru făcea un sunet mic: o clipire, un foșnet, o bătaie ușoară ca a unei inimi liniștite. Sunetele se amestecau, iar ${name} nu știa la început care contează. A închis ochii pentru o clipă și a ascultat din nou. A auzit un clinchet subțire, diferit de toate celelalte. Când l-a urmat, o ușă mică s-a deschis într-un perete pe care nimeni nu îl observase până atunci.`,
    `Din spatele ușii a apărut ${theme.friend}, care ținea între lăbuțe o cutie de chibrituri goală. Nu era trist(ă), dar părea foarte preocupat(ă). În cutie se afla o scânteie mică, iar ${theme.friend} se temea că ar putea să o piardă. ${name} nu i-a luat cutia și nu i-a spus repede ce să facă. S-a așezat lângă el/ea, a privit scânteia împreună cu el/ea și a întrebat ce ar ajuta. Atunci prietenul cel mic a respirat mai ușor și i-a arătat drumul spre următorul cerc de pe hartă.`,
    `Drumul nou trecea printr-o galerie de oglinzi line. În ele, ${name} nu vedea doar chipul său, ci și momente mici: un pas făcut cu curaj, o întrebare spusă cu voce tare, o clipă în care a așteptat fără să renunțe. Într-o oglindă apărea chiar nodul mic din burtică de mai devreme. ${name} a vrut să treacă repede mai departe, dar paznicul i-a amintit că și emoțiile au nevoie să fie observate. Când ${name} a spus: „Sunt puțin emoționat(ă), dar sunt aici”, oglinda s-a luminat ca o fereastră la apus.`,
    `În capătul galeriei, harta a arătat al doilea cerc: o masă joasă, pe care se aflau trei chei. Una era aurie și strălucea foarte tare. Una era albastră și părea că promite o scurtătură. A treia era simplă, din lemn neted, și avea gravat un semn asemănător cu cel ales de ${name} la începutul drumului. Cheile nu vorbeau, dar fiecare invita la o alegere. ${name} s-a gândit la ce observase, la ce simțea și la drumul care se construia încet. A ales cheia simplă, fiindcă i se părea cea mai sinceră.`,
    `Cheia a deschis o poartă spre o grădină cu lumini joase. Acolo, fiecare fir de iarbă purta câte o întrebare: „Ce te ajută când ceva e nou?”, „Cine poate merge lângă tine?”, „Care este pasul cel mai mic pe care îl poți face?” ${name} nu a trebuit să găsească răspunsuri perfecte. A ales câte un răspuns care i se potrivea în seara aceea. Uneori a spus că are nevoie de timp, alteori că ar vrea să întrebe pe cineva. Cu fiecare răspuns, o floare mică se deschidea și lăsa pe potecă o lumină caldă.`,
    `În mijlocul grădinii era un pod îngust, alcătuit din plăcuțe rotunde. Pe fiecare plăcuță trebuia pus un cuvânt. Paznicul a scris primul: „respir”. ${theme.friend} a pus al doilea: „întreb”. Apoi toți s-au uitat la ${name}. După ce s-a gândit puțin, ${name} a ales cuvântul „încerc”. Când cele trei cuvinte au fost așezate unul lângă altul, plăcuțele s-au legat ca niște pietre sigure. Podul nu devenise mai puțin înalt, dar acum avea un ritm pe care îl puteai urma fără grabă.`,
    `Dincolo de pod se vedea o fântână limpede. În apa ei se reflectau ${theme.scenery}, dar și felinarul care încă aștepta în depărtare. Pe marginea fântânii se afla o cană mică, cu un bilet: „Umple-o doar cu ce vrei să păstrezi.” ${name} a luat cana și a adunat, în imaginație, lucrurile bune de pe drum: harta de frunză, sunetul ascultat cu ochii închiși, ajutorul cerut cu blândețe și cuvântul pus pe pod. Apa din cană a început să lumineze încet, fără să stropească și fără să facă zgomot.`,
    `Când au revenit la felinar, roata lui mare se mișca foarte puțin. Nu era stricată, ci avea nevoie ca mai multe gesturi mici să lucreze împreună. ${name} a turnat înăuntru lumina din cană, paznicul a așezat cheia, iar ${theme.friend} a adus cutia cu scânteia. Nimeni nu a făcut totul singur. Apoi ${name} a observat un loc gol și a înțeles ce mai lipsea: să spună clar ce a învățat. A rostit, pe înțelesul lui/ei, că poate merge mai departe chiar și atunci când are emoții.`,
    `Felinarul s-a aprins o dată, apoi încă o dată, ca și cum ar fi verificat dacă toată lumea este pregătită. În loc să izbucnească într-o lumină mare, a trimis întâi patru raze mici, câte una spre fiecare cerc de pe hartă. Razele au atins încăperea sunetelor, galeria oglinzilor, grădina întrebărilor și podul cu cele trei cuvinte. Apoi au revenit la ${name}, adunându-se într-o lumină rotundă, suficient de blândă încât să poată fi ținută o clipă în palmă.`,
    `Paznicul i-a spus că lumina nu avea să rămână prinsă într-un obiect. Ea se întorcea de fiecare dată când ${name} își amintea să observe, să respire și să aleagă un pas potrivit. ${name} a vrut să știe dacă drumul va fi mereu la fel. Paznicul a zâmbit și a răspuns că nu, pentru că fiecare seară poate avea alte emoții și alte întrebări. Dar harta putea fi refăcută de fiecare dată, iar primele trei cuvinte rămâneau aceleași: respir, întreb, încerc.`,
  ];

  const text = (isShortStory
    ? [paragraphs[0], paragraphs[1], paragraphs[2], paragraphs[3], paragraphs[4], paragraphs[7], paragraphs[8], paragraphs[9], paragraphs[12]]
    : [
        paragraphs[0], longJourney[0], paragraphs[1], longJourney[1], paragraphs[2], longJourney[2], longJourney[3],
        paragraphs[3], longJourney[4], paragraphs[4], longJourney[5], paragraphs[5], longJourney[6], paragraphs[6],
        longJourney[7], paragraphs[7], longJourney[8], paragraphs[8], longJourney[9], paragraphs[9], longJourney[10],
        paragraphs[10], longJourney[11], paragraphs[11], paragraphs[12],
      ]
  ).join("\n\n");

  return {
    title,
    text: normalizeRomanianText(text),
    imagePrompt: `English prompt: square children's book cover of ${name}, age ${age}, holding a tiny warm light on a path through ${themeLabel}, include ${theme.promptDetail}, ${childDetails || worldDetail}, gentle bedtime adventure about ${lesson}, premium watercolor and gouache, soft bedtime light, no text`,
    fallback: true,
    note: `Am pregătit varianta completă a poveștii pentru formatul ales. Textul poate fi editat înainte de PDF.`,
  };
}

function cleanPromptValue(value: unknown, fallback = "") {
  return stripHtml(value).slice(0, 180) || fallback;
}

function getStoryLengthConfig(age: string | undefined, storyLength: StoryLength = "short") {
  const ageNumber = Number.parseInt(age || "", 10) || 4;
  if (storyLength === "short") {
    if (ageNumber <= 3) {
      return { wordTarget: "650-750", minWords: 620, paragraphTarget: "8-9", maxOutputTokens: 2800, continuationParagraphTarget: "4-5" };
    }
    if (ageNumber <= 6) {
      return { wordTarget: "750-850", minWords: 720, paragraphTarget: "9-10", maxOutputTokens: 3200, continuationParagraphTarget: "5-6" };
    }
    return { wordTarget: "850-950", minWords: 820, paragraphTarget: "10-11", maxOutputTokens: 3600, continuationParagraphTarget: "5-6" };
  }

  return { wordTarget: "1.800-2.000", minWords: 1800, paragraphTarget: "20-22", maxOutputTokens: 6200, continuationParagraphTarget: "5-6" };
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
  paragraphTarget,
}: {
  data: GenerateRequest;
  themeLabel: string;
  title: string;
  storySoFar: string;
  targetWords: number;
  paragraphTarget: string;
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
- Scrie aproximativ ${targetWords} cuvinte, în ${paragraphTarget} paragrafe separate prin două newline-uri. Fiecare paragraf are o acțiune, un dialog sau o observație senzorială. Nu comprima finalul.
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
  const storyLength = data.storyLength === "long" ? "long" : "short";
  const { wordTarget, minWords, paragraphTarget, maxOutputTokens, continuationParagraphTarget } = getStoryLengthConfig(age, storyLength);
  const structure = storyLength === "short"
    ? "Textul va fi așezat pe exact două pagini de poveste, după copertă și dedicație. Scrie două capitole echilibrate, fiecare de aproximativ 320-430 de cuvinte: 1) plecarea și mica provocare, 2) alegerea, rezolvarea și întoarcerea liniștită."
    : "Textul va fi așezat pe exact patru pagini de poveste, după copertă și dedicație. Scrie patru capitole echilibrate, fiecare de aproximativ 450-550 de cuvinte: 1) plecarea, 2) explorarea, 3) alegerea curajoasă, 4) întoarcerea liniștită.";

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
- ${structure}
- Nu scrie sub ${minWords} cuvinte. Numără cu atenție înainte de răspuns. Povestea trebuie să aibă substanță pentru citit seara, nu un rezumat.
- Nu comprima finalul. Fiecare capitol trebuie să conțină acțiune, dialog sau observații senzoriale și o mică schimbare pentru ${name}.
- Fiecare paragraf trebuie să avanseze acțiunea.
- Nu inventa detalii personale sensibile. Nu inventa frați, boli, școală sau părinți dacă nu au fost menționați.

Returnează DOAR JSON valid, fără \`\`\`json și fără text înainte/după:
{
  "title": "titlu scurt în română, cu numele copilului",
  "text": "povestea completă, cu paragrafe separate prin două newline-uri",
  "imagePrompt": "English prompt for one square children's book cover showing the main scene from this exact story, including the child protagonist, the chosen world, one meaningful personalized detail if provided, premium watercolor and gouache, soft bedtime light, no text"
}`;

  return { prompt, wordTarget, minWords, maxOutputTokens, continuationParagraphTarget };
}

async function generateGeminiText({
  apiKey,
  prompt,
  model = process.env.GEMINI_MODEL || "gemini-3.5-flash",
  responseMimeType,
  responseJsonSchema,
  maxOutputTokens,
  thinkingBudget,
  temperature = 0.8,
  timeoutMs = 30_000,
}: {
  apiKey: string;
  prompt: string;
  model?: string;
  responseMimeType?: "application/json";
  responseJsonSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  temperature?: number;
  timeoutMs?: number;
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
      request.setTimeout(timeoutMs, () => {
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
  model = process.env.VERTEX_AI_MODEL || "gemini-3.5-flash",
  responseMimeType,
  responseJsonSchema,
  maxOutputTokens,
  thinkingBudget,
  temperature = 0.8,
  timeoutMs = 30_000,
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
    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          ...(responseMimeType ? { responseMimeType } : {}),
          ...(responseJsonSchema ? { responseJsonSchema } : {}),
          ...(maxOutputTokens ? { maxOutputTokens } : {}),
          ...(thinkingBudget === undefined ? {} : { thinkingConfig: { thinkingBudget } }),
          temperature,
        },
      }),
      timeoutMs,
      `Modelul ${model} a depășit timpul de răspuns.`
    );
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
  timeoutMs,
}: Omit<Parameters<typeof generateGeminiText>[0], "apiKey">): Promise<GeminiTextResult> {
  if (getAiProvider() === "vertex") {
    return generateVertexText({ prompt, model, responseMimeType, responseJsonSchema, maxOutputTokens, thinkingBudget, temperature, timeoutMs });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY lipsește din configurare." };
  }

  return generateGeminiText({ apiKey, prompt, model, responseMimeType, responseJsonSchema, maxOutputTokens, thinkingBudget, temperature, timeoutMs });
}

function getGeminiModelCandidates() {
  const isVertex = getAiProvider() === "vertex";
  const configuredModels = [
    isVertex ? process.env.VERTEX_AI_MODEL : process.env.GEMINI_MODEL,
    ...((isVertex ? process.env.VERTEX_AI_FALLBACK_MODELS : process.env.GEMINI_FALLBACK_MODELS) || "").split(","),
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ];

  const candidates = Array.from(
    new Set(
      configuredModels
        .map((model) => model?.trim())
        .filter((model): model is string => Boolean(model))
    )
  );

  const maximumModels = readBoundedDuration(process.env.AI_FALLBACK_MAX_MODELS, 2, 1, 3);
  return candidates.slice(0, maximumModels);
}

async function generateWithModelFallback({
  prompt,
  responseJsonSchema,
  maxOutputTokens,
  temperature = 0.75,
}: {
  prompt: string;
  responseJsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
  temperature?: number;
}): Promise<GeminiTextResult> {
  const errors: string[] = [];
  const startedAt = Date.now();
  const totalTimeoutMs = readBoundedDuration(process.env.AI_GENERATION_BUDGET_MS, 55_000, 10_000, 90_000);
  const perModelTimeoutMs = readBoundedDuration(process.env.AI_MODEL_TIMEOUT_MS, 35_000, 5_000, 60_000);

  for (const model of getGeminiModelCandidates()) {
    const remainingMs = totalTimeoutMs - (Date.now() - startedAt);
    if (remainingMs < 4_000) break;

    const generated = await generateAiText({
      prompt,
      model,
      responseMimeType: "application/json",
      responseJsonSchema,
      maxOutputTokens,
      thinkingBudget: 0,
      temperature,
      timeoutMs: Math.min(perModelTimeoutMs, remainingMs),
    });

    if (!("error" in generated)) {
      return generated;
    }

    errors.push(`${model}: ${generated.error}`);
  }

  return { error: errors.join(" | ") || "Gemini nu a răspuns cu niciun model disponibil." };
}

async function generateStoryWithModelFallback({ prompt, maxOutputTokens }: { prompt: string; maxOutputTokens: number }) {
  return generateWithModelFallback({
    prompt,
    responseJsonSchema: STORY_RESPONSE_SCHEMA,
    maxOutputTokens,
  });
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
    if (!isTrustedOrderWorker(req) && !limit.allowed) {
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
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: true, data: fallback });
      }

      if (data.type === "monster") {
        const fallback = buildNightShieldContent({ name: data.name || "copilul", age: data.age, fear: data.monster || "frica de intuneric", location: data.context, helper: data.interest, ritual: data.tone });
        logTelemetry("pmm_generation_completed", { product, result: "success", generationMode: "fallback", durationMs: Date.now() - startedAt, aiProvider: getAiProvider() });
        return NextResponse.json({ success: true, data: fallback });
      }

      if (data.type === "emergency") {
        const fallback = buildPatienceKitContent({ name: data.name || "copilul", age: data.age || "5", context: data.context || "o perioadă de așteptare", interest: data.interest, duration: data.duration, difficulty: data.difficulty || recommendedDifficulty(data.age || "5") });
        logTelemetry("pmm_generation_completed", { product, result: "success", generationMode: "fallback", durationMs: Date.now() - startedAt, aiProvider: getAiProvider() });
        return NextResponse.json({ success: true, data: fallback });
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
      const prompt = `Ești un autor român specializat în ritualuri de conectare pentru copii și părinți. Creezi Scutul de Noapte pentru copilul "${data.name}", în vârstă de ${data.age || "4"} ani, pentru serile în care apare: "${data.monster}".

Detalii alese de părinte:
- Locul care atrage atenția copilului: "${location}".
- Ce îl/o ajută de obicei: "${helper}".
- Ritualul de seară: "${ritual}".

Creează conținut profund personalizat, cald și lipsit de dramatizare. Numele, emoția, locul, ajutorul și ritualul trebuie să schimbe efectiv conținutul. Nu confirma existența monștrilor sau a unui pericol imaginar. Nu spune că obiectele au puteri reale, nu promite că frica dispare și nu folosi limbaj medical sau terapeutic. Nu include spray-uri, poțiuni ori ingrediente. Adultul este mereu reperul real de siguranță.

Respectă exact:
- storyTitle: titlu scurt, maximum 70 caractere, cu numele copilului.
- storyParagraphs: exact 3 paragrafe, fiecare 180-330 caractere. Povestea numește emoția, arată adultul prezent și se încheie cu un pas mic, realist.
- safePlaces: exact 3 repere concrete din camera sau rutina descrisă, maximum 100 caractere fiecare.
- ritualSteps: exact 3 obiecte cu title maximum 42 caractere și text maximum 180 caractere. Pașii sunt observare, respirație/alegere, încheiere împreună.
- breathingCue: maximum 300 caractere; respirație naturală, fără forțare, adaptată vârstei.
- courageFormula: maximum 300 caractere, cu numele copilului; acceptă emoția și cererea de ajutor.
- parentMessage: maximum 560 caractere, practic și empatic; confirmă emoția fără să confirme pericolul.
- bedsideMessage: maximum 280 caractere, ușor de recitit seara.
- certificateLine: maximum 260 caractere, laudă exersarea pașilor, nu absența fricii.

Returnează doar JSON valid conform schemei, fără Markdown.`;

      const generated = await generateWithModelFallback({
        prompt,
        responseJsonSchema: MONSTER_RESPONSE_SCHEMA,
        maxOutputTokens: 1800,
        temperature: 0.72,
      });
      if ("error" in generated) {
        const fallback = buildNightShieldContent({ name: data.name || "copilul", age: data.age, fear: data.monster || "frica de intuneric", location, helper, ritual });
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: true, data: fallback, warning: generated.error });
      }
      const fallback = buildNightShieldContent({ name: data.name || "copilul", age: data.age, fear: data.monster || "frica de intuneric", location, helper, ritual });
      let result = fallback;
      let generationMode: "ai" | "fallback" = "ai";
      try { result = sanitizeNightShieldContent(parseJsonObject(generated.text), fallback); }
      catch { generationMode = "fallback"; }

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode,
        durationMs: Date.now() - startedAt,
        aiProvider: getAiProvider(),
        model: generated.model,
      });
      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const theme = getStoryTheme(data.theme);
      const themeLabel = theme.label;
      const { prompt, maxOutputTokens, minWords, continuationParagraphTarget } = buildStoryPrompt(data, themeLabel);

      const generated = await generateStoryWithModelFallback({
        prompt,
        maxOutputTokens,
      });
      if ("error" in generated) {
        logTelemetry("pmm_story_text_failed", {
          product,
          result: "error",
          errorCode: "ai_error",
          durationMs: Date.now() - startedAt,
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
        });
        const fallback = buildStableStoryPayload(data, theme);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({
          success: true,
          data: fallback,
          warning: generated.error,
        });
      }
      let result: ReturnType<typeof sanitizeStoryPayload>;
      try {
        result = sanitizeStoryPayload(parseStoryJson(generated.text), data.name || "Eroul", themeLabel);
      } catch {
        logTelemetry("pmm_story_text_failed", {
          product,
          result: "error",
          errorCode: "invalid_request",
          durationMs: Date.now() - startedAt,
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
          model: generated.model,
        });
        const fallback = buildStableStoryPayload(data, theme);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({
          success: true,
          data: fallback,
          warning: "Răspunsul AI nu a putut fi citit ca JSON.",
        });
      }

      // Gemini can occasionally stop early even with a generous output limit. Add a coherent
      // second act instead of returning a thin story that leaves most PDF pages blank.
      let wordCount = getWordCount(result.text);
      let continuationCount = 0;
      const isLongStory = data.storyLength === "long";

      logTelemetry("pmm_story_text_completed", {
        product,
        result: "success",
        generationMode: "ai",
        durationMs: Date.now() - startedAt,
        wordCount,
        storyLength: data.storyLength,
        aiProvider: getAiProvider(),
        model: generated.model,
      });

      // A long story that stops around 800 words is not a usable four-page edition. In that
      // case the complete in-app fallback is both faster and more reliable than stacking long
      // retry requests behind an already incomplete answer.
      if (isLongStory && wordCount < 1_100) {
        const fallback = buildStableStoryPayload(data, theme);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
          model: generated.model,
        });
        return NextResponse.json({ success: true, data: { ...fallback, model: generated.model } });
      }

      const continuationLimit = 1;
      for (let attempt = 0; wordCount < minWords && attempt < continuationLimit; attempt += 1) {
        const targetWords = isLongStory
          ? Math.min(600, Math.max(420, minWords - wordCount + 80))
          : Math.max(300, minWords - wordCount + 160);
        const continuation = await generateStoryWithModelFallback({
          prompt: buildStoryContinuationPrompt({
            data,
            themeLabel,
            title: result.title,
            storySoFar: result.text,
            targetWords,
            paragraphTarget: continuationParagraphTarget,
          }),
          maxOutputTokens,
        });

        if ("error" in continuation) {
          logTelemetry("pmm_story_continuation_failed", {
            product,
            result: "error",
            errorCode: "ai_error",
            durationMs: Date.now() - startedAt,
            storyLength: data.storyLength,
            aiProvider: getAiProvider(),
            attempt: attempt + 1,
          });
          break;
        }

        try {
          const addition = sanitizeStoryPayload(parseStoryJson(continuation.text), data.name || "Eroul", themeLabel).text;
          if (getWordCount(addition) < (isLongStory ? 240 : 400)) {
            logTelemetry("pmm_story_continuation_failed", {
              product,
              result: "rejected",
              errorCode: "invalid_request",
              durationMs: Date.now() - startedAt,
              storyLength: data.storyLength,
              aiProvider: getAiProvider(),
              model: continuation.model,
              attempt: attempt + 1,
            });
            break;
          }
          result = { ...result, text: `${result.text}\n\n${addition}` };
          wordCount = getWordCount(result.text);
          continuationCount += 1;
          logTelemetry("pmm_story_continuation_completed", {
            product,
            result: "success",
            generationMode: "ai",
            durationMs: Date.now() - startedAt,
            wordCount: getWordCount(addition),
            storyLength: data.storyLength,
            aiProvider: getAiProvider(),
            model: continuation.model,
            attempt: attempt + 1,
          });
        } catch {
          logTelemetry("pmm_story_continuation_failed", {
            product,
            result: "error",
            errorCode: "invalid_request",
            durationMs: Date.now() - startedAt,
            storyLength: data.storyLength,
            aiProvider: getAiProvider(),
            model: continuation.model,
            attempt: attempt + 1,
          });
          break;
        }
      }

      if (isLongStory && wordCount < minWords) {
        const fallback = buildStableStoryPayload(data, theme);
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          wordCount: getWordCount(fallback.text),
          storyLength: data.storyLength,
          aiProvider: getAiProvider(),
          model: generated.model,
          continuationCount,
        });
        return NextResponse.json({ success: true, data: { ...fallback, model: generated.model } });
      }

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode: "ai",
        durationMs: Date.now() - startedAt,
        wordCount,
        storyLength: data.storyLength,
        aiProvider: getAiProvider(),
        model: generated.model,
        continuationCount,
      });
      return NextResponse.json({
        success: true,
        data: { ...result, model: generated.model },
        ...(wordCount < minWords ? { warning: "Povestea este mai scurtă decât ținta din cauza unui răspuns AI incomplet." } : {}),
      });
    }

    if (data.type === "emergency") {
      const difficulty = data.difficulty || recommendedDifficulty(data.age || "5");
      const prompt = `Ești un educator creativ român. Personalizezi conținutul unei Truse de Răbdare care va fi tipărită pe A4 și folosită imediat de un părinte cu copilul.

Datele copilului:
- Nume: ${data.name}
- Vârstă: ${data.age || "nespecificată"} ani
- Locul/situația: ${data.context || "o perioadă de așteptare"}
- Interes preferat: ${data.interest || "imaginația și joaca"}
- Timp disponibil: ${data.duration || "10-20 minute"}
- Nivel ales: ${difficulty}

Scrie numai în română naturală, caldă și clară. Toate activitățile trebuie să fie sigure, liniștite, posibile cu hârtie și creion sau doar verbal, chiar în locul indicat. Nu propune alergat, folosirea obiectelor altor persoane, atingerea echipamentelor ori deranjarea celor din jur. Leagă interesul copilului firesc de cel puțin patru elemente. Evită pedepsele, competiția și promisiunile de tipul „vei sta cuminte”. Nu genera labirintul și jocul de diferențe; acestea sunt adăugate separat din structuri validate.

Respectă exact limitele:
- missionTitle: 2-8 cuvinte, maximum 70 caractere.
- missionNote: o propoziție, maximum 220 caractere, specifică locului, duratei și nivelului.
- radar: exact 6 indicii care chiar pot fi observate în acel loc, maximum 80 caractere fiecare.
- drawingPrompt: o provocare personalizată, 1-2 propoziții și maximum 210 caractere.
- coloringPrompt: o provocare care folosește emblema tipărită, 1-2 propoziții și maximum 190 caractere.
- verbalPrompts: exact 6 jocuri scurte pentru părinte și copil, maximum 105 caractere fiecare, fără materiale.
- cards: exact 8 comenzi complete, foarte scurte, maximum 65 caractere fiecare.
- levelChallenges: easy, medium și advanced au fiecare exact 3 provocări. Fiecare are maximum 105 caractere, este o propoziție completă și este sigură în locul ales. Nivelurile cresc prin atenție și număr de pași, nu prin presiune.

Nu încheia niciun text cu puncte de suspensie și nu tăia propozițiile. Dacă interesul preferat este o listă lungă, alege firesc cel mult două elemente potrivite activității.

Returnează exclusiv un obiect JSON valid, conform schemei cerute. Fără Markdown, fără explicații în afara JSON-ului.`;

      const generated = await generateWithModelFallback({
        prompt,
        responseJsonSchema: EMERGENCY_RESPONSE_SCHEMA,
        maxOutputTokens: 2200,
        temperature: 0.76,
      });
      if ("error" in generated) {
        const fallback = buildPatienceKitContent({ name: data.name || "copilul", age: data.age || "5", context: data.context || "o perioadă de așteptare", interest: data.interest, duration: data.duration, difficulty });
        logTelemetry("pmm_generation_completed", {
          product,
          result: "success",
          generationMode: "fallback",
          durationMs: Date.now() - startedAt,
          aiProvider: getAiProvider(),
        });
        return NextResponse.json({ success: true, data: fallback, warning: generated.error });
      }
      const fallback = buildPatienceKitContent({ name: data.name || "copilul", age: data.age || "5", context: data.context || "o perioadă de așteptare", interest: data.interest, duration: data.duration, difficulty });
      let result = fallback;
      let generationMode: "ai" | "fallback" = "ai";
      try { result = sanitizePatienceKitContent(parseJsonObject(generated.text), fallback); }
      catch { generationMode = "fallback"; }

      logTelemetry("pmm_generation_completed", {
        product,
        result: "success",
        generationMode,
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
