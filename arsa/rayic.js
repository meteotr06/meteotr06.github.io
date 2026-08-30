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
    var ILCELER = [
        { ad: 'Menemen', il: 'İzmir', dosya: 'veri/menemen.json' }
    ];
    var SECILI_ILCE = 0;

    var VERI = null, yukleniyor = false;
    var kutu = document.getElementById('resmiTaban');
    if (!kutu) return;
    var mahSec = document.getElementById('rMahalle');
    var yolSec = document.getElementById('rYol');
    var sonuc  = document.getElementById('rSonuc');
    var kullan = document.getElementById('rKullan');
    var hedef  = document.getElementById('gEmsalFiyat');

    function tl(n) { return n.toLocaleString('tr-TR') + ' TL/m²'; }

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
        var etiket = '';
        try {
            var kendi = document.querySelector('script[src*="rayic.js"]');
            var m = kendi && (kendi.getAttribute('src') || '').match(/[?&]v=([^&]+)/);
            if (m) etiket = '?v=' + m[1];
        } catch (e) {}

        fetch(ILCELER[SECILI_ILCE].dosya + etiket)
            .then(function (c) { if (!c.ok) throw new Error(c.status); return c.json(); })
            .then(function (d) {
                VERI = d; yukleniyor = false;
                var adlar = Object.keys(d.mahalle);
                adlar.forEach(function (ad) {
                    var o = document.createElement('option');
                    o.value = ad; o.textContent = ad + ' (' + d.mahalle[ad].length + ' yol)';
                    mahSec.appendChild(o);
                });
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
    });
})();
