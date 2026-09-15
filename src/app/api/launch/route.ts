import { LAUNCH_HEADERS, launchState } from "@/lib/launchGate";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(launchState(), { headers: LAUNCH_HEADERS });
}
