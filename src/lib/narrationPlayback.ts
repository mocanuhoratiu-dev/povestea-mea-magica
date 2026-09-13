"use client";

import { protectedFetch } from "@/lib/clientTurnstile";
import { splitNarration, type NarrationKind, type NarrationTrack } from "./narration";
export type { NarrationKind, NarrationTrack } from "./narration";

type NarrationPhase = "idle" | "loading" | "playing";
type NarrationState = { owner: string | null; phase: NarrationPhase };
type NarrationCallbacks = {
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (progress: number) => void;
  onTrackStart?: (index: number, track: NarrationTrack) => void;
};

let state: NarrationState = { owner: null, phase: "idle" };
let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;
let requestVersion = 0;
let controller: AbortController | null = null;
let channel: BroadcastChannel | null = null;
const subscribers = new Set<(nextState: NarrationState) => void>();
const cache = new Map<string, { blob: Blob; expires: number }>();

function publish(next: NarrationState) {
  state = next;
  subscribers.forEach((subscriber) => subscriber(state));
}

function releaseAudio() {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.ontimeupdate = null;
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
  }
  activeAudio = null;
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = null;
}

function stopCurrentNarration() {
  requestVersion += 1;
  controller?.abort();
  controller = null;
  releaseAudio();
  publish({ owner: null, phase: "idle" });
}

function claimPlayback() {
  if (typeof window === "undefined") return;
  if (!channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("pmm-lumi-narration");
    channel.onmessage = () => stopCurrentNarration();
    window.addEventListener("pagehide", () => stopCurrentNarration());
  }
  channel?.postMessage("playing");
}

export function subscribeToNarration(subscriber: (next: NarrationState) => void) {
  subscribers.add(subscriber);
  subscriber(state);
  return () => subscribers.delete(subscriber);
}

export function stopNarration(owner?: string) {
  if (owner && state.owner !== owner) return;
  stopCurrentNarration();
}

async function fetchTrack(track: NarrationTrack, signal: AbortSignal) {
  const key = JSON.stringify(track);
  for (const [id, item] of cache) if (item.expires <= Date.now()) cache.delete(id);
  const cached = cache.get(key);
  if (cached) return cached.blob;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify("text" in track ? { text: track.text, kind: track.kind } : track.body),
    signal,
    cache: "no-store" as const,
  };
  const response = "text" in track
    ? await protectedFetch("/api/narrate", options, "narrate")
    : await fetch(track.endpoint, options);
  if (!response.ok) throw new Error("Narration unavailable.");
  const blob = await response.blob();
  if (!blob.type.startsWith("audio/") || !blob.size) throw new Error("Invalid audio.");
  let bytes = [...cache.values()].reduce((sum, value) => sum + value.blob.size, 0);
  while (cache.size && (cache.size >= 64 || bytes + blob.size > 16 * 1024 * 1024)) {
    const first = cache.keys().next().value!;
    bytes -= cache.get(first)!.blob.size;
    cache.delete(first);
  }
  if (blob.size <= 16 * 1024 * 1024) cache.set(key, { blob, expires: Date.now() + 10 * 60_000 });
  return blob;
}

/** One audio element per reading; prefetch only the next passage after playback starts. */
export async function playNarrationSequence(owner: string, tracks: NarrationTrack[], callbacks: NarrationCallbacks = {}) {
  if (!tracks.length) return false;
  stopCurrentNarration();
  claimPlayback();
  const version = requestVersion;
  const abort = new AbortController();
  controller = abort;
  const audio = new Audio();
  activeAudio = audio;
  let next: Promise<{ blob: Blob } | { error: unknown }> | undefined;
  publish({ owner, phase: "loading" });

  const failed = () => {
    if (version !== requestVersion) return;
    stopCurrentNarration();
    callbacks.onError?.();
  };
  const start = async (index: number): Promise<boolean> => {
    try {
      if (version !== requestVersion) return false;
      publish({ owner, phase: "loading" });
      const ready = next ? await next : { blob: await fetchTrack(tracks[index], abort.signal) };
      if (version !== requestVersion) return false;
      if ("error" in ready) throw ready.error;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
      activeUrl = URL.createObjectURL(ready.blob);
      audio.src = activeUrl;
      audio.onended = () => {
        if (version !== requestVersion) return;
        if (index + 1 < tracks.length) void start(index + 1).catch(() => {});
        else { stopCurrentNarration(); callbacks.onEnded?.(); }
      };
      audio.onerror = failed;
      audio.ontimeupdate = () => {
        if (version !== requestVersion || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
        callbacks.onProgress?.((index + Math.min(1, audio.currentTime / audio.duration)) / tracks.length);
      };
      await audio.play();
      // Never release the global player here: a newer reading may already own it.
      if (version !== requestVersion) { audio.pause(); return false; }
      publish({ owner, phase: "playing" });
      callbacks.onTrackStart?.(index, tracks[index]);
      next = index + 1 < tracks.length
        ? fetchTrack(tracks[index + 1], abort.signal).then((blob) => ({ blob }), (error: unknown) => ({ error }))
        : undefined;
      return true;
    } catch (error) {
      if (version !== requestVersion) return false;
      failed();
      throw error;
    }
  };
  return start(0);
}

export function playNarration(owner: string, text: string, kind: NarrationKind, callbacks: NarrationCallbacks = {}) {
  return playNarrationSequence(owner, splitNarration(text).map((part) => ({ text: part, kind })), callbacks);
}

/** Retain playback for previously purchased audio files through the same channel. */
export async function playStaticNarration(owner: string, source: string, callbacks: NarrationCallbacks = {}) {
  stopCurrentNarration();
  claimPlayback();
  const version = requestVersion;
  publish({ owner, phase: "loading" });
  const audio = new Audio(source);
  activeAudio = audio;
  audio.ontimeupdate = () => {
    if (version !== requestVersion || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    callbacks.onProgress?.(Math.min(1, audio.currentTime / audio.duration));
  };
  audio.onended = () => { if (version === requestVersion) { stopCurrentNarration(); callbacks.onEnded?.(); } };
  audio.onerror = () => { if (version === requestVersion) { stopCurrentNarration(); callbacks.onError?.(); } };
  try {
    await audio.play();
    if (version !== requestVersion) { audio.pause(); return false; }
    publish({ owner, phase: "playing" });
    return true;
  } catch (error) {
    if (version !== requestVersion) return false;
    stopCurrentNarration();
    callbacks.onError?.();
    throw error;
  }
}
