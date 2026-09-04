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

const SURUM = 'portal-v11';

/* Alt uygulama klasörleri — bu yollara BAŞLAYAN hiçbir isteğe karışılmaz.
   Yeni uygulama eklenince buraya da eklenmeli; unutulursa portal onun
   isteklerine karışmaya başlar. */
const ALT_UYGULAMALAR = [
    '/arsa/', '/hesap/', '/kur-pusulasi/', '/muhasebe/',
    '/mobil/', '/planlayici/', '/goz-molasi/', '/kahve/'
];

/* PORTALIN ODUNC ALDIGI VARLIKLAR.
   Portal kendi stilini ve betiklerini /hesap/ altindan aliyor. Bunlar
   alt uygulamanin SAYFALARI degil; portalin kendi govdesi.

   Asagidaki ALT_UYGULAMALAR kurali `/hesap/` ile baslayan her istegi
   erken `return` ediyor -- dogru bir kural, alt uygulamalarin kendi
   servis calisanlarina karismamak icin. Ama bu uc dosyayi da kapsayinca
   portalin KENDI cevrimdisi vaadini kesiyordu.

   OLCULDU (04.09.2026, tarayicida, portal-v9 onbellegi):
       onbellekte : / · index.html · manifest.json · 3 ikon
       istenen    : /hesap/stil.css · /hesap/hesap.js · /hesap/sayfa.js
   Yani cevrimdisi acilan portal BICIMLENMEMIS bir baglanti listesiydi.
   Kurulabilir bir uygulama olarak cevrimdisi calismayi vaat ediyordu.

   DAMGA, hesap'in SURUM'uyle ELLE eslesmek zorunda ve kayabilir --
   bugun v93/v42 ile isteniyordu, hesap v96'daydi. Onbellek anahtari
   TAM URL oldugu icin (bu sw `ignoreSearch` kullanmiyor) kaymis damga
   sessizce ISKALAR. Bu yuzden esitligi `ON-ONBELLEK-EKSIGI.py`
   denetliyor; elle hatirlanacak bir kural degil. */
const HESAP_DAMGA = '?v=96';
const ODUNC = [
    '/hesap/stil.css' + HESAP_DAMGA,
    '/hesap/hesap.js' + HESAP_DAMGA,
    '/hesap/sayfa.js' + HESAP_DAMGA
];
const ODUNC_YOLLARI = ODUNC.map((u) => u.split('?')[0]);

const CEKIRDEK = [
    '/',
    '/index.html',
    '/manifest.json',
    '/portal-192.png',
    '/portal-512.png',
    '/portal-maskeli.png',
    '/kurulum.js?v=3',
    '/guncelle.js?v=4'
].concat(ODUNC);

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(SURUM)
            /* TEK TEK EKLENIR, `addAll` DEGIL. `addAll` hep-ya-hictir:
               listedeki tek bir dosya inmezse HICBIRI onbellege girmez
               ve cevrimdisi katman komple duser -- ustelik cevrimiciyken
               hicbir belirti vermez. Odunc varliklar BASKA bir klasorden
               geldigi ve damgalari kayabilecegi icin bu risk simdi daha
               yuksek. (Desen 06 Planlayici'dan geldi, K-69.) */
            .then((o) => Promise.all(
                CEKIRDEK.map((u) => o.add(u).catch(() => null))))
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
        /* PORTALIN KENDI ODUNC VARLIKLARI HARIC. Onlar alt uygulamanin
           sayfasi degil, portalin govdesi; buradan gecerlerse portal
           cevrimdisi acildiginda bicimlenmemis kalir. */
        if (adres.pathname.indexOf(yol) === 0
            && ODUNC_YOLLARI.indexOf(adres.pathname) < 0) return;
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
