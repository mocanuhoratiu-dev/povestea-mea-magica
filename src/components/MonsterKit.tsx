'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Ghost, Sparkles, Wand2, Download, CheckCircle2 } from 'lucide-react';
import MagicalLoader from './MagicalLoader';

const MonsterKit = () => {
  const [name, setName] = useState('');
  const [monsterType, setMonsterType] = useState('umbrele noptii');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [kitText, setKitText] = useState('');

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
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monster',
          name,
          monster: monsterType
        }),
      });

      const data = await response.json();
      if (data.success) {
        setKitText(data.data.text);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error generating kit:', error);
    } finally {
      setIsLoading(false);
    }
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
            scale: 2, 
            useCORS: true, 
            backgroundColor: "#0e0f23",
            windowWidth: 595,
            windowHeight: 842
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          el.style.display = "none";
          if (!isLast) pdf.addPage();
      };

      // Capturăm cele 3 pagini
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
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 animate-bounce-slow">
            <Ghost size={120} className="text-brand-gold" />
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse">
            <ShieldCheck size={150} className="text-brand-gold" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-block p-4 bg-brand-gold/10 rounded-full mb-6"
          >
            <ShieldCheck className="text-brand-gold w-12 h-12" />
          </motion.div>
          <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-brand-cream mb-6 tracking-tighter">
            Kit Anti-Monștri 🛡️
          </h2>
          <p className="text-brand-cream/70 text-lg md:text-xl font-medium italic max-w-2xl mx-auto">
            "Pentru că fiecare mic erou merită un somn liniștit, am creat cel mai puternic scut magic din lume."
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-brand-cream rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-4 border-brand-gold/20"
        >
          <form onSubmit={generateKit} className="space-y-8">
            <div className="space-y-4">
              <label className="block font-cinzel font-bold text-brand-navy text-xl">
                Cui îi aparține curajul?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Numele micuțului erou..."
                className="w-full bg-brand-navy/5 border-2 border-brand-navy/10 rounded-2xl px-6 py-4 text-brand-navy font-bold text-lg focus:border-brand-gold outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="block font-cinzel font-bold text-brand-navy text-xl">
                Ce monstru trebuie să plece?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {monsters.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMonsterType(m.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      monsterType === m.id
                        ? 'border-brand-gold bg-brand-gold/10 scale-105'
                        : 'border-brand-navy/10 hover:border-brand-navy/30'
                    }`}
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-xs font-black text-brand-navy uppercase text-center">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name || isLoading}
              className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border-b-8 border-brand-gold"
            >
              <Wand2 className="w-8 h-8" />
              GENEREAZĂ SCUTUL MAGIC ✨
            </button>
          </form>
        </motion.div>
      </div>

      <MagicalLoader isVisible={isLoading} />

      {/* HIDDEN TEMPLATES FOR EXPORT (3 PAGES) */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <style>{`
              .cert-page { width: 595px; height: 842px; background: #0e0f23; color: #f4e4a0; font-family: 'Crimson Pro', serif; padding: 40px; box-sizing: border-box; position: relative; overflow: hidden; }
              .cert-border { position: absolute; inset: 10px; border: 2px solid #c9a84c; }
              .cert-inner-border { position: absolute; inset: 18px; border: 1px solid rgba(201,168,76,0.3); }
              .cert-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; }
              .cert-header { font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 3px; color: #c9a84c; margin-top: 20px; }
              .cert-title { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700; margin: 20px 0 5px; color: #f4e4a0; }
              .cert-subtitle { font-family: 'Cinzel', serif; font-size: 14px; color: #c9a84c; letter-spacing: 2px; }
              .cert-divider { width: 300px; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); margin: 20px 0; }
              .cert-name-box { background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.2); padding: 20px 40px; margin: 20px 0; width: 80%; }
              .cert-name { font-family: 'Cinzel', serif; font-size: 32px; font-style: italic; border-bottom: 1px solid #c9a84c; display: inline-block; padding: 0 20px; color: #f4e4a0; }
              .cert-body { font-size: 15px; line-height: 1.6; color: #d4c5e8; font-style: italic; max-width: 90%; margin: 20px 0; }
              .cert-clauses { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; margin-top: 20px; text-align: left; }
              .cert-clause { background: rgba(201,168,76,0.04); border: 1px solid rgba(201,168,76,0.15); padding: 10px; font-size: 11px; color: #bfb3d4; }
              .cert-clause b { color: #c9a84c; font-family: 'Cinzel', serif; font-size: 9px; display: block; margin-bottom: 3px; }
              .cert-seal-area { display: flex; justify-content: center; align-items: center; gap: 40px; margin-top: auto; padding-bottom: 30px; width: 100%; }
              .cert-seal { width: 80px; height: 80px; border: 2px solid #c9a84c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; background: rgba(201,168,76,0.05); }
              .cert-sig { border-top: 1px solid rgba(201,168,76,0.4); width: 120px; font-size: 8px; padding-top: 5px; color: #9a8bc0; text-align: center; }
              .cert-sig-title { font-family: 'Cinzel', serif; font-size: 6px; color: #c9a84c; text-transform: uppercase; margin-top: 2px; }
          `}</style>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Pro:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />

          {/* PAGE 1: CERTIFICATE */}
          <div id="cert-p1" className="cert-page">
              <div className="cert-border"></div><div className="cert-inner-border"></div>
              <div className="cert-content">
                  <div className="cert-header">MINISTERUL PROTECȚIEI MAGICE · REGATUL VISELOR LINIȘTITE</div>
                  <div className="cert-title">CERTIFICAT OFICIAL</div>
                  <div className="cert-subtitle">DE PROTECȚIE MAGICĂ</div>
                  <div className="cert-divider"></div>
                  
                  <div style={{margin: '40px 0'}}>
                      <div style={{fontSize: '10px', color: '#c9a84c', marginBottom: '15px', fontFamily: 'Cinzel', letterSpacing: '2px'}}>MICUL / MICA EROU / EROINICĂ</div>
                      <div style={{fontFamily: 'Cinzel', fontSize: '36px', borderBottom: '2px solid #c9a84c', display: 'inline-block', padding: '0 60px', color: '#f4e4a0', fontStyle: 'italic'}}>{name || "EROUL NOSTRU"}</div>
                  </div>

                  <div className="cert-body">
                      Prin autoritatea conferită de <b>Ordinul Dragonului Somnoros</b> și cu binecuvântarea <b>Zânei Luminilor de Noapte</b>, camera acestui copil este protejată de un <b>scut invizibil</b> țesut din praf de stele, lumină de lună plină și râsete de spiriduși veseli.
                  </div>
                  <div className="cert-clauses">
                      <div className="cert-clause"><b>Art. I</b> Monștrilor le este strict interzis accesul sub pat sau în dulap.</div>
                      <div className="cert-clause"><b>Art. II</b> Umbrele nu au dreptul să facă grimase fără permisiune scrisă.</div>
                      <div className="cert-clause"><b>Art. III</b> Zgomotele nopții se transformă automat în pisici adormite.</div>
                      <div className="cert-clause"><b>Art. IV</b> Orice monstru recalcitrant va fi transformat în nori de vată roz.</div>
                  </div>
                  <div className="cert-seal-area">
                      <div className="cert-sig">Mag. Umberto<br/><span className="cert-sig-title">Comandantul Gardienilor</span></div>
                      
                      {/* SVG DRAGON SEAL REPLICATED FROM PYTHON */}
                      <div className="cert-seal">
                        <svg width="60" height="60" viewBox="0 0 100 100">
                            <ellipse cx="41" cy="40" rx="18" ry="9" fill="#c9a84c" opacity="0.8" transform="rotate(90 41 40)" />
                            <ellipse cx="50" cy="50" rx="24" ry="12" fill="#c9a84c" opacity="0.8" />
                            <path d="M62 50 Q76 46 80 32 T72 26" stroke="#c9a84c" strokeWidth="4" fill="none" opacity="0.8" />
                            <circle cx="53" cy="42" r="3" fill="#0e0f23" />
                        </svg>
                      </div>

                      <div className="cert-sig">Luminia din Stele<br/><span className="cert-sig-title">Zâna Luminilor</span></div>
                  </div>
              </div>
          </div>

          {/* PAGE 2: RECIPE */}
          <div id="cert-p2" className="cert-page">
              <div className="cert-border"></div><div className="cert-inner-border"></div>
              <div className="cert-content">
                  <div className="cert-header">LABORATORUL ALCHIMIC AL MINISTERULUI</div>
                  <div className="cert-title">REȚETĂ SECRETĂ</div>
                  <div className="cert-subtitle">A SPRAY-ULUI ANTI-UMBRE ALE NOPȚII</div>
                  <div className="cert-divider"></div>
                  <div style={{textAlign: 'left', width: '100%', padding: '0 40px'}}>
                      <h4 style={{fontFamily: 'Cinzel', color: '#c9a84c', fontSize: '14px', marginBottom: '20px'}}>INGREDIENTE MAGICE</h4>
                      <ul style={{listStyle: 'none', padding: 0, color: '#d4c5e8'}}>
                          <li style={{marginBottom: '20px'}}>🧪 <b>1. Un flacon cu apă curată</b> (adunată pe timp de lună plină)</li>
                          <li style={{marginBottom: '20px'}}>🍋 <b>2. Trei picuri de Esență de Curaj</b> (suc de lămâie proaspăt)</li>
                          <li style={{marginBottom: '20px'}}>✨ <b>3. Un strop de Sclipici Invizibil</b> (se vede doar cu ochii inimii)</li>
                      </ul>
                      <h4 style={{fontFamily: 'Cinzel', color: '#c9a84c', fontSize: '14px', marginTop: '40px', marginBottom: '20px'}}>MOD DE PREPARARE</h4>
                      <div style={{fontSize: '14px', lineHeight: '1.8', color: '#d4c5e8'}}>
                          1. Toarnă apa în flacon cu grijă, gândind la lucruri curajoase.<br/>
                          2. Adaugă cei trei picuri de esență și agită de 7 ori (numărul magic).<br/>
                          3. Suflă ușor deasupra flaconului pentru a activa sclipiciul.<br/>
                          4. Pulverizează sub pat și în dulap înainte de culcare.
                      </div>
                  </div>
                  <div style={{marginTop: 'auto', background: 'rgba(201,168,76,0.08)', padding: '30px', borderRadius: '15px', border: '1px dashed #c9a84c', width: '85%', marginBottom: '40px'}}>
                      <div style={{fontFamily: 'Cinzel', fontSize: '10px', marginBottom: '15px', color: '#c9a84c'}}>DESCANTECUL DE ACTIVARE</div>
                      <div style={{fontStyle: 'italic', fontSize: '18px', color: '#f4e4a0'}}>"Umbre mici și umbre mari, plecați voi în alte zări! Cu curaj și sclipici bun, camera mea e de minune!"</div>
                  </div>
              </div>
          </div>

          {/* PAGE 3: LABELS */}
          <div id="cert-p3" className="cert-page">
              <div className="cert-border"></div>
              <div className="cert-content">
                  <div className="cert-header" style={{marginTop: '60px'}}>DECUPAȚI ȘI LIPIȚI PE FLACON</div>
                  <div style={{height: '60px'}}></div>
                  
                  {/* Main Label */}
                  <div style={{width: '320px', height: '200px', border: '2px dashed #c9a84c', padding: '10px', borderRadius: '20px'}}>
                      <div style={{width: '100%', height: '100%', background: 'linear-gradient(160deg, #1a0a2e, #0d1a3a)', border: '2px solid #c9a84c', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                          <div style={{fontSize: '9px', letterSpacing: '3px', color: '#c9a84c'}}>SPRAY MAGIC</div>
                          <div style={{fontFamily: 'Cinzel', fontSize: '24px', margin: '10px 0', color: '#f4e4a0'}}>ANTI-UMBRE</div>
                          <div style={{fontSize: '8px', color: '#c9a84c'}}>FORMULA SECRETĂ NR. SPRAY-007</div>
                          
                          <div style={{marginTop: '15px'}}>
                            <svg width="40" height="40" viewBox="0 0 100 100">
                                <ellipse cx="41" cy="40" rx="18" ry="9" fill="#c9a84c" opacity="0.8" transform="rotate(90 41 40)" />
                                <ellipse cx="50" cy="50" rx="24" ry="12" fill="#c9a84c" opacity="0.8" />
                                <path d="M62 50 Q76 46 80 32 T72 26" stroke="#c9a84c" strokeWidth="4" fill="none" opacity="0.8" />
                                <circle cx="53" cy="42" r="3" fill="#0e0f23" />
                            </svg>
                          </div>
                      </div>
                  </div>

                  <div style={{height: '80px'}}></div>

                  <div style={{display: 'flex', gap: '50px'}}>
                      {/* Round Seal */}
                      <div style={{width: '140px', height: '140px', border: '2px dashed #c9a84c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <div style={{width: '120px', height: '120px', background: '#1a0a2e', border: '2px solid #c9a84c', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                              <div style={{fontSize: '8px', color: '#c9a84c'}}>SIGILIUL</div>
                              <div style={{margin: '5px 0'}}>
                                <svg width="40" height="40" viewBox="0 0 100 100">
                                    <ellipse cx="41" cy="40" rx="18" ry="9" fill="#c9a84c" opacity="0.8" transform="rotate(90 41 40)" />
                                    <ellipse cx="50" cy="50" rx="24" ry="12" fill="#c9a84c" opacity="0.8" />
                                    <path d="M62 50 Q76 46 80 32 T72 26" stroke="#c9a84c" strokeWidth="4" fill="none" opacity="0.8" />
                                    <circle cx="53" cy="42" r="3" fill="#0e0f23" />
                                </svg>
                              </div>
                              <div style={{fontSize: '8px', color: '#c9a84c'}}>DRAGONULUI</div>
                          </div>
                      </div>

                      {/* Instructions Label */}
                      <div style={{width: '200px', height: '140px', border: '2px dashed #c9a84c', padding: '10px', borderRadius: '15px'}}>
                          <div style={{width: '100%', height: '100%', background: '#1a0a2e', border: '1px solid #c9a84c', borderRadius: '10px', padding: '15px', fontSize: '10px', textAlign: 'center', color: '#d4c5e8', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                              <b style={{color: '#c9a84c', fontSize: '11px', marginBottom: '10px'}}>INSTRUCȚIUNI:</b>
                              <div>1. Agită de 7 ori</div>
                              <div>2. Rostește descântecul</div>
                              <div>3. Pulverizează sub pat</div>
                              <div>4. Dormi liniștit/ă! ✨</div>
                          </div>
                      </div>
                  </div>
                  <div style={{marginTop: 'auto', fontSize: '9px', opacity: 0.5, paddingBottom: '30px', color: '#c9a84c'}}>Ministerul Protecției Magice · 2026</div>
              </div>
          </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-2 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-cream max-w-4xl w-full h-full max-h-[95vh] rounded-[3rem] border-4 border-brand-gold/30 relative shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setShowResult(false)}
                className="absolute top-6 right-6 text-brand-navy/40 hover:text-brand-gold font-black text-xl z-20 bg-white/80 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all"
              >
                ✕
              </button>
  
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar flex flex-col items-center">
                <div className="text-center mb-10">
                  <div className="flex justify-center gap-2 mb-4">
                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                    <h3 className="font-cinzel font-bold text-3xl text-brand-navy uppercase tracking-tighter">Kit Activat! ✨</h3>
                  </div>
                  <p className="text-brand-navy/60 font-medium italic">Am pregătit pachetul tău magic de 3 pagini pentru protecție totală.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                    <div className="bg-white/50 p-6 rounded-3xl border-2 border-brand-gold/10 text-center flex flex-col items-center">
                        <ShieldCheck className="text-brand-gold mb-3" />
                        <h4 className="font-bold text-brand-navy text-sm uppercase">1. Certificat</h4>
                        <p className="text-xs text-brand-navy/60 mt-2">Documentul oficial de curaj.</p>
                    </div>
                    <div className="bg-white/50 p-6 rounded-3xl border-2 border-brand-gold/10 text-center flex flex-col items-center">
                        <Sparkles className="text-brand-gold mb-3" />
                        <h4 className="font-bold text-brand-navy text-sm uppercase">2. Rețetă</h4>
                        <p className="text-xs text-brand-navy/60 mt-2">Formula secretă a spray-ului.</p>
                    </div>
                    <div className="bg-white/50 p-6 rounded-3xl border-2 border-brand-gold/10 text-center flex flex-col items-center">
                        <Download className="text-brand-gold mb-3" />
                        <h4 className="font-bold text-brand-navy text-sm uppercase">3. Etichete</h4>
                        <p className="text-xs text-brand-navy/60 mt-2">De decupat și lipit pe flacon.</p>
                    </div>
                </div>

                <div className="bg-brand-navy/5 p-8 rounded-[2rem] border-2 border-dashed border-brand-gold/30 max-w-2xl w-full">
                    <p className="text-brand-navy text-center font-bold italic leading-relaxed">
                        "Acest kit a fost sigilat cu ceară de dragon somnoros și este acum gata să aducă liniștea în camera lui {name}."
                    </p>
                </div>
              </div>
  
              <div className="p-8 bg-white/50 border-t border-brand-navy/5 backdrop-blur-sm">
                <button 
                  onClick={downloadKit}
                  className="w-full bg-brand-navy text-brand-cream py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-b-8 border-brand-gold flex items-center justify-center gap-4"
                >
                  <Download className="w-8 h-8" />
                  DESCARCĂ KIT-UL COMPLET (3 PAGINI) 🛡️
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
