"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Car, Stethoscope, CloudRain, Sparkles, Download, ShieldCheck, MapPin } from "lucide-react";
import MagicalLoader from "./MagicalLoader";

const EMERGENCY_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Caveat:wght@700&display=swap');

.ek-page {
  width: 794px; height: 1123px;
  background-color: #fdfaf0;
  position: relative; overflow: hidden;
  font-family: 'Nunito', sans-serif;
  box-sizing: border-box;
  border: 1px solid #eee;
}
.ek-border {
  position: absolute; inset: 20px;
  border: 4px dashed #ff9f43; border-radius: 20px;
  background-color: white;
}
.ek-header {
  text-align: center; margin-top: 40px;
}
.ek-title {
  font-family: 'Nunito', sans-serif; font-size: 42px; font-weight: 900;
  color: #ff9f43; text-transform: uppercase; letter-spacing: 2px;
}
.ek-subtitle {
  font-family: 'Caveat', cursive; font-size: 32px; color: #2d3436; margin-top: 10px;
}
.ek-section {
  margin: 40px 60px;
}
.ek-section-title {
  font-size: 24px; font-weight: 900; color: #ff9f43;
  border-bottom: 2px solid #ff9f43; padding-bottom: 10px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 10px;
}
.ek-radar-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
}
.ek-radar-item {
  display: flex; align-items: center; gap: 15px;
  background: #fff9f0; padding: 15px; border-radius: 12px; border: 2px solid #ffeaa7;
  font-size: 18px; font-weight: 700; color: #2d3436;
}
.ek-checkbox {
  width: 30px; height: 30px; border: 3px solid #ff9f43; border-radius: 8px; background: white;
}
.ek-riddle-box {
  background: #ff9f4315; padding: 25px; border-radius: 15px; border-left: 6px solid #ff9f43;
  font-size: 22px; font-weight: 700; color: #2d3436; font-style: italic; text-align: center;
}
.ek-drawing-box {
  border: 3px dashed #ff9f43; height: 400px; border-radius: 20px;
  margin-top: 20px; background: #fafafa;
}
.ek-patience-box {
  text-align: center; font-size: 20px; font-weight: 700; color: #2d3436;
  background: #fff9f0; padding: 20px; border-radius: 15px;
}
.ek-story-starter {
  background: #f0f9ff; border-left: 6px solid #74b9ff; border-radius: 12px;
  padding: 18px 22px; margin-bottom: 16px;
  font-size: 19px; font-weight: 700; color: #2d3436;
}
.ek-story-line {
  margin-top: 10px; border-bottom: 2px dashed #b2bec3; height: 32px;
}
.ek-tf-item {
  background: #fdf0ff; border-radius: 12px; padding: 18px 22px; margin-bottom: 14px;
  border-left: 6px solid #a29bfe;
}
.ek-tf-q { font-size: 18px; font-weight: 700; color: #2d3436; }
.ek-tf-btns { display: flex; gap: 12px; margin-top: 12px; }
.ek-tf-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: 3px solid #a29bfe;
  font-size: 16px; font-weight: 900; color: #a29bfe; text-align: center;
}
.ek-diploma {
  margin: 30px 60px; text-align: center; border: 4px double #ff9f43;
  border-radius: 20px; padding: 30px; background: #fff9f0;
}
.ek-diploma-title { font-size: 28px; font-weight: 900; color: #ff9f43; }
.ek-diploma-name { font-size: 36px; font-weight: 900; color: #2d3436; font-family: 'Caveat', cursive; margin: 10px 0; }
.ek-diploma-stars { font-size: 36px; letter-spacing: 8px; }
`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

const contexts = [
  { id: "la restaurant, asteptand mancarea", label: "La Restaurant", icon: <Utensils /> },
  { id: "la un drum lung cu masina", label: "La Drum Lung", icon: <Car /> },
  { id: "in sala de asteptare la doctor", label: "La Doctor", icon: <Stethoscope /> },
  { id: "in casa, ploua afara", label: "Acasă (Ploaie)", icon: <CloudRain /> },
];

export default function EmergencyKit() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [selectedContext, setSelectedContext] = useState(contexts[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [ekData, setEkData] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "emergency", name, age, context: selectedContext }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setEkData(result.data);
        setShowResult(true);
      } else {
        alert("Eroare la generarea kitului. Încearcă din nou.");
      }
    } catch (err) {
      console.error(err);
      alert("Ceva nu a funcționat. Mai încearcă o dată!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    ]);

    const { jsPDF } = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const pages = document.querySelectorAll('[id^="ek-page-"]');
    
    for (let i = 0; i < pages.length; i++) {
      const el = pages[i] as HTMLElement;
      el.style.display = 'block';
      
      const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, logging: false });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H);
      el.style.display = 'none';
      
      if (i < pages.length - 1) pdf.addPage();
    }

    pdf.save(`Trusa_Urgenta_${name.trim()}.pdf`);
    setIsLoading(false);
  };

  return (
    <section id="emergency-kit" className="py-20 md:py-32 bg-[#fffdf5] relative overflow-hidden px-4">
      <MagicalLoader isVisible={isLoading} />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-600 font-bold text-sm uppercase tracking-widest mb-6">
            <ShieldCheck size={16} /> Salvare pentru Părinți
          </div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-navy leading-tight">
            Trusa Magică <span className="text-orange-500">de Urgență</span> 🚨
          </h2>
          <p className="mt-4 text-brand-navy/60 text-lg max-w-xl mx-auto">
            Așteptarea e grea? Copilul și-a pierdut răbdarea? Generează instant un PDF cu misiuni secrete adaptate locului în care sunteți!
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl border-4 border-orange-100"
        >
          <form onSubmit={handleGenerate} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-nunito font-black text-brand-navy text-lg mb-3">
                  Cum îl cheamă pe Erou?
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Sofia"
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-6 py-4 text-brand-navy font-bold text-xl outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-nunito font-black text-brand-navy text-lg mb-3">
                  Ce vârstă are?
                </label>
                <input
                  type="number" value={age} onChange={e => setAge(e.target.value)} min="3" max="10"
                  className="w-full bg-gray-50 border-4 border-gray-100 focus:border-orange-400 rounded-2xl px-6 py-4 text-brand-navy font-bold text-xl outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-nunito font-black text-brand-navy text-lg mb-4 text-center">
                Unde vă aflați acum?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contexts.map(c => (
                  <button key={c.id} type="button" onClick={() => setSelectedContext(c.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-4 transition-all duration-200 ${
                      selectedContext === c.id
                        ? 'border-orange-500 bg-orange-50 scale-105 shadow-lg'
                        : 'border-gray-100 bg-white hover:border-orange-200'
                    }`}
                  >
                    <span className={`p-3 rounded-full ${selectedContext === c.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {c.icon}
                    </span>
                    <span className="text-sm font-black text-brand-navy text-center">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              type="submit" disabled={!name.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full bg-orange-500 text-white py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl border-b-8 border-orange-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <Sparkles size={28} /> Comandă Trusa PDF - 19.99 RON
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ════ HIDDEN PDF TEMPLATES ════ */}
      {ekData && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          <style>{EMERGENCY_STYLES}</style>
          
          {/* Page 1: Radar & Riddle */}
          <div id="ek-page-0" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-title">Misiune Secretă</div>
                <div className="ek-subtitle">Agent special: {name} ({age} ani)</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🔍 Radarul Magic</div>
                <p style={{marginBottom: 20, fontSize: 18, color: '#666'}}>Găsește aceste 4 lucruri în jurul tău și bifează căsuțele!</p>
                <div className="ek-radar-grid">
                  {ekData.radar?.map((r: string, idx: number) => (
                    <div key={idx} className="ek-radar-item">
                      <div className="ek-checkbox"></div>
                      <span>{r.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ek-section" style={{marginTop: 60}}>
                <div className="ek-section-title">✨ Ghicitoarea Locului</div>
                <div className="ek-riddle-box">
                  {ekData.riddle}
                </div>
              </div>
            </div>
          </div>

          {/* Page 2: Drawing & Patience */}
          <div id="ek-page-1" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-title">Creativitate & Răbdare</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🎨 Provocarea Desenatorului</div>
                <p style={{fontSize: 18, color: '#2d3436', fontWeight: 700}}>{ekData.drawing}</p>
                <div className="ek-drawing-box"></div>
              </div>

              <div className="ek-section" style={{marginTop: 60}}>
                <div className="ek-section-title">🧘 Misiune de Răbdare</div>
                <div className="ek-patience-box">
                  {ekData.patience}
                </div>
              </div>
            </div>
          </div>

          {/* Page 3: Story Starters only */}
          <div id="ek-page-2" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-title">Pagina Creativă</div>
                <div className="ek-subtitle">Inventează o poveste! 🖊️</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">📖 Continuă Povestea!</div>
                <p style={{fontSize: 16, color: '#999', marginBottom: 28}}>Alege un început magic și inventează ce se întâmplă mai departe!</p>
                {ekData.story_starters?.map((s: string, idx: number) => (
                  <div key={idx} className="ek-story-starter">
                    {s}
                    <div className="ek-story-line" />
                    <div className="ek-story-line" />
                    <div className="ek-story-line" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 4: True/False only */}
          <div id="ek-page-3" className="ek-page">
            <div className="ek-border">
              <div className="ek-header">
                <div className="ek-title">Provocarea Finală</div>
                <div className="ek-subtitle">Ești geniu? Hai să vedem! 🧠</div>
              </div>

              <div className="ek-section">
                <div className="ek-section-title">🧠 Adevărat sau Fals?</div>
                <p style={{fontSize: 16, color: '#999', marginBottom: 20}}>Încercuiește răspunsul tău, apoi verifică mai jos!</p>
                {ekData.true_or_false?.map((item: any, idx: number) => (
                  <div key={idx} className="ek-tf-item">
                    <div className="ek-tf-q">{idx + 1}. {item.q}</div>
                    <div className="ek-tf-btns">
                      <div className="ek-tf-btn">✅ ADEVĂRAT</div>
                      <div className="ek-tf-btn">❌ FALS</div>
                    </div>
                    <div style={{fontSize: 14, color: '#636e72', marginTop: 8, fontStyle: 'italic'}}>Răspuns: {item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 5: Diploma */}
          <div id="ek-page-4" className="ek-page">
            <div className="ek-border" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{textAlign: 'center', padding: '60px 80px'}}>
                <div style={{fontSize: 80, marginBottom: 30}}>🏅</div>
                <div style={{fontSize: 16, color: '#ff9f43', fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20}}>Ministerul Misiunilor Magice</div>
                <div style={{fontSize: 48, fontWeight: 900, color: '#ff9f43', fontFamily: 'Nunito, sans-serif', borderBottom: '3px solid #ff9f43', paddingBottom: 16, marginBottom: 16}}>DIPLOMĂ DE ONOARE</div>
                <div style={{fontSize: 22, color: '#636e72', fontWeight: 600, marginBottom: 20}}>Se acordă agentului special</div>
                <div style={{fontFamily: 'Caveat, cursive', fontSize: 72, fontWeight: 900, color: '#2d3436', marginBottom: 20}}>{name}</div>
                <div style={{fontSize: 20, color: '#636e72', fontWeight: 600, marginBottom: 40, lineHeight: 1.6}}>
                  pentru finalizarea cu brio a tuturor misiunilor secrete<br/>și demonstrarea unui curaj excepțional!
                </div>
                <div style={{fontSize: 48, letterSpacing: 12}}>⭐⭐⭐</div>
                <div style={{marginTop: 50, display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderTop: '2px solid #636e72', width: 180, marginBottom: 8}}></div>
                    <div style={{fontSize: 14, color: '#636e72', fontWeight: 700}}>Ministrul Magiei</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderTop: '2px solid #636e72', width: 180, marginBottom: 8}}></div>
                    <div style={{fontSize: 14, color: '#636e72', fontWeight: 700}}>Agentul Special</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="bg-white max-w-lg w-full rounded-[3rem] border-4 border-orange-400 relative flex flex-col overflow-hidden shadow-2xl"
            >
              <button onClick={() => setShowResult(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-gray-500 transition-all z-10">
                ✕
              </button>
              <div className="p-10 text-center">
                <div className="text-7xl mb-6 block">🚨</div>
                <h3 className="font-nunito font-black text-3xl text-brand-navy mb-3">Misiunea a fost creată!</h3>
                <p className="text-gray-600 font-medium mb-8">
                  Agentul <span className="text-orange-500 font-black">{name}</span> are activități noi. Trusa are <strong>4 pagini A4</strong>: radar magic, desen creativ, completare de povești, adevărat/fals și o diplomă de agent magic!
                </p>
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg border-b-8 border-orange-600 flex items-center justify-center gap-3 shadow-xl transition-all"
                >
                  <Download size={22} /> Descarcă Trusa PDF
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
