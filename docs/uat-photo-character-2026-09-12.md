# Photo and character UAT, 12 September 2026

## Implemented

- Shared consented photo analysis and illustrated-character approval for the album, both kits and complete bundles. Parents can crop one child, review visible traits and correct the description before approval. Manual appearance fields are hidden while using a photo.
- JPEG, PNG and WebP; 10 MB, 40 MP maximum; 512 pixels minimum per side. Browser/server validation, metadata removal, maximum normalized side 1536 pixels. HEIC/GIF/animated files are not supported.
- Server-signed proof binds the source image, observed traits and approved illustrated character. An unverified pending character cannot authorize generation or checkout. Tokens expire after 24 hours.
- The canonical illustrated character, not the changing cover, is the identity reference across images. Separate image references can carry companion/prop details. Similarity QC can reject inconsistent output; exact resemblance is not guaranteed.
- Three Vertex models per text/vision/QC/preview-image role. Safety, authentication, billing and cost limits are terminal, not reasons to bypass controls. Premium final album artwork uses only native 2K-capable models; 1K preview images are regenerated before final delivery.
- Preview creation queues server work immediately. Per-order leases and checkpoints allow interruption/retry without discarding approved assets. Four bounded worker attempts, separate from the configured four new variants per 24-hour per-instance window. Completed variants remain selectable.
- Pending album and kit images survive QC outages. Character approval can retry verification of a signed pending candidate while the browser remains open. Closing the character form before its response can still require a new character request; durable storage starts when a preview order exists.
- Photo/trademark notices do not guess why a provider rejected a request. Failure emails include a safe reason category and available model identifiers, never customer photographs or prompts. Resend idempotency prevents duplicate email submissions; daily logs remain the fallback if the email provider fails.
- Daily 09:00 report includes actual model attempts/failures, generated 1K/2K candidates, QC failures and deduplicated incidents, separately from sales/delivery. Counts are not a Google invoice.
- Fourteen simple color names with swatches; multi-color art direction remains separate from the story vocabulary.

## UAT checklist

1. Choose one clear photo, agree to analysis, verify traits, correct one detail, generate and approve the illustrated character. No API call before consent.
2. Try an image containing two children: no automatic selection; crop or replace it. Try unsupported/small/oversized images.
3. Generate an album preview, leave the screen and come back. Confirm the same order resumes, then select either completed variant and continue to Stripe test checkout.
4. Use different photos/children for the album and kits in a complete bundle. Each product must retain its own confirmed character.
5. Inspect facial shape, hair, clothing and companions on all pages; verify no manual traits override the photo silently.
6. Simulate a provider outage and a QC outage separately. Confirm model fallback and reuse of pending candidates. A safety refusal must not be sent to more permissive models.
7. Confirm failure notification delivery and the next daily model report in office@povestea-mea-magica.ro.

## Scope of verification

Automated transport tests simulate model outages and refusal responses. Browser tests cover consent, approval, form population, mobile layout and sample selection. A bounded real Vertex smoke test uses an existing synthetic child illustration; it does not establish real-photo likeness quality. Real family photographs remain a required visual UAT check.

### Verified results

- 133/133 automated tests passing; production build and TypeScript passing.
- Both local and published forms tested at 360, 390 and 1440 pixels, all three products: consent, analysis, approval and no horizontal overflow. Separate 390/1440 tests confirm either saved sample can reach its own checkout. Queued temporary failures recover with one new-variant request only.
- Live domain test: vision 4s; canonical character + QC 23s; queued preview acknowledged in 1.6s; cover ready in about 35s and all three pages ready in 118s after queueing. No Stripe transaction.
- Live text primary gemini-3.5-flash timed out and gemini-3.1-flash-lite completed the plan. Images used gemini-3.1-flash-image; QC used gemini-3.1-flash-lite. The reference and preview images were visually inspected. Child hairstyle, outfit and facial design were consistent in this synthetic test. Supporting-object accuracy remains part of visual UAT, not an automatic guarantee.
- One TEST UAT operational email accepted by Resend (HTTP 200). Delivery lookup is not permitted by the sending-only key, so inbox receipt is not independently confirmed.
- Daily scheduler enabled: 09:00 Europe/Bucharest, office@povestea-mea-magica.ro.
- Cloud Run: main revision `povestea-mea-magica-00123-hwz`; domain revision `povestea-mea-magica-domain-00080-426`; both serving 100% traffic. Shared image digest `sha256:816da242d0f094969cc4dd8de7e0ad30edb7616ae87f59009af309ce39851177`. Public health ready. Stripe secret version unchanged at test version 2.

## Operational limits

Stripe remains test mode; no live charges or audio changes. Existing photo and request rate guards are per-instance, not global billing guarantees. No failover can cure suspended billing, missing permissions or a provider content refusal. Do not promise uninterrupted generation or unchanged composition when a native 2K replacement is needed.
