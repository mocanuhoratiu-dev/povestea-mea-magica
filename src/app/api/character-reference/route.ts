import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { sanitizeAlbumReferencePhoto } from "@/lib/album/referencePhoto";
import { analyzeCharacterPhoto } from "@/lib/photoAnalysis";
import { signCharacterProof, verifyCharacterProof } from "@/lib/characterToken";
import { describePhotoTraits, readPhotoTraits } from "@/lib/characterPhotoPolicy";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";
import { evaluateAlbumImage } from "@/lib/album/quality";
import { albumArtDirection } from "@/lib/album/artDirection";
import { albumArtStyleOptions } from "@/lib/album/types";
import { checkRateLimit } from "@/lib/requestProtection";
import { verifyTurnstileRequest, turnstileRejected } from "@/lib/turnstile";
import { notifyGenerationFailure, generationFailureReason } from "@/lib/generationIncident";
import { previewFailureResponse } from "@/lib/album/previewFailure";
import { readLimitedJson } from "@/lib/limitedJson";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "character-reference", { windowMs: 3_600_000, maxRequests: 12 });
  if (!limit.allowed) return NextResponse.json({ error: "Ai făcut mai multe încercări. Reîncearcă mai târziu; personajul confirmat rămâne disponibil." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  if (!await verifyTurnstileRequest(request, "character_reference")) return turnstileRejected();
  const id = randomUUID();
  let stage = "photo_validation";
  try {
    const body = await readLimitedJson(request, 15_000_000);
    if (typeof body.referenceImageDataUrl !== "string") return NextResponse.json({ error: "Alege fotografia." }, { status: 400 });
    if (body.photoConsent !== true) return NextResponse.json({ error: "Confirmă permisiunea pentru analizarea și folosirea fotografiei." }, { status: 400 });
    const photo = await sanitizeAlbumReferencePhoto(body.referenceImageDataUrl);
    const style = albumArtStyleOptions.find(s => s === body.style) || albumArtStyleOptions[0];
    if (body.action === "analyze") {
      stage = "photo_analysis";
      const result = await analyzeCharacterPhoto(photo.dataUrl);
      if (!result.usable) return NextResponse.json({ error: "Nu putem izola clar un singur copil. Decupează fotografia în jurul lui, cu fața vizibilă, sau alege alta.", needsCrop: true }, { status: 422 });
      const analysisToken = signCharacterProof({ kind: "analysis", traits: result.traits, model: result.model, style }, body.referenceImageDataUrl);
      return NextResponse.json({ traits: result.traits, analysisToken }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action !== "character") return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
    const proof = verifyCharacterProof(body.analysisToken, body.referenceImageDataUrl);
    if (proof.kind !== "analysis") throw new Error("character_confirmation_required");
    const correction = typeof body.correction === "string" ? body.correction.replace(/[<>\u0000-\u001f]/g, " ").trim().slice(0, 240) : "";
    const corrected = body.correctedTraits === undefined ? proof.traits : readPhotoTraits(body.correctedTraits);
    if (!corrected) return NextResponse.json({ error: "Verifică trăsăturile completate." }, { status: 400 });
    const traits = { ...corrected, appearanceDetail: [corrected.appearanceDetail, correction].filter(Boolean).join(". ").slice(0, 240) };
    const prompt = [albumArtDirection(style), "Create a clean character-design reference for a personalized children's book, landscape 3:2. Show ONE child only, full body with a large clearly readable face, hands and feet fully visible, centered on a softly lit simple background. Use the parent photograph as the authoritative identity source. Preserve recognizable face shape, hairstyle and hair color. Do not invent age, identity, ethnicity, diagnosis or personality. Use the visible photo outfit; no text, letters, logos, collage, duplicates, scenes, props or other people.", `Observed appearance: ${describePhotoTraits(traits)}.`, correction ? `The parent explicitly corrected this visible detail: ${correction}.` : ""].join(" ");
    stage = "character";
    const pending = body.pendingToken ? verifyCharacterProof(body.pendingToken, body.referenceImageDataUrl, body.pendingImage) : null;
    if (pending && (pending.kind !== "pending" || pending.style !== style || JSON.stringify(pending.traits) !== JSON.stringify(traits) || (pending.qualityAttempts || 0) >= 3)) throw new Error("character_confirmation_required");
    const generated = pending ? { imageDataUrl: body.pendingImage as string, model: pending.model } : await generateVertexAlbumIllustration(prompt, photo.dataUrl, "3:2", { referencePurpose: "photo" });
    if ("error" in generated && !generated.imageDataUrl) throw new Error(generated.rejection ? `provider_rejected ${generated.model || generated.rejection.model}` : generated.error);
    if (!pending) {
      const bytes = Buffer.from(generated.imageDataUrl.split(",")[1], "base64");
      const compressed = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize(1536, 1536, { fit: "inside", withoutEnlargement: true }).webp({ quality: 95 }).toBuffer();
      generated.imageDataUrl = `data:image/webp;base64,${compressed.toString("base64")}`;
    }
    stage = "character_quality";
    let quality;
    try {
      quality = await evaluateAlbumImage({ asset: "character-reference", candidateDataUrl: generated.imageDataUrl, referenceDataUrl: photo.dataUrl, prompt, expectedAspectRatio: "3:2", referencePurpose: "photo", identityRequired: true, thresholds: { identity: 85 } });
    } catch (error) {
      const attempts = (pending?.qualityAttempts || 0) + 1;
      if (generationFailureReason(error) === "quality_unavailable" && attempts < 3) {
        const pendingToken = signCharacterProof({ kind: "pending", traits, model: generated.model, style, qualityAttempts: attempts }, body.referenceImageDataUrl, generated.imageDataUrl);
        return NextResponse.json({ error: "Personajul este desenat, dar verificarea s-a întrerupt. Reia verificarea; păstrăm aceeași imagine.", pendingToken, pendingImage: generated.imageDataUrl }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      throw error;
    }
    if (!quality.accepted) throw new Error("quality_rejected");
    const characterToken = signCharacterProof({ kind: "character", traits, model: generated.model, style }, body.referenceImageDataUrl, generated.imageDataUrl);
    return NextResponse.json({ characterImageDataUrl: generated.imageDataUrl, characterToken, traits }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "request_too_large") return NextResponse.json({ error: "Fotografia este prea mare." }, { status: 413 });
    if (stage === "photo_validation" || (error instanceof Error && error.message === "character_confirmation_required")) return NextResponse.json({ error: "Fotografia sau confirmarea nu mai este validă. Alege un JPG, PNG sau WebP de minimum 512 × 512 px, maximum 10 MB / 40 megapixeli, și reia analiza." }, { status: 400 });
    await notifyGenerationFailure(id, "character", stage, error);
    const failure = previewFailureResponse(error);
    return NextResponse.json({ error: failure.error, code: failure.code }, { status: failure.status });
  }
}
