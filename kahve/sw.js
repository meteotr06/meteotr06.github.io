/* ☕ KAHVE KAVURMA — SERVİS İŞÇİSİ (çevrimdışı katman)
   ==================================================================
   Kavurmahanede internet çoğu zaman zayıftır. Uygulama makinenin
   başındayken çalışmalı; hesap zaten tarayıcının içinde yapılıyor,
   dışarıya hiç istek gitmiyor.

   BU DOSYA ON BİR UYGULAMANIN DERSİYLE YAZILDI:

   1. DAMGA TEK YERDEN TÜRETİLİR. Sürüm adı ile ön önbellek listesindeki
      `?v=` ayrı ayrı yazılırsa biri güncellenip öteki unutulur. Bu
      takımda ölçüldü: sayfa `?v=19` isterken önbellek `?v=17`
      saklıyordu — farklı anahtar, HİÇ EŞLEŞME, çevrimdışı vaadi tutmaz.
      Burada ETİKET, SÜRÜM'den türetiliyor; ikisi ayrışamaz.

   2. YALNIZ KENDİ ORIGIN'İMİZE, YALNIZ GET'E karışırız. Başka bir
      adrese giden ya da POST olan isteğe dokunmak, görmediğimiz bir
      şeyi bozmaktır.

   3. BAŞARISIZ İSTEĞE index.html DÖNMEYİZ. Bir görsel ya da veri
      isteği çökünce tarayıcıya HTML vermek, hatayı gizleyip başka bir
      hataya çevirir. Yalnız SAYFA gezintisinde index.html döneriz.

   4. HATA CEVABI ÖNBELLEĞE ALINMAZ. 500 dönen bir dosyayı saklamak,
      hatayı kalıcı hâle getirir.
   ================================================================== */

const SURUM = 'kahve-v17'
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
const ONEK = SURUM.replace(/v\d+$/, '');;
const ETIKET = '?v=' + SURUM.replace(/^kahve-v/, '');

const CEKIRDEK = [
    './',
    './index.html',
    './stil.css' + ETIKET,
    './cekirdek.js' + ETIKET,
    './dil.js' + ETIKET,
    './veri.js' + ETIKET,
    './arayuz.js' + ETIKET,
    './kurulum.js' + ETIKET,
    './guncelle.js' + ETIKET,
    './manifest.json',
    './ikon-192.png',
    './ikon-512.png',
    './ikon-maskeli.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(SURUM)
            .then((o) => o.addAll(CEKIRDEK))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((adlar) => Promise.all(
                adlar.filter(a => a !== SURUM && a.startsWith(ONEK)).map((a) => caches.delete(a))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const istek = e.request;

    /* Sınır 2: kendi origin'imiz ve GET dışına KARIŞMA. */
    if (istek.method !== 'GET') return;
    let adres;
    try { adres = new URL(istek.url); } catch (x) { return; }
    if (adres.origin !== self.location.origin) return;

    /* Sayfa gezintisi: önce ağ, olmazsa önbellekten sayfa.
       index.html'i YALNIZ burada döndürüyoruz (sınır 3). */
    if (istek.mode === 'navigate') {
        e.respondWith(
            fetch(istek)
                .then((c) => {
                    if (c && c.ok) {
                        const kopya = c.clone();
                        caches.open(SURUM).then((o) => o.put('./index.html', kopya));
                    }
                    return c;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    /* Varlıklar: önce önbellek (hızlı ve çevrimdışı), yoksa ağ. */
    e.respondWith(
        caches.match(istek).then((bulunan) => {
            if (bulunan) return bulunan;
            return fetch(istek).then((cevap) => {
                /* Sınır 4: yalnız SAĞLAM cevabı sakla.
                   `ok` denetimi olmadan 404 ve 500 de önbelleğe girer
                   ve hata kalıcılaşır. */
                if (cevap && cevap.ok && cevap.type === 'basic') {
                    const kopya = cevap.clone();
                    caches.open(SURUM).then((o) => o.put(istek, kopya));
                }
                return cevap;
            });
        })
    );
});
