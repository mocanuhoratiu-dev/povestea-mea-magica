'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, Sparkles, Star } from 'lucide-react';
import BrandMark from './BrandMark';
import MagicalLoader from './MagicalLoader';
import FeedbackInvite from './FeedbackInvite';
import QuickRating from './QuickRating';
import EmailDelivery from './EmailDelivery';
import { trackEvent } from "@/lib/clientTelemetry";
import { useMobileProductVisibility } from "@/lib/mobileProductFlow";
import MobileFlowSteps from "./MobileFlowSteps";

/* ─── Types ─────────────────────────────────────── */
interface Monster { id: string; label: string; icon: string; }
interface MonsterIngredient { num: string; icon: string; name: string; detail: string; }
interface MonsterStep { roman: string; l1: string; l2: string; }
interface MonsterClause { art: string; text: string; }
interface MonsterSignature { name: string; title: string; }
interface MonsterKitContent {
  body: string;
  ingredients: MonsterIngredient[];
  steps: MonsterStep[];
  spell: string;
  clauses: MonsterClause[];
  signatures: [MonsterSignature, MonsterSignature];
  instructionLines: string[];
  labelIngredients: string;
  miniSeals?: string[];
}

const monsters: Monster[] = [
  { id: 'umbrele noptii',        label: 'Umbrele Nopții',       icon: '🌑' },
  { id: 'monstrul de sub pat',   label: 'Monstrul de sub Pat',  icon: '🛌' },
  { id: 'zgomotele ciudate',     label: 'Zgomotele Ciudate',    icon: '🔊' },
  { id: 'dulapul scartaitor',    label: 'Dulapul Scârțâitor',   icon: '🚪' },
  { id: 'frica de intuneric',    label: 'Frica de Întuneric',   icon: '🕯️' },
  { id: 'vise urate',            label: 'Visele Urâte',         icon: '🌙' },
];

