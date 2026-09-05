import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import UsageTelemetry from "@/components/UsageTelemetry";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import { siteUrl } from "@/lib/siteMode";
import { legalOperator, publicContact } from "@/lib/publicContact";

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
  title: "Povestea Mea Magică | Copilul tău devine eroul poveștii",
  description: "Povești ilustrate premium, ritualuri de noapte și activități personalizate pentru copilul tău.",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "/",
    siteName: "Povestea Mea Magică",
    title: "Povestea Mea Magică | Copilul tău devine eroul poveștii",
    description: "Creează o poveste ilustrată premium în care copilul tău este eroul fiecărei pagini.",
    images: [
      {
        url: "/examples/album/hero-v2.webp",
        width: 1677,
        height: 942,
        alt: "O poveste personalizată de la Povestea Mea Magică",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Povestea Mea Magică | Copilul tău devine eroul poveștii",
    description: "Creează o poveste ilustrată premium în care copilul tău este eroul fiecărei pagini.",
    images: ["/examples/album/hero-v2.webp"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Povestea Mea Magică",
  legalName: legalOperator.name,
  url: siteUrl,
  logo: `${siteUrl}/icon.png`,
  email: publicContact.email,
  address: { "@type": "PostalAddress", addressLocality: "Balotești", addressRegion: "Ilfov", addressCountry: "RO" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" data-scroll-behavior="smooth" className={`scroll-smooth ${quicksand.variable} ${nunito.variable}`}>
      <body className="antialiased font-nunito bg-brand-cream">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <UsageTelemetry />
        <WebVitalsReporter />
        <Navbar />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
