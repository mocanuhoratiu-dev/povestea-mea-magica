export type SiteMode = "demo" | "production";

export const siteMode: SiteMode =
  process.env.NEXT_PUBLIC_SITE_MODE === "production" ? "production" : "demo";

export const isProductionMode = siteMode === "production";

export const siteCopy = {
  navCta: isProductionMode ? "Creează povestea" : "Încearcă gratuit",
  mobileCta: isProductionMode ? "Creează povestea" : "Încearcă gratuit",
  heroCta: isProductionMode ? "Creează povestea" : "Creează o previzualizare",
  heroBadge: isProductionMode ? "Atelier digital pentru copii" : "Previzualizare interactivă",
  storyIntro: isProductionMode
    ? "Creează o poveste personalizată, verific-o și descarcă PDF-ul direct din browser."
    : "Testează o poveste personalizată înainte să activăm comenzile plătite.",
  storyPackageTitle: isProductionMode ? "Alege produsul" : "Alege previzualizarea",
  storyGenerateCta: isProductionMode ? "Generează povestea" : "Generează previzualizarea",
  voicePreviewCta: isProductionMode ? "Ascultă un test audio" : "Ascultă un test (Previzualizare)",
  footerStatusTitle: isProductionMode ? "Status Serviciu" : "Status Lansare",
  footerStatusText: isProductionMode
    ? "Poveștile și kiturile pot fi generate și descărcate digital. Comenzile plătite și livrarea automată pe email vor fi activate în etapa Stripe."
    : "Site-ul este în modul demo. Comenzile plătite și livrarea automată vor fi activate separat.",
};
