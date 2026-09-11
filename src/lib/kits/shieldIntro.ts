import type { KitInput, PremiumKit } from "./content.ts";
import { classicShieldKits } from "./classic.ts";
import { escapeHtml as e, shieldSVG } from "./graphics.ts";

export function shieldIntroPages(
  input: KitInput,
  kit: PremiumKit,
  artwork: string,
) {
  const classic =
    classicShieldKits[input.monster] || classicShieldKits["frica de intuneric"];
  const n = e(input.name);
  const header = (kicker: string, title: string, text: string) =>
    `<header class="section-head"><div class="kicker">${e(kicker)}</div><h2>${e(title)}</h2><p class="sub">${e(text)}</p></header>`;
  const steps = kit.ritual
    .map(
      (step, i) =>
        `<div class="recipe-step"><span><svg viewBox="0 0 36 36" width="36" height="36" aria-label="Pasul ${i+1}"><circle cx="18" cy="18" r="17" fill="none" stroke="#bda0b3"/><text x="18" y="18" text-anchor="middle" dominant-baseline="central" fill="#73465e" font-family="Georgia" font-size="14">${["I", "II", "III"][i]}</text></svg></span><div><strong>${e(step.title)}</strong><p>${e(step.text)}</p></div></div>`,
    )
    .join("");
  return [
    {
      title: "Certificatul de protecție magică",
      extra: "shield-certificate",
      html: `${header("ATELIERUL SCUTULUI MAGIC", "Certificat de protecție magică", "Un semn al apropierii, pentru serile voastre.")}${artwork}<div class="body"><p class="certificate-overline">UN CERTIFICAT NUMAI PENTRU TINE</p><h3 class="certificate-name">${n}</h3><p class="certificate-copy">Cu ${e(input.trustedAdult)} aproape, descoperim împreună ce ne este cunoscut. Reperul nostru: ${e(input.context || "camera ta")}. Poți cere oricând o îmbrățișare, fără nicio probă de curaj.</p><div class="certificate-promises"><span>Privesc împreună.</span><span>Respir fără grabă.</span><span>Pot să te chem.</span></div><div class="certificate-signature"><div><strong>${e(classic.order)}</strong><p>Cu drag, Lumi · Păzitoarea lanternei</p></div>${shieldSVG(input.name[0], "#73465e")}</div><p class="tiny">Certificatul este un joc simbolic, nu o protecție față de pericole reale.</p></div>`,
    },
    {
      title: "Rețeta secretă",
      extra: "shield-recipe",
      html: `${header("REȚETA ATELIERULUI", "Puțină lumină. Multă apropiere.", `O rețetă imaginară pentru ${input.name}, de pregătit împreună.`)}<div class="body"><div class="imaginary-ingredients">${classic.ingredients.map((item, i) => `<div><span>0${i + 1}</span><h3>${e(item.name)}</h3><p>${e(item.detail)}</p></div>`).join("")}</div><h3 class="recipe-heading">Ritualul în trei pași</h3><div class="recipe-list">${steps}</div><div class="quote">„${e(kit.formula)}”</div><div class="note">Ingredientele și spray-ul sunt imaginare. Mimați gesturile cu mâinile goale; nu amestecați și nu pulverizați substanțe. Adultul însoțește jocul și îl oprește dacă devine neplăcut.</div></div>`,
    },
    {
      title: "Etichetele ritualului",
      extra: "shield-labels",
      html: `${header("DE DECUPAT · DE PĂSTRAT", "Semne mici pentru seara voastră.", "Un adult decupează etichetele. Lipiți-le pe un recipient gol, fără pulverizator, sau păstrați-le lângă noptieră.")}<div class="body"><div class="bottle-label"><span class="kicker">ATELIERUL SCUTULUI MAGIC</span><h3>Rețeta de curaj</h3><p class="label-owner">Pentru ${n}</p><p>${e(kit.formula)}</p><small>Joc imaginar · fără substanțe</small></div><div class="label-pair"><div class="round-label"><span>UN SCUT PENTRU</span><strong>${n}</strong><small>Privesc. Respir. Chem.</small></div><div class="instruction-label"><span class="kicker">RITUALUL NOSTRU</span>${kit.ritual.map((s, i) => `<p><b>${i + 1}.</b> ${e(s.title)}</p>`).join("")}<p class="label-adult">Cu ${e(input.trustedAdult)}</p></div></div><p class="tiny label-note">O etichetă nu face frica să dispară. Păstrează însă un semn al timpului petrecut împreună.</p></div>`,
    },
  ];
}
