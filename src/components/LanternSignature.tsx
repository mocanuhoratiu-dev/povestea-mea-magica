"use client";

import { motion, useReducedMotion } from "framer-motion";
import BrandMark from "@/components/BrandMark";

type LanternSignatureProps = {
  className?: string;
  tone?: "ink" | "paper";
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export default function LanternSignature({
  className = "",
  tone = "paper",
  label,
  size = "md",
}: LanternSignatureProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`relative inline-grid place-items-center ${className}`}>
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { opacity: [0.36, 0.72, 0.36], scale: [0.92, 1.12, 0.92] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-full w-full rounded-full bg-brand-gold/35 blur-xl"
      />
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute h-[128%] w-[128%] rounded-full border border-brand-gold/30 border-dashed"
      />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <BrandMark className={sizes[size]} tone={tone} title={label || "Lanterna Magică"} />
      </motion.div>
    </div>
  );
}
