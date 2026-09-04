// The public experience is intentionally the final direct-generation flow.
export const siteMode = "production" as const;

// One source of truth for checkout visibility. A deployment must opt in only
// after the payment, order storage and fulfillment settings are ready together.
export const commerce = {
  // This is deliberately an explicit public build flag. A valid Stripe key is
  // not enough to activate payments: order persistence and fulfillment must be
  // live as well.
  status: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true" ? "commerce" as const : "payments_pending" as const,
  acceptsPayments: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true",
  prices: {
    nightShield: "19 lei",
    patienceKit: "19 lei",
    completeBundle: "79 lei",
    illustratedAlbum: "59 lei",
  },
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.povestea-mea-magica.ro")
  .replace(/\/+$/, "");

export const siteCopy = {
  navCta: "Alege un moment",
  mobileCta: "Alege un moment",
  heroCta: "Alege un moment",
  heroBadge: "Pentru momentele voastre",
  paymentNotice: commerce.acceptsPayments
    ? "Prețul final și plata securizată sunt afișate înainte de confirmarea comenzii."
    : "Plățile online se activează în curând. Până atunci, poți crea și descărca materialele fără cost.",
  storyIntro: "O aventură personală pentru seara voastră, pregătită pentru citit sau printat.",
  storyPackageTitle: "Ce primești",
  storyGenerateCta: "Creează povestea",
};
