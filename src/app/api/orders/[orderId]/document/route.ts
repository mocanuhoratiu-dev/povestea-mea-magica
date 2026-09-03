import { NextResponse } from "next/server";
import { readAlbumOutput } from "@/lib/album/schema";
import { getOrder, isValidDeliveryToken, readOrderFile } from "@/lib/orders";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const requestedFile = url.searchParams.get("file");
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul nu este valid sau a expirat." }, { status: 403 });
  if (requestedFile !== "storybook" && requestedFile !== "activities") return NextResponse.json({ error: "Document necunoscut." }, { status: 400 });

  const order = await getOrder(orderId);
  const album = order?.product === "album" ? readAlbumOutput(order.output) : null;
  if (!order || order.status !== "delivered" || !album?.documents) return NextResponse.json({ error: "Documentul nu este pregătit." }, { status: 404 });

  const objectName = requestedFile === "storybook" ? album.documents.storybook : album.documents.activityBooklet;
  const file = await readOrderFile(objectName);
  const generation = order.configuration.generation;
  const name = generation && typeof generation === "object" && !Array.isArray(generation)
    ? safeFilename(String((generation as Record<string, unknown>).name || "copil"))
    : "copil";
  const filename = requestedFile === "storybook" ? `albumul-meu-magic-${name}.pdf` : `caietul-magic-${name}.pdf`;

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

