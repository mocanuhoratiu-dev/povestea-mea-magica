export const ALBUM_TEXT_CHECK = "Ground the text check in visible evidence. Set hasText=true for readable words, logos, watermarks or clear strings of letter-like glyphs (including gibberish). In textEvidence identify the object/location and transcribe the visible text, or describe the concrete glyph sequence if illegible. Natural shell ridges, wood grain, fabric seams, highlights and ornamental curves are not text merely because they resemble a letter. Do not infer an inscription from the story prompt or earlier review notes. When hasText=false, textEvidence must be empty. Never ignore a genuine text artifact or watermark.";

export function hasGroundedTextAssessment(value: Record<string, unknown>) {
  if (typeof value.hasText !== "boolean" || typeof value.textEvidence !== "string" || value.textEvidence.length > 300) return false;
  return value.hasText ? value.textEvidence.trim().length >= 8 : value.textEvidence.trim().length === 0;
}
