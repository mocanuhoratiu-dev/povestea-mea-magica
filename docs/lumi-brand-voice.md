# Lumi: One Voice, Four Performances

Approved voice: **Sulafat**, the voice used in the September 15 launch reel.
Model: `gemini-3.1-flash-tts-preview`, through Google Cloud Text-to-Speech.
The model is a preview release; validate any future replacement with listening
tests before changing the default. We do not silently substitute another voice.

| Context | Direction |
| --- | --- |
| Lumi | Warm, smiling, natural conversation; curious questions, connected phrasing |
| Povestea Magica / album | Expressive, flowing storytelling; a little calmer, never slow or theatrical |
| Atelierul Scutului Magic | Soft, reassuring bedtime guidance; clearly audible, not whispered |
| Dosarul Micului Explorator | Playful curiosity; clear steps and gentle encouragement |

All directions live in `src/lib/narration.ts`. Model and voice are shared through
`GOOGLE_TTS_MODEL` and `GOOGLE_TTS_VOICE`. The old per-product Aoede/Zephyr variables
are no longer read. Prompt/model/voice changes invalidate the audio cache.

## Playback And Delivery

- Audio begins only after a click. One shared player handles all products and Lumi.
- Starting a reading stops the previous one, including other same-origin tabs
  in browsers supporting BroadcastChannel. Changing Lumi's step/page or closing
  her window stops her current reading.
- Text is divided at sentence boundaries, under 3,500 UTF-8 bytes per request.
  Romanian diacritics count as multiple bytes. No text is silently cut off.
- Only the next passage is prefetched once the current passage starts. Stop
  aborts browser requests; a provider request already accepted may still finish.
- Album page transitions follow chapter boundaries, not an assumed equal duration.
- Album narration is created on demand after delivery, not during PDF generation.
  TTS failure cannot hold the PDFs or their delivery email hostage.
- The delivery token authorizes chapter requests. Text comes from the stored,
  delivered order, never arbitrary client text. Bundle access checks album inclusion.
- Generated album chapters are saved in the order's private Cloud Storage prefix,
  covered by the same bucket retention rules as the documents. Replays reuse them.
- Client cache: at most 16 MB / 64 clips for ten minutes, in memory only. Server
  cache: same bounds; concurrent synthesis is deduplicated within each instance.
  Separate Cloud Run instances can still duplicate an initial cache miss.
- General audio: 60 requests/hour/IP/instance. Delivered albums: 120, with valid
  delivery access. Existing edge protection complements these local limits.
- Previously purchased audio files remain accessible. New playback uses Sulafat
  when chapter playback is enabled. This version stores individual chapters, not
  a new single downloadable full-length MP3.

## UAT Checklist

1. Click Lumi's speaker, move to another step and confirm the old voice stops.
2. Start a story, then Lumi or a different tab: never two voices at once.
3. Stop during loading: no delayed playback when the request finishes.
4. Read the album through the final scene, including text beyond 4,000 characters.
5. Replay a delivered chapter: reuse the stored audio, no extra TTS call.
6. Simulate TTS failure: show retry feedback while keeping both PDF links available.
7. Verify standalone and bundled album access; deny unpaid/expired/wrong-item access.
8. Listen on a physical iPhone/Safari and Android before launch; emulation does not
   replace device checks for media autoplay restrictions.

## Verification (2026-09-13)

- 156 automated tests passed, including 18 narration-specific tests.
- TypeScript passed; targeted lint passed with only pre-existing image warnings
  in LumiGuide and PremiumKitCreator. Deployment script syntax passed.
- Production build passed with Webpack. Local Turbopack could not bind its internal
  worker port in the desktop sandbox; deployment configuration was not changed.
- Chrome at 1440, 390 and 320 px passed: no autoplay, stop on step/close,
  cross-tab exclusivity, chapter-linked pages, retry while PDFs remain accessible,
  no horizontal overflow and no browser exceptions. Order responses were fixtures.
- Four real Google Cloud MP3 samples were generated, one per performance.
  The clean local website process also returned real MP3 audio for a full Lumi
  introduction and a short guided question. Set VERTEX_AI_PROJECT_ID in local
  runtime configuration as well as Cloud Run.
- No live payment/order was created and no production deployment was performed.
  Physical-device listening and a delivered production-order audio check remain
  part of the deployment UAT.
