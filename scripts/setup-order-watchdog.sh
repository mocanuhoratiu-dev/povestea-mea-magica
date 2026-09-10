#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
REGION="${REGION:-europe-west3}"
JOB_NAME="${ORDER_WATCHDOG_JOB_NAME:-pmm-order-watchdog}"
SITE_URL="${SITE_URL:-https://www.povestea-mea-magica.ro}"
WORKER_SA="${ORDER_WORKER_SERVICE_ACCOUNT:-pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com}"
SCHEDULE="${ORDER_WATCHDOG_SCHEDULE:-*/10 * * * *}"

gcloud services enable cloudscheduler.googleapis.com cloudtasks.googleapis.com --project="$PROJECT_ID"

common_args=(
  --project="$PROJECT_ID"
  --location="$REGION"
  --schedule="$SCHEDULE"
  --time-zone="Europe/Bucharest"
  --uri="${SITE_URL%/}/api/orders/reconcile"
  --http-method=POST
  --message-body="{}"
  --oidc-service-account-email="$WORKER_SA"
  --oidc-token-audience="${SITE_URL%/}"
  --attempt-deadline=180s
  --max-retry-attempts=3
  --min-backoff=30s
  --max-backoff=300s
)

if gcloud scheduler jobs describe "$JOB_NAME" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "$JOB_NAME" "${common_args[@]}" --update-headers="Content-Type=application/json"
else
  gcloud scheduler jobs create http "$JOB_NAME" "${common_args[@]}" --headers="Content-Type=application/json"
fi

printf '\nWatchdog activ: %s rulează la fiecare 10 minute.\n' "$JOB_NAME"
printf 'Endpoint: %s/api/orders/reconcile\n' "${SITE_URL%/}"
