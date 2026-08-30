/* Resmî taban değer — Menemen pilotu.
   Belediyenin emlak vergisine esas ASGARİ m² değeri. Piyasa değeri DEĞİLDİR.

   Neden mahalle değil SOKAK soruluyor: 28.08.2026'da ölçüldü — aynı mahalle
   içinde sokak değerleri ortanca 4,3 kat, en fazla 15 kat ayrışıyor
   (n>=5 olan 54 mahallede). Mahalle ortalaması vermek, kullanıcının kendi
   sokağından katlarca sapan bir sayıyı kesinmiş gibi sunmak olurdu.

   Veri ancak kullanıcı bölümü AÇINCA indiriliyor: 84 KB'lık dosya, hiç
   kullanmayanın ilk açılışını yavaşlatmasın. */
(function () {
    'use strict';
    /* ILCE LISTESI — buyumeye hazir yapi.
       Bugun tek ilce var (Menemen). Yeni ilce eklemek icin: veri/
       klasorune ayni bicimde bir json koy ve asagiya bir satir ekle.
       Arayuz gerisini kendisi yapar: tek ilce varsa secici GOSTERILMEZ,
       iki ve uzeri varsa secici cikar.

       NEDEN LISTE (olculdu 30.08.2026): dosya adi koda GOMULUYDU
       ('veri/menemen.json') ve ilce adi HTML'e ELLE yazilmisti
       ("(Menemen)"). Ikisi ayri yerde duran ayni bilgi -- ilce
       eklendiginde biri guncellenip digeri unutulur ve kullanici
       BASKA ILCENIN fiyatini gorur. Artik tek kaynak bu liste ve
       kunye VERI DOSYASININ KENDISINDEN okunuyor. */
    /* ILCELER ARTIK KODDA YAZILI DEGIL — `veri/ilceler.json` kayit
       defterinden okunuyor. Sebep (30.08.2026): kullanicinin karari
       "mahalle mahalle, gerekirse bir ay surer, hepsini". 973 ilcelik
       bir liste kodda elle tutulamaz; her yeni ilce iki ayri yerde
       guncelleme ister ve biri unutulunca kullanici "veri yok" gorur,
       oysa veri vardir.
       Simdi: ham cikarimi koy, `python veri_paketle.py <ilce>` calistir.
       Defter kendini uretir, arayuz kendini gunceller. KOD DEGISMEZ. */
    var ILCELER = [];
    var SECILI_ILCE = 0;

    var VERI = null, yukleniyor = false;
    var KAPSAM = null;                     /* 81 il / 973 ilce -- TAM */
    var ilSec   = document.getElementById('rIl');
    var ilceSec = document.getElementById('rIlce');
    var kapsamP = document.getElementById('rKapsam');

    /* Fiyat verisi olan ilceler: ILCELER listesinden turuyor.
       "Kapsam" ile "fiyat" AYRI kavramlar -- ikisini karistirmak,
       elimizde olmayan veriyi varmis gibi gostermek olurdu. */
    /* BELEDIYENIN KENDI SORGU SAYFASI.
       `veri/sorgu.json` bicimi: { "İzmir": { "Çeşme": "https://..." } }
       Dosya yoksa ya da bozuksa hicbir sey olmaz -- baglanti cikmaz,
       uygulama eskisi gibi calisir. Veri dosyasi bir SUS, sart degil. */
    var SORGU = null, sorguYuklendi = false;
    function sorguYukle() {
        if (sorguYuklendi) return Promise.resolve(SORGU);
        sorguYuklendi = true;
        return fetch('veri/sorgu.json')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { SORGU = d; return d; })
            .catch(function () { SORGU = null; return null; });
    }

    function sorguBaglantisi(il, ilce) {
        var kap = document.getElementById('rSorgu');
        if (!kap) return;
        kap.innerHTML = '';
        sorguYukle().then(function (d) {
            var adres = d && d[il] && d[il][ilce];
            if (!adres) {
                kap.appendChild(yaz('p', 'alt-not',
                    'Cetvel belediyenizin ya da muhtarlığınızın panosunda ' +
                    'asılıdır. Emsal fiyatı elle de girebilirsiniz.'));
                return;
            }
            kap.appendChild(yaz('p', 'alt-not',
                'Ama ' + ilce + ' Belediyesi rayiç değerleri kendi sitesinde ' +
                'sorgulanabiliyor. Oradaki sayı her zaman günceldir:'));
            var a = document.createElement('a');
            a.href = adres;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'ikincil';
            a.textContent = ilce + ' Belediyesi — resmî rayiç sorgusu';
            kap.appendChild(a);
            kap.appendChild(yaz('p', 'alt-not',
                'Bu bağlantı belediyenin kendi sayfasına gider; uygulamadan ' +
                'çıkarsınız. Bulduğunuz metrekare değerini emsal fiyat ' +
                'alanına yazabilirsiniz.'));
        });
    }

    function yaz(etiket, sinif, metin) {
        var e = document.createElement(etiket);
        if (sinif) e.className = sinif;
        e.textContent = metin;
        return e;
    }

    function fiyatVarMi(il, ilce) {
        return ILCELER.some(function (x) {
            return x.il === il && x.ad === ilce;
        });
    }

    function kapsamYukle() {
        if (KAPSAM) return Promise.resolve(KAPSAM);
        return fetch('veri/il-ilce.json' + _etiket())
            .then(function (c) { if (!c.ok) throw new Error(c.status); return c.json(); })
            .then(function (d) {
                KAPSAM = d;
                if (!ilSec) return d;
                Object.keys(d.il).forEach(function (il) {
                    var o = document.createElement('option');
                    o.value = il;
                    o.textContent = il + (fiyatVarMi(il, null) ? '' : '');
                    ilSec.appendChild(o);
                });
                if (kapsamP) {
                    kapsamP.textContent = 'Türkiye’nin ' + d.il_sayisi + ' ili ve ' +
                        d.ilce_sayisi + ' ilçesi listede. Resmî taban değer verisi ' +
                        'şu an ' + ILCELER.length + ' ilçe için var; diğerleri ekleniyor.';
                }
                return d;
            })
            .catch(function () {
                if (kapsamP) kapsamP.textContent = 'İl/ilçe listesi yüklenemedi.';
            });
    }

    if (ilSec) {
        ilSec.addEventListener('change', function () {
            var il = ilSec.value;
            ilceSec.innerHTML = '<option value="">— seçin —</option>';
            if (!il || !KAPSAM) return;
            (KAPSAM.il[il] || []).forEach(function (ilce) {
                var o = document.createElement('option');
                o.value = ilce;
                o.textContent = ilce + (fiyatVarMi(il, ilce) ? '  ✔ veri var' : '');
                ilceSec.appendChild(o);
            });
        });
        ilceSec.addEventListener('change', function () {
            var il = ilSec.value, ilce = ilceSec.value;
            if (!ilce) return;
            if (fiyatVarMi(il, ilce)) {
                /* ONCEKI ILCENIN SORGU BAGLANTISINI SIL.
                   Olculdu (30.08.2026): Cesme secilip sonra Menemen'e
                   gecilince ekranda Menemen'in 65 mahallesi VE "Cesme
                   Belediyesi - resmi rayic sorgusu" baglantisi birlikte
                   duruyordu. Kullanici baska bir ilcenin adresine
                   tiklayabilirdi. Kutu hicbir yerde temizlenmiyordu;
                   karsit hal sinamasi (verisi olan ilce) yakaladi. */
                var ks = document.getElementById('rSorgu');
                if (ks) ks.innerHTML = '';
                var i = ILCELER.findIndex(function (x) { return x.il === il && x.ad === ilce; });
                if (i >= 0 && i !== SECILI_ILCE) { SECILI_ILCE = i; VERI = null; }
                yolSec.innerHTML = '<option value="">— önce mahalle seçin —</option>';
                kullan.disabled = true;
                if (VERI) {
                    /* Veri zaten elimizde: yeniden cekmeye gerek yok,
                       dogrudan doldur. `yukle()` bu durumda erken doner. */
                    var ad2 = mahalleleriDoldur(VERI);
                    sonuc.textContent = ad2.length + ' mahalle (' + (VERI.ilce || '') +
                        '). Mahallenizi seçin.';
                } else {
                    mahSec.innerHTML = '<option value="">— seçin —</option>';
                    yukle();
                }
            } else {
                /* SESSIZ GECMIYORUZ: elimizde olmadigini soyluyoruz.
                   AMA CIKMAZ SOKAKTA DA BIRAKMIYORUZ.

                   Olculdu (30.08.2026): belediyelerin cogu cetveli PDF
                   olarak degil, kendi e-belediye sitesinde SORGU SAYFASI
                   olarak yayimliyor. Izmir'in 30 ilcesinde PDF 1, sorgu
                   sayfasi 8 cikti -- yani yalniz PDF arayan bir yaklasim
                   isin cogunu goremiyor.

                   Bu baglanti bizim verimizden IYI bile olabilir:
                   belediyenin kendi sayfasi her zaman guncel, bizim
                   kopyamiz eskir. "Veri yok" demekle "iste resmi kaynak"
                   demek arasindaki fark, kullanicinin isini bitirip
                   bitirmedigidir.                                        */
                mahSec.innerHTML = '<option value="">— bu ilçe için veri yok —</option>';
                yolSec.innerHTML = '<option value="">—</option>';
                kullan.disabled = true;
                sonuc.textContent = il + ' / ' + ilce + ' için resmî taban değer ' +
                    'verisi bizde henüz yok.';
                sorguBaglantisi(il, ilce);
            }
        });
    }
    var kutu = document.getElementById('resmiTaban');
    if (!kutu) return;
    var mahSec = document.getElementById('rMahalle');
    var yolSec = document.getElementById('rYol');
    var sonuc  = document.getElementById('rSonuc');
    var kullan = document.getElementById('rKullan');
    var hedef  = document.getElementById('gEmsalFiyat');

    function tl(n) { return n.toLocaleString('tr-TR') + ' TL/m²'; }

    /* Surum etiketi kendi <script> adresinden okunur -- elle yazilan
       ikinci bir sayi, ayrisacagi gun sessizce eski veri gosterir. */
    function _etiket() {
        try {
            var kendi = document.querySelector('script[src*="rayic.js"]');
            var m = kendi && (kendi.getAttribute('src') || '').match(/[?&]v=([^&]+)/);
            return m ? '?v=' + m[1] : '';
        } catch (e) { return ''; }
    }

    /* Once ILCE DEFTERI, sonra kapsam: kapsam listesi "bu ilcede veri
       var mi" isaretini defterden okuyor. Ters sirada yuklenirse
       butun ilceler "veri yok" gorunur -- sessiz ve yanlis. */
    fetch('veri/ilceler.json' + _etiket())
        .then(function (c) { return c.ok ? c.json() : { ilce: [] }; })
        .then(function (d) {
            ILCELER = (d.ilce || []).map(function (x) {
                return { ad: x.ad, il: x.il, dosya: x.dosya, slug: x.slug };
            });
        })
        .catch(function () { ILCELER = []; })
        .then(function () { kapsamYukle(); });

    /* MAHALLELERI DOLDUR — ayri fonksiyon, cunku iki yerden cagriliyor:
       veri ILK KEZ yuklendiginde ve ilce yeniden secildiginde.
       Olculdu (30.08.2026): ilce secicisi eklendikten sonra Menemen
       secilince mahalleler GELMIYORDU. Sebep: `details` acilinca veri
       zaten yukleniyor, sonra ilce secilince listeyi temizliyordum ama
       `yukle()` "VERI zaten var" deyip ERKEN DONUYORDU. Temizlenmis
       liste bir daha dolmuyordu. */
    function mahalleleriDoldur(d) {
        var adlar = Object.keys(d.mahalle);
        mahSec.innerHTML = '<option value="">— seçin —</option>';
        adlar.forEach(function (ad) {
            var o = document.createElement('option');
            o.value = ad; o.textContent = ad + ' (' + d.mahalle[ad].length + ' yol)';
            mahSec.appendChild(o);
        });
        return adlar;
    }

    function yukle() {
        if (VERI || yukleniyor) return;
        yukleniyor = true;
        sonuc.textContent = 'Veri yükleniyor…';
        /* VERI DOSYASI DA SURUMLU CEKILIR.
           Olculdu (29.08.2026): paketi guncelledim, tarayici ESKISINI
           verdi ve "duzeltme tutmadi" diyecektim. Sayfadaki her betik
           `?v=NN` tasiyor; degisme ihtimali EN YUKSEK dosya olan veri
           paketi ise etiketsizdi -- yani veri guncellenince kullanici
           eskisinde kaliyordu.

           Etiket ELLE YAZILMIYOR: kendi <script> adresinden okunuyor.
           Iki ayri yere ayni sayiyi elle yazmak, ayrisacagi gun
           sessizce yanlis veri gostermek demektir (sw.js'de aynen
           bunu yasadik). */
        var etiket = _etiket();

        fetch(ILCELER[SECILI_ILCE].dosya + etiket)
            .then(function (c) { if (!c.ok) throw new Error(c.status); return c.json(); })
            .then(function (d) {
                VERI = d; yukleniyor = false;
                var adlar = mahalleleriDoldur(d);
                /* KUNYE VERI DOSYASINDAN. Onceden HTML'de elle "(Menemen)"
                   yaziyordu ve yil/kaynak hic gosterilmiyordu -- oysa
                   dosya il, ilce, yil, kaynak ve gecerlilik alanlarini
                   ZATEN tasiyor. Elle yazilan etiket, veri degisince
                   sessizce yalan soyler. */
                var bas = document.getElementById('rayicKunye');
                if (bas) {
                    bas.textContent = (d.il || '') + ' · ' + (d.ilce || '') +
                        ' — ' + (d.yil || '') + ' yılı cetveli' +
                        (d.gecerlilik ? ' (' + d.gecerlilik + ' geçerli)' : '');
                    /* KAYNAK BAGLANTISI. Kullanici belediyenin RESMI
                       belgesini acip sayiyi kendi gozuyle dogrulayabilsin.
                       Guven "bize inanin" ile degil "kaynak burada" ile
                       kurulur -- ve yanlis bir sayi varsa kullanici bunu
                       bize degil, belgeye bakarak anlar. */
                    if (d.kaynak_adres) {
                        bas.appendChild(document.createTextNode(' · '));
                        var ba = document.createElement('a');
                        ba.href = d.kaynak_adres;
                        ba.target = '_blank';
                        ba.rel = 'noopener noreferrer';
                        ba.textContent = 'resmî belgeyi aç';
                        bas.appendChild(ba);
                    }
                }
                var ozet = document.querySelector('#resmiTaban summary');
                if (ozet && d.ilce) {
                    ozet.textContent = 'Bilmiyor musunuz? Resmî taban değere bakın (' +
                        d.ilce + ')';
                }
                sonuc.textContent = adlar.length + ' mahalle yüklendi (' +
                    (d.ilce || '') + '). Mahallenizi seçin.';
            })
            .catch(function () {
                yukleniyor = false;
                /* Sessiz başarısızlık yok: ne olduğunu ve ne yapılacağını söyle. */
                sonuc.textContent = 'Resmî değer listesi yüklenemedi. İnternet bağlantınız '
                    + 'yoksa bir kez bağlanıp bu bölümü açmanız yeterli; sonra çevrimdışı da çalışır.';
            });
    }

    kutu.addEventListener('toggle', function () { if (kutu.open) yukle(); });

    mahSec.addEventListener('change', function () {
        yolSec.innerHTML = '';
        kullan.disabled = true;
        var ad = mahSec.value;
        if (!ad || !VERI) { yolSec.innerHTML = '<option value="">— önce mahalle seçin —</option>'; sonuc.textContent = ''; return; }
        var liste = VERI.mahalle[ad];
        var bos = document.createElement('option');
        bos.value = ''; bos.textContent = '— seçin —';
        yolSec.appendChild(bos);
        liste.forEach(function (y, i) {
            var o = document.createElement('option');
            o.value = String(i); o.textContent = y[0] + ' ' + y[1];
            yolSec.appendChild(o);
        });
        /* Sokak seçilmeden TEK SAYI verilmez — yalnız aralık ve yayılım. */
        /* Cakisan yolun IKINCI degeri de araliga girer; yoksa mahallenin
           gercek yayilimini eksik gosteririz. */
        var d = [];
        liste.forEach(function (y) { d.push(y[2]); if (y[3]) d = d.concat(y[3]); });
        d.sort(function (a, b) { return a - b; });
        var alt = d[0], ust = d[d.length - 1];
        var kat = alt > 0 ? (ust / alt) : 0;
        sonuc.textContent = ad + ' mahallesinde sokaklar ' + tl(alt) + ' ile ' + tl(ust)
            + ' arasında değişiyor'
            + (kat >= 1.5 ? ' — aradaki fark ' + kat.toFixed(1).replace('.', ',') + ' kat, o yüzden sokağınızı seçin.' : '.');
    });

    yolSec.addEventListener('change', function () {
        var ad = mahSec.value, i = yolSec.value;
        if (!ad || i === '' || !VERI) { kullan.disabled = true; return; }
        var y = VERI.mahalle[ad][+i];

        /* RESMI CETVEL AYNI YOLU IKI KEZ YAZMIS OLABILIR.
           Olculdu (29.08.2026): Degirmendere / 30 Agustos Cadde cetvelde
           IKI blokta geciyor -- 17.000 ve 16.000. Onceki surumde bu yol
           acilir listede IKI KEZ, ayni isimle goruniyordu; kullanici
           hangisini sectigini bilemiyordu. Simdi tek satir, ama IKILIK
           SOYLENIYOR. Bilmedigimizi soylemek, birini secip kesinmis gibi
           sunmaktan iyidir.

           Dugmeye DUSUK deger yaziliyor: bu bir TABAN degerdir ve tabani
           yuksek tutmak degeri sisirir. Sebebi de ekranda yaziyor. */
        if (y[3] && y[3].length) {
            var hepsi = [y[2]].concat(y[3]).sort(function (a, b) { return a - b; });
            sonuc.textContent = y[0] + ' ' + y[1] + ': resmî cetvelde '
                + hepsi.length + ' ayrı değerle geçiyor — '
                + hepsi.map(tl).join(' ve ')
                + '. Hangisinin sizin bölümünüz olduğunu belediyeden doğrulayın; '
                + 'düğme düşük olanı (' + tl(hepsi[0]) + ') yazar.';
            kullan.disabled = false;
            kullan.dataset.deger = String(hepsi[0]);
            return;
        }

        /* ILCE ADI SONUCTA DA YAZAR. Mahalle adlari ilceler arasinda
           ORTAK ("Cumhuriyet", "Yeni" gibi); kullanici baska ilcede
           yasiyorsa ayni adi secip BASKA ILCENIN fiyatini alabilir.
           Ilceyi sonucun icine koymak bunu imkansiz kilmaz ama
           gorunur kilar. */
        sonuc.textContent = (VERI.ilce ? VERI.ilce + ' · ' : '') +
            y[0] + ' ' + y[1] + ': ' + tl(y[2])
            + ' — bu resmî TABAN değerdir, piyasa bunun üstündedir.';
        kullan.disabled = false;
        kullan.dataset.deger = String(y[2]);
    });

    /* KOKEN RAPORA TASINMALI.
       Olculdu (29.08.2026): bu dugme emlak vergisine esas ASGARI
       (taban) degeri emsal alanina yaziyor ve girisde iki kez uyari
       veriliyor -- ama RAPORDA hicbir iz kalmiyordu. Kullanici taban
       degerden turetilmis bir rakami "Deger tahmini" basligi altinda
       yazdirip pazarliga goturuyor; ustelik rapor iki yonlu aralik
       verdigi icin TABANIN ALTINI bile olasi gosteriyor.
       Cozum: alana kokeni isaretle, rapor onu okusun. Kullanici
       sayiyi ELLE degistirirse isaret DUSER -- artik taban degil. */
    function _kokenBirak() {
        if (hedef) delete hedef.dataset.koken;
    }
    if (hedef) {
        hedef.addEventListener('input', function (e) {
            if (!e.__rayic) _kokenBirak();
        });
    }

    kullan.addEventListener('click', function () {
        if (!hedef || !kullan.dataset.deger) return;
        hedef.value = Number(kullan.dataset.deger).toLocaleString('tr-TR');
        hedef.dataset.koken = 'rayic';
        var _o = new Event('input', { bubbles: true });
        _o.__rayic = true;
        hedef.dispatchEvent(_o);
        sonuc.textContent = 'Emsal alanına yazıldı. Unutmayın: bu TABAN değerdir, '
            + 'gerçek piyasa fiyatı genellikle daha yüksektir — biliyorsanız onu yazın.';
        tavanUyarisi();
    });

    /* ---------------------------------------------------------------
       M2 BIRIM DEGERI DE YASAL TAVANA TABI
       ---------------------------------------------------------------
       Olculdu (30.08.2026, ikinci tur mevzuat denetimi): tavan yalniz
       toplam vergi degerine degil, ASGARI OLCUDE M2 BIRIM DEGERININ
       KENDISINE de isliyor. 89 No.lu EVK Genel Tebligi Ornek 1:

         satir 1  2025 m2 birim degeri            600,00 TL
         satir 4  2026 icin TAKDIR edilen        4.000,00 TL
         satir 8  2026'da uygulanacak m2 degeri   1.800,00 TL   (7 / 2)

       Yani cetvelde yazan 4.000 TL degil, 1.800 TL uygulaniyor --
       takdirin yarisindan az. Bizim veri dosyalarimiz belediyelerin
       HAZIRAN 2025 tarihli cetvellerinden, yani kanundan ONCE
       hazirlanmis ham takdir degerleri. Bu sayiyi emsal alanina
       yazip susmak, kullaniciyi yasanin izin verdiginin cok ustunde
       bir taban degere baktiriyordu.

       KIRPMIYORUZ, SOYLUYORUZ: kullanicinin 2025 m2 degeri elimizde
       yok; tahminle kirpmak sessiz yanlis sayi uretmek olurdu.        */
    function tavanUyarisi() {
        var kap = document.getElementById('rSorgu');
        if (!kap) return;
        kap.innerHTML = '';
        var p = document.createElement('p');
        p.className = 'alt-not';
        p.textContent =
            '⚠ Bu sayı belediyenin HAM TAKDİR değeridir. 2026 cetvelleri ' +
            'Haziran 2025 tarihinde, yani yasal tavandan önce hazırlandı. ' +
            'EVK geçici md. 23: uygulanacak metrekare değeri, 2025 ' +
            'metrekare değerinizin üç katını geçemez. Tebliğin örneğinde ' +
            'takdir 4.000 TL iken uygulanan değer 1.800 TL olmuştur. ' +
            '2025 metrekare değerinizi biliyorsanız bu sayıyı onun üç ' +
            'katıyla karşılaştırın — küçük olan geçerlidir.';
        kap.appendChild(p);
    }
})();
