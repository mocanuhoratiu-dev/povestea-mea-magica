export const publicContact = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "mocanuhoratiu@gmail.com",
  betaFeedbackEmail: "horatiu@zenithcustomersuccess.com",
};

export function supportMailto(subject: string) {
  return `mailto:${publicContact.email}?subject=${encodeURIComponent(subject)}`;
}
