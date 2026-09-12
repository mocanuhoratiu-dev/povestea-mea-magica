import { NextResponse } from "next/server";
import { verifyTaskIdentity } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { deliverDailyReport } from "@/lib/dailyReport";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  try { return NextResponse.json(await deliverDailyReport(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("Daily report failed", error instanceof Error ? error.message : "unknown"); return NextResponse.json({ error: "Raportul nu a putut fi trimis." }, { status: 500 }); }
}
