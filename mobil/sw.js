/* Service worker: uygulamanin kendisini onbellege alir.

   Boylece ana ekrana eklendikten sonra internet olmasa bile uygulama ACILIR.
   (Hava verisi elbette internet ister; o istekler onbelleklenmez ki hep
   guncel veri gelsin.)
*/
/* DIKKAT: index.html / yerler.js degistiginde bu SURUM NUMARASINI artirin.
   Yoksa telefona kurmus kullanicilar eski surumu gormeye devam eder
   (onbellekten servis edilir). Numara degisince eski onbellek silinir. */
const ONBELLEK = "hava-durumu-20260904-115826";
const DOSYALAR = [
  "index.html",
  "yerler.js",
  "kurulum.js",
  "guncelle.js",
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

  // Diger dosyalar (js/css/png): onbellekten VER ama arkada YENILE.
  //
  // NEDEN DEGISTI (26.08.2026, capraz denetim): Burasi saf onbellek-onceydi
  // ve arkadan tazeleme yoktu. Sonuc: bir duzeltme yapilsa bile kullanici
  // ESKI kodu calistirmaya devam ediyor. Yayinda en sinsi hata turu budur —
  // duzeltirsin, sinamalar gecer, kullanici hala hatali surumde.
  //
  // Dosyanin basindaki "SURUM NUMARASINI artirin" notu bunu insan
  // disiplinine birakiyordu. O disiplin tutmuyor: kardes projede ayni tuzaga
  // UC KEZ dusuldu ve ancak otomatik denetimle (damga_denetle.py) cozuldu.
  //
  // Simdi en fazla BIR acilis eski kaliyor, sonraki acilista kendini duzeltiyor.
  olay.respondWith(
    caches.match(istek).then(c => {
      const agdan = fetch(istek).then(cevap => {
        const kopya = cevap.clone();
        caches.open(ONBELLEK).then(o => o.put(istek, kopya)).catch(() => {});
        return cevap;
      }).catch(() => c);        // ag yoksa onbellektek is gorur
      return c || agdan;
    })
  );
});
