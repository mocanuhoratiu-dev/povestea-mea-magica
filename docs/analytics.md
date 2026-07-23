# Aggregate Analytics

The app tracks only the operational funnel needed to run the product:

- `pmm_site_visited` - one visit per browser session.
- `pmm_product_started` - a parent starts a story, Magic Kit or Emergency Kit.
- `pmm_generation_completed` - a product is ready. The event includes the product and whether it came from `ai`, `fallback`, or a local `template`.
- `pmm_generation_failed` - a server generation did not complete, with a safe error category only.
- `pmm_story_text_completed` / `pmm_story_text_failed` - primul răspuns de text pentru o poveste.
- `pmm_story_continuation_completed` / `pmm_story_continuation_failed` - fiecare completare cerută pentru o poveste mai lungă.
- `pmm_story_cover_started` / `pmm_story_cover_completed` / `pmm_story_cover_failed` - ciclul ilustrației de copertă.
- `pmm_pdf_render_started` / `pmm_pdf_render_completed` / `pmm_pdf_render_failed` - randarea locală a PDF-ului.
- `pmm_email_delivery_started` / `pmm_email_delivery_completed` / `pmm_email_delivery_failed` - livrarea prin email. Nu include niciodată adresa sau fișierul.
- `pmm_pdf_downloaded` - the browser finished building a PDF.

Events do **not** contain a child's name, age, free-form details, dedication, story body, PDF file, IP address, cookie identifier, or account identifier. Cloud Run itself may keep standard infrastructure request logs according to the Google Cloud logging configuration.

## Create the counters

Run these once from authenticated Cloud Shell after the code is deployed. Log-based metrics begin counting from their creation time; they do not backfill old events.

```bash
PROJECT_ID=project-e0c2efff-d456-48f9-9fe
BASE_FILTER='resource.type="cloud_run_revision" AND resource.labels.service_name="povestea-mea-magica"'

gcloud logging metrics create pmm_site_visits --project="$PROJECT_ID" --description="Povestea Mea Magica: site visits" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_site_visited\""
gcloud logging metrics create pmm_product_starts --project="$PROJECT_ID" --description="Povestea Mea Magica: product starts" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_product_started\""
gcloud logging metrics create pmm_story_generations --project="$PROJECT_ID" --description="Povestea Mea Magica: completed stories" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_generation_completed\" AND jsonPayload.product=\"story\""
gcloud logging metrics create pmm_monster_generations --project="$PROJECT_ID" --description="Povestea Mea Magica: completed Magic Kits" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_generation_completed\" AND jsonPayload.product=\"monster\""
gcloud logging metrics create pmm_emergency_generations --project="$PROJECT_ID" --description="Povestea Mea Magica: completed Emergency Kits" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_generation_completed\" AND jsonPayload.product=\"emergency\""
gcloud logging metrics create pmm_pdf_downloads --project="$PROJECT_ID" --description="Povestea Mea Magica: completed PDF downloads" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_pdf_downloaded\""
gcloud logging metrics create pmm_generation_errors --project="$PROJECT_ID" --description="Povestea Mea Magica: failed server generations" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_generation_failed\""
gcloud logging metrics create pmm_story_fallbacks --project="$PROJECT_ID" --description="Povestea Mea Magica: story fallback responses" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_generation_completed\" AND jsonPayload.product=\"story\" AND jsonPayload.generation_mode=\"fallback\""
gcloud logging metrics create pmm_story_text --project="$PROJECT_ID" --description="Povestea Mea Magica: initial story text responses" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_story_text_completed\""
gcloud logging metrics create pmm_story_continuations --project="$PROJECT_ID" --description="Povestea Mea Magica: story continuations" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_story_continuation_completed\""
gcloud logging metrics create pmm_story_cover_success --project="$PROJECT_ID" --description="Povestea Mea Magica: generated covers" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_story_cover_completed\""
gcloud logging metrics create pmm_story_cover_errors --project="$PROJECT_ID" --description="Povestea Mea Magica: failed covers" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_story_cover_failed\""
gcloud logging metrics create pmm_email_deliveries --project="$PROJECT_ID" --description="Povestea Mea Magica: emailed PDFs" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_email_delivery_completed\""
gcloud logging metrics create pmm_email_delivery_errors --project="$PROJECT_ID" --description="Povestea Mea Magica: failed email deliveries" --log-filter="$BASE_FILTER AND jsonPayload.event=\"pmm_email_delivery_failed\""
```

Open **Google Cloud Console -> Monitoring -> Metrics Explorer**, select `Logging/User`, then plot these metrics with a daily alignment period. A practical first dashboard has daily site visits, product starts, a chart for each product, PDF downloads, story fallbacks and generation errors. Use Logs Explorer for breakdowns by `product`, `generation_mode`, `model` or `error_code`.

## What to watch

- A widening gap between product starts and completed generations points to a UX or API problem.
- A rising `fallback` share points to Vertex AI/model availability or quota issues.
- A large gap between completed generations and `pdf_render_completed` suggests the preview or PDF-export flow needs attention.
- A high continuation count can be healthy for a long story, but repeated continuation failures mean the model output cap or model needs review.
- The gap between PDF renders and `email_deliveries` is an opt-in measure, not a conversion KPI; it only tells us whether delivery works when a parent requests it.
- `generation_errors` should stay close to zero. Check Cloud Run logs for the request timestamp, never by inspecting customer content.

## Limits

This is operational product measurement, not an order system or customer history. It does not tell us which family generated a material, and it deliberately cannot recreate a child's story. Email delivery is an explicit, one-off transactional request; its address and attachment are excluded from these events. Before adding marketing email, ad pixels, accounts, or payments, update the privacy notice and review the legal basis/consent flow with a qualified privacy professional.
