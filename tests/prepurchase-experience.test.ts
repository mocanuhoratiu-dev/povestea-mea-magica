import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("night shield and patience kit show a personalized preview before checkout", () => {
  const night = read("../src/components/MonsterKit.tsx");
  const patience = read("../src/components/EmergencyKit.tsx");
  for (const source of [night, patience]) {
    assert.match(source, /product_preview_opened/);
    assert.match(source, /PersonalizedProductPreview/);
    assert.ok(source.indexOf("setShowPreview(true)") < source.indexOf("await beginOrderCheckout"), "preview must be opened before checkout code");
  }
});

test("real-user web vitals are allow-listed without collecting personal data", () => {
  const reporter = read("../src/components/WebVitalsReporter.tsx");
  const endpoint = read("../src/app/api/telemetry/route.ts");
  assert.match(reporter, /useReportWebVitals/);
  assert.match(reporter, /web_vital_recorded/);
  assert.match(endpoint, /web_vital_recorded/);
  assert.doesNotMatch(reporter, /childName|email|address|configuration/i);
});

test("product videos are local, muted and mobile-safe", () => {
  const component = read("../src/components/ProductWalkthroughVideo.tsx");
  const album = read("../src/app/povestea-magica/page.tsx");
  const night = read("../src/components/MonsterKit.tsx");
  const patience = read("../src/components/EmergencyKit.tsx");
  assert.match(component, /autoPlay/);
  assert.match(component, /muted/);
  assert.match(component, /playsInline/);
  assert.match(component, /preload="metadata"/);
  assert.match(album, /povestea-magica\.mp4/);
  assert.match(night, /scutul-de-noapte\.mp4/);
  assert.match(patience, /trusa-de-rabdare\.mp4/);
});
