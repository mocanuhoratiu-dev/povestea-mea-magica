"use client";

import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Headphones,
  Mail,
  Pause,
  Play,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  KIT_COLORS,
  KIT_CONTEXT_OPTIONS,
  KIT_FEAR_OPTIONS,
  KIT_NAMES,
  KIT_PAGE_COUNTS,
  kitNarration,
  readKitInput,
  readPremiumKit,
  type KitInput,
  type KitKind,
  type PremiumKit,
} from "@/lib/kits/content";
import { kitSample } from "@/lib/kits/sample";
import { buildKitPages } from "@/lib/kits/template";
import { beginOrderCheckout } from "@/lib/clientOrderCheckout";
import { protectedFetch } from "@/lib/clientTurnstile";
import { trackEvent } from "@/lib/clientTelemetry";
import {
  playNarration,
  stopNarration,
  subscribeToNarration,
} from "@/lib/narrationPlayback";
import { commerce } from "@/lib/siteMode";
import DigitalPurchaseConsent from "./DigitalPurchaseConsent";
import EmailDelivery from "./EmailDelivery";
import QuickRating from "./QuickRating";
import VerifiedReviewForm from "./VerifiedReviewForm";
import PremiumKitReader from "./PremiumKitReader";
import PremiumKitPrint, { renderPremiumKitPdf } from "./PremiumKitPrint";
import "./premium-kit.css";
import CharacterPhotoInput from "./CharacterPhotoInput";
import CharacterRightsNotice from "./CharacterRightsNotice";
import { describePhotoTraits, type ApprovedCharacter } from "@/lib/characterPhotoPolicy";

const LegacyMonster = dynamic(() => import("./LegacyMonsterKit"));
const LegacyEmergency = dynamic(() => import("./LegacyEmergencyKit"));

