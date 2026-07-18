import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteMode";

const publicPages = [
  "",
  "/modele",
  "/termeni-si-conditii",
  "/politica-de-confidentialitate",
  "/politica-de-rambursare",
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
