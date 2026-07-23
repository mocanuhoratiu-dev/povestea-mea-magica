# Production Setup

This project is ready to run as a production launch-access experience before Stripe is enabled. For production, use Vertex AI: its Gemini usage is billed through Google Cloud and can use eligible Google Cloud credits.

## Pre-Deploy Checks

Run these before every production deploy:

```bash
npm run lint
npm run build
```

## Required Environment Variables

Set these in the hosting provider:

```bash
NEXT_PUBLIC_SITE_URL=https://www.povestea-mea-magica.ro
AI_PROVIDER=vertex
VERTEX_AI_PROJECT_ID=project-e0c2efff-d456-48f9-9fe
VERTEX_AI_LOCATION=global
VERTEX_AI_MODEL=gemini-2.5-flash
VERTEX_AI_FALLBACK_MODELS=gemini-2.5-flash-lite
VERTEX_AI_IMAGE_MODEL=gemini-2.5-flash-image
GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr
GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede
AI_GENERATION_BUDGET_MS=55000
AI_MODEL_TIMEOUT_MS=35000
AI_FALLBACK_MAX_MODELS=2
VERTEX_AI_COVER_TIMEOUT_MS=35000
VERTEX_AI_LUMI_TIMEOUT_MS=18000
```

The public interface currently runs with launch access: materials generate directly without an active payment step, while commercial prices remain visible for the future paid phase.

Set `NEXT_PUBLIC_SITE_URL` to `https://www.povestea-mea-magica.ro` before deploying. It powers canonical URLs, Open Graph metadata, `robots.txt`, `sitemap.xml` and transactional emails. The application redirects both the apex domain and the direct Cloud Run URL to this primary address.

Deploy the app to Cloud Run and attach the dedicated service account to the service. Cloud Run supplies Application Default Credentials automatically, so no service-account JSON key is stored in Git or in the application environment.

### Vertex AI setup

1. In Google Cloud, select `project-e0c2efff-d456-48f9-9fe` and confirm that its billing account has the available promotional credits.
2. Enable the Vertex AI API in **APIs & Services**.
3. Go to **IAM & Admin -> Service Accounts**, create `povestea-mea-magica-ai` and grant it **Agent Platform User** / **Vertex AI User** (`roles/aiplatform.user`).
4. Do not create a service-account JSON key. The current project policy blocks it, and Cloud Run does not need one.
5. For local development, keep the stable fallback enabled or run short authenticated tests in Cloud Shell. The production app will use Cloud Run's runtime identity.

### Cloud Run deploy flow

From Cloud Shell, after the repository is available there:

```bash
gcloud run deploy povestea-mea-magica \
  --source . \
  --region europe-west3 \
  --service-account povestea-mea-magica-ai@project-e0c2efff-d456-48f9-9fe.iam.gserviceaccount.com \
  --concurrency 4 \
  --max-instances 3 \
  --timeout 120 \
  --set-env-vars NEXT_PUBLIC_SITE_URL=https://www.povestea-mea-magica.ro,AI_PROVIDER=vertex,VERTEX_AI_PROJECT_ID=project-e0c2efff-d456-48f9-9fe,VERTEX_AI_LOCATION=global,VERTEX_AI_MODEL=gemini-2.5-flash,VERTEX_AI_IMAGE_MODEL=gemini-2.5-flash-image,GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr,GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede
```

The health endpoint reports `ready: true` only when the active provider has both the required project/key configuration. It never exposes secret values.

## Optional Environment Variables

```bash
GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr
GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede
AI_GENERATION_BUDGET_MS=55000
AI_MODEL_TIMEOUT_MS=35000
AI_FALLBACK_MAX_MODELS=2
VERTEX_AI_COVER_TIMEOUT_MS=35000
VERTEX_AI_LUMI_TIMEOUT_MS=18000
GENERATE_RATE_LIMIT_WINDOW_MS=3600000
GENERATE_RATE_LIMIT_MAX=5
TELEMETRY_RATE_LIMIT_WINDOW_MS=86400000
TELEMETRY_RATE_LIMIT_MAX=120
```

