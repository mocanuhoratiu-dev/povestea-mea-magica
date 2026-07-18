# Production Setup

This project is ready to run as a production pre-commerce experience before Stripe is enabled. For production, use Vertex AI: its Gemini usage is billed through Google Cloud and can use eligible Google Cloud credits.

## Pre-Deploy Checks

Run these before every production deploy:

```bash
npm run lint
npm run build
```

## Required Environment Variables

Set these in the hosting provider:

```bash
NEXT_PUBLIC_SITE_URL=https://your-final-domain.ro
AI_PROVIDER=vertex
VERTEX_AI_PROJECT_ID=project-e0c2efff-d456-48f9-9fe
VERTEX_AI_LOCATION=global
VERTEX_AI_MODEL=gemini-2.5-flash
VERTEX_AI_FALLBACK_MODELS=gemini-2.5-flash-lite
```

The public interface currently runs as a free public beta: materials generate directly without an active payment step, while launch prices remain visible for the future commercial phase.

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain before connecting Search Console. It powers canonical URLs, Open Graph metadata, `robots.txt`, and `sitemap.xml`.

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
  --set-env-vars AI_PROVIDER=vertex,VERTEX_AI_PROJECT_ID=project-e0c2efff-d456-48f9-9fe,VERTEX_AI_LOCATION=global,VERTEX_AI_MODEL=gemini-2.5-flash
```

The health endpoint reports `ready: true` only when the active provider has both the required project/key configuration. It never exposes secret values.

## Optional Environment Variables

```bash
ELEVENLABS_API_KEY=
GENERATE_RATE_LIMIT_WINDOW_MS=3600000
GENERATE_RATE_LIMIT_MAX=5
TELEMETRY_RATE_LIMIT_WINDOW_MS=86400000
TELEMETRY_RATE_LIMIT_MAX=120
```

This enables the voice preview API. Without it, story text and PDFs still work.

The rate limit is a best-effort, per-instance Cloud Run safeguard for public beta. Before paid traffic or a multi-instance rollout, add a shared edge rate limit and configure Cloud Billing budget alerts.

## Aggregate Product Metrics

The app emits privacy-conscious, structured Cloud Run logs for visits, starts, completed generations, errors and successful PDF downloads. It never sends a child's name, story text, dedication, prompt or a customer identifier in those events. Follow [`docs/analytics.md`](analytics.md) once after deployment to create the persistent Cloud Monitoring counters.

## Parked For Stripe/Order Phase

These can stay empty until checkout and fulfillment are implemented:

```bash
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
N8N_WEBHOOK_URL=
```

Expected production health response:

```json
{
  "ready": true,
  "siteMode": "production",
  "aiProvider": "vertex",
  "checks": {
    "vertexAiProject": true,
    "vertexAiCredentials": true,
    "elevenlabsApiKey": true
  }
}
```

If `ready` is `false`, production is missing a required Vertex AI configuration value or the Cloud Run runtime identity.

## AI Provider Notes

- Vertex AI consumes Google Cloud billing and supports budgets and alerts in Cloud Billing.
- Keep `VERTEX_AI_MODEL` configurable so the model can be changed without a code deploy.
- `AI_PROVIDER=gemini` remains available for local fallback with `GEMINI_API_KEY`, but it uses AI Studio billing rather than Vertex AI.
- The app currently tries model fallbacks and then uses a local stable story fallback if all AI calls fail.

## Launch Gate Before Stripe

- Confirm `/api/health` is ready on production.
- Generate at least three stories with different ages/themes.
- Download all three PDFs from production.
- Confirm legal pages still match the no-payment production state.
- Keep Stripe variables unset until checkout and fulfillment are implemented.
