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
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            const cleanStr = (str: string) => {
              return str
                .replace(/ș/g, "s").replace(/Ș/g, "S")
                .replace(/ț/g, "t").replace(/Ț/g, "T")
                .replace(/ă/g, "a").replace(/Ă/g, "A")
                .replace(/â/g, "a").replace(/Â/g, "A")
                .replace(/î/g, "i").replace(/Î/g, "I");
            };

            // 1. FUNDAL VIBRANT
            doc.setFillColor(255, 105, 245);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // 2. RAMA ALBĂ
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, 'F');

            // 3. MONȘTRI SIMPLIFICAȚI (Fără funcții complexe care pot da eroare)
            const drawMonster = (x: number, y: number, r: number, g: number, b: number, size: number) => {
                doc.setFillColor(r, g, b);
                doc.circle(x, y, size, 'F');
                doc.setFillColor(255, 255, 255);
                doc.circle(x - size/3, y - size/4, size/4, 'F');
                doc.circle(x + size/3, y - size/4, size/4, 'F');
                doc.setFillColor(0, 0, 0);
                doc.circle(x - size/3, y - size/4, size/8, 'F');
                doc.circle(x + size/3, y - size/4, size/8, 'F');
                // Gura - o linie simplă
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(x - size/4, y + size/3, x + size/4, y + size/3);
            };

            drawMonster(25, 25, 0, 220, 150, 10);
            drawMonster(pageWidth-25, 25, 255, 150, 0, 12);
            drawMonster(25, pageHeight-25, 0, 150, 255, 15);
            drawMonster(pageWidth-25, pageHeight-25, 255, 80, 80, 10);

            // 4. TEXT
            doc.setTextColor(180, 70, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.text(cleanStr("BRAVO, EROULE!"), pageWidth/2, 40, { align: "center" });
            
            doc.setFontSize(40);
            doc.setTextColor(255, 80, 150);
            doc.text(cleanStr(name.toUpperCase()), pageWidth/2, 70, { align: "center" });

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(14);
            const bodyY = 100;
            doc.text(cleanStr("VRAJA TA DE PROTECTIE:"), 20, bodyY);
            doc.setFont("helvetica", "normal");
            const splitVraja = doc.splitTextToSize(cleanStr(kitText), 160);
            doc.text(splitVraja, 20, bodyY + 10);

            doc.save(`Certificat_Magic_${name}.pdf`);
        } catch (e) {
            console.error("Eroare PDF:", e);
            alert("🪄 Magia a întâmpinat o mică eroare la desenare. Te rugăm să încerci din nou!");
        }
      };
      document.head.appendChild(script);
    };

    return (
      <section id="monster-away" className="py-20 md:py-32 bg-brand-navy relative overflow-hidden px-4">
        <MagicalLoader isVisible={isLoading} />
  
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
  
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="text-center mb-8 pt-4">
                  <ShieldCheck className="text-brand-gold w-10 h-10 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-nunito font-black text-2xl md:text-3xl text-brand-navy px-4">Kit Protecție {name} 🛡️</h3>
                </div>
  
                {imageUrl && (
                  <div className="mb-8 relative group mx-auto max-w-[500px]">
                    <motion.div 
                      key={`img-monster-${imageUrl}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-brand-navy/10 aspect-square relative"
                    >
                      <img 
                        key={imageUrl}
                        src={imageUrl} 
                        alt="Vizual Magic" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block"
                      />
                    </motion.div>
                  </div>
                )}
  
                <div className="prose prose-brand max-w-none text-brand-navy/80 font-bold whitespace-pre-wrap leading-relaxed text-base md:text-lg italic border-4 border-dashed border-brand-gold/20 p-6 md:p-8 rounded-2xl md:rounded-3xl pb-10">
                  {kitText}
                </div>
              </div>
  
              <div className="p-6 md:p-8 bg-white/50 border-t border-brand-navy/5 backdrop-blur-sm">
                <p className="text-center text-[10px] md:text-xs font-bold text-brand-gold uppercase tracking-widest mb-4">
                  Document Oficial Magie
                </p>
                <button 
                  onClick={downloadKit}
                  className="w-full bg-brand-navy text-brand-cream py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-brand-gold"
                >
                  Descarcă Certificatul PDF 🛡️
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
