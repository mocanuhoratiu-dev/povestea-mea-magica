export type NightShieldStep = { title: string; text: string };

export type NightShieldContent = {
  storyTitle: string;
  storyParagraphs: string[];
  safePlaces: string[];
  ritualSteps: NightShieldStep[];
  breathingCue: string;
  courageFormula: string;
  parentMessage: string;
  bedsideMessage: string;
  certificateLine: string;
};

export type NightShieldInput = {
  name: string;
  age?: string;
  fear: string;
  fearLabel?: string;
  location?: string;
  helper?: string;
  ritual?: string;
};

const fearDefaults: Record<string, { label: string; image: string }> = {
  "umbrele noptii": { label: "umbrele nopții", image: "umbrele care se schimbă odată cu lumina" },
  "monstrul de sub pat": { label: "teama de sub pat", image: "spațiul necunoscut de sub pat" },
  "zgomotele ciudate": { label: "zgomotele nopții", image: "sunetele obișnuite ale casei" },
  "dulapul scartaitor": { label: "dulapul care pare diferit noaptea", image: "hainele și formele din dulap" },
  "frica de intuneric": { label: "întunericul", image: "camera atunci când lumina se stinge" },
  "vise urate": { label: "visele neplăcute", image: "gândurile rămase după un vis greu" },
};

function clean(value: unknown, fallback: string, maxLength: number) {
  const normalized = String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim() || fallback;
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function list(value: unknown, fallback: string[], count: number, maxLength: number) {
  const candidate = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => clean(candidate[index], fallback[index], maxLength));
}

export function buildNightShieldContent(input: NightShieldInput): NightShieldContent {
  const defaults = fearDefaults[input.fear] || fearDefaults["frica de intuneric"];
  const name = clean(input.name, "micul erou", 34);
  const fear = clean(input.fearLabel, defaults.label, 72).toLocaleLowerCase("ro-RO");
  const location = clean(input.location, "camera și colțul care pare diferit seara", 90);
  const helper = clean(input.helper, "o îmbrățișare și lumina de veghe", 90);
  const ritual = clean(input.ritual, "o poveste scurtă și trei respirații lente", 100);
  const age = clean(input.age, "4", 2);

  return {
    storyTitle: `${name} și lumina care rămâne`,
    storyParagraphs: [
      `Într-o seară liniștită, ${name} a privit spre ${location}. ${defaults.image} păreau mai mari decât ziua, iar gândul despre ${fear} s-a apropiat, ca o emoție care cerea să fie ascultată.`,
      `Un adult s-a așezat lângă ${name} și a spus: „Te cred. Sunt aici.” Împreună au privit camera, au numit trei lucruri cunoscute și au ales ${helper} ca semn al serii lor.`,
      `Apoi au urmat ritualul lor: ${ritual}. Teama nu trebuia să dispară pe loc. Era suficient ca ${name} să respire, să ceară ajutor și să știe că poate parcurge seara pas cu pas.`,
    ],
    safePlaces: [
      clean(location, "lângă pat", 90),
      `Lângă adultul care oferă ${helper}`,
      "Lângă pat, în locul ales pentru ritual",
    ],
    ritualSteps: [
      { title: "Privesc și numesc", text: `Privesc spre ${location} și numesc trei lucruri obișnuite pe care le recunosc.` },
      { title: "Respir și aleg", text: `Pun o mână pe piept, respir încet și aleg ${helper}.` },
      { title: "Încheiem împreună", text: `Urmăm ritualul nostru: ${ritual}, apoi spunem formula de curaj fără grabă.` },
    ],
    breathingCue: `Pentru ${name}, ${age} ani: inspirăm încet cât numărăm 1, 2, 3; facem o pauză mică; expirăm cât numărăm 1, 2, 3, 4. Repetăm de trei ori, fără să forțăm respirația.`,
    courageFormula: `${name} poate simți teamă și poate rămâne în siguranță. Camera este cunoscută, adultul este aproape, iar fiecare respirație ne ajută să facem următorul pas mic.`,
    parentMessage: `Ascultă înainte să explici. Confirmă emoția, fără să confirmi pericolul: „Înțeleg că ${fear} pare greu acum. Sunt aici.” Priviți împreună spre ${location}, numiți ce este real și lăsați-l pe ${name} să aleagă între două gesturi simple, precum ${helper} sau ritualul vostru obișnuit.`,
    bedsideMessage: `Sunt ${name}. Pot să privesc, să respir și să cer ajutor. Pot să mă bazez pe adultul meu, iar seara poate veni încet.`,
    certificateLine: `${name} a exersat să numească ${fear}, să ceară ajutor și să facă ritualul de seară împreună cu un adult.`,
  };
}

export function sanitizeNightShieldContent(value: unknown, fallback: NightShieldContent): NightShieldContent {
  const content = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<NightShieldContent> : {};
  const generatedSteps = Array.isArray(content.ritualSteps) ? content.ritualSteps : [];
  return {
    storyTitle: clean(content.storyTitle, fallback.storyTitle, 70),
    storyParagraphs: list(content.storyParagraphs, fallback.storyParagraphs, 3, 360),
    safePlaces: list(content.safePlaces, fallback.safePlaces, 3, 100),
    ritualSteps: Array.from({ length: 3 }, (_, index) => ({
      title: clean(generatedSteps[index]?.title, fallback.ritualSteps[index].title, 42),
      text: clean(generatedSteps[index]?.text, fallback.ritualSteps[index].text, 180),
    })),
    breathingCue: clean(content.breathingCue, fallback.breathingCue, 300),
    courageFormula: clean(content.courageFormula, fallback.courageFormula, 300),
    parentMessage: clean(content.parentMessage, fallback.parentMessage, 560),
    bedsideMessage: clean(content.bedsideMessage, fallback.bedsideMessage, 280),
    certificateLine: clean(content.certificateLine, fallback.certificateLine, 260),
  };
}

export function nightShieldNarration(name: string, content: NightShieldContent) {
  return [
    `Bună, ${clean(name, "mic erou", 34)}. Sunt Lumi și facem împreună ritualul tău de seară.`,
    ...content.ritualSteps.map((step, index) => `Pasul ${index + 1}. ${step.title}. ${step.text}`),
    `Acum respirăm. ${content.breathingCue}`,
    `Iar la final spunem împreună: ${content.courageFormula}`,
    "Noapte liniștită. Un adult este aproape de tine.",
  ].join(" ");
}
