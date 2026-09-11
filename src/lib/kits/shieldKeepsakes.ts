import type { KitInput, PremiumKit } from "./content.ts";
import type { KitPageOrientation } from "./pageGeometry.ts";
import { escapeHtml as e } from "./graphics.ts";

export function shieldKeepsakePages(input: KitInput, kit: PremiumKit): {
  title: string; html: string; extra: string; orientation?: KitPageOrientation;
}[] {
  const name=e(input.name), initial=e(Array.from(input.name)[0]?.toLocaleUpperCase('ro-RO') || '');
  const art=(file:string)=>`<img class="keepsake-art" src="/examples/scut/keepsakes/${file}.webp" alt="" aria-hidden="true">`;
  const brand='<div class="gold-brand">POVESTEA MEA MAGICĂ<br><span>ATELIERUL SCUTULUI MAGIC</span></div>';
  // Only the recipe's static brand is baked in. Personal details and instructions remain live text.
  return [
    {title:'Certificatul Scutului Magic',extra:'gold-keepsake gold-diploma',orientation:'landscape',html:
      `${art('certificate')}${brand}<h2 class="gold-title">Certificatul Scutului Magic</h2><div class="gold-initial" aria-label="Monograma copilului">${initial}</div><div class="gold-dedication">Creat cu drag pentru</div><h3 class="gold-child">${name}</h3><div class="gold-certificate-copy">Nu trebuie să dovedești nimic.<br>Poți să întrebi. Poți să ne chemi. Suntem aici.</div><div class="gold-signature"><strong>Lumi</strong><span>Păzitoarea lanternei</span></div><div class="gold-adult"><strong>${e(input.trustedAdult)}</strong><span>Adultul meu de încredere</span></div><div class="gold-safety">Un ritual imaginar, trăit împreună.</div>`},
    {title:'Rețeta de lumină',extra:'gold-keepsake gold-recipe',html:
      `${art('recipe')}<h2 class="gold-title">Rețeta de lumină</h2><div class="gold-dedication">Pregătită cu drag pentru <strong>${name}</strong></div><div class="gold-ingredients"><span>Un strop de lumină</span><span>O îmbrățișare</span><span>Trei respirații</span></div><h3 class="gold-ritual-title">Ritualul nostru, în trei pași</h3>${kit.ritual.map((step,i)=>`<div class="gold-step" style="--step:${i}"><svg class="gold-step-number" viewBox="0 0 60 55" role="img" aria-label="Pasul ${i+1}"><text x="30" y="29" text-anchor="middle" dominant-baseline="middle">${['I','II','III'][i]}</text></svg><div class="gold-step-copy"><h3>${e(step.title)}</h3><p>${e(step.text)}</p></div></div>`).join('')}<div class="gold-formula">„${e(kit.formula)}”</div><div class="gold-safety">Folosim gesturi și imaginație, nu ingrediente reale.<br>Nu amestecăm și nu pulverizăm substanțe. Un adult însoțește ritualul.</div>`},
    {title:'Etichetele Scutului Magic',extra:'gold-keepsake gold-labels',html:
      `${art('labels')}<div class="gold-brand">POVESTEA MEA MAGICĂ</div><h2 class="gold-title">Micile tale însemne magice</h2><div class="gold-dedication">Un adult decupează. Voi alegeți unde le păstrați.</div><div class="gold-label-initial">${initial}</div><div class="gold-main-label"><span>SCUTUL MAGIC</span><h3>${name}</h3><p>Privesc. Respir. Pot să te chem.</p><small>Joc imaginar</small></div><div class="gold-round-initial">${initial}</div><div class="gold-round-copy"><span>UN SCUT NUMAI AL MEU</span><h3>${name}</h3></div><div class="gold-door-copy"><span>AICI VISEAZĂ</span><h3>${name}</h3><p>Noapte bună.<br>Sunt aproape.</p></div><div class="gold-ritual-strip"><span>Privesc împreună.</span><span>Respir încet.</span><span>Pot să chem.</span></div><div class="gold-safety">Piesele se decupează de un adult. Dacă folosiți un recipient, alegeți unul gol, fără pulverizator.<br>Piesele mici rămân în grija adultului.</div>`},
  ];
}
