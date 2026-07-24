"use client";

import dynamic from "next/dynamic";

const LumiGuide = dynamic(() => import("@/components/LumiGuide"), {
  ssr: false,
  loading: () => null,
});

export default function LumiGuideLoader() {
  return <LumiGuide />;
}
