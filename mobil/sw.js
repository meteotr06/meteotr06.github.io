/* Service worker: uygulamanin kendisini onbellege alir.

   Boylece ana ekrana eklendikten sonra internet olmasa bile uygulama ACILIR.
   (Hava verisi elbette internet ister; o istekler onbelleklenmez ki hep
   guncel veri gelsin.)
*/
/* DIKKAT: index.html / yerler.js degistiginde bu SURUM NUMARASINI artirin.
   Yoksa telefona kurmus kullanicilar eski surumu gormeye devam eder
   (onbellekten servis edilir). Numara degisince eski onbellek silinir. */
const ONBELLEK = "hava-durumu-v3";
const DOSYALAR = [
  "index.html",
  "yerler.js",
  "manifest.json",
  "simge-192.png",
  "simge-512.png"
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
  const url = new URL(olay.request.url);
  // hava verisi HER ZAMAN agdan gelsin (onbellekten eski veri gostermeyelim)
  if (url.hostname.includes("open-meteo.com")) return;
  olay.respondWith(
    caches.match(olay.request).then(c => c || fetch(olay.request))
  );
});
