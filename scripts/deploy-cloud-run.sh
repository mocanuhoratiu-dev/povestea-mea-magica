#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
SERVICE="${SERVICE:-povestea-mea-magica}"
REGION="${REGION:-europe-west3}"
DOMAIN_SERVICE="${DOMAIN_SERVICE:-povestea-mea-magica-domain}"
DOMAIN_REGION="${DOMAIN_REGION:-europe-west1}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com}"
SITE_URL="${SITE_URL:-https://www.povestea-mea-magica.ro}"

deploy_service() {
  local service="$1"
  local region="$2"

  gcloud run deploy "$service" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$region" \
    --allow-unauthenticated \
    --service-account "$SERVICE_ACCOUNT" \
    --concurrency 4 \
    --max-instances 3 \
    --timeout 120 \
    --update-env-vars "NEXT_PUBLIC_SITE_MODE=production,NEXT_PUBLIC_SITE_URL=${SITE_URL},AI_PROVIDER=vertex,VERTEX_AI_PROJECT_ID=${PROJECT_ID},VERTEX_AI_LOCATION=global,VERTEX_AI_MODEL=gemini-2.5-flash,VERTEX_AI_FALLBACK_MODELS=gemini-2.5-flash-lite,VERTEX_AI_IMAGE_MODEL=gemini-2.5-flash-image,GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr,GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede"
}

deploy_service "$SERVICE" "$REGION"

# The Google-hosted custom-domain mapping currently routes to this service.
if [[ "$DOMAIN_SERVICE" != "$SERVICE" || "$DOMAIN_REGION" != "$REGION" ]]; then
  deploy_service "$DOMAIN_SERVICE" "$DOMAIN_REGION"
fi

curl --fail --silent --show-error "${SITE_URL}/api/health"
