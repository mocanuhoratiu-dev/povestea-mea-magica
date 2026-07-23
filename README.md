# Povestea Mea Magică

Produs digital Next.js în limba română: povești personalizate pentru copii, kituri anti-frică și truse rapide de activități pentru părinți.

## Status

- Modul curent: acces de lansare. Materialele se generează direct, iar prețurile sunt informative până când checkout-ul este activ.
- Plăți Stripe: intenționat amânate pentru o etapă ulterioară.
- Livrare email: PDF-ul poate fi trimis ca atașament prin Resend după configurarea domeniului expeditor și a secretului Cloud Run. Comenzile sunt încă neactivate.
- Generare AI: Vertex AI (Gemini) pentru text și Google Cloud Text-to-Speech pentru previzualizarea audio în română.
- Observabilitate: evenimente agregate fără conținut personalizat pentru vizite, generări, fallback-uri, erori și descărcări PDF. Vezi [`docs/analytics.md`](docs/analytics.md).

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
- Use a Gemini key with production quota/billing enabled.
- Verify `/api/health` returns `ready: true` after deploy.
- Generate real samples on the deployed domain and download all PDFs.
- Confirm the Resend domain, one-off email delivery and retry/error handling before enabling paid checkout.
- Add authenticated Stripe checkout, verified webhook fulfillment, server-side order persistence and email delivery together.
- Add rate limiting and stricter validation around AI endpoints.
- Add monitoring/error tracking.
- Review legal copy after payments, analytics, and data retention are finalized.

## Deploy

The production service runs on Cloud Run. See [`docs/production.md`](docs/production.md) for configuration and [`docs/cloud-run-operations.md`](docs/cloud-run-operations.md) for a step-by-step deploy, monitoring, email setup and rollback guide. From Cloud Shell, deploy with `bash scripts/deploy-cloud-run.sh`.
