// Only a generic offline screen is cached. Never cache Clerk, APIs, player data,
// Next.js RSC responses, or authenticated HTML.
const CACHE = "stryk-offline-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/offline.html")));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("stryk-offline-") && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" ||
      url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match("/offline.html")) ||
    new Response("STRYK is offline. Please reconnect.", { status: 503 })));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const url = typeof payload.url === "string" && /^\/matches\/[a-zA-Z0-9_-]+$/.test(payload.url) ? payload.url : "/notifications";
  event.waitUntil(self.registration.showNotification(payload.title || "STRYK", {
    body: payload.body || "You have a match reminder.", icon: "/pwa/icon-192.png",
    badge: "/pwa/icon-192.png", tag: payload.tag || "stryk-reminder", data: { url },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/notifications";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
