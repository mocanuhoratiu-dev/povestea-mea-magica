import { NextRequest, NextResponse } from "next/server";

const PRIMARY_HOST = "www.povestea-mea-magica.ro";
const REDIRECT_TO_PRIMARY = new Set([
  "povestea-mea-magica.ro",
  "povestea-mea-magica-634103832719.europe-west3.run.app",
]);

function requestHost(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return host.split(",")[0]?.trim().toLowerCase().split(":")[0] || "";
}

export function proxy(request: NextRequest) {
  if (!REDIRECT_TO_PRIMARY.has(requestHost(request))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = PRIMARY_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
