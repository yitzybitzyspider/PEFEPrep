/* PEFEPrep service worker — offline-capable daily-study PWA.
 * Strategy:
 *  - navigations (HTML)      : network-first  -> cache -> offline shell
 *  - same-origin data (json) : network-first  -> cache   (new days appear online, last set works offline)
 *  - versioned assets/fonts  : stale-while-revalidate    (instant, refresh in background)
 *  - Supabase / other APIs   : network only   (never cached)
 * Cache name is versioned so each release cleans up the previous one. */
const VERSION = "0.21.2";
const CACHE = "pefeprep-" + VERSION;

// Minimal shell precached on install so the app opens offline after one visit.
const CORE = [
  "/index.html", "/today.html", "/browse.html", "/progress.html",
  "/settings.html", "/resources.html", "/changelog.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // tolerate individual failures (e.g. a path that 404s) so install still succeeds
    await Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("pefeprep-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

function isHTML(req) {
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

self.addEventListener("fetch", (e) => {
  const req = e.req || e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // never cache Supabase or other API calls — always go to the network
  if (!sameOrigin && /supabase\.(co|in)/.test(url.host)) return;

  // navigations: network-first so deploys are picked up, fall back to cache offline
  if (isHTML(req)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => {});
        return res;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match("/today.html")) ||
          (await caches.match("/index.html")) ||
          new Response("<h1>Offline</h1><p>Reconnect to load new content.</p>", { headers: { "Content-Type": "text/html" } });
      }
    })());
    return;
  }

  // same-origin JSON data: network-first (fresh days online, last cached set offline)
  if (sameOrigin && url.pathname.endsWith(".json")) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => {});
        return res;
      } catch (_) {
        return (await caches.match(req)) || new Response("{}", { headers: { "Content-Type": "application/json" } });
      }
    })());
    return;
  }

  // same-origin assets + fonts/katex CDN: stale-while-revalidate
  const cacheable = sameOrigin || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host);
  if (cacheable) {
    e.respondWith((async () => {
      const cached = await caches.match(req);
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          caches.open(CACHE).then((c) => c.put(req, res.clone()).catch(() => {}));
        }
        return res;
      }).catch(() => null);
      return cached || network || new Response("", { status: 504 });
    })());
  }
});
