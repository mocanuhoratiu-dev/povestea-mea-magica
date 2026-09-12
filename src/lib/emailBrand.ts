export const emailColors = { navy: "#0b2035", gold: "#f2cd7a", plum: "#72506c", paper: "#fbfcfd", mist: "#edf2f6", ink: "#435567" };

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function emailUrl(value: string) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid email link");
  return escapeEmailHtml(url.href);
}

export function emailParagraph(text: string) {
  return `<p style="margin:0 0 20px;color:${emailColors.ink};font-size:16px;line-height:26px;overflow-wrap:anywhere;word-wrap:break-word;">${escapeEmailHtml(text)}</p>`;
}

export function emailAction(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td bgcolor="${emailColors.gold}" style="background:${emailColors.gold};border-radius:4px;mso-padding-alt:16px 24px;"><a href="${emailUrl(url)}" style="display:inline-block;padding:16px 24px;color:${emailColors.navy};font-size:15px;font-weight:bold;line-height:22px;text-decoration:none;border:1px solid ${emailColors.gold};border-radius:4px;">${escapeEmailHtml(label)}</a></td></tr></table>`;
}

export function emailDetails(rows: ReadonlyArray<readonly [string, string]>) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:8px 0 24px;">${rows.map(([label, value]) => `<tr><th scope="row" width="58%" align="left" style="padding:12px 8px 12px 0;border-bottom:1px solid #dbe3e9;color:${emailColors.ink};font-size:14px;font-weight:normal;line-height:22px;word-wrap:break-word;">${escapeEmailHtml(label)}</th><td align="right" style="padding:12px 0 12px 8px;border-bottom:1px solid #dbe3e9;color:${emailColors.navy};font-size:14px;font-weight:bold;line-height:22px;overflow-wrap:anywhere;word-wrap:break-word;">${escapeEmailHtml(value)}</td></tr>`).join("")}</table>`;
}

// Table layout and inline styles are intentional: email clients do not share the site's CSS/font support.
export function brandedEmail({ siteUrl, preheader, eyebrow, title, content, footer }: {
  siteUrl: string; preheader: string; eyebrow: string; title: string; content: string; footer: string;
}) {
  const base = new URL(siteUrl).origin;
  return `<!doctype html>
<html lang="ro" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeEmailHtml(title)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>@media only screen and (max-width:480px){.email-outer{padding:12px 8px!important}.email-content{padding:28px 22px!important}.email-title{font-size:28px!important;line-height:34px!important}.email-header{padding:24px 22px!important}}</style></head>
<body style="margin:0;padding:0;background:${emailColors.mist};color:${emailColors.navy};font-family:Arial,Helvetica,sans-serif;letter-spacing:0;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeEmailHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${emailColors.mist}"><tr><td class="email-outer" align="center" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;table-layout:fixed;background:${emailColors.paper};">
<tr><td style="height:4px;background:${emailColors.gold};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="email-header" bgcolor="${emailColors.navy}" style="padding:28px 36px;background:${emailColors.navy};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="78" valign="middle"><a href="${emailUrl(base)}"><img src="${emailUrl(`${base}/brand/email-emblem.png`)}" width="64" height="64" alt="Emblema Povestea Mea Magică" style="display:block;border:0;width:64px;height:64px;"></a></td><td valign="middle"><a href="${emailUrl(base)}" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:27px;font-weight:bold;text-decoration:none;color:#ffffff;">Povestea Mea<br>Magică</a><p style="margin:8px 0 0;color:${emailColors.gold};font-size:12px;line-height:18px;">Povești. Curaj. Descoperiri.</p></td></tr></table></td></tr>
<tr><td class="email-content" style="padding:36px;overflow-wrap:anywhere;word-wrap:break-word;"><p style="margin:0 0 12px;color:${emailColors.plum};font-size:12px;font-weight:bold;line-height:18px;">${escapeEmailHtml(eyebrow)}</p><h1 class="email-title" style="margin:0 0 24px;color:${emailColors.navy};font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:41px;overflow-wrap:anywhere;word-wrap:break-word;">${escapeEmailHtml(title)}</h1>${content}</td></tr>
<tr><td style="padding:24px 28px;background:${emailColors.mist};border-top:1px solid #dbe3e9;"><p style="margin:0 0 8px;color:${emailColors.navy};font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:25px;">Echipa Povestea Mea Magică</p><p style="margin:0 0 16px;font-size:13px;line-height:22px;"><a href="mailto:office@povestea-mea-magica.ro" style="color:${emailColors.navy};text-decoration:underline;overflow-wrap:anywhere;word-wrap:break-word;">office@povestea-mea-magica.ro</a></p><p style="margin:0;color:${emailColors.ink};font-size:11px;line-height:18px;">${escapeEmailHtml(footer)}</p><p style="margin:12px 0 0;color:${emailColors.ink};font-size:11px;line-height:18px;">Growth IT Labs SRL · CUI 55427042<br><a href="${emailUrl(`${base}/politica-de-confidentialitate`)}" style="color:${emailColors.ink};text-decoration:underline;">Confidențialitate</a> · <a href="${emailUrl(`${base}/contact`)}" style="color:${emailColors.ink};text-decoration:underline;">Contact</a></p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}
