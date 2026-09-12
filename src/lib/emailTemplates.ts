import { brandedEmail, emailAction, emailParagraph, emailUrl, escapeEmailHtml } from "./emailBrand.ts";

export type TransactionalEmailProduct = "story" | "monster" | "emergency" | "bundle" | "complete_bundle" | "album";

type ProductEmailCopy = {
  name: string;
  eyebrow: string;
  title: string;
  subject: string;
  message: string;
};

export const productEmailCopy: Record<TransactionalEmailProduct, ProductEmailCopy> = {
  story: {
    name: "Povestea de Seară",
    eyebrow: "Lanterna a aprins o poveste",
    title: "Povestea voastră este gata",
    subject: "Povestea ta este gata",
    message: "Am așezat aventura într-un material pregătit pentru seara în care vreți să mai deschideți o lume împreună.",
  },
  monster: {
    name: "Atelierul Scutului Magic",
    eyebrow: "Lanterna pregătește seara",
    title: "Scutul vostru este gata",
    subject: "Atelierul Scutului Magic este gata",
    message: "Ritualul de seară este pregătit pentru un moment mic de curaj, făcut împreună.",
  },
  emergency: {
    name: "Dosarul Micului Explorator",
    eyebrow: "Lanterna a pregătit o misiune",
    title: "Dosarul vostru este gata",
    subject: "Dosarul Micului Explorator este gata",
    message: "Misiunile de răbdare sunt gata să transforme următoarea așteptare într-un timp al vostru.",
  },
  bundle: {
    name: "Pachetul Familiei Magice",
    eyebrow: "Trei momente, o singură lanternă",
    title: "Pachetul vostru este gata",
    subject: "Pachetul Familiei Magice este gata",
    message: "Povestea, Atelierul Scutului Magic și Dosarul Micului Explorator vă așteaptă, fiecare cu personalizarea pe care ați ales-o.",
  },
  complete_bundle: {
    name: "Pachetul Complet",
    eyebrow: "Trei experiențe, o lume întreagă",
    title: "Pachetul vostru complet este gata",
    subject: "Pachetul Complet Povestea Mea Magică este gata",
    message: "Povestea Magică, Atelierul Scutului Magic și Dosarul Micului Explorator vă așteaptă în aceeași livrare, cu patru PDF-uri pregătite pentru voi.",
  },
  album: {
    name: "Povestea Magică",
    eyebrow: "O lume întreagă a prins culoare",
    title: "Albumul vostru ilustrat este gata",
    subject: "Povestea Magică este gata",
    message: "O lume întreagă, cu copilul tău în centrul ei. Cartea ilustrată și caietul de activități sunt pregătite să le descoperiți împreună.",
  },
};


export function createReadyEmailSubject(product: TransactionalEmailProduct, childName = "") {
  const safeName = childName.trim();
  if (!safeName || product === "bundle" || product === "complete_bundle") return productEmailCopy[product].subject;
  return `${productEmailCopy[product].name} pentru ${safeName} este gata`;
}

export function createReadyEmailHtml({
  product,
  childName = "",
  siteUrl,
  deliveryUrl,
  deliveryMode,
}: {
  product: TransactionalEmailProduct;
  childName?: string;
  siteUrl: string;
  deliveryUrl?: string;
  deliveryMode: "attachment" | "secure-link";
}) {
  const copy = productEmailCopy[product];
  const bundle = product === "bundle" || product === "complete_bundle";
  const hasSecureLink = deliveryMode === "secure-link";
  if (hasSecureLink && !deliveryUrl) throw new Error("Missing delivery link");
  const salutation = bundle ? "Pentru familia voastră" : childName.trim() ? `Pentru ${childName.trim()}` : "Pentru voi";
  const deliveryTitle = hasSecureLink
    ? product === "complete_bundle" ? "4 PDF-uri, într-un singur loc" : product === "album" ? "Cartea și caietul de activități" : bundle ? "Cele trei materiale ale familiei" : "Materialul vostru personalizat"
    : "Documentele sunt atașate acestui email";
  const deliveryText = hasSecureLink
    ? "Linkul privat este valabil 30 de zile. Deschide materialele și descarcă-le pe dispozitiv, ca să le păstrezi pentru mai târziu."
    : "Deschide atașamentele de mai jos. Le poți salva pe dispozitiv sau imprima acasă.";
  const action = hasSecureLink ? emailAction(bundle ? "Deschide pachetul" : product === "album" ? "Răsfoiește povestea" : "Deschide materialul", deliveryUrl!) : "";
  const backupLink = hasSecureLink ? `<p style="margin:0 0 24px;color:#435567;font-size:12px;line-height:20px;">Butonul nu se deschide? <a href="${emailUrl(deliveryUrl!)}" style="color:#0b2035;text-decoration:underline;">Folosește acest link pentru livrare</a>.</p>` : "";
  return brandedEmail({
    siteUrl,
    preheader: `${copy.subject}. ${hasSecureLink ? "Linkul privat și documentele voastre sunt aici." : "Documentele voastre sunt atașate."}`,
    eyebrow: `${copy.name} · ${salutation}`,
    title: copy.title,
    content: emailParagraph(copy.message)
      + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;background:#edf2f6;border-left:3px solid #f2cd7a;"><tr><td style="padding:20px;"><p style="margin:0 0 8px;color:#0b2035;font-size:15px;font-weight:bold;line-height:22px;">${escapeEmailHtml(deliveryTitle)}</p><p style="margin:0;color:#435567;font-size:14px;line-height:23px;">${escapeEmailHtml(deliveryText)}</p></td></tr></table>`
      + action + backupLink
      + emailParagraph("Sperăm să vă aducă un moment frumos împreună. Dacă ai nevoie de ajutor, răspunde la acest email. Suntem aici.")
      + `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #dbe3e9;color:#435567;font-size:12px;line-height:20px;">Acum, în ediție digitală. Pregătim și variante tipărite, adaptate fiecărui material; acestea nu sunt incluse în comanda actuală.</p>`,
    footer: `Mesaj pentru materialele comandate sau create de tine. Nu te-am înscris la un newsletter.${hasSecureLink ? " Livrarea digitală a fost inițiată conform acordului exprimat la checkout." : ""}`,
  });
}

export function createReadyEmailText({
  product,
  childName = "",
  deliveryUrl,
  deliveryMode,
}: {
  product: TransactionalEmailProduct;
  childName?: string;
  deliveryUrl?: string;
  deliveryMode: "attachment" | "secure-link";
}) {
  const copy = productEmailCopy[product];
  const salutation = childName.trim() ? `Pentru ${childName.trim()}\n\n` : "";
  const delivery = deliveryMode === "secure-link" && deliveryUrl
    ? `Deschide materialul: ${deliveryUrl}\n\nLinkul este valabil 30 de zile.`
    : "Documentele sunt atașate acestui email.";
  return `${salutation}${copy.title}\n\n${copy.message}\n\n${delivery}\n\nAi nevoie de ajutor? Răspunde la acest email sau scrie la office@povestea-mea-magica.ro.\n\nAcum, în ediție digitală. Pregătim și variante tipărite, neincluse în comanda actuală.\n\nEchipa Povestea Mea Magică`;
}