export default function PremiumKitCreator({ kind }: { kind: KitKind }) {
  const night = kind === "monster",
    title = KIT_NAMES[kind];
  const target = night ? "configureaza-scutul" : "configureaza-trusa";
  const sample = useMemo(() => kitSample(kind), [kind]);
  const [draft, setDraft] = useState<Record<string, string>>({
    name: "",
    age: "4",
    appearance: "",
    monster: KIT_FEAR_OPTIONS[0][0],
    context: night ? "" : KIT_CONTEXT_OPTIONS[0][0],
    interest: "",
    tone: "",
    trustedAdult: "",
    favoriteColor: "pruna",
    duration: "10-20 minute",
    difficulty: "easy",
  });
  const [step, setStep] = useState(0),
    [consent, setConsent] = useState(false),
    [preview, setPreview] = useState(false);
  const [character, setCharacter] = useState<ApprovedCharacter | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const acceptCharacter = useCallback((value: ApprovedCharacter | null) => {
    setCharacter(value); setPreview(false);
    setDraft(previous => ({ ...previous, appearance: value ? describePhotoTraits(value.traits).slice(0, 240) : "" }));
  }, []);
  const [busy, setBusy] = useState(false),
    [downloading, setDownloading] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<{
      input: KitInput;
      kit: PremiumKit;
    } | null>(null),
    [legacy, setLegacy] = useState(false);
  const [access, setAccess] = useState({ orderId: "", token: "" }),
    [rated, setRated] = useState(false);
  const [audio, setAudio] = useState<"idle" | "loading" | "playing">("idle");
  const printRef = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    exportBusy = useRef(false);
  const owner = `premium-kit-${kind}`,
    price = night ? commerce.prices.nightShield : commerce.prices.patienceKit;
  const input = readKitInput({ ...draft, type: kind, kitVersion: 2, referenceMode: character ? "photo" : "description" });
  const samplePages = useMemo(
    () => buildKitPages(sample.input, sample.kit),
    [sample],
  );
  const resultPages = useMemo(
    () => (result ? buildKitPages(result.input, result.kit) : []),
    [result],
  );
  const set = (key: string, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const field = (
    key: string,
    label: string,
    options: {
      max?: number;
      placeholder?: string;
      required?: boolean;
      area?: boolean;
    } = {},
  ) => (
    <label className="pk-field">
      {label}
      {options.area ? (
        <textarea
          rows={3}
          maxLength={options.max || 180}
          value={draft[key]}
          placeholder={options.placeholder}
          onChange={(event) => set(key, event.target.value)}
        />
      ) : (
        <input
          required={options.required}
          maxLength={options.max || 100}
          value={draft[key]}
          placeholder={options.placeholder}
          onChange={(event) => set(key, event.target.value)}
        />
      )}
    </label>
  );

  useEffect(() => {
    if (preview) dialog.current?.showModal();
    else dialog.current?.close();
  }, [preview]);
  useEffect(() => {
    const unsubscribe = subscribeToNarration((state) =>
      setAudio(state.owner === owner ? state.phase : "idle"),
    );
    return () => {
      unsubscribe();
      stopNarration(owner);
    };
  }, [owner]);
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail?.product !== kind) return;
      setDraft((previous) => ({
        ...previous,
        ...(detail.name ? { name: detail.name.slice(0, 40) } : {}),
        ...(detail.age ? { age: detail.age } : {}),
        ...(night
          ? {
              ...(detail.monsterType ? { monster: detail.monsterType } : {}),
              ...(detail.fearLocation ? { context: detail.fearLocation } : {}),
              ...(detail.calmingHelper
                ? { interest: detail.calmingHelper }
                : {}),
              ...(detail.bedtimeRitual ? { tone: detail.bedtimeRitual } : {}),
            }
          : {
              ...(detail.context ? { context: detail.context } : {}),
              ...(detail.interest ? { interest: detail.interest } : {}),
              ...(detail.duration ? { duration: detail.duration } : {}),
            }),
      }));
    };
    window.addEventListener("pmm:lumi-material-choice", listener);
    return () =>
      window.removeEventListener("pmm:lumi-material-choice", listener);
  }, [kind, night]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search),
      orderId = query.get("order"),
      token = query.get("token");
    if (!orderId || !token || (query.get("item") && query.get("item") !== kind))
      return;
    const controller = new AbortController();
    void fetch(
      `/api/orders/${encodeURIComponent(orderId)}?${new URLSearchParams({ token, item: kind })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        if (response.status === 202)
          throw new Error(
            "Materialul încă se pregătește. Linkul primit pe email va deschide versiunea completă.",
          );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Linkul nu mai este disponibil.");
        if (data.product !== kind)
          throw new Error("Materialul nu aparține acestui produs.");
        if (!data.output?.premium) {
          setLegacy(true);
          return;
        }
        const loadedInput = readKitInput(data.configuration?.generation),
          kit = readPremiumKit(data.output.premium);
        if (
          !loadedInput ||
          !kit ||
          kit.kind !== kind ||
          !kit.assets.cover ||
          !kit.assets.scene
        )
          throw new Error(
            "Materialul nu este complet. Contactează-ne pentru verificare.",
          );
        setResult({ input: loadedInput, kit });
        setAccess({ orderId, token });
        requestAnimationFrame(() =>
          document
            .getElementById("kit-result")
            ?.scrollIntoView({ behavior: "smooth" }),
        );
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason.message || "Nu am putut deschide livrarea.");
      });
    return () => controller.abort();
  }, [kind]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (photoPending) { setError("Confirmă personajul din fotografie înainte să continui."); return; }
    if (!input) {
      setError(
        "Completează numele copilului folosind litere și verifică vârsta.",
      );
      return;
    }
    if (step < 1) {
      setStep(1);
      return;
    }
    if (commerce.acceptsPayments && !consent) {
      setError("Confirmă livrarea imediată înainte de a continua.");
      return;
    }
    setPreview(true);
    trackEvent("product_started", { product: kind });
    trackEvent("product_preview_opened", { product: kind });
  };
  const generate = async () => {
    if (!input || busy) return;
    setBusy(true);
    setError("");
    trackEvent("product_preview_checkout_clicked", { product: kind });
    try {
      if (commerce.acceptsPayments) {
        await beginOrderCheckout(night ? "night-shield" : "patience-kit", {
          generation: input,
        }, character ? { ...character, photoConsent: true } : undefined);
        return;
      }
      setPreview(false);
      const response = await protectedFetch(
        "/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, ...(character ? { referenceCharacter: { ...character, photoConsent: true } } : {}) }),
        },
        "generate",
      );
      const payload = await response.json(),
        kit = readPremiumKit(payload.data?.premium);
      if (
        !response.ok ||
        !kit ||
        kit.kind !== kind ||
        !kit.assets.cover ||
        !kit.assets.scene
      )
        throw new Error(
          payload.error ||
            "Materialul nu este complet. Încearcă din nou puțin mai târziu.",
        );
      setResult({ input, kit });
      setAccess({ orderId: "", token: "" });
      setRated(false);
      trackEvent("generation_completed", {
        product: kind,
        generationMode: "ai",
        pageCount: KIT_PAGE_COUNTS[kind],
      });
      requestAnimationFrame(() =>
        document
          .getElementById("kit-result")
          ?.scrollIntoView({ behavior: "smooth" }),
      );
    } catch (reason) {
      setPreview(false);
      setError(
        reason instanceof Error
          ? reason.message
          : "Nu am putut pregăti materialul.",
      );
    } finally {
      setBusy(false);
    }
  };
  const pdf = async (email = false) => {
    if (!printRef.current || exportBusy.current)
      throw new Error("Așteaptă pregătirea PDF-ului curent.");
    exportBusy.current = true;
    try {
      return await renderPremiumKitPdf(
        printRef.current,
        KIT_PAGE_COUNTS[kind],
        email,
      );
    } finally {
      exportBusy.current = false;
    }
  };
  const download = async () => {
    setDownloading(true);
    setError("");
    const started = Date.now();
    trackEvent("pdf_render_started", { product: kind });
    try {
      const file = await pdf();
      file.save(
        `${night ? "Atelierul_Scutului_Magic" : "Dosarul_Micului_Explorator"}_${result!.input.name}.pdf`,
      );
      setRated(true);
      trackEvent("pdf_render_completed", {
        product: kind,
        durationMs: Date.now() - started,
      });
      trackEvent("pdf_downloaded", {
        product: kind,
        pageCount: KIT_PAGE_COUNTS[kind],
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "PDF-ul nu a putut fi descărcat.",
      );
      trackEvent("pdf_render_failed", { product: kind });
    } finally {
      setDownloading(false);
    }
  };
  const narrate = async () => {
    if (!result) return;
    if (audio !== "idle") {
      stopNarration(owner);
      return;
    }
    try {
      await playNarration(
        owner,
        kitNarration(result.input, result.kit),
        "lumi",
      );
    } catch {
      setError(
        "Audio-ul nu este disponibil acum. Poți continua cu materialul ilustrat.",
      );
    }
  };

  if (legacy) return night ? <LegacyMonster /> : <LegacyEmergency />;
  return (
    <div
      className={`premium-kit ${night ? "pk-night" : "pk-day"}`}
      id={night ? "monster-away" : "emergency-kit"}
    >
      <header className="pk-hero">
        <img
          src={sample.kit.assets.scene}
          alt={
            night
              ? "Eva și Lumi descoperă camera împreună cu mama"
              : "Raul și Lumi descoperă un oraș imaginar pe masă"
          }
          fetchPriority="high"
        />
        <div className="pk-hero-copy">
          <p>
            {night
              ? "O seară construită împreună"
              : "O aventură în timpul așteptării"}
          </p>
          <h1>{title}</h1>
          <a href={`#${target}`} className="pk-primary">
            {night ? "Creează Scutul copilului" : "Deschide un nou dosar"}
            <ArrowRight size={18} />
          </a>
        </div>
      </header>
      <div className="pk-product-strip">
        <strong>{price}</strong>
        <span>
          <Printer size={17} />
          {KIT_PAGE_COUNTS[kind]} pagini A4
        </span>
        <span>
          <Sparkles size={17} />
          Două ilustrații create pentru copil
        </span>
        {night && (
          <span>
            <Headphones size={17} />
            Audio cu Lumi
          </span>
        )}
        <span>
          <Mail size={17} />
          Livrare pe email
        </span>
      </div>
      <section className="pk-section pk-showcase">
        <div className="pk-editorial">
          <p className="pk-eyebrow">
            {night
              ? "Ritualul vostru de seară"
              : "O aventură pentru timpul de așteptare"}
          </p>
          <h2>
            {night
              ? "Din camera lui. Din cuvintele voastre."
              : "Un singur mister. Zece pagini de descoperiri."}
          </h2>
          <p>
            {night
              ? "Povestea, scutul de construit și cuvintele serii pornesc de la reperele copilului. Un atelier de apropiere, cu Lumi alături."
              : "Locul, timpul și pasiunile copilului dau forma aventurii. Fiecare joc aduce un indiciu, iar plicul se deschide la final."}
          </p>
          <ul>
            {(night
              ? [
                  "Poveste și ilustrații personalizate",
                  "Scut de construit și trei carduri",
                  "Camera de desenat, șapte seri și o scrisoare",
                  "Certificat, rețetă și etichete în designul atelierului",
                ]
              : [
                  "Un caz original, creat pentru copil",
                  "Radar, labirint și trei diferențe verificate",
                  "Desen, colorat și plic de construit",
                  "Patru misiuni detașabile, de păstrat",
                ]
            ).map((x) => (
              <li key={x}>
                <Check size={17} />
                {x}
              </li>
            ))}
          </ul>
          <p className="pk-small">
            Model ilustrat pentru {sample.input.name}. În materialul tău,
            povestea și cele două ilustrații sunt create din alegerile tale.
          </p>
          {night && (
            <p className="pk-small">
              Răsfoiește toate cele 13 pagini: aventura și ritualul vostru,
              apoi diploma, rețeta și etichetele, împreună la final. Diploma
              este A4 landscape, iar celelalte pagini sunt A4 portret.
            </p>
          )}
          {!night && (
            <p className="pk-small">
              Zece pagini de descoperit, cu Diploma Micilor Descoperiri la final.
              Diploma se imprimă A4 orizontal; activitățile sunt A4 portret.
            </p>
          )}
        </div>
        <PremiumKitReader
          pages={samplePages}
          label={`Model · ${sample.input.name}`}
        />
      </section>
      <section id={target} className="pk-section pk-create">
        <div className="pk-editorial">
          <p className="pk-eyebrow">Pentru copilul tău</p>
          <h2>
            {night
              ? "Atelierul vostru începe aici."
              : "Cine deschide următorul dosar?"}
          </h2>
          <p>
            {night
              ? "Spune-ne ce îl neliniștește și ce îi este familiar. Restul îl construim în jurul vostru."
              : "Alegeți locul și timpul disponibil. Pasul următor poate începe chiar cu o pasiune a copilului."}
          </p>
          <p className="pk-small">
            Poți porni din descriere sau dintr-o fotografie. Alegi și confirmi
            personajul înainte de a continua.
          </p>
        </div>
        <form className="pk-form" onSubmit={submit}>
          <div className="pk-steps">
            <span className={step === 0 ? "active" : ""}>01 · Copilul</span>
            <span className={step === 1 ? "active" : ""}>02 · Lumea lui</span>
          </div>
          {step === 0 ? (
            <>
              <div className="pk-two">
                {field("name", "Numele copilului", {
                  max: 40,
                  required: true,
                  placeholder: "Cum îl cheamă?",
                })}
                <label className="pk-field">
                  Vârsta
                  <select
                    value={draft.age}
                    onChange={(event) => {
                      set("age", event.target.value);
                      set(
                        "difficulty",
                        Number(event.target.value) <= 4
                          ? "easy"
                          : Number(event.target.value) <= 7
                            ? "medium"
                            : "advanced",
                      );
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1} {i === 0 ? "an" : "ani"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <CharacterPhotoInput initial={character} onChange={acceptCharacter} onPending={setPhotoPending} />
              {!character && !photoPending && field("appearance", "Cum arată? (opțional)", {
                max: 240,
                area: true,
                placeholder: "Păr, ochi, o ținută preferată...",
              })}
              {field("trustedAdult", "Adultul de încredere (opțional)", {
                max: 40,
                placeholder: "Mama, tata, bunica...",
              })}
            </>
          ) : (
            <>
              <CharacterRightsNotice />
              {night ? (
                <>
                  <fieldset className="pk-choice">
                    <legend>Ce îl neliniștește seara?</legend>
                    {KIT_FEAR_OPTIONS.map(([id, label]) => (
                      <label key={id}>
                        <input
                          type="radio"
                          name="fear"
                          checked={draft.monster === id}
                          onChange={() => set("monster", id)}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  {field("context", "Locul sau momentul care atrage atenția", {
                    max: 180,
                    placeholder: "Umbra de pe dulap, după un vis...",
                  })}
                  {field("interest", "Ce îl ajută de obicei?", {
                    placeholder: "Veioza mov, jucăria preferată...",
                  })}
                  {field("tone", "Ritualul vostru de seară", {
                    max: 80,
                    placeholder: "O îmbrățișare și o poveste",
                  })}
                  <fieldset className="pk-colors">
                    <legend>Culoarea scutului</legend>
                    {Object.entries(KIT_COLORS).map(([key, color]) => (
                      <button
                        type="button"
                        key={key}
                        style={{ background: color }}
                        title={key}
                        aria-label={`Culoare ${key}`}
                        aria-pressed={draft.favoriteColor === key}
                        onClick={() => set("favoriteColor", key)}
                      >
                        {draft.favoriteColor === key && <Check size={19} />}
                      </button>
                    ))}
                  </fieldset>
                </>
              ) : (
                <>
                  <label className="pk-field">
                    Unde îl veți folosi?
                    <select
                      value={draft.context}
                      onChange={(event) => set("context", event.target.value)}
                    >
                      {KIT_CONTEXT_OPTIONS.map(([id, label]) => (
                        <option value={id} key={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {field("interest", "Ce îl pasionează?", {
                    placeholder: "Bicicleta albastră, spațiul, animalele...",
                  })}
                  <div className="pk-two">
                    <label className="pk-field">
                      Timpul disponibil
                      <select
                        value={draft.duration}
                        onChange={(event) =>
                          set("duration", event.target.value)
                        }
                      >
                        {["5-10 minute", "10-20 minute", "20-30 minute"].map(
                          (x) => (
                            <option key={x}>{x}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="pk-field">
                      Nivelul
                      <select
                        value={draft.difficulty}
                        onChange={(event) =>
                          set("difficulty", event.target.value)
                        }
                      >
                        <option value="easy">Explorator</option>
                        <option value="medium">Detectiv</option>
                        <option value="advanced">Maestru</option>
                      </select>
                    </label>
                  </div>
                </>
              )}
              {commerce.acceptsPayments && (
                <DigitalPurchaseConsent
                  checked={consent}
                  onCheckedChange={setConsent}
                  productLabel={title}
                />
              )}
            </>
          )}
          <div className="pk-form-actions">
            {step > 0 && (
              <button
                type="button"
                className="pk-secondary"
                disabled={busy}
                onClick={() => setStep(0)}
              >
                <ArrowLeft size={17} />
                Înapoi
              </button>
            )}
            <button className="pk-primary" disabled={busy || photoPending} type="submit">
              {busy
                ? "Pregătim aventura..."
                : step === 0
                  ? "Mai departe"
                  : "Vezi coperta orientativă"}
              <ArrowRight size={18} />
            </button>
          </div>
          {busy && (
            <p role="status" className="pk-small">
              Pregătim povestea și două ilustrații originale. Poate dura câteva
              minute.
            </p>
          )}
        </form>
      </section>
      {error && (
        <p role="alert" className="pk-error">
          {error}
        </p>
      )}
      {result && (
        <section id="kit-result" className="pk-section pk-showcase">
          <div className="pk-editorial">
            <p className="pk-eyebrow">Pregătit pentru {result.input.name}</p>
            <h2>{result.kit.subtitle}</h2>
            <p>
              {KIT_PAGE_COUNTS[kind]} pagini, cu povestea și ilustrațiile
              voastre.
            </p>
            <button
              type="button"
              className="pk-primary"
              disabled={downloading}
              onClick={download}
            >
              <Download size={18} />
              {downloading ? "Pregătim PDF-ul..." : "Descarcă materialul"}
            </button>
            {night && (
              <button
                type="button"
                className="pk-secondary"
                onClick={narrate}
                disabled={audio === "loading"}
              >
                {audio === "playing" ? <Pause size={18} /> : <Play size={18} />}{" "}
                {audio === "loading"
                  ? "Lumi pregătește vocea..."
                  : audio === "playing"
                    ? "Oprește audio"
                    : "Ascultă cu Lumi"}
              </button>
            )}
            <EmailDelivery
              product={kind}
              childName={result.input.name}
              filename={`${night ? "Atelierul_Scutului_Magic" : "Dosarul_Micului_Explorator"}_${result.input.name}.pdf`}
              createPdf={async () => (await pdf(true)).output("blob")}
            />
            {rated && <QuickRating product={kind} />}{" "}
            {access.orderId && (
              <VerifiedReviewForm
                orderId={access.orderId}
                token={access.token}
                product={kind}
              />
            )}
          </div>
          <PremiumKitReader pages={resultPages} label="Materialul vostru" />
          <PremiumKitPrint
            ref={printRef}
            input={result.input}
            kit={result.kit}
          />
        </section>
      )}
      <section className="pk-promise">
        <h2>
          {night
            ? "Magia rămâne joacă. Apropierea este reală."
            : "Imaginație liberă. Jocuri care au o soluție."}
        </h2>
        <p>
          {night
            ? "Un ritual blând pentru familie, fără promisiuni medicale sau terapeutice."
            : "AI-ul creează lumea și conținutul. Labirintul și diferențele sunt construite peste structuri verificate."}
        </p>
      </section>
      <dialog
        ref={dialog}
        className="pk-checkout-dialog"
        onClose={() => {
          if (!busy) setPreview(false);
        }}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <header>
          <strong>Începutul aventurii</strong>
          <button
            type="button"
            aria-label="Închide previzualizarea"
            disabled={busy}
            onClick={() => setPreview(false)}
          >
            <X size={20} />
          </button>
        </header>
        {input && (
          <div className="pk-checkout-body">
            <PremiumKitReader
              pages={buildKitPages(
                input,
                { ...sample.kit, subtitle: `O aventură pentru ${input.name}` },
                true,
              )
                .filter((page) => page.html.includes("cover-art"))
                .slice(0, 1)}
              label="Copertă orientativă"
            />
            <div>
              <h2>Pentru {input.name}</h2>
              <p>
                Modelul arată stilul și numele pe copertă. Ilustrațiile finale
                vor fi create după{" "}
                {commerce.acceptsPayments ? "plată" : "confirmare"}, din
                aspectul și alegerile copilului tău.
              </p>
              <p className="pk-small">
                {input.age} ani ·{" "}
                {input.appearance || "Aspect ales pentru poveste"}
              </p>
              <strong className="pk-price">{price}</strong>
              <button
                type="button"
                className="pk-primary"
                disabled={busy}
                onClick={generate}
              >
                {busy
                  ? "Pregătim..."
                  : commerce.acceptsPayments
                    ? "Continuă la plata securizată"
                    : "Creează materialul"}
                <ArrowRight size={18} />
              </button>
              <p className="pk-small">
                {commerce.acceptsPayments
                  ? "Prețul final și codul promoțional se confirmă în pagina Stripe."
                  : "Plățile nu sunt active. Generarea este momentan fără cost."}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
