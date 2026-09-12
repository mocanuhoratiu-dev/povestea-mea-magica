# Vertex fallback implementation

Implemented 2026-09-12. Voice and narration are unchanged.

## Chains

- Text and Lumi: gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-3.1-pro-preview.
- Images: gemini-3.1-flash-image -> gemini-3-pro-image -> gemini-3.1-flash-lite-image.
- QC: gemini-3.1-flash-lite -> gemini-3.5-flash -> gemini-3.1-pro-preview.

Comma and pipe separators are accepted. Deployment uses pipes to avoid gcloud's environment-variable comma delimiter. Maximum model counts are three, not two.

## Behavior

Each request has a shared deadline with time reserved for subsequent models. Image, album-plan, Lumi and QC requests use abort signals when their local time allowance expires. Aborting the local request does not guarantee cancellation of Google's billable work.

Image references are carried to each reserve. The last image model uses native 1K, including when the first two requested 2K. No artificial upscaling occurs. Output telemetry records both requested and actual resolution. This is a reduced-resolution recovery path, not equivalent 2K print quality.

Unavailable services, timeouts, empty/invalid structured responses can reach a reserve. A valid negative QC verdict is final for that candidate; fallback does not shop for approval. Provider safety refusals, authentication/billing failures and application budget errors stop the model chain. QC remains fail-closed if all evaluators are unavailable.

## Spending guardrails

Album text attempts: three. Kit image attempts: six across two images and persisted task retries. Album image/QC counters remain bounded by their configured limits.

Album reservation estimates are model-aware. The configured conservative reservation ceiling is USD 5 (previously USD 3.20). Reservations count attempted calls, including some provider errors that Google does not bill. This is not a measured invoice amount or guaranteed hard billing cap. Existing per-call estimate overrides should be removed or reviewed if retained from old configuration.

## Verification

- 18 earlier paid API smoke tests established model access and identified 1K-only and thinking-budget requirements; see vertex-fallback-uat-2026-09-12.md.
- 121 automated tests pass, including transport-failure injection into actual image/QC modules, malformed JSON, terminal safety/budget conditions, timeout cancellation and reference preservation.
- TypeScript, targeted ESLint and production build pass.
- No live deliberate outage injection or complete paid album was performed as part of this rollout. Earlier API smoke tests used operator credentials, not runtime service-account impersonation.

## Operational signals

- pmm_ai_model_attempt_failed: role, model, attempt; no prompt or raw provider payload.
- pmm_ai_fallback_success: actual selected fallback model and index.
- pmm_image_model_output: actual resolution and originally requested resolution.

All models share Google infrastructure and the project billing account. Multi-model fallback reduces model-specific failures but cannot fix a suspended account, a project-wide outage or an exhausted application budget.

## Deployment confirmed

- Main: povestea-mea-magica-00122-mb8, europe-west3, 100% traffic.
- Domain: povestea-mea-magica-domain-00079-n8h, europe-west1, 100% traffic.
- Shared image digest: sha256:589ce025a364c52a21401b4fc8bb0b22b214ebed8d6d33c4bd6b57d1cae6f010.
- Both services verified with the three-model chains and USD 5 reservation ceiling. Existing Stripe and audio settings preserved.
- Public /api/health returned ready=true at 2026-09-12T07:10:58Z.
