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
  type AlbumReferenceMode,
  type AlbumSceneLayout,
  type AlbumStoryBible,
} from "@/lib/album/types";

const albumStages = ["planning", "cover", "scenes", "activity", "rendering", "delivery"] as const;
const panelPositions = ["top-left", "top-right", "bottom-left", "bottom-right", "bottom"] as const;
const panelTones = ["cream", "navy"] as const;
const sceneLayouts = ["cinematic", "image-left", "image-right"] as const;
const referenceModes = ["description", "photo"] as const;

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
    customWorld: clean(raw.customWorld, 280),
    companion: clean(raw.companion, 80),
    secondaryCharacterName: clean(raw.secondaryCharacterName, 40),
    secondaryCharacterRole: clean(raw.secondaryCharacterRole, 60),
    secondaryCharacterAppearance: clean(raw.secondaryCharacterAppearance, 180),
    lesson: clean(raw.lesson, 80),
    mood: clean(raw.mood, 60) || albumMoodOptions[0],
    artStyle: clean(raw.artStyle, 80) || albumArtStyleOptions[0],
    personalDetail: clean(raw.personalDetail, 240),
    storyContext: clean(raw.storyContext, 700),
    referenceMode: referenceModes.includes(raw.referenceMode as AlbumReferenceMode) ? raw.referenceMode as AlbumReferenceMode : "description",
  };

  if (!generation.name || !/^(?:[2-9]|10)$/.test(generation.age)) return null;
  if (!generation.hairStyle || !generation.hairColor || !generation.skinTone || !generation.favoriteColor) return null;
  if (!optionExists(albumWorldOptions, generation.world)) return null;
  if (generation.world === "custom" && !generation.customWorld) return null;
  if (generation.secondaryCharacterName && !generation.secondaryCharacterRole) return null;
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

