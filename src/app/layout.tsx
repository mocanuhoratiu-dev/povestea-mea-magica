import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Povestea Mea Magică | Creează Aventuri Personalizate ✨",
  description: "Transformă-ți copilul în eroul propriei povești! Povești și audio-book-uri personalizate cu ajutorul AI, livrate instant.",
};

import SmoothScroll from "@/components/SmoothScroll";
import MobileCTA from "@/components/MobileCTA";

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`scroll-smooth ${quicksand.variable} ${nunito.variable}`}>
      <body className="antialiased font-quicksand bg-brand-cream">
        <Navbar />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
