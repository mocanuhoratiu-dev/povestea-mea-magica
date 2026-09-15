import { NextRequest, NextResponse } from "next/server";
import { LAUNCH_HEADERS, launchState } from "@/lib/launchGate";
import { previewCookie, verifyPreviewSession } from "@/lib/launchPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const session = verifyPreviewSession(request.cookies.get(previewCookie(request.nextUrl).name)?.value);
  return NextResponse.json({ authenticated: Boolean(session), expiresAt: session?.expiresAt ?? null, launchOpen: launchState().open }, { headers: LAUNCH_HEADERS });
}
