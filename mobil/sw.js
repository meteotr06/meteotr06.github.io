/* Service worker: uygulamanin kendisini onbellege alir.

   Boylece ana ekrana eklendikten sonra internet olmasa bile uygulama ACILIR.
   (Hava verisi elbette internet ister; o istekler onbelleklenmez ki hep
   guncel veri gelsin.)
*/
/* DIKKAT: ASAGIDAKI `DOSYALAR` LISTESINDEN HERHANGI BIRI degistiginde bu
   SURUM NUMARASINI artirin -- sadece index.html / yerler.js degil.
   (04.09.2026: guncelle.js duzeltildi, damga ayni kalmisti. Bu dosyanin
   kendisi degismezse tarayici sw guncellemesi oldugunu ANLAMAZ; eski
   onbellek silinmez, yeni dosyalar hic indirilmez.)
   Yoksa telefona kurmus kullanicilar eski surumu gormeye devam eder
   (onbellekten servis edilir). Numara degisince eski onbellek silinir. */
const ONBELLEK = "hava-durumu-20260904-160643";
/* ONBELLEK ADI ONEKI -- YALNIZ KENDI ONBELLEKLERIMIZI SILIYORUZ.

   `caches` (CacheStorage) KOKEN basinadir, kapsam basina DEGIL.
   meteotr06.github.io uzerindeki dokuz uygulama ayni onbellek
   listesini paylasir.

   Buradaki temizlik eskiden "adi SURUM olmayan her onbellegi sil"
   diyordu -- yani BUTUN KARDES UYGULAMALARIN onbellegini siliyordu:
   portal, Hesap Araclari, Muhasebe, Kur Pusulasi, Planlayici, Arsa,
   RoastMate, Hava Durumu, Goz Molasi.

   Kullanicinin gordugu sey: ucakta kurulu bir kardes uygulamayi
   aciyor, BOS SAYFA geliyor. Simetrik olduğu icin ailenin cevrimdisi
   vaadi topluca cokuyordu. Hicbir hata mesaji yok; cevrimiciyken her
   sey kusursuz calistigi icin sebep bulunamiyor.

   Sinifi 05 Goz Molasi oturumu buldu ve olctu (`hesap-v95` ile
   `portal-v8` onbellekleri kuruldu; ONCE ikisi de siliniyordu, SONRA
   ikisi de duruyor). Buraya tasindi (K-69).

   ONEK SABITTEN TURETILIR ki ikisi ayrisamasin. Elle yazilsaydi,
   surum adi degistiginde onek geride kalir ve temizlik SESSIZCE
   hicbir seyi silmez olurdu -- eski onbellekler birikirdi. */
const ONEK = ONBELLEK.replace(/\d{8}-\d+$/, '');
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
        adlar.filter(a => a !== ONBELLEK && a.startsWith(ONEK)).map(a => caches.delete(a))))
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
