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
    name: "Scutul de Noapte",
    eyebrow: "Lanterna pregătește seara",
    title: "Scutul vostru este gata",
    subject: "Scutul de Noapte este gata",
    message: "Ritualul de seară este pregătit pentru un moment mic de curaj, făcut împreună.",
  },
  emergency: {
    name: "Trusa de Răbdare",
    eyebrow: "Lanterna a pregătit o misiune",
    title: "Trusa voastră este gata",
    subject: "Trusa de Răbdare este gata",
    message: "Misiunile de răbdare sunt gata să transforme următoarea așteptare într-un timp al vostru.",
  },
  bundle: {
    name: "Pachetul Familiei Magice",
    eyebrow: "Trei momente, o singură lanternă",
    title: "Pachetul vostru este gata",
    subject: "Pachetul Familiei Magice este gata",
    message: "Povestea, Scutul de Noapte și Trusa de Răbdare vă așteaptă, fiecare cu personalizarea pe care ați ales-o.",
  },
  complete_bundle: {
    name: "Pachetul Complet",
    eyebrow: "Cinci materiale, o lume întreagă",
    title: "Pachetul vostru complet este gata",
    subject: "Pachetul Complet Povestea Mea Magică este gata",
    message: "Povestea, cele două kituri, cartea ilustrată și caietul de activități vă așteaptă în aceeași livrare.",
  },
  album: {
    name: "Povestea Magică",
    eyebrow: "O lume întreagă a prins culoare",
    title: "Albumul vostru ilustrat este gata",
    subject: "Povestea Magică este gata",
    message: "Cartea ilustrată și caietul de activități sunt pregătite. Din linkul privat poți răsfoi albumul, asculta povestea și descărca ambele PDF-uri.",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

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
  const safeName = escapeHtml(childName.trim());
  const salutation = safeName ? `Pentru ${safeName}` : product === "bundle" || product === "complete_bundle" ? "Pentru familia voastră" : "Pentru voi";
  const markUrl = `${siteUrl}/icon.png`;
  const hasSecureLink = deliveryMode === "secure-link" && Boolean(deliveryUrl);
  const calloutTitle = hasSecureLink
    ? product === "bundle" ? "Cele trei materiale sunt pregătite." : product === "complete_bundle" ? "Toate cele cinci materiale sunt pregătite." : product === "album" ? "Cele două documente sunt pregătite." : "Materialul este pregătit."
    : "PDF-ul este atașat acestui email.";
  const calloutMessage = hasSecureLink
    ? "Linkul personal este valabil 30 de zile. De acolo poți deschide și descărca PDF-ul."
    : "Îl poți citi, păstra sau printa când vă este bine.";

  return `<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:0;background:#f3eee4;color:#24324f;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3eee4;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #e5b84f;">
          <tr><td style="height:5px;background:#e5b84f;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 34px 22px;background:#24324f;text-align:center;">
              <img src="${markUrl}" width="52" height="52" alt="Povestea Mea Magică" style="display:block;margin:0 auto 12px;border:0;border-radius:8px;" />
              <p style="margin:0;color:#f7edcf;font-size:12px;font-weight:700;letter-spacing:1.5px;line-height:18px;text-transform:uppercase;">Povestea Mea Magică</p>
              <p style="margin:5px 0 0;color:#e5b84f;font-size:11px;letter-spacing:1.2px;line-height:16px;text-transform:uppercase;">${copy.eyebrow}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 34px 18px;text-align:center;">
              <p style="margin:0 0 9px;color:#8b5daf;font-size:12px;font-weight:700;letter-spacing:1.4px;line-height:18px;text-transform:uppercase;">${salutation}</p>
              <h1 style="margin:0;color:#24324f;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:38px;">${copy.title}</h1>
              <div style="width:42px;height:2px;margin:20px auto;background:#e5b84f;line-height:2px;font-size:0;">&nbsp;</div>
              <p style="margin:0;color:#4c5a72;font-size:16px;line-height:26px;">${copy.message}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 34px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f8f1df;border:1px solid #ead8a4;">
                <tr>
                  <td style="padding:18px 20px;text-align:center;">
                    <p style="margin:0 0 5px;color:#24324f;font-size:15px;font-weight:700;line-height:22px;">${calloutTitle}</p>
                    <p style="margin:0;color:#61708a;font-size:13px;line-height:20px;">${calloutMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        ${hasSecureLink ? `<tr><td style="padding:0 34px 32px;text-align:center;"><a href="${escapeHtml(deliveryUrl || "")}" style="display:inline-block;background:#8b5daf;color:#ffffff;font-size:14px;font-weight:700;line-height:20px;padding:13px 22px;text-decoration:none;border-radius:6px;">${product === "bundle" || product === "complete_bundle" ? "Deschide pachetul" : product === "album" ? "Deschide albumul" : "Deschide materialul"}</a></td></tr>` : ""}
          <tr>
            <td style="padding:0 34px 30px;text-align:center;">
              <a href="${siteUrl}" style="color:#24324f;font-size:12px;font-weight:700;line-height:18px;text-decoration:underline;text-underline-offset:3px;">Înapoi la Povestea Mea Magică</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 30px;background:#efe6d5;text-align:center;">
              <p style="margin:0;color:#61708a;font-size:11px;line-height:17px;">Ai primit acest email pentru materialul pe care tocmai l-ai comandat sau creat. Nu trimitem newslettere fără acordul tău.${hasSecureLink ? " Materialul digital a fost pregătit imediat după plată, conform acordului exprimat la checkout." : ""}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
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
    : "PDF-ul este atașat acestui email.";
  return `${salutation}${copy.title}\n\n${copy.message}\n\n${delivery}\n\nPovestea Mea Magică`;
}
