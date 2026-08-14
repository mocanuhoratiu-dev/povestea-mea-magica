"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { CheckoutProductId } from "@/lib/catalog";

type CheckoutButtonProps = {
  productId: CheckoutProductId;
  children: React.ReactNode;
  className?: string;
};

export default function CheckoutButton({ productId, children, className = "" }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const result = await response.json() as { url?: string; error?: string };

      if (!response.ok || !result.url) throw new Error(result.error || "Nu am putut deschide plata.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Nu am putut deschide plata.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={startCheckout} disabled={isLoading} className={className}>
        {isLoading ? <><LoaderCircle className="animate-spin" size={16} /> Se deschide plata...</> : children}
      </button>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
