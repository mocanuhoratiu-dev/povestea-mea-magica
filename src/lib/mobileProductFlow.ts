"use client";

import { useEffect, useState } from "react";

export type MobileProductId = "story" | "monster" | "emergency";

const productAnchors: Record<MobileProductId, string> = {
  story: "creator",
  monster: "monster-away",
  emergency: "emergency-kit",
};

function productFromHash(hash: string): MobileProductId | null {
  const anchor = hash.replace(/^#/, "");
  return (Object.entries(productAnchors).find(([, value]) => value === anchor)?.[0] as MobileProductId | undefined) ?? null;
}

function currentProduct(): MobileProductId | null {
  if (typeof window === "undefined") return null;
  return productFromHash(window.location.hash) ?? (window.sessionStorage.getItem("pmm-mobile-product") as MobileProductId | null);
}

export function openMobileProduct(product: MobileProductId) {
  if (typeof window === "undefined") return;

  const anchor = productAnchors[product];
  window.sessionStorage.setItem("pmm-mobile-product", product);
  window.history.replaceState(null, "", `#${anchor}`);
  window.dispatchEvent(new CustomEvent("pmm:mobile-product-selected", { detail: { product } }));

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

export function useMobileProductVisibility(product: MobileProductId) {
  const [selectedProduct, setSelectedProduct] = useState<MobileProductId | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateSelection = () => {
      const selection = media.matches ? currentProduct() : null;
      setSelectedProduct(selection);
      if (selection) {
        window.requestAnimationFrame(() => {
          document.getElementById(productAnchors[selection])?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    const handleSelection = (event: Event) => {
      setSelectedProduct((event as CustomEvent<{ product: MobileProductId }>).detail.product);
    };

    updateSelection();
    window.addEventListener("hashchange", updateSelection);
    window.addEventListener("pmm:mobile-product-selected", handleSelection);
    media.addEventListener("change", updateSelection);

    return () => {
      window.removeEventListener("hashchange", updateSelection);
      window.removeEventListener("pmm:mobile-product-selected", handleSelection);
      media.removeEventListener("change", updateSelection);
    };
  }, []);

  return selectedProduct === product;
}