function readStoryBible(value: unknown, characterBible: string, referenceMode: AlbumReferenceMode): AlbumStoryBible | null {
  if (!isRecord(value)) return null;
  const worldRules = Array.isArray(value.worldRules) ? value.worldRules.map((item) => clean(item, 180)).filter(Boolean).slice(0, 5) : [];
  const rawArc = isRecord(value.arc) ? value.arc : {};
  const rawLock = isRecord(value.characterLock) ? value.characterLock : {};
  const lockedReferenceMode = referenceModes.includes(rawLock.referenceMode as AlbumReferenceMode) ? rawLock.referenceMode as AlbumReferenceMode : referenceMode;
  const rawVisual = isRecord(value.visualLanguage) ? value.visualLanguage : {};
  const immutableTraits = Array.isArray(rawLock.immutableTraits) ? rawLock.immutableTraits.map((item) => clean(item, 160)).filter(Boolean).slice(0, 10) : [];
  const compositionRules = Array.isArray(rawVisual.compositionRules) ? rawVisual.compositionRules.map((item) => clean(item, 180)).filter(Boolean).slice(0, 8) : [];
  const forbidden = Array.isArray(rawVisual.forbidden) ? rawVisual.forbidden.map((item) => clean(item, 140)).filter(Boolean).slice(0, 10) : [];
  const bible: AlbumStoryBible = {
    version: 3,
    premise: clean(value.premise, 420),
    childRole: clean(value.childRole, 220),
    emotionalNeed: clean(value.emotionalNeed, 220),
    narrativePromise: clean(value.narrativePromise, 300),
    recurringMotif: clean(value.recurringMotif, 180),
    companionRole: clean(value.companionRole, 220),
    worldRules,
    arc: {
      opening: clean(rawArc.opening, 260),
      catalyst: clean(rawArc.catalyst, 260),
      turningPoint: clean(rawArc.turningPoint, 260),
      resolution: clean(rawArc.resolution, 260),
    },
    characterLock: {
      referenceMode: lockedReferenceMode,
      canonicalDescription: clean(rawLock.canonicalDescription, 1_200) || characterBible,
      immutableTraits,
      outfitPalette: clean(rawLock.outfitPalette, 220),
      companionDescription: clean(rawLock.companionDescription, 320),
      anchorAsset: "cover",
    },
    visualLanguage: {
      palette: clean(rawVisual.palette, 220),
      lighting: clean(rawVisual.lighting, 220),
      texture: clean(rawVisual.texture, 220),
      compositionRules,
      forbidden,
    },
  };
  return bible.premise && bible.childRole && bible.worldRules.length >= 2 && bible.arc.opening && bible.arc.resolution ? bible : null;
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
    const scenes = value.plan.scenes.map((scene, index) => {
      if (!isRecord(scene)) return null;
      const panelPosition = clean(scene.panelPosition, 20) as AlbumPanelPosition;
      const panelTone = clean(scene.panelTone, 10) as AlbumPanelTone;
      const layout = clean(scene.layout, 20) as AlbumSceneLayout;
      const parsed = {
        heading: clean(scene.heading, 70),
        text: clean(scene.text, 650),
        imagePrompt: clean(scene.imagePrompt, 3_200),
        panelPosition,
        panelTone,
        layout: sceneLayouts.includes(layout) ? layout : (["cinematic", "image-left", "image-right"] as AlbumSceneLayout[])[index % 3],
        editorialRole: clean(scene.editorialRole, 120) || "moment narativ",
        continuityNotes: clean(scene.continuityNotes, 420),
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
    const referenceMode = typeof assets.sourceReference === "string" && assets.sourceReference ? "photo" : "description";
    const storyBible = readStoryBible(value.plan.storyBible, characterBible, referenceMode);
    if (!title || !characterBible || !coverPrompt || !coloringPrompt || !textModel) return null;
    const compatibilityBible: AlbumStoryBible = storyBible || {
      version: 3,
      premise: title,
      childRole: "Eroul propriei aventuri",
      emotionalNeed: "Descoperă tema poveștii prin alegeri și acțiuni.",
      narrativePromise: "O aventură personalizată, coerentă și luminoasă.",
      recurringMotif: "lumina",
      companionRole: "Însoțitor și prieten",
      worldRules: ["Lumea răspunde alegerilor copilului.", "Magia rămâne blândă și sigură."],
      arc: { opening: scenes[0]?.text || title, catalyst: scenes[2]?.text || title, turningPoint: scenes[8]?.text || title, resolution: scenes[12]?.text || title },
      characterLock: { referenceMode, canonicalDescription: characterBible, immutableTraits: [characterBible], outfitPalette: "Ținuta și culorile rămân constante.", companionDescription: "Companionul rămâne identic.", anchorAsset: "cover" },
      visualLanguage: { palette: "Paleta aleasă de familie", lighting: "Lumină blândă de carte ilustrată", texture: "Finisaj editorial", compositionRules: ["Textul este randat separat de imagine."], forbidden: ["text în imagine", "personaje duplicate"] },
    };
    plan = { title, storyBible: compatibilityBible, characterBible, characterPrompt, coverPrompt, coloringPrompt, differencesPrompt, textModel, scenes: scenes as NonNullable<typeof scenes[number]>[] };
  }

  let documents: AlbumOrderOutput["documents"];
  if (value.documents !== undefined) {
    if (!isRecord(value.documents)) return null;
    const storybook = clean(value.documents.storybook, 500);
    const activityBooklet = clean(value.documents.activityBooklet, 500);
    if (!storybook || !activityBooklet) return null;
    const narration = clean(value.documents.narration, 500);
    documents = { storybook, activityBooklet, ...(narration ? { narration } : {}) };
  }

  return {
    kind: "illustrated-album",
    ...(clean(value.previewTitle, 100) ? { previewTitle: clean(value.previewTitle, 100) } : {}),
    ...(plan ? { plan } : {}),
    assets: {
      ...(typeof assets.sourceReference === "string" && assets.sourceReference ? { sourceReference: assets.sourceReference } : {}),
      ...(typeof assets.characterReference === "string" && assets.characterReference ? { characterReference: assets.characterReference } : {}),
      ...(typeof assets.cover === "string" && assets.cover ? { cover: assets.cover } : {}),
      scenes: [...assets.scenes],
      ...(typeof assets.coloring === "string" && assets.coloring ? { coloring: assets.coloring } : {}),
      ...(typeof assets.differences === "string" && assets.differences ? { differences: assets.differences } : {}),
    },
    ...(documents ? { documents } : {}),
    quality: Array.isArray(value.quality) ? value.quality.flatMap((item) => {
      if (!isRecord(item)) return [];
      const mode: "ai" | "deterministic" = item.mode === "ai" ? "ai" : "deterministic";
      return [{
        asset: clean(item.asset, 90),
        mode,
        accepted: item.accepted === true,
        identityScore: Math.max(0, Math.min(100, Number(item.identityScore) || 0)),
        storyScore: Math.max(0, Math.min(100, Number(item.storyScore) || 0)),
        technicalScore: Math.max(0, Math.min(100, Number(item.technicalScore) || 0)),
        checkedAt: clean(item.checkedAt, 40),
        notes: Array.isArray(item.notes) ? item.notes.map((note) => clean(note, 180)).filter(Boolean).slice(0, 5) : [],
      }];
    }).slice(0, 40) : [],
    budget: isRecord(value.budget) ? {
      textCalls: Math.max(0, Number(value.budget.textCalls) || 0),
      imageCalls: Math.max(0, Number(value.budget.imageCalls) || 0),
      qualityCalls: Math.max(0, Number(value.budget.qualityCalls) || 0),
      maxTextCalls: Math.max(1, Number(value.budget.maxTextCalls) || 2),
      maxImageCalls: Math.max(1, Number(value.budget.maxImageCalls) || 28),
      maxQualityCalls: Math.max(0, Number(value.budget.maxQualityCalls) || 28),
      estimatedCostMicros: Math.max(0, Number(value.budget.estimatedCostMicros) || 0),
      maxEstimatedCostMicros: Math.max(100_000, Number(value.budget.maxEstimatedCostMicros) || 1_500_000),
    } : {
      textCalls: value.plan ? 1 : 0,
      imageCalls: [assets.characterReference, assets.cover, assets.coloring, assets.differences, ...assets.scenes].filter(Boolean).length,
      qualityCalls: 0,
      maxTextCalls: 2,
      maxImageCalls: 28,
      maxQualityCalls: 28,
      estimatedCostMicros: 0,
      maxEstimatedCostMicros: 1_500_000,
    },
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

export function albumWorldLabel(world: string, customWorld = "") {
  if (world === "custom" && customWorld.trim()) return customWorld.trim();
  return albumWorldOptions.find((option) => option.id === world)?.label || "o lume magică";
}
