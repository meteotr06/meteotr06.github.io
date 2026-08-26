/* Service worker: uygulamanin kendisini onbellege alir.

   Boylece ana ekrana eklendikten sonra internet olmasa bile uygulama ACILIR.
   (Hava verisi elbette internet ister; o istekler onbelleklenmez ki hep
   guncel veri gelsin.)
*/
/* DIKKAT: index.html / yerler.js degistiginde bu SURUM NUMARASINI artirin.
   Yoksa telefona kurmus kullanicilar eski surumu gormeye devam eder
   (onbellekten servis edilir). Numara degisince eski onbellek silinir. */
const ONBELLEK = "hava-durumu-20260826-1558";
const DOSYALAR = [
  "index.html",
  "yerler.js",
  "manifest.json",
  "simge-192.png",
  "simge-512.png",
  "leaflet/leaflet.js",
  "leaflet/leaflet.css"
];

self.addEventListener("install", olay => {
  olay.waitUntil(
    caches.open(ONBELLEK)
      .then(o => o.addAll(DOSYALAR))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", olay => {
  olay.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(
        adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", olay => {
  const istek = olay.request;
  const url = new URL(istek.url);

  // Dis servisler (hava verisi, radar, harita dosemeleri) HER ZAMAN agdan gelsin
  if (url.origin !== location.origin) return;

  // HTML/sayfa istegi: ONCE AG -> en guncel surum gelir (harita/yenilikler
  // aninda goruur). Internet yoksa onbellekten ac. Boylece kullanici ASLA
  // eski surumde takili kalmaz.
  const sayfaMi = istek.mode === "navigate" || istek.destination === "document"
    || url.pathname === "/" || url.pathname.endsWith("/")
    || url.pathname.endsWith(".html");
  if (sayfaMi) {
    olay.respondWith(
      fetch(istek).then(cevap => {
        const kopya = cevap.clone();
        caches.open(ONBELLEK).then(o => o.put(istek, kopya));
        return cevap;
      }).catch(() => caches.match(istek).then(c => c || caches.match("index.html")))
    );
    return;
  }

  // Diger dosyalar (js/css/png): once onbellek (hizli), yoksa agdan al + sakla
  olay.respondWith(
    caches.match(istek).then(c => c || fetch(istek).then(cevap => {
      const kopya = cevap.clone();
      caches.open(ONBELLEK).then(o => o.put(istek, kopya));
      return cevap;
    }))
  );
});
