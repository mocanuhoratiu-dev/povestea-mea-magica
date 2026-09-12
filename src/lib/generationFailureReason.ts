/** Only stable categories enter logs and email, never raw prompts/provider payloads. */
export function generationFailureReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/billing.*(?:disabled|suspend)|BILLING_DISABLED/i.test(message)) return "billing_disabled";
  if (/PERMISSION_DENIED|UNAUTHENTICATED|configuration/i.test(message)) return "configuration";
  if (/budget_/i.test(message)) return "budget_limit";
  if (/SAFETY|PROHIBITED|BLOCKLIST|RECITATION|provider_rejected|model_safety_rejected/i.test(message)) return "provider_rejected";
  if (/quality_rejected|image_duplicate|image_low_resolution/i.test(message)) return "quality_rejected";
  if (/quality_unavailable/i.test(message)) return "quality_unavailable";
  if (/429|RESOURCE_EXHAUSTED|rate.?limit|provider_busy/i.test(message)) return "provider_busy";
  if (/timeout|timed out|deadline|abort|timpul de răspuns/i.test(message)) return "provider_timeout";
  if (/503|502|UNAVAILABLE|not.found|404|temporarily_unavailable/i.test(message)) return "provider_unavailable";
  return "generation_failed";
}
