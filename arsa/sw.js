// Arsa Rehberi — çevrimdışı katmanı
//
// TEMKİNLİ YAZILDI. Bu dosyanın bir hatası bütün siteyi öldürebilir,
// o yüzden üç sert kural var (09 Hesap Araçları'nda öğrendiklerimiz):
//   1) SADECE kendi alan adımızdaki GET istekleri ele alınır.
//      Dış istekler (varsa reklam, yazı tipi) hiç dokunulmadan geçer.
//   2) Sayfa (HTML) isteklerinde ÖNCE AĞ denenir. Böylece güncel içerik
//      hemen görünür; ağ yoksa önbellekten verilir.
//   3) Sayfa yerine geçen yedek yalnızca "navigate" isteğine döner.
//      (Eskiden .js isteğine index.html dönüyordu ve site komple çöküyordu.)
//
// SÜRÜM HER YAYINDA ARTMALI. Artmazsa kullanıcı eski sürümde kalır.

const SURUM = "arsa-v151"
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

// SURUM ETIKETI TEK YERDEN TURETILIR.
// Olculdu (27.08.2026): burada "?v=10" yaziliydi ama index.html "?v=19"
// istiyordu. Yani on onbellege alinan adresler sayfanin istedigi
// adresler DEGILDI: on onbellek bosa gidiyor, cevrimdisinda dosyalar
// bulunamiyordu. Sinama bunu goremezdi -- iki dosyadaki iki ayri sayinin
// elle ayni tutulmasi gerekiyordu ve tutulmamisti.
// Artik etiket SURUM'dan turetiliyor; ikisi ayrisamaz.
const ETIKET = "?v=" + SURUM.replace(/^arsa-v/, "");

const CEKIRDEK = [
    "./",
    "./index.html",
    "./stil.css" + ETIKET,
    "./degisiklikler.js" + ETIKET,
    "./cekirdek.js" + ETIKET,
    "./mevzuat.js" + ETIKET,
    "./arayuz.js" + ETIKET,
    "./kurulum.js" + ETIKET,
    "./guncelle.js" + ETIKET,
    "./rayic.js" + ETIKET,
    /* 04.09.2026 EKLENDI. index.html `parsel.js?v=NN` istiyordu ama
       bu listede adi HIC GECMIYORDU. Iki zarari vardi:
         - cevrimdisi ILK acilista bulunmuyordu;
         - ve daha agiri: `damga_denetle.py` izledigi dosya
           listesini TAM BU LISTEDEN turetiyor, yani parsel.js
           degisse damga denetcisi "tutarli" deyip 0 donuyordu --
           bakmadigi bir dosya icin. Listeye eklemek iki deligi
           birden kapatiyor. */
    "./parsel.js" + ETIKET,
    /* Resmi taban veri: 84 KB. Onbellege alinir ki cevrimdisi de calissin --
       ama kullanici bolumu acmadan indirilmez (rayic.js istek uzerine cekiyor).
       Burada olmasi, bir kez indirildikten sonra internetsiz de acilmasini saglar.

       ETIKET SART: 29.08.2026'da paket guncellendi ve tarayici ESKISINI
       verdi. rayic.js artik dosyayi "?v=NN" ile istiyor; on onbellek
       ETIKETSIZ alsaydi istenen adres onbellekte BULUNMAZDI ve
       cevrimdisi calisma sessizce olurdu. Ikisi ayni SURUM'dan
       tureniyor, elle tutulmuyor. */
    "./veri/menemen.json" + ETIKET,
    "./simge.svg",
    "./ikon-192.png",
    "./manifest.json",
    "./gizlilik.html",
    "./neler-degisti.html"
];

