import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readPhotoTraits, type PhotoTraits } from "./characterPhotoPolicy.ts";

type CharacterProof = { kind: "analysis" | "character" | "pending"; photoHash: string; imageHash?: string; traits: PhotoTraits; model: string; style: string; qualityAttempts?: number; expires: number };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function secret() {
  const value = process.env.ORDER_ACCESS_SECRET;
  if (!value) throw new Error("character_configuration");
  return value;
}
export function signCharacterProof(proof: Omit<CharacterProof, "photoHash" | "imageHash" | "expires">, photo: string, image?: string) {
  const payload = Buffer.from(JSON.stringify({ ...proof, photoHash: hash(photo), ...(image ? { imageHash: hash(image) } : {}), expires: Date.now() + 86_400_000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
export function verifyCharacterProof(token: unknown, photo: unknown, image?: unknown): CharacterProof {
  if (typeof token !== "string" || token.length > 6000 || typeof photo !== "string") throw new Error("character_confirmation_required");
  const [payload, signature, extra] = token.split(".");
  const expected = createHmac("sha256", secret()).update(payload || "").digest();
  const supplied = Buffer.from(signature || "", "base64url");
  if (extra || supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) throw new Error("character_confirmation_required");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CharacterProof;
  if (!readPhotoTraits(parsed.traits) || parsed.expires < Date.now() || parsed.photoHash !== hash(photo)) throw new Error("character_confirmation_required");
  if ((image !== undefined || parsed.kind !== "analysis") && (!["character", "pending"].includes(parsed.kind) || typeof image !== "string" || parsed.imageHash !== hash(image))) throw new Error("character_confirmation_required");
  return parsed;
}
