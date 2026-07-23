"use client";

import { Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/clientTelemetry";
import type { TelemetryProduct } from "@/lib/telemetry";

type EmailDeliveryProps = {
  product: TelemetryProduct;
  filename: string;
  createPdf: () => Promise<Blob>;
};

function bytesToBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window.btoa(binary);
}

export default function EmailDelivery({ product, filename, createPdf }: EmailDeliveryProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState("");

  const sendEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || isSending) return;

    setIsSending(true);
    setNotice("");
    const renderStartedAt = Date.now();
    let pdfRendered = false;
    trackEvent("pdf_render_started", { product });

    try {
      const pdf = await createPdf();
      pdfRendered = true;
      trackEvent("pdf_render_completed", { product, durationMs: Date.now() - renderStartedAt });
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      const response = await fetch("/api/deliver-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          email: email.trim(),
          filename,
          pdfBase64: bytesToBase64(bytes),
          deliveryId: crypto.randomUUID().replace(/-/g, ""),
        }),
      });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Emailul nu a putut fi trimis.");
      setNotice("A plecat. Verifică inboxul și folderul Spam.");
    } catch (error) {
      if (!pdfRendered) {
        trackEvent("pdf_render_failed", { product, durationMs: Date.now() - renderStartedAt });
      }
      setNotice(error instanceof Error ? error.message : "Emailul nu a putut fi trimis acum.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={sendEmail} className="mt-4 border border-brand-navy/10 bg-white/55 p-3 text-left">
      <label htmlFor={`delivery-${product}`} className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-brand-navy/65">
        <Mail size={14} /> Primește PDF-ul pe email
      </label>
      <div className="flex gap-2">
        <input
          id={`delivery-${product}`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="adresa@ta.ro"
          autoComplete="email"
          required
          className="min-w-0 flex-1 border border-brand-navy/15 bg-white px-3 py-2 text-sm font-semibold text-brand-navy outline-none focus:border-brand-purple"
        />
        <button type="submit" disabled={isSending || !email.trim()} className="grid h-10 w-10 shrink-0 place-items-center bg-brand-purple text-white transition-colors hover:bg-brand-navy disabled:cursor-wait disabled:opacity-50" aria-label="Trimite PDF-ul pe email">
          <Send size={16} />
        </button>
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-brand-navy/52">Folosim adresa doar pentru acest PDF. Nu trimitem newslettere.</p>
      {notice && <p className="mt-2 text-xs font-bold leading-relaxed text-brand-navy">{notice}</p>}
    </form>
  );
}
