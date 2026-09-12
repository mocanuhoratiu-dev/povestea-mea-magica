import { registerHooks } from "node:module";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { GoogleAuth, OAuth2Client } from "google-auth-library";

registerHooks({ resolve(specifier, context, next) {
  let url;
  if (specifier.startsWith("@/")) url = pathToFileURL(resolve("src", specifier.slice(2))).href;
  else if (specifier.startsWith(".") && context.parentURL) url = new URL(specifier, context.parentURL).href;
  if (url?.startsWith("file:") && existsSync(fileURLToPath(url) + ".ts")) return next(url + ".ts", context);
  return next(specifier, context);
} });

// Use the authorized Cloud account for this text-only UAT; no images or order are created.
const token = execFileSync("/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud", ["auth", "print-access-token"], { encoding: "utf8" }).trim();
const auth = new OAuth2Client();
auth.setCredentials({ access_token: token, expiry_date: Date.now() + 45 * 60_000 });
GoogleAuth.prototype.getClient = async () => auth;
process.env.VERTEX_AI_PROJECT_ID = "project-e0c2efff-d456-48f9-9fe";
process.env.VERTEX_AI_LOCATION = "global";
process.env.VERTEX_AI_MODEL = "gemini-3.5-flash";
process.env.VERTEX_AI_FALLBACK_MODELS = "gemini-3.1-flash-lite|gemini-3.1-pro-preview";
process.env.ALBUM_TEXT_TIMEOUT_MS = "65000";
const { generateAlbumPlan } = await import("../src/lib/album/generation.ts");
const config = JSON.parse(readFileSync("/private/tmp/pmm-photo-uat/configuration.json", "utf8"));
const result = await generateAlbumPlan(config.generation);
mkdirSync("/private/tmp/pmm-title-uat", { recursive: true });
writeFileSync("/private/tmp/pmm-title-uat/plan.json", JSON.stringify(result, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ title: result.title, model: result.textModel, headings: result.scenes.map(s => s.heading), sceneCount: result.scenes.length }));
