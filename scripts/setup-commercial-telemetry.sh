#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
METRIC_CONFIG="$(mktemp)"
trap 'rm -f "$METRIC_CONFIG"' EXIT

BASE_FILTER='resource.type="cloud_run_revision" AND (resource.labels.service_name="povestea-mea-magica" OR resource.labels.service_name="povestea-mea-magica-domain")'

upsert_metric() {
  local name="$1"
  local description="$2"
  local event="$3"
  local promotion_label="${4:-false}"

  jq -n \
    --arg project "$PROJECT_ID" \
    --arg name "$name" \
    --arg description "$description" \
    --arg filter "$BASE_FILTER AND jsonPayload.event=\"$event\"" \
    --argjson promotionLabel "$promotion_label" \
    '{
      description: $description,
      filter: $filter,
      metricDescriptor: {
        name: ("projects/" + $project + "/metricDescriptors/logging.googleapis.com/user/" + $name),
        type: ("logging.googleapis.com/user/" + $name),
        metricKind: "DELTA",
        valueType: "INT64",
        unit: "1",
        labels: ([
          {key: "product", valueType: "STRING", description: "Produs comercial agregat"},
          {key: "live_mode", valueType: "BOOL", description: "Separă Stripe test de Stripe live"}
        ] + if $promotionLabel then [
          {key: "promotion_code", valueType: "STRING", description: "Cod promoțional validat"}
        ] else [] end)
      },
      labelExtractors: ({
        product: "EXTRACT(jsonPayload.product)",
        live_mode: "EXTRACT(jsonPayload.live_mode)"
      } + if $promotionLabel then {
        promotion_code: "EXTRACT(jsonPayload.promotion_code)"
      } else {} end)
    }' > "$METRIC_CONFIG"

  if gcloud logging metrics describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud logging metrics update "$name" --project="$PROJECT_ID" --config-from-file="$METRIC_CONFIG"
  else
    gcloud logging metrics create "$name" --project="$PROJECT_ID" --config-from-file="$METRIC_CONFIG"
  fi
}

upsert_metric "pmm_checkout_starts" "Checkout-uri Stripe începute" "pmm_checkout_started"
upsert_metric "pmm_checkout_expired" "Checkout-uri Stripe expirate fără conversie" "pmm_checkout_expired"
upsert_metric "pmm_payments_succeeded" "Plăți Stripe reușite" "pmm_payment_succeeded"
upsert_metric "pmm_payment_failures" "Plăți Stripe eșuate" "pmm_payment_failed"
upsert_metric "pmm_promotion_uses" "Comenzi cu reducere aplicată" "pmm_promotion_applied" true
upsert_metric "pmm_conversions" "Comenzi comerciale confirmate" "pmm_conversion_completed"
upsert_metric "pmm_orders_delivered" "Comenzi livrate complet" "pmm_order_delivered"

echo "Telemetria comercială este configurată pentru proiectul ${PROJECT_ID}."
