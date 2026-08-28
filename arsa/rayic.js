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
        fetch('veri/menemen.json')
            .then(function (c) { if (!c.ok) throw new Error(c.status); return c.json(); })
            .then(function (d) {
                VERI = d; yukleniyor = false;
                var adlar = Object.keys(d.mahalle);
                adlar.forEach(function (ad) {
                    var o = document.createElement('option');
                    o.value = ad; o.textContent = ad + ' (' + d.mahalle[ad].length + ' yol)';
                    mahSec.appendChild(o);
                });
                sonuc.textContent = adlar.length + ' mahalle yüklendi. Mahallenizi seçin.';
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
        var d = liste.map(function (y) { return y[2]; }).sort(function (a, b) { return a - b; });
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
        sonuc.textContent = y[0] + ' ' + y[1] + ': ' + tl(y[2])
            + ' — bu resmî TABAN değerdir, piyasa bunun üstündedir.';
        kullan.disabled = false;
        kullan.dataset.deger = String(y[2]);
    });

    kullan.addEventListener('click', function () {
        if (!hedef || !kullan.dataset.deger) return;
        hedef.value = Number(kullan.dataset.deger).toLocaleString('tr-TR');
        hedef.dispatchEvent(new Event('input', { bubbles: true }));
        sonuc.textContent = 'Emsal alanına yazıldı. Unutmayın: bu TABAN değerdir, '
            + 'gerçek piyasa fiyatı genellikle daha yüksektir — biliyorsanız onu yazın.';
    });
})();
