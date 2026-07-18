import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import MobileCTA from "@/components/MobileCTA";
import Navbar from "@/components/Navbar";
import { siteUrl } from "@/lib/siteMode";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Povestea Mea Magică | Povești personalizate pentru copii",
  description: "Creează povești, kituri anti-frică și activități de urgență personalizate pentru copilul tău, în română, cu ajutorul AI.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "/",
    siteName: "Povestea Mea Magică",
    title: "Povestea Mea Magică | Povești personalizate pentru copii",
    description: "Povești, kituri anti-frică și activități personalizate pentru copilul tău.",
    images: [
      {
        url: "/hero-storybook.png",
        width: 800,
        height: 600,
        alt: "O poveste personalizată de la Povestea Mea Magică",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Povestea Mea Magică | Povești personalizate pentru copii",
    description: "Povești, kituri anti-frică și activități personalizate pentru copilul tău.",
    images: ["/hero-storybook.png"],
  },
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
