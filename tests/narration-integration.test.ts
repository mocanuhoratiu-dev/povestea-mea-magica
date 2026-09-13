import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(dirname(new URL(import.meta.url).pathname), "..");

// Run the real adapters and player with isolated transports, no paid API calls.
function loadModule<T>(entry: string, mocks: Record<string, unknown> = {}, globals: Record<string, unknown> = {}): T {
  const cache = new Map<string, { exports: unknown }>();
  const load = (file: string): unknown => {
    if (!file.endsWith(".ts")) file += ".ts";
    if (cache.has(file)) return cache.get(file)!.exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const localRequire = (id: string): unknown => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith("@/")) return load(resolve(root, "src", id.slice(2)));
      if (id.startsWith(".")) return load(resolve(dirname(file), id));
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports,${Object.keys(globals).join(",")}){${code}\n})`, { filename: file })(localRequire, mod, mod.exports, ...Object.values(globals));
    return mod.exports;
  };
  return load(resolve(root, entry)) as T;
}

test("TTS uses the directed MP3 request, deduplicates concurrent calls and reuses audio", async () => {
  let calls = 0;
  const mod = loadModule<typeof import("../src/lib/googleTextToSpeech")>("src/lib/googleTextToSpeech.ts", {
    "google-auth-library": { GoogleAuth: class { async getClient() { return { getAccessToken: async () => ({ token: "test-token" }) }; } } },
  }, { fetch: async (_url: string, init: RequestInit) => {
    calls++;
    const body = JSON.parse(init.body as string);
    assert.equal(body.voice.name, "Sulafat");
    assert.ok(body.input.prompt.includes("Lumi"));
    assert.ok(init.signal);
    return Response.json({ audioContent: Buffer.from("test-audio").toString("base64") });
  } });
  const first = mod.synthesizeRomanianSpeech("Bun venit!", "lumi");
  const second = mod.synthesizeRomanianSpeech("Bun venit!", "lumi");
  assert.equal((await first).toString(), "test-audio");
  await second;
  await mod.synthesizeRomanianSpeech("Bun venit!", "lumi");
  assert.equal(calls, 1);
  await mod.synthesizeRomanianSpeech("Bun venit!", "shield");
  assert.equal(calls, 2);
});

test("TTS provider failure does not cache an error or expose provider response text", async () => {
  let calls = 0;
  const mod = loadModule<typeof import("../src/lib/googleTextToSpeech")>("src/lib/googleTextToSpeech.ts", {
    "google-auth-library": { GoogleAuth: class { async getClient() { return { getAccessToken: async () => ({ token: "test-token" }) }; } } },
  }, { fetch: async () => ++calls === 1 ? new Response("PRIVATE PROVIDER DATA", { status: 429 }) : Response.json({ audioContent: "dGVzdA==" }) });
  await assert.rejects(mod.synthesizeRomanianSpeech("Bun venit!", "story"), /^Error: TTS provider returned 429\.$/);
  assert.equal((await mod.synthesizeRomanianSpeech("Bun venit!", "story")).toString(), "test");
  assert.equal(calls, 2);
});

test("public narration rejects invalid kinds, malformed JSON and oversized UTF-8 without synthesis", async () => {
  let calls = 0;
  const route = loadModule<typeof import("../src/app/api/narrate/route")>("src/app/api/narrate/route.ts", {
    "@/lib/turnstile": { verifyTurnstileRequest: async () => true },
    "@/lib/googleTextToSpeech": { synthesizeRomanianSpeech: async () => { calls++; return Buffer.from("audio"); } },
  });
  const send = (body: string) => route.POST(new Request("https://example.test/api/narrate", { method: "POST", body }));
  assert.equal((await send("{")).status, 400);
  assert.equal((await send("null")).status, 400);
  assert.equal((await send(JSON.stringify({ text: "Bună!", kind: "__proto__" }))).status, 400);
  assert.equal((await send(JSON.stringify({ text: "ș".repeat(1800), kind: "lumi" }))).status, 413);
  assert.equal((await send(JSON.stringify({ text: "x".repeat(9000), kind: "lumi" }))).status, 413);
  assert.equal(calls, 0);
  assert.equal((await send(JSON.stringify({ text: "Bună!", kind: "explorer" }))).status, 200);
  assert.equal(calls, 1);
});

test("public narration cannot bypass the existing bot check", async () => {
  let calls = 0;
  const route = loadModule<typeof import("../src/app/api/narrate/route")>("src/app/api/narrate/route.ts", {
    "@/lib/turnstile": { verifyTurnstileRequest: async () => false, turnstileRejected: () => new Response(null, { status: 403 }) },
    "@/lib/googleTextToSpeech": { synthesizeRomanianSpeech: async () => { calls++; return Buffer.from("audio"); } },
  });
  const response = await route.POST(new Request("https://example.test/api/narrate", { method: "POST", body: JSON.stringify({ text: "Bună!", kind: "story" }) }));
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

function paidRoute(options: { status?: string; product?: string; itemInBundle?: boolean; storageError?: number } = {}) {
  let generated = 0;
  const saved = new Map<string, Buffer>();
  const album = { plan: { title: "Titlu", scenes: [{ heading: "Prima aventură", text: "Povestea întreagă." }] }, documents: { storybook: "story.pdf", activityBooklet: "activities.pdf" } };
  const route = loadModule<typeof import("../src/app/api/orders/[orderId]/narration/route")>("src/app/api/orders/[orderId]/narration/route.ts", {
    "@/lib/orders": {
      isValidDeliveryToken: (id: string, token: string) => id === "paid-order" && token === "valid-token",
      getOrder: async () => ({ product: options.product || "album", status: options.status || "delivered", output: album, configuration: {}, productId: "bundle-premium" }),
      readOrderFile: async (path: string) => {
        if (options.storageError) throw new Error(`Cloud Storage download failed (${options.storageError}).`);
        if (saved.has(path)) return { buffer: saved.get(path) };
        throw new Error("Cloud Storage download failed (404).");
      },
      saveOrderFile: async (id: string, data: Buffer, name: string) => { saved.set(`orders/${id}/${name}.mpeg`, data); },
    },
    "@/lib/album/schema": { readAlbumOutput: (value: unknown) => value },
    "@/lib/bundle": {
      bundleVariantForProductId: () => "premium",
      readBundleConfiguration: () => options.itemInBundle === false ? [] : [{ product: "album" }],
      readBundleOutput: () => [{ product: "album", output: album }],
    },
    "@/lib/googleTextToSpeech": {
      narrationCacheKey: (text: string) => Buffer.from(text).toString("hex").slice(0, 48),
      synthesizeRomanianSpeech: async (text: string, kind: string) => { generated++; assert.equal(kind, "story"); return Buffer.from(text); },
    },
    "@/lib/telemetry": { logTelemetry: () => {} },
  });
  const request = (body: unknown) => route.POST(new Request("https://example.test/api/orders/paid-order/narration", { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ orderId: "paid-order" }) });
  return { request, generated: () => generated, saved };
}

test("paid audio authenticates, checks delivery and bounds; client cannot supply text", async () => {
  const route = paidRoute();
  assert.equal((await route.request({ token: "expired", part: 0 })).status, 403);
  assert.equal((await route.request({ token: "valid-token", part: -1 })).status, 400);
  assert.equal((await route.request({ token: "valid-token", part: 99 })).status, 404);
  assert.equal((await paidRoute({ status: "paid" }).request({ token: "valid-token", part: 0 })).status, 409);
  assert.equal(route.generated(), 0);
  const response = await route.request({ token: "valid-token", part: 1, text: "UNAUTHORIZED TEXT" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(await response.text(), "Prima aventură.\n\nPovestea întreagă.");
  await route.request({ token: "valid-token", part: 1 });
  assert.equal(route.generated(), 1);
});

test("bundles require album entitlement and explicit album item", async () => {
  const route = paidRoute({ product: "bundle" });
  assert.equal((await route.request({ token: "valid-token", part: 0 })).status, 404);
  assert.equal((await route.request({ token: "valid-token", part: 0, item: "monster" })).status, 404);
  assert.equal((await route.request({ token: "valid-token", part: 0, item: "album" })).status, 200);
  assert.equal((await paidRoute({ product: "bundle", itemInBundle: false }).request({ token: "valid-token", part: 0, item: "album" })).status, 404);
});

test("storage outage does not repeatedly regenerate paid audio", async () => {
  const route = paidRoute({ storageError: 403 });
  assert.equal((await route.request({ token: "valid-token", part: 0 })).status, 503);
  assert.equal(route.generated(), 0);
});

function fakePlayer(transport?: (init: RequestInit) => Promise<Response>, delayedPlay = false) {
  const elements: FakeAudio[] = [];
  const playResolvers: (() => void)[] = [];
  let calls = 0;
  class FakeAudio {
    src = ""; paused = true; duration = 10; currentTime = 0;
    onended: (() => void) | null = null; onerror: (() => void) | null = null; ontimeupdate: (() => void) | null = null;
    constructor(src = "") { this.src = src; elements.push(this); }
    play() { this.paused = false; return delayedPlay ? new Promise<void>((resolve) => playResolvers.push(resolve)) : Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ""; }
    load() {}
  }
  const fetchAudio = async (_url: string, init: RequestInit) => {
    calls++;
    return transport ? transport(init) : new Response(new Blob(["audio"], { type: "audio/mpeg" }));
  };
  const mod = loadModule<typeof import("../src/lib/narrationPlayback")>("src/lib/narrationPlayback.ts", { "@/lib/clientTurnstile": { protectedFetch: fetchAudio } }, { Audio: FakeAudio, fetch: fetchAudio, window: undefined });
  return { mod, elements, playResolvers, calls: () => calls };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("player reads all chapters on one element, prefetches one and uses cached replay", async () => {
  const { mod, elements, calls } = fakePlayer();
  const started: number[] = [];
  const tracks = ["A.", "B.", "C."].map((text, pageIndex) => ({ text, kind: "story" as const, pageIndex }));
  let ended = false;
  await mod.playNarrationSequence("album", tracks, { onTrackStart: (i) => started.push(i), onEnded: () => { ended = true; } });
  await tick(); assert.equal(calls(), 2); assert.equal(elements.length, 1);
  elements[0].onended?.(); await tick(); assert.equal(calls(), 3);
  elements[0].onended?.(); await tick(); elements[0].onended?.();
  assert.deepEqual(started, [0, 1, 2]); assert.ok(ended);
  await mod.playNarrationSequence("album", tracks); await tick();
  assert.equal(calls(), 3); mod.stopNarration();
});

test("stop during synthesis aborts the request and no late audio starts", async () => {
  let signal: AbortSignal | null | undefined;
  let finish!: (response: Response) => void;
  const player = fakePlayer(async (init) => { signal = init.signal; return new Promise((resolve) => { finish = resolve; }); });
  const playing = player.mod.playNarration("lumi", "Salut!", "lumi");
  player.mod.stopNarration("lumi");
  assert.ok(signal?.aborted);
  finish(new Response(new Blob(["audio"], { type: "audio/mpeg" })));
  assert.equal(await playing, false);
  assert.ok(player.elements.every((audio) => audio.paused));
});

test("a stale play promise cannot stop the newer narrator", async () => {
  const player = fakePlayer(undefined, true);
  const old = player.mod.playNarration("old", "Salut!", "lumi"); await tick();
  for (let i = 0; i < 30 && player.playResolvers.length < 1; i++) await tick();
  assert.equal(player.playResolvers.length, 1);
  const current = player.mod.playNarration("new", "Poveste!", "story"); await tick();
  for (let i = 0; i < 30 && player.playResolvers.length < 2; i++) await tick();
  assert.equal(player.playResolvers.length, 2);
  player.playResolvers[1](); assert.equal(await current, true);
  player.playResolvers[0](); assert.equal(await old, false);
  assert.equal(player.elements[1].paused, false);
  assert.equal(player.elements[0].paused, true);
  player.mod.stopNarration();
});

test("a prefetched chapter failure stops reading and reports a retryable error", async () => {
  let calls = 0; let failed = false;
  const player = fakePlayer(async () => ++calls === 1 ? new Response(new Blob(["ok"], { type: "audio/mpeg" })) : new Response(null, { status: 503 }));
  await player.mod.playNarrationSequence("album", [{ text: "A.", kind: "story" }, { text: "B.", kind: "story" }], { onError: () => { failed = true; } });
  await tick(); player.elements[0].onended?.(); await tick();
  assert.ok(failed); assert.ok(player.elements[0].paused);
});