self.addEventListener("install", (olay) => {
    olay.waitUntil(
        caches.open(SURUM)
            // Tek bir dosya inmezse kurulum tamamen çökmesin diye tek tek ekle
            .then(k => Promise.all(CEKIRDEK.map(u => k.add(u).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (olay) => {
    olay.waitUntil(
        caches.keys()
            .then(adlar => Promise.all(
                adlar.filter(a => a !== SURUM && a.startsWith(ONEK)).map(a => caches.delete(a))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (olay) => {
    const istek = olay.request;

    // KURAL 1: yalnızca kendi alan adımız, yalnızca GET
    if (istek.method !== "GET") return;
    const adres = new URL(istek.url);
    if (adres.origin !== self.location.origin) return;

    const sayfa_mi = istek.mode === "navigate" ||
                     (istek.headers.get("accept") || "").includes("text/html");

    if (sayfa_mi) {
        /* SAYFA ANAHTARI SORGUSUZ.
           Olculdu (03.09.2026): sayfa TAM ADRESLE anahtarlaniyordu ve
           her farkli sorgu KALICI YENI BIR KOPYA uretiyordu:
               baslangic                 19 girdi / 19 essiz yol
               ?sekme=... ?ornek=1       24 girdi / 19 essiz yol
               ?fbclid=... ?utm_source=  28 girdi / 19 essiz yol
           Ana sayfanin 10 kopyasi birikmisti.

           Ic baglantilardan gelen buyume sinirliydi (`?sekme=` dort
           deger alir). Ama paylasim baglantilari `?fbclid=`,
           `?utm_source=`, `?ref=` gibi RASTGELE ek tasir: WhatsApp'ta
           paylasilan her baglanti yeni bir kopya birakir. Pratikte
           sinirsiz -- olcumde de oyle cikti.

           Zarar sessizdir: telefonda kota dolunca tarayici onbellege
           yazmayi reddeder ve CEVRIMDISI KATMAN OLUR. Ekranda hicbir
           sey degismez; kullanici internetsiz kalinca uygulamanin
           acilmadigini gorur, sebebini bilemez.

           Desen 09 Hesap Araclari oturumundan geldi; oradaki olcum
           63 essiz yola karsi 177 girdiydi.

           VARLIK DAMGASINA DOKUNULMUYOR: `?v=NN` tam da adresi
           degistirmek icin var. Sayfa ile varlığı ayni kuralla ele
           almak surumlemeyi cokertirdi. */
        const sayfa_anahtari = new Request(adres.origin + adres.pathname,
                                           { method: "GET" });
        // KURAL 2: sayfada önce ağ. Güncel içerik hemen görünsün.
        olay.respondWith(
            fetch(istek)
                .then(y => {
                    const kopya = y.clone();
                    caches.open(SURUM)
                          .then(k => k.put(sayfa_anahtari, kopya))
                          .catch(() => {});
                    return y;
                })
                .catch(() =>
                    caches.match(sayfa_anahtari).then(y =>
                        // KURAL 3: yedek yalnızca gezinme isteğine döner
                        y || caches.match("./index.html")
                    )
                )
        );
        return;
    }

    // Diğer dosyalarda (css/js/png): önbellekten VER ama arkada YENİLE.
    //
    // NEDEN BÖYLE (ölçüldü, 26.08.2026): Sadece önbellekten verirken bir kod
    // düzeltmesi tarayıcıya HİÇ ULAŞMADI. `cekirdek.js`e yeni bir fonksiyon
    // eklendi, sayfa eski kopyayı kullanmaya devam etti ve "bu fonksiyon yok"
    // hatası verdi. Sürüm damgasını (?v=) artırmak bile yetmedi.
    //
    // Bu, yayında en sinsi hata türü: düzeltmeyi yaparsın, testler geçer,
    // kullanıcı hâlâ hatalı sürümü çalıştırır. Şimdi en fazla BİR açılış
    // eski kalıyor, sonraki açılışta kendini düzeltiyor.
    // DAMGA UYUSMAZSA ONBELLEK KACIRIR -- `ignoreSearch` sart.
    //
    // Olculdu (29.08.2026), gercek onbellek uzerinde:
    //     /cekirdek.js            -> BULUNAMADI  (damgasiz istek)
    //     /cekirdek.js?v=63       -> bulundu     (dogru damga)
    //     /cekirdek.js?v=1029      -> BULUNAMADI  (baska damga)
    //     /cekirdek.js?v=1029 + ignoreSearch -> bulundu
    //     /yok.js + ignoreSearch  -> bulunamadi  (ters dal: her seye
    //                                             "var" demiyor)
    //
    // Tehlikeli pencere: yeni surum yayinlaninca on onbellek "?v=64"
    // ile dolar ve eski onbellek silinir. Ama kullanicinin elindeki
    // SAYFA hala eski olabilir ve "?v=63" ister. Damgalar uyusmaz,
    // onbellek kacirir, aga duser -- ve kullanici o an CEVRIMDISIYSA
    // uygulama ACILMAZ. Tam da cevrimdisi katmaninin var olma sebebi
    // olan anda calismamis olur.
    //
    // `ignoreSearch` ile eski damgali istek, onbellekteki YENI kopyayi
    // alir: hem cevrimdisi calisir hem daha guncel kodu kullanir.
    // (05 oturumu ayni gun kendi tarafinda bu kurali sinamis ve
    // niye sart oldugunu ayni sekilde olcmus.)
    olay.respondWith(
        caches.match(istek, { ignoreSearch: true }).then(y => {
            const agdan = fetch(istek).then(cevap => {
                const kopya = cevap.clone();
                caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                return cevap;
            }).catch(() => y);          // ağ yoksa önbellekteki iş görür
            return y || agdan;
        })
    );
});
