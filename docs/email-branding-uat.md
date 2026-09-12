# Email branding UAT

## Scope

Shared identity for digital delivery (all six current/legacy product variants), invoice notifications, delivery watchdog alerts and daily aggregate reports.

- Current PNG emblem, navy #0b2035, gold #f2cd7a, plum #72506c and light background.
- Live-text wordmark and Georgia headings as an email-safe substitute for the website's Fraunces. No dependency on downloaded web fonts or scripts.
- Inline styles, presentation tables, Outlook fixed-width fallback and mobile padding.
- UTF-8, Romanian diacritics, preheader, support signature and business identity.
- Separate content for attachments and secure links; missing/unsafe secure links are rejected.
- Private delivery URL parameters are preserved and HTML-escaped.
- No changes to recipients, payment settings, invoice issuance, Resend idempotency keys or historical messages.
- Previously saved daily report payloads stay immutable; newly created daily reports get the new layout.

## Verification

103 tests passed. TypeScript, ESLint for touched mail modules and production build passed.
Seven representative emails rendered at 320, 390 and 700 px, without horizontal overflow. Logo-off rendering retains the text wordmark, message and delivery CTA.
HTML is below 25 KB for tested delivery templates. All layouts use the same lightweight PNG logo already published by the site.

These are browser render checks, not proof of pixel-identical rendering in every version of Outlook, Gmail or Zoho. No email was sent as part of visual QA.

Generate local examples with scripts/preview-email-brand.ts. Open /private/tmp/pmm-email-brand-preview/index.html. Run scripts/qa-email-brand.mjs for browser checks.

## Deployment

Published 11 September 2026, build dbdd12e5-bb72-4f39-874e-676ff2671c08.
Image: sha256:6959c8bc282eef7b1126109edc79d2f57a88c860efbfd3173646ace2336ce184.
Main revision: povestea-mea-magica-00121-znk; domain revision: povestea-mea-magica-domain-00078-5mx. Both serve 100% traffic. Runtime environment variables and secret references were preserved.
