import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();

  try {
    const event = JSON.parse(body);

    return NextResponse.json({
      received: true,
      mode: "demo",
      message: `Stripe fulfillment is intentionally parked for later. Ignored event: ${event.type || "unknown"}.`,
    });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
