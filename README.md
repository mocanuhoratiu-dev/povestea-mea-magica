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

- `GEMINI_API_KEY` for story, monster-kit, and emergency-kit generation.
- `ELEVENLABS_API_KEY` for the voice preview API.

Deschide [http://localhost:3010](http://localhost:3010).

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Production Checklist

- Add authenticated Stripe checkout and verified webhook fulfillment.
- Add rate limiting and stricter validation around AI endpoints.
- Add server-side order persistence and email delivery.
- Add monitoring/error tracking.
- Review legal copy after payments, analytics, and data retention are finalized.

## Deploy

The app is deployable on Vercel or any platform that supports Next.js App Router. Add the required environment variables before enabling AI features.
