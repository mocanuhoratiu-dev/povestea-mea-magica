import type { PremiumKit } from "./content.ts";

export type KitArtworkStore = {
  checkpoint: (kit: PremiumKit) => Promise<void>;
  save: (image: string, role: "cover" | "scene") => Promise<string>;
  read: (asset: string) => Promise<string>;
  characterReference?: string;
  preferredImageModel?: string;
};

/** Persist each billable attempt before requesting it; never regenerate a saved illustration. */
export async function resumeKitArtwork(initial: PremiumKit, store: KitArtworkStore, generate: (
  role: "cover" | "scene", reference: string | undefined, beforeAttempt: () => Promise<void>,
  verification: { pending?: { image: string; model: string }; savePending: (image: string, model: string) => Promise<void>; clearPending: () => Promise<void>; beforeQuality: () => Promise<void> },
) => Promise<string | { image: string; model: string }>) {
  let kit = { ...initial, assets: { ...initial.assets } };
  for (const role of ["cover", "scene"] as const) {
    if (kit.assets[role]) continue;
    const pending = kit.pendingArtwork?.[role];
    if (kit.imageAttempts >= 6 && !pending) throw new Error("kit_budget_images_exhausted");
    const reference = store.characterReference || (kit.assets.characterReference ? await store.read(kit.assets.characterReference) : role === "scene" && kit.assets.cover ? await store.read(kit.assets.cover) : undefined);
    const generated = await generate(role, reference, async () => {
      if (kit.imageAttempts >= 6) throw new Error("kit_budget_images_exhausted");
      kit = { ...kit, imageAttempts: kit.imageAttempts + 1 };
      await store.checkpoint(kit);
    }, {
      pending: pending ? { image: await store.read(pending.asset), model: pending.model } : undefined,
      savePending: async (image, model) => {
        const asset = await store.save(image, role);
        kit = { ...kit, pendingArtwork: { ...kit.pendingArtwork, [role]: { asset, model } } };
        await store.checkpoint(kit);
      },
      clearPending: async () => {
        const pendingArtwork = { ...kit.pendingArtwork }; delete pendingArtwork[role];
        kit = { ...kit, pendingArtwork }; await store.checkpoint(kit);
      },
      beforeQuality: async () => {
        if ((kit.qualityAttempts || 0) >= 12) throw new Error("kit_budget_quality_exhausted");
        kit = { ...kit, qualityAttempts: (kit.qualityAttempts || 0) + 1 }; await store.checkpoint(kit);
      },
    });
    const image = typeof generated === "string" ? generated : generated.image;
    if (!image) throw new Error(kit.imageAttempts >= 6 ? "kit_budget_images_exhausted" : "kit_image_temporarily_unavailable");
    const asset = await store.save(image, role);
    const pendingArtwork = { ...kit.pendingArtwork }; delete pendingArtwork[role];
    kit = { ...kit, pendingArtwork, assets: { ...kit.assets, [role]: asset }, ...(typeof generated === "string" ? {} : { imageModels: [...new Set([...(kit.imageModels || []), generated.model])], preferredImageModel: generated.model }) };
    await store.checkpoint(kit);
  }
  return kit;
}
