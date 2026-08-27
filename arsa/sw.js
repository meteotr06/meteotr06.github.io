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

const SURUM = "arsa-v27";

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
    "./cekirdek.js" + ETIKET,
    "./mevzuat.js" + ETIKET,
    "./arayuz.js" + ETIKET,
    "./simge.svg",
    "./ikon-192.png",
    "./manifest.json",
    "./gizlilik.html"
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
                adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
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
        // KURAL 2: sayfada önce ağ. Güncel içerik hemen görünsün.
        olay.respondWith(
            fetch(istek)
                .then(y => {
                    const kopya = y.clone();
                    caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                    return y;
                })
                .catch(() =>
                    caches.match(istek).then(y =>
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
    olay.respondWith(
        caches.match(istek).then(y => {
            const agdan = fetch(istek).then(cevap => {
                const kopya = cevap.clone();
                caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                return cevap;
            }).catch(() => y);          // ağ yoksa önbellekteki iş görür
            return y || agdan;
        })
    );
});
