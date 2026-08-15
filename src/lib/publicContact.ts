export const publicContact = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "office@povestea-mea-magica.ro",
  feedbackEmail: "office@povestea-mea-magica.ro",
};

export const legalOperator = {
  name: "Growth IT Labs SRL",
  cui: "55427042",
  tradeRegisterNumber: "J2026049651009",
  registeredOffice: "Balotești, județul Ilfov, România",
};

export function supportMailto(subject: string) {
  return `mailto:${publicContact.email}?subject=${encodeURIComponent(subject)}`;
}
