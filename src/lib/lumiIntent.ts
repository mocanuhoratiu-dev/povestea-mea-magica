const MATERIAL_TERMS = /\b(poveste|povestea|scut|scutul|trus[aă]|trusa|ritual|activitat(?:e|ea)|material|produs)\b/i;
const DIRECT_ACTION = /\b(vreau|dorim|doresc|avem nevoie|am nevoie|deschide|creeaz[aă]|preg[aă]te[sș]te|aplic[aă]|aleg|alege)\b/i;
const DIRECT_RECOMMENDATION = /\b(recomand[aă](?:-mi)?|recomandare|sugereaz[aă](?:-mi)?|ce s[aă] aleg|ajut[aă]-m[aă] s[aă] aleg)\b/i;
const SHORT_CONFIRMATION = /^(da|sigur|bine|ok|okay|te rog)$/i;

export function wantsLumiMaterialRecommendation(message: string, previousModelMessage = "") {
  const cleanMessage = message.replace(/\s+/g, " ").trim();
  const cleanPreviousMessage = previousModelMessage.replace(/\s+/g, " ").trim();

  if (DIRECT_RECOMMENDATION.test(cleanMessage)) return true;
  if (DIRECT_ACTION.test(cleanMessage) && MATERIAL_TERMS.test(cleanMessage)) return true;

  return SHORT_CONFIRMATION.test(cleanMessage)
    && /\b(recomand|aleg|material|poveste|scut|trus[aă])\b/i.test(cleanPreviousMessage);
}
