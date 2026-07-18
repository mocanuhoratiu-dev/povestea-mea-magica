// The public experience is intentionally the final direct-generation flow.
export const siteMode = "production" as const;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://povestea-mea-magica-634103832719.europe-west3.run.app")
  .replace(/\/+$/, "");

export const siteCopy = {
  navCta: "Creează povestea",
  mobileCta: "Creează povestea",
  heroCta: "Creează povestea",
  heroBadge: "Beta publică pentru părinți",
  storyIntro: "În perioada beta poți genera gratuit PDF-ul personalizat, îl verifici și îl descarci direct din browser.",
  storyPackageTitle: "Produsul ales",
  storyGenerateCta: "Generează povestea",
  footerStatusTitle: "Beta publică",
  footerStatusText: "Poveștile și kiturile se generează și se descarcă digital. În această etapă sunt gratuite; prețurile de lansare sunt afișate pentru etapa comercială.",
};
