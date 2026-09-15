const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function launchPreviewPage({ next = "/", error = "", expiresAt, configured = true }: {
  next?: string; error?: string; expiresAt?: number; configured?: boolean;
}) {
  const expiry = expiresAt ? new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(expiresAt) : "";
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="same-origin"><title>Acces privat | Povestea Mea Magică</title><link rel="icon" href="/icon.png"><link rel="stylesheet" href="/launch/access.css"><script defer src="/launch/access.js"></script></head>
<body><main class="access-shell"><section class="access-panel" aria-labelledby="access-title">
<a class="brand" href="/in-curand" aria-label="Povestea Mea Magică: pagina de lansare"><img src="/brand/emblem.svg" width="76" height="76" alt=""><span>Povestea Mea Magică</span></a>
<p class="eyebrow">Înainte de prima pagină</p><h1 id="access-title">${expiresAt ? "Bine ai revenit." : "Intră în poveste."}</h1>
${expiresAt ? `<p class="intro">Accesul tău privat este activ până la <strong>${expiry}</strong>, ora României.</p><a class="primary" href="${escape(next)}">Deschide site-ul complet <span aria-hidden="true">→</span></a><form action="/acces-preview/iesire" method="post"><button class="logout" type="submit"><img src="/launch/log-out.svg" width="18" height="18" alt="">Închide accesul privat</button></form>` : `<p class="intro">Un loc doar pentru tine, înainte de lansare.</p>
${error ? `<p class="notice" id="access-error" role="alert">${escape(error)}</p>` : ""}
${configured ? `<form action="/acces-preview" method="post" id="access-form"><input type="hidden" name="next" value="${escape(next)}"><label for="password">Parola de acces</label><div class="password-field"><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required ${error ? 'aria-invalid="true" aria-describedby="access-error"' : ""}><button type="button" id="toggle-password" aria-label="Arată parola" aria-pressed="false" title="Arată parola" hidden><img src="/launch/eye.svg" width="20" height="20" alt=""></button></div><button class="primary" type="submit">Deschide site-ul complet <span aria-hidden="true">→</span></button></form>` : '<p class="notice" role="status">Accesul privat nu este configurat încă.</p>'}`}
<a class="back" href="/in-curand">Înapoi la numărătoarea inversă</a>
</section><p class="signature">Povești. Curaj. Descoperiri.</p></main></body></html>`;
}
