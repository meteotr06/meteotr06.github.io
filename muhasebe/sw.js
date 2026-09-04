/* Muhasebe mobil — çevrimdışı katmanı.

   ESKİ HÂLİ NEDEN DEĞİŞTİ (26 Ağustos 2026, ölçülerek):
   Eski sürüm HER İSTEĞİ önce önbellekten veriyordu ("cache-first") ve
   arkadan tazelemiyordu. Bu uygulamanın tamamı tek bir index.html
   olduğu için sonucu şuydu: index.html bir kez önbelleğe girdikten sonra,
   bir hatayı düzeltip yayınlasak bile kullanıcı ESKİ SÜRÜMDE kalıyordu.
   Yani "düzelttik" dediğimiz şey kullanıcıya hiç ulaşmıyordu.

   Ayrıca üç sessiz tuzağı vardı:
     1) Dış alan adlarına giden istekleri de yakalıyordu.
     2) Çevrimdışıyken HER isteğe index.html döndürüyordu — bir .png ya da
        .json isteğine HTML dönmesi sayfayı komple bozar.
     3) Ağdan gelen cevapları önbelleğe hiç yazmıyordu; yalnızca kurulumda
        listelenen 4 dosya vardı, gizlilik.html çevrimdışı hiç açılmıyordu.

   Yeni kurallar (09 Hesap Araçları'nın sınanmış sw.js'i ile aynı):
     1) Sadece kendi alan adımız, sadece GET.
     2) Sayfa (HTML) isteğinde ÖNCE AĞ — düzeltme aynı gün ulaşsın.
     3) Diğer varlıklarda önbellekten ver, ARKADAN tazele.
     4) Yedek sayfa yalnızca gerçek sayfa (navigate) isteğine döner.
*/

const SURUM = "muhasebe-v17";
const DOSYALAR = [
  "./",
  "index.html",
  "gizlilik.html",
  "kurulum.js",
  "guncelle.js",
  "manifest.json",
  "simge-192.png",
  "simge-512.png",
  "simge-maskeli-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SURUM)
      // Tek bir dosya inmezse kurulum komple çökmesin diye tek tek ekliyoruz.
      .then((c) => Promise.all(DOSYALAR.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== SURUM).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const istek = e.request;

  // KURAL 1: yalnızca kendi alan adımız, yalnızca GET
  if (istek.method !== "GET") return;
  let url;
  try { url = new URL(istek.url); } catch (h) { return; }
  if (url.origin !== self.location.origin) return;

  const sayfaMi = istek.mode === "navigate" ||
                  (istek.headers.get("accept") || "").indexOf("text/html") >= 0;

  /* SAYFA ANAHTARINDAN SORGUYU DUS.
     Ölçüldü (03.09.2026, canlı): sayfa TAM ADRESLE anahtarlanıyordu.
     Üç farklı sorguyla girildi --
       /muhasebe/?utm_source=whatsapp
       /muhasebe/?kampanya=eylul
       /muhasebe/?x=3
     -- ve önbellek 8 girdiden 11'e çıktı: 8 eşsiz yol, 11 kopya.
     Her biri sayfanın TAM kopyası (52 KB) ve KALICI.

     Kritik olan şu: bu bağlantıları uygulama üretmiyor. WhatsApp,
     Facebook ve reklam araçları paylaşılan adrese kendileri
     `?fbclid=`, `?utm_source=` ekler. Yani uygulamada paylaşım
     özelliği olmasa bile büyüme yaşanır -- paylaşılması yeter.

     Telefonda kota dolunca tarayıcı önbelleğe yazmayı reddeder ve
     ÇEVRİMDIŞI KATMAN SESSİZCE ÖLÜR; ekranda hiçbir şey değişmez.

     VARLIKTA AYNISI YAPILMAZ: `?v=NN` damgası sürümlemenin kendisidir,
     düşürülseydi eski ve yeni dosya aynı anahtara yazılırdı. */
  const sayfaAnahtari = (istek) => {
    const u = new URL(istek.url);
    u.search = "";
    return u.href;
  };

  if (sayfaMi) {
    // KURAL 2: sayfada önce ağ. Düzeltme yayınlandığı gün görünsün.
    e.respondWith(
      fetch(istek)
        .then((cevap) => {
          if (cevap && cevap.ok) {
            const kopya = cevap.clone();
            caches.open(SURUM).then((c) => c.put(sayfaAnahtari(istek), kopya))
              .catch(() => {});
          }
          return cevap;
        })
        .catch(() => caches.match(sayfaAnahtari(istek)).then((bulunan) => {
          if (bulunan) return bulunan;
          // KURAL 4: yedek sayfa yalnızca gerçek sayfa isteğine
          if (istek.mode === "navigate") return caches.match("index.html");
          return new Response("", { status: 504, statusText: "Baglanti yok" });
        }))
    );
    return;
  }

  // KURAL 3: görsel / manifest: önce önbellek (hızlı açılsın), arkadan tazele
  e.respondWith(
    caches.match(istek).then((bulunan) => {
      const agdan = fetch(istek).then((cevap) => {
        if (cevap && cevap.ok) {
          const kopya = cevap.clone();
          caches.open(SURUM).then((c) => c.put(istek, kopya)).catch(() => {});
        }
        return cevap;
      }).catch(() => bulunan);
      return bulunan || agdan;
    })
  );
});
