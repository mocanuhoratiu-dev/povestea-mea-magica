"use client";

import { Sparkles } from "lucide-react";

export default function LumiOpenButton({ className = "", label = "Creez cu Lumi" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("pmm:lumi-open"))} className={className}>
      <Sparkles size={17} /> {label}
    </button>
  );
}
