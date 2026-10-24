/* Service worker — offline cache for ژنتیک‌یار exam bank PWA */
const CACHE = "gy-bank-v1";
const ASSETS = [
  "./", "./index.html", "./css/app.css", "./js/app.js", "./data/bank.json",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
  "./fonts/vazirmatn-400.woff2", "./fonts/vazirmatn-500.woff2", "./fonts/vazirmatn-700.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
