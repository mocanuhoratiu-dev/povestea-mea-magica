import {
  albumCompanionOptions,
  albumArtStyleOptions,
  albumLessonOptions,
  albumMoodOptions,
  albumWorldOptions,
  type AlbumConfiguration,
  type AlbumGenerationInput,
  type AlbumOrderOutput,
  type AlbumPanelPosition,
  type AlbumPanelTone,
} from "@/lib/album/types";

const albumStages = ["planning", "cover", "scenes", "activity", "rendering", "delivery"] as const;
const panelPositions = ["top-left", "top-right", "bottom-left", "bottom-right", "bottom"] as const;
const panelTones = ["cream", "navy"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function optionExists<T extends readonly { id: string }[]>(options: T, value: string) {
  return options.some((option) => option.id === value);
}

export function readAlbumConfiguration(value: unknown): AlbumConfiguration | null {
  if (!isRecord(value) || !isRecord(value.generation)) return null;
  const raw = value.generation;
  if (raw.type !== "album") return null;

  const generation: AlbumGenerationInput = {
    type: "album",
    name: clean(raw.name, 40),
    age: clean(raw.age, 2),
    hairStyle: clean(raw.hairStyle, 48),
    hairColor: clean(raw.hairColor, 36),
    eyeColor: clean(raw.eyeColor, 36) || "căprui",
    skinTone: clean(raw.skinTone, 36),
    outfit: clean(raw.outfit, 100) || `o ținută în culoarea ${clean(raw.favoriteColor, 36) || "preferată"}`,
    appearanceDetail: clean(raw.appearanceDetail, 240),
    favoriteColor: clean(raw.favoriteColor, 36),
    world: clean(raw.world, 32),
    companion: clean(raw.companion, 80),
    lesson: clean(raw.lesson, 80),
    mood: clean(raw.mood, 60) || albumMoodOptions[0],
    artStyle: clean(raw.artStyle, 80) || albumArtStyleOptions[0],
    personalDetail: clean(raw.personalDetail, 240),
    storyContext: clean(raw.storyContext, 700),
  };

  if (!generation.name || !/^(?:[2-9]|10)$/.test(generation.age)) return null;
  if (!generation.hairStyle || !generation.hairColor || !generation.skinTone || !generation.favoriteColor) return null;
  if (!optionExists(albumWorldOptions, generation.world)) return null;
  if (!albumCompanionOptions.includes(generation.companion as (typeof albumCompanionOptions)[number])) return null;
  if (!albumLessonOptions.includes(generation.lesson as (typeof albumLessonOptions)[number])) return null;
  if (!albumMoodOptions.includes(generation.mood as (typeof albumMoodOptions)[number])) return null;
  if (!albumArtStyleOptions.includes(generation.artStyle as (typeof albumArtStyleOptions)[number])) return null;

  return {
    generation,
    dedication: clean(value.dedication, 320),
    dedicationFrom: clean(value.dedicationFrom, 80),
  };
}

export function readAlbumOutput(value: unknown): AlbumOrderOutput | null {
  if (!isRecord(value) || value.kind !== "illustrated-album" || !isRecord(value.assets) || !isRecord(value.progress)) return null;
  const assets = value.assets;
  const progress = value.progress;
  if (!albumStages.includes(progress.stage as (typeof albumStages)[number])) return null;
  if (!Number.isInteger(progress.current) || !Number.isInteger(progress.total)) return null;
  if (!Array.isArray(assets.scenes) || assets.scenes.length !== 13 || !assets.scenes.every((item) => typeof item === "string")) return null;

  let plan: AlbumOrderOutput["plan"];
  if (value.plan !== undefined) {
    if (!isRecord(value.plan) || !Array.isArray(value.plan.scenes) || value.plan.scenes.length !== 13) return null;
    const scenes = value.plan.scenes.map((scene) => {
      if (!isRecord(scene)) return null;
      const panelPosition = clean(scene.panelPosition, 20) as AlbumPanelPosition;
      const panelTone = clean(scene.panelTone, 10) as AlbumPanelTone;
      const parsed = {
        heading: clean(scene.heading, 70),
        text: clean(scene.text, 650),
        imagePrompt: clean(scene.imagePrompt, 3_200),
        panelPosition,
        panelTone,
      };
      if (!parsed.heading || !parsed.text || !parsed.imagePrompt || !panelPositions.includes(panelPosition) || !panelTones.includes(panelTone)) return null;
      return parsed;
    });
    if (scenes.some((scene) => !scene)) return null;
    const title = clean(value.plan.title, 100);
    const characterBible = clean(value.plan.characterBible, 2_400);
    const characterPrompt = clean(value.plan.characterPrompt, 3_200) || `${characterBible} Full-body character reference on a simple light background, no text.`;
    const coverPrompt = clean(value.plan.coverPrompt, 3_200);
    const coloringPrompt = clean(value.plan.coloringPrompt, 3_200);
    const differencesPrompt = clean(value.plan.differencesPrompt, 3_200) || coloringPrompt;
    const textModel = clean(value.plan.textModel, 120);
    if (!title || !characterBible || !coverPrompt || !coloringPrompt || !textModel) return null;
    plan = { title, characterBible, characterPrompt, coverPrompt, coloringPrompt, differencesPrompt, textModel, scenes: scenes as NonNullable<typeof scenes[number]>[] };
  }

  let documents: AlbumOrderOutput["documents"];
  if (value.documents !== undefined) {
    if (!isRecord(value.documents)) return null;
    const storybook = clean(value.documents.storybook, 500);
    const activityBooklet = clean(value.documents.activityBooklet, 500);
    if (!storybook || !activityBooklet) return null;
    documents = { storybook, activityBooklet };
  }

  return {
    kind: "illustrated-album",
    ...(clean(value.previewTitle, 100) ? { previewTitle: clean(value.previewTitle, 100) } : {}),
    ...(plan ? { plan } : {}),
    assets: {
      ...(typeof assets.characterReference === "string" && assets.characterReference ? { characterReference: assets.characterReference } : {}),
      ...(typeof assets.cover === "string" && assets.cover ? { cover: assets.cover } : {}),
      scenes: [...assets.scenes],
      ...(typeof assets.coloring === "string" && assets.coloring ? { coloring: assets.coloring } : {}),
      ...(typeof assets.differences === "string" && assets.differences ? { differences: assets.differences } : {}),
    },
    ...(documents ? { documents } : {}),
    progress: {
      stage: progress.stage as AlbumOrderOutput["progress"]["stage"],
      current: Number(progress.current),
      total: Number(progress.total),
    },
    imageModels: Array.isArray(value.imageModels)
      ? value.imageModels.filter((item): item is string => typeof item === "string").slice(0, 8)
      : [],
  };
}

export function albumWorldLabel(world: string) {
  return albumWorldOptions.find((option) => option.id === world)?.label || "o lume magică";
}
