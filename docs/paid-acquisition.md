# Campanii plătite: tracking și protecție

Aplicația păstrează prima atribuire a sesiunii (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, pagina de intrare și domeniul referent). Datele sunt agregate în Cloud Logging și nu includ numele copilului, descrierea lui, fotografia, povestea sau adresa de email.

Meta Pixel se încarcă doar după acceptul explicit pentru măsurare opțională. Evenimentul `Purchase` este confirmat separat de server prin Stripe și trimis și prin Conversions API cu același `event_id`, pentru deduplicare.

## 1. Convenția UTM

Folosește denumiri mici, fără spații și păstrează aceeași convenție în toate reclamele:

```text
Instagram:
https://www.povestea-mea-magica.ro/povestea-magica?utm_source=instagram&utm_medium=paid_social&utm_campaign=lansare_2026&utm_content=video_lumi_01

Facebook:
https://www.povestea-mea-magica.ro/povestea-magica?utm_source=facebook&utm_medium=paid_social&utm_campaign=lansare_2026&utm_content=album_flipbook_01

Creator / afiliat:
https://www.povestea-mea-magica.ro/povestea-magica?utm_source=instagram&utm_medium=creator&utm_campaign=lansare_2026&utm_content=nume_creator
```

## 2. Meta Pixel și Conversions API

În Meta Events Manager creează un Pixel pentru `povestea-mea-magica.ro` și generează tokenul pentru Conversions API. Păstrează:

- Pixel ID;
- Conversions API access token.

Nu pune tokenul în Git sau într-un fișier public. Scriptul de activare îl salvează direct în Google Secret Manager.

## 3. Cloudflare Turnstile

În Cloudflare, deschide **Turnstile**, creează un widget de tip **Managed** și adaugă:

- `www.povestea-mea-magica.ro`;
- `povestea-mea-magica.ro`.

Păstrează site key și secret key. Verificarea din server validează tokenul, acțiunea și hostname-ul pentru generare, copertă, Lumi, audio, email și crearea comenzii. Turnstile poate proteja site-ul chiar înainte de activarea proxy-ului Cloudflare.

## 4. Activare din Cloud Shell

După `git pull origin main`, rulează:

```bash
bash scripts/configure-paid-acquisition.sh
```

Scriptul cere cele patru valori, le stochează în siguranță, publică ambele servicii Cloud Run și actualizează dashboard-ul comercial. Valorile secrete nu sunt afișate.

SmartBill rămâne implicit oprit în acest script. Activează facturarea live separat numai după testul final, cu `SMARTBILL_ENABLED=true SMARTBILL_MODE=live bash scripts/configure-paid-acquisition.sh`.

## 5. Proxy și WAF Cloudflare

Turnstile funcționează independent, dar WAF și rate limiting văd traficul doar după activarea proxy-ului:

1. În **Cloudflare -> DNS**, schimbă în **Proxied** (nor portocaliu) înregistrările `www` și apex care servesc site-ul. Nu modifica MX, DKIM, SPF, verificările Google sau Zoho.
2. Confirmă că site-ul și `/api/health` răspund normal. Headerul răspunsului trebuie să conțină `cf-ray`.
3. În **Security -> Security rules -> Rate limiting rules**, creează o regulă pentru metoda `POST` și căile:

```text
/api/generate
/api/generate-cover
/api/album-preview
/api/lumi
/api/narrate
/api/deliver-email
/api/orders
```

Pornește conservator cu 30 de cereri pe minut per adresă IP și blocare pentru 60 de secunde. Turnstile rămâne validarea principală pentru fiecare operațiune costisitoare; regula edge oprește rafalele înainte să ajungă în Cloud Run.

## 6. Verificare

- Deschide o adresă UTM într-o fereastră privată.
- Refuză cookie-urile opționale și confirmă că produsul și plata funcționează.
- Repetă cu accept și verifică `PageView`, `ViewContent`, `InitiateCheckout` și `Purchase` în Meta Test Events.
- Confirmă în dashboard-ul Google vizita, produsul început, intenția de checkout și achiziția pentru aceeași campanie.
- Verifică faptul că testele Stripe rămân separate de vânzările live prin `live_mode`.
