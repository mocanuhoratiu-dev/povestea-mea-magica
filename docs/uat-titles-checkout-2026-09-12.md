# Story titles and preview checkout UAT

## Findings

- The story model returned a title, but the orchestrator replaced it with the deterministic child + world preview label. New plans now keep the author's title. Existing approved plans are not silently renamed.
- Stripe was already enabled on the public domain, revision `povestea-mea-magica-domain-00080-426`. The live checkout returned HTTP 200 and opened Stripe Sandbox for 59 RON on both 390px and 1440px viewports. No payment was made. This does not establish which state the user's particular browser was in.
- Browser Back/Forward cache restoration could retain the busy checkout state. `pageshow` now resets it.
- A locally remembered preview error prevented a fresh status check on page restoration. Restoring or selecting an interrupted/failed sample now checks the existing order again, without starting a new generation.
- A stale worker error could override a complete preview in the status response. Completed preview assets now take precedence over an old worker error; an order actually marked failed remains failed.
- The delivery consent now sits immediately above the form actions. A checkout attempt without consent focuses its checkbox and shows an inline error. Consent is never selected automatically.
- Checkout requests have a bounded 25-second timeout rather than leaving the form busy indefinitely.

## Title behavior

- The early cover uses a temporary label, not a world-based final title.
- The story prompt requests an expressive title rooted in its actual events and descriptive scene headings rather than numbered labels.
- Formatting prefixes and sample-number suffixes are removed. Missing/invalid titles fail plan validation rather than producing a generic fallback title.
- The status endpoint publishes the author's title as soon as the plan exists. The final renderer continues using the same stored plan title.
- No extra title-generation call is added to normal orders.

## Verification

- 135 automated tests passed, TypeScript passed, production build passed.
- ESLint: no errors; three pre-existing warnings in AlbumCreator (unused icon and image element guidance).
- Browser tests at 390px and 1440px: choose first while second generates, checkout second, switch back to first, consent focus, simulated Back/Forward cache restoration, no page errors or horizontal overflow.
- Text-only Vertex UAT using the real production plan generator: `gemini-3.5-flash` timed out; `gemini-3.1-flash-lite` successfully produced 13 scenes and the title **Erica și Steluța care a uitat drumul spre casă**. No images, new order or payment created for this test.
- Existing private UAT sample used to verify real Stripe Sandbox navigation. No customer sample was modified or purchased.

## Boundaries

This test verifies entry into checkout, not a new card authorization, webhook, fulfillment or email delivery. Previous paid orders and approved preview titles are preserved.

## Published verification

- Main service: `povestea-mea-magica-00124-2jc`, 100% traffic.
- Public-domain service: `povestea-mea-magica-domain-00081-fkx`, 100% traffic.
- Shared image digest: `sha256:979fca9d8bfba15672fef504519d4bb4681a55ab6793e877a420dd436f6e59fe`.
- Public health was ready at `2026-09-12T10:11:58.718Z`.
- Runtime payments flag remains true; Stripe secret reference remains version 2. Live browser checkout URLs were test sessions and Stripe displayed Sandbox.
- Final live browser checks at 390px and 1440px passed: real checkout HTTP 200, Stripe Sandbox reached, Back returned to an enabled preview checkout button, no page errors. No payment submitted.
- Additional local recovery check passed: reload a remembered failed preview, discover it is complete, restore checkout with no additional preview POST.
