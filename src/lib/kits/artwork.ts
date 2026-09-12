import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateVertexKitIllustration } from "../vertexImage";
import { logTelemetry } from "../telemetry";
import { kitIllustrationPrompt, type PremiumKit } from "./content";
import { resumeKitArtwork, type KitArtworkStore } from "./resume";
import { evaluateAlbumImage } from "../album/quality";

/** The attempt counter is checkpointed before each billable request, including provider fallback. */
export async function completeKitArtwork(kit: PremiumKit, dependencies: KitArtworkStore) {
  let preferredModel = kit.preferredImageModel || dependencies.preferredImageModel;
  return resumeKitArtwork(kit, dependencies, async (role, reference, beforeAttempt, verification) => {
    const started = Date.now();
    const prompt = kitIllustrationPrompt(kit, role);
    const imageReference = reference || `data:image/webp;base64,${(await readFile(path.join(process.cwd(), "public", "lumi-guardian.webp"))).toString("base64")}`;
    const character = Boolean(dependencies.characterReference || kit.assets.characterReference);
    const mascot = character ? `data:image/webp;base64,${(await readFile(path.join(process.cwd(), "public", "lumi-guardian.webp"))).toString("base64")}` : undefined;
    const result = verification.pending ? { imageDataUrl: verification.pending.image, model: verification.pending.model } : await generateVertexKitIllustration(prompt, imageReference, role === "cover", beforeAttempt, { character, preferredModel, additionalReferenceDataUrl: mascot });
    if ("error" in result && !result.imageDataUrl) {
      logTelemetry("pmm_kit_stage_failed", { product: kit.kind, kitStage: role, result: "error", errorCode: "ai_error", durationMs: Date.now() - started });
      if (result.error?.includes("kit_budget_images_exhausted")) throw new Error("kit_budget_images_exhausted");
      if (result.rejection) throw new Error(`provider_rejected ${result.rejection.model}`);
      if (/429|quota|resource.exhausted|high demand|rate.limit/i.test(result.error || "")) throw new Error("provider_rate_limited");
      if (/timeout|timed out|abort/i.test(result.error || "")) throw new Error("provider_timeout");
      throw new Error("kit_image_temporarily_unavailable");
    }
    const bytes = Buffer.from(result.imageDataUrl.split(",")[1], "base64");
    const metadata = await sharp(bytes).metadata();
    if ((metadata.width || 0) < 512 || (metadata.height || 0) < 512) throw new Error("kit_image_resolution_invalid");
    if (Math.abs(metadata.width! / metadata.height! - (role === "cover" ? .75 : 1.5)) > .2) throw new Error("kit_image_aspect_ratio_invalid");
    if (character) {
      if (!verification.pending) await verification.savePending(result.imageDataUrl, result.model);
      const quality = await evaluateAlbumImage({ asset: `kit-${role}`, candidateDataUrl: result.imageDataUrl, referenceDataUrl: imageReference, prompt, expectedAspectRatio: role === "cover" ? "3:4" : "3:2", identityRequired: true, thresholds: { identity: 88 }, beforeAiCheck: verification.beforeQuality });
      if (!quality.accepted) { await verification.clearPending(); throw new Error("quality_rejected"); }
    }
    const compressed = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 91 }).toBuffer();
    logTelemetry("pmm_kit_stage_completed", { product: kit.kind, kitStage: role, result: "success", generationMode: "ai", model: result.model, durationMs: Date.now() - started });
    preferredModel = result.model;
    return { image: `data:image/webp;base64,${compressed.toString("base64")}`, model: result.model };
  });
}
