"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Ghost, Sparkles, Star } from "lucide-react";
import MagicalLoader from "./MagicalLoader";

export default function MonsterKit() {
  const [name, setName] = useState("");
  const [monsterType, setMonsterType] = useState("monștrii de sub pat");
  const [isLoading, setIsLoading] = useState(false);
  const [kitText, setKitText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    if (!name) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ type: "monster", name, monster: monsterType }),
      });

      const result = await response.json();
      
      if (result.success) {
        const text = result.data?.text || result.data?.choices?.[0]?.message?.content || "Scutul a fost activat!";
        
        const cleanMonster = (monsterType || "monster").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, '');
        const cleanName = (name || "Protector").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, '');
        const artisticPrompt = `official magic protection certificate shield, medieval fantasy style, against a ${cleanMonster}, child named ${cleanName}, golden textures, 8k`;
        const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(artisticPrompt)}?nologo=true&width=800&height=800&seed=${Date.now()}`;
        
        setKitText(text);
        setImageUrl(img);
        setShowResult(true);
      } else {
        throw new Error("Eroare API");
      }
    } catch (err) {
      alert("⚠️ Scutul magic a întâmpinat o eroare.");
    } finally {
      setIsLoading(false);
    }
  };

    const downloadKit = () => {
      const element = document.getElementById("premium-certificate-template");
      if (!element) return;

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

        // Pregătim elementul pentru captură
        element.style.display = "block";
        element.style.position = "absolute";
        element.style.left = "-10000px";
        element.style.top = "0";

        // Așteptăm un pic să se randeze fonturile
        setTimeout(async () => {
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              windowWidth: 700,
              windowHeight: 1000
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificat_Magic_${name}.pdf`);

            element.style.display = "none";
        }, 500); // 500ms delay pentru fonturi
      };

      Promise.all([
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
      ]).then(generate);
    };

    return (
      <section id="monster-away" className="py-20 md:py-32 bg-brand-navy relative overflow-hidden px-4">
        <MagicalLoader isVisible={isLoading} />
  
        {/* Hidden Premium Template for Export */}
        <div id="premium-certificate-template" style={{ display: 'none', width: '680px', background: 'white' }}>
          <style>{`
            .cert-wrap {
                width: 680px;
                height: 900px;
                background: linear-gradient(160deg, #1a0a2e 0%, #0d1a3a 50%, #1a0a2e 100%);
                border: 4px solid #c9a84c;
                padding: 60px;
                position: relative;
                font-family: 'Crimson Pro', serif;
                box-sizing: border-box;
                color: #f4e4a0;
            }
            .stars-bg { position: absolute; inset: 0; opacity: 0.3; }
            .corner { position: absolute; width: 80px; height: 80px; }
            .c-tl { top: 10px; left: 10px; }
            .c-tr { top: 10px; right: 10px; transform: scaleX(-1); }
            .c-bl { bottom: 10px; left: 10px; transform: scaleY(-1); }
            .c-br { bottom: 10px; right: 10px; transform: rotate(180deg); }
            .inner-border { position: absolute; inset: 20px; border: 1px solid rgba(201,168,76,0.3); }
            .ministry-label { font-family: 'Cinzel', serif; font-size: 10px; text-align: center; letter-spacing: 3px; color: #c9a84c; margin-bottom: 20px; }
            .title-main { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; text-align: center; color: #f4e4a0; margin-bottom: 10px; }
            .title-sub { font-family: 'Cinzel', serif; font-size: 14px; text-align: center; color: #c9a84c; letter-spacing: 2px; }
            .divider { display: flex; items-center: center; justify-content: center; gap: 15px; margin: 30px 0; }
            .div-line { width: 150px; height: 1px; background: #c9a84c; }
            .beneficiary-block { text-align: center; margin: 40px 0; }
            .beneficiary-label { font-family: 'Cinzel', serif; font-size: 12px; color: #c9a84c; display: block; margin-bottom: 10px; }
            .beneficiary-name { font-family: 'Cinzel', serif; font-size: 36px; border-bottom: 2px solid #c9a84c; display: inline-block; padding: 0 40px 5px; }
            .body-text { font-size: 18px; line-height: 1.6; text-align: center; margin: 40px 0; font-style: italic; color: #d4c5e8; }
            .clauses-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
            .clause { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.2); padding: 15px; font-size: 13px; }
            .clause-num { font-family: 'Cinzel', serif; color: #c9a84c; display: block; margin-bottom: 5px; }
            .seal-section { display: flex; align-items: center; justify-content: center; gap: 40px; margin-top: 50px; }
            .seal-circle { width: 100px; height: 100px; border-radius: 50%; border: 2px solid #c9a84c; display: flex; align-items: center; justify-content: center; font-size: 40px; background: rgba(201,168,76,0.1); }
            .sig-line { width: 150px; height: 1px; background: #c9a84c; margin: 10px auto; }
            .sig-title { font-family: 'Cinzel', serif; font-size: 8px; color: #c9a84c; }
          `}</style>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Pro:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
          
          <div className="cert-wrap">
            <svg className="corner c-tl" viewBox="0 0 60 60"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="2" fill="none"/></svg>
            <svg className="corner c-tr" viewBox="0 0 60 60"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="2" fill="none"/></svg>
            <svg className="corner c-bl" viewBox="0 0 60 60"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="2" fill="none"/></svg>
            <svg className="corner c-br" viewBox="0 0 60 60"><path d="M2 30 L2 2 L30 2" stroke="#c9a84c" strokeWidth="2" fill="none"/></svg>
            <div className="inner-border"></div>

            <div className="ministry-label">Ministerul Protectiei Magice · Regatul Viselor Linistite</div>
            <div className="title-main">CERTIFICAT OFICIAL DE PROTECTIE MAGICA</div>
            <div className="title-sub">impotriva Monstrilor si Umbrelor Nedorite</div>

            <div className="divider"><div className="div-line"></div>✦✦✦<div className="div-line"></div></div>

            <div className="beneficiary-block">
              <span className="beneficiary-label">Micul / Mica Erou / Eroinica</span>
              <div className="beneficiary-name">{name || "EROUL NOSTRU"}</div>
            </div>

            <p className="body-text">
              Camera acestui copil este protejata de un scut invizibil tesut din praf de stele,
              lumina de luna plina si rasele de spiridusi veseli.
            </p>

            <div className="clauses-grid">
              <div className="clause"><span className="clause-num">Art. I</span>Monstrilor le este strict interzis accesul sub pat.</div>
              <div className="clause"><span className="clause-num">Art. II</span>Zgomotele misterioase se transforma in pisici adormite.</div>
            </div>

            <div className="seal-section">
              <div className="sig-block"><div className="sig-line"></div><div className="sig-title">Comandantul Gardienilor</div></div>
              <div className="seal-circle">🐉</div>
              <div className="sig-block"><div className="sig-line"></div><div className="sig-title">Zana Luminilor</div></div>
            </div>
          </div>
        </div>

        {/* Result Modal */}
        {showResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-2 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-cream max-w-2xl w-full h-full max-h-[90vh] md:max-h-[85vh] rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-brand-gold/30 relative shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setShowResult(false)}
                className="absolute top-4 right-4 text-brand-navy/40 hover:text-brand-gold font-black text-xl z-20 bg-white/80 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all"
              >
                ✕
              </button>
  
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar text-brand-navy">
                <div className="text-center mb-8 pt-4">
                  <ShieldCheck className="text-brand-gold w-10 h-10 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-nunito font-black text-2xl md:text-3xl text-brand-navy px-4 uppercase tracking-tighter">Certificat Activat! ✨</h3>
                </div>
  
                <div className="bg-white/50 p-6 rounded-3xl border-2 border-brand-gold/20 mb-8">
                    <p className="text-sm md:text-base font-medium italic text-brand-navy/70 leading-relaxed text-center">
                        "Documentul a fost înregistrat în Ministerul Protecției Magice. Acum poți descărca varianta oficială pentru a o printa și afișa în cameră."
                    </p>
                </div>
  
                <div className="prose prose-brand max-w-none text-brand-navy/80 font-bold whitespace-pre-wrap leading-relaxed text-sm italic border-4 border-dashed border-brand-gold/10 p-6 rounded-2xl">
                  {kitText}
                </div>
              </div>
  
              <div className="p-6 md:p-8 bg-white/50 border-t border-brand-navy/5 backdrop-blur-sm">
                <button 
                  onClick={downloadKit}
                  className="w-full bg-brand-navy text-brand-cream py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-brand-gold"
                >
                  Descarcă Certificatul Premium 🛡️
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      {/* Floating Interactive Ghosts */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 4 + Math.random() * 2, repeat: Infinity }}
            className="absolute text-brand-gold/20"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
            }}
          >
            <Ghost size={30 + Math.random() * 30} />
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            className="inline-block bg-brand-gold/20 p-6 rounded-full mb-8 relative"
          >
            <div className="absolute inset-0 bg-brand-gold/20 rounded-full animate-ping" />
            <ShieldCheck className="text-brand-gold w-16 h-16 relative z-10" />
          </motion.div>
          <h2 className="font-nunito font-black text-4xl md:text-7xl text-white mb-6 leading-tight">
            Alungă <span className="text-brand-gold italic">Monștrii</span> <br/> pentru Totdeauna! 🛡️
          </h2>
          <p className="text-white/70 text-xl md:text-2xl font-medium max-w-2xl mx-auto">
            Creează un certificat de protecție magică aprobat de Consiliul Magic.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 border-4 border-white/10 shadow-[0_0_50px_rgba(255,215,0,0.1)] relative overflow-hidden"
        >
          {/* Decorative Corner Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-gold/20 rounded-full blur-3xl" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-8 md:space-y-10">
              <div>
                <label className="block text-xs md:text-sm font-black text-brand-gold mb-4 uppercase tracking-[0.3em]">
                  Numele Micuțului Erou
                </label>
                <input
                  type="text"
                  placeholder="Cine are nevoie de curaj?..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-8 py-5 rounded-3xl bg-white/5 border-2 border-white/10 focus:border-brand-gold outline-none transition-all text-white font-bold text-xl placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-brand-gold mb-4 uppercase tracking-[0.3em]">
                  Inamicul Magic 👻
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["Monștrii de sub pat", "Umbrele nopții", "Zgomote ciudate", "Întunericul"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setMonsterType(type)}
                      className={`px-6 py-4 rounded-2xl border-2 transition-all font-bold text-left flex items-center justify-between ${
                        monsterType === type 
                          ? "border-brand-gold bg-brand-gold/20 text-white shadow-lg scale-[1.02]" 
                          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {type}
                      {monsterType === type && <Sparkles size={16} className="text-brand-gold animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-10">
              <div className="bg-brand-gold/5 p-8 rounded-[2.5rem] border-2 border-dashed border-brand-gold/20 relative group">
                <div className="absolute top-4 right-4 text-brand-gold/30">✨</div>
                <p className="text-white/80 text-lg md:text-xl leading-relaxed italic font-medium">
                  "Odată generat, acest scut va fi legat magic de numele {name || 'puiului tău'} și va alunga orice teamă."
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!name}
                className="w-full bg-brand-gold text-brand-navy py-6 md:py-8 rounded-3xl font-black text-2xl md:text-3xl shadow-[0_20px_40px_rgba(255,215,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-4 relative overflow-hidden"
              >
                <span className="relative z-10">Activează Scutul Magic</span>
                <ShieldCheck className="relative z-10 animate-pulse" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
