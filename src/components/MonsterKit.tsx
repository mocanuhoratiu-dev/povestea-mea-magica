'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, Sparkles, Star } from 'lucide-react';
import MagicalLoader from './MagicalLoader';

/* ─── Types ─────────────────────────────────────── */
interface Monster { id: string; label: string; icon: string; }

const monsters: Monster[] = [
  { id: 'umbrele noptii',        label: 'Umbrele Nopții',       icon: '🌑' },
  { id: 'monstrul de sub pat',   label: 'Monstrul de sub Pat',  icon: '🛌' },
  { id: 'zgomotele ciudate',     label: 'Zgomotele Ciudate',    icon: '🔊' },
  { id: 'dulapul scartaitor',    label: 'Dulapul Scârțâitor',   icon: '🚪' },
];

const MONSTER_KITS: Record<string, any> = {
  'umbrele noptii': {
    body: "camera acestui copil este protejată de un <em>scut invizibil</em> țesut din <em>praf de stele</em>, lumină de lună plină și <em>râsete de spiriduși veseli</em>. Nicio umbră nu are dreptul să se miște fără permisiune.",
    ingredients: [
      { num: '1', icon: '💧', name: 'Apă de Lună Plină', detail: 'pentru a dizolva orice umbră' },
      { num: '2', icon: '🍋', name: 'Esență de Lămâie-Soare', detail: 'lumina concentrată în fruct' },
      { num: '3', icon: '✨', name: 'Sclipici de Licurici', detail: 'strălucește în întuneric' }
    ],
    steps: [
      { roman: 'I', l1: 'Amestecă apa cu lumina soarelui,', l2: 'agitând flaconul spre răsărit.' },
      { roman: 'II', l1: 'Adaugă sclipiciul în timp ce zâmbești,', l2: 'umbrele se tem de bucurie.' }
    ],
    spell: "Umbre mici și umbre mari, plecați voi în alte zări! Lumina mea e scutul bun, noaptea-i albă de acum!"
  },
  'monstrul de sub pat': {
    body: "podeaua acestei camere este acoperită de o <em>plasă magică</em> de nepătruns. Nicio creatură cu picioare mari sau intenții de gâdilat nu poate trece de marginea patului.",
    ingredients: [
      { num: '1', icon: '💨', name: 'Praf de Somn Liniștit', detail: 'adormi monstrul pe loc' },
      { num: '2', icon: '🍪', name: 'Firimituri de Curaj', detail: 'monștrii fug de copiii curajoși' },
      { num: '3', icon: '🫧', name: 'Bule de Săpun Magic', detail: 'pentru a-i aluneca picioarele' }
    ],
    steps: [
      { roman: 'I', l1: 'Pulverizează generos sub pat,', l2: 'insistând în colțurile întunecate.' },
      { roman: 'II', l1: 'Pune flaconul pe noptieră ca pază,', l2: 'dragonul va veghea toată noaptea.' }
    ],
    spell: "Sub patul meu e liniște, niciun monstru nu mai mișcă! Dormi acum, somn pufos, patul meu e cel mai faimos!"
  },
  'zgomotele ciudate': {
    body: "urechile acestui erou sunt protejate de un <em>filtru de armonie</em>. Orice scârțâit sau pocnet este captat și transformat automat în <em>torcăit de pisică</em> sau susur de izvor.",
    ingredients: [
      { num: '1', icon: '🍯', name: 'Picături de Miere Mută', detail: 'pentru a îndulci zgomotele' },
      { num: '2', icon: '☁️', name: 'Esență de Nor Pufos', detail: 'absoarbe orice sunet brusc' },
      { num: '3', icon: '🎻', name: 'Ulei de Liniște Muzicală', detail: 'transformă haosul în pace' }
    ],
    steps: [
      { roman: 'I', l1: 'Toarnă mierea imaginară în apă,', l2: 'ascultând cum se așterne liniștea.' },
      { roman: 'II', l1: 'Pulverizează spre sursa sunetului,', l2: 'zâmbind la fiecare pocnet.' }
    ],
    spell: "Zgomote ce mă speriați, în torcăit vă transformați! Liniștea e prietena mea, noaptea-i lină ca o stea!"
  },
  'dulapul scartaitor': {
    body: "ușile acestui dulap sunt <em>sigilate cu magicele balamale de vis</em>. Interiorul este acum un <em>tărâm al ordinii și păcii</em>, unde hainele dorm liniștite și nicio ușă nu îndrăznește să se miște.",
    ingredients: [
      { num: '1', icon: '🌈', name: 'Ulei de Curcubeu Fin', detail: 'pentru balamale fericite' },
      { num: '2', icon: '🧊', name: 'Esență de Liniște Înghețată', detail: 'oprește orice mișcare' },
      { num: '3', icon: '🗝️', name: 'Cheia Invizibilă a Păcii', detail: 'încuie frica afară' }
    ],
    steps: [
      { roman: 'I', l1: 'Unge imaginar balamalele dulapului,', l2: 'șoptind cuvinte de somn ușor.' },
      { roman: 'II', l1: 'Pulverizează pe uși în formă de X,', l2: 'creând un sigiliu de aur.' }
    ],
    spell: "Uși de dulap, stați cuminți, nu mai speriați părinți! Hainele dorm, eu dorm bine, liniștea e lângă mine!"
  }
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function MonsterKit() {
  const [name,        setName]        = useState('');
  const [monsterType, setMonsterType] = useState(monsters[0].id);
  const [isLoading,   setIsLoading]   = useState(false);
  const [showResult,  setShowResult]  = useState(false);
  const [aiKitData,   setAiKitData]   = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    
    try {
      const mLabel = monsters.find(m => m.id === monsterType)?.label ?? monsterType;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "monster", name, monster: mLabel }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setAiKitData(result.data);
      } else {
        // Fallback la static dacă pică API-ul
        setAiKitData(null); 
      }
      setShowResult(true);
    } catch (err) {
      console.error(err);
      setAiKitData(null);
      setShowResult(true); // show static fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    ]);

    const { jsPDF }   = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;
    const pdf         = new jsPDF('p', 'mm', 'a4');
    const W           = pdf.internal.pageSize.getWidth();
    const H           = pdf.internal.pageSize.getHeight();

    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`mk-page-${i}`);
      if (!el) continue;
      el.style.display = 'block';
      const canvas = await html2canvas(el, {
        scale: 2.5, useCORS: true, logging: false,
        windowWidth: 794, windowHeight: 1123,
      });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, W, H);
      el.style.display = 'none';
      if (i < 3) pdf.addPage();
    }
    pdf.save(`Kit_Magic_${name.trim()}.pdf`);
  };

  const monsterLabel = monsters.find(m => m.id === monsterType)?.label ?? monsterType;

  return (
    <section id="monster-away" className="py-20 md:py-32 bg-brand-navy relative overflow-hidden px-4">
      <MagicalLoader isVisible={isLoading} />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 24 }).map((_, i) => (
          <Star key={i} size={Math.random() * 8 + 4} fill="white" stroke="none"
            style={{ position: 'absolute', top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, opacity: Math.random() * 0.6 + 0.2 }} />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold font-bold text-sm uppercase tracking-widest mb-6">
            <ShieldCheck size={16} /> Kit Anti-Monștri
          </div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-cream leading-tight">
            Scut Magic <span className="text-brand-gold">pentru Noapte</span> 🛡️
          </h2>
          <p className="mt-4 text-brand-cream/70 text-lg max-w-xl mx-auto">
            Un certificat oficial + rețeta spray-ului magic + etichete pentru flacon — totul într-un PDF premium, gata de printat și înrămat.
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-brand-cream rounded-[2.5rem] p-8 md:p-14 shadow-2xl border-4 border-brand-gold/20"
        >
          <form onSubmit={handleGenerate} className="space-y-10">

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {monsters.map(m => (
                  <button key={m.id} type="button" onClick={() => setMonsterType(m.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-4 transition-all duration-200 ${
                      monsterType === m.id
                        ? 'border-brand-purple bg-brand-purple/10 scale-105 shadow-lg shadow-brand-purple/20'
                        : 'border-brand-navy/10 bg-white/60 hover:border-brand-purple/40'
                    }`}
                  >
                    <span className="text-4xl">{m.icon}</span>
                    <span className="text-xs font-black text-brand-navy uppercase tracking-wide text-center leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview what's inside */}
            <div className="bg-brand-navy/5 rounded-2xl p-6 border-2 border-dashed border-brand-navy/10">
              <p className="font-bold text-brand-navy/60 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Ce primești în PDF
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: '📜', label: 'Certificat Oficial', desc: 'Personalizat cu numele copilului' },
                  { icon: '🧪', label: 'Rețeta Spray',       desc: 'Instrucțiuni + descântec magic' },
                  { icon: '🏷️', label: 'Etichete Flacon',   desc: '3 variante de decupat' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="font-black text-brand-navy text-sm">{item.label}</span>
                    <span className="text-brand-navy/50 text-xs">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              type="submit" disabled={!name.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-xl md:text-2xl shadow-2xl border-b-8 border-brand-gold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <ShieldCheck size={28} /> Generează Kitul Magic ✨
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ════ HIDDEN PDF TEMPLATES ════ */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <style>{CERT_STYLES}</style>
        <Page1Certificate name={name} monsterLabel={monsterLabel} content={aiKitData || MONSTER_KITS[monsterType]} />
        <Page2Recipe content={aiKitData || MONSTER_KITS[monsterType]} />
        <Page3Labels name={name} monsterLabel={monsterLabel} />
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
                <h3 className="font-nunito font-black text-3xl text-brand-navy mb-3">Kitul este pregătit!</h3>
                <p className="text-brand-navy/60 font-medium mb-2">
                  Certificatul lui <span className="text-brand-purple font-black">{name}</span> e gata de printat.
                </p>
                <p className="text-brand-navy/40 text-sm mb-8">3 pagini A4 · Format premium · Gata de înrămat</p>
                <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
                  {['📜 Certificat', '🧪 Rețetă Spray', '🏷️ Etichete'].map(item => (
                    <div key={item} className="bg-brand-navy/5 rounded-2xl py-3 px-2 font-bold text-brand-navy/70">{item}</div>
                  ))}
                </div>
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full bg-brand-navy text-brand-cream py-5 rounded-2xl font-black text-lg border-b-8 border-brand-gold flex items-center justify-center gap-3 shadow-xl transition-all"
                >
                  <Download size={22} /> Descarcă PDF-ul Complet
                </motion.button>
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

function Page1Certificate({ name, monsterLabel, content }: { name: string; monsterLabel: string; content: any }) {
  const heroName = name.trim() || 'EROUL NOSTRU';
  return (
    <div id="mk-page-1" className="mk-page" style={{ display: 'none' }}>
      <div className="mk-bg" />
      <div className="mk-border-outer" />
      <div className="mk-border-inner" />
      {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}

      <div className="mk-content">
        <p className="mk-ministry">Ministerul Protecției Magice · Regatul Viselor Liniștite</p>
        <h1 className="mk-title">CERTIFICAT OFICIAL<br/>DE PROTECȚIE MAGICĂ</h1>
        <p className="mk-subtitle">împotriva {monsterLabel} și a tuturor Ființelor Nedorite</p>
        <Divider stars={3} />

        <div className="mk-beneficiary-box">
          <span className="mk-beneficiary-label">Se acordă micuțului / micuței erou / eroine</span>
          <div className="mk-beneficiary-name">{heroName}</div>
        </div>

        <p className="mk-body">
          Prin autoritatea conferită de <em>Ordinul Dragonului Somnoros</em> și cu binecuvântarea{' '}
          <em>Zânei Luminilor de Noapte</em>, <span dangerouslySetInnerHTML={{ __html: content.body }} />{' '}
          <em>Prezentul certificat este valabil la nesfârșit.</em>
        </p>

        <Divider stars={1} />

        <p className="mk-clauses-title">Clauze Oficiale Antimonstru · Articole de Lege Magică</p>
        <div className="mk-clauses-grid">
          {[
            ['Art. I',   'Monștrilor cu picioare mirositoare le este strict interzis accesul sub pat, în dulap și în spatele ușii.'],
            ['Art. II',  'Nicio umbră nu are dreptul să se miște, să crească sau să facă grimase fără permisiune scrisă.'],
            ['Art. III', 'Zgomotele misterioase din noapte sunt obligate să se identifice; dacă nu o fac, devin pisici adormite.'],
            ['Art. IV',  'Orice monstru care ignoră prezentul certificat va fi transformat în nori de vată roz și dus de vânt.'],
          ].map(([art, text]) => (
            <div key={art} className="mk-clause">
              <span className="mk-clause-num">{art}</span>{text}
            </div>
          ))}
        </div>

        <Divider stars={1} />

        <div className="mk-seal-row">
          <div className="mk-sig-block">
            <div className="mk-sig-line" />
            <div className="mk-sig-name">Mag. Umberto din Tărâmul de Sus</div>
            <div className="mk-sig-title">Comandantul Gardienilor de sub Pat</div>
          </div>
          <DragonSeal />
          <div className="mk-sig-block">
            <div className="mk-sig-line" />
            <div className="mk-sig-name">Luminia din Crăpătura Stelelor</div>
            <div className="mk-sig-title">Zâna Luminilor de Noapte</div>
          </div>
        </div>

        <Divider stars={1} narrow />
        <p className="mk-validity">Valabil pe toată durata copilăriei · Se reînnoiește automat în fiecare noapte la miezul nopții</p>
        <p className="mk-cert-number">Nr. #0001 · Seria SOMN-LINIȘTIT</p>
      </div>
    </div>
  );
}

function Page2Recipe({ content }: { content: any }) {
  return (
    <div id="mk-page-2" className="mk-page" style={{ display: 'none' }}>
      <div className="mk-bg" />
      <div className="mk-border-outer" />
      <div className="mk-border-inner" />
      {(['tl','tr','bl','br'] as const).map(pos => <CornerSVG key={pos} pos={pos} />)}

      <div className="mk-content">
        <p className="mk-ministry">Laboratorul Alchimic al Ministerului Protecției Magice</p>
        <h1 className="mk-title" style={{ fontSize: 30 }}>REȚETA SECRETĂ</h1>
        <p className="mk-subtitle">a Spray-ului Anti-Monștri · Formulă Clasificată</p>
        <Divider stars={3} />

        <div className="mk-recipe-cols">
          <div className="mk-recipe-col">
            <p className="mk-recipe-section-title">Ingrediente Magice</p>
            {content.ingredients.map((ing: any) => (
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
            {content.steps.map((s: any) => (
              <div key={s.roman} className="mk-step">
                <div className="mk-step-num">{s.roman}</div>
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
            „<span dangerouslySetInnerHTML={{ __html: content.spell }} />"
          </p>
        </div>

        <Divider stars={1} narrow />

        <p className="mk-disclaimer">
          ⚠️ Inofensiv pentru oameni, animale de companie și spiriduși prietenoși
          &nbsp;·&nbsp; Eficacitate garantată 100% față de toți monștrii
        </p>

        <div className="mk-mini-seal-row">
          {['Aprobat de\nDragonul Somnoros', 'Nr. Rețetă\nSPRAY-007', 'Zâna Luminilor\nde Noapte'].map((t, i) => (
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

function Page3Labels({ name, monsterLabel }: { name: string; monsterLabel: string }) {
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
              <h3 className="mk-label-subtitle">ANTI-{monsterLabel.toUpperCase()}</h3>
              <div className="mk-label-divider" />
              <div className="mk-label-stars">✦ ✦ ✦ ✦ ✦</div>
              <div className="mk-label-divider" style={{ marginTop: 10 }} />
              <p className="mk-label-owner">Proprietar: <strong>{safeName}</strong></p>
              <p className="mk-label-formula">Formula Secretă Nr. SPRAY-007</p>
              <p className="mk-label-ingredients">Praf de stele · Esență de curaj · Sclipici invizibil</p>
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
              {[
                '1.  Agită flaconul de 7 ori',
                '2.  Rostește descântecul magic',
                '3.  Pulverizează de 3 ori sub pat',
                '4.  Repetă la dulap și ușă',
                '5.  Dormi liniștit/ă!  ✓',
              ].map(line => <p key={line} className="mk-instr-line">{line}</p>)}
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

function DragonSealSmall() {
  return (
    <svg viewBox="0 0 80 80" width="44" height="44" fill="none" style={{ margin: '5px auto', display: 'block' }}>
      <ellipse cx="40" cy="47" rx="12" ry="10" fill="#c9a84c" opacity="0.85"/>
      <ellipse cx="40" cy="30" rx="9" ry="8" fill="#c9a84c" opacity="0.85"/>
      <ellipse cx="47" cy="32" rx="5" ry="4" fill="#c9a84c" opacity="0.75"/>
      <path d="M52 47 Q66 43 68 55 Q60 51 52 51" fill="#c9a84c" opacity="0.8"/>
      <path d="M28 41 Q13 28 17 17 Q25 31 34 39" fill="#c9a84c" opacity="0.65"/>
      <path d="M52 41 Q67 28 63 17 Q55 31 46 39" fill="#c9a84c" opacity="0.65"/>
      <circle cx="45" cy="28" r="2.5" fill="#0e0f23"/>
      <path d="M51 28 Q58 22 55 15 Q51 20 49 15 Q47 21 51 28Z" fill="#f4e4a0" opacity="0.8"/>
    </svg>
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
}

/* ── Body text ── */
.mk-body {
  font-size: 13.5px; line-height: 1.75; color: #d4c5e8;
  text-align: center; font-style: italic; margin: 11px 0;
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
.mk-ing-name   { font-size: 13.5px; font-weight: 500; color: #f4e4a0; line-height: 1.3; }
.mk-ing-detail { font-size: 11px; color: #9a8bc0; font-style: italic; margin-top: 3px; }

.mk-step { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 18px; }
.mk-step-num {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
  border: 1px solid rgba(201,168,76,0.4);
  background: rgba(201,168,76,0.08);
  font-family: 'Cinzel', serif; font-size: 8.5px; color: #c9a84c;
  text-align: center; line-height: 22px;
  margin-top: 1px;
}
.mk-step-l1 { font-size: 13px; color: #d4c5e8; line-height: 1.45; }
.mk-step-l2 { font-size: 12px; color: #bfb3d4; font-style: italic; margin-top: 3px; }

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
  width: 440px;
  background: linear-gradient(160deg, #0e0f23, #0d1535);
  border: 2px solid #c9a84c; border-radius: 12px;
  padding: 20px 32px; text-align: center;
}
.mk-label-ministry {
  font-family: 'Cinzel', serif; font-size: 7.5px; letter-spacing: 0.26em;
  color: #c9a84c; text-transform: uppercase; opacity: 0.78; margin-bottom: 10px;
}
.mk-label-title {
  font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700;
  color: #f4e4a0; letter-spacing: 0.05em; margin: 0 0 5px;
}
.mk-label-subtitle {
  font-family: 'Cinzel', serif; font-size: 13px; color: #c9a84c;
  letter-spacing: 0.12em; margin-bottom: 10px;
}
.mk-label-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a84c, transparent);
  opacity: 0.45; margin: 8px 0;
}
.mk-label-stars   { color: #c9a84c; font-size: 14px; letter-spacing: 8px; margin: 6px 0; }
.mk-label-owner   { font-family: 'Cinzel', serif; font-size: 10px; color: #d4c5e8; margin: 8px 0 3px; letter-spacing: 0.1em; }
.mk-label-owner strong   { color: #f4e4a0; }
.mk-label-formula        { font-size: 11px; color: #9a8bc0; font-style: italic; margin-bottom: 3px; }
.mk-label-ingredients    { font-size: 10.5px; color: #bfb3d4; font-style: italic; margin-bottom: 5px; }
.mk-label-validity {
  font-family: 'Cinzel', serif; font-size: 7px;
  color: rgba(201,168,76,0.5); letter-spacing: 0.15em; text-transform: uppercase;
}

.mk-labels-bottom-row {
  display: flex; gap: 24px; align-items: flex-start;
}

.mk-seal-label {
  width: 152px; height: 152px; border-radius: 50%;
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
  padding: 18px 24px; text-align: center;
  display: flex; flex-direction: column; justify-content: center;
}
.mk-instr-title {
  font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600;
  color: #c9a84c; letter-spacing: 0.24em; text-transform: uppercase;
  opacity: 0.9; margin-bottom: 12px;
}
.mk-instr-line   { font-size: 12.5px; color: #d4c5e8; margin: 4px 0; }
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
