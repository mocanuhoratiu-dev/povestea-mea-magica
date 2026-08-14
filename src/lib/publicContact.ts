export const publicContact = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "mocanuhoratiu@gmail.com",
  betaFeedbackEmail: "horatiu@zenithcustomersuccess.com",
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
