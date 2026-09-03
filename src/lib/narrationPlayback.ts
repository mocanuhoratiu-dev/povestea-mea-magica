"use client";

export type NarrationKind = "story" | "lumi";
type NarrationPhase = "idle" | "loading" | "playing";
type NarrationState = { owner: string | null; phase: NarrationPhase };
type StaticNarrationCallbacks = {
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (progress: number) => void;
};

let state: NarrationState = { owner: null, phase: "idle" };
let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;
let requestVersion = 0;
const subscribers = new Set<(nextState: NarrationState) => void>();

function publish(nextState: NarrationState) {
  state = nextState;
  subscribers.forEach((subscriber) => subscriber(state));
}

function releaseAudio() {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.ontimeupdate = null;
    activeAudio.pause();
  }
  activeAudio = null;
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = null;
}

function stopCurrentNarration() {
  requestVersion += 1;
  releaseAudio();
  publish({ owner: null, phase: "idle" });
}

export function subscribeToNarration(subscriber: (nextState: NarrationState) => void) {
  subscribers.add(subscriber);
  subscriber(state);
  return () => subscribers.delete(subscriber);
}

/** Stops the shared narrator, optionally only when it belongs to a specific UI. */
export function stopNarration(owner?: string) {
  if (owner && state.owner !== owner) return;
  stopCurrentNarration();
}

/**
 * The request version prevents a slow, older synthesis request from starting after
 * the visitor has already chosen a different voice preview.
 */
export async function playNarration(owner: string, text: string, kind: NarrationKind) {
  stopCurrentNarration();
  const version = requestVersion;
  publish({ owner, phase: "loading" });

  try {
    const response = await fetch("/api/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, kind }),
    });
    if (!response.ok) throw new Error("Nararea nu a putut fi pregătită.");

    const url = URL.createObjectURL(await response.blob());
    if (version !== requestVersion) {
      URL.revokeObjectURL(url);
      return false;
    }

    const audio = new Audio(url);
    activeAudio = audio;
    activeUrl = url;
    audio.onended = () => {
      if (version !== requestVersion) return;
      releaseAudio();
      publish({ owner: null, phase: "idle" });
    };
    audio.onerror = () => {
      if (version !== requestVersion) return;
      releaseAudio();
      publish({ owner: null, phase: "idle" });
    };
    await audio.play();
    if (version !== requestVersion) {
      releaseAudio();
      return false;
    }
    publish({ owner, phase: "playing" });
    return true;
  } catch (error) {
    if (version === requestVersion) {
      releaseAudio();
      publish({ owner: null, phase: "idle" });
    }
    throw error;
  }
}

/** Plays a pre-generated track through the same global channel used by Lumi. */
export async function playStaticNarration(owner: string, source: string, callbacks: StaticNarrationCallbacks = {}) {
  stopCurrentNarration();
  const version = requestVersion;
  publish({ owner, phase: "loading" });

  try {
    const audio = new Audio(source);
    activeAudio = audio;
    audio.ontimeupdate = () => {
      if (version !== requestVersion || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      callbacks.onProgress?.(Math.min(1, audio.currentTime / audio.duration));
    };
    audio.onended = () => {
      if (version !== requestVersion) return;
      releaseAudio();
      publish({ owner: null, phase: "idle" });
      callbacks.onEnded?.();
    };
    audio.onerror = () => {
      if (version !== requestVersion) return;
      releaseAudio();
      publish({ owner: null, phase: "idle" });
      callbacks.onError?.();
    };
    await audio.play();
    if (version !== requestVersion) {
      releaseAudio();
      return false;
    }
    publish({ owner, phase: "playing" });
    return true;
  } catch (error) {
    if (version === requestVersion) {
      releaseAudio();
      publish({ owner: null, phase: "idle" });
      callbacks.onError?.();
    }
    throw error;
  }
}