Cloud Text-to-Speech folosește service account-ul Cloud Run. Vocile de mai sus sunt valorile implicite și pot fi schimbate fără modificarea codului.

The rate limit is a best-effort, per-instance Cloud Run safeguard for public beta. The deployment script also caps the service at three instances and four concurrent requests per instance, so a burst cannot grow AI costs without bound. Before paid acquisition or a multi-instance rollout, add a shared edge rate limit in Cloudflare and configure Cloud Billing budget alerts.

## Aggregate Product Metrics

The app emits privacy-conscious, structured Cloud Run logs for visits, starts, completed generations, errors and successful PDF downloads. It never sends a child's name, story text, dedication, prompt or a customer identifier in those events. Follow [`docs/analytics.md`](analytics.md) once after deployment to create the persistent Cloud Monitoring counters.

## One-off PDF Email Delivery

The browser renders the PDF, then the server sends it through Resend as a single transactional attachment. The app does not persist the PDF or address and deliberately excludes both from telemetry. Verify an expeditor domain in Resend, store `RESEND_API_KEY` in Cloud Secret Manager and configure `EMAIL_FROM` on Cloud Run. The exact no-guesswork steps are in [`docs/cloud-run-operations.md`](cloud-run-operations.md).

## Parked For Stripe/Order Phase

These can stay empty until checkout and fulfillment are implemented:

```bash
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
N8N_WEBHOOK_URL=
```

Public production health response:

```json
{
  "ready": true,
  "siteMode": "production",
  "timestamp": "2026-07-23T00:00:00.000Z"
}
```

If `ready` is `false`, production is missing a required Vertex AI configuration value or the Cloud Run runtime identity. To expose the detailed checks only to an operator, set `HEALTHCHECK_TOKEN` in Cloud Run and send it in the `x-healthcheck-token` request header.

## AI Provider Notes

- Vertex AI consumes Google Cloud billing and supports budgets and alerts in Cloud Billing.
- Story text uses `VERTEX_AI_MODEL`; covers use `VERTEX_AI_IMAGE_MODEL`. Keep both configurable so a model can be changed without a code deploy.
- The cover is returned only as a temporary browser data URL and is not stored in Cloud Storage. If Vertex is temporarily unavailable, the browser uses Pollinations only for a generic cover prompt without the child's name, age, or free-form details.
- `AI_PROVIDER=gemini` remains available for local fallback with `GEMINI_API_KEY`, but it uses AI Studio billing rather than Vertex AI.
- The app currently tries model fallbacks and then uses a local stable story fallback if all AI calls fail.
- Each text model has a bounded response time and each request has a total time budget. A long story gets at most one continuation attempt; an incomplete result switches to the complete stable story instead of keeping the parent waiting.
- PDF rendering uses locally bundled `jspdf` and `html2canvas`, not external scripts loaded at download time.

## Launch Gate Before Stripe

- Confirm `/api/health` is ready on production.
- Generate at least three stories with different ages/themes.
- Download all three PDFs from production.
- Collect and review real parent feedback. Only publish a quote when the family has explicitly agreed.
- Confirm legal pages still match the no-payment production state.
- Add legal business identity and a support response commitment to the public legal/contact surfaces.
- Implement an authenticated Stripe Checkout Session endpoint. Never expose a secret key to the browser.
- Persist a minimal server-side order record before fulfillment, then verify every Stripe webhook signature before granting access or sending a receipt.
- Confirm the Resend domain, delivery flow and retry/error handling before switching `commerce.acceptsPayments` to `true`.
- Test Stripe test mode from payment through receipt, PDF access, cancellation and support handling.
- Keep Stripe variables unset until the complete checkout and fulfillment flow is implemented.
