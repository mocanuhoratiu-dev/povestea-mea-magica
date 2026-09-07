#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
SERVICE="${SERVICE:-povestea-mea-magica}"
REGION="${REGION:-europe-west3}"
META_CAPI_SECRET_NAME="${META_CAPI_SECRET_NAME:-pmm-meta-capi-access-token}"
TURNSTILE_SECRET_NAME="${TURNSTILE_SECRET_NAME:-pmm-turnstile-secret-key}"

CURRENT_SERVICE="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format=json 2>/dev/null || printf '{}')"
current_env() {
  jq -r --arg name "$1" '.spec.template.spec.containers[0].env[]? | select(.name == $name) | .value // empty' <<<"$CURRENT_SERVICE" | head -n 1
}
STRIPE_ENABLED="${STRIPE_ENABLED:-$(current_env NEXT_PUBLIC_STRIPE_ENABLED)}"
SMARTBILL_ENABLED="${SMARTBILL_ENABLED:-$(current_env SMARTBILL_ENABLED)}"
SMARTBILL_MODE="${SMARTBILL_MODE:-$(current_env SMARTBILL_MODE)}"
STRIPE_ENABLED="${STRIPE_ENABLED:-true}"
SMARTBILL_ENABLED="${SMARTBILL_ENABLED:-false}"
SMARTBILL_MODE="${SMARTBILL_MODE:-test}"

if [[ -z "${META_PIXEL_ID:-}" ]]; then
  read -r -p "Meta Pixel ID: " META_PIXEL_ID
fi
if [[ -z "${TURNSTILE_SITE_KEY:-}" ]]; then
  read -r -p "Cloudflare Turnstile site key: " TURNSTILE_SITE_KEY
fi
if [[ -z "${META_CAPI_ACCESS_TOKEN:-}" ]]; then
  read -r -s -p "Meta Conversions API access token: " META_CAPI_ACCESS_TOKEN
  printf '\n'
fi
if [[ -z "${TURNSTILE_SECRET_KEY:-}" ]]; then
  read -r -s -p "Cloudflare Turnstile secret key: " TURNSTILE_SECRET_KEY
  printf '\n'
fi

for value in META_PIXEL_ID TURNSTILE_SITE_KEY META_CAPI_ACCESS_TOKEN TURNSTILE_SECRET_KEY; do
  if [[ -z "${!value}" ]]; then
    echo "Lipsește ${value}. Configurarea a fost oprită." >&2
    exit 1
  fi
done

upsert_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --project "$PROJECT_ID" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --project "$PROJECT_ID" --replication-policy=automatic --data-file=- >/dev/null
  fi
}

upsert_secret "$META_CAPI_SECRET_NAME" "$META_CAPI_ACCESS_TOKEN"
upsert_secret "$TURNSTILE_SECRET_NAME" "$TURNSTILE_SECRET_KEY"

META_PIXEL_ID="$META_PIXEL_ID" \
TURNSTILE_SITE_KEY="$TURNSTILE_SITE_KEY" \
STRIPE_ENABLED="$STRIPE_ENABLED" \
SMARTBILL_ENABLED="$SMARTBILL_ENABLED" \
SMARTBILL_MODE="$SMARTBILL_MODE" \
bash scripts/deploy-cloud-run.sh

bash scripts/setup-commercial-telemetry.sh
bash scripts/setup-commercial-dashboard.sh

echo "Tracking-ul de campanie, Meta Pixel/CAPI și Turnstile sunt activate."
