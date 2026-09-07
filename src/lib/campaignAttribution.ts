export type CampaignAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPath?: string;
  referrerHost?: string;
};

export type MarketingConsent = "accepted" | "rejected" | null;

const ATTRIBUTION_KEY = "pmm-campaign-attribution";
const CONSENT_KEY = "pmm-marketing-consent";
const MAX_VALUE_LENGTH = 80;

export function sanitizeCampaignValue(value: unknown, maxLength = MAX_VALUE_LENGTH) {
  if (typeof value !== "string") return undefined;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return normalized || undefined;
}

export function sanitizeCampaignAttribution(value: unknown): CampaignAttribution {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const landingPath = sanitizeCampaignValue(source.landingPath, 160);
  const referrerHost = sanitizeCampaignValue(source.referrerHost, 120);
  return {
    ...(sanitizeCampaignValue(source.utmSource) ? { utmSource: sanitizeCampaignValue(source.utmSource) } : {}),
    ...(sanitizeCampaignValue(source.utmMedium) ? { utmMedium: sanitizeCampaignValue(source.utmMedium) } : {}),
    ...(sanitizeCampaignValue(source.utmCampaign) ? { utmCampaign: sanitizeCampaignValue(source.utmCampaign) } : {}),
    ...(sanitizeCampaignValue(source.utmContent) ? { utmContent: sanitizeCampaignValue(source.utmContent) } : {}),
    ...(sanitizeCampaignValue(source.utmTerm) ? { utmTerm: sanitizeCampaignValue(source.utmTerm) } : {}),
    ...(landingPath?.startsWith("/") ? { landingPath } : {}),
    ...(referrerHost ? { referrerHost } : {}),
  };
}

function attributionFromCurrentPage(): CampaignAttribution {
  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    referrerHost = undefined;
  }

  return sanitizeCampaignAttribution({
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
    landingPath: window.location.pathname,
    referrerHost,
  });
}

export function readCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return {};
  try {
    return sanitizeCampaignAttribution(JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function captureCampaignAttribution() {
  if (typeof window === "undefined") return {};
  const current = attributionFromCurrentPage();
  const previous = readCampaignAttribution();
  const hasCampaign = Boolean(current.utmSource || current.utmMedium || current.utmCampaign || current.utmContent || current.utmTerm);
  const next = hasCampaign || !previous.landingPath ? { ...previous, ...current } : previous;
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    // Attribution is optional; the purchase flow must continue without storage.
  }
  return next;
}

export function readMarketingConsent(): MarketingConsent {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function saveMarketingConsent(value: Exclude<MarketingConsent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
    if (value === "rejected") {
      document.cookie = "_fbp=; Max-Age=0; Path=/; SameSite=Lax";
      document.cookie = "_fbc=; Max-Age=0; Path=/; SameSite=Lax";
    }
  } catch {
    // A browser that blocks storage can still use the strictly necessary flow.
  }
}
