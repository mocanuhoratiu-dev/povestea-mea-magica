"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, MoonStar, TimerReset, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const guideOptions = [
  {
    title: "O poveste pentru seară",
    detail: "O aventură numai bună de citit împreună.",
    target: "creator",
    icon: BookOpen,
    color: "text-brand-purple",
  },
  {
    title: "Un ritual pentru noapte",
    detail: "Pași blânzi pentru emoțiile de la culcare.",
    target: "monster-away",
    icon: MoonStar,
    color: "text-brand-gold",
  },
  {
    title: "O misiune de răbdare",
    detail: "Pentru drumuri, cozi și pauze lungi.",
    target: "emergency-kit",
    icon: TimerReset,
    color: "text-brand-orange",
  },
];

function LumiSpirit() {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/lumi-guardian.png");
  const sparkles = useMemo(
    () => new Float32Array([
      -1.15, 0.82, 0, -0.92, -0.42, 0.1, -0.58, 1.12, -0.1,
      0.98, 0.72, 0, 1.18, -0.34, -0.1, 0.45, 1.28, 0.05,
      0.72, -0.92, 0.12, -0.2, -1.08, 0.05,
    ]),
    []
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (group.current) {
      group.current.position.y = Math.sin(time * 1.4) * 0.07;
      group.current.rotation.y = Math.sin(time * 0.55) * 0.07 + state.pointer.x * 0.1;
      group.current.rotation.x = state.pointer.y * 0.04;
    }

    if (orbit.current) {
      orbit.current.rotation.z = time * 0.22;
      orbit.current.rotation.x = 0.58 + Math.sin(time * 0.4) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkles, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e5b84f" size={0.055} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <mesh ref={orbit} position={[0, -0.08, -0.2]}>
        <torusGeometry args={[1.02, 0.012, 8, 48]} />
        <meshBasicMaterial color="#e5b84f" transparent opacity={0.7} />
      </mesh>
      <sprite scale={[1.72, 2.58, 1]} position={[0, -0.12, 0.15]}>
        <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

function LumiVisual({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 30 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <LumiSpirit />
      </Canvas>
    </div>
  );
}

export default function LumiGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [heroIsVisible, setHeroIsVisible] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => setHeroIsVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const chooseGuideOption = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsOpen(false);
  };

  return (
    <aside
      className={`fixed bottom-4 right-4 z-[9990] w-[calc(100vw-2rem)] max-w-[352px] transition-opacity duration-300 max-md:bottom-[92px] sm:right-6 md:bottom-6 ${heroIsVisible ? "max-md:pointer-events-none max-md:opacity-0" : ""}`}
      aria-label="Ghidul Lumi"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section
            key="guide"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative overflow-hidden border border-brand-gold/50 bg-brand-cream p-5 shadow-[0_20px_55px_rgba(36,50,79,0.3)]"
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-brand-gold" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center text-brand-navy/55 transition-colors hover:bg-brand-navy hover:text-brand-cream"
              aria-label="Închide ghidul Lumi"
            >
              <X size={17} />
            </button>

            <div className="relative min-h-[120px] pr-24">
              <LumiVisual className="absolute -right-7 -top-9 h-40 w-32" />
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-purple">Lanterna Magică</p>
              <h2 className="mt-2 max-w-[205px] font-serif text-2xl leading-tight text-brand-navy">Lumi, păzitoarea Lanternii</h2>
              <p className="mt-2 max-w-[210px] text-sm font-semibold leading-relaxed text-brand-navy/70">Ce moment v-ar prinde bine acum?</p>
            </div>

            <div className="mt-3 border-t border-brand-navy/12">
              {guideOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.target}
                    type="button"
                    onClick={() => chooseGuideOption(option.target)}
                    className="flex w-full items-center gap-3 border-b border-brand-navy/10 py-3 text-left transition-colors hover:bg-brand-navy/[0.045]"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center border border-current/25 ${option.color}`}>
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-brand-navy">{option.title}</span>
                      <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-brand-navy/60">{option.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="group relative ml-auto grid h-[78px] w-[78px] place-items-center rounded-full border border-brand-gold/70 bg-brand-navy shadow-[0_14px_35px_rgba(36,50,79,0.32)]"
            aria-label="Deschide ghidul Lumi"
          >
            <LumiVisual className="absolute -top-4 left-0 h-[92px] w-[78px] transition-transform duration-300 group-hover:-translate-y-1" />
            <span className="absolute -bottom-2 whitespace-nowrap bg-brand-cream px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-navy shadow-sm">Lumi</span>
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
