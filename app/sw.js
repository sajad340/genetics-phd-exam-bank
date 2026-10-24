/* Service worker — offline cache for ژنتیک‌یار exam bank PWA (v2: network-first for data) */
const CACHE = "gy-bank-v2";
const CORE = [
  "./", "./index.html", "./css/app.css", "./js/app.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./fonts/vazirmatn-400.woff2", "./fonts/vazirmatn-500.woff2", "./fonts/vazirmatn-700.woff2"
];
const NET_FIRST = ["data/bank.json", "index.html", "css/app.css", "js/app.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // network-first برای داده‌ها و فایل‌های اصلی → همیشه آخرین نسخه
  if (NET_FIRST.some(p => url.pathname.endsWith(p))) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }
  // cache-first برای بقیه (فونت/آیکون)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
