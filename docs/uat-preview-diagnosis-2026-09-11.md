# Preview generation: confirmed diagnosis

## Still open

A single reproduction of the original photo-based UAT configuration, with no
changes to the family's brief, returned:

- Model: `gemini-3.1-flash-image` through Vertex AI, global location.
- Stage: **output** (candidate finish reason, not promptFeedback).
- Finish reason: `IMAGE_PROHIBITED_CONTENT`.
- Duration: 18.1 seconds.
- No image was returned. No alternate provider/model or prompt rewrite was tried
  after this safety refusal. No payment or invoice was created.

This is not a quota, timeout, Cloud Run, or alerting failure. The code alone does
not identify which visual detail triggered the filter and does not establish
that the parent's photo is unsafe. Do not claim the photo case is fixed.

Google documents the distinction between input and output filtering:
https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/gemini-image-responsible-ai

Escalate a suspected false positive to the provider with the model, timestamp,
project, and response ID when available. Do not send a child's photo or the
family's full input in a public issue or ordinary monitoring logs.

## Application defects corrected

1. Provider failure metadata was discarded. Keep bounded provider enums,
   input/output stage, model and optional response ID for diagnosis. Never retry
   or switch models after an explicit filter rejection; check rejection before
   accepting an inline image.
2. QC received the editorial retry prompt, including the previous reviewer's
   criticism, as its evaluation brief. It now evaluates against the original
   family brief. Generation still receives corrective editorial feedback.
3. Text detection had no evidence requirement. QC now must ground any text
   finding in a location and actual lettering/glyphs. Natural object textures
   alone are not text. Unverifiable judgments fail closed and retry only QC.
4. The four daily slots were consumed before input validation and remained spent
   on failed cover generation. Reserve after validation and refund a failed
   cover request once. Keep an independent 12-requests/hour guard for abuse and
   costs. Successful cover requests still consume a slot; downstream interior
   failure refunds are not part of this change.

Identity 85, story 75 and technical 75 minimums remain unchanged. Safety and
genuine text/watermark failures still reject the image. Rate counters remain
best-effort per Cloud Run instance, not a globally atomic customer entitlement.

## Verification

- 96 unit/regression tests passed before deployment.
- TypeScript check passed.
- Production build passed with webpack. Local Turbopack failed to bind its CSS
  worker port in the execution environment, including the elevated retry.
- Scoped ESLint: no errors; two existing next/image warnings in AlbumCreator.
- New live Vertex QC accepted an existing, unrelated synthetic UAT illustration
  with technical/story scores 100, no hard failure. This confirms the new QC
  response contract works, not that the blocked photo case passes.
- No alert policies or billing settings changed in this fix.
- Actual POST/GET route handlers tested with isolated provider/storage mocks:
  invalid configuration, safety refusal, capacity failure and QC outage preserve
  allowance; success spends one slot; request 13 hits the separate hourly guard.
- Browser regression passed at 390px and 1440px: errors remain readable,
  allowance remains four after simulated failures, inputs are preserved and
  generation controls remain available.

## Publication status

The deployment script was stopped while reading the existing Cloud Run service,
before building/uploading or changing either live service. Both a direct REST
read and an unauthenticated connectivity check to `run.googleapis.com` failed;
curl reported a connection timeout after 10 seconds. No deployment is running.
These corrections remain local and are not yet live. Resume publication only
after reading existing runtime settings successfully; do not substitute guessed
commerce or Turnstile settings when the Cloud Run API is unreachable.
