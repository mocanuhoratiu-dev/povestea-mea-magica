import type { AlbumBudget } from "@/lib/album/types";

export type AlbumBudgetCall = "text" | "image" | "quality";

function bounded(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

export function createAlbumBudget(existing?: AlbumBudget): AlbumBudget {
  if (existing) return existing;
  return {
    textCalls: 0,
    imageCalls: 0,
    qualityCalls: 0,
    maxTextCalls: bounded(process.env.ALBUM_MAX_TEXT_CALLS, 2, 1, 4),
    maxImageCalls: bounded(process.env.ALBUM_MAX_IMAGE_CALLS, 36, 16, 44),
    maxQualityCalls: bounded(process.env.ALBUM_MAX_QC_CALLS, 36, 0, 44),
    estimatedCostMicros: 0,
    maxEstimatedCostMicros: bounded(process.env.ALBUM_MAX_ESTIMATED_COST_MICROS, 2_200_000, 200_000, 5_000_000),
  };
}

function estimatedCallCost(kind: AlbumBudgetCall) {
  if (kind === "image") return bounded(process.env.ALBUM_IMAGE_ESTIMATED_COST_MICROS, 45_000, 0, 500_000);
  if (kind === "quality") return bounded(process.env.ALBUM_QC_ESTIMATED_COST_MICROS, 1_500, 0, 50_000);
  return bounded(process.env.ALBUM_TEXT_ESTIMATED_COST_MICROS, 4_000, 0, 100_000);
}

export function reserveAlbumBudgetCall(current: AlbumBudget, kind: AlbumBudgetCall) {
  const next: AlbumBudget = {
    ...current,
    textCalls: current.textCalls + (kind === "text" ? 1 : 0),
    imageCalls: current.imageCalls + (kind === "image" ? 1 : 0),
    qualityCalls: current.qualityCalls + (kind === "quality" ? 1 : 0),
    estimatedCostMicros: current.estimatedCostMicros + estimatedCallCost(kind),
  };
  if (next.textCalls > next.maxTextCalls) throw new Error("album_budget_text_limit");
  if (next.imageCalls > next.maxImageCalls) throw new Error("album_budget_image_limit");
  if (next.qualityCalls > next.maxQualityCalls) throw new Error("album_budget_quality_limit");
  if (next.estimatedCostMicros > next.maxEstimatedCostMicros) throw new Error("album_budget_cost_limit");
  return next;
}
