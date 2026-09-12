#!/usr/bin/env bash
set -euo pipefail
PROJECT="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
REGION="europe-west3"
SITE="https://www.povestea-mea-magica.ro"
APP_SA="povestea-mea-magica-ai@${PROJECT}.iam.gserviceaccount.com"
WORKER_SA="pmm-order-worker@${PROJECT}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$APP_SA" --role=roles/logging.viewer --condition=None --quiet > /dev/null
if gcloud scheduler jobs describe pmm-daily-report --project="$PROJECT" --location="$REGION" > /dev/null 2>&1; then
  ACTION=update
else
  ACTION=create
fi
gcloud scheduler jobs "$ACTION" http pmm-daily-report \
  --project="$PROJECT" --location="$REGION" \
  --schedule='0 9 * * *' --time-zone=Europe/Bucharest \
  --uri="$SITE/api/reports/daily" --http-method=POST \
  --oidc-service-account-email="$WORKER_SA" --oidc-token-audience="$SITE" \
  --attempt-deadline=320s --max-retry-attempts=4 --max-retry-duration=21600s \
  --min-backoff=300s --max-backoff=3600s \
  --description='Previous Bucharest day aggregates only; Resend to office@povestea-mea-magica.ro; Stripe test separated.'
