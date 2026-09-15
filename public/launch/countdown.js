(() => {
  "use strict";
  const bootstrap = JSON.parse(document.getElementById("launch-bootstrap").textContent);
  const config = typeof bootstrap === "object" && bootstrap ? bootstrap : {
    launchAt: "2026-09-18T18:00:00+03:00", serverNow: Date.now(), preview: true,
  };
  let serverEpoch = config.serverNow;
  let sampledAt = performance.now();
  let launchAt = Date.parse(config.launchAt);
  let syncing = false;
  let redirecting = false;
  let syncTimer;
  const fields = Object.fromEntries([...document.querySelectorAll("[data-count]")].map(el => [el.dataset.count, el]));
  const status = document.getElementById("launch-status");
  const serverTime = () => serverEpoch + performance.now() - sampledAt;

  function draw() {
    const seconds = Math.max(0, Math.ceil((launchAt - serverTime()) / 1000));
    const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
    for (const [key, value] of Object.entries(values)) fields[key].textContent = String(value).padStart(2, "0");
    if (seconds === 0 && !config.preview && !redirecting) {
      status.textContent = "A sosit momentul. Deschidem povestea…";
      if (!syncing) void sync();
    }
    if (seconds === 0 && config.preview) status.textContent = "Povestea s-a deschis. Ne vedem pe site!";
  }

  async function sync() {
    if (syncing || redirecting || location.protocol === "file:") return;
    syncing = true;
    clearTimeout(syncTimer);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const started = performance.now();
    try {
      const response = await fetch("/api/launch", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("launch clock unavailable");
      const data = await response.json();
      if (!Number.isFinite(data.serverNow) || !Number.isFinite(Date.parse(data.launchAt))) throw new Error("invalid launch clock");
      launchAt = Date.parse(data.launchAt);
      serverEpoch = data.serverNow + (performance.now() - started) / 2;
      sampledAt = performance.now();
      if (data.open === true && !config.preview) {
        redirecting = true;
        const target = new URL(location.href);
        if (target.pathname === "/in-curand" || target.pathname.startsWith("/launch/")) target.pathname = "/";
        // Assigning the same URL with a fragment is only a same-document jump.
        if (target.href === location.href) location.reload();
        else location.replace(target.href);
        return;
      }
    } catch {
      // The server, not the device clock, decides when it is safe to reopen.
    } finally {
      clearTimeout(timeout);
      syncing = false;
      if (!redirecting) syncTimer = setTimeout(sync, launchAt - serverTime() <= 5000 ? 1000 : 30000);
    }
  }

  document.addEventListener("visibilitychange", () => { if (!document.hidden) { draw(); void sync(); } });
  window.addEventListener("pageshow", () => { draw(); void sync(); });
  window.addEventListener("online", () => void sync());
  draw();
  setInterval(draw, 1000);
  void sync();
})();
