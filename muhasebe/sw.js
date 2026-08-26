/* Muhasebe mobil - servis calisani (cevrimdisi calisma).
   Onbellek surumu HER YAYINDA artmali (surum_artir.py otomatik yapar) ki
   kullanici eski surumde kalmasin. */
const SURUM = "muhasebe-v5";
const DOSYALAR = [
  "index.html",
  "manifest.json",
  "simge-192.png",
  "simge-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SURUM).then((c) => c.addAll(DOSYALAR)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== SURUM).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Once onbellek, yoksa ag; ag da yoksa (cevrimdisi) index.html'e dus.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match("index.html")))
  );
});
