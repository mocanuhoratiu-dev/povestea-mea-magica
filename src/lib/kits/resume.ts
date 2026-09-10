import type { PremiumKit } from "./content.ts";

export type KitArtworkStore = {
  checkpoint: (kit: PremiumKit) => Promise<void>;
  save: (image: string, role: "cover" | "scene") => Promise<string>;
  read: (asset: string) => Promise<string>;
};

/** Persist each billable attempt before requesting it; never regenerate a saved illustration. */
export async function resumeKitArtwork(initial: PremiumKit, store: KitArtworkStore, generate: (
  role: "cover" | "scene", reference: string | undefined, beforeAttempt: () => Promise<void>,
) => Promise<string>) {
  let kit = { ...initial, assets: { ...initial.assets } };
  for (const role of ["cover", "scene"] as const) {
    if (kit.assets[role]) continue;
    if (kit.imageAttempts >= 4) throw new Error("kit_budget_images_exhausted");
    const reference = role === "scene" && kit.assets.cover ? await store.read(kit.assets.cover) : undefined;
    const image = await generate(role, reference, async () => {
      if (kit.imageAttempts >= 4) throw new Error("kit_budget_images_exhausted");
      kit = { ...kit, imageAttempts: kit.imageAttempts + 1 };
      await store.checkpoint(kit);
    });
    if (!image) throw new Error(kit.imageAttempts >= 4 ? "kit_budget_images_exhausted" : "kit_image_temporarily_unavailable");
    const asset = await store.save(image, role);
    kit = { ...kit, assets: { ...kit.assets, [role]: asset } };
    await store.checkpoint(kit);
  }
  return kit;
}
