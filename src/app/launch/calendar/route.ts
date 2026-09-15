import { launchCalendar } from "@/lib/launchGate";

export function GET() {
  return new Response(launchCalendar(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="povestea-mea-magica-lansare.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
