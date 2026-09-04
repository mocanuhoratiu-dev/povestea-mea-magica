"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookHeart, Camera, Check, Clock3, Download, Eye, LoaderCircle, Mail, Palette, Printer, RefreshCw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import DigitalPurchaseConsent from "@/components/DigitalPurchaseConsent";
import { albumWorldFromLumi } from "@/lib/album/presentation";
import { albumArtStyleOptions, albumCompanionOptions, albumLessonOptions, albumMoodOptions, albumWorldOptions, type AlbumConfiguration } from "@/lib/album/types";
import { beginPreparedOrderCheckout } from "@/lib/clientOrderCheckout";
import { trackEvent } from "@/lib/clientTelemetry";
import { commerce } from "@/lib/siteMode";
import { prepareReferencePhoto } from "@/lib/album/clientReferencePhoto";
import AlbumPreviewFlipbook, { type AlbumPreviewPage } from "@/components/AlbumPreviewFlipbook";

const steps = ["Copilul", "Aventura", "Mesajul vostru", "Mostra"];
const colors = [
  { label: "Mov ametist", value: "mov ametist", swatch: "#8052a0" },
  { label: "Albastru ceresc", value: "albastru ceresc", swatch: "#5b93af" },
  { label: "Verde smarald", value: "verde smarald", swatch: "#5e967a" },
  { label: "Roz zmeură", value: "roz zmeură", swatch: "#d97786" },
  { label: "Galben solar", value: "galben solar", swatch: "#e5b84f" },
];

const inputClass = "mt-2 min-h-12 w-full border border-brand-navy/20 bg-white px-4 py-3 text-sm font-bold text-brand-navy outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15";
const labelClass = "block text-xs font-black uppercase tracking-[0.12em] text-brand-navy/60";
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
};

function readPreviewPages(value: unknown): AlbumPreviewPage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const page = item as Record<string, unknown>;
    if (!["cover", "story"].includes(String(page.kind)) || typeof page.imageUrl !== "string" || typeof page.title !== "string" || typeof page.text !== "string") return [];
    const layout = ["cinematic", "image-left", "image-right"].includes(String(page.layout)) ? page.layout as AlbumPreviewPage["layout"] : undefined;
    return [{ kind: page.kind as AlbumPreviewPage["kind"], imageUrl: page.imageUrl, eyebrow: typeof page.eyebrow === "string" ? page.eyebrow : "Povestea Magică", title: page.title, text: page.text, ...(layout ? { layout } : {}) }];
  }).slice(0, 3);
}

function readStoredPreview(value: unknown): AlbumPreviewState | null {
  if (!value || typeof value !== "object") return null;
  const preview = value as Record<string, unknown>;
  if (
    typeof preview.orderId !== "string"
    || typeof preview.imageUrl !== "string"
    || typeof preview.statusUrl !== "string"
    || typeof preview.title !== "string"
    || typeof preview.configurationFingerprint !== "string"
  ) return null;
  return {
    orderId: preview.orderId,
    imageUrl: preview.imageUrl,
    title: preview.title,
    configurationFingerprint: preview.configurationFingerprint,
    qualityChecked: preview.qualityChecked === true,
    statusUrl: preview.statusUrl,
    pages: readPreviewPages(preview.pages),
    ready: preview.ready === true,
  };
}

