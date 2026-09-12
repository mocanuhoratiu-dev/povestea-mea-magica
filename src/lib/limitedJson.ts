export async function readLimitedJson(request: Request, limit: number): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") || 0) > limit) throw new Error("request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("request_empty");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("request_too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request_invalid");
  return parsed;
}
