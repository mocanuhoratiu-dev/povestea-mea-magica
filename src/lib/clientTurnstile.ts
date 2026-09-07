"use client";

type TurnstileWidget = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
let loader: Promise<TurnstileWidget> | null = null;

function loadTurnstile() {
  if (!siteKey) return Promise.resolve(undefined);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loader) return loader;

  loader = new Promise<TurnstileWidget>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pmm-turnstile="true"]');
    const script = existing || document.createElement("script");
    const fail = (reason: string) => {
      loader = null;
      reject(new Error(reason));
    };
    const timeout = window.setTimeout(() => fail("security_timeout"), 12_000);
    const ready = () => {
      window.clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else fail("security_unavailable");
    };
    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      fail("security_unavailable");
    }, { once: true });
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.pmmTurnstile = "true";
      document.head.appendChild(script);
    } else {
      const pollStartedAt = Date.now();
      const poll = () => {
        if (window.turnstile) ready();
        else if (Date.now() - pollStartedAt < 12_000) window.setTimeout(poll, 50);
      };
      poll();
    }
  });
  return loader;
}

export async function getTurnstileToken(action: string) {
  if (!siteKey || typeof window === "undefined") return undefined;
  const turnstile = await loadTurnstile();
  if (!turnstile) return undefined;

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "max(12px, env(safe-area-inset-left))";
    container.style.bottom = "max(12px, env(safe-area-inset-bottom))";
    container.style.zIndex = "50000";
    document.body.appendChild(container);
    let widgetId = "";
    const cleanup = () => {
      if (widgetId) turnstile.remove(widgetId);
      container.remove();
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("security_timeout"));
    }, 18_000);
    widgetId = turnstile.render(container, {
      sitekey: siteKey,
      action,
      execution: "execute",
      appearance: "interaction-only",
      theme: "auto",
      language: "ro",
      callback: (token: string) => {
        window.clearTimeout(timeout);
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error("security_failed"));
      },
      "expired-callback": () => {
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error("security_expired"));
      },
    });
    turnstile.execute(widgetId);
  });
}

export async function protectedFetch(input: RequestInfo | URL, init: RequestInit = {}, action: string) {
  const token = await getTurnstileToken(action);
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("x-pmm-turnstile-token", token);
    headers.set("x-pmm-turnstile-action", action);
  }
  return fetch(input, { ...init, headers });
}
