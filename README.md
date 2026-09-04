# Povestea Mea Magică

Produs digital Next.js în limba română: povești personalizate pentru copii, kituri anti-frică și truse rapide de activități pentru părinți.

## Status

- Modul curent: producție cu catalog comercial și personalizare înainte de checkout.
- Plăți Stripe: Checkout găzduit, coduri promoționale și webhook semnat pentru livrare asincronă.
- Livrare email: comenzile plătite sunt generate prin Cloud Tasks și livrate prin Resend cu link privat valabil 30 de zile.
- Facturare: SmartBill rulează asincron după Stripe, separat de livrarea materialului, cu blocare strictă între mediile test și live.
- Generare AI: Vertex AI (Gemini) pentru text și imagini, control vizual automat și Google Cloud Text-to-Speech pentru audio în română.
- Album premium: Story Bible V3, Character Lock din descriere sau fotografie opțională, preview înainte de plată, flipbook privat și două PDF-uri A5 landscape.
- Observabilitate: evenimente agregate fără conținut personalizat pentru vizite, generări, fallback-uri, erori și descărcări PDF. Vezi [`docs/analytics.md`](docs/analytics.md).
- Domeniu principal: `https://www.povestea-mea-magica.ro`; domeniul fără `www` și URL-ul Cloud Run se redirecționează aici în producție.
- PDF: exportul folosește biblioteci incluse în aplicație, fără scripturi externe încărcate în momentul descărcării.

## Getting Started

Instalează dependențele și pornește serverul local:

```bash
npm install
npm run dev
```

Configurează variabilele locale înainte de folosirea funcțiilor AI:

```bash
cp .env.example .env.local
```

Completează:

- `NEXT_PUBLIC_SITE_MODE` as `demo` locally or `production` on the public site.
- `AI_PROVIDER=vertex` pentru Vertex AI, care consumă facturarea/creditele Google Cloud.
- `VERTEX_AI_PROJECT_ID` și `VERTEX_AI_LOCATION` pentru Vertex AI. În Cloud Run, aplicația folosește automat identitatea service account-ului; pentru dezvoltare locală, vezi `docs/production.md`.
- `GEMINI_API_KEY` rămâne disponibil doar ca fallback pentru Gemini Developer API / AI Studio.
- Cloud Run folosește identitatea sa Google Cloud și pentru previzualizarea audio: Zephyr pentru poveste, Aoede pentru Lumi. Nu este necesară o cheie audio separată.
- Pentru livrare email locală, completează `RESEND_API_KEY` și `EMAIL_FROM`; în producție, folosește Secret Manager, conform ghidului de operare.

Deschide [http://localhost:3010](http://localhost:3010).

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Production Checklist

- Configure production environment variables from `.env.example`.
- Confirmă quota și billing Vertex AI pentru modelele text, imagine și control vizual.
- Verify `/api/health` returns `ready: true` after deploy.
- Generate real samples on the deployed domain and download all PDFs.
- Confirm the Resend domain, one-off email delivery and retry/error handling before enabling paid checkout.
- Confirmă separat o comandă Stripe + SmartBill în test și în live înainte de trafic plătit.
- Verifică regulile Cloudflare WAF/Turnstile și limitele endpointurilor înainte de trafic mare.
- Urmărește alertele Cloud Run/Vertex și plafonul de cost al albumelor.
- Verifică periodic ciclul Firestore/Cloud Storage de 24 de ore pentru drafturi și 31 de zile pentru comenzi.

## Deploy

The production service runs on Cloud Run. See [`docs/production.md`](docs/production.md) for configuration and [`docs/cloud-run-operations.md`](docs/cloud-run-operations.md) for a step-by-step deploy, monitoring, email setup and rollback guide. From Cloud Shell, deploy with `bash scripts/deploy-cloud-run.sh`.
