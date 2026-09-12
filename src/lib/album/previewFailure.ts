import type { ImageRejection } from '../vertexImageFailure';

export type PreviewFailureCode = 'provider_busy' | 'provider_unavailable' | 'provider_rejected' | 'quality_rejected' | 'quality_unavailable' | 'generation_failed';

export class AlbumPreviewError extends Error {
  readonly code: PreviewFailureCode;
  readonly rejection?: ImageRejection;
  constructor(code: PreviewFailureCode, rejection?: ImageRejection) { super(code); this.code = code; this.rejection = rejection; }
}

export function previewFailureCode(error: unknown): PreviewFailureCode {
  if (error instanceof AlbumPreviewError) return error.code;
  const message = error instanceof Error ? error.message : String(error);
  if (["provider_busy", "provider_unavailable", "provider_rejected", "quality_rejected", "quality_unavailable", "generation_failed"].includes(message)) return message as PreviewFailureCode;
  if (/PROHIBITED_CONTENT|SAFETY|IMAGE_RECITATION|BLOCKLIST|provider_rejected/i.test(message)) return 'provider_rejected';
  if (/quality_rejected|image_quality_rejected|image_duplicate|image_low_resolution/.test(message)) return 'quality_rejected';
  if (/429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message)) return 'provider_busy';
  if (/quality_unavailable/.test(message)) return 'quality_unavailable';
  if (/503|502|UNAVAILABLE|timeout|timpul de răspuns|nu a returnat o imagine/i.test(message)) return 'provider_unavailable';
  return 'generation_failed';
}

export function previewRetryDelay(error: unknown, attempt: number, baseDelay: number, jitter = Math.random()) {
  const code = previewFailureCode(error);
  if (code === 'provider_busy' || code === 'provider_unavailable') {
    return Math.min(25_000, 8_000 * 2 ** Math.max(0, attempt - 1)) + Math.floor(Math.max(0, Math.min(1, jitter)) * 1_000);
  }
  return baseDelay;
}

export function previewFailureResponse(error: unknown) {
  const code = previewFailureCode(error);
  const messages: Record<PreviewFailureCode, string> = {
    provider_rejected: 'Serviciul de ilustrații a oprit această generare prin filtrul său de siguranță. Nu putem stabili din acest răspuns că fotografia este cauza. Revizuiește detaliile înainte de a crea o altă mostră.',
    provider_busy: 'Serviciul de ilustrații este foarte solicitat acum. Așteaptă un minut înainte de o nouă încercare. Detaliile completate sunt păstrate.',
    provider_unavailable: 'Serviciul de ilustrații nu a trimis imaginea la timp. Încearcă din nou peste un minut; detaliile completate sunt păstrate.',
    quality_rejected: 'Imaginea creată nu a trecut verificarea de asemănare sau calitate. Nu ți-o oferim ca mostră. Detaliile tale sunt păstrate pentru revizuire.',
    quality_unavailable: 'Nu am putut finaliza verificarea imaginii. Încearcă din nou peste un minut; detaliile completate sunt păstrate.',
    generation_failed: 'Mostra nu a putut fi creată acum. Detaliile completate sunt păstrate. Încearcă din nou în câteva minute.',
  };
  const needsReview = code === 'quality_rejected' || code === 'provider_rejected';
  return { code, error: messages[code], status: needsReview ? 422 : code === 'generation_failed' ? 502 : 503, retryAfterSeconds: needsReview ? 0 : 60 };
}
