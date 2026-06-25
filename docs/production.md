# Production Setup

This project is ready to run as a production demo before Stripe is enabled. The main production risk is AI provider availability: free Gemini quota can return high-demand or quota errors, so production should use a Gemini key with billing/quota enabled.

## Pre-Deploy Checks

Run these before every production deploy:

```bash
npm run lint
npm run build
```

## Required Environment Variables

Set these in the hosting provider for Production and Preview environments:

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.0-flash
```

`GEMINI_API_KEY` is required for real AI story generation. The app has a local fallback story path, but paying customers should not depend on it.

## Optional Environment Variables

```bash
ELEVENLABS_API_KEY=
```

This enables the voice preview API. Without it, story text and PDFs still work.

## Parked For Stripe/Order Phase

These can stay empty until checkout and fulfillment are implemented:

```bash
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
N8N_WEBHOOK_URL=
```

## Vercel Deploy Flow

1. Import the GitHub repository in Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Add the environment variables above in Project Settings -> Environment Variables.
6. Deploy.
7. Open `/api/health` on the deployed domain.

Expected production health response:

```json
{
  "ready": true,
  "checks": {
    "geminiApiKey": true,
    "elevenlabsApiKey": true
  }
}
```

If `ready` is `false`, production is missing the Gemini key.

## AI Provider Notes

- Free Gemini keys can fail with high demand or quota errors.
- For production, enable billing/quota on the Google AI project or switch to a provider with stable quota.
- Keep `GEMINI_MODEL` configurable so the model can be changed without a code deploy.
- The app currently tries model fallbacks and then uses a local stable story fallback if all AI calls fail.

## Launch Gate Before Stripe

- Confirm `/api/health` is ready on production.
- Generate at least three stories with different ages/themes.
- Download all three PDFs from production.
- Confirm legal pages still match the no-payment/demo state.
- Keep Stripe variables unset until checkout and fulfillment are implemented.
