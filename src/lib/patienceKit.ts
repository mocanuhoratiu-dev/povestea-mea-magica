export type PatienceDifficulty = "easy" | "medium" | "advanced";

export type PatienceKitContent = {
  missionTitle: string;
  missionNote: string;
  radar: string[];
  drawingPrompt: string;
  coloringPrompt: string;
  verbalPrompts: string[];
  cards: string[];
  levelChallenges: { easy: string[]; medium: string[]; advanced: string[] };
};

export type PatienceKitInput = {
  name: string;
  age: string;
  context: string;
  contextLabel?: string;
  interest?: string;
  duration?: string;
  difficulty?: PatienceDifficulty;
};

const contextDefaults: Record<string, { title: string; objects: string[] }> = {
  "la restaurant, asteptand mancarea": { title: "Misiunea Mesei Curioase", objects: ["un obiect rotund", "trei culori diferite", "un sunet de tacâmuri", "un număr", "ceva moale", "un obiect lucios"] },
  "la un drum lung cu masina": { title: "Expediția Kilometrilor", objects: ["un indicator albastru", "o mașină rar colorată", "un camion", "un pod", "un copac foarte înalt", "un nor cu formă interesantă"] },
  "in sala de asteptare la doctor": { title: "Misiunea Curajului Calm", objects: ["un ceas", "un afiș", "un scaun colorat", "o plantă", "un număr", "un obiect care ajută oamenii"] },
  "in casa, ploua afara": { title: "Laboratorul Ploii", objects: ["o picătură pe geam", "un obiect moale", "o umbră", "un sunet al ploii", "ceva cald", "un lucru care începe cu P"] },
  "in aeroport sau avion": { title: "Expediția Norilor", objects: ["un panou cu numere", "o valiză colorată", "o uniformă", "o aripă", "un semn", "un sunet de roți"] },
  "la coada sau institutii": { title: "Agentul Rândului Calm", objects: ["un număr afișat", "un obiect albastru", "un scaun liber", "o plantă", "un semn cu litere", "ceva care se mișcă încet"] },
};

function clean(value: unknown, fallback: string, maxLength: number) {
  const normalized = String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim() || fallback;
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength).trim();
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped;
}

function summarizeInterest(value: unknown) {
  const normalized = clean(value, "lucrurile preferate", 100);
  const parts = normalized
    .split(/[,;]|\s+și\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => clean(part, "", 30));

  return parts.length > 0 ? parts.join(" și ") : "lucrurile preferate";
}

function list(value: unknown, fallback: string[], count: number, maxLength: number) {
  const candidate = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => clean(candidate[index], fallback[index], maxLength));
}

export function recommendedDifficulty(age: string): PatienceDifficulty {
  const value = Number.parseInt(age, 10) || 4;
  return value <= 4 ? "easy" : value <= 7 ? "medium" : "advanced";
}

export function buildPatienceKitContent(input: PatienceKitInput): PatienceKitContent {
  const base = contextDefaults[input.context] || contextDefaults["la restaurant, asteptand mancarea"];
  const name = clean(input.name, "micul explorator", 34);
  const interest = summarizeInterest(input.interest);
  const context = clean(input.contextLabel, input.context, 70);
  const duration = clean(input.duration, "10-20 minute", 24);
  const difficulty = input.difficulty || recommendedDifficulty(input.age);
  const difficultyLabel = difficulty === "easy" ? "Explorator" : difficulty === "advanced" ? "Maestru" : "Detectiv";

  return {
    missionTitle: `${base.title} a lui ${name}`,
    missionNote: `${context}, aproximativ ${duration}, cu activități potrivite vârstei de ${clean(input.age, "4", 2)} ani și nivelului ${difficultyLabel}.`,
    radar: base.objects,
    drawingPrompt: `Desenează cum ar arăta ${context} dacă s-ar transforma într-o lume inspirată de ${interest}. Adaugă-l pe ${name} drept ghid al expediției.`,
    coloringPrompt: `Creează culorile emblemei lui ${name}. Alege o culoare pentru curaj, una pentru răbdare și una pentru ${interest}.`,
    verbalPrompts: [
      `Găsiți pe rând câte un lucru care începe cu aceeași literă ca ${name}.`,
      `Inventați trei superputeri potrivite pentru ${interest}.`,
      `Descrie un obiect din jur fără să-i spui numele. Adultul ghicește.`,
      `Spune o poveste din cinci propoziții în care apare locul în care sunteți.`,
      `Alegeți un sunet și imaginați-vă ce personaj l-ar putea face.`,
      `Numiți pe rând câte un lucru mic pentru care sunteți recunoscători.`,
    ],
    cards: [
      "Găsește trei cercuri", "Numără cinci sunete", "Inventează un nume", "Desenează cu degetul în aer",
      `Spune ceva despre ${interest}`, "Găsește o literă", "Alege o culoare", "Continuă povestea adultului",
    ],
    levelChallenges: {
      easy: ["Găsește două obiecte de aceeași culoare.", "Imită în liniște o expresie veselă.", "Numără până la zece împreună cu adultul."],
      medium: ["Găsește trei obiecte care au forme diferite.", "Inventează o propoziție cu trei cuvinte alese de adult.", "Observă ce s-a schimbat după două minute."],
      advanced: ["Construiește o poveste folosind cinci obiecte din jur.", "Estimează un minut, apoi verifică împreună cu adultul.", "Creează o regulă nouă pentru un joc verbal."],
    },
  };
}

export function sanitizePatienceKitContent(value: unknown, fallback: PatienceKitContent): PatienceKitContent {
  const content = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<PatienceKitContent> : {};
  const levels = content.levelChallenges && typeof content.levelChallenges === "object" ? content.levelChallenges : fallback.levelChallenges;
  return {
    missionTitle: clean(content.missionTitle, fallback.missionTitle, 70),
    missionNote: clean(content.missionNote, fallback.missionNote, 220),
    radar: list(content.radar, fallback.radar, 6, 80),
    drawingPrompt: clean(content.drawingPrompt, fallback.drawingPrompt, 260),
    coloringPrompt: clean(content.coloringPrompt, fallback.coloringPrompt, 240),
    verbalPrompts: list(content.verbalPrompts, fallback.verbalPrompts, 6, 150),
    cards: list(content.cards, fallback.cards, 8, 90),
    levelChallenges: {
      easy: list(levels.easy, fallback.levelChallenges.easy, 3, 150),
      medium: list(levels.medium, fallback.levelChallenges.medium, 3, 150),
      advanced: list(levels.advanced, fallback.levelChallenges.advanced, 3, 150),
    },
  };
}

export const patienceDifferenceAnswers = [
  "Luna devine stea.",
  "Un nor în plus apare în dreapta.",
  "Steagul dispare de pe turn.",
  "Fereastra rotundă devine pătrată.",
  "O roată lipsește de la vehicul.",
];
