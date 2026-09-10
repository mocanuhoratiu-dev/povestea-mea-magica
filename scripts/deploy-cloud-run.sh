#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
SERVICE="${SERVICE:-povestea-mea-magica}"
REGION="${REGION:-europe-west3}"
DOMAIN_SERVICE="${DOMAIN_SERVICE:-povestea-mea-magica-domain}"
DOMAIN_REGION="${DOMAIN_REGION:-europe-west1}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com}"
SITE_URL="${SITE_URL:-https://www.povestea-mea-magica.ro}"
REQUESTED_STRIPE_ENABLED="${STRIPE_ENABLED:-}"
REQUESTED_SMARTBILL_ENABLED="${SMARTBILL_ENABLED:-}"
SMARTBILL_MODE="${SMARTBILL_MODE:-test}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-office@povestea-mea-magica.ro}"
RESEND_SECRET_NAME="${RESEND_SECRET_NAME:-pmm-resend-api-key}"
SMARTBILL_SECRET_NAME="${SMARTBILL_SECRET_NAME:-pmm-smartbill-test-token}"
REQUESTED_META_PIXEL_ID="${META_PIXEL_ID:-}"
META_CAPI_SECRET_NAME="${META_CAPI_SECRET_NAME:-pmm-meta-capi-access-token}"
REQUESTED_TURNSTILE_SITE_KEY="${TURNSTILE_SITE_KEY:-}"
TURNSTILE_SECRET_NAME="${TURNSTILE_SECRET_NAME:-pmm-turnstile-secret-key}"

read_service_env() {
  local name="$1"
  gcloud run services describe "$SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format=json \
    2>/dev/null | python3 -c 'import json, sys
name = sys.argv[1]
data = json.load(sys.stdin)
items = data.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [{}])[0].get("env", [])
print(next((item.get("value", "") for item in items if item.get("name") == name), ""))' "$name" || true
}

CURRENT_STRIPE_ENABLED="$(read_service_env NEXT_PUBLIC_STRIPE_ENABLED)"
CURRENT_SMARTBILL_ENABLED="$(read_service_env SMARTBILL_ENABLED)"
CURRENT_META_PIXEL_ID="$(read_service_env META_PIXEL_ID)"
CURRENT_TURNSTILE_SITE_KEY="$(read_service_env NEXT_PUBLIC_TURNSTILE_SITE_KEY)"

STRIPE_ENABLED="${REQUESTED_STRIPE_ENABLED:-${CURRENT_STRIPE_ENABLED:-false}}"
SMARTBILL_ENABLED="${REQUESTED_SMARTBILL_ENABLED:-${CURRENT_SMARTBILL_ENABLED:-false}}"
META_PIXEL_ID="${REQUESTED_META_PIXEL_ID:-${CURRENT_META_PIXEL_ID:-}}"
TURNSTILE_SITE_KEY="${REQUESTED_TURNSTILE_SITE_KEY:-${CURRENT_TURNSTILE_SITE_KEY:-}}"

if [[ -n "$CURRENT_STRIPE_ENABLED" && "$STRIPE_ENABLED" != "$CURRENT_STRIPE_ENABLED" && "${ALLOW_COMMERCE_CONFIG_CHANGE:-false}" != "true" ]]; then
  echo "Deploy oprit: STRIPE_ENABLED diferă de configurația live. Setează ALLOW_COMMERCE_CONFIG_CHANGE=true numai pentru o schimbare intenționată." >&2
  exit 1
fi

if [[ -n "$CURRENT_SMARTBILL_ENABLED" && "$SMARTBILL_ENABLED" != "$CURRENT_SMARTBILL_ENABLED" && "${ALLOW_COMMERCE_CONFIG_CHANGE:-false}" != "true" ]]; then
  echo "Deploy oprit: SMARTBILL_ENABLED diferă de configurația live. Setează ALLOW_COMMERCE_CONFIG_CHANGE=true numai pentru o schimbare intenționată." >&2
  exit 1
fi

