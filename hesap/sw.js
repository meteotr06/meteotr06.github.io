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

const SURUM = "hesap-v94";

// DAMGA SURUM'den TURETILIYOR, elle yazilmiyor.
// Sebep (27 Agustos 2026, olculdu): SURUM "hesap-v54"e cikarilmis ama bu
// listedeki adresler "?v=40" kalmisti. Sayfalar "?v=42" istiyor, on-bellege
// alinan ise "?v=40" -- FARKLI ANAHTAR. Sonuc: on-bellekleme bosa gidiyor
// (her kurulumda ~176 KB bosuna iniyor) ve asil onemlisi, kurulumdan hemen
// sonra CEVRIMDISI acilista CSS/JS bulunamiyor. Yani cevrimdisi katmani
// tam da is gormesi gereken anda calismiyordu.
// Artik ikisi ayri yerden yazilamaz; damga tek kaynaktan gelir.
const DAMGA = "v=" + SURUM.replace(/^\D*v/, "");
const CEKIRDEK = [
    "./",
    "./index.html",
    "./stil.css?" + DAMGA,
    "./hesap.js?" + DAMGA,
    "./sayfa.js?" + DAMGA,
    "./guncelle.js?" + DAMGA,
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

/* KENDINI ONARMA -- "etkin isci + bos onbellek" durumu.
   OLCULDU (3 Eylul 2026): servis iscisi ETKIN ve sayfayi DENETLIYOR
   iken onbellek silindiginde bir daha DOLMUYOR. Sebep: `install`
   yalnizca `sw.js`in baytlari degisince kosuyor; `update()` bile
   ayni dosyada install baslatmaz. Yani onbellek bir kez giderse
   uygulama BIR SONRAKI SURUME KADAR cevrimdisi calismaz.

   Bunu kendi sinamam onbellegi silerken buldum, ama durum uydurma
   degil: tarayici depo baskisi altinda Cache Storage'i ATAR. Ustelik
   bu ayni dosyada duzelttigim sisme kusuruyla zincirlenir --
   sisme -> kota baskisi -> atilma -> sessizce olu cevrimdisi katman.

   Sessiz olmasi en kotu yani: ekranda hicbir sey degismez, kullanici
   ancak agi kesilince ogrenir.

   NEDEN "bir kez" DEGIL de ZAMAN KISITLI: ilk yazdigimda bayrak
   "isci acilisinda bir kez" idi. Ama atilma, isci DURURKEN degil
   CALISIRKEN olur -- depo baskisi uygulama kullanilirken gelir. O
   halde bir kez bakan nobetci, tam da bakmasi gereken ani kacirir.
   Simdi en fazla dakikada bir bakiliyor: masraf tek `caches.has()`,
   is ise yalniz onbellek GERCEKTEN yoksa yapiliyor. */
const ONARIM_ARALIGI = 60000;
let sonOnarimBakisi = 0;
function onbellegiOnar() {
    const simdi = Date.now();
    if (simdi - sonOnarimBakisi < ONARIM_ARALIGI) return;
    sonOnarimBakisi = simdi;
    caches.has(SURUM).then(varMi => {
        if (varMi) return;
        return caches.open(SURUM).then(
            k => Promise.all(CEKIRDEK.map(u => k.add(u).catch(() => null))));
    }).catch(() => {});
}

self.addEventListener("fetch", (olay) => {
    const istek = olay.request;

    // KURAL 1: yalnızca kendi alan adımız, yalnızca GET
    if (istek.method !== "GET") return;
    let url;
    try { url = new URL(istek.url); } catch (e) { return; }
    if (url.origin !== self.location.origin) return;   // reklam ve dış kaynaklara dokunma

    onbellegiOnar();   // önbellek atılmışsa geri doldur (dakikada en çok bir bakış)

    const sayfaMi = istek.mode === "navigate" ||
                    (istek.headers.get("accept") || "").indexOf("text/html") >= 0;

    if (sayfaMi) {
        /* SAYFA ANAHTARI SORGUSUZ.
           Onceki halde `k.put(istek, ...)` isteği SORGU DIZESIYLE
           anahtarliyordu. Sayfalarda sorgu, surum damgasi degil
           KULLANICI GIRDISIDIR: paylasim baglantilari
           `net-maas-hesaplama.html?brut=75000&baslangic=1` gibi
           kuruluyor. Yani her farkli baglanti onbellege AYRI BIR KOPYA
           ekliyordu ve o kopyalar hic dusmuyordu.

           OLCULDU (3 Eylul 2026): ayni sayfa uc farkli sorguyla acildi,
           onbellek girdisi 4'ten 7'ye cikti -- ucu de ayni HTML.
           Genel tabloda 177 girdi vardi ama yalniz 63 essiz yol; 171
           girdi sorguluydu, ilk 40 girdi tek basina ~1 MB.

           Neden zararsiz degil: telefonda depo kotasi dolunca tarayici
           onbellege yazmayi reddeder ve CEVRIMDISI KATMANI sessizce
           bozulur. Yani "sadece yer kapliyor" degil.

           Neden tek kopya YETER: bu sayfalar durgun; parametreleri
           acilista JavaScript `location.search`ten okuyor. Ayni HTML
           butun parametre bilesimlerine hizmet eder.

           VARLIKLARDA SORGU KORUNUR (asagidaki dal): orada `?v=NN`
           surum damgasidir, atilirsa surumleme coker. */
        const sayfaAnahtari = url.origin + url.pathname;
        olay.respondWith(
            fetch(istek)
                .then(cevap => {
                    if (cevap && cevap.ok) {
                        const kopya = cevap.clone();
                        caches.open(SURUM).then(k => k.put(sayfaAnahtari, kopya)).catch(() => {});
                    }
                    return cevap;
                })
                .catch(() => caches.match(sayfaAnahtari).then(bulunan => {
                    if (bulunan) return bulunan;
                    // KURAL 3: yedek sayfa yalnızca gerçek sayfa isteğine
                    if (istek.mode === "navigate") return caches.match("./index.html");
                    return new Response("", { status: 504, statusText: "Baglanti yok" });
                }))
        );
        return;
    }

    /* VARLIKTA SORGU KORUNUR AMA HER SORGU SAKLANMAZ.
       Burada sorgu `?v=NN` yani SURUM DAMGASIDIR; atilirsa surumleme
       coker, eski dosya yeni damgayla servis edilir. O yuzden anahtar
       sorguluyla birakildi -- sayfa dalindaki normallestirme buraya
       UYGULANMAZ.

       Ama sinirsiz buyume sinifi burada da vardi: damgasiz sorgulu
       her varlik da kalici bir girdi aciyordu. Bunu kendi olcumumde
       yakaladim -- `fetch("sw.js?olcum=" + Date.now())` yazdigim anda
       onbellege kalici bir `sw.js?olcum=1788384389814` girdisi dustu.
       Bugun yayin kodunda damgasiz sorgulu varlik YOK (`?taze=` gecen
       her yer sinama dosyasi, onlar yayinlanmiyor), yani bu ornegi
       degil SINIFI kapatiyorum: yarin biri `?t=Date.now()` yazarsa
       sessizce geri gelmesin.

       Kural: yalniz SORGUSUZ ya da `?v=` DAMGALI varlik saklanir.
       Otekiler aga gider, servis edilir, saklanmaz. */
    const sorgu = url.search;
    const onbellegeYazilir = sorgu === "" || /^\?v=\d+$/.test(sorgu);

    // CSS / JS / görsel: önce önbellek (hızlı açılsın), arkadan tazele
    olay.respondWith(
        caches.match(istek).then(bulunan => {
            const agdan = fetch(istek).then(cevap => {
                if (cevap && cevap.ok && onbellegeYazilir) {
                    const kopya = cevap.clone();
                    caches.open(SURUM).then(k => k.put(istek, kopya)).catch(() => {});
                }
                return cevap;
            }).catch(() => bulunan);
            return bulunan || agdan;
        })
    );
});
