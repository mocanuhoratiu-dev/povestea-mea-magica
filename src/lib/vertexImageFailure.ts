export type ImageRejection = {
  model: string;
  stage: "input" | "output";
  reason: string;
  responseId?: string;
};

type ImageFeedback = {
  responseId?: string;
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ finishReason?: string }>;
};

const rejectedReason = /^(?:IMAGE_)?(?:PROHIBITED_CONTENT|SAFETY|RECITATION|BLOCKLIST)$/;

/** Keep provider enums, never prompts, photos or free-form response text. */
export function imageRejection(response: ImageFeedback, model: string): ImageRejection | undefined {
  const id = response.responseId;
  const trace = id && /^[\w-]{1,200}$/.test(id) ? { responseId: id } : {};
  const input = response.promptFeedback?.blockReason;
  if (input && input !== "BLOCKED_REASON_UNSPECIFIED") {
    return { model, stage: "input", reason: rejectedReason.test(input) ? input : "BLOCKED", ...trace };
  }
  const output = response.candidates?.map(candidate => candidate.finishReason).find(reason => reason && rejectedReason.test(reason));
  return output ? { model, stage: "output", reason: output, ...trace } : undefined;
}
