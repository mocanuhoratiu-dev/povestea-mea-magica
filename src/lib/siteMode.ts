// The public experience is intentionally the final direct-generation flow.
export const siteMode = "production" as const;

// One source of truth for the commercial stage. Payments stay off until
// checkout, order storage and support flows are all ready together.
export const commerce = {
  status: "launch_access" as const,
  acceptsPayments: false,
  prices: {
    storyShort: "19 lei",
    storyLong: "29 lei",
    nightShield: "19 lei",
    patienceKit: "19 lei",
    completeSet: "49 lei",
  },
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://povestea-mea-magica-634103832719.europe-west3.run.app")
  .replace(/\/+$/, "");

export const siteCopy = {
  navCta: "Alege un moment",
  mobileCta: "Alege un moment",
  heroCta: "Alege un moment",
  heroBadge: "Pentru momentele voastre",
  launchAccess: "Acces de lansare: creezi și descarci direct, fără plată. Prețurile afișate vor deveni active odată cu plățile online.",
  storyIntro: "O aventură personală pentru seara voastră, pregătită pentru citit sau printat.",
  storyPackageTitle: "Ce primești",
  storyGenerateCta: "Creează povestea",
};
