import { NextRequest, NextResponse } from "next/server";
import { LAUNCH_HEADERS } from "@/lib/launchGate";
import { previewCookie, validPreviewOrigin } from "@/lib/launchPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  if (!validPreviewOrigin(request)) return NextResponse.json({ error: "Cerere neacceptată." }, { status: 403, headers: LAUNCH_HEADERS });
  const { name, ...options } = previewCookie(request.nextUrl);
  const response = new NextResponse(null, { status: 303, headers: { ...LAUNCH_HEADERS, Location: "/in-curand" } });
  response.cookies.set(name, "", { ...options, maxAge: 0, expires: new Date(0) });
  return response;
}
