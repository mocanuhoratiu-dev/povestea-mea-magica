import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

type CommercialPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function CommercialPage({ eyebrow, title, description, children }: CommercialPageProps) {
  return (
    <main className="min-h-screen bg-brand-cream pt-24">
      <section className="border-b border-brand-navy/15 px-6 pb-14 pt-10 md:pb-20">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-brand-navy/60 transition-colors hover:text-brand-purple">
            <ArrowLeft size={16} /> Înapoi la poveste
          </Link>
          <p className="mt-12 text-xs font-black uppercase tracking-[0.16em] text-brand-purple">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-nunito text-4xl font-black leading-tight text-brand-navy md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-brand-navy/70">{description}</p>
        </div>
      </section>
      {children}
      <Footer />
    </main>
  );
}
