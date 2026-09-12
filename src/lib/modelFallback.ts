import { generationFailureReason } from './generationFailureReason.ts';
export type ModelRole = 'text' | 'lumi' | 'image' | 'quality' | 'vision';
const defaults: Record<ModelRole, readonly string[]> = {
  text: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'],
  lumi: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'],
  image: ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-lite-image'],
  quality: ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'],
  vision: ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'],
};

export function fallbackModels(role: ModelRole, primary?: string, backups?: string, limit = 3) {
  return [...new Set([primary, ...(backups || '').split(/[|,]/), ...defaults[role]]
    .map(value => value?.trim()).filter((value): value is string => Boolean(value)))].slice(0, Math.max(1, Math.min(3, limit)));
}

export function imageResolution(model: string, requested: '1K' | '2K') {
  return model === 'gemini-3.1-flash-lite-image' ? '1K' : requested;
}

export function assertModelResponse(response: { promptFeedback?: { blockReason?: string }; candidates?: Array<{ finishReason?: string }> }) {
  const blocked = response.promptFeedback?.blockReason;
  if ((blocked && blocked !== 'BLOCKED_REASON_UNSPECIFIED') || response.candidates?.some(c => /^(?:IMAGE_)?(?:SAFETY|PROHIBITED_CONTENT|RECITATION|BLOCKLIST)$/.test(c.finishReason || ''))) {
    throw new Error('model_safety_rejected');
  }
  if (response.candidates?.some(c => c.finishReason === 'MAX_TOKENS')) throw new Error('model_output_truncated');
}

/** Do not route around safety, billing/auth failures or application spending caps. */
export function isTerminalModelError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:album|kit)_budget_|BILLING_DISABLED|billing.*(?:disabled|suspend)|PERMISSION_DENIED|UNAUTHENTICATED|PROHIBITED_CONTENT|SAFETY|BLOCKLIST|IMAGE_RECITATION|model_safety_rejected/i.test(message);
}

export function modelAttemptTimeout(deadlineAt: number, remainingModels: number, perModelMs: number, now = Date.now()) {
  return Math.max(0, Math.min(perModelMs, Math.floor((deadlineAt - now) / Math.max(1, remainingModels))));
}

export async function withModelFallback<T>(options: {
  role: ModelRole;
  models: string[];
  deadlineAt: number;
  perModelMs: number;
  run: (model: string, timeoutMs: number, signal: AbortSignal) => Promise<T>;
}) {
  const errors: string[] = [];
  for (const [index, model] of options.models.entries()) {
    const timeoutMs = modelAttemptTimeout(options.deadlineAt, options.models.length - index, options.perModelMs);
    if (timeoutMs < 1000) break;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    try {
      const result = await Promise.race([
        options.run(model, timeoutMs, controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new Error('model_attempt_timeout')); }, timeoutMs);
        }),
      ]);
      if (index > 0) console.info(JSON.stringify({ event: 'pmm_ai_fallback_success', role: options.role, model, attempt: index + 1 }));
      console.info(JSON.stringify({ event: 'pmm_ai_model_completed', role: options.role, model, attempt: index + 1, duration_ms: Date.now() - started }));
      return result;
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : String(error)}`);
      // Never log prompts, reference images or raw provider errors here.
      console.warn(JSON.stringify({ event: 'pmm_ai_model_attempt_failed', role: options.role, model, attempt: index + 1, error_code: generationFailureReason(error), duration_ms: Date.now() - started }));
      if (isTerminalModelError(error)) throw error;
    } finally { if (timer) clearTimeout(timer); }
  }
  throw new Error(errors.join(' | ') || 'model_fallback_deadline_exceeded');
}
