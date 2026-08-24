// ================= SERVİS ÇALIŞANI =================
// Uygulamayı çevrimdışı da açar: dosyaları önbelleğe alır.
// Yeni sürüm çıkarınca SURUM'u artır ki herkese taze dosyalar gitsin.

const SURUM = "kur-pusulasi-v20";
const DOSYALAR = [
    "./",
    "./index.html",
    "./stil.css?v=20",
    "./cekirdek.js?v=20",
    "./arayuz.js?v=20",
    "./manifest.json",
    "./ikon-192.png",
    "./ikon-512.png",
    "./ikon-maskeli.png",
    "./kisayol-tahmin.png",
    "./kisayol-dolar.png",
    "./kisayol-altin.png",
    "./kisayol-faiz.png"
];

self.addEventListener("install", (olay) => {
    olay.waitUntil(caches.open(SURUM).then((onbellek) => onbellek.addAll(DOSYALAR)));
    self.skipWaiting();
});

self.addEventListener("activate", (olay) => {
    // Eski sürümlerin önbelleğini temizle
    olay.waitUntil(
        caches.keys()
            .then((adlar) => Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (olay) => {
    const adres = olay.request.url;

    // Kur/fiyat verisi ASLA önbellekten verilmez — eski fiyat göstermek yanlış olur.
    // İnternet yoksa uygulama zaten kendi önbelleğindeki son veriyi kullanır.
    if (adres.includes("frankfurter") || adres.includes("gold-api") ||
        adres.includes("worldbank") || adres.includes("stooq")) {
        return;   // tarayıcı normal şekilde ağdan alsın
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
