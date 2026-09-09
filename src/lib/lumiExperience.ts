export type LumiVisualState =
  | "greeting"
  | "curious"
  | "guiding"
  | "creating"
  | "encouraging"
  | "celebrating";

export type LumiGenerationPhase =
  | "idle"
  | "character"
  | "story"
  | "illustrations"
  | "layout"
  | "ready"
  | "error";

export type LumiGenerationDetail = {
  phase: LumiGenerationPhase;
  progress: number;
  message?: string;
};

export const lumiStateCopy: Record<LumiVisualState, { label: string; short: string }> = {
  greeting: { label: "Lumi te salută", short: "Începem cu eroul poveștii." },
  curious: { label: "Lumi este curioasă", short: "Fiecare detaliu face povestea mai personală." },
  guiding: { label: "Lumi te ghidează", short: "Alegem împreună, pas cu pas." },
  creating: { label: "Lumi creează", short: "Povestea începe să prindă viață." },
  encouraging: { label: "Lumi verifică", short: "Mai avem un singur pas." },
  celebrating: { label: "Lumi sărbătorește", short: "Povestea voastră este gata." },
};

export const lumiGenerationCopy: Record<LumiGenerationPhase, { title: string; message: string; visualState: LumiVisualState }> = {
  idle: { title: "Pregătim începutul", message: "Lumi adună toate alegerile voastre.", visualState: "guiding" },
  character: { title: "Păstrez personajul", message: "Fixez chipul, ținuta și detaliile care îl fac recognoscibil.", visualState: "creating" },
  story: { title: "Scriu aventura", message: "Transform alegerile voastre într-un fir de poveste coerent.", visualState: "creating" },
  illustrations: { title: "Pregătesc ilustrațiile", message: "Construiesc scene distincte, păstrând același erou.", visualState: "creating" },
  layout: { title: "Așez povestea în pagini", message: "Echilibrez textul și imaginile pentru o carte ușor de răsfoit.", visualState: "encouraging" },
  ready: { title: "Povestea voastră este gata", message: "Răsfoiți mostra și verificați fiecare detaliu înainte de plată.", visualState: "celebrating" },
  error: { title: "Mai încercăm o dată", message: "Alegerile sunt păstrate. Putem pregăti o mostră nouă fără să o luați de la capăt.", visualState: "encouraging" },
};

export function lumiStateForGuideStep(step: number, totalSteps: number): LumiVisualState {
  if (step >= totalSteps) return "encouraging";
  if (step === 0) return "greeting";
  if (step === 1 || step === 3 || step === 4 || step === 6) return "curious";
  return "guiding";
}

export function lumiContextPrompt(step: number, childName = "") {
  const name = childName.trim();
  const prompts = [
    "Începem cu eroul poveștii. Te ajut să-i păstrăm chipul recognoscibil.",
    name ? `Acum alegem lumea în care intră ${name}.` : "Acum alegem lumea în care începe aventura.",
    "Un detaliu adevărat din familie poate transforma întreaga poveste.",
    name ? `Sunt gata să pregătesc mostra pentru ${name}.` : "Sunt gata să pregătesc mostra personalizată.",
  ];
  return prompts[Math.max(0, Math.min(prompts.length - 1, step))];
}

export function clampLumiProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress)));
}
