import assert from "node:assert/strict";
import test from "node:test";
import { LAUNCH_AT, LAUNCH_HEADERS, launchCalendar, launchState, shouldShowLaunchPage } from "../src/lib/launchGate.ts";

const enabled = { LAUNCH_GATE_ENABLED: "true" };
const deadline = Date.parse(LAUNCH_AT);

test("Romanian Friday launch is precisely 18 September 2026 at 18:00 EEST", () => {
  assert.equal(new Date(deadline).toISOString(), "2026-09-18T15:00:00.000Z");
  assert.equal(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(deadline), "Friday 18:00");
});

test("gate is opt-in, closes before launch, opens exactly at launch, never closes again", () => {
  assert.equal(launchState({}, deadline - 1).open, true);
  assert.equal(launchState({ LAUNCH_GATE_ENABLED: "false" }, deadline - 1).open, true);
  assert.equal(launchState(enabled, deadline - 1).open, false);
  assert.equal(launchState(enabled, deadline).open, true);
  assert.equal(launchState(enabled, deadline + 100000000).open, true);
});

test("invalid dates or missing timezone fail open", () => {
  for (const LAUNCH_AT of ["not a date", "2026-09-18T18:00:00", "2099-99-99T18:00:00Z"]) {
    assert.equal(launchState({ ...enabled, LAUNCH_AT }, deadline - 1).open, true);
  }
});

test("homepage and all product URLs use the coming-soon experience only before launch", () => {
  for (const url of ["/", "/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare/", "/album-ilustrat", "/preturi", "/modele", "/pachet-complet"]) {
    assert.equal(shouldShowLaunchPage(url, "GET", enabled, deadline - 1), true, url);
    assert.equal(shouldShowLaunchPage(url, "HEAD", enabled, deadline - 1), true, url);
    assert.equal(shouldShowLaunchPage(url, "GET", enabled, deadline), false, url);
  }
});

test("webhooks, workers, purchased deliveries, legal pages and assets remain available", () => {
  for (const url of ["/api/launch", "/api/health", "/api/stripe-webhook", "/api/orders/process", "/api/orders/123/document", "/comanda-confirmata", "/povestea-magica/livrare", "/album-ilustrat/livrare/", "/pachet/livrare", "/contact", "/termeni-si-conditii", "/politica-de-confidentialitate", "/in-curand", "/launch/calendar", "/launch/countdown.js", "/brand/emblem.svg", "/_next/static/app.js", "/icon.png", "/robots.txt", "/sitemap.xml"]) {
    assert.equal(shouldShowLaunchPage(url, "GET", enabled, deadline - 1), false, url);
  }
  assert.equal(shouldShowLaunchPage("/api/orders", "POST", enabled, deadline - 1), false);
});

test("calendar includes correct UTC instant and the coming-soon response cannot be cached", () => {
  const calendar = launchCalendar();
  assert.ok(calendar.includes("DTSTART:20260918T150000Z\r\n"));
  assert.ok(calendar.includes("TRIGGER:-PT15M\r\n"));
  assert.ok(calendar.endsWith("END:VCALENDAR\r\n"));
  assert.match(LAUNCH_HEADERS["Cache-Control"], /no-store/);
  assert.equal(LAUNCH_HEADERS["CDN-Cache-Control"], "no-store");
});
