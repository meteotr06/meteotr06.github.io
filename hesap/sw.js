// Hesap Araçları — çevrimdışı katmanı
//
// TEMKİNLİ YAZILDI. Bu dosyanın bir hatası bütün siteyi öldürebilir,
// o yüzden üç sert kural var:
//   1) SADECE kendi alan adımızdaki GET istekleri ele alınır.
//      Reklam (googlesyndication) ve diğer dış istekler hiç dokunulmadan geçer.
//   2) Sayfa (HTML) isteklerinde ÖNCE AĞ denenir. Böylece güncel içerik
//      hemen görünür; ağ yoksa önbellekten verilir.
//   3) Sayfa yerine geçen yedek yalnızca "navigate" isteğine döner.
//      (Eskiden .js isteğine index.html dönüyordu ve site komple çöküyordu.)

const SURUM = "hesap-v24";
const CEKIRDEK = [
    "./",
    "./index.html",
    "./stil.css?v=24",
    "./hesap.js?v=24",
    "./sayfa.js?v=24",
    "./simge.svg",
    "./ikon-192.png",
    "./manifest.json"
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
            .then(adlar => Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (olay) => {
    const istek = olay.request;

    // KURAL 1: yalnızca kendi alan adımız, yalnızca GET
    if (istek.method !== "GET") return;
    let url;
    try { url = new URL(istek.url); } catch (e) { return; }
    if (url.origin !== self.location.origin) return;   // reklam ve dış kaynaklara dokunma

    const sayfaMi = istek.mode === "navigate" ||
                    (istek.headers.get("accept") || "").indexOf("text/html") >= 0;

    if (sayfaMi) {
        // KURAL 2: sayfada önce ağ (içerik güncel kalsın), sonra önbellek
        olay.respondWith(
            fetch(istek)
                .then(cevap => {
                    if (cevap && cevap.ok) {
                        const kopya = cevap.clone();
                        caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                    }
                    return cevap;
                })
                .catch(() => caches.match(istek).then(bulunan => {
                    if (bulunan) return bulunan;
                    // KURAL 3: yedek sayfa yalnızca gerçek sayfa isteğine
                    if (istek.mode === "navigate") return caches.match("./index.html");
                    return new Response("", { status: 504, statusText: "Baglanti yok" });
                }))
        );
        return;
    }

    // CSS / JS / görsel: önce önbellek (hızlı açılsın), arkadan tazele
    olay.respondWith(
        caches.match(istek).then(bulunan => {
            const agdan = fetch(istek).then(cevap => {
                if (cevap && cevap.ok) {
                    const kopya = cevap.clone();
                    caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                }
                return cevap;
            }).catch(() => bulunan);
            return bulunan || agdan;
        })
    );
});
