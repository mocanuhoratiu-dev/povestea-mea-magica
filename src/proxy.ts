import { NextRequest, NextResponse } from "next/server";
import { LAUNCH_HEADERS, shouldShowLaunchPage } from "./lib/launchGate";
import { previewCookie, verifyPreviewSession } from "./lib/launchPreview";

const PRIMARY_HOST = "www.povestea-mea-magica.ro";
const REDIRECT_TO_PRIMARY = new Set([
  "povestea-mea-magica.ro",
  "povestea-mea-magica-634103832719.europe-west3.run.app",
  "povestea-mea-magica-domain-634103832719.europe-west1.run.app",
]);

function requestHost(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return host.split(",")[0]?.trim().toLowerCase().split(":")[0] || "";
}

export async function proxy(request: NextRequest) {
  if (REDIRECT_TO_PRIMARY.has(requestHost(request))) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = PRIMARY_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (request.nextUrl.pathname === "/launch/index.html") {
    const url = request.nextUrl.clone();
    url.pathname = "/in-curand";
    return NextResponse.redirect(url, { status: 307, headers: LAUNCH_HEADERS });
  }

  if (shouldShowLaunchPage(request.nextUrl.pathname, request.method)) {
    const privateSession = verifyPreviewSession(request.cookies.get(previewCookie(request.nextUrl).name)?.value);
    if (privateSession) return NextResponse.next({ headers: { ...LAUNCH_HEADERS, "X-Robots-Tag": "noindex, nofollow" } });
    const order = request.nextUrl.searchParams.get("order");
    const token = request.nextUrl.searchParams.get("token");
    const deliveryPage = ["/", "/scutul-de-noapte", "/trusa-de-rabdare"].includes(request.nextUrl.pathname);
    // Existing kit emails link to product pages. Only a signed delivery link
    // may bypass the temporary landing page; arbitrary query flags may not.
    if (deliveryPage && order && /^[a-zA-Z0-9_-]{16,80}$/.test(order) && token && token.length < 256) {
      try {
        const { isValidDeliveryToken } = await import("./lib/orders");
        if (isValidDeliveryToken(order, token)) return NextResponse.next({ headers: LAUNCH_HEADERS });
      } catch {
        // Missing signing configuration must not create a public bypass.
      }
    }
    const url = request.nextUrl.clone();
    url.pathname = "/in-curand";
    return NextResponse.rewrite(url, { headers: LAUNCH_HEADERS });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
