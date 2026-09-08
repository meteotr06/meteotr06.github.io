/* sw.js — çevrimdışı çalışma (sahnede internet yoktur)

   DAMGA ŞART: bu numara değişmezse, düzelttiğin dosya kullanıcıya ESKİ hâliyle
   gider. Bu ekip bu tuzağa bir günde üç kez düştü. Herhangi bir dosyayı
   değiştirdiğinde AŞAĞIDAKİ SÜRÜMÜ DE ARTIR. */

var SURUM = 'repertuar-v20';

var DOSYALAR = [
  './',
  './index.html',
  './stil.css',
  './akor.js',
  './sarki.js',
  './depo.js',
  './sema.js',
  './kaydirma.js',
  './gorunum.js',
  './aktarim.js',
  './metronom.js',
  './gezinme.js',
  './ornek-repertuar.js',
  './arayuz.js',
  './gizlilik.html',
  './manifest.json',
  './simge.svg'
];

/* Kurulumda dosyalar TARAYICI ONBELLEGINDEN degil, agdan taze cekilir.
   NIYE: `cache.addAll()` varsayilan olarak tarayicinin HTTP onbellegini
   kullanir. Yeni damgayla kurulan servis calisani, ESKI dosyayi onbellegine
   gomer ve duzeltme kullaniciya hic ulasmaz. Bu tuzak burada bizzat yasandi:
   diskte dogru olan `sarki.js`, uygulamada eski haliyle kosuyordu.
   `cache: 'reload'` bunu keser. */
self.addEventListener('install', function (o) {
  o.waitUntil(
    caches.open(SURUM).then(function (k) {
      return Promise.all(DOSYALAR.map(function (d) {
        return fetch(new Request(d, { cache: 'reload' })).then(function (cevap) {
          if (!cevap || cevap.status !== 200) throw new Error('indirilemedi: ' + d);
          return k.put(d, cevap);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (o) {
  o.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(adlar.map(function (ad) {
        if (ad !== SURUM) return caches.delete(ad);      // eski damga temizlenir
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Önbellekten ver, ARKADA tazele (stale-while-revalidate).
   Neden: sadece "önbellekten ver" dersek, damgayı artırmayı unuttuğumuz gün
   kullanıcı düzelttiğimiz dosyayı ESKİ hâliyle görür ve bunu kimse fark etmez.
   Böyle yapınca sayfa anında açılır (çevrimdışı da çalışır) ve dosya bir
   sonraki açılışta kendiliğinden düzelir. Damga yine de artırılır — bu ikinci
   emniyet kemeri, birincisinin yerine geçmez. */
/* Sadece uygulamanin kendi dosyalari onbellege girer.
   NIYE: bu liste disindaki her seyi de onbellege alan ilk surum, sinama
   sayfasinin betiklerini de tutuyordu ve olcum IKI KEZ bayat dosyayla
   yapildi -- duzeltilmis kod "hala bozuk" gorundu. Olcum aracini kirleten
   onbellek, olcumu yalanci yapar (K-95 ile ayni sebep). */
var KAPSAM = DOSYALAR.map(function (d) { return new URL(d, self.location).href; });

self.addEventListener('fetch', function (o) {
  if (o.request.method !== 'GET') return;
  if (new URL(o.request.url).origin !== self.location.origin) return;

  var istek = new URL(o.request.url);

  // OLCUM KAPISI: `?olcum=1` tasiyan hicbir istek onbellege ugramaz.
  // Sinama sayfasi butun betikleri boyle cagirir. Sebep: bu onbellek
  // olcumu DORT kez yanilttti -- duzeltilmis dosya eski haliyle geldi ve
  // sinama "hala bozuk" gosterdi. Olcum her zaman diskten okumali.
  if (istek.searchParams.has('olcum')) return;
  // Gezinme istekleri icin de AYNI kural: kapsam disi sayfa onbellege girmez.
  // Bu istisna aciktiyken sinama.html'in kendisi bayat sunuldu ve olcum
  // ucuncu kez yalan soyledi. Uygulamanin cevrimdisi acilisi zaten '/' ve
  // '/index.html' kapsamda oldugu icin calisiyor.
  if (KAPSAM.indexOf(istek.origin + istek.pathname) === -1) return;

  o.respondWith(
    caches.open(SURUM).then(function (k) {
      return k.match(o.request).then(function (bulunan) {
        var agdan = fetch(o.request).then(function (cevap) {
          if (cevap && cevap.status === 200 && cevap.type === 'basic') {
            k.put(o.request, cevap.clone());
          }
          return cevap;
        }).catch(function () {
          return bulunan || k.match('./index.html');
        });
        return bulunan || agdan;
      });
    })
  );
});
