import { readFile } from "node:fs/promises";
import path from "node:path";
import { LAUNCH_HEADERS, launchState } from "@/lib/launchGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = launchState();
  if (state.enabled && state.open) {
    return new Response(null, { status: 307, headers: { ...LAUNCH_HEADERS, Location: "/" } });
  }
  const template = await readFile(path.join(process.cwd(), "public/launch/index.html"), "utf8");
  const html = template.replace('"__LAUNCH_BOOTSTRAP__"', JSON.stringify({ ...state, preview: !state.enabled }));
  return new Response(html, {
    headers: { ...LAUNCH_HEADERS, "Content-Type": "text/html; charset=utf-8", ...(!state.enabled ? { "X-Robots-Tag": "noindex, nofollow" } : {}) },
  });
}
