#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-office@povestea-mea-magica.ro}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com}"
SECRET_NAME="${RESEND_SECRET_NAME:-pmm-resend-api-key}"

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  read -rsp "Resend API key: " RESEND_API_KEY
  echo
fi

if [[ -z "$RESEND_API_KEY" ]]; then
  echo "Resend API key lipsa." >&2
  exit 1
fi

gcloud config set project "$PROJECT_ID" >/dev/null

if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  printf '%s' "$RESEND_API_KEY" | gcloud secrets versions add "$SECRET_NAME" --project="$PROJECT_ID" --data-file=- >/dev/null
else
  printf '%s' "$RESEND_API_KEY" | gcloud secrets create "$SECRET_NAME" --project="$PROJECT_ID" --data-file=- >/dev/null
fi
unset RESEND_API_KEY

gcloud secrets add-iam-policy-binding "$SECRET_NAME" --project="$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

for service_region in "povestea-mea-magica:europe-west3" "povestea-mea-magica-domain:europe-west1"; do
  service="${service_region%%:*}"
  region="${service_region##*:}"
  gcloud run services update "$service" --project="$PROJECT_ID" --region="$region" \
    --update-secrets="RESEND_API_KEY=${SECRET_NAME}:latest" \
    --update-env-vars="EMAIL_FROM=${SUPPORT_EMAIL},EMAIL_REPLY_TO=${SUPPORT_EMAIL}"
done

printf '\nResend este configurat pentru %s. Trimite un email de test din site dupa ce adresa este verificata in Resend.\n' "$SUPPORT_EMAIL"
