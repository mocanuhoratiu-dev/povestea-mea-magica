"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, Trees, Castle, Sparkles, Star, ShieldCheck } from "lucide-react";
import MagicalLoader from "./MagicalLoader";

const themes = [
  { id: "space", label: "Spațiu", icon: <Rocket />, color: "bg-blue-400 text-white" },
  { id: "forest", label: "Pădure", icon: <Trees />, color: "bg-green-400 text-white" },
  { id: "castle", label: "Castel", icon: <Castle />, color: "bg-orange-400 text-white" },
];

const lessons = [
  "Curaj și încredere 💪",
  "Împărțitul jucăriilor 🧸",
  "Rutina de somn 🌙",
  "Importanța prieteniei 🤝",
  "Descoperirea naturii 🌱",
];

const packages = [
  { id: "pdf", name: "Poveste Digitală PDF 📖", desc: "Primești povestea instant pe email", price: "49 RON" },
  { id: "full", name: "Pachet Magic + Audio 🎧", desc: "PDF + Voce magică personalizată", price: "89 RON" }
];

export default function StoryCreator() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("3");
  const [selectedTheme, setSelectedTheme] = useState("space");
  const [lesson, setLesson] = useState(lessons[0]);
  const [packageType, setPackageType] = useState("full");
  const [isLoading, setIsLoading] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleCheckout = async () => {
    if (!name) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ type: "story", name, age, theme: selectedTheme, lesson, package: packageType }),
      });

      const result = await response.json();
      
      if (result.success) {
        const text = result.data?.text || result.data?.choices?.[0]?.message?.content || "Magia a sosit!";
        
        // Sanitize for URL
        const simpleName = name.replace(/[^a-zA-Z0-9]/g, '') || "Hero";
        const simpleTheme = selectedTheme.replace(/[^a-zA-Z0-9]/g, '') || "Magic";
        const artisticPrompt = `magical children book illustration, ${simpleTheme} theme, character ${simpleName}, vibrant colors, 8k`;
        const img = `https://image.pollinations.ai/prompt/${encodeURIComponent(artisticPrompt)}?nologo=true&width=800&height=800&seed=${Date.now()}`;
        
        setStoryText(text);
        setImageUrl(img);
        setShowResult(true);
      } else {
        throw new Error("Eroare API");
      }
    } catch (err) {
      alert("⚠️ Hopa! Ceva n-a mers bine. Încearcă din nou.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="creator" className="py-20 md:py-32 magic-gradient relative overflow-hidden px-4">
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
            className="bg-brand-cream max-w-2xl w-full h-full max-h-[90vh] md:max-h-[85vh] rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-brand-purple/20 relative shadow-2xl flex flex-col overflow-hidden"
          >
            <button 
              onClick={() => setShowResult(false)}
              className="absolute top-4 right-4 text-brand-navy/40 hover:text-brand-purple font-black text-xl z-20 bg-white/80 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all"
            >
              ✕
            </button>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
              <div className="text-center mb-8 pt-4">
                <Sparkles className="text-brand-purple w-10 h-10 mx-auto mb-4 animate-pulse" />
                <h3 className="font-nunito font-black text-2xl md:text-3xl text-brand-navy px-4">Povestea lui {name} ✨</h3>
              </div>

              {imageUrl && (
                <div className="mb-8 relative group mx-auto max-w-[500px]">
                  <motion.div 
                    key={`img-${imageUrl}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-brand-navy/5 aspect-square relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/5 via-brand-purple/10 to-brand-navy/5 animate-pulse z-0" />
                    <img 
                      key={imageUrl}
                      src={imageUrl} 
                      alt="Ilustrație Magică" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover block relative z-10 transition-opacity duration-500"
                      onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                      style={{ opacity: 0 }}
                    />
                  </motion.div>
                </div>
              )}

              <div className="prose prose-brand max-w-none text-brand-navy/80 font-medium whitespace-pre-wrap leading-relaxed text-base md:text-lg pb-10">
                {storyText}
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white/50 border-t border-brand-navy/5 backdrop-blur-sm">
              <p className="text-center text-[10px] md:text-xs font-bold text-brand-purple uppercase tracking-widest mb-4">
                Previzualizare Magică
              </p>
              <button className="w-full bg-brand-pink text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                Descarcă PDF-ul Complet 📥
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              x: mousePos.x * (i % 5 + 1),
              y: mousePos.y * (i % 3 + 1),
            }}
            className="absolute text-white"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
          >
            <Star size={Math.random() * 10 + 5} fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16 px-4">
          <motion.div initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} className="inline-block">
            <h2 className="font-nunito font-extrabold text-4xl md:text-6xl text-brand-cream drop-shadow-lg leading-tight">
              Atelierul de Povești 🎨
            </h2>
          </motion.div>
          <p className="mt-4 text-brand-cream/90 text-lg md:text-xl font-medium">
            Creează o lume magică pentru puiul tău
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden p-6 md:p-16 border-4 md:border-8 border-brand-purple/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
            <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Numele Micuțului 👦
                </label>
                <input
                  type="text"
                  placeholder="Vladimir, Exploratorul..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg md:text-xl shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                    Vârstă 🎂
                  </label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((v) => <option key={v} value={v}>{v} ani</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                    Lumea 🌟
                  </label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                  >
                    {themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm md:text-base font-black text-brand-navy mb-2 md:mb-3 uppercase tracking-wider">
                  Ce învățăm astăzi? 💡
                </label>
                <select
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full px-6 py-4 md:py-5 rounded-2xl bg-brand-cream/30 border-4 border-transparent focus:border-brand-purple outline-none transition-all text-brand-navy font-bold text-lg appearance-none cursor-pointer"
                >
                  {lessons.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-8">
              <div className="bg-brand-cream/30 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-brand-purple/20">
                <h4 className="font-black text-brand-navy text-lg mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-brand-purple" /> Alege Pachetul
                </h4>
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setPackageType(pkg.id)}
                      className={`w-full p-4 md:p-5 rounded-2xl border-4 transition-all text-left ${
                        packageType === pkg.id
                          ? "border-brand-purple bg-white shadow-lg scale-[1.02]"
                          : "border-transparent bg-white/50 opacity-70"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-navy text-sm md:text-base">{pkg.name}</span>
                        <span className="font-black text-brand-purple">{pkg.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!name}
                className="w-full bg-brand-purple text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl hover:bg-brand-navy transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                Creează Povestea <Sparkles className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
