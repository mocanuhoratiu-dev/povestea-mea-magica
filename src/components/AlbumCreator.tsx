"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  Camera,
  Check,
  Clock3,
  Eye,
  Palette,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { albumWorldFromLumi } from "@/lib/album/presentation";
import {
  albumArtStyleOptions,
  albumCompanionOptions,
  albumLessonOptions,
  albumMoodOptions,
  albumWorldOptions,
  type AlbumConfiguration,
} from "@/lib/album/types";
import { beginPreparedOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";
import { commerce } from "@/lib/siteMode";
import { prepareReferencePhoto } from "@/lib/album/clientReferencePhoto";
import AlbumPreviewFlipbook, {
  type AlbumPreviewPage,
} from "@/components/AlbumPreviewFlipbook";
import LumiGenerationStage from "@/components/LumiGenerationStage";
import { protectedFetch } from "@/lib/clientTurnstile";
import type {
  LumiGenerationDetail,
  LumiGenerationPhase,
} from "@/lib/lumiExperience";
import "./album-editorial.css";
import LumiOpenButton from "./LumiOpenButton";

const steps = ["Copilul", "Aventura", "Mesajul vostru", "Mostra"];
const colors = [
  { label: "Mov ametist", value: "mov ametist", swatch: "#8052a0" },
  { label: "Albastru ceresc", value: "albastru ceresc", swatch: "#5b93af" },
  { label: "Verde smarald", value: "verde smarald", swatch: "#5e967a" },
  { label: "Roz zmeură", value: "roz zmeură", swatch: "#d97786" },
  { label: "Galben solar", value: "galben solar", swatch: "#e5b84f" },
];

const inputClass =
  "mt-2 min-h-12 w-full border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15";
const labelClass =
  "block text-xs font-black uppercase tracking-[0.12em] text-brand-navy/72";
const albumDraftKey = "pmm-album-draft";

type AlbumPreviewState = {
  orderId: string;
  imageUrl: string;
  title: string;
  configurationFingerprint: string;
  qualityChecked: boolean;
  statusUrl?: string;
  pages: AlbumPreviewPage[];
  ready: boolean;
  progress: number;
  total: number;
  startedAt: number;
  issue?: "failed" | "paused" | "expired";
};

function readPreviewPages(value: unknown): AlbumPreviewPage[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const page = item as Record<string, unknown>;
      if (
        !["cover", "story"].includes(String(page.kind)) ||
        typeof page.imageUrl !== "string" ||
        typeof page.title !== "string" ||
        typeof page.text !== "string"
      )
        return [];
      const layout = ["cinematic", "image-left", "image-right"].includes(
        String(page.layout),
      )
        ? (page.layout as AlbumPreviewPage["layout"])
        : undefined;
      return [
        {
          kind: page.kind as AlbumPreviewPage["kind"],
          imageUrl: page.imageUrl,
          eyebrow:
            typeof page.eyebrow === "string" ? page.eyebrow : "Povestea Magică",
          title: page.title,
          text: page.text,
          ...(layout ? { layout } : {}),
        },
      ];
    })
    .slice(0, 3);
}

function readStoredPreview(value: unknown): AlbumPreviewState | null {
  if (!value || typeof value !== "object") return null;
  const preview = value as Record<string, unknown>;
  if (
    typeof preview.orderId !== "string" ||
    typeof preview.imageUrl !== "string" ||
    typeof preview.statusUrl !== "string" ||
    !preview.statusUrl.startsWith("/api/album-preview?") ||
    typeof preview.title !== "string" ||
    typeof preview.configurationFingerprint !== "string"
  )
    return null;
  return {
    orderId: preview.orderId,
    imageUrl: preview.imageUrl,
    title: preview.title,
    configurationFingerprint: preview.configurationFingerprint,
    qualityChecked: preview.qualityChecked === true,
    statusUrl: preview.statusUrl,
    pages: readPreviewPages(preview.pages),
    ready: preview.ready === true,
    progress:
      typeof preview.progress === "number"
        ? Math.max(1, Math.min(3, preview.progress))
        : preview.ready === true
          ? 3
          : 1,
    total: 3,
    startedAt:
      typeof preview.startedAt === "number" ? preview.startedAt : Date.now(),
    ...(["failed", "paused", "expired"].includes(String(preview.issue))
      ? { issue: preview.issue as AlbumPreviewState["issue"] }
      : {}),
    ...(typeof preview.startedAt === "number" &&
    Date.now() - preview.startedAt >= 86_400_000
      ? { issue: "expired" as const, ready: false }
      : {}),
  };
}

