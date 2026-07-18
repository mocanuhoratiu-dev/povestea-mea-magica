"use client";

import { useEffect } from "react";
import { trackSiteVisit } from "@/lib/clientTelemetry";

export default function UsageTelemetry() {
  useEffect(() => {
    trackSiteVisit();
  }, []);

  return null;
}
