'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, Wand2 } from 'lucide-react';
import MagicalLoader from './MagicalLoader';

const MonsterKit = () => {
  const [name, setName] = useState('');
  const [monsterType, setMonsterType] = useState('umbrele noptii');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const monsters = [
    { id: 'umbrele noptii', label: 'Umbrele Nopții', icon: '🌑' },
    { id: 'monstrul de sub pat', label: 'Monstrul de sub pat', icon: '🛌' },
    { id: 'zgomotele ciudate', label: 'Zgomotele ciudate', icon: '🔊' },
    { id: 'dulapul scartaitor', label: 'Dulapul scârțâitor', icon: '🚪' },
  ];

  const generateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsLoading(true);
    setTimeout(() => {
      setShowResult(true);
      setIsLoading(false);
    }, 1500);
  };

  const downloadKit = () => {
    const p1 = document.getElementById("cert-p1");
    const p2 = document.getElementById("cert-p2");
    const p3 = document.getElementById("cert-p3");
    if (!p1 || !p2 || !p3) return;

    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        if ((window as any).html2canvas && src.includes("html2canvas")) return resolve(true);
        if ((window as any).jspdf && src.includes("jspdf")) return resolve(true);
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    const generate = async () => {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const capturePage = async (el: HTMLElement, isLast: boolean) => {
          el.style.display = "block";
          const canvas = await html2canvas(el, { 
            scale: 2.5, 
            useCORS: true, 
            logging: false,
            windowWidth: 680,
            windowHeight: 900
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          el.style.display = "none";
          if (!isLast) pdf.addPage();
      };

      await capturePage(p1, false);
      await capturePage(p2, false);
      await capturePage(p3, true);

      pdf.save(`Kit_Protectie_Magic_${name}.pdf`);
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
    ]).then(generate);
  };

  return (
    <section id="monster-away" className="py-20 md:py-32 bg-brand-navy relative overflow-hidden px-4">
      <MagicalLoader isVisible={isLoading} />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-brand-cream mb-6 tracking-tighter">Kit Anti-Monștri 🛡️</h2>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} className="bg-brand-cream rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-4 border-brand-gold/20">
          <form onSubmit={generateKit} className="space-y-8">
            <div className="space-y-4">
              <label className="block font-cinzel font-bold text-brand-navy text-xl">Cui îi aparține curajul?</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele micuțului erou..." className="w-full bg-brand-navy/5 border-2 border-brand-navy/10 rounded-2xl px-6 py-4 text-brand-navy font-bold text-lg outline-none" />
            </div>
            <div className="space-y-4">
              <label className="block font-cinzel font-bold text-brand-navy text-xl">Ce monstru trebuie să plece?</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {monsters.map((m) => (
                  <button key={m.id} type="button" onClick={() => setMonsterType(m.id)} className={`p-4 rounded-2xl border-2 transition-all ${monsterType === m.id ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-navy/10'}`}>
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-xs font-black text-brand-navy uppercase block mt-2">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!name || isLoading} className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-xl border-b-8 border-brand-gold">GENEREAZĂ KITUL MAGIC ✨</button>
          </form>
        </motion.div>
      </div>

      {/* HIDDEN TEMPLATES - 100% USER FIDELITY */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap');
          .cert-wrap { background: linear-gradient(160deg, #1a0a2e 0%, #0d1a3a 50%, #1a0a2e 100%); border: 3px solid #c9a84c; border-radius: 4px; padding: 48px 52px; position: relative; font-family: 'Crimson Pro', Georgia, serif; overflow: hidden; width: 680px; height: 900px; box-sizing: border-box; color: #f4e4a0; }
          .corner { position: absolute; width: 60px; height: 60px; opacity: 0.85; }
          .c-tl { top: 8px; left: 8px; }
          .c-tr { top: 8px; right: 8px; transform: scaleX(-1); }
          .c-bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
          .c-br { bottom: 8px; right: 8px; transform: scale(-1); }
          .inner-border { position: absolute; inset: 16px; border: 1px solid rgba(201,168,76,0.35); border-radius: 2px; pointer-events: none; }
          .stars-bg { position: absolute; inset: 0; pointer-events: none; }
          .ministry-label { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; color: #c9a84c; text-align: center; text-transform: uppercase; margin-bottom: 6px; opacity: 0.8; }
          .title-main { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #f4e4a0; text-align: center; line-height: 1.25; text-shadow: 0 0 30px rgba(201,168,76,0.4); margin-bottom: 4px; }
          .title-sub { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 400; color: #c9a84c; text-align: center; letter-spacing: 0.2em; margin-bottom: 20px; }
          .divider { display: flex; align-items: center; gap: 12px; margin: 12px 0; justify-content: center; }
          .div-line { width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); }
          .div-star { color: #c9a84c; font-size: 14px; }
          .beneficiary-block { text-align: center; margin: 20px 0; padding: 16px 24px; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 2px; }
          .beneficiary-label { font-size: 10px; letter-spacing: 0.25em; color: #c9a84c; text-transform: uppercase; display: block; margin-bottom: 6px; font-family: 'Cinzel', serif; }
          .beneficiary-name { font-family: 'Cinzel', serif; font-size: 20px; color: #f4e4a0; font-weight: 600; border-bottom: 1px solid rgba(201,168,76,0.4); display: inline-block; min-width: 260px; padding-bottom: 4px; font-style: italic; opacity: 0.7; }
          .body-text { font-size: 14.5px; line-height: 1.75; color: #d4c5e8; text-align: center; font-weight: 300; margin: 18px 0; font-style: italic; }
          .body-text em { color: #f4e4a0; font-style: normal; font-weight: 400; }
          .clauses-title { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; color: #c9a84c; text-align: center; text-transform: uppercase; margin: 18px 0 10px; }
          .clauses-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 18px; }
          .clause { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.18); border-radius: 2px; padding: 10px 12px; font-size: 12.5px; color: #bfb3d4; line-height: 1.5; text-align: left; }
          .clause-num { font-family: 'Cinzel', serif; color: #c9a84c; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; display: block; margin-bottom: 3px; }
          .seal-section { display: flex; align-items: center; justify-content: center; gap: 28px; margin: 20px 0; }
          .seal-circle { width: 90px; height: 90px; border-radius: 50%; border: 2px solid #c9a84c; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(201,168,76,0.07); position: relative; flex-shrink: 0; }
          .seal-text { font-family: 'Cinzel', serif; font-size: 7px; color: #c9a84c; text-align: center; letter-spacing: 0.1em; line-height: 1.4; }
          .seal-icon { font-size: 26px; margin-bottom: 2px; filter: sepia(1) saturate(2) hue-rotate(15deg); }
          .signatures { flex: 1; display: flex; flex-direction: column; gap: 16px; }
          .sig-block { text-align: center; }
          .sig-line { height: 1px; background: rgba(201,168,76,0.4); width: 160px; margin: 0 auto 4px; }
          .sig-title { font-family: 'Cinzel', serif; font-size: 7.5px; color: #c9a84c; letter-spacing: 0.12em; text-transform: uppercase; }
          .sig-name { font-size: 11px; color: #9a8bc0; font-style: italic; }
          .cert-number { position: absolute; bottom: 24px; right: 56px; font-family: 'Cinzel', serif; font-size: 7.5px; color: rgba(201,168,76,0.4); letter-spacing: 0.15em; }
          .validity { font-family: 'Cinzel', serif; font-size: 8px; color: rgba(201,168,76,0.5); text-align: center; letter-spacing: 0.2em; margin-top: 14px; text-transform: uppercase; }
        `}</style>

        {/* PAGE 1: CERTIFICATE */}
        <div id="cert-p1" className="cert-wrap">
          <svg className="stars-bg" viewBox="0 0 680 900" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="80" r="1" fill="#c9a84c" opacity="0.3"/><circle cx="180" cy="40" r="0.8" fill="#fff" opacity="0.25"/><circle cx="320" cy="65" r="1.2" fill="#c9a84c" opacity="0.2"/><circle cx="480" cy="30" r="0.9" fill="#fff" opacity="0.3"/><circle cx="600" cy="90" r="1" fill="#c9a84c" opacity="0.25"/><circle cx="640" cy="45" r="0.7" fill="#fff" opacity="0.2"/><circle cx="30" cy="200" r="0.8" fill="#c9a84c" opacity="0.2"/><circle cx="650" cy="180" r="1" fill="#fff" opacity="0.25"/><circle cx="100" cy="820" r="0.9" fill="#c9a84c" opacity="0.2"/><circle cx="560" cy="840" r="1.1" fill="#fff" opacity="0.2"/><circle cx="350" cy="860" r="0.8" fill="#c9a84c" opacity="0.15"/>
          </svg>
          <svg className="corner c-tl" viewBox="0 0 60 60" fill="none"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="1.5"/><path d="M2 14 L14 2" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5"/><circle cx="2" cy="2" r="2.5" fill="#c9a84c" opacity="0.8"/></svg>
          <svg className="corner c-tr" viewBox="0 0 60 60" fill="none"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="1.5"/><path d="M2 14 L14 2" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5"/><circle cx="2" cy="2" r="2.5" fill="#c9a84c" opacity="0.8"/></svg>
          <svg className="corner c-bl" viewBox="0 0 60 60" fill="none"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="1.5"/><path d="M2 14 L14 2" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5"/><circle cx="2" cy="2" r="2.5" fill="#c9a84c" opacity="0.8"/></svg>
          <svg className="corner c-br" viewBox="0 0 60 60" fill="none"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="1.5"/><path d="M2 14 L14 2" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5"/><circle cx="2" cy="2" r="2.5" fill="#c9a84c" opacity="0.8"/></svg>
          <div className="inner-border"></div>
          <div className="ministry-label">Ministerul Protecției Magice · Regatul Viselor Liniștite</div>
          <div className="title-main">CERTIFICAT OFICIAL<br/>DE PROTECȚIE MAGICĂ</div>
          <div className="title-sub">împotriva Monștrilor, Umbrelor și Ființelor Nedorite</div>
          <div className="divider"><div className="div-line"></div><span className="div-star">✦</span><span className="div-star">✦</span><span className="div-star">✦</span><div className="div-line"></div></div>
          <div className="beneficiary-block">
            <span className="beneficiary-label">Micul / Mica Erou / Eroină</span>
            <div className="beneficiary-name">{name || "EROUL NOSTRU"}</div>
          </div>
          <p className="body-text">
            Prin autoritatea conferită de <em>Ordinul Dragonului Somnoros</em> și cu binecuvântarea
            <em>Zânei Luminilor de Noapte</em>, camera acestui copil este
            protejată de un <em>scut invizibil</em> țesut din <em>praf de stele</em>,
            lumină de lună plină și <em>râsete de spiriduși veseli</em>.
            Nicio ființă cu intenții răutăcioase nu poate pătrunde
            dincolo de pragul acestei camere sfinte.
            <em>Acest certificat este valabil la nesfârșit.</em>
          </p>
          <div className="divider"><div className="div-line"></div><span className="div-star">✦</span><div className="div-line"></div></div>
          <div className="clauses-title">Clauze Oficiale Antimonstru · Articole de Lege Magică</div>
          <div className="clauses-grid">
            <div className="clause"><span className="clause-num">Art. I</span>Monștrilor cu picioare mirositoare le este strict interzis accesul sub pat, în dulap și în spatele ușii.</div>
            <div className="clause"><span className="clause-num">Art. II</span>Nicio umbră nu are dreptul să se miște, să crească sau să facă grimase fără permisiune scrisă.</div>
            <div className="clause"><span className="clause-num">Art. III</span>Zgomotele misterioase din noapte sunt obligate să se identifice; dacă nu o fac, se transformă automat în pisici adormite.</div>
            <div className="clause"><span className="clause-num">Art. IV</span>Orice monstru care încearcă să ignore acest certificat va fi transformat în nori de vată roz și dus departe de vânt.</div>
          </div>
          <div className="seal-section">
            <div className="signatures"><div className="sig-block"><div className="sig-line"></div><div className="sig-name">Mag. Umberto din Tărâmul de Sus</div><div className="sig-title">Comandantul Gardienilor</div></div></div>
            <div className="seal-circle"><div className="seal-icon">🐉</div><div className="seal-text">SIGILIUL<br/>DRAGONULUI<br/>SOMNOROS<br/>· AUTENTIC ·</div></div>
            <div className="signatures"><div className="sig-block"><div className="sig-line"></div><div className="sig-name">Luminia din Crăpătura Stelelor</div><div className="sig-title">Zâna Luminilor</div></div></div>
          </div>
          <div className="validity">Valabil pe toată durata copilăriei · Se reînnoiește automat în fiecare noapte la miezul nopții</div>
          <div className="cert-number">Nr. #0001 · Seria SOMN-LINIȘTIT</div>
        </div>

        {/* PAGE 2: RECIPE */}
        <div id="cert-p2" className="cert-wrap">
          <div className="inner-border"></div>
          <div className="ministry-label">LABORATORUL ALCHIMIC AL MINISTERULUI</div>
          <div className="title-main" style={{fontSize: '28px'}}>REȚETĂ SECRETĂ</div>
          <div className="title-sub">A SPRAY-ULUI ANTI-UMBRE ALE NOPȚII</div>
          <div className="divider"><div className="div-line"></div>✦✦✦<div className="div-line"></div></div>
          <div style={{textAlign: 'left', padding: '0 40px', marginTop: '30px'}}>
            <h4 style={{fontFamily: 'Cinzel', color: '#c9a84c', fontSize: '16px', marginBottom: '15px'}}>INGREDIENTE MAGICE</h4>
            <div style={{fontSize: '14.5px', color: '#d4c5e8', lineHeight: '2.5'}}>
              🧪 1. Un flacon cu apă curată (adunată la lună plină)<br/>
              🍋 2. Trei picuri de Esență de Curaj (suc de lămâie)<br/>
              ✨ 3. Un strop de Sclipici Invizibil (ochiul inimii)
            </div>
            <h4 style={{fontFamily: 'Cinzel', color: '#c9a84c', fontSize: '16px', margin: '40px 0 15px'}}>MOD DE PREPARARE</h4>
            <div style={{fontSize: '14.5px', color: '#d4c5e8', lineHeight: '2'}}>
              1. Toarnă apa în flacon gândind curajos.<br/>
              2. Adaugă esența și agită de 7 ori.<br/>
              3. Suflă deasupra pentru activare.<br/>
              4. Pulverizează sub pat înainte de culcare.
            </div>
          </div>
          <div style={{marginTop: 'auto', background: 'rgba(201,168,76,0.1)', padding: '25px', borderRadius: '12px', border: '1px dashed #c9a84c', textAlign: 'center', marginBottom: '40px'}}>
            <div style={{fontFamily: 'Cinzel', fontSize: '10px', color: '#c9a84c', marginBottom: '12px'}}>DESCÂNTEC DE ACTIVARE</div>
            <div style={{fontStyle: 'italic', fontSize: '18px', color: '#f4e4a0'}}>"Umbre mici și umbre mari, plecați voi în alte zări! Cu curaj și sclipici bun, camera mea e de minune!"</div>
          </div>
        </div>

        {/* PAGE 3: LABELS */}
        <div id="cert-p3" className="cert-wrap">
          <div className="ministry-label" style={{marginTop: '40px'}}>DECUPAȚI ȘI LIPIȚI PE FLACON</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '60px', marginTop: '80px'}}>
            <div style={{width: '380px', height: '220px', border: '3px dashed #c9a84c', padding: '8px', borderRadius: '20px'}}>
              <div style={{width: '100%', height: '100%', background: 'linear-gradient(160deg, #1a0a2e, #0d1a3a)', border: '2px solid #c9a84c', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                <div style={{fontFamily: 'Cinzel', fontSize: '10px', letterSpacing: '3px'}}>SPRAY MAGIC</div>
                <div style={{fontFamily: 'Cinzel', fontSize: '28px', margin: '12px 0'}}>ANTI-UMBRE</div>
                <div style={{fontSize: '9px', color: '#c9a84c'}}>FORMULA SECRETĂ NR. SPRAY-007</div>
                <div className="seal-circle" style={{marginTop: '15px', scale: '0.8'}}><div className="seal-icon">🐉</div></div>
              </div>
            </div>
            <div style={{display: 'flex', gap: '40px', alignItems: 'center'}}>
               <div style={{width: '150px', height: '150px', border: '3px dashed #c9a84c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: '130px', height: '130px', background: '#1a0a2e', border: '2px solid #c9a84c', borderRadius: '50%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <div style={{fontSize: '8px'}}>SIGILIUL</div>
                    <div style={{fontSize: '24px', margin: '5px 0'}}>🐉</div>
                    <div style={{fontSize: '8px'}}>DRAGONULUI</div>
                  </div>
               </div>
               <div style={{width: '240px', height: '150px', border: '3px dashed #c9a84c', padding: '15px', borderRadius: '15px', textAlign: 'center', background: '#1a0a2e', color: '#d4c5e8', fontSize: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <b style={{color: '#c9a84c', fontSize: '13px', marginBottom: '10px'}}>INSTRUCȚIUNI:</b>
                  <div>1. Agită de 7 ori<br/>2. Rostește descântecul<br/>3. Pulverizează ✨</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-brand-cream max-w-4xl w-full h-full max-h-[90vh] rounded-[3rem] border-4 border-brand-gold relative flex flex-col overflow-hidden shadow-2xl">
              <button onClick={() => setShowResult(false)} className="absolute top-6 right-6 text-brand-navy/40 hover:text-brand-gold font-black text-xl z-20">✕</button>
              <div className="flex-1 overflow-y-auto p-12 text-center flex flex-col items-center">
                <h3 className="font-cinzel font-bold text-3xl text-brand-navy uppercase tracking-widest mb-6">Kit Activat! ✨</h3>
                <div className="bg-brand-navy/5 p-8 rounded-[2rem] border-2 border-dashed border-brand-gold/30 max-w-md">
                   <p className="text-brand-navy font-bold italic">Am pregătit Kitul complet de 3 pagini pentru {name}. Îl poți descărca acum.</p>
                </div>
              </div>
              <div className="p-8 bg-white/50 border-t border-brand-navy/5">
                <button onClick={downloadKit} className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-2xl border-b-8 border-brand-gold hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
                   DESCARCĂ KITUL COMPLET (3 PAGINI)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MonsterKit;
