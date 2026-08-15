#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
SERVICE="${SERVICE:-povestea-mea-magica}"
REGION="${REGION:-europe-west3}"
DOMAIN_SERVICE="${DOMAIN_SERVICE:-povestea-mea-magica-domain}"
DOMAIN_REGION="${DOMAIN_REGION:-europe-west1}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com}"
SITE_URL="${SITE_URL:-https://www.povestea-mea-magica.ro}"
STRIPE_ENABLED="${STRIPE_ENABLED:-false}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-office@povestea-mea-magica.ro}"
RESEND_SECRET_NAME="${RESEND_SECRET_NAME:-pmm-resend-api-key}"

deploy_service() {
  local service="$1"
  local region="$2"
  local resend_secret_args=()

  if gcloud secrets describe "$RESEND_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
    resend_secret_args=(--update-secrets "RESEND_API_KEY=${RESEND_SECRET_NAME}:latest")
  fi

  gcloud run deploy "$service" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$region" \
    --allow-unauthenticated \
    --service-account "$SERVICE_ACCOUNT" \
    --concurrency 4 \
    --max-instances 3 \
    --timeout 120 \
    --update-build-env-vars "NEXT_PUBLIC_STRIPE_ENABLED=${STRIPE_ENABLED},NEXT_PUBLIC_SUPPORT_EMAIL=${SUPPORT_EMAIL}" \
    --update-env-vars "NEXT_PUBLIC_SITE_MODE=production,NEXT_PUBLIC_SITE_URL=${SITE_URL},NEXT_PUBLIC_STRIPE_ENABLED=${STRIPE_ENABLED},NEXT_PUBLIC_SUPPORT_EMAIL=${SUPPORT_EMAIL},EMAIL_FROM=${SUPPORT_EMAIL},EMAIL_REPLY_TO=${SUPPORT_EMAIL},AI_PROVIDER=vertex,VERTEX_AI_PROJECT_ID=${PROJECT_ID},VERTEX_AI_LOCATION=global,VERTEX_AI_MODEL=gemini-3.5-flash,VERTEX_AI_FALLBACK_MODELS=gemini-3.1-flash-lite,VERTEX_AI_LUMI_MODEL=gemini-3.5-flash,LUMI_AI_FALLBACK_MAX_MODELS=2,VERTEX_AI_IMAGE_MODEL=gemini-3.1-flash-image,VERTEX_AI_IMAGE_FALLBACK_MODELS=,GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr,GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede,ORDER_STORAGE_BUCKET=${ORDER_STORAGE_BUCKET:-pmm-orders-${PROJECT_ID}},ORDER_TASKS_LOCATION=${REGION},ORDER_TASKS_QUEUE=pmm-order-processing,ORDER_TASKS_SERVICE_ACCOUNT=pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com" \
    "${resend_secret_args[@]}"
}

deploy_service "$SERVICE" "$REGION"

# The Google-hosted custom-domain mapping currently routes to this service.
if [[ "$DOMAIN_SERVICE" != "$SERVICE" || "$DOMAIN_REGION" != "$REGION" ]]; then
  deploy_service "$DOMAIN_SERVICE" "$DOMAIN_REGION"
fi

curl --fail --silent --show-error "${SITE_URL}/api/health"