export default function AlbumCreator() {
  const [step, setStep] = useState(0);
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
  const [secondaryCharacterAppearance, setSecondaryCharacterAppearance] = useState("");
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
  const [preview, setPreview] = useState<AlbumPreviewState | null>(null);
  const [referencePhoto, setReferencePhoto] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);

  const worldLabel = useMemo(() => world === "custom" && customWorld.trim() ? customWorld.trim() : albumWorldOptions.find((option) => option.id === world)?.label || "Lume magică", [world, customWorld]);
  const albumConfiguration = useMemo<AlbumConfiguration>(() => ({
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
      referenceMode: referencePhoto ? "photo" : "description",
    },
    dedication: dedication.trim(),
    dedicationFrom: dedicationFrom.trim(),
  }), [name, age, hairStyle, hairColor, eyeColor, skinTone, outfit, appearanceDetail, favoriteColor, world, customWorld, companion, secondaryCharacterName, secondaryCharacterRole, secondaryCharacterAppearance, lesson, mood, artStyle, personalDetail, storyContext, dedication, dedicationFrom, referencePhoto]);
  const configurationFingerprint = useMemo(() => JSON.stringify(albumConfiguration), [albumConfiguration]);
  const activePreview = preview?.configurationFingerprint === configurationFingerprint ? preview : null;
  const canContinue = step === 0
    ? Boolean(name.trim() && age && hairStyle && hairColor && eyeColor && skinTone && outfit.trim() && (!referencePhoto || photoConsent))
    : step === 1
      ? Boolean((world !== "custom" || customWorld.trim()) && (!secondaryCharacterName.trim() || secondaryCharacterRole.trim()))
      : true;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = window.sessionStorage.getItem(albumDraftKey);
        if (stored) {
          const draft = JSON.parse(stored) as Record<string, unknown>;
          if (typeof draft.name === "string") setName(draft.name.slice(0, 40));
          if (typeof draft.age === "string") setAge(draft.age);
          if (typeof draft.hairStyle === "string") setHairStyle(draft.hairStyle);
          if (typeof draft.hairColor === "string") setHairColor(draft.hairColor);
          if (typeof draft.eyeColor === "string") setEyeColor(draft.eyeColor);
          if (typeof draft.skinTone === "string") setSkinTone(draft.skinTone);
          if (typeof draft.outfit === "string") setOutfit(draft.outfit.slice(0, 100));
          if (typeof draft.appearanceDetail === "string") setAppearanceDetail(draft.appearanceDetail.slice(0, 240));
          if (typeof draft.favoriteColor === "string") setFavoriteColor(draft.favoriteColor);
          if (typeof draft.world === "string" && albumWorldOptions.some((option) => option.id === draft.world)) setWorld(draft.world);
          if (typeof draft.customWorld === "string") setCustomWorld(draft.customWorld.slice(0, 280));
          if (typeof draft.companion === "string" && albumCompanionOptions.includes(draft.companion as (typeof albumCompanionOptions)[number])) setCompanion(draft.companion);
          if (typeof draft.secondaryCharacterName === "string") setSecondaryCharacterName(draft.secondaryCharacterName.slice(0, 40));
          if (typeof draft.secondaryCharacterRole === "string") setSecondaryCharacterRole(draft.secondaryCharacterRole.slice(0, 60));
          if (typeof draft.secondaryCharacterAppearance === "string") setSecondaryCharacterAppearance(draft.secondaryCharacterAppearance.slice(0, 180));
          if (typeof draft.lesson === "string" && albumLessonOptions.includes(draft.lesson as (typeof albumLessonOptions)[number])) setLesson(draft.lesson);
          if (typeof draft.mood === "string" && albumMoodOptions.includes(draft.mood as (typeof albumMoodOptions)[number])) setMood(draft.mood);
          if (typeof draft.artStyle === "string" && albumArtStyleOptions.includes(draft.artStyle as (typeof albumArtStyleOptions)[number])) setArtStyle(draft.artStyle);
          if (typeof draft.personalDetail === "string") setPersonalDetail(draft.personalDetail.slice(0, 240));
          if (typeof draft.storyContext === "string") setStoryContext(draft.storyContext.slice(0, 700));
          if (typeof draft.dedication === "string") setDedication(draft.dedication.slice(0, 320));
          if (typeof draft.dedicationFrom === "string") setDedicationFrom(draft.dedicationFrom.slice(0, 80));
          const storedPreview = readStoredPreview(draft.preview);
          if (storedPreview) setPreview(storedPreview);
          setStep(3);
        }
        if (new URLSearchParams(window.location.search).get("plata") === "anulata") {
          setNotice("Plata nu a fost finalizată. Alegerile poveștii sunt păstrate și le poți verifica înainte să încerci din nou.");
        }
      } catch {
        // Browser storage is optional; the configurator remains fully usable without it.
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  const persistDraft = (currentPreview: AlbumPreviewState | null = activePreview) => {
    try {
      window.sessionStorage.setItem(albumDraftKey, JSON.stringify({
        ...albumConfiguration.generation,
        dedication: albumConfiguration.dedication,
        dedicationFrom: albumConfiguration.dedicationFrom,
        preview: currentPreview,
      }));
    } catch {
      // Checkout remains available when session storage is disabled.
    }
  };

  const createPreview = async () => {
    setIsLoading(true);
    setNotice("");
    setHasConsent(false);
    trackEvent("product_started", { product: "album" });
    try {
      const response = await fetch("/api/album-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuration: albumConfiguration, ...(referencePhoto ? { referenceImageDataUrl: referencePhoto, photoConsent: photoConsent === true } : {}) }),
      });
      const result = await response.json() as { orderId?: string; previewUrl?: string; statusUrl?: string; title?: string; qualityChecked?: boolean; error?: string };
      if (!response.ok || !result.orderId || !result.previewUrl || !result.statusUrl || !result.title) {
        throw new Error(result.error || "Mostra nu a putut fi creată acum.");
      }
      const nextPreview: AlbumPreviewState = {
        orderId: result.orderId,
        imageUrl: result.previewUrl,
        title: result.title,
        configurationFingerprint,
        qualityChecked: result.qualityChecked === true,
        statusUrl: result.statusUrl,
        pages: [{ kind: "cover", imageUrl: result.previewUrl, eyebrow: "Povestea Magică", title: result.title, text: `O aventură creată pentru ${name.trim()}` }],
        ready: false,
      };
      setPreview(nextPreview);
      persistDraft(nextPreview);
      setNotice("Coperta este gata. Pregătim acum două pagini reale din poveste, pe care le vei putea răsfoi înainte de plată.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Mostra nu a putut fi creată acum.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activePreview?.statusUrl || activePreview.ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const response = await fetch(activePreview.statusUrl as string, { cache: "no-store" });
        const result = await response.json() as { status?: string; pages?: unknown; title?: string; qualityChecked?: boolean; progress?: number; total?: number; error?: string };
        if (cancelled) return;
        if (result.status === "ready") {
          const pages = readPreviewPages(result.pages);
          if (pages.length !== 3) throw new Error("Mostra nu conține toate paginile.");
          const nextPreview: AlbumPreviewState = {
            ...activePreview,
            title: result.title || activePreview.title,
            qualityChecked: result.qualityChecked === true,
            pages,
            ready: true,
          };
          setPreview(nextPreview);
          setNotice("Mostra este gata. Răsfoiește coperta și cele două pagini; exact aceste imagini vor intra în carte după plată.");
          try {
            window.sessionStorage.setItem(albumDraftKey, JSON.stringify({
              ...albumConfiguration.generation,
              dedication: albumConfiguration.dedication,
              dedicationFrom: albumConfiguration.dedicationFrom,
              preview: nextPreview,
            }));
          } catch {
            // Preview remains usable if browser storage is disabled.
          }
          return;
        }
        if (result.status === "failed") throw new Error(result.error || "Mostra interioară nu a putut fi creată.");
        setNotice(`Construim paginile de interior ${Math.max(0, result.progress || 0)} din ${Math.max(2, result.total || 2)}. Poți rămâne pe această pagină.`);
      } catch (error) {
        if (cancelled) return;
        if (attempts >= 100) {
          setPreview(null);
          setNotice(error instanceof Error ? error.message : "Mostra nu a putut fi verificată.");
          return;
        }
      }
      timer = setTimeout(poll, 4_000);
    };
    timer = setTimeout(poll, 1_500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activePreview, albumConfiguration]);

  useEffect(() => {
    const lessonMap: Record<string, string> = {
      "Curaj și încredere 💪": "Curaj și încredere",
      "Împărțitul jucăriilor 🧸": "Prietenie și bunătate",
      "Rutina de somn 🌙": "Înțelegerea emoțiilor",
      "Importanța prieteniei 🤝": "Prietenie și bunătate",
      "Descoperirea naturii 🌱": "Curiozitate și descoperire",
    };
    const applyChoice = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail || {};
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
      if (typeof detail.outfit === "string") setOutfit(detail.outfit.slice(0, 100));
      if (typeof detail.appearanceDetail === "string") setAppearanceDetail(detail.appearanceDetail.slice(0, 240));
      if (typeof detail.favoriteColor === "string") setFavoriteColor(detail.favoriteColor);
      if (typeof detail.world === "string" && albumWorldOptions.some((option) => option.id === detail.world)) setWorld(detail.world);
      if (typeof detail.customWorld === "string") setCustomWorld(detail.customWorld.slice(0, 280));
      if (typeof detail.companion === "string" && albumCompanionOptions.includes(detail.companion as (typeof albumCompanionOptions)[number])) setCompanion(detail.companion);
      if (typeof detail.secondaryCharacterName === "string") setSecondaryCharacterName(detail.secondaryCharacterName.slice(0, 40));
      if (typeof detail.secondaryCharacterRole === "string") setSecondaryCharacterRole(detail.secondaryCharacterRole.slice(0, 60));
      if (typeof detail.secondaryCharacterAppearance === "string") setSecondaryCharacterAppearance(detail.secondaryCharacterAppearance.slice(0, 180));
      if (typeof detail.lesson === "string" && albumLessonOptions.includes(detail.lesson as (typeof albumLessonOptions)[number])) setLesson(detail.lesson);
      if (typeof detail.mood === "string" && albumMoodOptions.includes(detail.mood as (typeof albumMoodOptions)[number])) setMood(detail.mood);
      if (typeof detail.artStyle === "string" && albumArtStyleOptions.includes(detail.artStyle as (typeof albumArtStyleOptions)[number])) setArtStyle(detail.artStyle);
      if (typeof detail.storyContext === "string") setStoryContext(detail.storyContext.slice(0, 700));
      if (typeof detail.personalDetail === "string") setPersonalDetail(detail.personalDetail.slice(0, 240));
      if (typeof detail.dedication === "string") setDedication(detail.dedication.slice(0, 320));
      if (typeof detail.dedicationFrom === "string") setDedicationFrom(detail.dedicationFrom.slice(0, 80));
      if (typeof detail.lesson === "string" && lessonMap[detail.lesson]) setLesson(lessonMap[detail.lesson]);
      if (typeof detail.storyDetail === "string" && detail.storyDetail.trim()) setPersonalDetail(detail.storyDetail.trim().slice(0, 180));
      setStep(3);
      setNotice("Lumi a așezat toate alegerile în poveste. Verifică rezumatul și creează mostra.");
    };
    window.addEventListener("pmm:lumi-album-choice", applyChoice);
    const rememberedChoice = window.sessionStorage.getItem("pmm-lumi-album-choice");
    if (rememberedChoice) {
      window.sessionStorage.removeItem("pmm-lumi-album-choice");
      try {
        applyChoice(new CustomEvent("pmm:lumi-album-choice", { detail: JSON.parse(rememberedChoice) }));
      } catch {
        // The configurator remains usable if browser storage contains invalid data.
      }
    }
    return () => window.removeEventListener("pmm:lumi-album-choice", applyChoice);
  }, []);

  const goNext = () => {
    if (!canContinue) {
      const message = step === 1
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
      setPhotoConsent(false);
      setPreview(null);
      setHasConsent(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Fotografia nu a putut fi pregătită.");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    if (!activePreview) {
      await createPreview();
      return;
    }
    if (!commerce.acceptsPayments) {
      setNotice("Comenzile pentru Povestea Magică se deschid odată cu activarea plăților.");
      return;
    }
    if (!hasConsent) {
      setNotice("Confirmă livrarea imediată a produsului digital înainte de plată.");
      return;
    }

    setIsLoading(true);
    setNotice("");
    try {
      persistDraft(activePreview);
      await beginPreparedOrderCheckout("illustrated-album-digital", activePreview.orderId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Plata nu a putut fi deschisă acum.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="border-y border-brand-navy/15 bg-white">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <div className="px-5 py-8 sm:px-8 md:px-12 md:py-12">
          <div className="grid grid-cols-4 border-y border-brand-navy/12" aria-label="Pașii configurării">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`min-h-16 border-r border-brand-navy/10 px-2 py-3 text-center last:border-r-0 ${index === step ? "bg-brand-navy text-brand-cream" : index < step ? "text-brand-purple" : "text-brand-navy/35"}`}
              >
                <span className="block font-mono text-[10px] font-black">0{index + 1}</span>
                <span className="mt-1 block text-[11px] font-black sm:text-xs">{label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[470px] pt-9">
            {step === 0 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Cum apare copilul în poveste?</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Construim mai întâi personajul, apoi îl păstrăm recognoscibil în copertă și în toate cele 13 ilustrații.</p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>Prenume<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Exemplu: Eva" autoComplete="off" required /></label>
                  <label className={labelClass}>Vârsta<select className={inputClass} value={age} onChange={(event) => setAge(event.target.value)}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} ani</option>)}</select></label>
                  <label className={labelClass}>Coafura<select className={inputClass} value={hairStyle} onChange={(event) => setHairStyle(event.target.value)}><option>scurt și drept</option><option>ondulat până la umeri</option><option>lung și drept</option><option>creț</option><option>două împletituri</option></select></label>
                  <label className={labelClass}>Culoarea părului<select className={inputClass} value={hairColor} onChange={(event) => setHairColor(event.target.value)}><option>șaten</option><option>blond</option><option>brunet</option><option>roșcat</option><option>negru</option></select></label>
                  <label className={labelClass}>Culoarea ochilor<select className={inputClass} value={eyeColor} onChange={(event) => setEyeColor(event.target.value)}><option>căprui</option><option>albaștri</option><option>verzi</option><option>cenușii</option><option>negri</option></select></label>
                  <label className={labelClass}>Nuanța pielii<select className={inputClass} value={skinTone} onChange={(event) => setSkinTone(event.target.value)}><option>deschisă</option><option>medie</option><option>măslinie</option><option>închisă</option></select></label>
                  <label className={`${labelClass} sm:col-span-2`}>Ținuta personajului<input className={inputClass} value={outfit} onChange={(event) => setOutfit(event.target.value)} maxLength={100} placeholder="Exemplu: rochiță galbenă și cizme mov" /></label>
                  <label className={`${labelClass} sm:col-span-2`}>Alte detalii de aspect, opțional<textarea className={`${inputClass} min-h-20 resize-y`} value={appearanceDetail} onChange={(event) => setAppearanceDetail(event.target.value)} maxLength={240} placeholder="Ochelari rotunzi, pistrui, un semn din naștere sau accesoriul preferat" /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{appearanceDetail.length}/240</span></label>
                  <div className="border border-brand-gold/55 bg-brand-gold/[0.08] p-5 sm:col-span-2">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center bg-brand-navy text-brand-gold"><Camera size={21} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-brand-navy">Fotografie de referință, opțional</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">Ajută la păstrarea trăsăturilor copilului. Nu este afișată ca fotografie în poveste, nu ajunge la procesatorul de plăți și este folosită numai pentru comanda aceasta.</p>
                      </div>
                    </div>
                    {referencePhoto ? (
                      <div className="mt-5 grid gap-4 sm:grid-cols-[96px_1fr] sm:items-center">
                        {/* A native image avoids Next.js optimizing a private in-memory data URL. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={referencePhoto} alt="Fotografia de referință selectată" className="h-24 w-24 border border-brand-gold/60 object-cover" />
                        <div>
                          <label className="flex cursor-pointer items-start gap-3 text-xs font-bold leading-relaxed text-brand-navy/75">
                            <input type="checkbox" checked={photoConsent} onChange={(event) => setPhotoConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-purple" />
                            Confirm că sunt părintele/reprezentantul legal sau am permisiunea de a folosi această fotografie pentru generarea poveștii.
                          </label>
                          <button type="button" onClick={() => { setReferencePhoto(""); setPhotoConsent(false); setPreview(null); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-brand-purple"><Trash2 size={15} /> Elimină fotografia</button>
                        </div>
                      </div>
                    ) : (
                      <label className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-brand-navy/20 bg-white px-4 text-xs font-black text-brand-navy transition hover:border-brand-purple">
                        <Camera size={16} /> Alege fotografia
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void chooseReferencePhoto(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>
                    )}
                    <div className="mt-4 flex gap-2 border-t border-brand-navy/10 pt-4 text-[11px] font-semibold leading-relaxed text-brand-navy/55"><ShieldCheck size={17} className="shrink-0 text-brand-purple" />Fișierul este redimensionat înainte de încărcare și curățat din nou pe server. Poți crea povestea și numai din descriere.</div>
                  </div>
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Alege lumea și firul aventurii</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Alegerile devin întâmplări, decoruri și momente reale din poveste.</p>
                <div className="mt-8">
                  <p className={labelClass}>Lumea poveștii</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {albumWorldOptions.map((option) => <button key={option.id} type="button" onClick={() => setWorld(option.id)} className={`min-h-12 border px-4 py-3 text-left text-sm font-black ${world === option.id ? "border-brand-purple bg-brand-purple text-white" : "border-brand-navy/15 bg-brand-cream text-brand-navy"}`}>{option.label}</button>)}
                  </div>
                  {world === "custom" && <label className={`${labelClass} mt-4`}>Descrie lumea inventată<textarea className={`${inputClass} min-h-24 resize-y`} value={customWorld} onChange={(event) => setCustomWorld(event.target.value)} maxLength={280} placeholder="O lume roz a zânelor, cu poduri din flori și stele care cântă..." /></label>}
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>Companion<select className={inputClass} value={companion} onChange={(event) => setCompanion(event.target.value)}>{albumCompanionOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className={labelClass}>Ce descoperim împreună<select className={inputClass} value={lesson} onChange={(event) => setLesson(event.target.value)}>{albumLessonOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className={labelClass}>Atmosfera poveștii<select className={inputClass} value={mood} onChange={(event) => setMood(event.target.value)}>{albumMoodOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className={labelClass}>Stilul ilustrațiilor<select className={inputClass} value={artStyle} onChange={(event) => setArtStyle(event.target.value)}>{albumArtStyleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <div className="border-t border-brand-navy/12 pt-5 sm:col-span-2"><p className="text-sm font-black text-brand-navy">O persoană dragă în poveste <span className="font-semibold text-brand-navy/45">opțional</span></p><p className="mt-1 text-xs font-semibold text-brand-navy/55">Poate fi un frate, o soră, un părinte sau un prieten. Îl păstrăm separat și recognoscibil.</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><label className={labelClass}>Prenume<input className={inputClass} value={secondaryCharacterName} onChange={(event) => setSecondaryCharacterName(event.target.value)} maxLength={40} placeholder="Exemplu: Eva" /></label><label className={labelClass}>Relația cu copilul<input className={inputClass} value={secondaryCharacterRole} onChange={(event) => setSecondaryCharacterRole(event.target.value)} maxLength={60} placeholder="sora mai mare" /></label></div><label className={`${labelClass} mt-5`}>Cum arată?<input className={inputClass} value={secondaryCharacterAppearance} onChange={(event) => setSecondaryCharacterAppearance(event.target.value)} maxLength={180} placeholder="blondă, cu părul creț și o rochie albastră" /></label></div>
                </div>
                <div className="mt-6">
                  <p className={labelClass}>Culoarea preferată</p>
                  <div className="mt-3 flex flex-wrap gap-2">{colors.map((color) => <button key={color.value} type="button" onClick={() => setFavoriteColor(color.value)} aria-pressed={favoriteColor === color.value} className={`inline-flex min-h-11 items-center gap-2 border px-3 text-xs font-black ${favoriteColor === color.value ? "border-brand-navy bg-brand-navy text-white" : "border-brand-navy/15 text-brand-navy"}`}><span className="h-4 w-4 border border-white/70" style={{ backgroundColor: color.swatch }} />{color.label}</button>)}</div>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="font-serif text-3xl text-brand-navy sm:text-4xl">Puneți o bucățică din familie în poveste</legend>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Poți lăsa autorul să creeze liber sau poți descrie chiar tu ideea aventurii. Dedicația rămâne pe pagina ei.</p>
                <div className="mt-8 space-y-6">
                  <label className={labelClass}>Cum ai vrea să fie povestea?<textarea className={`${inputClass} min-h-32 resize-y`} value={storyContext} onChange={(event) => setStoryContext(event.target.value)} maxLength={700} placeholder="Exemplu: Eva găsește o ușă mică în biblioteca bunicii și ajunge într-un oraș unde poveștile și-au pierdut finalurile. Vreau să le ajute să le găsească." /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{storyContext.length}/700</span></label>
                  <label className={labelClass}>Un detaliu pe care copilul îl va recunoaște<textarea className={`${inputClass} min-h-24 resize-y`} value={personalDetail} onChange={(event) => setPersonalDetail(event.target.value)} maxLength={240} placeholder="Exemplu: poartă mereu un rucsac cu stele și adoră clătitele cu afine" /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{personalDetail.length}/240</span></label>
                  <label className={labelClass}>Dedicație<textarea className={`${inputClass} min-h-28 resize-y`} value={dedication} onChange={(event) => setDedication(event.target.value)} maxLength={320} placeholder={`Pentru ${name || "micuțul vostru"}, care găsește lumină în fiecare aventură...`} /><span className="mt-1 block text-right text-[10px] text-brand-navy/40">{dedication.length}/320</span></label>
                  <label className={labelClass}>Semnătura familiei<input className={inputClass} value={dedicationFrom} onChange={(event) => setDedicationFrom(event.target.value)} maxLength={80} placeholder="Cu drag, Mama și Tata" /></label>
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-serif text-3xl text-brand-navy sm:text-4xl">Vezi personajul înainte de plată</h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-brand-navy/60">Creăm o copertă personalizată din alegerile tale{referencePhoto ? " și fotografia de referință" : ""}. După ce o vezi, aceeași imagine fixează chipul, ținuta și atmosfera în întreaga carte.</p>
                <div className="mt-8 divide-y divide-brand-navy/12 border-y border-brand-navy/15 text-sm">
                  {[['Pentru', `${name}, ${age} ani`], ['Referință', referencePhoto ? 'Fotografie + descriere' : 'Descriere'], ['Lume', worldLabel], ['Companion', companion], ...(secondaryCharacterName ? [['Alături de', `${secondaryCharacterName}, ${secondaryCharacterRole}`]] : []), ['Temă', lesson], ['Atmosferă', mood], ['Stil', artStyle], ['Culoare', favoriteColor]].map(([label, value]) => <div key={label} className="grid grid-cols-[110px_1fr] gap-4 py-3"><span className="font-black text-brand-navy/45">{label}</span><span className="font-bold text-brand-navy">{value}</span></div>)}
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4"><BookHeart className="text-brand-purple" size={22} /><p className="mt-3 font-black text-brand-navy">Cartea ilustrată</p><p className="mt-1 text-xs font-semibold text-brand-navy/60">16 pagini, ilustrații 2K și așezare pregătită pentru print</p></div>
                  <div className="border border-brand-gold/60 bg-brand-gold/10 p-4"><Palette className="text-brand-purple" size={22} /><p className="mt-3 font-black text-brand-navy">Caiet inclus</p><p className="mt-1 text-xs font-semibold text-brand-navy/60">5 pagini: colorat, labirint și diferențe</p></div>
                </div>
                {activePreview ? (
                  <div className="mt-7">
                    {activePreview.ready && activePreview.pages.length === 3 ? <AlbumPreviewFlipbook pages={activePreview.pages} childName={name} /> : <div className="relative isolate overflow-hidden border border-brand-gold/70 bg-brand-navy shadow-[0_18px_45px_rgba(9,20,45,.18)]">
                      <Image
                        unoptimized
                        src={activePreview.imageUrl}
                        alt={`Mostră personalizată pentru ${name}`}
                        width={1200}
                        height={800}
                        className="aspect-[3/2] w-full object-cover"
                        onError={() => {
                          setPreview(null);
                          setHasConsent(false);
                          setNotice("Mostra a expirat. Creează una nouă pentru a continua către plată.");
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,19,43,.58)_0%,rgba(8,19,43,.18)_42%,transparent_68%)]" />
                      <div className="pointer-events-none absolute left-[6%] top-[10%] max-w-[46%] text-brand-cream [text-shadow:0_2px_16px_rgba(4,12,30,.75)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold sm:text-[11px]">Povestea Magică</p>
                        <p className="mt-2 font-serif text-[clamp(1.25rem,4vw,2.45rem)] leading-[1.02]">{activePreview.title}</p>
                      </div>
                      <span className="pointer-events-none absolute bottom-[7%] right-[5%] rotate-[-7deg] border-2 border-white/65 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white/75 sm:text-base">Mostră</span>
                    </div>}
                    <div className="flex gap-3 border-x border-b border-brand-gold/40 bg-brand-gold/10 p-4">
                      {activePreview.ready ? <Check className="mt-0.5 shrink-0 text-brand-purple" size={20} /> : <LoaderCircle className="mt-0.5 shrink-0 animate-spin text-brand-purple" size={20} />}
                      <div><p className="text-xs font-bold leading-relaxed text-brand-navy/70">{activePreview.ready ? `Marcajul dispare din produsul final. Coperta și cele două scene devin referința vizuală pentru restul cărții.${activePreview.qualityChecked ? " Toate cele trei imagini au trecut controlul automat." : ""}` : "Coperta fixează personajul. Motorul editorial scrie acum firul poveștii și creează două pagini distincte pentru verificare."}</p><button type="button" onClick={() => { setPreview(null); setHasConsent(false); }} className="mt-3 inline-flex min-h-9 items-center gap-2 border-b border-brand-purple text-[11px] font-black text-brand-purple"><RefreshCw size={14} /> Încearcă altă variantă</button></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 border border-brand-purple/25 bg-brand-purple/[0.06] p-5 sm:flex sm:items-center sm:gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand-purple text-white"><Eye size={24} /></span>
                    <div className="mt-4 sm:mt-0"><p className="font-black text-brand-navy">{preview ? "Alegerile s-au schimbat" : "O mostră reală înainte de plată"}</p><p className="mt-1 text-xs font-semibold leading-relaxed text-brand-navy/60">{preview ? "Creează o mostră nouă pentru a vedea personajul și paginile actualizate înainte de plată." : "Primești coperta și două pagini interioare private, cu un marcaj discret. Durează câteva minute și rămân disponibile 24 de ore."}</p></div>
                  </div>
                )}
                <div className="mt-7 flex items-end justify-between border-y border-brand-navy/15 py-5"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/45">Preț final</p><p className="mt-1 font-nunito text-4xl font-black text-brand-purple">{commerce.prices.illustratedAlbum}</p></div><p className="max-w-[210px] text-right text-xs font-bold leading-relaxed text-brand-navy/55">Include personajul vizual, coperta premium, 13 scene 2K și caietul de activități.</p></div>
                {activePreview && commerce.acceptsPayments && <div className="mt-6"><DigitalPurchaseConsent checked={hasConsent} onCheckedChange={setHasConsent} productLabel="Povestea Magică - Digital" /></div>}
              </div>
            )}
          </div>

          {notice && <p role="alert" className="mb-5 border-l-4 border-brand-purple bg-brand-purple/8 px-4 py-3 text-sm font-bold text-brand-navy">{notice}</p>}
          <div className="mb-20 flex items-center justify-between gap-3 border-t border-brand-navy/12 pt-6 sm:mb-0">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isLoading} className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-black text-brand-navy disabled:opacity-25"><ArrowLeft size={17} /> Înapoi</button>
            {step < 3 ? <button type="submit" className="inline-flex min-h-12 items-center gap-2 bg-brand-navy px-6 text-sm font-black text-brand-cream transition hover:bg-brand-purple">Continuă <ArrowRight size={17} /></button> : <button type="submit" disabled={isLoading || Boolean(activePreview && (!activePreview.ready || !commerce.acceptsPayments))} className="inline-flex min-h-14 items-center gap-2 bg-brand-purple px-6 text-sm font-black text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-45">{isLoading ? (activePreview ? "Deschidem plata..." : "Creăm coperta...") : activePreview ? (activePreview.ready ? "Continuă către plată" : "Pregătim paginile...") : "Vezi mostra personalizată"} <Sparkles size={18} /></button>}
          </div>
        </div>

        <aside className="border-t border-brand-navy/15 bg-brand-navy px-5 py-9 text-brand-cream sm:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-gold">Vezi ce primești</p>
          <div className="mt-5 overflow-hidden border border-brand-gold/50"><Image src="/examples/album/coperta.webp" alt="Coperta modelului Povestea Magică" width={960} height={676} priority className="h-auto w-full" /></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><Image src="/examples/album/aventura.webp" alt="Pagină ilustrată" width={480} height={338} className="aspect-[1.42] w-full object-cover" /><Image src="/examples/album/colorat.webp" alt="Pagină de colorat" width={480} height={338} className="aspect-[1.42] w-full object-cover" /><Image src="/examples/album/labirint.webp" alt="Pagină cu labirint" width={480} height={338} className="aspect-[1.42] w-full object-cover" /><Image src="/examples/album/diferente.webp" alt="Pagină cu joc de diferențe" width={480} height={338} className="aspect-[1.42] w-full object-cover" /></div>
          <p className="mt-5 font-serif text-2xl">O poveste construită ca o carte adevărată.</p>
          <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/75">{["Personaj construit din descriere sau fotografie", "Fiecare ilustrație trece prin control de calitate", "Textul nu acoperă imaginile", "Caiet separat cu 3 activități", "Carte digitală de răsfoit, audio și PDF-uri A5 în format orizontal"].map((item) => <li key={item} className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-brand-gold" />{item}</li>)}</ul>
          <div className="mt-8 grid grid-cols-3 border-y border-brand-cream/15 py-5 text-center"><div><Clock3 className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">6-10 minute</p></div><div><Mail className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">Primești email</p></div><div><Download className="mx-auto text-brand-gold" size={19} /><p className="mt-2 text-[10px] font-black">2 PDF-uri</p></div></div>
          <Link href="/modele#povestea-magica" className="mt-7 inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-sm font-black text-brand-gold">Vezi paginile modelului <ArrowRight size={16} /></Link>
        </aside>
      </div>
    </form>
  );
}

export function AlbumPrintTeaser() {
  return (
    <section className="bg-brand-cream px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 border-y border-brand-navy/15 py-10 md:grid-cols-[auto_1fr_auto] md:items-center">
        <span className="grid h-14 w-14 place-items-center bg-brand-gold text-brand-navy"><Printer size={27} /></span>
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">În curând</p><h2 className="mt-2 font-serif text-3xl text-brand-navy">Pachetul tipărit, gândit pentru fiecare fel de pagină</h2><p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-brand-navy/65">Cartea ilustrată va putea avea copertă cartonată. Jocurile vor veni într-un caiet separat, pe hârtie mată pe care copilul poate desena și colora ușor.</p></div>
        <span className="w-fit border border-brand-navy/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-navy/50">Preț în curs de stabilire</span>
      </div>
    </section>
  );
}
