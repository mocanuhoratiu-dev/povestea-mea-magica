// The public experience is intentionally the final direct-generation flow.
export const siteMode = "production" as const;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://povestea-mea-magica-634103832719.europe-west3.run.app")
  .replace(/\/+$/, "");

export const siteCopy = {
  navCta: "Alege materialul",
  mobileCta: "Alege materialul",
  heroCta: "Alege materialul",
  heroBadge: "Acces de lansare",
  launchAccess: "Accesul de lansare este gratuit. Prețurile afișate intră în vigoare odată cu plățile online.",
  storyIntro: "Completezi câteva detalii, vezi rezultatul și descarci PDF-ul direct din browser.",
  storyPackageTitle: "Ce primești",
  storyGenerateCta: "Generează povestea",
  footerStatusTitle: "Acces de lansare",
  footerStatusText: "Poți genera și descărca toate materialele fără plată acum. Prețurile afișate sunt cele care se vor aplica după activarea plăților online.",
};
