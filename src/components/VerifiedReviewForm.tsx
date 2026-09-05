"use client";

import { Camera, Check, LoaderCircle, ShieldCheck, Star, Video } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import type { TelemetryProduct } from "@/lib/telemetry";

const labels = ["", "Mai avem de lucru", "Acceptabil", "Bun", "Foarte bun", "Ne-a plăcut mult"];

export default function VerifiedReviewForm({ orderId, token, product }: { orderId: string; token: string; product: TelemetryProduct }) {
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [notice, setNotice] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating) {
      setNotice("Alege mai întâi numărul de stele.");
      return;
    }
    setState("sending");
    setNotice("");
    const form = new FormData();
    form.set("rating", String(rating));
    form.set("displayName", displayName);
    form.set("quote", quote);
    form.set("consentToPublish", String(consent));
    if (photo) form.set("photo", photo);
    if (video) form.set("video", video);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/review?token=${encodeURIComponent(token)}`, { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Recenzia nu a putut fi trimisă.");
      setState("sent");
    } catch (error) {
      setState("idle");
      setNotice(error instanceof Error ? error.message : "Recenzia nu a putut fi trimisă.");
    }
  };

  if (state === "sent") {
    return (
      <section className="mt-8 border border-brand-green/45 bg-brand-green/10 px-5 py-7 text-center" aria-live="polite">
        <span className="mx-auto grid h-11 w-11 place-items-center bg-brand-green text-white"><Check size={22} /></span>
        <h2 className="mt-4 font-serif text-2xl text-brand-navy">Mulțumim pentru recenzie</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-relaxed text-brand-navy/65">Este asociată unei comenzi reale și va fi verificată înainte de orice publicare.</p>
      </section>
    );
  }

  return (
    <section className="mt-8 border-y border-brand-navy/15 bg-brand-cream px-5 py-8 sm:px-7" aria-labelledby="verified-review-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-green"><ShieldCheck size={16} /> Comandă verificată</p>
          <h2 id="verified-review-title" className="mt-3 font-serif text-3xl text-brand-navy">Cum a fost experiența voastră?</h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-navy/62">Ratingul ne ajută imediat. Mesajul, fotografia sau clipul sunt opționale și apar public doar cu acordul tău, după verificare.</p>
        </div>
        <form onSubmit={submit} className="w-full max-w-xl">
          <fieldset>
            <legend className="text-xs font-black uppercase tracking-[0.12em] text-brand-navy/55">Rating</legend>
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} din 5 stele`} aria-pressed={rating === value} className="grid h-11 w-11 place-items-center text-brand-gold transition-transform hover:scale-110">
                  <Star size={28} fill={value <= rating ? "currentColor" : "none"} strokeWidth={1.8} />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-xs font-black text-brand-navy/60">{labels[rating]}</span>}
            </div>
          </fieldset>
          <div className="mt-5 grid gap-4 sm:grid-cols-[.65fr_1.35fr]">
            <label className="text-xs font-black uppercase tracking-[0.1em] text-brand-navy/55">Prenume public, opțional<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} className="mt-2 min-h-11 w-full border border-brand-navy/18 bg-white px-3 text-sm font-bold normal-case tracking-normal text-brand-navy outline-none focus:border-brand-purple" /></label>
            <label className="text-xs font-black uppercase tracking-[0.1em] text-brand-navy/55">Câteva cuvinte, opțional<textarea value={quote} onChange={(event) => setQuote(event.target.value)} maxLength={700} rows={3} className="mt-2 w-full resize-y border border-brand-navy/18 bg-white px-3 py-3 text-sm font-semibold normal-case leading-relaxed tracking-normal text-brand-navy outline-none focus:border-brand-purple" /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
            <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={(event) => setVideo(event.target.files?.[0] || null)} />
            <button type="button" onClick={() => photoInput.current?.click()} className="inline-flex min-h-10 items-center gap-2 border border-brand-navy/18 bg-white px-3 text-xs font-black text-brand-navy"><Camera size={16} /> {photo ? "Fotografie aleasă" : "Adaugă fotografie"}</button>
            <button type="button" onClick={() => videoInput.current?.click()} className="inline-flex min-h-10 items-center gap-2 border border-brand-navy/18 bg-white px-3 text-xs font-black text-brand-navy"><Video size={16} /> {video ? "Clip ales" : "Adaugă video"}</button>
          </div>
          {(displayName || quote || photo || video) && (
            <label className="mt-4 flex cursor-pointer gap-3 text-xs font-semibold leading-relaxed text-brand-navy/65">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-purple" />
              Sunt de acord ca prenumele, mesajul și materialele selectate să poată fi publicate de Povestea Mea Magică. Pot retrage acordul prin email.
            </label>
          )}
          {notice && <p role="alert" className="mt-4 text-xs font-bold text-red-700">{notice}</p>}
          <button type="submit" disabled={state === "sending" || !rating} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 bg-brand-navy px-6 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple disabled:opacity-45">
            {state === "sending" ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
            {state === "sending" ? "Trimitem..." : "Trimite recenzia verificată"}
          </button>
          <input type="hidden" name="product" value={product} />
        </form>
      </div>
    </section>
  );
}
