import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateVertexKitIllustration } from "../vertexImage";
import { logTelemetry } from "../telemetry";
import { kitIllustrationPrompt, type PremiumKit } from "./content";
import { resumeKitArtwork, type KitArtworkStore } from "./resume";

/** The attempt counter is checkpointed before each billable request, including provider fallback. */
export async function completeKitArtwork(kit: PremiumKit, dependencies: KitArtworkStore) {
  return resumeKitArtwork(kit, dependencies, async (role, reference, beforeAttempt) => {
    const started = Date.now();
    const prompt = kitIllustrationPrompt(kit, role);
    const imageReference = reference || `data:image/webp;base64,${(await readFile(path.join(process.cwd(), "public", "lumi-guardian.webp"))).toString("base64")}`;
    const result = await generateVertexKitIllustration(prompt, imageReference, role === "cover", beforeAttempt);
    if (!result.imageDataUrl) {
      logTelemetry("pmm_kit_stage_failed", { product: kit.kind, kitStage: role, result: "error", errorCode: "ai_error", durationMs: Date.now() - started });
      if (result.error?.includes("kit_budget_images_exhausted")) throw new Error("kit_budget_images_exhausted");
      if (/429|quota|resource.exhausted|high demand|rate.limit/i.test(result.error || "")) throw new Error("provider_rate_limited");
      if (/timeout|timed out|abort/i.test(result.error || "")) throw new Error("provider_timeout");
      throw new Error("kit_image_temporarily_unavailable");
    }
    const bytes = Buffer.from(result.imageDataUrl.split(",")[1], "base64");
    const metadata = await sharp(bytes).metadata();
    if ((metadata.width || 0) < 512 || (metadata.height || 0) < 512) throw new Error("kit_image_resolution_invalid");
    if (Math.abs(metadata.width! / metadata.height! - (role === "cover" ? .75 : 1.5)) > .2) throw new Error("kit_image_aspect_ratio_invalid");
    const compressed = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 91 }).toBuffer();
    logTelemetry("pmm_kit_stage_completed", { product: kit.kind, kitStage: role, result: "success", generationMode: "ai", model: result.model, durationMs: Date.now() - started });
    return `data:image/webp;base64,${compressed.toString("base64")}`;
  });
}
