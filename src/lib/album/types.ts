export const albumWorldOptions = [
  { id: "forest", label: "Pădurea luminilor" },
  { id: "stars", label: "Observatorul stelelor" },
  { id: "ocean", label: "Oceanul de cristal" },
  { id: "clouds", label: "Orașul din nori" },
  { id: "dinosaurs", label: "Valea dinozaurilor blânzi" },
  { id: "castle", label: "Castelul anotimpurilor" },
  { id: "library", label: "Biblioteca poveștilor vii" },
  { id: "garden", label: "Grădina lucrurilor mici" },
  { id: "aurora", label: "Ținutul aurorei boreale" },
  { id: "inventions", label: "Atelierul invențiilor magice" },
  { id: "custom", label: "O lume inventată de voi" },
] as const;

export const albumLessonOptions = [
  "Curaj și încredere",
  "Prietenie și bunătate",
  "Răbdare și perseverență",
  "Înțelegerea emoțiilor",
  "Curiozitate și descoperire",
  "Grija față de natură",
  "Puterea imaginației",
  "Încrederea de a fi diferit",
] as const;

export const albumCompanionOptions = [
  "O steluță rătăcită",
  "Un pui de vulpe",
  "Un dragon cât o pisică",
  "Un iepuraș de nori",
  "O vidră cu mustăți argintii",
  "O bufniță care colecționează povești",
  "Un roboțel curios",
  "Un pui de dinozaur blând",
  "O pisică ce luminează în întuneric",
  "Un căluț de mare zburător",
] as const;

export const albumMoodOptions = [
  "Visător și tandru",
  "Aventuros și luminos",
  "Amuzant și energic",
  "Misterios, dar blând",
] as const;

export const albumArtStyleOptions = [
  "Acuarelă cinematografică",
  "Guașă pictată manual",
  "Ilustrație 3D de poveste",
  "Creioane colorate premium",
] as const;

export type AlbumPanelPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom";
export type AlbumPanelTone = "cream" | "navy";
export type AlbumSceneLayout = "cinematic" | "image-left" | "image-right";
export type AlbumReferenceMode = "description" | "photo";

export type AlbumGenerationInput = {
  type: "album";
  name: string;
  age: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: string;
  appearanceDetail: string;
  favoriteColor: string;
  world: string;
  customWorld: string;
  companion: string;
  secondaryCharacterName: string;
  secondaryCharacterRole: string;
  secondaryCharacterAppearance: string;
  lesson: string;
  mood: string;
  artStyle: string;
  personalDetail: string;
  storyContext: string;
  referenceMode: AlbumReferenceMode;
};

export type AlbumConfiguration = {
  generation: AlbumGenerationInput;
  dedication: string;
  dedicationFrom: string;
};

export type AlbumScene = {
  heading: string;
  text: string;
  imagePrompt: string;
  panelPosition: AlbumPanelPosition;
  panelTone: AlbumPanelTone;
  layout: AlbumSceneLayout;
  editorialRole: string;
  continuityNotes: string;
};

export type AlbumStoryBible = {
  version: 3;
  premise: string;
  childRole: string;
  emotionalNeed: string;
  narrativePromise: string;
  recurringMotif: string;
  companionRole: string;
  worldRules: string[];
  arc: {
    opening: string;
    catalyst: string;
    turningPoint: string;
    resolution: string;
  };
  characterLock: {
    referenceMode: AlbumReferenceMode;
    canonicalDescription: string;
    immutableTraits: string[];
    outfitPalette: string;
    companionDescription: string;
    anchorAsset: "cover";
  };
  visualLanguage: {
    palette: string;
    lighting: string;
    texture: string;
    compositionRules: string[];
    forbidden: string[];
  };
};

export type AlbumPlan = {
  title: string;
  storyBible: AlbumStoryBible;
  characterBible: string;
  characterPrompt: string;
  coverPrompt: string;
  coloringPrompt: string;
  differencesPrompt: string;
  scenes: AlbumScene[];
  textModel: string;
};

export type AlbumQualityResult = {
  asset: string;
  mode: "ai" | "deterministic";
  accepted: boolean;
  identityScore: number;
  storyScore: number;
  technicalScore: number;
  checkedAt: string;
  notes: string[];
};

export type AlbumBudget = {
  textCalls: number;
  imageCalls: number;
  qualityCalls: number;
  maxTextCalls: number;
  maxImageCalls: number;
  maxQualityCalls: number;
  estimatedCostMicros: number;
  maxEstimatedCostMicros: number;
};

export type AlbumProgressStage = "planning" | "cover" | "scenes" | "activity" | "rendering" | "delivery";

export type AlbumOrderOutput = {
  kind: "illustrated-album";
  previewTitle?: string;
  plan?: AlbumPlan;
  assets: {
    sourceReference?: string;
    characterReference?: string;
    cover?: string;
    scenes: string[];
    coloring?: string;
    differences?: string;
  };
  documents?: {
    storybook: string;
    activityBooklet: string;
    narration?: string;
  };
  quality: AlbumQualityResult[];
  budget: AlbumBudget;
  progress: {
    stage: AlbumProgressStage;
    current: number;
    total: number;
  };
  imageModels: string[];
};