const MONSTER_KITS: Record<string, MonsterKitContent> = {
  'umbrele noptii': {
    body: "camera acestui copil este protejată de un <em>scut invizibil</em> țesut din <em>praf de stele</em>, lumină de lună plină și <em>râsete de spiriduși veseli</em>. Nicio umbră nu are dreptul să se miște fără permisiune.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Apă de Lună Plină' },
      { num: '2', icon: '🍋', name: 'Zeamă de lămâie', detail: 'Esență de Lămâie-Soare' },
      { num: '3', icon: '🧂', name: 'Un praf de sare', detail: 'Cristale de Curaj' }
    ],
    steps: [
      { roman: 'I', l1: 'Amestecă apa cu lămâia-soare,', l2: 'agitând flaconul spre fereastră.' },
      { roman: 'II', l1: 'Adaugă sarea-curaj în timp ce zâmbești,', l2: 'umbrele se tem de lumină blândă.' }
    ],
    spell: "Umbre mici și umbre mari, plecați voi în alte zări! Lumina mea e scutul bun, noaptea-i albă de acum!",
    clauses: [
      { art: 'Art. I', text: 'Umbrele sunt obligate să rămână lipite de pereți și să nu inventeze forme noi după stingerea luminii.' },
      { art: 'Art. II', text: 'Colțurile camerei primesc lumină imaginară de lună până când devin locuri obișnuite și cuminți.' },
      { art: 'Art. III', text: 'Orice pată întunecată se declară simplă umbră de mobilă, fără puteri de speriat.' },
      { art: 'Art. IV', text: 'Curajul copilului aprinde scutul ori de câte ori respiră încet și cere o îmbrățișare.' },
    ],
    signatures: [
      { name: 'Selena Clar-de-Lună', title: 'Inspectoarea Umbrelor Cuminți' },
      { name: 'Licuricius al III-lea', title: 'Paznicul Luminilor de Veghe' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 7 ori',
      '2.  Rostește descântecul spre colțuri',
      '3.  Pulverizează lângă perdele și pereți',
      '4.  Aprinde lumina de veghe pentru o clipă',
      '5.  Respiră încet și dormi liniștit/ă!  ✓',
    ],
    labelIngredients: 'Apă de lună · Lămâie-soare · Cristale de curaj'
  },
  'monstrul de sub pat': {
    body: "podeaua acestei camere este acoperită de o <em>plasă magică</em> de nepătruns. Nicio creatură cu picioare mari sau intenții de gâdilat nu poate trece de marginea patului.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Râu de Somn Liniștit' },
      { num: '2', icon: '🍬', name: 'Un vârf de zahăr', detail: 'Firimituri de Curaj' },
      { num: '3', icon: '🌿', name: 'Un praf de scorțișoară', detail: 'Pulbere de Dragon Somnoros' }
    ],
    steps: [
      { roman: 'I', l1: 'Pulverizează generos sub pat,', l2: 'insistând în colțurile întunecate.' },
      { roman: 'II', l1: 'Pune flaconul pe noptieră ca pază,', l2: 'dragonul va veghea toată noaptea.' }
    ],
    spell: "Sub patul meu e liniște, niciun monstru nu mai mișcă! Dormi acum, somn pufos, patul meu e cel mai faimos!",
    clauses: [
      { art: 'Art. I', text: 'Spațiul de sub pat se declară zonă verificată, aerisită și rezervată doar prafului obișnuit.' },
      { art: 'Art. II', text: 'Nicio creatură imaginară nu poate trece de marginea pilotei fără permis de somn blând.' },
      { art: 'Art. III', text: 'Orice foșnet de sub pat este reclasificat drept sunet de cearșaf, jucărie sau papuc uitat.' },
      { art: 'Art. IV', text: 'Curajul copilului are prioritate absolută când flaconul stă de pază pe noptieră.' },
    ],
    signatures: [
      { name: 'Mag. Umberto din Tărâmul de Jos', title: 'Comandantul Gardienilor de sub Pat' },
      { name: 'Dorma Puf-de-Pernă', title: 'Zâna Paturilor Liniștite' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 7 ori',
      '2.  Rostește descântecul lângă pat',
      '3.  Pulverizează de 3 ori sub pat',
      '4.  Așază flaconul pe noptieră',
      '5.  Învelește-te și dormi liniștit/ă!  ✓',
    ],
    labelIngredients: 'Râu de somn · Firimituri de curaj · Pulbere somnoroasă'
  },
  'zgomotele ciudate': {
    body: "urechile acestui erou sunt protejate de un <em>filtru de armonie</em>. Orice scârțâit sau pocnet este captat și transformat automat în <em>torcăit de pisică</em> sau susur de izvor.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Lac de Liniște' },
      { num: '2', icon: '🍯', name: 'O picătură de miere', detail: 'Miere Mută' },
      { num: '3', icon: '🧂', name: 'Un praf de sare', detail: 'Praf de Ecou Adormit' }
    ],
    steps: [
      { roman: 'I', l1: 'Toarnă mierea imaginară în apă,', l2: 'ascultând cum se așterne liniștea.' },
      { roman: 'II', l1: 'Pulverizează spre sursa sunetului,', l2: 'zâmbind la fiecare pocnet.' }
    ],
    spell: "Zgomote ce mă speriați, în torcăit vă transformați! Liniștea e prietena mea, noaptea-i lină ca o stea!",
    clauses: [
      { art: 'Art. I', text: 'Pocnetele, foșnetele și scârțâiturile sunt traduse automat în sunete normale ale casei.' },
      { art: 'Art. II', text: 'Urechile copilului primesc filtru de liniște pentru a asculta doar respirația și povestea serii.' },
      { art: 'Art. III', text: 'Orice zgomot nou trebuie să se prezinte politicos ca țeavă, parchet, vânt sau frigider.' },
      { art: 'Art. IV', text: 'Curajul copilului crește de fiecare dată când observă sunetul și îl lasă să treacă.' },
    ],
    signatures: [
      { name: 'Armonel Fără-Ecou', title: 'Dirijorul Zgomotelor Cuminți' },
      { name: 'Mira Șoaptă-Bună', title: 'Zâna Urechilor Liniștite' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 5 ori',
      '2.  Rostește descântecul în șoaptă',
      '3.  Pulverizează spre ușă sau fereastră',
      '4.  Ascultă trei respirații lente',
      '5.  Lasă sunetele să treacă ușor!  ✓',
    ],
    labelIngredients: 'Lac de liniște · Miere mută · Praf de ecou adormit'
  },
  'dulapul scartaitor': {
    body: "ușile acestui dulap sunt <em>sigilate cu magicele balamale de vis</em>. Interiorul este acum un <em>tărâm al ordinii și păcii</em>, unde hainele dorm liniștite și nicio ușă nu îndrăznește să se miște.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Picături de Pace' },
      { num: '2', icon: '🍋', name: 'Zeamă de lămâie', detail: 'Lumină Galbenă de Curaj' },
      { num: '3', icon: '🍬', name: 'Un vârf de zahăr', detail: 'Cristale pentru Uși Cuminți' }
    ],
    steps: [
      { roman: 'I', l1: 'Unge imaginar balamalele dulapului,', l2: 'șoptind cuvinte de somn ușor.' },
      { roman: 'II', l1: 'Pulverizează pe uși în formă de X,', l2: 'creând un sigiliu de aur.' }
    ],
    spell: "Uși de dulap, stați cuminți, nu mai speriați părinți! Hainele dorm, eu dorm bine, liniștea e lângă mine!",
    clauses: [
      { art: 'Art. I', text: 'Dulapul se declară bibliotecă de haine adormite, fără drept de scârțâit dramatic după ora de culcare.' },
      { art: 'Art. II', text: 'Ușile și balamalele sunt invitate să stea cuminți până dimineața.' },
      { art: 'Art. III', text: 'Orice umbră din dulap este reclasificată drept haină, pijama sau pătură împăturită.' },
      { art: 'Art. IV', text: 'Curajul copilului sigilează dulapul printr-un zâmbet mic și un ritual de noapte făcut în tihnă.' },
    ],
    signatures: [
      { name: 'Balaminus Trosc-Cuminte', title: 'Maestrul Dulapurilor Tăcute' },
      { name: 'Cloșeta de Catifea', title: 'Zâna Hainelor Adormite' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 7 ori',
      '2.  Rostește descântecul spre dulap',
      '3.  Pulverizează pe uși în formă de X',
      '4.  Spune hainelor noapte bună',
      '5.  Închide ochii și dormi liniștit/ă!  ✓',
    ],
    labelIngredients: 'Picături de pace · Lumină galbenă · Cristale pentru uși cuminți'
  },
  'frica de intuneric': {
    body: "întunericul din această cameră este transformat într-o <em>pătură de noapte blândă</em>. Nicio umbră nu are voie să pară mai mare decât este, iar fiecare colț primește o picătură de lumină curajoasă.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Apă de Stea Liniștită' },
      { num: '2', icon: '🍯', name: 'O picătură de miere', detail: 'Miere de Gând Bun' },
      { num: '3', icon: '🧂', name: 'Un praf de sare', detail: 'Cristale de Lumină Mică' }
    ],
    steps: [
      { roman: 'I', l1: 'Agită flaconul lângă lumina de veghe,', l2: 'ca noaptea să devină prietenoasă.' },
      { roman: 'II', l1: 'Pulverizează spre colțurile camerei,', l2: 'rostind cuvinte de curaj blând.' }
    ],
    spell: "Noapte bună, noapte lină, în cameră aprind lumină! Întuneric, fii cuminte, somnul bun vine-nainte!",
    clauses: [
      { art: 'Art. I', text: 'Întunericul este declarat pătură de somn, nu loc de speriat sau inventat griji.' },
      { art: 'Art. II', text: 'Colțurile camerei primesc pază de lumină mică până dimineața.' },
      { art: 'Art. III', text: 'Orice formă neclară trebuie să se prezinte drept mobilă, perdea sau jucărie.' },
      { art: 'Art. IV', text: 'Curajul copilului crește cu fiecare respirație lentă și fiecare gând bun.' },
    ],
    signatures: [
      { name: 'Luminel de Veghe', title: 'Paznicul Nopților Blânde' },
      { name: 'Stela Somn-Ușor', title: 'Zâna Colțurilor Luminate' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 6 ori',
      '2.  Rostește descântecul lângă pat',
      '3.  Pulverizează spre colțuri',
      '4.  Aprinde lumina de veghe pentru o clipă',
      '5.  Respiră încet și lasă noaptea să fie blândă!  ✓',
    ],
    labelIngredients: 'Apă de stea · Miere de gând bun · Cristale de lumină'
  },
  'vise urate': {
    body: "visele acestei nopți sunt filtrate printr-un <em>nor de povești bune</em>. Orice vis încurcat trebuie să treacă prin poarta curajului și să se transforme într-o aventură mică, sigură și luminoasă.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă', detail: 'Rouă de Vis Bun' },
      { num: '2', icon: '🍋', name: 'Zeamă de lămâie', detail: 'Rază Galbenă de Dimineață' },
      { num: '3', icon: '🍬', name: 'Un vârf de zahăr', detail: 'Pulbere de Nor Pufos' }
    ],
    steps: [
      { roman: 'I', l1: 'Amestecă ingredientele în liniște,', l2: 'imaginând un nor moale deasupra pernei.' },
      { roman: 'II', l1: 'Pulverizează lângă pernă, nu pe pernă,', l2: 'și invită doar visele bune să intre.' }
    ],
    spell: "Vise rele, rătăciți, în nori pufoși vă risipiți! Vine somnul bun și clar, cu lumină-n buzunar!",
    clauses: [
      { art: 'Art. I', text: 'Visele urâte sunt obligate să se micșoreze până devin povești fără putere de speriat.' },
      { art: 'Art. II', text: 'Perna primește pază de nor pufos și gânduri bune până dimineața.' },
      { art: 'Art. III', text: 'Orice imagine neplăcută trebuie să se transforme într-o scenă sigură, amuzantă sau luminoasă.' },
      { art: 'Art. IV', text: 'Copilul poate cere ajutor, apă, îmbrățișare sau o poveste scurtă ori de câte ori are nevoie.' },
    ],
    signatures: [
      { name: 'Noris Puf-de-Vis', title: 'Filtratorul Viselor Încurcate' },
      { name: 'Mira Dimineață-Bună', title: 'Zâna Gândurilor Luminoase' },
    ],
    instructionLines: [
      '1.  Agită flaconul de 5 ori',
      '2.  Rostește descântecul în șoaptă',
      '3.  Pulverizează lângă pat, nu pe pernă',
      '4.  Alege un gând bun pentru vis',
      '5.  Închide ochii și lasă norul pufos să vegheze!  ✓',
    ],
    labelIngredients: 'Rouă de vis bun · Rază de dimineață · Nor pufos'
  }
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    if (existing?.dataset.loading === 'true') {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Nu am putut încărca ${src}.`)), { once: true });
      return;
    }

    existing?.remove();

    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error(`Încărcarea a durat prea mult: ${src}.`));
    }, 15000);

    script.src = src;
    script.dataset.loading = 'true';
    script.onload = () => {
      window.clearTimeout(timeout);
      script.dataset.loading = 'false';
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error(`Nu am putut încărca ${src}.`));
    };
    document.head.appendChild(script);
  });
}

const backgroundStars = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  top: `${(i * 29 + 13) % 100}%`,
  left: `${(i * 47 + 5) % 100}%`,
  opacity: ((i * 17) % 60) / 100 + 0.2,
  size: (i * 5) % 8 + 4,
}));

type PdfInstance = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
  output: (type: "blob") => Blob;
  setFont: (fontName: string, fontStyle?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  text: (text: string | string[], x: number, y: number, options?: { lineHeightFactor?: number }) => void;
};

type PdfConstructor = new (orientation: "p", unit: "mm", format: "a4") => PdfInstance;
type Html2Canvas = (
  element: HTMLElement,
  options: {
    scale: number;
    useCORS?: boolean;
    logging?: boolean;
    windowWidth?: number;
    windowHeight?: number;
  }
) => Promise<HTMLCanvasElement>;
type WindowWithPdfLibraries = Window & typeof globalThis & {
  jspdf: { jsPDF: PdfConstructor };
  html2canvas: Html2Canvas;
};

const monsterCopy: Record<string, { target: string; label: string }> = {
  'umbrele noptii': { target: 'umbrelor nopții', label: 'UMBRE' },
  'monstrul de sub pat': { target: 'monstrului de sub pat', label: 'MONSTRU DE SUB PAT' },
  'zgomotele ciudate': { target: 'zgomotelor ciudate', label: 'ZGOMOTE CIUDATE' },
  'dulapul scartaitor': { target: 'dulapului scârțâitor', label: 'DULAP SCÂRȚÂITOR' },
  'frica de intuneric': { target: 'fricii de întuneric', label: 'ÎNTUNERIC' },
  'vise urate': { target: 'viselor urâte', label: 'VISE URÂTE' },
};

const monsterDefaults: Record<string, { location: string; helper: string; ritual: string }> = {
  'umbrele noptii': {
    location: 'colțurile camerei și perdelele',
    helper: 'lumina de veghe',
    ritual: 'o îmbrățișare și trei respirații lente',
  },
  'monstrul de sub pat': {
    location: 'spațiul de sub pat',
    helper: 'jucăria preferată de pază',
    ritual: 'verificarea rapidă sub pat împreună cu un adult',
  },
  'zgomotele ciudate': {
    location: 'ușa, fereastra și pereții care pocnesc',
    helper: 'sunetul liniștit al respirației',
    ritual: 'ascultarea a trei sunete obișnuite ale casei',
  },
  'dulapul scartaitor': {
    location: 'ușile dulapului',
    helper: 'pătura preferată',
    ritual: 'spus noapte bună hainelor din dulap',
  },
  'frica de intuneric': {
    location: 'colțurile întunecate ale camerei',
    helper: 'lumina de veghe sau o lanternă mică',
    ritual: 'număratul a trei lucruri sigure din cameră',
  },
  'vise urate': {
    location: 'lângă pat și noptieră',
    helper: 'o poveste scurtă cu final bun',
    ritual: 'alegerea unui gând frumos pentru vis',
  },
};

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?em[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPlainText(value: string, fallback: string, maxLength = 58) {
  const clean = stripHtml(value).replace(/[.!?]+$/g, '').trim() || fallback;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function sanitizeEmHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<em[^>]*>/gi, '[[EM]]')
    .replace(/<\/em>/gi, '[[/EM]]')
    .replace(/<[^>]*>/g, '')
    .replace(/\[\[EM\]\]/g, '<em>')
    .replace(/\[\[\/EM\]\]/g, '</em>')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeSpellText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => line.length <= 56 ? line : `${line.slice(0, 53).trim()}...`)
    .join('\n');
}

function cleanKitContent(content: MonsterKitContent): MonsterKitContent {
  return {
    body: sanitizeEmHtml(content.body),
    ingredients: content.ingredients.map((ingredient) => ({
      num: stripHtml(ingredient.num),
      icon: stripHtml(ingredient.icon),
      name: stripHtml(ingredient.name),
      detail: stripHtml(ingredient.detail),
    })),
    steps: content.steps.map((step) => ({
      roman: stripHtml(step.roman),
      l1: stripHtml(step.l1),
      l2: stripHtml(step.l2),
    })),
    spell: sanitizeSpellText(content.spell),
    clauses: content.clauses.map((clause) => ({
      art: stripHtml(clause.art),
      text: stripHtml(clause.text),
    })),
    signatures: [
      {
        name: stripHtml(content.signatures[0].name),
        title: stripHtml(content.signatures[0].title),
      },
      {
        name: stripHtml(content.signatures[1].name),
        title: stripHtml(content.signatures[1].title),
      },
    ],
    instructionLines: content.instructionLines.map((line) => stripHtml(line)),
    labelIngredients: stripHtml(content.labelIngredients),
    miniSeals: content.miniSeals?.map((seal) => stripHtml(seal)),
  };
}

function buildPersonalizedKitContent({
  name,
  monsterType,
  fearLocation,
  calmingHelper,
  bedtimeRitual,
}: {
  name: string;
  monsterType: string;
  fearLocation: string;
  calmingHelper: string;
  bedtimeRitual: string;
}) {
  const base = MONSTER_KITS[monsterType] || MONSTER_KITS['umbrele noptii'];
  const defaults = monsterDefaults[monsterType] || monsterDefaults['umbrele noptii'];
  const heroName = cleanPlainText(name, 'copilul', 28);
  const location = cleanPlainText(fearLocation, defaults.location, 48);
  const helper = cleanPlainText(calmingHelper, defaults.helper, 42);
  const ritual = cleanPlainText(bedtimeRitual, defaults.ritual, 48);

  const personalized: MonsterKitContent = {
    ...base,
    body: `${base.body} Zona verificată special pentru ${heroName} este <em>${location}</em>, iar scutul se întărește cu <em>${helper}</em> și cu ritualul de seară: <em>${ritual}</em>.`,
    steps: [
      base.steps[0],
      {
        roman: 'II',
        l1: `Pulverizează blând la ${location},`,
        l2: `apoi folosește ${helper}.`,
      },
      {
        roman: 'III',
        l1: `Încheie cu ritualul: ${ritual},`,
        l2: 'și declară camera pregătită de somn.',
      },
    ],
    clauses: [
      ...base.clauses.slice(0, 3),
      {
        art: 'Art. IV',
        text: `Pentru ${heroName}, scutul se activează complet la ${location}, mai ales când apare ${helper} și ritualul "${ritual}".`,
      },
    ],
    instructionLines: [
      base.instructionLines[0],
      base.instructionLines[1],
      `3.  Pulverizează la ${location}`,
      `4.  Folosește ${helper}`,
      `5.  Încheie cu: ${ritual}  ✓`,
    ],
  };

  return cleanKitContent(personalized);
}

function mergeMonsterKitContent(generated: Partial<MonsterKitContent>, fallback: MonsterKitContent): MonsterKitContent {
  const ingredients = Array.isArray(generated.ingredients) && generated.ingredients.length === 3
    ? generated.ingredients.map((ingredient, index) => ({
        num: String(index + 1),
        icon: cleanPlainText(ingredient.icon || "", fallback.ingredients[index]?.icon || "✦", 8),
        name: cleanPlainText(ingredient.name || "", fallback.ingredients[index]?.name || "Apă", 30),
        detail: cleanPlainText(ingredient.detail || "", fallback.ingredients[index]?.detail || "Ingredient magic", 42),
      }))
    : fallback.ingredients;
  const steps = Array.isArray(generated.steps) && generated.steps.length === 3
    ? generated.steps.map((step, index) => ({
        roman: ["I", "II", "III"][index],
        l1: cleanPlainText(step.l1 || "", fallback.steps[index]?.l1 || "Pregătește ritualul cu un adult", 74),
        l2: cleanPlainText(step.l2 || "", fallback.steps[index]?.l2 || "Apoi continuă liniștit", 74),
      }))
    : fallback.steps;
  const spell = sanitizeSpellText(generated.spell || "");

  return cleanKitContent({
    ...fallback,
    body: sanitizeEmHtml(generated.body || fallback.body),
    ingredients,
    steps,
    spell: spell || fallback.spell,
    labelIngredients: ingredients
      .map((ingredient) => cleanPlainText(ingredient.detail || ingredient.name, ingredient.name, 26))
      .join(" · "),
  });
}

function addSearchableTextLayer(pdf: PdfInstance, text: string, pageWidth: number) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return;

  pdf.setFont('times', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  const lines = pdf.splitTextToSize(cleanText, pageWidth - 20).slice(0, 80);
  pdf.text(lines, 10, 10, { lineHeightFactor: 1.05 });
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function MonsterKit() {
  const isMobileMonsterSelected = useMobileProductVisibility("monster");
  const [name,        setName]        = useState('');
  const [monsterType, setMonsterType] = useState(monsters[0].id);
  const [showResult,  setShowResult]  = useState(false);
  const [showQuickRating, setShowQuickRating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fearLocation, setFearLocation] = useState('');
  const [calmingHelper, setCalmingHelper] = useState('');
  const [bedtimeRitual, setBedtimeRitual] = useState('');
  const [generatedContent, setGeneratedContent] = useState<MonsterKitContent | null>(null);

  useEffect(() => {
    const applyLumiChoice = (event: Event) => {
      const detail = (event as CustomEvent<{
        product?: string;
        monsterType?: string;
        fearLocation?: string;
        calmingHelper?: string;
        bedtimeRitual?: string;
      }>).detail;
      if (detail?.product !== 'monster') return;
      if (detail.monsterType && monsters.some((monster) => monster.id === detail.monsterType)) setMonsterType(detail.monsterType);
      if (detail.fearLocation) setFearLocation(detail.fearLocation);
      if (detail.calmingHelper) setCalmingHelper(detail.calmingHelper);
      if (detail.bedtimeRitual) setBedtimeRitual(detail.bedtimeRitual);
    };
    window.addEventListener('pmm:lumi-material-choice', applyLumiChoice);
    return () => window.removeEventListener('pmm:lumi-material-choice', applyLumiChoice);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    trackEvent('product_started', { product: 'monster' });
    setShowQuickRating(false);
    setIsGenerating(true);

    const fallback = buildPersonalizedKitContent({
      name,
      monsterType,
      fearLocation,
      calmingHelper,
      bedtimeRitual,
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monster',
          name,
          monster: monsterType,
          context: fearLocation,
          interest: calmingHelper,
          tone: bedtimeRitual,
        }),
      });
      const payload = await response.json() as { success?: boolean; data?: Partial<MonsterKitContent> };

      if (response.ok && payload.success && payload.data) {
        setGeneratedContent(mergeMonsterKitContent(payload.data, fallback));
        trackEvent('generation_completed', { product: 'monster', generationMode: 'ai', pageCount: 3 });
      } else {
        setGeneratedContent(fallback);
        trackEvent('generation_completed', { product: 'monster', generationMode: 'template', pageCount: 3 });
      }
    } catch (error) {
      console.error('Nu am putut genera kitul cu AI:', error);
      setGeneratedContent(fallback);
      trackEvent('generation_completed', { product: 'monster', generationMode: 'template', pageCount: 3 });
    } finally {
      setIsGenerating(false);
      setShowResult(true);
    }
  };
  const renderMonsterPdf = async (quality: 'download' | 'email' = 'download') => {
      await Promise.all([
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      ]);

      const { jsPDF }   = (window as WindowWithPdfLibraries).jspdf;
      const html2canvas = (window as WindowWithPdfLibraries).html2canvas;
      const pdf         = new jsPDF('p', 'mm', 'a4');
      const W           = pdf.internal.pageSize.getWidth();
      const H           = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`mk-page-${i}`);
        if (!el) continue;
        el.style.display = 'block';
        try {
          const canvas = await html2canvas(el, {
            scale: quality === 'email' ? 1.7 : 2.5, useCORS: true, logging: false,
            windowWidth: 794, windowHeight: 1123,
          });
          addSearchableTextLayer(pdf, el.innerText, W);
          pdf.addImage(canvas.toDataURL('image/jpeg', quality === 'email' ? 0.86 : 0.97), 'JPEG', 0, 0, W, H);
        } finally {
          el.style.display = 'none';
        }
        if (i < 3) pdf.addPage();
      }
      return pdf;
  };

  const createMonsterPdfBlob = async () => (await renderMonsterPdf('email')).output('blob');

  const handleDownload = async () => {
    setIsDownloading(true);
    const renderStartedAt = Date.now();
    trackEvent('pdf_render_started', { product: 'monster' });
    try {
      const pdf = await renderMonsterPdf();
      pdf.save(`Kit_Magic_${name.trim()}.pdf`);
      trackEvent('pdf_render_completed', { product: 'monster', durationMs: Date.now() - renderStartedAt });
      trackEvent('pdf_downloaded', { product: 'monster', pageCount: 3 });
      setShowQuickRating(true);
    } catch (error) {
      trackEvent('pdf_render_failed', { product: 'monster', durationMs: Date.now() - renderStartedAt });
      console.error(error);
      alert(error instanceof Error ? error.message : 'Nu am putut genera PDF-ul.');
    } finally {
      setIsDownloading(false);
    }
  };

  const monsterLabel = monsters.find(m => m.id === monsterType)?.label ?? monsterType;
  const monsterTarget = monsterCopy[monsterType]?.target ?? monsterLabel.toLocaleLowerCase('ro-RO');
  const bottleLabel = monsterCopy[monsterType]?.label ?? monsterLabel.toLocaleUpperCase('ro-RO');
  const activeDefaults = monsterDefaults[monsterType] || monsterDefaults['umbrele noptii'];
  const fallbackContent = buildPersonalizedKitContent({
    name,
    monsterType,
    fearLocation,
    calmingHelper,
    bedtimeRitual,
  });
  const kitContent = generatedContent || fallbackContent;

  return (
    <section id="monster-away" className={`scroll-mt-16 py-14 md:scroll-mt-24 md:py-32 bg-brand-navy relative overflow-hidden px-4 ${isMobileMonsterSelected ? "" : "max-md:hidden"}`}>
      <MagicalLoader isVisible={isGenerating || isDownloading} />
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {backgroundStars.map((star) => (
          <Star key={star.id} size={star.size} fill="white" stroke="none"
            style={{ position: 'absolute', top: star.top, left: star.left, opacity: star.opacity }} />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-8 text-center md:mb-14">
          <div className="inline-flex items-center gap-2 border border-brand-gold/30 bg-brand-gold/10 px-5 py-2 text-sm font-bold uppercase tracking-widest text-brand-gold mb-6">
            <BrandMark className="h-5 w-5" tone="paper" /> Ritual de noapte
          </div>
          <h2 className="font-nunito text-3xl font-extrabold leading-tight text-brand-cream md:text-6xl">
            Scutul <span className="text-brand-gold">de Noapte</span>
          </h2>
          <p className="mt-4 text-brand-cream/70 text-lg max-w-xl mx-auto">
            Un ritual blând de seară, cu certificat, rețetă simbolică și etichete pentru flacon.
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-brand-gold/25 bg-brand-cream p-5 shadow-2xl md:p-14"
        >
          <form onSubmit={handleGenerate} className="space-y-7 md:space-y-10">
            <MobileFlowSteps items={["Copilul", "Ritualul", "PDF-ul"]} accentClass="bg-brand-navy" />

            <div>
              <label className="block font-nunito font-black text-brand-navy text-lg mb-3 uppercase tracking-wider">
                Cui îi aparține curajul? 🦸
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="ex: Sofia, Alexandru, Ioana…"
                className="w-full bg-white border-4 border-brand-navy/10 focus:border-brand-purple rounded-2xl px-6 py-4 text-brand-navy font-bold text-xl outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block font-nunito font-black text-brand-navy text-lg mb-4 uppercase tracking-wider">
                Ce monstru trebuie să plece? 👻
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {monsters.map(m => (
                  <button key={m.id} type="button" onClick={() => setMonsterType(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-4 p-3 transition-all duration-200 md:gap-3 md:p-5 ${
                      monsterType === m.id
                        ? 'border-brand-purple bg-brand-purple/10 scale-105 shadow-lg shadow-brand-purple/20'
                        : 'border-brand-navy/10 bg-white/60 hover:border-brand-purple/40'
                    }`}
                  >
                    <span className="text-3xl md:text-4xl">{m.icon}</span>
                    <span className="text-xs font-black text-brand-navy uppercase tracking-wide text-center leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <details className="border-y border-brand-navy/10 py-4 md:border-0 md:py-0" open>
              <summary className="cursor-pointer text-sm font-black text-brand-navy md:hidden">Adaugă detalii pentru ritual</summary>
              <div className="mt-5 grid grid-cols-1 gap-4 md:mt-0 md:grid-cols-3">
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Unde apare frica?
                </label>
                <input
                  type="text"
                  value={fearLocation}
                  onChange={e => setFearLocation(e.target.value)}
                  placeholder={activeDefaults.location}
                  className="w-full bg-white border-4 border-brand-navy/10 focus:border-brand-purple rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Ce îl/o liniștește?
                </label>
                <input
                  type="text"
                  value={calmingHelper}
                  onChange={e => setCalmingHelper(e.target.value)}
                  placeholder={activeDefaults.helper}
                  className="w-full bg-white border-4 border-brand-navy/10 focus:border-brand-purple rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-sm mb-2 uppercase tracking-wider">
                  Ritual de seară
                </label>
                <input
                  type="text"
                  value={bedtimeRitual}
                  onChange={e => setBedtimeRitual(e.target.value)}
                  placeholder={activeDefaults.ritual}
                  className="w-full bg-white border-4 border-brand-navy/10 focus:border-brand-purple rounded-2xl px-5 py-4 text-brand-navy font-bold text-base outline-none transition-all shadow-inner"
                />
              </div>
              </div>
            </details>

            {/* PDF contents */}
            <div className="border-2 border-dashed border-brand-navy/10 bg-brand-navy/5 p-4 md:rounded-2xl md:p-6">
              <p className="font-bold text-brand-navy/60 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Ce primești în PDF
              </p>
              <div className="grid grid-cols-1 gap-3 text-left md:grid-cols-3 md:gap-4 md:text-center">
                {[
                  { icon: '📜', label: 'Certificat Oficial', desc: 'Clauze adaptate fricii alese' },
                  { icon: '🧪', label: 'Rețeta Spray',       desc: 'Pași adaptați camerei copilului' },
                  { icon: '🏷️', label: 'Etichete Flacon',   desc: 'Instrucțiuni pentru ritualul ales' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 md:flex-col md:gap-2">
                    <span className="text-2xl md:text-3xl">{item.icon}</span>
                    <span className="font-black text-brand-navy text-sm">{item.label}</span>
                    <span className="text-brand-navy/50 text-xs">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="rounded-2xl bg-brand-gold/15 border border-brand-gold/30 px-5 py-4 text-sm font-bold leading-relaxed text-brand-navy/65">
              Notă pentru adult: spray-ul magic este un ritual simbolic de joacă. Prepară-l doar cu ingrediente alimentare inofensive, pulverizează în aer sau lângă obiecte, niciodată pe piele, față, ochi, pernă sau animale.
            </p>

            <motion.button
              type="submit" disabled={!name.trim() || isGenerating}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-xl md:text-2xl shadow-2xl border-b-8 border-brand-gold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <ShieldCheck size={28} /> {isGenerating ? 'Pregătim magia...' : 'Generează kitul'}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ════ HIDDEN PDF TEMPLATES ════ */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <style>{CERT_STYLES}</style>
        <Page1Certificate name={name} monsterTarget={monsterTarget} content={kitContent} />
        <Page2Recipe content={kitContent} />
        <Page3Labels name={name} bottleLabel={bottleLabel} content={kitContent} />
      </div>

      {/* Result modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="bg-brand-cream max-w-lg w-full rounded-[3rem] border-4 border-brand-gold relative flex flex-col overflow-hidden shadow-2xl"
            >
              <button onClick={() => setShowResult(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-brand-navy/10 hover:bg-brand-navy/20 flex items-center justify-center font-black text-brand-navy/60 transition-all z-10">
                ✕
              </button>
              <div className="p-10 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                  className="text-7xl mb-6 block"
                >🛡️</motion.div>
                <h3 className="font-nunito font-black text-3xl text-brand-navy mb-3">Scutul este pregătit!</h3>
                <p className="text-brand-navy/60 font-medium mb-2">
                  Certificatul lui <span className="text-brand-purple font-black">{name}</span> e gata de printat.
                </p>
                <p className="text-brand-navy/40 text-sm mb-8">3 pagini A4 · Adaptat pentru {monsterLabel.toLocaleLowerCase('ro-RO')} · Gata de înrămat</p>
                <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
                  {['📜 Certificat', '🧪 Rețetă Spray', '🏷️ Etichete'].map(item => (
                    <div key={item} className="bg-brand-navy/5 rounded-2xl py-3 px-2 font-bold text-brand-navy/70">{item}</div>
                  ))}
                </div>
                <motion.button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full bg-brand-navy text-brand-cream py-5 rounded-2xl font-black text-lg border-b-8 border-brand-gold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50"
                >
                  <Download size={22} /> Descarcă PDF-ul Complet
                </motion.button>
                <EmailDelivery product="monster" filename={`Kit_Magic_${name.trim() || 'Erou'}.pdf`} childName={name} createPdf={createMonsterPdfBlob} />
                {showQuickRating && <QuickRating product="monster" />}
                <FeedbackInvite product="monster" compact />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   PDF PAGE COMPONENTS
══════════════════════════════════════════════════ */

function Page1Certificate({ name, monsterTarget, content }: { name: string; monsterTarget: string; content: MonsterKitContent }) {
  const heroName = name.trim() || 'EROUL NOSTRU';
  return (
    <div id="mk-page-1" className="mk-page" style={{ display: 'none' }}>
      <div className="mk-bg" />
      <div className="mk-border-outer" />
      <div className="mk-border-inner" />
      {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}

      <div className="mk-content">
        <p className="mk-ministry">Povestea Mea Magică · Scutul de Noapte</p>
        <h1 className="mk-title">CERTIFICAT OFICIAL<br/>DE PROTECȚIE MAGICĂ</h1>
        <p className="mk-subtitle">împotriva {monsterTarget} și a fricilor de noapte</p>
        <Divider stars={3} />

        <div className="mk-beneficiary-box">
          <span className="mk-beneficiary-label">Se acordă copilului curajos</span>
          <div className="mk-beneficiary-name">{heroName}</div>
        </div>

        <p className="mk-body">
          Prin autoritatea conferită de <em>Ordinul Dragonului Somnoros</em> și cu binecuvântarea{' '}
          <em>Zânei Luminilor de Noapte</em>, <span dangerouslySetInnerHTML={{ __html: content.body }} />{' '}
          <em>Certificatul se activează prin citire, zâmbet și îmbrățișare.</em>
        </p>

        <Divider stars={1} />

        <p className="mk-clauses-title">Clauze Oficiale Antimonstru · Articole de Lege Magică</p>
        <div className="mk-clauses-grid">
          {content.clauses.map((clause) => (
            <div key={clause.art} className="mk-clause">
              <span className="mk-clause-num">{clause.art}</span>{clause.text}
            </div>
          ))}
        </div>

        <Divider stars={1} />

        <div className="mk-seal-row">
          <div className="mk-sig-block">
            <div className="mk-sig-line" />
            <div className="mk-sig-name">{content.signatures[0].name}</div>
            <div className="mk-sig-title">{content.signatures[0].title}</div>
          </div>
          <DragonSeal />
          <div className="mk-sig-block">
            <div className="mk-sig-line" />
            <div className="mk-sig-name">{content.signatures[1].name}</div>
            <div className="mk-sig-title">{content.signatures[1].title}</div>
          </div>
        </div>

        <Divider stars={1} narrow />
        <p className="mk-validity">Valabil pentru ritualuri de seară, sub supravegherea unui adult</p>
        <p className="mk-cert-number">Nr. #0001 · Seria SOMN-LINIȘTIT</p>
      </div>
    </div>
  );
}

function Page2Recipe({ content }: { content: MonsterKitContent }) {
  return (
    <div id="mk-page-2" className="mk-page" style={{ display: 'none' }}>
      <div className="mk-bg" />
      <div className="mk-border-outer" />
      <div className="mk-border-inner" />
      {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}

      <div className="mk-content">
        <p className="mk-ministry">Povestea Mea Magică · Ritual de Noapte</p>
        <h1 className="mk-title" style={{ fontSize: 30 }}>REȚETA SECRETĂ</h1>
        <p className="mk-subtitle">a Spray-ului Anti-Monștri · Formulă Clasificată</p>
        <Divider stars={3} />

        <div className="mk-recipe-cols">
          <div className="mk-recipe-col">
            <p className="mk-recipe-section-title">Ingrediente Magice</p>
            {content.ingredients.map((ing) => (
              <div key={ing.num} className="mk-ingredient">
                <span className="mk-ing-num">{ing.num}</span>
                <div>
                  <div className="mk-ing-name">{ing.icon} {ing.name}</div>
                  <div className="mk-ing-detail">{ing.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mk-vdivider" />

          <div className="mk-recipe-col">
            <p className="mk-recipe-section-title">Mod de Preparare</p>
            {content.steps.map((s) => (
              <div key={s.roman} className="mk-step">
                <div className="mk-step-num"><span>{s.roman}</span></div>
                <div>
                  <div className="mk-step-l1">{s.l1}</div>
                  <div className="mk-step-l2">{s.l2}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider stars={3} />

        <div className="mk-incantation-box" style={{ marginTop: '50px' }}>
          <p className="mk-incantation-label">Descântecul de Activare · Se rostește în șoaptă</p>
          <p className="mk-incantation-text">
            „{content.spell}”
          </p>
        </div>

        <Divider stars={1} narrow />

        <p className="mk-disclaimer">
          ⚠️ Ritual de joacă pentru seară, pregătit de un adult cu ingrediente inofensive
        </p>

        <div className="mk-mini-seal-row">
          {(content.miniSeals || ['Aprobat de\nDragonul Somnoros', 'Nr. Rețetă\nSPRAY-007', 'Zâna Luminilor\nde Noapte']).map((t, i) => (
            <React.Fragment key={t}>
              <div className="mk-mini-seal">{t.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</div>
              {i < 2 && <span className="mk-mini-dot">✦</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function Page3Labels({ name, bottleLabel, content }: { name: string; bottleLabel: string; content: MonsterKitContent }) {
  const safeName = name.trim() || 'EROUL';
  return (
    <div id="mk-page-3" className="mk-page mk-page-parchment" style={{ display: 'none' }}>
      <div className="mk-border-outer mk-border-dark" />
      <div className="mk-border-inner mk-border-inner-dark" />
      {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} dark />)}

      <div className="mk-content">
        <p className="mk-ministry mk-ministry-dark">Decupați și lipiți pe flacon · Tăiați pe linia punctată</p>

        {/* Main bottle label */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, marginBottom: 28 }}>
          <div className="mk-label-cut-wrap">
            <div className="mk-label-main">
              <p className="mk-label-ministry">MINISTERUL PROTECȚIEI MAGICE</p>
              <h2 className="mk-label-title">SPRAY MAGIC</h2>
              <h3 className="mk-label-subtitle">ANTI-{bottleLabel}</h3>
              <div className="mk-label-divider" />
              <div className="mk-label-stars">✦ ✦ ✦ ✦ ✦</div>
              <div className="mk-label-divider" style={{ marginTop: 10 }} />
              <p className="mk-label-owner">Proprietar: <strong>{safeName}</strong></p>
              <p className="mk-label-formula">Formula Secretă Nr. SPRAY-007</p>
              <p className="mk-label-ingredients">{content.labelIngredients}</p>
              <p className="mk-label-validity">VALABIL PÂNĂ LA: SFÂRȘITUL MONȘTRILOR</p>
            </div>
          </div>
        </div>

        <div className="mk-labels-bottom-row">
          {/* Round seal */}
          <div className="mk-label-cut-wrap" style={{ flexShrink: 0 }}>
            <div className="mk-seal-label">
              <div style={{ transform: 'scale(0.85)' }}>
                <DragonSeal />
              </div>
            </div>
          </div>

          {/* Instruction strip */}
          <div className="mk-label-cut-wrap" style={{ flex: 1 }}>
            <div className="mk-instr-label">
              <p className="mk-instr-title">INSTRUCȚIUNI</p>
              {content.instructionLines.map(line => <p key={line} className="mk-instr-line">{line}</p>)}
              <p className="mk-instr-footer">SPRAY-007 · SOMN LINIȘTIT</p>
            </div>
          </div>
        </div>

        <p className="mk-page3-note">
          Sus: Etichetă principală flacon &nbsp;·&nbsp; Jos stânga: Sigiliu rotund &nbsp;·&nbsp; Jos dreapta: Etichetă cu instrucțiuni
        </p>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function Divider({ stars = 3, narrow = false }: { stars?: number; narrow?: boolean }) {
  const w = narrow ? 140 : 260;
  return (
    <div className="mk-divider">
      <div className="mk-div-line" style={{ width: w }} />
      {Array.from({ length: stars }).map((_, i) => <span key={i} className="mk-div-star">✦</span>)}
      <div className="mk-div-line" style={{ width: w }} />
    </div>
  );
}

function CornerSVG({ pos, dark = false }: { pos: 'tl'|'tr'|'bl'|'br'; dark?: boolean }) {
  const sx = (pos === 'tr' || pos === 'br') ? -1 : 1;
  const sy = (pos === 'bl' || pos === 'br') ? -1 : 1;
  const style: React.CSSProperties = {
    position: 'absolute', width: 52, height: 52,
    top:    pos.startsWith('t') ? 8 : undefined,
    bottom: pos.startsWith('b') ? 8 : undefined,
    left:   pos.endsWith('l')   ? 8 : undefined,
    right:  pos.endsWith('r')   ? 8 : undefined,
    transform: `scale(${sx}, ${sy})`,
  };
  const stroke = dark ? '#8a6e2f' : '#c9a84c';
  return (
    <svg style={style} viewBox="0 0 52 52" fill="none">
      <path d="M2 30 L2 2 L30 2" stroke={stroke} strokeWidth="1.6" />
      <path d="M2 14 L14 2" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
      <path d="M2 22 L22 2" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
      <circle cx="2" cy="2" r="2.6" fill={stroke} opacity="0.85" />
    </svg>
  );
}

function DragonSeal() {
  return (
    <div className="mk-dragon-seal">
      <div className="mk-dragon-seal-inner" style={{ marginTop: '-8px' }}>
        <svg viewBox="0 0 80 80" width="54" height="54" fill="none">
          {/* Body */}
          <ellipse cx="40" cy="47" rx="12" ry="10" fill="#c9a84c" opacity="0.85"/>
          {/* Head */}
          <ellipse cx="40" cy="30" rx="9" ry="8" fill="#c9a84c" opacity="0.85"/>
          {/* Snout */}
          <ellipse cx="47" cy="32" rx="5" ry="4" fill="#c9a84c" opacity="0.75"/>
          {/* Tail */}
          <path d="M52 47 Q66 43 68 55 Q60 51 52 51" fill="#c9a84c" opacity="0.8"/>
          {/* Wings */}
          <path d="M28 41 Q13 28 17 17 Q25 31 34 39" fill="#c9a84c" opacity="0.65"/>
          <path d="M52 41 Q67 28 63 17 Q55 31 46 39" fill="#c9a84c" opacity="0.65"/>
          {/* Eye */}
          <circle cx="45" cy="28" r="2.5" fill="#0e0f23"/>
          <circle cx="45.8" cy="27.2" r="0.9" fill="#c9a84c" opacity="0.6"/>
          {/* Flame */}
          <path d="M51 28 Q58 22 55 15 Q51 20 49 15 Q47 21 51 28Z" fill="#f4e4a0" opacity="0.8"/>
        </svg>
        <p className="mk-dragon-seal-text">SIGILIUL<br/>DRAGONULUI<br/>SOMNOROS<br/>· AUTENTIC ·</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   EMBEDDED STYLES for PDF templates
══════════════════════════════════════════════════ */
const CERT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap');

.mk-page {
  width: 794px; height: 1123px;
  background: linear-gradient(160deg, #0e0f23 0%, #0d1535 55%, #0e0f23 100%);
  position: relative; overflow: hidden;
  font-family: 'Crimson Pro', Georgia, serif;
  box-sizing: border-box;
}
.mk-page-parchment { background: #f0ead8 !important; }
.mk-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 15% 15%, rgba(155,89,182,0.07) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 85%, rgba(201,168,76,0.05) 0%, transparent 55%);
}

.mk-border-outer {
  position: absolute; inset: 16px;
  border: 2.5px solid #c9a84c; border-radius: 3px;
}
.mk-border-inner {
  position: absolute; inset: 27px;
  border: 0.65px solid rgba(201,168,76,0.3); border-radius: 2px;
}
.mk-border-dark       { border-color: #8a6e2f !important; }
.mk-border-inner-dark { border-color: rgba(138,110,47,0.3) !important; }

.mk-content {
  position: relative; z-index: 10;
  padding: 54px 68px 38px;
  display: flex; flex-direction: column;
  height: 100%; box-sizing: border-box;
}

/* ── Typography ── */
.mk-ministry {
  font-family: 'Cinzel', serif; font-size: 8px; font-weight: 600;
  letter-spacing: 0.32em; color: #c9a84c; text-align: center;
  text-transform: uppercase; opacity: 0.78; margin-bottom: 12px;
}
.mk-ministry-dark { color: #7a5c22; }

.mk-title {
  font-family: 'Cinzel', serif; font-size: 27px; font-weight: 700;
  color: #f4e4a0; text-align: center; line-height: 1.22;
  margin: 0 0 7px; letter-spacing: 0.04em;
  text-shadow: 0 0 28px rgba(201,168,76,0.25);
}
.mk-subtitle {
  font-family: 'Cinzel', serif; font-size: 10.5px; color: #c9a84c;
  text-align: center; letter-spacing: 0.17em; margin-bottom: 2px; opacity: 0.88;
}

.mk-divider {
  display: flex; align-items: center; gap: 10px;
  justify-content: center; margin: 13px auto;
}
.mk-div-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a84c, transparent);
  opacity: 0.58;
}
.mk-div-star { color: #c9a84c; font-size: 12px; }

/* ── Beneficiary ── */
.mk-beneficiary-box {
  text-align: center; margin: 12px 0;
  padding: 16px 28px;
  background: rgba(201,168,76,0.06);
  border: 1px solid rgba(201,168,76,0.22);
  border-radius: 3px;
}
.mk-beneficiary-label {
  font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 0.26em;
  color: #c9a84c; text-transform: uppercase;
  display: block; margin-bottom: 10px; opacity: 0.85;
}
.mk-beneficiary-name {
  font-family: 'Cinzel', serif; font-size: 26px; color: #f4e4a0;
  font-weight: 600; letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(201,168,76,0.42);
  display: inline-block; min-width: 300px; padding-bottom: 6px;
  max-width: 540px; overflow-wrap: anywhere;
}

/* ── Body text ── */
.mk-body {
  font-size: 13.5px; line-height: 1.75; color: #d4c5e8;
  text-align: center; font-style: italic; margin: 11px 0;
  overflow-wrap: anywhere;
}
.mk-body em { color: #f4e4a0; font-style: normal; font-weight: 500; }

/* ── Clauses ── */
.mk-clauses-title {
  font-family: 'Cinzel', serif; font-size: 8px; font-weight: 600;
  letter-spacing: 0.28em; color: #c9a84c; text-align: center;
  text-transform: uppercase; margin: 8px 0 10px; opacity: 0.85;
}
.mk-clauses-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 6px;
}
.mk-clause {
  background: rgba(201,168,76,0.05);
  border: 1px solid rgba(201,168,76,0.18);
  border-radius: 3px; padding: 11px 14px;
  font-size: 12px; color: #bfb3d4; line-height: 1.65; text-align: left;
  overflow-wrap: anywhere;
}
.mk-clause-num {
  font-family: 'Cinzel', serif; color: #c9a84c;
  font-size: 8.5px; font-weight: 600; letter-spacing: 0.14em;
  display: block; margin-bottom: 5px;
}

/* ── Seal row ── */
.mk-seal-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; margin: 8px 0;
}
.mk-sig-block { flex: 1; text-align: center; }
.mk-sig-line {
  height: 1px; background: rgba(201,168,76,0.4);
  width: 180px; margin: 0 auto 7px;
}
.mk-sig-name  { font-size: 11.5px; color: #9a8bc0; font-style: italic; margin-bottom: 4px; }
.mk-sig-title {
  font-family: 'Cinzel', serif; font-size: 7px; color: #c9a84c;
  letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.82;
}
.mk-dragon-seal {
  flex-shrink: 0; width: 100px; height: 100px; border-radius: 50%;
  border: 1.8px solid #c9a84c;
  background: rgba(201,168,76,0.07);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 18px rgba(201,168,76,0.12);
}
.mk-dragon-seal-inner { text-align: center; }
.mk-dragon-seal-text {
  font-family: 'Cinzel', serif; font-size: 6px; color: #c9a84c;
  letter-spacing: 0.1em; line-height: 1.5; margin-top: 3px;
}

/* ── Footer ── */
.mk-validity {
  font-family: 'Cinzel', serif; font-size: 7.5px;
  color: rgba(201,168,76,0.5); text-align: center;
  letter-spacing: 0.2em; text-transform: uppercase; margin-top: 6px;
}
.mk-cert-number {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.28); text-align: right;
  letter-spacing: 0.15em; margin-top: 4px;
}

/* ══ PAGE 2: Recipe ══ */
.mk-recipe-cols {
  display: flex; gap: 0; margin: 12px 0; flex: 1; align-items: flex-start;
}
.mk-recipe-col { flex: 1; padding: 0 18px; }
.mk-recipe-col:first-child { padding-left: 0; }
.mk-recipe-col:last-child  { padding-right: 0; }

.mk-vdivider {
  width: 1px; flex-shrink: 0; margin: 6px 6px;
  background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.38) 20%, rgba(201,168,76,0.38) 80%, transparent);
}
.mk-recipe-section-title {
  font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600;
  letter-spacing: 0.28em; color: #c9a84c; text-transform: uppercase;
  margin-bottom: 18px; opacity: 0.9;
}
.mk-ingredient {
  display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px;
}
.mk-ing-num {
  font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700;
  color: rgba(201,168,76,0.18); line-height: 1; flex-shrink: 0;
  width: 24px; text-align: right; margin-top: 1px;
}
.mk-ing-name   { font-size: 13.5px; font-weight: 500; color: #f4e4a0; line-height: 1.3; overflow-wrap: anywhere; }
.mk-ing-detail { font-size: 11px; color: #9a8bc0; font-style: italic; margin-top: 3px; overflow-wrap: anywhere; }

.mk-step {
  display: grid; grid-template-columns: 28px minmax(0, 1fr); column-gap: 12px;
  align-items: start; margin-bottom: 18px;
}
.mk-step-num {
  width: 28px; height: 28px; box-sizing: border-box; border-radius: 50%;
  border: 1.2px solid rgba(201,168,76,0.5);
  background: rgba(201,168,76,0.08);
  color: #d7b759; display: grid; place-items: center; margin: 0;
}
.mk-step-num span {
  display: block; font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700;
  line-height: 1; text-align: center; transform: translateY(-1.5px);
}
.mk-step-l1 { font-size: 13px; color: #d4c5e8; line-height: 1.45; overflow-wrap: anywhere; }
.mk-step-l2 { font-size: 12px; color: #bfb3d4; font-style: italic; margin-top: 3px; overflow-wrap: anywhere; }

.mk-incantation-box {
  background: rgba(201,168,76,0.06);
  border: 1px solid rgba(201,168,76,0.26);
  border-radius: 4px;
  padding: 20px 30px; text-align: center; margin: 6px 0;
}
.mk-incantation-label {
  font-family: 'Cinzel', serif; font-size: 7.5px; font-weight: 600;
  letter-spacing: 0.28em; color: #c9a84c; text-transform: uppercase;
  display: block; margin-bottom: 12px; opacity: 0.88;
}
.mk-incantation-text {
  font-size: 16px; font-style: italic; color: #d4c5e8; line-height: 1.75;
  overflow-wrap: anywhere; white-space: pre-line;
}
.mk-incantation-text strong { color: #f4e4a0; font-style: normal; }

.mk-disclaimer {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.4); text-align: center;
  letter-spacing: 0.14em; margin: 6px 0 4px;
}
.mk-mini-seal-row {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-top: 8px;
}
.mk-mini-seal {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.38); letter-spacing: 0.14em;
  text-align: center; line-height: 1.6;
}
.mk-mini-dot { color: rgba(201,168,76,0.28); font-size: 10px; }

/* ══ PAGE 3: Labels ══ */
.mk-label-cut-wrap {
  border: 1.5px dashed rgba(138,110,47,0.42);
  border-radius: 8px; padding: 7px;
  display: inline-block;
}
.mk-label-main {
  width: 560px;
  background: linear-gradient(160deg, #0e0f23, #0d1535);
  border: 2px solid #c9a84c; border-radius: 12px;
  padding: 28px 40px; text-align: center;
}
.mk-label-ministry {
  font-family: 'Cinzel', serif; font-size: 7.5px; letter-spacing: 0.26em;
  color: #c9a84c; text-transform: uppercase; opacity: 0.78; margin-bottom: 10px;
}
.mk-label-title {
  font-family: 'Cinzel', serif; font-size: 34px; font-weight: 700;
  color: #f4e4a0; letter-spacing: 0.05em; margin: 0 0 5px;
}
.mk-label-subtitle {
  font-family: 'Cinzel', serif; font-size: 15px; color: #c9a84c;
  letter-spacing: 0.12em; margin-bottom: 10px;
}
.mk-label-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a84c, transparent);
  opacity: 0.45; margin: 8px 0;
}
.mk-label-stars   { color: #c9a84c; font-size: 14px; letter-spacing: 8px; margin: 6px 0; }
.mk-label-owner   { font-family: 'Cinzel', serif; font-size: 12px; color: #d4c5e8; margin: 10px 0 5px; letter-spacing: 0.1em; overflow-wrap: anywhere; }
.mk-label-owner strong   { color: #f4e4a0; }
.mk-label-formula        { font-size: 13px; color: #9a8bc0; font-style: italic; margin-bottom: 4px; }
.mk-label-ingredients    { font-size: 12px; color: #bfb3d4; font-style: italic; margin-bottom: 7px; overflow-wrap: anywhere; }
.mk-label-validity {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.5); letter-spacing: 0.15em; text-transform: uppercase;
}

.mk-labels-bottom-row {
  display: flex; gap: 28px; align-items: flex-start; justify-content: center;
}

.mk-seal-label {
  width: 180px; height: 180px; border-radius: 50%;
  background: linear-gradient(160deg, #0e0f23, #0d1535);
  border: 2.5px solid #c9a84c;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 16px rgba(201,168,76,0.1);
}
.mk-seal-label-inner { text-align: center; }
.mk-seal-label-text {
  font-family: 'Cinzel', serif; font-size: 8.5px; color: #c9a84c;
  letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.88; line-height: 1.5;
}

.mk-instr-label {
  background: linear-gradient(160deg, #0e0f23, #0d1535);
  border: 2px solid #c9a84c; border-radius: 12px;
  width: 420px;
  padding: 26px 32px; text-align: center;
  display: flex; flex-direction: column; justify-content: center;
}
.mk-instr-title {
  font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600;
  color: #c9a84c; letter-spacing: 0.24em; text-transform: uppercase;
  opacity: 0.9; margin-bottom: 12px;
}
.mk-instr-line   { font-size: 15px; color: #d4c5e8; margin: 6px 0; overflow-wrap: anywhere; }
.mk-instr-footer {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.4); letter-spacing: 0.14em; margin-top: 10px;
}

.mk-page3-note {
  font-family: 'Cinzel', serif; font-size: 7.5px;
  color: rgba(138,110,47,0.5); text-align: center;
  letter-spacing: 0.16em; margin-top: auto; padding-top: 18px;
}
`;
