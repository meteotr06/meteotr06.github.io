/* 🏠 PORTAL — SERVİS İŞÇİSİ (ana sayfa)
   ==================================================================
   BU DOSYA ALT UYGULAMALARA KARIŞMAZ. En önemli tasarım kararı bu.

   Kökte kayıtlı bir servis işçisinin kapsamı `/` olur ve teoride bütün
   siteyi kapsar. Ama alt uygulamaların kendi işçileri daha DAR kapsamda
   (`/arsa/`, `/hesap/`, `/mobil/` …) ve tarayıcı bir sayfayı, kapsamı
   EN UZUN eşleşen işçiye verir. Yani `/arsa/` sayfasını `/arsa/sw.js`
   yönetir, bu dosya değil.

   Yine de garantiye alıyoruz: bu işçi, yolu bir alt uygulama klasörüyle
   başlayan hiçbir isteğe DOKUNMAZ. Kapsam kuralına güvenip geçmek
   yerine açıkça reddediyoruz — çünkü yedi uygulamanın çevrimdışı
   davranışını bozmak, portalın çevrimdışı çalışmasından çok daha
   pahalıdır.

   Diğer kurallar kardeş uygulamalardan alındı (K-69):
     · yalnız kendi origin, yalnız GET
     · başarısız isteğe index.html DÖNMEZ (yalnız sayfa gezintisinde)
     · hata cevabı (404/500) önbelleğe ALINMAZ
     · damga TEK yerden türetilir
   ================================================================== */

const SURUM = 'portal-v9';

/* Alt uygulama klasörleri — bu yollara BAŞLAYAN hiçbir isteğe karışılmaz.
   Yeni uygulama eklenince buraya da eklenmeli; unutulursa portal onun
   isteklerine karışmaya başlar. */
const ALT_UYGULAMALAR = [
    '/arsa/', '/hesap/', '/kur-pusulasi/', '/muhasebe/',
    '/mobil/', '/planlayici/', '/goz-molasi/', '/kahve/'
];

const CEKIRDEK = [
    '/',
    '/index.html',
    '/manifest.json',
    '/portal-192.png',
    '/portal-512.png',
    '/portal-maskeli.png'
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
                adlar.filter((a) => a !== SURUM).map((a) => caches.delete(a))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const istek = e.request;
    if (istek.method !== 'GET') return;

    let adres;
    try { adres = new URL(istek.url); } catch (x) { return; }
    if (adres.origin !== self.location.origin) return;

    /* ALT UYGULAMALARA DOKUNMA. Kapsam kuralı zaten koruyor ama
       açıkça reddetmek, bir gün kapsam yanlış kurulursa
       ALT_UYGULAMALAR listesindeki her uygulamanın çevrimdışı
       davranışını kurtarır. (Önce "yedi uygulama" yazıyordu; liste
       sekize çıktı, yorum geride kaldı. Yoruma SAYI yazmak, sayının
       değişeceğini unutmaktır.) */
    for (const yol of ALT_UYGULAMALAR) {
        if (adres.pathname.indexOf(yol) === 0) return;
    }

    if (istek.mode === 'navigate') {
        e.respondWith(
            fetch(istek)
                .then((c) => {
                    if (c && c.ok) {
                        const kopya = c.clone();
                        caches.open(SURUM).then((o) => o.put('/index.html', kopya));
                    }
                    return c;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    e.respondWith(
        caches.match(istek).then((bulunan) => {
            if (bulunan) return bulunan;
            return fetch(istek).then((cevap) => {
                if (cevap && cevap.ok && cevap.type === 'basic') {
                    const kopya = cevap.clone();
                    caches.open(SURUM).then((o) => o.put(istek, kopya));
                }
                return cevap;
            });
        })
    );
});
