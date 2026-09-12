"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Crop, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { prepareReferencePhoto } from "@/lib/album/clientReferencePhoto";
import { PHOTO_REQUIREMENTS, type PhotoTraits, type ApprovedCharacter } from "@/lib/characterPhotoPolicy";
import { protectedFetch } from "@/lib/clientTurnstile";
import "./character-photo.css";

export default function CharacterPhotoInput({ onChange, onPending, initial, initialPhoto, style = "Ilustrație 3D de poveste" }: {
  onChange: (value: ApprovedCharacter | null) => void;
  onPending: (value: boolean) => void;
  style?: string;
  initial?: ApprovedCharacter | null;
  initialPhoto?: string;
}) {
  const [photo, setPhoto] = useState(initial?.referenceImageDataUrl || initialPhoto || "");
  const [consent, setConsent] = useState(Boolean(initial));
  const [traits, setTraits] = useState<PhotoTraits | null>(initial?.traits || null);
  const [analysisToken, setAnalysisToken] = useState("");
  const [candidate, setCandidate] = useState<ApprovedCharacter | null>(initial || null);
  const [approved, setApproved] = useState(Boolean(initial));
  const [correction, setCorrection] = useState("");
  const [pending, setPending] = useState<{ pendingImage: string; pendingToken: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 50, y: 50, size: 75 });
  const request = useRef<AbortController | null>(null);
  const styleRef = useRef(style);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (styleRef.current === style) return;
    styleRef.current = style;
    request.current?.abort();
    request.current = null;
    setPending(null); setBusy(""); setCandidate(null); setApproved(false); onChange(null);
    if (photo) onPending(true);
  }, [style, photo, onChange, onPending]);

  function reset(next = "") {
    request.current?.abort(); request.current = null;
    setPhoto(next); setConsent(false); setTraits(null); setAnalysisToken(""); setCandidate(null);
    setPending(null); setApproved(false); setBusy(""); setError(""); setCorrection(""); setCropping(false);
    onChange(null); onPending(Boolean(next));
  }
  async function choose(file?: File) {
    if (!file) return;
    try { reset(await prepareReferencePhoto(file)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Fotografia nu poate fi citită."); }
  }
  async function applyCrop() {
    const image = new window.Image(); image.src = photo; await image.decode();
    const width = Math.round(image.naturalWidth * crop.size / 100), height = Math.round(image.naturalHeight * crop.size / 100);
    if (width < 512 || height < 512) { setError("Decupajul trebuie să păstreze minimum 512 px pe fiecare latură. Mărește selecția sau alege o fotografie mai apropiată."); return; }
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) return;
    context.drawImage(image, Math.round((image.naturalWidth - width) * crop.x / 100), Math.round((image.naturalHeight - height) * crop.y / 100), width, height, 0, 0, width, height);
    reset(canvas.toDataURL("image/jpeg", .9));
  }
  async function run(action: "analyze" | "character") {
    if (!consent || busy) return;
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 175_000);
    setBusy(action); setError(""); setApproved(false); onChange(null); onPending(true);
    try {
      const response = await protectedFetch("/api/character-reference", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, referenceImageDataUrl: photo, photoConsent: true, style, analysisToken, correction, correctedTraits: traits, ...(action === "character" ? pending : {}) }) }, "character_reference");
      const result = await response.json();
      if (request.current !== controller) return;
      setPending(result.pendingImage && result.pendingToken ? { pendingImage: result.pendingImage, pendingToken: result.pendingToken } : null);
      if (!response.ok) { if (result.needsCrop) setCropping(true); throw new Error(result.error || "Nu am putut pregăti personajul."); }
      if (request.current !== controller) return;
      setTraits(result.traits);
      if (action === "analyze") { setAnalysisToken(result.analysisToken); setCandidate(null); }
      else { setCorrection(""); setCandidate({ referenceImageDataUrl: photo, characterImageDataUrl: result.characterImageDataUrl, characterToken: result.characterToken, traits: result.traits }); }
    } catch (reason) {
      if (request.current === controller) setError(controller.signal.aborted ? "Pregătirea durează mai mult. Fotografia și analiza rămân aici; poți reîncerca." : reason instanceof Error ? reason.message : "Reîncearcă pregătirea personajului.");
    } finally { clearTimeout(timer); if (request.current === controller) { setBusy(""); request.current = null; } }
  }
  const labels: Record<keyof PhotoTraits, string> = { hairStyle: "Coafură", hairColor: "Păr", eyeColor: "Ochi", skinTone: "Piele", outfit: "Ținută", appearanceDetail: "Detalii vizibile" };
  return <section className="character-photo" aria-label="Personaj după fotografie">
    <h3>Din fotografie, în poveste</h3>
    <p>{PHOTO_REQUIREMENTS}</p>
    {!photo ? <label className="character-command"><Camera size={18} /> Alege fotografia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void choose(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label> : <>
      <div className="character-photo-grid">
        <div className="character-source">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Fotografia aleasă pentru personaj" />
          {cropping && <span className="character-crop" style={{ left: `${(100 - crop.size) * crop.x / 100}%`, top: `${(100 - crop.size) * crop.y / 100}%`, width: `${crop.size}%`, height: `${crop.size}%` }} />}
        </div>
        <div className="character-photo-actions">
          <button type="button" disabled={Boolean(busy)} onClick={() => setCropping(v => !v)}><Crop size={18} /> Decupează copilul</button>
          <button type="button" onClick={() => reset()}><Trash2 size={18} /> Fără fotografie</button>
          <label className="character-consent"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (!e.target.checked) { request.current?.abort(); setApproved(false); onChange(null); onPending(true); } }} />Sunt părintele/reprezentantul legal sau am permisiunea pentru analizarea fotografiei și crearea personajului.</label>
        </div>
      </div>
      {cropping && <div className="character-crop-controls">
        {(["x", "y", "size"] as const).map(key => <label key={key}>{key === "x" ? "Poziție orizontală" : key === "y" ? "Poziție verticală" : "Mărimea selecției"}<input type="range" min={key === "size" ? 20 : 0} max="100" value={crop[key]} onChange={e => setCrop(v => ({ ...v, [key]: Number(e.target.value) }))} /></label>)}
        <button type="button" onClick={() => void applyCrop()}><Crop size={18} /> Păstrează selecția</button>
      </div>}
      {!traits && <button type="button" className="character-command" disabled={!consent || Boolean(busy) || cropping} onClick={() => void run("analyze")}>{busy ? <LoaderCircle className="character-spinner" size={18} /> : <Camera size={18} />} {busy ? "Privesc fotografia…" : "Analizează fotografia"}</button>}
      {traits && !candidate && <div className="character-traits">
        <h4>Trăsăturile din fotografie</h4>
        <div className="character-traits-fields">{Object.entries(traits).map(([k, v]) => <label key={k}>{labels[k as keyof PhotoTraits]}<input value={v} disabled={Boolean(busy)} maxLength={k === "appearanceDetail" ? 240 : 100} onChange={e => { setPending(null); setTraits({ ...traits, [k]: e.target.value }); }} /></label>)}</div>
        <label>Ce ai corecta? (opțional)<textarea value={correction} disabled={Boolean(busy)} maxLength={240} rows={2} onChange={e => { setPending(null); setCorrection(e.target.value); }} placeholder="De exemplu: părul este blond, nu șaten." /></label>
        <button type="button" className="character-command" disabled={!consent || Boolean(busy) || cropping} onClick={() => void run("character")}>{busy ? <LoaderCircle className="character-spinner" size={18} /> : <RefreshCw size={18} />}{busy ? "Pregătim personajul ilustrat…" : pending ? "Reia verificarea personajului" : "Creează personajul"}</button>
      </div>}
      {candidate && <div className="character-approved">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={candidate.characterImageDataUrl} alt="Personajul ilustrat propus din fotografia copilului" />
        <p>Acest personaj va fi referința ilustrațiilor. Seamănă cu copilul tău?</p>
        <div><button type="button" className="character-command" disabled={!consent || approved} onClick={() => { setApproved(true); onChange(candidate); onPending(false); }}><Check size={18} />{approved ? "Personaj confirmat" : "Da, acesta este personajul"}</button><button type="button" onClick={() => { setCandidate(null); setApproved(false); onChange(null); onPending(true); }}>Revizuiește detaliile</button></div>
      </div>}
    </>}
    {error && <p role="alert" className="character-error">{error}</p>}
    <p className="character-privacy">Fotografia este analizată numai după acord. Nu este trimisă la Stripe și nu apare în carte. Personajul este o interpretare ilustrată; asemănarea nu poate fi garantată identic în fiecare scenă.</p>
  </section>;
}
