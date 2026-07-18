type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_TRACKED_CLIENTS = 10_000;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip.slice(0, 128);
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_TRACKED_CLIENTS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  // A single instance should not retain unbounded client identifiers in memory.
  while (buckets.size >= MAX_TRACKED_CLIENTS) {
    const firstKey = buckets.keys().next().value;
    if (!firstKey) break;
    buckets.delete(firstKey);
  }
}

/**
 * Best-effort protection for public beta endpoints. Cloud Run can use multiple
 * instances, so this intentionally complements, rather than replaces, an edge
 * rate limit when traffic grows.
 */
export function checkRateLimit(request: Request, scope: string, options: RateLimitOptions = {}): RateLimitResult {
  const windowMs = options.windowMs ?? readPositiveInteger(process.env.GENERATE_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000);
  const maxRequests = options.maxRequests ?? readPositiveInteger(process.env.GENERATE_RATE_LIMIT_MAX, 5);
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    pruneExpiredBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count >= maxRequests) {
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds };
}

export function checkTelemetryRateLimit(request: Request) {
  return checkRateLimit(request, "telemetry", {
    windowMs: readPositiveInteger(process.env.TELEMETRY_RATE_LIMIT_WINDOW_MS, 24 * 60 * 60 * 1000),
    maxRequests: readPositiveInteger(process.env.TELEMETRY_RATE_LIMIT_MAX, 120),
  });
}

export function requestExceedsBodyLimit(request: Request, maxBytes = 12_000) {
  const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}
