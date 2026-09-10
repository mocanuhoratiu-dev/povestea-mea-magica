# Atelierul Scutului Magic / Dosarul Micului Explorator

Implementation and QA record, 10 September 2026. Local implementation; not deployed by this change.

## Product Contract

- Atelierul Scutului Magic: 13 A4 pages. The existing certificate, recipe and labels remain the first three pages, rendered by the unchanged `NightShieldClassicPages` component. Ten new pages follow.
- Dosarul Micului Explorator: 10 A4 pages, including an illustrated mystery, observation radar, a validated maze, exactly three differences, drawing, four detachable missions, an envelope, answers and a certificate.
- Commerce IDs, URLs and configured prices are unchanged. New generation input is explicitly versioned with `kitVersion: 2`.
- Existing orders without premium output continue to use the legacy renderers. New single and bundle orders retain the existing payment, private delivery, email and review infrastructure.
- The public samples are explicit examples, never a generation fallback. The pre-checkout cover shows the chosen name on sample artwork and clearly says that final illustrations are generated after payment.

## AI And Recovery

- A strict JSON schema and runtime bounds validate AI-written Romanian text before illustration requests. Invalid primary-model output can use the configured backup model.
- Two original illustrations are generated per kit. The cover references the official Lumi asset; the interior references the completed cover to preserve character identity. This is reference conditioning, not a guarantee of perfect identity consistency.
- Mazes, their answers and intentional differences are deterministic structures, not unchecked image-model puzzles. AI personalizes the narrative and activities around them.
- Paid workers checkpoint text, each billable image attempt and each completed asset. A retry resumes missing work; it does not generate another cover when one is already saved.
- A shared limit of four image attempts includes provider fallback and worker retries. Reaching it stops incomplete delivery for operational review.
- Generated assets are stored privately and exposed through existing order-token and item-scoped routes. Stage telemetry records cover/scene success or failure without recording child descriptions.

## Experience

- Real product pages, complete-page readers, mobile scrolling dialogs, optional appearance/adult fields and difficulty selection.
- Night ritual narration uses the shared Lumi voice player and global playback coordination.
- PDF download, email attachment preparation, quick rating and verified-order review entry are connected to the new renderers.
- PDF export checks font/image loading, expected page count and content bounds before saving. These PDFs remain raster-based rather than tagged accessible documents.
- Navigation, homepage examples, model readers, pricing, bundle configuration, FAQ, metadata, transactional copy and social images use the new products. Social previews are 1200 x 630.

## Verification Performed

- 71 automated tests pass, including input/schema validation, escaping, asset scoping, classic-page preservation, resumable generation and budget persistence.
- TypeScript checking and a production build pass.
- Browser layout checks: 360, 390, 768 and desktop widths; complete page framing and no horizontal page overflow.
- All twenty new template pages pass normal and maximum-length-content layout checks. The maximum-length case includes a long Romanian name and the advanced maze.
- Both products were generated through real Vertex text/image calls. The primary text model timed out in one test; the configured backup produced valid text. One image request was rate limited; the missing illustration was subsequently generated without recreating completed assets.
- Actual browser PDF exports from those generated outputs were inspected with Poppler: 13 pages for Atelier, 10 for Dosar, both A4. Classic page one and new text/activity pages were visually checked.
- Mobile form, orientative preview, download, quick rating and email payload tests pass. Checkout and email providers were mocked for those browser tests. No real card charge or email was sent by this test suite.

## Release Check Still Required

1. Deploy this source and its public assets to Cloud Run.
2. Run one Stripe test-mode order for each standalone product and one mixed bundle through the actual queue, storage and email service.
3. Verify the received private links, both PDFs and Atelier audio on a phone.
4. Watch provider latency/rate limits and the four-attempt cap on initial orders. A temporary provider failure must not be treated as completed delivery.

## Reproducible Checks

- `scripts/qa-premium-kits.mjs`: rendered pages and real PDF export. `QA_STRESS=1` exercises maximum text; `QA_LIVE=1` uses the separately generated local fixtures.
- `scripts/qa-premium-kit-flow.mjs`: browser flow with mocked external transactions; set `QA_BASE_URL` to a local production build with payments enabled to exercise checkout.
- `scripts/test-premium-kits-live.mjs`: billable Vertex integration check using the currently authenticated Google account. `QA_RESUME=1` reuses saved local test progress.
- `scripts/render-premium-kit-assets.mjs`: regenerate public full-cover previews and social images from the actual templates.

Live test fixtures contain example names only and remain outside the repository. Secrets and provider access tokens must not be copied into documentation or QA artifacts.
