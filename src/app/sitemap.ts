import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteMode";

const publicPages = [
  "",
  "/despre",
  "/modele",
  "/preturi",
  "/cum-functioneaza",
  "/livrare-digitala",
  "/contact",
  "/intrebari-frecvente",
  "/termeni-si-conditii",
  "/politica-de-confidentialitate",
  "/politica-de-rambursare",
  "/politica-cookie-uri",
  "/siguranta-ai",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