export default function AlbumCreator() {
  const [step, setStep] = useState(0);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [hairStyle, setHairStyle] = useState("ondulat până la umeri");
  const [hairColor, setHairColor] = useState("șaten");
  const [eyeColor, setEyeColor] = useState("căprui");
  const [skinTone, setSkinTone] = useState("deschisă");
  const [outfit, setOutfit] = useState("pulover moale și pantaloni comozi");
  const [appearanceDetail, setAppearanceDetail] = useState("");
  const [favoriteColor, setFavoriteColor] = useState(colors[0].value);
  const [world, setWorld] = useState<string>(albumWorldOptions[0].id);
  const [customWorld, setCustomWorld] = useState("");
  const [companion, setCompanion] = useState<string>(albumCompanionOptions[0]);
  const [secondaryCharacterName, setSecondaryCharacterName] = useState("");
  const [secondaryCharacterRole, setSecondaryCharacterRole] = useState("");
  const [secondaryCharacterAppearance, setSecondaryCharacterAppearance] =
    useState("");
  const [lesson, setLesson] = useState<string>(albumLessonOptions[0]);
  const [mood, setMood] = useState<string>(albumMoodOptions[0]);
  const [artStyle, setArtStyle] = useState<string>(albumArtStyleOptions[0]);
  const [personalDetail, setPersonalDetail] = useState("");
  const [storyContext, setStoryContext] = useState("");
  const [dedication, setDedication] = useState("");
  const [dedicationFrom, setDedicationFrom] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [{ preview, history: previewHistory }, setPreviewState] = useState<{
    preview: AlbumPreviewState | null;
    history: AlbumPreviewState[];
  }>({ preview: null, history: [] });
  const setPreview = useCallback(
    (
      action:
        | AlbumPreviewState
        | null
        | ((current: AlbumPreviewState | null) => AlbumPreviewState | null),
    ) => {
      setPreviewState((current) => {
        const next =
          typeof action === "function" ? action(current.preview) : action;
        if (next === current.preview) return current;
        const history = next
          ? [
              ...current.history.filter(
                (p) =>
                  p.orderId !== next.orderId &&
                  Date.now() - p.startedAt < 86_400_000,
              ),
              next,
            ]
              .sort((a, b) => a.startedAt - b.startedAt)
              .slice(-8)
          : current.history;
        return { preview: next, history };
      });
    },
    [],
  );
  const [restored, setRestored] = useState(false);
  const [previewLimit, setPreviewLimit] = useState<{
    maxAttempts: number;
    remaining: number;
  } | null>(null);
  const [restoredPhoto, setRestoredPhoto] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const previewRef = useRef<AlbumPreviewState | null>(null);
  const [referencePhoto, setReferencePhoto] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);

  const worldLabel = useMemo(
    () =>
      world === "custom" && customWorld.trim()
        ? customWorld.trim()
        : albumWorldOptions.find((option) => option.id === world)?.label ||
          "Lume magică",
    [world, customWorld],
  );
  const albumConfiguration = useMemo<AlbumConfiguration>(
    () => ({
      generation: {
        type: "album",
        name: name.trim(),
        age,
        hairStyle,
        hairColor,
        eyeColor,
        skinTone,
        outfit: outfit.trim(),
        appearanceDetail: appearanceDetail.trim(),
        favoriteColor,
        world,
        customWorld: customWorld.trim(),
        companion,
        secondaryCharacterName: secondaryCharacterName.trim(),
        secondaryCharacterRole: secondaryCharacterRole.trim(),
        secondaryCharacterAppearance: secondaryCharacterAppearance.trim(),
        lesson,
        mood,
        artStyle,
        personalDetail: personalDetail.trim(),
        storyContext: storyContext.trim(),
        referenceMode:
          referencePhoto || restoredPhoto ? "photo" : "description",
      },
      dedication: dedication.trim(),
      dedicationFrom: dedicationFrom.trim(),
    }),
    [
      name,
      age,
      hairStyle,
      hairColor,
      eyeColor,
      skinTone,
      outfit,
      appearanceDetail,
      favoriteColor,
      world,
      customWorld,
      companion,
      secondaryCharacterName,
      secondaryCharacterRole,
      secondaryCharacterAppearance,
      lesson,
      mood,
      artStyle,
      personalDetail,
      storyContext,
      dedication,
      dedicationFrom,
      referencePhoto,
      restoredPhoto,
    ],
  );
  const configurationFingerprint = useMemo(
    () => JSON.stringify(albumConfiguration),
    [albumConfiguration],
  );
  const activePreview =
    preview?.configurationFingerprint === configurationFingerprint
      ? preview
      : null;
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);
  const lumiPreviewPhase: LumiGenerationPhase = activePreview?.issue
    ? "idle"
    : activePreview?.ready
      ? "ready"
      : activePreview?.progress === 3
        ? "layout"
        : activePreview?.progress === 2
          ? "illustrations"
          : activePreview
            ? "story"
            : isLoading
              ? "character"
              : "idle";
  const lumiPreviewProgress = activePreview?.ready
    ? 100
    : activePreview?.progress === 3
      ? 92
      : activePreview?.progress === 2
        ? 72
        : activePreview
          ? 42
          : isLoading
            ? 14
            : 0;
  const canContinue =
    step === 0
      ? Boolean(
          name.trim() &&
            age &&
            hairStyle &&
            hairColor &&
            eyeColor &&
            skinTone &&
            outfit.trim() &&
            (!referencePhoto || photoConsent),
        )
      : step === 1
        ? Boolean(
            (world !== "custom" || customWorld.trim()) &&
              (!secondaryCharacterName.trim() || secondaryCharacterRole.trim()),
          )
        : true;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = window.sessionStorage.getItem(albumDraftKey);
        if (stored) {
          const draft = JSON.parse(stored) as Record<string, unknown>;
          if (typeof draft.name === "string") setName(draft.name.slice(0, 40));
          if (typeof draft.age === "string") setAge(draft.age);
          if (typeof draft.hairStyle === "string")
            setHairStyle(draft.hairStyle);
          if (typeof draft.hairColor === "string")
            setHairColor(draft.hairColor);
          if (typeof draft.eyeColor === "string") setEyeColor(draft.eyeColor);
          if (typeof draft.skinTone === "string") setSkinTone(draft.skinTone);
          if (typeof draft.outfit === "string")
            setOutfit(draft.outfit.slice(0, 100));
          if (typeof draft.appearanceDetail === "string")
            setAppearanceDetail(draft.appearanceDetail.slice(0, 240));
          if (typeof draft.favoriteColor === "string")
            setFavoriteColor(draft.favoriteColor);
          if (
            typeof draft.world === "string" &&
            albumWorldOptions.some((option) => option.id === draft.world)
          )
            setWorld(draft.world);
          if (typeof draft.customWorld === "string")
            setCustomWorld(draft.customWorld.slice(0, 280));
          if (
            typeof draft.companion === "string" &&
            albumCompanionOptions.includes(
              draft.companion as (typeof albumCompanionOptions)[number],
            )
          )
            setCompanion(draft.companion);
          if (typeof draft.secondaryCharacterName === "string")
            setSecondaryCharacterName(
              draft.secondaryCharacterName.slice(0, 40),
            );
          if (typeof draft.secondaryCharacterRole === "string")
            setSecondaryCharacterRole(
              draft.secondaryCharacterRole.slice(0, 60),
            );
          if (typeof draft.secondaryCharacterAppearance === "string")
            setSecondaryCharacterAppearance(
              draft.secondaryCharacterAppearance.slice(0, 180),
            );
          if (
            typeof draft.lesson === "string" &&
            albumLessonOptions.includes(
              draft.lesson as (typeof albumLessonOptions)[number],
            )
          )
            setLesson(draft.lesson);
          if (
            typeof draft.mood === "string" &&
            albumMoodOptions.includes(
              draft.mood as (typeof albumMoodOptions)[number],
            )
          )
            setMood(draft.mood);
          if (
            typeof draft.artStyle === "string" &&
            albumArtStyleOptions.includes(
              draft.artStyle as (typeof albumArtStyleOptions)[number],
            )
          )
            setArtStyle(draft.artStyle);
          if (typeof draft.personalDetail === "string")
            setPersonalDetail(draft.personalDetail.slice(0, 240));
          if (typeof draft.storyContext === "string")
            setStoryContext(draft.storyContext.slice(0, 700));
          if (typeof draft.dedication === "string")
            setDedication(draft.dedication.slice(0, 320));
          if (typeof draft.dedicationFrom === "string")
            setDedicationFrom(draft.dedicationFrom.slice(0, 80));
          const storedPreview = readStoredPreview(draft.preview);
          if (storedPreview) setPreview(storedPreview);
          const history = Array.isArray(draft.previews)
            ? draft.previews
                .map(readStoredPreview)
                .filter((p): p is AlbumPreviewState => Boolean(p))
            : storedPreview
              ? [storedPreview]
              : [];
          setPreviewState((current) => ({
            ...current,
            history: history
              .filter((p) => Date.now() - p.startedAt < 86_400_000)
              .slice(-8),
          }));
          setRestoredPhoto(draft.referenceMode === "photo");
          setStep(
            typeof draft.step === "number"
              ? Math.max(0, Math.min(3, draft.step))
              : 3,
          );
        }
        if (
          new URLSearchParams(window.location.search).get("plata") === "anulata"
        ) {
          setNotice(
            "Plata nu a fost finalizată. Alegerile poveștii sunt păstrate și le poți verifica înainte să încerci din nou.",
          );
        }
      } catch {
        // Browser storage is optional; the configurator remains fully usable without it.
      }
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [setPreview]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/album-preview?view=limits", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((value) => {
        if (
          Number.isInteger(value?.maxAttempts) &&
          Number.isInteger(value?.remaining)
        )
          setPreviewLimit(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isLoading]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(
        albumDraftKey,
        JSON.stringify({
          ...albumConfiguration.generation,
          dedication,
          dedicationFrom,
          step,
          preview,
          previews: previewHistory,
        }),
      );
    } catch {
      /* Private browsing may disable storage. */
    }
  }, [
    restored,
    albumConfiguration,
    dedication,
    dedicationFrom,
    step,
    preview,
    previewHistory,
  ]);

  useEffect(() => {
    const detail: LumiGenerationDetail = {
      phase: lumiPreviewPhase,
      progress: lumiPreviewProgress,
    };
    window.dispatchEvent(
      new CustomEvent("pmm:lumi-generation-state", { detail }),
    );
  }, [lumiPreviewPhase, lumiPreviewProgress]);

  useEffect(() => {
    const emitContext = () => {
      window.dispatchEvent(
        new CustomEvent("pmm:album-context-change", {
          detail: {
            step,
            name,
            draft: {
              ...albumConfiguration.generation,
              name,
              outfit,
              appearanceDetail,
              customWorld,
              secondaryCharacterName,
              secondaryCharacterRole,
              secondaryCharacterAppearance,
              personalDetail,
              storyContext,
              dedication,
              dedicationFrom,
            },
          },
        }),
      );
    };
    emitContext();
    window.addEventListener("pmm:lumi-request-context", emitContext);
    return () =>
      window.removeEventListener("pmm:lumi-request-context", emitContext);
  }, [
    albumConfiguration,
    name,
    outfit,
    appearanceDetail,
    customWorld,
    secondaryCharacterName,
    secondaryCharacterRole,
    secondaryCharacterAppearance,
    personalDetail,
    storyContext,
    dedication,
    dedicationFrom,
    step,
  ]);

  const persistDraft = (
    currentPreview: AlbumPreviewState | null = activePreview,
  ) => {
    try {
      window.sessionStorage.setItem(
        albumDraftKey,
        JSON.stringify({
          ...albumConfiguration.generation,
          dedication: albumConfiguration.dedication,
          dedicationFrom: albumConfiguration.dedicationFrom,
          preview: currentPreview,
          previews: previewHistory,
          step,
        }),
      );
    } catch {
      // Checkout remains available when session storage is disabled.
    }
  };

  const createPreview = async () => {
    if (requestRef.current || isLoading) return;
    if (restoredPhoto && !referencePhoto) {
      setNotice(
        "Pentru o variantă nouă, selectează din nou fotografia. Mostra deja creată poate fi aleasă fără reîncărcarea fotografiei.",
      );
      setStep(0);
      return;
    }
    if (!name.trim() || (world === "custom" && !customWorld.trim())) {
      setStep(0);
      return;
    }
    if (previewLimit?.remaining === 0) {
      setNotice(
        "Limita de încercări a fost atinsă. Poți alege una dintre mostrele păstrate mai jos.",
      );
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 180_000);
    setIsLoading(true);
    setNotice("");
    setHasConsent(false);
    trackEvent("product_started", { product: "album" });
    try {
      const response = await protectedFetch(
        "/api/album-preview",
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            configuration: albumConfiguration,
            ...(referencePhoto
              ? {
                  referenceImageDataUrl: referencePhoto,
                  photoConsent: photoConsent === true,
                }
              : {}),
          }),
        },
        "album_preview",
      );
      const result = (await response.json()) as {
        orderId?: string;
        previewUrl?: string;
        statusUrl?: string;
        title?: string;
        qualityChecked?: boolean;
        error?: string;
        maxAttempts?: number;
        remaining?: number;
      };
      if (
        typeof result.maxAttempts === "number" &&
        typeof result.remaining === "number"
      )
        setPreviewLimit({
          maxAttempts: result.maxAttempts,
          remaining: result.remaining,
        });
      if (
        !response.ok ||
        !result.orderId ||
        !result.previewUrl ||
        !result.statusUrl ||
        !result.title
      ) {
        throw new Error(result.error || "Mostra nu a putut fi creată acum.");
      }
      const nextPreview: AlbumPreviewState = {
        orderId: result.orderId,
        imageUrl: result.previewUrl,
        title: result.title,
        configurationFingerprint,
        qualityChecked: result.qualityChecked === true,
        statusUrl: result.statusUrl,
        pages: [
          {
            kind: "cover",
            imageUrl: result.previewUrl,
            eyebrow: "Povestea Magică",
            title: result.title,
            text: `O aventură creată pentru ${name.trim()}`,
          },
        ],
        ready: false,
        progress: 1,
        total: 3,
        startedAt: Date.now(),
      };
      setPreview(nextPreview);
      setNotice(
        "Coperta este gata. Pregătim acum două pagini reale din poveste, pe care le vei putea răsfoi înainte de plată.",
      );
    } catch (error) {
      setNotice(
        controller.signal.aborted
          ? "Cererea a fost întreruptă. Poți încerca din nou; mostrele anterioare sunt păstrate."
          : error instanceof Error
            ? error.message
            : "Mostra nu a putut fi creată acum.",
      );
    } finally {
      window.clearTimeout(timeout);
      requestRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activePreview?.statusUrl || activePreview.ready || activePreview.issue)
      return;
    const orderId = activePreview.orderId;
    const statusUrl = activePreview.statusUrl;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let errors = 0;
    const deadline = Date.now() + 10 * 60_000;
    const updatePreview = (changes: Partial<AlbumPreviewState>) =>
      setPreview((current) =>
        current?.orderId === orderId ? { ...current, ...changes } : current,
      );
    const poll = async () => {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 20_000);
      try {
        const response = await fetch(statusUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          status?: string;
          pages?: unknown;
          title?: string;
          qualityChecked?: boolean;
          progress?: number;
          total?: number;
          error?: string;
        };
        if (cancelled) return;
        if (response.status === 404 || response.status === 410) {
          updatePreview({ issue: "expired", ready: false });
          setNotice(
            "Această mostră nu mai este disponibilă. Alege o alta sau creează o variantă nouă.",
          );
          return;
        }
        if (!response.ok)
          throw new Error(result.error || "Nu am putut verifica progresul.");
        if (result.status === "failed") {
          updatePreview({ issue: "failed", ready: false });
          setNotice(
            result.error ||
              "Generarea s-a oprit. Poți alege o mostră păstrată sau încerca o variantă nouă.",
          );
          return;
        }
        errors = 0;
        if (result.status === "ready") {
          const pages = readPreviewPages(result.pages);
          if (pages.length !== 3)
            throw new Error("Mostra nu conține toate paginile.");
          updatePreview({
            title:
              result.title || previewRef.current?.title || "Povestea Magică",
            qualityChecked: result.qualityChecked === true,
            pages,
            ready: true,
            progress: 3,
            total: 3,
            issue: undefined,
          });
          setNotice(
            "Mostra este gata. Răsfoiește coperta și cele două pagini; exact aceste imagini vor intra în carte după plată.",
          );
          return;
        }
        const interiorProgress = Math.max(0, Math.min(2, result.progress || 0));
        if (previewRef.current?.progress !== interiorProgress + 1)
          updatePreview({ progress: interiorProgress + 1, total: 3 });
        setNotice(
          interiorProgress === 0
            ? "Coperta este gata. Construim acum firul poveștii și prima scenă."
            : "Prima scenă este gata. Pregătim a doua pagină pentru răsfoire.",
        );
      } catch {
        if (cancelled) return;
        errors += 1;
        if (errors >= 3) {
          updatePreview({ issue: "paused" });
          setNotice(
            "Nu putem verifica progresul acum. Reia verificarea fără să consumi o încercare nouă sau alege altă mostră.",
          );
          return;
        }
      } finally {
        window.clearTimeout(timeout);
      }
      if (cancelled) return;
      if (Date.now() >= deadline) {
        updatePreview({ issue: "paused" });
        setNotice(
          "Generarea durează mai mult decât de obicei. Reia verificarea sau încearcă o variantă nouă.",
        );
        return;
      }
      timer = setTimeout(poll, 4_000);
    };
    timer = setTimeout(poll, 1_500);
    return () => {
      cancelled = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [
    activePreview?.orderId,
    activePreview?.statusUrl,
    activePreview?.ready,
    activePreview?.issue,
    setPreview,
  ]);

  useEffect(() => {
    const lessonMap: Record<string, string> = {
      "Curaj și încredere 💪": "Curaj și încredere",
      "Împărțitul jucăriilor 🧸": "Prietenie și bunătate",
      "Rutina de somn 🌙": "Înțelegerea emoțiilor",
      "Importanța prieteniei 🤝": "Prietenie și bunătate",
      "Descoperirea naturii 🌱": "Curiozitate și descoperire",
    };
    const applyChoice = (event: Event) => {
      const detail =
        (event as CustomEvent<Record<string, unknown>>).detail || {};
      const partial = detail.partial === true;
      if (typeof detail.theme === "string") {
        const recommendedWorld = albumWorldFromLumi(detail.theme);
        if (recommendedWorld) setWorld(recommendedWorld);
      }
      if (typeof detail.name === "string") setName(detail.name.slice(0, 40));
      if (typeof detail.age === "string") setAge(detail.age);
      if (typeof detail.hairStyle === "string") setHairStyle(detail.hairStyle);
      if (typeof detail.hairColor === "string") setHairColor(detail.hairColor);
      if (typeof detail.eyeColor === "string") setEyeColor(detail.eyeColor);
      if (typeof detail.skinTone === "string") setSkinTone(detail.skinTone);
      if (typeof detail.outfit === "string")
        setOutfit(detail.outfit.slice(0, 100));
      if (typeof detail.appearanceDetail === "string")
        setAppearanceDetail(detail.appearanceDetail.slice(0, 240));
      if (typeof detail.favoriteColor === "string")
        setFavoriteColor(detail.favoriteColor);
      if (
        typeof detail.world === "string" &&
        albumWorldOptions.some((option) => option.id === detail.world)
      )
        setWorld(detail.world);
      if (typeof detail.customWorld === "string")
        setCustomWorld(detail.customWorld.slice(0, 280));
      if (
        typeof detail.companion === "string" &&
        albumCompanionOptions.includes(
          detail.companion as (typeof albumCompanionOptions)[number],
        )
      )
        setCompanion(detail.companion);
      if (typeof detail.secondaryCharacterName === "string")
        setSecondaryCharacterName(detail.secondaryCharacterName.slice(0, 40));
      if (typeof detail.secondaryCharacterRole === "string")
        setSecondaryCharacterRole(detail.secondaryCharacterRole.slice(0, 60));
      if (typeof detail.secondaryCharacterAppearance === "string")
        setSecondaryCharacterAppearance(
          detail.secondaryCharacterAppearance.slice(0, 180),
        );
      if (
        typeof detail.lesson === "string" &&
        albumLessonOptions.includes(
          detail.lesson as (typeof albumLessonOptions)[number],
        )
      )
        setLesson(detail.lesson);
      if (
        typeof detail.mood === "string" &&
        albumMoodOptions.includes(
          detail.mood as (typeof albumMoodOptions)[number],
        )
      )
        setMood(detail.mood);
      if (
        typeof detail.artStyle === "string" &&
        albumArtStyleOptions.includes(
          detail.artStyle as (typeof albumArtStyleOptions)[number],
        )
      )
        setArtStyle(detail.artStyle);
      if (typeof detail.storyContext === "string")
        setStoryContext(detail.storyContext.slice(0, 700));
      if (typeof detail.personalDetail === "string")
        setPersonalDetail(detail.personalDetail.slice(0, 240));
      if (typeof detail.dedication === "string")
        setDedication(detail.dedication.slice(0, 320));
      if (typeof detail.dedicationFrom === "string")
        setDedicationFrom(detail.dedicationFrom.slice(0, 80));
      if (typeof detail.lesson === "string" && lessonMap[detail.lesson])
        setLesson(lessonMap[detail.lesson]);
      if (typeof detail.storyDetail === "string" && detail.storyDetail.trim())
        setPersonalDetail(detail.storyDetail.trim().slice(0, 180));
      if (!partial) {
        setStep(3);
        setNotice(
          "Lumi a așezat toate alegerile în poveste. Verifică rezumatul și creează mostra.",
        );
      }
    };
    window.addEventListener("pmm:lumi-album-choice", applyChoice);
    window.addEventListener("pmm:lumi-album-draft", applyChoice);
    const rememberedChoice = window.sessionStorage.getItem(
      "pmm-lumi-album-choice",
    );
    if (rememberedChoice) {
      window.sessionStorage.removeItem("pmm-lumi-album-choice");
      try {
        applyChoice(
          new CustomEvent("pmm:lumi-album-choice", {
            detail: JSON.parse(rememberedChoice),
          }),
        );
      } catch {
        // The configurator remains usable if browser storage contains invalid data.
      }
    }
    return () => {
      window.removeEventListener("pmm:lumi-album-choice", applyChoice);
      window.removeEventListener("pmm:lumi-album-draft", applyChoice);
    };
  }, []);

  const goNext = () => {
    if (!canContinue) {
      const message =
        step === 1
          ? world === "custom" && !customWorld.trim()
            ? "Descrie lumea inventată pentru a continua."
            : "Spune-ne cine este personajul apropiat care intră în poveste."
          : referencePhoto && !photoConsent
            ? "Confirmă permisiunea pentru folosirea fotografiei sau elimin-o."
            : "Completează numele și aspectul copilului pentru a continua.";
      setNotice(message);
      return;
    }
    setNotice("");
    setStep((current) => Math.min(3, current + 1));
  };

  const chooseReferencePhoto = async (file?: File) => {
    if (!file) return;
    setNotice("");
    try {
      const prepared = await prepareReferencePhoto(file);
      setReferencePhoto(prepared);
      setRestoredPhoto(false);
      setPhotoConsent(false);
      setPreview(null);
      setHasConsent(false);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Fotografia nu a putut fi pregătită.",
      );
    }
  };

  const selectPreview = (candidate: AlbumPreviewState) => {
    try {
      const configuration = JSON.parse(
        candidate.configurationFingerprint,
      ) as AlbumConfiguration;
      window.dispatchEvent(
        new CustomEvent("pmm:lumi-album-draft", {
          detail: {
            ...configuration.generation,
            dedication: configuration.dedication,
            dedicationFrom: configuration.dedicationFrom,
            partial: true,
          },
        }),
      );
      setReferencePhoto("");
      setRestoredPhoto(configuration.generation.referenceMode === "photo");
      setHasConsent(false);
      setPreview(
        candidate.issue === "paused"
          ? { ...candidate, issue: undefined }
          : candidate,
      );
      setStep(3);
      setNotice(
        "Ai ales această mostră. Detaliile copilului și ale aventurii au fost restaurate împreună cu ea.",
      );
    } catch {
      setNotice("Această mostră nu poate fi restaurată. Alege alta.");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    if (
      !activePreview ||
      activePreview.issue === "failed" ||
      activePreview.issue === "expired"
    ) {
      await createPreview();
      return;
    }
    if (!activePreview.ready) return;
    if (!commerce.acceptsPayments) {
      setNotice(
        "Comenzile pentru Povestea Magică se deschid odată cu activarea plăților.",
      );
      return;
    }
    if (!hasConsent) {
      setNotice(
        "Confirmă livrarea imediată a produsului digital înainte de plată.",
      );
      return;
    }

    setIsLoading(true);
    setNotice("");
    try {
      persistDraft(activePreview);
      await beginPreparedOrderCheckout(
        "illustrated-album-digital",
        activePreview.orderId,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Plata nu a putut fi deschisă acum.",
      );
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="album-configurator"
      data-album-configuring="true"
    >
      <div className="flex justify-end border-b border-brand-navy/10 px-5 py-3">
        <LumiOpenButton
          label="Ajutor de la Lumi"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-purple/25 px-4 text-xs font-bold text-brand-purple"
        />
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <div className="px-5 py-8 sm:px-8 md:px-12 md:py-12">
          <div
            className="sticky top-16 z-20 -mx-5 grid grid-cols-4 border-y border-brand-navy/12 bg-white sm:static sm:mx-0"
            aria-label="Pașii configurării"
          >
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`min-h-16 border-r border-brand-navy/10 px-2 py-3 text-center last:border-r-0 ${index === step ? "bg-brand-navy text-brand-cream" : index < step ? "text-brand-purple" : "text-brand-navy/35"}`}
              >
                <span className="block font-mono text-[10px] font-black">
                  0{index + 1}
                </span>
                <span className="mt-1 block text-[11px] font-black sm:text-xs">
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-9">
            {step === 0 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">
                  Cum apare copilul în poveste?
                </legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/72">
                  Construim mai întâi personajul, apoi îl păstrăm recognoscibil
                  în copertă și în toate cele 13 ilustrații.
                </p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    Prenume
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={40}
                      placeholder="Exemplu: Eva"
                      autoComplete="off"
                      required
                    />
                  </label>
                  <label className={labelClass}>
                    Vârsta
                    <select
                      className={inputClass}
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                    >
                      {Array.from({ length: 9 }, (_, index) => index + 2).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value} ani
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
                <details
                  className="optional-details"
                  open={appearanceExpanded}
                  onToggle={(event) =>
                    setAppearanceExpanded(event.currentTarget.open)
                  }
                >
                  <summary>Aspectul și ținuta personajului</summary>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>
                      Coafura
                      <select
                        className={inputClass}
                        value={hairStyle}
                        onChange={(event) => setHairStyle(event.target.value)}
                      >
                        <option>scurt și drept</option>
                        <option>ondulat până la umeri</option>
                        <option>lung și drept</option>
                        <option>creț</option>
                        <option>două împletituri</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Culoarea părului
                      <select
                        className={inputClass}
                        value={hairColor}
                        onChange={(event) => setHairColor(event.target.value)}
                      >
                        <option>șaten</option>
                        <option>blond</option>
                        <option>brunet</option>
                        <option>roșcat</option>
                        <option>negru</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Culoarea ochilor
                      <select
                        className={inputClass}
                        value={eyeColor}
                        onChange={(event) => setEyeColor(event.target.value)}
                      >
                        <option>căprui</option>
                        <option>albaștri</option>
                        <option>verzi</option>
                        <option>cenușii</option>
                        <option>negri</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Nuanța pielii
                      <select
                        className={inputClass}
                        value={skinTone}
                        onChange={(event) => setSkinTone(event.target.value)}
                      >
                        <option>deschisă</option>
                        <option>medie</option>
                        <option>măslinie</option>
                        <option>închisă</option>
                      </select>
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Ținuta personajului
                      <input
                        className={inputClass}
                        value={outfit}
                        onChange={(event) => setOutfit(event.target.value)}
                        maxLength={100}
                        placeholder="Exemplu: rochiță galbenă și cizme mov"
                      />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Alte detalii de aspect, opțional
                      <textarea
                        className={`${inputClass} min-h-20 resize-y`}
                        value={appearanceDetail}
                        onChange={(event) =>
                          setAppearanceDetail(event.target.value)
                        }
                        maxLength={240}
                        placeholder="Ochelari rotunzi, pistrui, un semn din naștere sau accesoriul preferat"
                      />
                      <span className="mt-1 block text-right text-[10px] text-brand-navy/72">
                        {appearanceDetail.length}/240
                      </span>
                    </label>
                  </div>
                </details>
                <details
                  className="optional-details"
                  open={Boolean(referencePhoto || restoredPhoto)}
                >
                  <summary>Pornește de la o fotografie (opțional)</summary>
                  {restoredPhoto && !referencePhoto && <p className="mt-3 text-sm">Fotografia nu este păstrată în browser. O poți reîncărca pentru o mostră nouă sau <button type="button" className="min-h-11 underline" onClick={() => { setRestoredPhoto(false); setPreview(null); setHasConsent(false); }}>continua numai cu descrierea</button>.</p>}
                  <div className="grid gap-5">
                    <div className="border border-brand-gold/55 bg-brand-gold/[0.08] p-5 sm:col-span-2">
                      <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-brand-navy text-brand-gold">
                          <Camera size={21} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-brand-navy">
                            Fotografie de referință, opțional
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/72">
                            Ajută la păstrarea trăsăturilor copilului. Nu este
                            afișată ca fotografie în poveste, nu ajunge la
                            procesatorul de plăți și este folosită numai pentru
                            comanda aceasta.
                          </p>
                        </div>
                      </div>
                      {referencePhoto ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-[96px_1fr] sm:items-center">
                          {/* A native image avoids Next.js optimizing a private in-memory data URL. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={referencePhoto}
                            alt="Fotografia de referință selectată"
                            className="h-24 w-24 border border-brand-gold/60 object-cover"
                          />
                          <div>
                            <label className="flex cursor-pointer items-start gap-3 text-xs font-bold leading-relaxed text-brand-navy/75">
                              <input
                                type="checkbox"
                                checked={photoConsent}
                                onChange={(event) =>
                                  setPhotoConsent(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 accent-brand-purple"
                              />
                              Confirm că sunt părintele/reprezentantul legal sau
                              am permisiunea de a folosi această fotografie
                              pentru generarea poveștii.
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setReferencePhoto("");
                                setRestoredPhoto(false);
                                setPhotoConsent(false);
                                setPreview(null);
                              }}
                              className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-brand-purple"
                            >
                              <Trash2 size={15} /> Elimină fotografia
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-brand-navy/20 bg-white px-4 text-xs font-black text-brand-navy transition hover:border-brand-purple">
                          <Camera size={16} /> Alege fotografia
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => {
                              void chooseReferencePhoto(
                                event.target.files?.[0],
                              );
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      )}
                      <div className="mt-4 flex gap-2 border-t border-brand-navy/10 pt-4 text-[11px] font-semibold leading-relaxed text-brand-navy/72">
                        <ShieldCheck
                          size={17}
                          className="shrink-0 text-brand-purple"
                        />
                        Fișierul este redimensionat înainte de încărcare și
                        curățat din nou pe server. Poți crea povestea și numai
                        din descriere.
                      </div>
                    </div>
                  </div>
                </details>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">
                  Alege lumea și firul aventurii
                </legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/72">
                  Alegerile devin întâmplări, decoruri și momente reale din
                  poveste.
                </p>
                <div className="mt-8">
                  <p className={labelClass}>Lumea poveștii</p>
                  <div className="album-world-grid">
                    {albumWorldOptions.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={world === option.id}
                        onClick={() => setWorld(option.id)}
                        className="album-world-option"
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            backgroundPosition: `${((index % 4) * 100) / 3}% ${Math.floor(index / 4) * 50}%`,
                          }}
                        />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {world === "custom" && (
                    <label className={`${labelClass} mt-4`}>
                      Descrie lumea inventată
                      <textarea
                        className={`${inputClass} min-h-24 resize-y`}
                        value={customWorld}
                        onChange={(event) => setCustomWorld(event.target.value)}
                        maxLength={280}
                        placeholder="O lume roz a zânelor, cu poduri din flori și stele care cântă..."
                      />
                    </label>
                  )}
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    Companion
                    <select
                      className={inputClass}
                      value={companion}
                      onChange={(event) => setCompanion(event.target.value)}
                    >
                      {albumCompanionOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Ce descoperim împreună
                    <select
                      className={inputClass}
                      value={lesson}
                      onChange={(event) => setLesson(event.target.value)}
                    >
                      {albumLessonOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Atmosfera poveștii
                    <select
                      className={inputClass}
                      value={mood}
                      onChange={(event) => setMood(event.target.value)}
                    >
                      {albumMoodOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Stilul ilustrațiilor
                    <select
                      className={inputClass}
                      value={artStyle}
                      onChange={(event) => setArtStyle(event.target.value)}
                    >
                      {albumArtStyleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <div className="border-t border-brand-navy/12 pt-5 sm:col-span-2">
                    <p className="text-sm font-black text-brand-navy">
                      O persoană dragă în poveste{" "}
                      <span className="font-semibold text-brand-navy/72">
                        opțional
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-navy/72">
                      Poate fi un frate, o soră, un părinte sau un prieten. Îl
                      păstrăm separat și recognoscibil.
                    </p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <label className={labelClass}>
                        Prenume
                        <input
                          className={inputClass}
                          value={secondaryCharacterName}
                          onChange={(event) =>
                            setSecondaryCharacterName(event.target.value)
                          }
                          maxLength={40}
                          placeholder="Exemplu: Eva"
                        />
                      </label>
                      <label className={labelClass}>
                        Relația cu copilul
                        <input
                          className={inputClass}
                          value={secondaryCharacterRole}
                          onChange={(event) =>
                            setSecondaryCharacterRole(event.target.value)
                          }
                          maxLength={60}
                          placeholder="sora mai mare"
                        />
                      </label>
                    </div>
                    <label className={`${labelClass} mt-5`}>
                      Cum arată?
                      <input
                        className={inputClass}
                        value={secondaryCharacterAppearance}
                        onChange={(event) =>
                          setSecondaryCharacterAppearance(event.target.value)
                        }
                        maxLength={180}
                        placeholder="blondă, cu părul creț și o rochie albastră"
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Culoarea preferată</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFavoriteColor(color.value)}
                        aria-pressed={favoriteColor === color.value}
                        className={`inline-flex min-h-11 items-center gap-2 border px-3 text-xs font-black ${favoriteColor === color.value ? "border-brand-navy bg-brand-navy text-white" : "border-brand-navy/15 text-brand-navy"}`}
                      >
                        <span
                          className="h-4 w-4 border border-white/70"
                          style={{ backgroundColor: color.swatch }}
                        />
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">
                  Puneți o bucățică din familie în poveste
                </legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/72">
                  Poți lăsa autorul să creeze liber sau poți descrie chiar tu
                  ideea aventurii. Dedicația rămâne pe pagina ei.
                </p>
                <div className="mt-8 space-y-6">
                  <label className={labelClass}>
                    Cum ai vrea să fie povestea?
                    <textarea
                      className={`${inputClass} min-h-32 resize-y`}
                      value={storyContext}
                      onChange={(event) => setStoryContext(event.target.value)}
                      maxLength={700}
                      placeholder="Exemplu: Eva găsește o ușă mică în biblioteca bunicii și ajunge într-un oraș unde poveștile și-au pierdut finalurile. Vreau să le ajute să le găsească."
                    />
                    <span className="mt-1 block text-right text-[10px] text-brand-navy/72">
                      {storyContext.length}/700
                    </span>
                  </label>
                  <label className={labelClass}>
                    Un detaliu pe care copilul îl va recunoaște
                    <textarea
                      className={`${inputClass} min-h-24 resize-y`}
                      value={personalDetail}
                      onChange={(event) =>
                        setPersonalDetail(event.target.value)
                      }
                      maxLength={240}
                      placeholder="Exemplu: poartă mereu un rucsac cu stele și adoră clătitele cu afine"
                    />
                    <span className="mt-1 block text-right text-[10px] text-brand-navy/72">
                      {personalDetail.length}/240
                    </span>
                  </label>
                  <label className={labelClass}>
                    Dedicație
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={dedication}
                      onChange={(event) => setDedication(event.target.value)}
                      maxLength={320}
                      placeholder={`Pentru ${name || "micuțul vostru"}, care găsește lumină în fiecare aventură...`}
                    />
                    <span className="mt-1 block text-right text-[10px] text-brand-navy/72">
                      {dedication.length}/320
                    </span>
                  </label>
                  <label className={labelClass}>
                    Semnătura familiei
                    <input
                      className={inputClass}
                      value={dedicationFrom}
                      onChange={(event) =>
                        setDedicationFrom(event.target.value)
                      }
                      maxLength={80}
                      placeholder="Cu drag, Mama și Tata"
                    />
                  </label>
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-serif text-3xl text-brand-navy sm:text-4xl">
                  Vezi personajul înainte de plată
                </h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/72">
                  Creăm o copertă personalizată din alegerile tale
                  {referencePhoto ? " și fotografia de referință" : ""}. După ce
                  o vezi, aceeași imagine fixează chipul, ținuta și atmosfera în
                  întreaga carte.
                </p>
                <div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15 text-sm">
                  {[
                    ["Pentru", `${name}, ${age} ani`],
                    [
                      "Referință",
                      referencePhoto ? "Fotografie + descriere" : "Descriere",
                    ],
                    ["Lume", worldLabel],
                    ["Companion", companion],
                    ...(secondaryCharacterName
                      ? [
                          [
                            "Alături de",
                            `${secondaryCharacterName}, ${secondaryCharacterRole}`,
                          ],
                        ]
                      : []),
                    ["Temă", lesson],
                    ["Atmosferă", mood],
                    ["Stil", artStyle],
                    ["Culoare", favoriteColor],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[110px_1fr] gap-4 py-3"
                    >
                      <span className="font-black text-brand-navy/72">
                        {label}
                      </span>
                      <span className="font-bold text-brand-navy">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4">
                    <BookHeart className="text-brand-purple" size={22} />
                    <p className="mt-3 font-black text-brand-navy">
                      Cartea ilustrată
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-navy/72">
                      16 pagini, ilustrații 2K și așezare pregătită pentru print
                    </p>
                  </div>
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4">
                    <Palette className="text-brand-purple" size={22} />
                    <p className="mt-3 font-black text-brand-navy">
                      Caiet inclus
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-navy/72">
                      5 pagini: colorat, labirint și diferențe
                    </p>
                  </div>
                </div>
                {isLoading && !activePreview && (
                  <div className="mt-7">
                    <LumiGenerationStage phase="character" progress={14} />
                  </div>
                )}
                {activePreview ? (
                  <div className="mt-7">
                    <LumiGenerationStage
                      phase={lumiPreviewPhase}
                      progress={lumiPreviewProgress}
                    />
                    <div className="mt-3">
                      {activePreview.ready &&
                      activePreview.pages.length === 3 ? (
                        <AlbumPreviewFlipbook
                          pages={activePreview.pages}
                          childName={name}
                        />
                      ) : (
                        <div className="relative isolate overflow-hidden border border-brand-gold/70 bg-brand-navy shadow-[0_18px_45px_rgba(9,20,45,.18)]">
                          <Image
                            unoptimized
                            src={activePreview.imageUrl}
                            alt={`Mostră personalizată pentru ${name}`}
                            width={1200}
                            height={800}
                            className="aspect-[210/148] w-full bg-brand-navy object-contain"
                            onError={() =>
                              setNotice(
                                "Imaginea nu s-a încărcat. Poți relua verificarea sau alege o mostră păstrată.",
                              )
                            }
                          />
                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,19,43,.58)_0%,rgba(8,19,43,.18)_42%,transparent_68%)]" />
                          <div className="pointer-events-none absolute left-[6%] top-[10%] max-w-[46%] text-brand-cream [text-shadow:0_2px_16px_rgba(4,12,30,.75)]">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold sm:text-[11px]">
                              Povestea Magică
                            </p>
                            <p className="mt-2 font-serif text-[clamp(1.25rem,4vw,2.45rem)] leading-[1.02]">
                              {activePreview.title}
                            </p>
                          </div>
                          <span className="pointer-events-none absolute bottom-[7%] right-[5%] rotate-[-7deg] border-2 border-white/65 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white/75 sm:text-base">
                            Mostră
                          </span>
                        </div>
                      )}
                      <div
                        className="border-x border-brand-gold/40 bg-white px-4 py-4"
                        aria-live="polite"
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/72">
                          <span>
                            {activePreview.issue
                              ? activePreview.issue === "failed"
                                ? "Generarea s-a oprit"
                                : activePreview.issue === "expired"
                                  ? "Mostră expirată"
                                  : "Verificare întreruptă"
                              : activePreview.ready
                                ? "Mostra este completă"
                                : activePreview.progress === 1
                                  ? "Coperta este gata"
                                  : "Prima pagină este gata"}
                          </span>
                          <span className="tabular-nums">
                            {activePreview.progress} / {activePreview.total}
                          </span>
                        </div>
                        <div
                          className="mt-3 h-2 overflow-hidden bg-brand-navy/10"
                          aria-label={`Progres mostră ${Math.round((activePreview.progress / activePreview.total) * 100)}%`}
                        >
                          <div
                            className="h-full bg-brand-purple transition-[width] duration-700"
                            style={{
                              width: `${(activePreview.progress / activePreview.total) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold text-brand-navy/72">
                          {["Copertă", "Pagina 1", "Pagina 2"].map(
                            (label, index) => (
                              <span
                                key={label}
                                className={
                                  index < activePreview.progress
                                    ? "text-brand-purple"
                                    : ""
                                }
                              >
                                {index < activePreview.progress ? "✓ " : ""}
                                {label}
                              </span>
                            ),
                          )}
                        </div>
                        {!activePreview.ready && !activePreview.issue && (
                          <p className="mt-3 text-xs font-bold text-brand-navy/72">
                            Timp estimat rămas:{" "}
                            {activePreview.progress === 1
                              ? "aproximativ 3-5 minute"
                              : "aproximativ 1-3 minute"}
                            . Poți păstra pagina deschisă.
                          </p>
                        )}
                        {activePreview.issue === "paused" && (
                          <button
                            type="button"
                            className="mt-3 min-h-11 underline"
                            onClick={() =>
                              setPreview((current) =>
                                current
                                  ? { ...current, issue: undefined }
                                  : null,
                              )
                            }
                          >
                            Reia verificarea · fără încercare nouă
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3 border-x border-b border-brand-gold/40 bg-brand-gold/10 p-4">
                        {activePreview.ready ? (
                          <Check
                            className="mt-0.5 shrink-0 text-brand-purple"
                            size={20}
                          />
                        ) : (
                          <Clock3
                            className="mt-0.5 shrink-0 text-brand-purple"
                            size={20}
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold leading-relaxed text-brand-navy/70">
                            {activePreview.issue
                              ? "Mostrele deja create rămân în istoricul de mai jos. Nu trebuie să reiei completarea detaliilor."
                              : activePreview.ready
                                ? `Marcajul dispare din produsul final. Coperta și cele două scene devin referința vizuală pentru restul cărții.${activePreview.qualityChecked ? " Toate cele trei imagini au trecut controlul automat." : ""}`
                                : "Coperta fixează personajul. Motorul editorial scrie acum firul poveștii și creează două pagini distincte pentru verificare."}
                          </p>
                          <button
                            type="button"
                            disabled={
                              isLoading || previewLimit?.remaining === 0
                            }
                            onClick={() => void createPreview()}
                            className="mt-3 inline-flex min-h-11 items-center gap-2 border-b border-brand-purple text-[11px] font-black text-brand-purple disabled:opacity-40"
                          >
                            <RefreshCw size={14} /> Încearcă altă variantă
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 border border-brand-purple/25 bg-brand-purple/[0.06] p-5 sm:flex sm:items-center sm:gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand-purple text-white">
                      <Eye size={24} />
                    </span>
                    <div className="mt-4 sm:mt-0">
                      <p className="font-black text-brand-navy">
                        {preview
                          ? "Alegerile s-au schimbat"
                          : "O mostră reală înainte de plată"}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/72">
                        {preview
                          ? "Creează o mostră nouă pentru a vedea personajul și paginile actualizate înainte de plată."
                          : "Primești coperta și două pagini interioare private, cu un marcaj discret. Durează câteva minute și rămân disponibile 24 de ore."}
                      </p>
                    </div>
                  </div>
                )}
                <section
                  className="mt-6 border-t border-brand-navy/15 pt-5"
                  aria-label="Mostrele tale"
                >
                  <h3 className="text-2xl">Mostrele tale</h3>
                  <p className="mt-2 text-sm">
                    {previewLimit
                      ? `${previewLimit.maxAttempts} mostre în 24 de ore: prima mostră și ${previewLimit.maxAttempts - 1} variante suplimentare. Variante rămase: ${previewLimit.remaining}. Dacă nu putem crea coperta, nu consumăm o variantă. Cererile repetate sunt limitate separat.`
                      : "Limita de încercări se verifică înainte de generare."}{" "}
                    Dacă o copertă a fost creată, dar paginile interioare nu se
                    finalizează, varianta rămâne contabilizată. Reluarea
                    verificării nu consumă o variantă nouă.
                  </p>
                  <p className="mt-2 text-xs text-brand-navy/70">
                    Mostrele sunt private, disponibile 24 de ore în această
                    filă, inclusiv după reîncărcare. Alegerea unei mostre
                    restaurează și detaliile folosite pentru ea.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previewHistory.map((item, index) => (
                      <button
                        key={item.orderId}
                        type="button"
                        disabled={isLoading || item.issue === "expired"}
                        aria-pressed={activePreview?.orderId === item.orderId}
                        onClick={() => selectPreview(item)}
                        className={`min-w-0 border p-2 text-left disabled:opacity-40 ${activePreview?.orderId === item.orderId ? "border-brand-purple bg-brand-purple/10" : "border-brand-navy/15"}`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`Coperta mostrei ${index + 1}`}
                          className="aspect-[210/148] w-full object-contain"
                        />
                        <strong className="mt-2 block text-xs">
                          Mostra {index + 1}
                          {activePreview?.orderId === item.orderId
                            ? " · selectată"
                            : ""}
                        </strong>
                        <span className="block text-xs">
                          {item.title}
                        </span>
                        <span className="block text-xs">
                          {item.ready
                            ? "Completă"
                            : item.issue === "failed"
                              ? "Generare oprită"
                              : item.issue === "expired"
                                ? "Expirată"
                                : item.issue === "paused"
                                  ? "Reia verificarea"
                                  : "În pregătire"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <div className="mt-7 flex items-end justify-between border-y border-brand-navy/15 py-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/72">
                      Preț final
                    </p>
                    <p className="mt-1 font-nunito text-4xl font-black text-brand-purple">
                      {commerce.prices.illustratedAlbum}
                    </p>
                  </div>
                  <p className="max-w-[210px] text-right text-xs font-bold leading-relaxed text-brand-navy/72">
                    Include personajul vizual, coperta premium, 13 scene 2K și
                    caietul de activități.
                  </p>
                </div>
                {activePreview && commerce.acceptsPayments && (
                  <div className="mt-6">
                    <DigitalPurchaseConsent
                      checked={hasConsent}
                      onCheckedChange={setHasConsent}
                      productLabel="Povestea Magică - Digital"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {notice && (
            <p
              role="alert"
              className="mb-5 border-l-4 border-brand-purple bg-brand-purple/8 px-4 py-3 text-sm font-bold text-brand-navy"
            >
              {notice}
            </p>
          )}
          <div className="album-form-actions flex items-center justify-between gap-3 border-t border-brand-navy/12 pt-6">
            <button
              type="button"
              onClick={() => {
                requestRef.current?.abort();
                setStep((current) => Math.max(0, current - 1));
              }}
              disabled={step === 0}
              className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-black text-brand-navy disabled:opacity-25"
            >
              <ArrowLeft size={17} /> Înapoi
            </button>
            {step < 3 ? (
              <button
                type="submit"
                className="inline-flex min-h-12 items-center gap-2 bg-brand-navy px-6 text-sm font-black text-brand-cream transition hover:bg-brand-purple"
              >
                Continuă <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (activePreview?.ready
                    ? !commerce.acceptsPayments
                    : activePreview && !activePreview.issue
                      ? true
                      : activePreview?.issue === "paused" ||
                        previewLimit?.remaining === 0)
                }
                className="inline-flex min-h-14 items-center gap-2 bg-brand-purple px-6 text-sm font-black text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoading
                  ? "Pregătim..."
                  : activePreview?.ready
                    ? "Continuă către plată"
                    : activePreview?.issue
                      ? "Creează altă mostră"
                      : activePreview
                        ? "Pregătim paginile..."
                        : "Vezi mostra personalizată"}{" "}
                <Sparkles size={18} />
              </button>
            )}
          </div>
        </div>

        <aside
          className="album-character-summary"
          aria-label="Reperele personajului"
        >
          <p className="album-eyebrow">
            {activePreview
              ? "Personajul vostru prinde viață"
              : "Reperele personajului"}
          </p>
          {(activePreview?.imageUrl || referencePhoto) && (
            <img
              src={activePreview?.imageUrl || referencePhoto}
              alt={
                activePreview
                  ? `Mostra personajului ${name}`
                  : "Fotografia de referință aleasă"
              }
            />
          )}
          <h3>{name || "Eroul vostru"}</h3>
          <dl>
            <dt>Vârsta</dt>
            <dd>{age} ani</dd>
            <dt>Aspect</dt>
            <dd>
              {hairColor}, {hairStyle}; ochi {eyeColor}; piele {skinTone}
            </dd>
            <dt>Ținuta</dt>
            <dd>
              {outfit || "Aleasă pentru aventură"}
              {appearanceDetail ? ` · ${appearanceDetail}` : ""}
            </dd>
            <dt>Lumea</dt>
            <dd>
              {world === "custom"
                ? customWorld || "Lumea voastră"
                : albumWorldOptions.find((item) => item.id === world)?.label}
            </dd>
            <dt>Împreună cu</dt>
            <dd>
              {companion}
              {secondaryCharacterName ? ` și ${secondaryCharacterName}` : ""}
            </dd>
          </dl>
          {activePreview && (
            <button
              type="button"
              className="album-inline-link"
              onClick={() => {
                setAppearanceExpanded(true);
                setStep(0);
                document
                  .getElementById("configureaza-albumul")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Corectează aspectul <ArrowLeft size={16} />
            </button>
          )}
          <p className="mt-6 text-xs leading-relaxed">
            Verifică detaliile înainte de a crea mostra. O schimbare a
            aspectului cere o mostră nouă; limita zilnică de generare se aplică
            și corecturilor.
          </p>
          <p className="mt-4 text-xs leading-relaxed">
            {commerce.prices.illustratedAlbum} · Carte digitală, caiet și audio.
            Plata urmează după mostra completă.
          </p>
        </aside>
      </div>
    </form>
  );
}

export function AlbumPrintTeaser() {
  return (
    <section className="bg-brand-cream px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 border-y border-brand-navy/15 py-10 md:grid-cols-[auto_1fr_auto] md:items-center">
        <span className="grid h-14 w-14 place-items-center bg-brand-gold text-brand-navy">
          <Printer size={27} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">
            În curând
          </p>
          <h2 className="mt-2 font-serif text-3xl text-brand-navy">
            Pachetul tipărit, gândit pentru fiecare fel de pagină
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-brand-navy/72">
            Cartea ilustrată va putea avea copertă cartonată. Jocurile vor veni
            într-un caiet separat, pe hârtie mată pe care copilul poate desena
            și colora ușor.
          </p>
        </div>
        <span className="w-fit border border-brand-navy/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-navy/72">
          Preț în curs de stabilire
        </span>
      </div>
    </section>
  );
}
