// Generated into out/sw.js by build-pwa.mjs. Only public, static application files are cached.
const CACHE_NAME = "itm-static-__BUILD_ID__";
const PRECACHE_URLS = __PRECACHE_URLS__;
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (let index = 0; index < PRECACHE_URLS.length; index += 12) {
      const batch = PRECACHE_URLS.slice(index, index + 12).map((path) => new Request(path, { cache: "reload" }));
      await cache.addAll(batch);
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("itm-static-") && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
      try {
        const response = await fetch(request);
        if (response.ok && !url.search && response.headers.get("content-type")?.includes("text/html")) {
          await cache.put(pathname, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(pathname)) || Response.error();
      }
    })());
    return;
  }

  if (PRECACHE_PATHS.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.pathname)) || fetch(request);
    })());
  }
});
