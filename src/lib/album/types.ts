export const albumWorldOptions = [
  { id: "forest", label: "Pădurea luminilor" },
  { id: "stars", label: "Observatorul stelelor" },
  { id: "ocean", label: "Oceanul de cristal" },
  { id: "clouds", label: "Orașul din nori" },
  { id: "dinosaurs", label: "Valea dinozaurilor blânzi" },
  { id: "castle", label: "Castelul anotimpurilor" },
] as const;

export const albumLessonOptions = [
  "Curaj și încredere",
  "Prietenie și bunătate",
  "Răbdare și perseverență",
  "Înțelegerea emoțiilor",
  "Curiozitate și descoperire",
] as const;

export const albumCompanionOptions = [
  "O steluță rătăcită",
  "Un pui de vulpe",
  "Un dragon cât o pisică",
  "Un iepuraș de nori",
  "O vidră cu mustăți argintii",
] as const;

export type AlbumPanelPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom";
export type AlbumPanelTone = "cream" | "navy";

export type AlbumGenerationInput = {
  type: "album";
  name: string;
  age: string;
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  favoriteColor: string;
  world: string;
  companion: string;
  lesson: string;
  personalDetail: string;
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
};

export type AlbumPlan = {
  title: string;
  characterBible: string;
  coverPrompt: string;
  coloringPrompt: string;
  scenes: AlbumScene[];
  textModel: string;
};

export type AlbumProgressStage = "planning" | "cover" | "scenes" | "activity" | "rendering" | "delivery";

export type AlbumOrderOutput = {
  kind: "illustrated-album";
  plan?: AlbumPlan;
  assets: {
    cover?: string;
    scenes: string[];
    coloring?: string;
  };
  documents?: {
    storybook: string;
    activityBooklet: string;
  };
  progress: {
    stage: AlbumProgressStage;
    current: number;
    total: number;
  };
  imageModels: string[];
};