deploy_service() {
  local service="$1"
  local region="$2"
  local image_uri="${3:-}"
  # Bash 3.2 treats an expansion of an empty local array as an unbound
  # variable under `set -u`. `--quiet` is a harmless sentinel and is replaced
  # whenever the corresponding secret exists.
  local resend_secret_args=(--quiet)
  local stripe_secret_args=(--quiet)
  local order_secret_args=(--quiet)
  local smartbill_secret_args=(--quiet)
  local marketing_secret_args=(--quiet)
  local turnstile_secret_args=(--quiet)
  local source_args=(--source .)
  local build_args=(--quiet --update-build-env-vars "NEXT_PUBLIC_STRIPE_ENABLED=${STRIPE_ENABLED},NEXT_PUBLIC_SUPPORT_EMAIL=${SUPPORT_EMAIL},NEXT_PUBLIC_META_PIXEL_ID=${META_PIXEL_ID},NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY}")

  if [[ -n "$image_uri" ]]; then
    source_args=(--image "$image_uri")
    # Keep one harmless argument because Bash 3.2 with `set -u` rejects an
    # expansion of an empty local array on the second (image-based) deploy.
    build_args=(--quiet)
  fi

  if gcloud secrets describe "$RESEND_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
    resend_secret_args=(--update-secrets "RESEND_API_KEY=${RESEND_SECRET_NAME}:latest")
  fi

  if gcloud secrets describe stripe-secret-key --project "$PROJECT_ID" >/dev/null 2>&1 &&
    gcloud secrets describe stripe-webhook-secret --project "$PROJECT_ID" >/dev/null 2>&1; then
    stripe_secret_args=(--update-secrets "STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest")
  fi

  if gcloud secrets describe pmm-order-access-secret --project "$PROJECT_ID" >/dev/null 2>&1 &&
    gcloud secrets describe pmm-order-worker-secret --project "$PROJECT_ID" >/dev/null 2>&1; then
    order_secret_args=(--update-secrets "ORDER_ACCESS_SECRET=pmm-order-access-secret:latest,ORDER_WORKER_SECRET=pmm-order-worker-secret:latest")
  fi

  if gcloud secrets describe "$SMARTBILL_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
    smartbill_secret_args=(--update-secrets "SMARTBILL_TOKEN=${SMARTBILL_SECRET_NAME}:latest")
  fi

  if gcloud secrets describe "$META_CAPI_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
    marketing_secret_args=(--update-secrets "META_CAPI_ACCESS_TOKEN=${META_CAPI_SECRET_NAME}:latest")
  fi

  if gcloud secrets describe "$TURNSTILE_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
    if [[ -z "$TURNSTILE_SITE_KEY" ]]; then
      echo "Turnstile are secret în Secret Manager, dar lipsește TURNSTILE_SITE_KEY. Oprire pentru a nu bloca generările." >&2
      exit 1
    fi
    turnstile_secret_args=(--update-secrets "TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_NAME}:latest")
  elif [[ -n "$TURNSTILE_SITE_KEY" ]]; then
    echo "TURNSTILE_SITE_KEY este setat, dar secretul ${TURNSTILE_SECRET_NAME} nu există în Secret Manager." >&2
    exit 1
  fi

  gcloud run deploy "$service" \
    "${source_args[@]}" \
    --project "$PROJECT_ID" \
    --region "$region" \
    --allow-unauthenticated \
    --service-account "$SERVICE_ACCOUNT" \
    --cpu 1 \
    --memory 1Gi \
    --concurrency 4 \
    --max-instances 3 \
    --timeout 1800 \
    "${build_args[@]}" \
    --update-env-vars "NEXT_PUBLIC_SITE_MODE=production,NEXT_PUBLIC_SITE_URL=${SITE_URL},NEXT_PUBLIC_STRIPE_ENABLED=${STRIPE_ENABLED},NEXT_PUBLIC_SUPPORT_EMAIL=${SUPPORT_EMAIL},EMAIL_FROM=${SUPPORT_EMAIL},EMAIL_REPLY_TO=${SUPPORT_EMAIL},NEXT_PUBLIC_META_PIXEL_ID=${META_PIXEL_ID},META_PIXEL_ID=${META_PIXEL_ID},META_CAPI_API_VERSION=${META_CAPI_API_VERSION:-v23.0},NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY},TURNSTILE_ALLOWED_HOSTNAMES=www.povestea-mea-magica.ro|povestea-mea-magica.ro,AI_PROVIDER=vertex,VERTEX_AI_PROJECT_ID=${PROJECT_ID},VERTEX_AI_LOCATION=global,VERTEX_AI_MODEL=gemini-3.5-flash,VERTEX_AI_FALLBACK_MODELS=gemini-3.1-flash-lite,VERTEX_AI_LUMI_MODEL=gemini-3.5-flash,LUMI_AI_FALLBACK_MAX_MODELS=2,VERTEX_AI_IMAGE_MODEL=gemini-3.1-flash-image,VERTEX_AI_IMAGE_FALLBACK_MODELS=,ALBUM_TEXT_TIMEOUT_MS=65000,ALBUM_IMAGE_TIMEOUT_MS=65000,ALBUM_IMAGE_MAX_ATTEMPTS=4,ALBUM_IMAGE_SOFT_FALLBACK_AFTER=2,ALBUM_IMAGE_RETRY_DELAY_MS=8000,ALBUM_PREVIEW_MAX_ATTEMPTS=3,ALBUM_PREVIEW_RETRY_DELAY_MS=1500,ALBUM_PREVIEW_RATE_LIMIT_MAX=4,ALBUM_IMAGE_PACING_MS=750,ALBUM_AI_QC_ENABLED=true,ALBUM_QC_MODEL=gemini-3.1-flash-lite,ALBUM_QC_TIMEOUT_MS=24000,ALBUM_MAX_TEXT_CALLS=2,ALBUM_MAX_IMAGE_CALLS=52,ALBUM_MAX_QC_CALLS=52,ALBUM_MAX_ESTIMATED_COST_MICROS=3200000,GOOGLE_TTS_STORY_VOICE=ro-RO-Chirp3-HD-Zephyr,GOOGLE_TTS_LUMI_VOICE=ro-RO-Chirp3-HD-Aoede,ORDER_STORAGE_BUCKET=${ORDER_STORAGE_BUCKET:-pmm-orders-${PROJECT_ID}},ORDER_TASKS_LOCATION=${REGION},ORDER_TASKS_QUEUE=pmm-order-processing,ORDER_TASKS_SERVICE_ACCOUNT=pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com,ORDER_WATCHDOG_STALE_MINUTES=${ORDER_WATCHDOG_STALE_MINUTES:-35},ORDER_WATCHDOG_MAX_RECOVERIES=${ORDER_WATCHDOG_MAX_RECOVERIES:-3},ORDER_WATCHDOG_SCAN_LIMIT=${ORDER_WATCHDOG_SCAN_LIMIT:-100},ORDER_WATCHDOG_ALERT_EMAIL=${ORDER_WATCHDOG_ALERT_EMAIL:-${SUPPORT_EMAIL}},SMARTBILL_ENABLED=${SMARTBILL_ENABLED},SMARTBILL_MODE=${SMARTBILL_MODE},SMARTBILL_USERNAME=${SMARTBILL_USERNAME:-office@povestea-mea-magica.ro},SMARTBILL_COMPANY_VAT_CODE=${SMARTBILL_COMPANY_VAT_CODE:-99999900},SMARTBILL_INVOICE_SERIES=${SMARTBILL_INVOICE_SERIES:-PMMTEST},SMARTBILL_TAX_PERCENTAGE=${SMARTBILL_TAX_PERCENTAGE:-0},SMARTBILL_TIMEOUT_MS=${SMARTBILL_TIMEOUT_MS:-15000}" \
    "${resend_secret_args[@]}" \
    "${stripe_secret_args[@]}" \
    "${order_secret_args[@]}" \
    "${smartbill_secret_args[@]}" \
    "${marketing_secret_args[@]}" \
    "${turnstile_secret_args[@]}"
}

deploy_service "$SERVICE" "$REGION"

# The Google-hosted custom-domain mapping currently routes to this service.
if [[ "$DOMAIN_SERVICE" != "$SERVICE" || "$DOMAIN_REGION" != "$REGION" ]]; then
  DEPLOYED_IMAGE="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')"
  if [[ -z "$DEPLOYED_IMAGE" ]]; then
    echo "Nu am putut identifica imaginea containerului nou." >&2
    exit 1
  fi
  deploy_service "$DOMAIN_SERVICE" "$DOMAIN_REGION" "$DEPLOYED_IMAGE"
fi

curl --fail --silent --show-error "${SITE_URL}/api/health"
