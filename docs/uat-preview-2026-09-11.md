# Preview reliability UAT - 2026-09-11

## Changes

- Preview retries use bounded 8/16-second backoff with jitter for provider capacity, timeout and empty-response failures. The illustration attempt cap remains unchanged.
- Provider content-filter responses stop immediately instead of being retried or routed to another model.
- Preview processing has a 150-second generation/QC deadline, below the browser's 180-second deadline.
- Photo references specify identity transfer into illustration; illustrated references retain exact design continuity. Photo clothing and photographic texture are not required by QC.
- Cinematic QC checks visible execution instead of imposing an automatic score cap for suspected rendering technique. Minimum scores remain identity 85, story 75, technical 75; safety/text rejection remains mandatory.
- Album prompt and QC context limits are aligned at 12,000 characters so family details and editorial instructions are not silently removed at the old 3,600/2,400-character limits. Other cover prompts retain their previous limit.
- Public failures distinguish capacity, unavailable generation, provider filtering, quality rejection and unavailable QC. API responses include remaining attempts and Retry-After where applicable. Telemetry records the failure category.

## Verification

- 90 automated tests passed.
- Desktop/mobile simulated error tests: 390px and 1440px; capacity, quality rejection and provider filtering messages displayed, retry button usable and child name retained after returning through the form.
- Actual Vertex baseline preview (description only): 33.8 seconds, one image call, one QC call, technical 95, story 100. Storage upload/read verified; temporary test object deleted. No payment, email or customer order mutation.

## Open acceptance item

The reported photo-based case did NOT pass: provider filtering occurred and a returned candidate failed identity QC. Provider responses do not identify the triggering input. Do not claim this exact case is fixed or infer the photo/character name caused the filter. Do not weaken identity thresholds or bypass provider filters to obtain a passing result.

Full photo-preview acceptance and two interior pages still require a successful eligible test case. This is not a paid-order end-to-end sign-off.
