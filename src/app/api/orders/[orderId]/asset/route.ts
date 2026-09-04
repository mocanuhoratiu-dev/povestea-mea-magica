import { NextResponse } from "next/server";
import { readAlbumOutput } from "@/lib/album/schema";
import { readBundleOutput } from "@/lib/bundle";
import { getOrder, isValidDeliveryToken, readOrderFile } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul nu este valid sau a expirat." }, { status: 403 });

  const order = await getOrder(orderId);
  if (!order || order.status !== "delivered") return NextResponse.json({ error: "Povestea Magică nu este pregătită." }, { status: 404 });
  const bundleAlbum = order.product === "bundle" && url.searchParams.get("item") === "album"
    ? readBundleOutput(order.output).find((item) => item.product === "album")
    : null;
  const album = order.product === "album" ? readAlbumOutput(order.output) : readAlbumOutput(bundleAlbum?.output);
  if (!album) return NextResponse.json({ error: "Povestea Magică nu este disponibilă." }, { status: 404 });

  const requested = url.searchParams.get("asset") || "";
  const sceneMatch = /^scene-(\d{1,2})$/.exec(requested);
  const objectName = requested === "cover"
    ? album.assets.cover
    : requested === "coloring"
      ? album.assets.coloring
      : requested === "differences"
        ? album.assets.differences
        : sceneMatch
          ? album.assets.scenes[Number(sceneMatch[1])]
          : undefined;
  if (!objectName || (sceneMatch && Number(sceneMatch[1]) >= 13)) return NextResponse.json({ error: "Imaginea nu există." }, { status: 404 });

  const file = await readOrderFile(objectName);
  if (!file.contentType.startsWith("image/")) return NextResponse.json({ error: "Fișierul nu este o imagine." }, { status: 409 });
  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
