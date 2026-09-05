#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-e0c2efff-d456-48f9-9fe}"
DISPLAY_NAME="Povestea Mea Magica - Comercial"
API_ROOT="https://monitoring.googleapis.com/v1/projects/${PROJECT_ID}/dashboards"
CONFIG="$(mktemp)"
LISTING="$(mktemp)"
trap 'rm -f "$CONFIG" "$LISTING"' EXIT

metric_filter() {
  printf 'metric.type="logging.googleapis.com/user/%s" resource.type="cloud_run_revision"' "$1"
}

scorecard() {
  local title="$1"
  local metric="$2"
  jq -n --arg title "$title" --arg filter "$(metric_filter "$metric")" '{
    title: $title,
    scorecard: {
      timeSeriesQuery: {
        outputFullDuration: true,
        timeSeriesFilter: {filter: $filter, aggregation: {perSeriesAligner: "ALIGN_SUM", crossSeriesReducer: "REDUCE_SUM"}}
      },
      blankView: {}
    }
  }'
}

xy_dataset() {
  local metric="$1"
  local legend="$2"
  jq -n --arg filter "$(metric_filter "$metric")" --arg legend "$legend" '{
    timeSeriesQuery: {timeSeriesFilter: {filter: $filter, aggregation: {alignmentPeriod: "3600s", perSeriesAligner: "ALIGN_SUM", crossSeriesReducer: "REDUCE_SUM", groupByFields: ["metric.label.\"product\"", "metric.label.\"live_mode\""]}}},
    plotType: "LINE",
    legendTemplate: $legend
  }'
}

CHECKOUT_SCORE="$(scorecard "Checkout-uri incepute" "pmm_checkout_starts")"
PAYMENT_SCORE="$(scorecard "Plati reusite" "pmm_payments_succeeded")"
DELIVERY_SCORE="$(scorecard "Livrari finalizate" "pmm_orders_delivered")"
FAILURE_SCORE="$(scorecard "Plati esuate" "pmm_payment_failures")"
REVIEW_SCORE="$(scorecard "Recenzii verificate primite" "pmm_verified_reviews")"
CTA_SCORE="$(scorecard "CTA Povestea Magica" "pmm_album_product_ctas")"
CHECKOUT_SERIES="$(xy_dataset "pmm_checkout_starts" 'Checkout - ${metric.labels.product} - live:${metric.labels.live_mode}')"
CONVERSION_SERIES="$(xy_dataset "pmm_conversions" 'Conversie - ${metric.labels.product} - live:${metric.labels.live_mode}')"
DELIVERY_SERIES="$(xy_dataset "pmm_orders_delivered" 'Livrare - ${metric.labels.product} - live:${metric.labels.live_mode}')"
FAILURE_SERIES="$(xy_dataset "pmm_payment_failures" 'Esec plata - ${metric.labels.product} - live:${metric.labels.live_mode}')"
PROMO_SERIES="$(xy_dataset "pmm_promotion_uses" 'Reducere - ${metric.labels.product} - live:${metric.labels.live_mode}')"

jq -n \
  --arg displayName "$DISPLAY_NAME" \
  --argjson checkoutScore "$CHECKOUT_SCORE" \
  --argjson paymentScore "$PAYMENT_SCORE" \
  --argjson deliveryScore "$DELIVERY_SCORE" \
  --argjson failureScore "$FAILURE_SCORE" \
  --argjson reviewScore "$REVIEW_SCORE" \
  --argjson ctaScore "$CTA_SCORE" \
  --argjson checkoutSeries "$CHECKOUT_SERIES" \
  --argjson conversionSeries "$CONVERSION_SERIES" \
  --argjson deliverySeries "$DELIVERY_SERIES" \
  --argjson failureSeries "$FAILURE_SERIES" \
  --argjson promoSeries "$PROMO_SERIES" \
  '{
    displayName: $displayName,
    mosaicLayout: {
      columns: 48,
      tiles: [
        {xPos: 0, yPos: 0, width: 8, height: 6, widget: $ctaScore},
        {xPos: 8, yPos: 0, width: 8, height: 6, widget: $checkoutScore},
        {xPos: 16, yPos: 0, width: 8, height: 6, widget: $paymentScore},
        {xPos: 24, yPos: 0, width: 8, height: 6, widget: $deliveryScore},
        {xPos: 32, yPos: 0, width: 8, height: 6, widget: $failureScore},
        {xPos: 40, yPos: 0, width: 8, height: 6, widget: $reviewScore},
        {xPos: 0, yPos: 6, width: 32, height: 14, widget: {title: "Checkout vs conversii per produs", xyChart: {dataSets: [$checkoutSeries, $conversionSeries], timeshiftDuration: "0s", yAxis: {label: "Evenimente", scale: "LINEAR"}, chartOptions: {mode: "COLOR"}}}},
        {xPos: 32, yPos: 6, width: 16, height: 14, widget: {title: "Livrari finalizate", xyChart: {dataSets: [$deliverySeries], yAxis: {label: "Livrari", scale: "LINEAR"}, chartOptions: {mode: "COLOR"}}}},
        {xPos: 0, yPos: 20, width: 24, height: 12, widget: {title: "Plati esuate", xyChart: {dataSets: [$failureSeries], yAxis: {label: "Erori", scale: "LINEAR"}, chartOptions: {mode: "COLOR"}}}},
        {xPos: 24, yPos: 20, width: 24, height: 12, widget: {title: "Coduri promotionale folosite", xyChart: {dataSets: [$promoSeries], yAxis: {label: "Utilizari", scale: "LINEAR"}, chartOptions: {mode: "COLOR"}}}}
      ]
    }
  }' > "$CONFIG"

TOKEN="$(gcloud auth print-access-token)"
curl --fail-with-body --silent --show-error -H "Authorization: Bearer ${TOKEN}" "$API_ROOT?pageSize=100" > "$LISTING"
EXISTING="$(jq -r --arg displayName "$DISPLAY_NAME" '.dashboards[]? | select(.displayName == $displayName) | .name' "$LISTING" | head -n 1)"

if [[ -n "$EXISTING" ]]; then
  EXISTING_ETAG="$(jq -r --arg name "$EXISTING" '.dashboards[]? | select(.name == $name) | .etag' "$LISTING" | head -n 1)"
  jq --arg name "$EXISTING" --arg etag "$EXISTING_ETAG" '. + {name: $name, etag: $etag}' "$CONFIG" > "${CONFIG}.update"
  if ! UPDATE_RESPONSE="$(curl --fail-with-body --silent --show-error -X PATCH -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" --data-binary "@${CONFIG}.update" "https://monitoring.googleapis.com/v1/${EXISTING}")"; then
    printf '%s\n' "$UPDATE_RESPONSE" >&2
    exit 1
  fi
  rm -f "${CONFIG}.update"
  echo "Dashboard actualizat: ${EXISTING}"
else
  CREATED="$(curl --fail-with-body --silent --show-error -X POST -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" --data-binary "@${CONFIG}" "$API_ROOT")"
  echo "Dashboard creat: $(jq -r '.name' <<<"$CREATED")"
fi
