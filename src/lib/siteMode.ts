// The public experience is intentionally the final direct-generation flow.
export const siteMode = "production" as const;

// One source of truth for the commercial stage. Payments stay off until
// checkout, order storage and support flows are all ready together.
export const commerce = {
  // This is deliberately an explicit public build flag. A valid Stripe key is
  // not enough to activate payments: order persistence and fulfillment must be
  // live as well. Keep it false until the launch checklist is complete.
  status: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true" ? "commerce" as const : "launch_access" as const,
  acceptsPayments: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true",
  prices: {
    storyShort: "19 lei",
    storyLong: "29 lei",
    nightShield: "19 lei",
    patienceKit: "19 lei",
    completeSet: "49 lei",
  },
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.povestea-mea-magica.ro")
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
