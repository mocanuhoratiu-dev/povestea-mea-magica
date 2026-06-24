import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import MobileCTA from "@/components/MobileCTA";
import Navbar from "@/components/Navbar";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Povestea Mea Magică | Povești personalizate pentru copii",
  description: "Creează povești, kituri anti-frică și activități de urgență personalizate pentru copilul tău, în română, cu ajutorul AI.",
};

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
        <MobileCTA />
      </body>
    </html>
  );
}
