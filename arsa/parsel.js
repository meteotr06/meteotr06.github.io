/* =====================================================================
   YERİNİZİ BULUN — mahalle seçimi ve harita
   ---------------------------------------------------------------------
   NEDEN VAR (kullanıcının kendi cümleleri, 30.08.2026):
     "bu arsa uygulaması da yerine göre değişiyor ya, o yüzden harita"
     "çok rahat bir şekilde bulup kendi yerini, fiyatını ve bilgilerini
      öğrenebilmeli"
     "hiç bilmeyen birinin bile anlayıp yapabileceği bir sistem olmalı"

   Doğru tespit: bu uygulamanın cevapları YERE BAĞLI. Büyükşehirse emlak
   vergisi iki kat, belediye sınırındaysa arsa/arazi ayrımı değişir,
   rayiç sokak sokak farklıdır. Önce "burası neresi" sorusu kapanmalı.

   ---------------------------------------------------------------------
   TKGM PARSEL SORGUSU NEDEN YOK — kayda geçsin
   ---------------------------------------------------------------------
   TKGM'nin MEGSIS servisi ada/parsel ile resmî alanı, niteliği ve sınır
   geometrisini veriyor; giriş de istemiyor. Kurup çalıştırdık.

   AMA: servis `Referer` başlığına bakıyor ve BAŞKA SİTELERDEN gelen
   isteği reddediyor. Ölçüldü (30.08.2026):

       Referer yok                  -> HTTP 200
       Referer: bizim site          -> HTTP 403
       Referer: parselsorgu.tkgm    -> HTTP 200

   Tarayıcıya "kaynağımı bildirme" dedirtirsek 200 dönüyor. Yani teknik
   olarak mümkün. YAPMIYORUZ: bu, servis sahibinin üçüncü tarafları
   dışarıda tutmak için koyduğu sınırı aşmak olurdu. Kullanıcıya soruldu,
   kararı "aşma, dürüst yolu kur" oldu.

   Onun yerine: mahalle listesi AÇIK bir veri setinden, harita açık
   döşemelerden, tam parsel için TKGM'nin KENDİ sayfasına bağlantı.
   Yarın servis kapansa uygulama bozulmaz.
   ===================================================================== */
