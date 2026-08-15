#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
REGION="${REGION:-europe-west3}"
BUCKET="${ORDER_STORAGE_BUCKET:-pmm-orders-${PROJECT_ID}}"
APP_SA="${SERVICE_ACCOUNT:-povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com}"
WORKER_SA="${ORDER_WORKER_SERVICE_ACCOUNT:-pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com}"

ensure_service_account() {
  if ! gcloud iam service-accounts describe "$1" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create pmm-order-worker --display-name="PMM order worker" --project="$PROJECT_ID"
  fi
}

ensure_secret() {
  if ! gcloud secrets describe "$1" --project="$PROJECT_ID" >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -d "\n" | gcloud secrets create "$1" --data-file=- --project="$PROJECT_ID"
  fi
  gcloud secrets add-iam-policy-binding "$1" --project="$PROJECT_ID" \
    --member="serviceAccount:${APP_SA}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null
}

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable firestore.googleapis.com cloudtasks.googleapis.com storage.googleapis.com secretmanager.googleapis.com --project="$PROJECT_ID"

if ! gcloud firestore databases describe --database="(default)" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud firestore databases create --database="(default)" --location="$REGION" --project="$PROJECT_ID"
fi
gcloud firestore fields ttls update expiresAt --collection-group=orders --enable-ttl --project="$PROJECT_ID"

if ! gcloud storage buckets describe "gs://${BUCKET}" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access --project="$PROJECT_ID"
fi

lifecycle_file="$(mktemp)"
trap 'rm -f "$lifecycle_file"' EXIT
printf '%s\n' '{"rule":[{"action":{"type":"Delete"},"condition":{"age":31,"matchesPrefix":["orders/"]}}]}' > "$lifecycle_file"
gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file="$lifecycle_file" --project="$PROJECT_ID"

if ! gcloud tasks queues describe pmm-order-processing --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud tasks queues create pmm-order-processing --location="$REGION" --max-attempts=5 --max-retry-duration=1h --project="$PROJECT_ID"
fi

ensure_service_account "$WORKER_SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${APP_SA}" --role="roles/datastore.user" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${APP_SA}" --role="roles/cloudtasks.enqueuer" >/dev/null
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="serviceAccount:${APP_SA}" --role="roles/storage.objectAdmin" >/dev/null

project_number="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gcloud iam service-accounts add-iam-policy-binding "$WORKER_SA" \
  --member="serviceAccount:service-${project_number}@gcp-sa-cloudtasks.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" >/dev/null

for service_region in "povestea-mea-magica:europe-west3" "povestea-mea-magica-domain:europe-west1"; do
  service="${service_region%%:*}"
  service_region_value="${service_region##*:}"
  gcloud run services add-iam-policy-binding "$service" --region="$service_region_value" --project="$PROJECT_ID" \
    --member="serviceAccount:${WORKER_SA}" --role="roles/run.invoker" >/dev/null
done

ensure_secret pmm-order-access-secret
ensure_secret pmm-order-worker-secret

for service_region in "povestea-mea-magica:europe-west3" "povestea-mea-magica-domain:europe-west1"; do
  service="${service_region%%:*}"
  service_region_value="${service_region##*:}"
  gcloud run services update "$service" --region="$service_region_value" --project="$PROJECT_ID" \
    --update-env-vars="ORDER_STORAGE_BUCKET=${BUCKET}" \
    --update-secrets="ORDER_ACCESS_SECRET=pmm-order-access-secret:latest,ORDER_WORKER_SECRET=pmm-order-worker-secret:latest"
done

printf '\nPaid-order infrastructure is ready. Bucket: gs://%s\n' "$BUCKET"
