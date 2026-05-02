"use client";

import { useState, useEffect } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Parallax transforms
  const starX = useTransform(smoothX, (v) => v * 1.5);
  const starY = useTransform(smoothY, (v) => v * 1.5);
  const rocketX = useTransform(smoothX, (v) => -v * 2);
  const rocketY = useTransform(smoothY, (v) => -v * 2);
  const mockupX = useTransform(smoothX, (v) => v * 0.3);
  const mockupY = useTransform(smoothY, (v) => v * 0.3);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-brand-purple/20 rounded-full blur-3xl animate-pulse will-change-transform" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-brand-pink/20 rounded-full blur-3xl will-change-transform" />

      {/* Floating Elements with Parallax */}
      <motion.div
        style={{ x: starX, y: starY }}
        className="absolute top-40 left-10 text-4xl hidden md:block pointer-events-none will-change-transform"
      >
        ✨
      </motion.div>
      <motion.div
        style={{ x: rocketX, y: rocketY }}
        className="absolute bottom-40 right-20 text-4xl hidden md:block pointer-events-none will-change-transform"
      >
        🚀
      </motion.div>
      <motion.div
        style={{ x: mockupX, y: mockupY }}
        className="absolute top-60 right-1/3 text-4xl hidden lg:block pointer-events-none will-change-transform"
      >
        🌟
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink font-bold text-sm tracking-wide uppercase">
            🪄 Magie pură pentru cel mic
          </div>
          <h1 className="font-nunito font-extrabold text-5xl md:text-7xl text-brand-navy leading-tight">
            Copilul tău, <span className="text-brand-purple italic">eroul</span> principal! 🧸
          </h1>
          <p className="mt-6 text-xl text-brand-navy/80 leading-relaxed max-w-xl font-medium">
            Creează o aventură unică în care micuțul tău salvează galaxia sau explorează păduri fermecate. O poveste de neuitat, livrată instant! 🌈
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-6">
            <motion.a
              href="#creator"
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-brand-purple text-brand-cream px-10 py-5 rounded-[2rem] font-extrabold text-xl shadow-2xl hover:shadow-brand-purple/40 transition-all animate-glow text-center border-b-4 border-brand-purple-light"
            >
              Vreau Povestea Mea! 🦄
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ x: mockupX, y: mockupY }}
          transition={{ duration: 1, ease: "backOut", delay: 0.2 }}
          className="relative group will-change-transform"
        >
          <div className="relative z-10 w-full animate-float will-change-transform">
            <Image
              src="/hero-mockup-kid.png"
              alt="Mockup Povestea Mea Magică"
              width={800}
              height={600}
              className="object-contain drop-shadow-[0_35px_35px_rgba(155,89,182,0.3)] transition-transform group-hover:scale-105 duration-700"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
