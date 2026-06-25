# Povestea Mea Magică

Demo Next.js pentru un produs digital în limba română: povești personalizate pentru copii, kituri anti-frică și truse rapide de activități pentru părinți.

## Status

- Modul curent: demo interactiv.
- Plăți Stripe: intenționat amânate pentru o etapă ulterioară.
- Livrare email/comenzi: neactivată încă.
- Generare AI: Gemini pentru text, ElevenLabs pentru previzualizare audio.

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

- `GEMINI_API_KEY` for AI story generation.
- `GEMINI_MODEL` and `GEMINI_FALLBACK_MODELS` to control Gemini model fallback without code changes.
- `ELEVENLABS_API_KEY` for the optional voice preview API.

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
- Add server-side order persistence and email delivery.
- Add authenticated Stripe checkout and verified webhook fulfillment.
- Add rate limiting and stricter validation around AI endpoints.
- Add monitoring/error tracking.
- Review legal copy after payments, analytics, and data retention are finalized.

## Deploy

The app is deployable on Vercel or any platform that supports Next.js App Router. See [`docs/production.md`](docs/production.md) for the production environment setup.