(function (kok) {
'use strict';

var VERI = null, yukleniyor = null;

/* 43.265 yerleşim, 1,66 MB. İlk açılışta DEĞİL, kullanıcı bu bölümü
   AÇINCA yükleniyor — uygulamayı bu özellik için hiç kullanmayacak
   kişiye indirtmek doğru değil. */
function yukle() {
    if (VERI) return Promise.resolve(VERI);
    if (yukleniyor) return yukleniyor;
    yukleniyor = fetch('veri/yerlesim.json').then(function (y) {
        if (!y.ok) throw new Error('yerleşim listesi okunamadı');
        return y.json();
    }).then(function (d) { VERI = d; return d; })
      .catch(function (hata) {
        /* BASARISIZLIKTA SOZU BIRAKMA — TEK ATISLIK YUKLEME BAYRAGI.
           Olculdu (01.09.2026, test-yeniden-deneme.html): kisa bir ag
           kopmasinda ilk deneme "Yerlesim listesi yuklenemedi" veriyor,
           ama REDDEDILEN soz (promise) bu degiskende KALIYORDU. Ikinci
           denemede yukaridaki `if (yukleniyor) return yukleniyor;`
           kullaniciyi ayni olu soze bagliyordu:

               ilk denemede giden istek:    1
               ikinci denemede giden istek: 0     <-- ag istegi BILE yok

           Yani ag geri gelse bile kullanici ayni hatayi goruyor ve
           SAYFAYI YENILEMEDEN cikamiyor. Arayuz katmani dogru
           davraniyordu (arayuz.js, `catch` icinde `yuklendi = false`);
           kusur bu alt katmandaydi. Ayni sifirlama artik burada da var.

           Reddin KENDISI cagirana geri veriliyor: hatayi yutup sessizce
           bos liste dondurmek, bu projedeki en tehlikeli sinif olan
           "sessiz yanlis" olurdu — kullanici listeyi eksik sanmaz,
           hic yuklenmedigini bilir. */
        yukleniyor = null;
        throw hata;
      });
    return yukleniyor;
}

function iller() {
    return yukle().then(function (d) {
        return Object.keys(d.il).sort(function (a, b) {
            return a.localeCompare(b, 'tr');
        });
    });
}
function ilceler(il) {
    return yukle().then(function (d) {
        return Object.keys((d.il[il] || {})).sort(function (a, b) {
            return a.localeCompare(b, 'tr');
        });
    });
}
function yerlesimler(il, ilce) {
    return yukle().then(function (d) {
        var l = ((d.il[il] || {})[ilce] || []).slice();
        l.sort(function (a, b) { return a.a.localeCompare(b.a, 'tr'); });
        return l;
    });
}

var TUR_AD = { m: 'Mahalle', k: 'Köy', b: 'Belde' };

/* TKGM'nin KENDİ sayfası — tam parsel için. Kullanıcı oraya gidip
   ada/parsel yazar; biz araya girmiyoruz. */
function tkgm_adresi() {
    return 'https://parselsorgu.tkgm.gov.tr/';
}

/* Nominatim (OpenStreetMap) ile mahalleyi haritada bul.
   Kullanım şartları: saniyede bir istekten fazlası yok, kim olduğumuzu
   bildiren bir User-Agent/Referer, ve sonucu önbelleğe al. Üçünü de
   yapıyoruz: istek yalnız kullanıcı seçince gidiyor, sonuç saklanıyor. */
var KONUM_ONBELLEK = {};
function konumBul(il, ilce, yer) {
    var anahtar = [il, ilce, yer].join('|');
    if (KONUM_ONBELLEK[anahtar]) return Promise.resolve(KONUM_ONBELLEK[anahtar]);
    var sorgu = [yer, ilce, il, 'Türkiye'].filter(Boolean).join(', ');
    var adres = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
                encodeURIComponent(sorgu);
    return fetch(adres, { headers: { 'Accept': 'application/json' } })
        .then(function (y) { return y.ok ? y.json() : []; })
        .then(function (d) {
            if (!d || !d.length) return null;
            /* BURADA `parseFloat` DOGRUDUR — `C.sayi_oku` KULLANMAYIN.
               Tarayici denetimleri bu satiri "korumasiz parseFloat" diye
               isaretliyor; degil. Sebep: `lat`/`lon` KULLANICININ YAZDIGI
               metin degil, Nominatim'in JSON cevabi. JSON sayilari tanim
               geregi Ingiliz bicimlidir — nokta ONDALIK ayracidir, binlik
               ayraci hic yoktur.
               Turkce cozumleyiciyi buraya takmak DUZELTMEZ, BOZAR: o
               fonksiyon "nokta + ucer haneli grup" kalibini binlik ayraci
               sayar ve Turkiye boylamlari tam bu kaliba uyar (olculdu,
               4df54c7):
                   boylam "35.321" (Adana)     -> sayi_oku 35321
                   boylam "30.483" (Eskisehir) -> sayi_oku 30483
               Yani harita 1000 kat yanlis yere giderdi. Bozuk/eksik cevap
               zaten asagidaki isFinite denetiminde null'a dusuyor. */
            var k = { enlem: parseFloat(d[0].lat), boylam: parseFloat(d[0].lon),
                      ad: d[0].display_name || sorgu };
            if (!isFinite(k.enlem) || !isFinite(k.boylam)) return null;
            KONUM_ONBELLEK[anahtar] = k;
            return k;
        })
        .catch(function () { return null; });
}

var DISA = {
    yukle: yukle,
    iller: iller,
    ilceler: ilceler,
    yerlesimler: yerlesimler,
    konumBul: konumBul,
    TUR_AD: TUR_AD,
    tkgm_adresi: tkgm_adresi,
    KAYNAK: 'Yerleşim listesi: PTT posta kodu verisinden derlenmiş açık ' +
            'veri (43.265 mahalle/köy, 81 il, 973 ilçe). Harita: ' +
            'OpenStreetMap ve Esri. Tapudaki resmî alan ve parsel sınırı ' +
            'için TKGM Parsel Sorgu sayfasını kullanın.'
};

kok.Yer = DISA;
if (typeof module !== 'undefined' && module.exports) module.exports = DISA;

})(typeof window !== 'undefined' ? window : globalThis);
