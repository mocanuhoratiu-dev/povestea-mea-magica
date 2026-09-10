#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^[a-zA-Z0-9_-]{16,80}$ ]]; then
  echo "Utilizare: ./scripts/retry-paid-order.sh ORDER_ID" >&2
  exit 1
fi

ORDER_ID="$1"
PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
REGION="${REGION:-europe-west3}"
QUEUE="${ORDER_TASKS_QUEUE:-pmm-order-processing}"
SITE_URL="${SITE_URL:-https://www.povestea-mea-magica.ro}"
WORKER_SA="${ORDER_WORKER_SERVICE_ACCOUNT:-pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com}"
TASK_NAME="manual-$(date +%s)-${ORDER_ID}"

gcloud tasks create-http-task "$TASK_NAME" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --queue="$QUEUE" \
  --url="${SITE_URL%/}/api/orders/process" \
  --method=POST \
  --header="Content-Type:application/json" \
  --body-content="{\"orderId\":\"${ORDER_ID}\"}" \
  --oidc-service-account-email="$WORKER_SA" \
  --oidc-token-audience="${SITE_URL%/}"

printf '\nComanda %s a fost retrimisă controlat către procesare.\n' "$ORDER_ID"
