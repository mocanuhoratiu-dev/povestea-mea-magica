"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/clientTelemetry";

const trackedMetrics = new Set(["CLS", "FCP", "FID", "INP", "LCP", "TTFB"]);

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!trackedMetrics.has(metric.name)) return;
    trackEvent("web_vital_recorded", {
      webVitalName: metric.name as "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB",
      webVitalValue: Math.max(0, metric.value),
      webVitalRating: metric.rating,
    });
  });

  return null;
}
