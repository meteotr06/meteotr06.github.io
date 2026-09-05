// ================= SERVİS ÇALIŞANI =================
// Uygulamayı çevrimdışı da açar: dosyaları önbelleğe alır.
// Yeni sürüm çıkarınca SURUM'u artır ki herkese taze dosyalar gitsin.

const SURUM = "kur-pusulasi-v54";
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
const ONEK = SURUM.replace(/v\d+$/, '');
// DAMGA SURUM'den TURETILIYOR, elle yazilmiyor.
// Sebep (29.08.2026, nobetci yakaladi): SURUM "kur-pusulasi-v38"e
// cikarilmis ama asagidaki liste v36 damgasinda kalmisti. Sayfa v38
// istiyor, on-bellege alinan v36 -- FARKLI ANAHTAR, hic eslesmiyor.
//
// BU UC SAYI BILEREK "?v" ISARETI OLMADAN YAZILDI (04.09.2026).
// surum_artir.py dosyadaki her "v=<sayi>" kalibini tazeliyor ve bu
// TARIHI ORNEGI de her surumde tazeliyordu: 38/36 zamanla 53/53
// oldu, yani "FARKLI ANAHTAR" diyen cumle ayni sayiyi iki kez
// gosterip kendini yalanliyordu. Aracin neden var oldugunu anlatan
// not, aracin kendisi tarafindan siliniyordu. Isaret dusunce kalip
// eslesmiyor, anlati yerinde kaliyor.
// Sonuc: cevrimdisi acilista CSS/JS bulunamiyor, uygulama yarim aciliyor.
// Cevrimiciyken hicbir sey bozulmadigi icin kimse fark etmiyor.
// Ayni hata 09 Hesap Araclari'nda da vardi; cozum orada da bu:
// iki ayri yerde yazilan sayi ayrisir, tek kaynaktan turetilen ayrisamaz.
const DAMGA = "?v=" + SURUM.replace(/^\D*v/, "");
const DOSYALAR = [
    "./",
    "./index.html",
    "./stil.css" + DAMGA,
    "./cekirdek.js" + DAMGA,
    "./arayuz.js" + DAMGA,
    "./guncelle.js" + DAMGA,
    "./manifest.json",
    "./ikon-192.png",
    "./ikon-512.png",
    "./ikon-maskeli.png",
    "./kisayol-tahmin.png",
    "./kisayol-dolar.png",
    "./kisayol-altin.png",
    "./kisayol-faiz.png",
    "./ekran-telefon-1.png",
    "./ekran-telefon-2.png",
    "./ekran-genis-1.png",
    "./acilis-ekrani.png"
];

self.addEventListener("install", (olay) => {
    olay.waitUntil(caches.open(SURUM).then((onbellek) => onbellek.addAll(DOSYALAR)));
    self.skipWaiting();
});

self.addEventListener("activate", (olay) => {
    // Eski sürümlerin önbelleğini temizle
    olay.waitUntil(
        caches.keys()
            .then((adlar) => Promise.all(adlar.filter(a => a !== SURUM && a.startsWith(ONEK)).map(a => caches.delete(a))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (olay) => {
    const adres = olay.request.url;

    /* BASKA KAYNAKTAN gelen hicbir sey onbellege alinmaz.
       Kur/fiyat verisi onbellekten verilirse ESKI FIYAT TAZE sanilir.

       BURADA ELLE TUTULAN BIR ALAN ADI LISTESI VARDI VE CURUMUSTU
       (1 Eylul 2026'da olculdu):
         - `coingecko` listede YOKTU. Ag koptugunda kripto istegine
           onbellekten cevap geliyor, `y.ok` DOGRU donuyor ve uygulama
           eski fiyati taze sayiyordu. Ustelik tazelik rozeti DOVIZ
           verisine bakiyor, o yuzden ekranda "canli" yaziyordu:
           kullanici dunku kripto fiyatini bugunku saniyordu.
         - `stooq` listede VARDI ama projede hic kullanilmiyordu.
           Liste hem eksik hem fazlaydi.

       Liste yerine KURAL: uygulamanin butun varliklari ayni kaynaktan
       geliyor (olculdu: index.html'de disaridan tek bir font/betik bile
       yok). Dolayisiyla "kaynak disi ise atla" hem bugunku dort API'yi
       hem YARIN EKLENECEK besincisini kapsar. Liste curur, kural
       curumez. */
    const istek = new URL(adres);
    if (istek.origin !== self.location.origin) {
        return;   // tarayici normal sekilde agdan alsin
    }

    if (olay.request.method !== "GET") return;

    // Uygulama dosyaları: önce ağ (güncel kalsın), olmazsa önbellek (çevrimdışı çalışsın)
    olay.respondWith(
        fetch(olay.request)
            .then((yanit) => {
                if (yanit && yanit.ok) {
                    const kopya = yanit.clone();
                    caches.open(SURUM).then((onbellek) => onbellek.put(olay.request, kopya));
                }
                return yanit;
            })
            .catch(() => caches.match(olay.request).then((y) => {
                if (y) return y;

                // ÖNEMLİ: Sadece SAYFA isteğine index.html döndürülür.
                // Eskiden her isteğe dönüyordu; ağda tek bir aksama olunca
                // tarayıcı "cekirdek.js" yerine HTML alıyor ve uygulama komple çöküyordu.
                // Bunu ölçerek yakaladık — "Unexpected token '<'" hatası buradan geliyordu.
                if (olay.request.mode === "navigate") return caches.match("./index.html");

                // Diğer dosyalarda dürüst davran: yok de, sahte içerik verme.
                return new Response("", { status: 504, statusText: "Baglanti yok" });
            }))
    );
});
