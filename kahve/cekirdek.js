/* ☕ KAHVE KAVURMA — HESAP ÇEKİRDEĞİ
   ==================================================================
   Burada ekran yok, DOM yok, tarayıcıya bağlı hiçbir şey yok.
   Yalnız sayı. Böylece sınanabilir.

   BU DOSYA ON BİR UYGULAMANIN DERSİYLE DOĞDU. Baştan uygulananlar:
     · Türkçe sayı okuma  — "1.500" BİN BEŞ YÜZDÜR, 1,5 değil
     · Geçersiz girdiyi KIRPMA, REDDET  — kırpma sessiz yanlış sayı üretir
     · Bilmediğine sayı UYDURMA — "0" da bir yalandır
     · Ölçülen her sabit çıpalı (K-65)
   ================================================================== */
(function (global) {
    'use strict';

    /* ---------------------------------------------------------------
       TÜRKÇE SAYI OKUMA

       Bu takımın en pahalı hatası burada doğdu ve CANLIDA yakalandı:
       kullanıcı "1.500" yazdı, `parseFloat` 1.5 verdi, ekranda
       "1,50 ₺ · Zarardasınız" yazdı. BİN KAT hata, çökme yok, uyarı yok.

       Türkçede nokta BİNLİK ayracı, virgül ONDALIK ayracıdır.
       Ama insanlar ikisini karıştırır; kurallar ölçülerek konuldu:

         "1.500"      -> 1500      (üçer haneli grup = binlik)
         "1.500,50"   -> 1500.5
         "0,300"      -> 0.3       (virgül varsa nokta binliktir)
         "1500.50"    -> 1500.5    (tek nokta + iki hane = ondalık)
         "12,5"       -> 12.5
         "12abc"      -> null      (uydurma yok, REDDET)
       --------------------------------------------------------------- */
    function sayi_oku(ham) {
        if (typeof ham === 'number') return isFinite(ham) ? ham : null;
        if (typeof ham !== 'string') return null;

        var s = ham.trim().replace(/\s/g, '');
        if (!s) return null;

        /* Yalnız rakam, nokta, virgül ve baştaki işaret kabul.
           "12abc", "0x1F", "1e3" REDDEDİLİR -- geçerli görünen ama
           kullanıcının yazmadığı bir sayı üretmektense hiç üretme. */
        if (!/^[+-]?[\d.,]+$/.test(s)) return null;

        var isaret = s[0] === '-' ? -1 : 1;
        s = s.replace(/^[+-]/, '');
        if (!s) return null;

        var nokta = (s.match(/\./g) || []).length;
        var virgul = (s.match(/,/g) || []).length;

        if (virgul > 1) return null;                 /* "1,2,3" belirsiz */

        if (virgul === 1) {
            /* Virgül varsa ONDALIK ayracıdır; nokta binliktir. */
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (nokta === 1) {
            /* Tek nokta: binlik mi ondalık mı?
               "1.500" (üç hane) -> binlik.  "1500.50" -> ondalık. */
            var son = s.split('.')[1];
            if (son.length === 3 && s.split('.')[0].length <= 3) {
                s = s.replace('.', '');              /* binlik */
            }
            /* değilse ondalık; olduğu gibi kalır */
        } else if (nokta > 1) {
            s = s.replace(/\./g, '');                /* "1.234.567" */
        }

        if (!/^\d*\.?\d+$/.test(s)) return null;
        var d = parseFloat(s);
        return isFinite(d) ? isaret * d : null;
    }

    /* ---------------------------------------------------------------
       FİRE — bu uygulamanın kalbi

       Yeşil çekirdek kavrulurken nem atar ve ağırlık kaybeder.
       fire % = (giren - çıkan) / giren × 100
       --------------------------------------------------------------- */

    /** Tartılan giriş/çıkıştan GERÇEKLEŞEN fireyi bulur. */
    function fire_olc(giris, cikis) {
        var g = sayi_oku(giris), c = sayi_oku(cikis);
        if (g === null || c === null) return red('sayi_okunamadi');
        if (g <= 0) return red('giris_sifir', 'Giren ağırlık sıfırdan büyük olmalı.');
        if (c <= 0) return red('cikis_sifir', 'Çıkan ağırlık sıfırdan büyük olmalı.');
        if (c > g) {
            /* KIRPMA YOK, RED. Kavrulmuş kahve girenden AĞIR olamaz --
               nem atar, almaz. Sınıra çekip hesaba devam etmek, sonucu
               makul gösterip yanlış yapmaktır. */
            return red('cikis_giristen_buyuk',
                'Çıkan ağırlık girenden büyük olamaz — kavrulan kahve ' +
                'nem atar, almaz. Tartıyı ya da birimi kontrol edin.');
        }
        return { gecerli: true, fire: (g - c) / g * 100, giris: g, cikis: c };
    }

    /** Yeşilden kavrulmuş: 10 kg + %15 fire -> 8,5 kg */
    function kavrulmus_agirlik(yesil, fire) {
        var y = sayi_oku(yesil), f = sayi_oku(fire);
        if (y === null || f === null) return red('sayi_okunamadi');
        var k = fire_gecerli(f);
        if (k) return k;
        if (y <= 0) return red('agirlik_sifir', 'Ağırlık sıfırdan büyük olmalı.');
        return { gecerli: true, sonuc: y * (1 - f / 100), kayip: y * (f / 100) };
    }

    /** Hedeften yeşil: 5 kg kavrulmuş istiyorum, %15 fire -> 5,88 kg yeşil */
    function yesil_gereken(hedef, fire) {
        var h = sayi_oku(hedef), f = sayi_oku(fire);
        if (h === null || f === null) return red('sayi_okunamadi');
        var k = fire_gecerli(f);
        if (k) return k;
        if (h <= 0) return red('agirlik_sifir', 'Ağırlık sıfırdan büyük olmalı.');
        return { gecerli: true, sonuc: h / (1 - f / 100) };
    }

    /* Fire sınırları TEK YERDE. İki hesap da buradan geçer; ayrı ayrı
       yazılsaydı biri güncellenip öteki unutulurdu. */
    function fire_gecerli(f) {
        if (f < 0) {
            return red('fire_negatif',
                'Fire eksi olamaz — kavrulan kahve ağırlık kazanmaz.');
        }
        if (f >= 100) {
            /* %100 fire "hiçbir şey kalmadı" demek. Kırpmıyoruz. */
            return red('fire_yuz',
                'Fire %100 veya daha büyük olamaz — geriye hiç kahve ' +
                'kalmaması demek olurdu.');
        }
        return null;
    }

    /* ---------------------------------------------------------------
       MALİYET

       BU UYGULAMANIN VAR OLMA SEBEBİ:
       Yeşil kahve 500 TL/kg ise, kavrulmuş kahvenin kilo maliyeti
       500 TL DEĞİLDİR. %15 fire varsa 1 kg kavrulmuş için 1,176 kg
       yeşil gerekir -> 588 TL. Bu farkı atlayan kavurmacı zararına
       satar ve nedenini bilmez.
       --------------------------------------------------------------- */
    function maliyet(g) {
        var fire = sayi_oku(g.fire);
        var yesilFiyat = sayi_oku(g.yesilFiyat);
        if (fire === null || yesilFiyat === null) return red('sayi_okunamadi');
        var k = fire_gecerli(fire);
        if (k) return k;
        if (yesilFiyat < 0) return red('fiyat_negatif', 'Fiyat eksi olamaz.');

        /* Parti başına giderler -- YOKSA SIFIR SAYILMAZ, YOK SAYILIR.
           `|| 0` yazmıyoruz: bu takımda `null || 0` yüzünden 12 varlıkta
           faiz sıfır alındı ve fiyatlar sessizce yanlış çıktı (K-66). */
        var parti = sayi_oku(g.partiKg);
        var enerji = sayi_oku(g.enerji);
        var iscilik = sayi_oku(g.iscilik);

        var kgBasiYesil = yesilFiyat / (1 - fire / 100);
        var kgBasiGider = 0;
        var eksik = [];

        if (parti !== null && parti > 0) {
            var kavrulanKg = parti * (1 - fire / 100);
            if (enerji !== null) kgBasiGider += enerji / kavrulanKg;
            else eksik.push('enerji');
            if (iscilik !== null) kgBasiGider += iscilik / kavrulanKg;
            else eksik.push('işçilik');
        } else {
            if (enerji !== null || iscilik !== null) eksik.push('parti büyüklüğü');
        }

        var kg = kgBasiYesil + kgBasiGider;
        var sonuc = {
            gecerli: true,
            kgMaliyet: kg,
            yesilPayi: kgBasiYesil,
            giderPayi: kgBasiGider,
            /* Fire olmasaydı ne olurdu -- kullanıcı FARKI görsün */
            firesizSanilan: yesilFiyat,
            fireFarki: kgBasiYesil - yesilFiyat,
            eksik: eksik
        };

        var paketG = sayi_oku(g.paketGram);
        if (paketG !== null && paketG > 0) {
            sonuc.paketMaliyet = kg * paketG / 1000;
            var ambalaj = sayi_oku(g.ambalaj);
            if (ambalaj !== null) sonuc.paketMaliyet += ambalaj;
            else eksik.push('ambalaj');
        }

        var fincanG = sayi_oku(g.fincanGram);
        if (fincanG !== null && fincanG > 0) {
            sonuc.fincanMaliyet = kg * fincanG / 1000;
        }
        return sonuc;
    }

    /* ---------------------------------------------------------------
       HARMAN
       Oranların toplamı 100 değilse SESSİZCE normalize ETMEYİZ --
       kullanıcı bir oranı yanlış yazmış olabilir ve bunu bilmeli.
       --------------------------------------------------------------- */
    function harman(bilesenler, hedefKg, fire) {
        var h = sayi_oku(hedefKg), f = sayi_oku(fire);
        if (h === null || f === null) return red('sayi_okunamadi');
        var k = fire_gecerli(f);
        if (k) return k;
        if (h <= 0) return red('agirlik_sifir', 'Ağırlık sıfırdan büyük olmalı.');
        if (!bilesenler || !bilesenler.length) {
            return red('bilesen_yok', 'En az bir çekirdek ekleyin.');
        }

        var toplam = 0, satir = [];
        for (var i = 0; i < bilesenler.length; i++) {
            var o = sayi_oku(bilesenler[i].oran);
            if (o === null) return red('sayi_okunamadi');
            if (o < 0) return red('oran_negatif', 'Oran eksi olamaz.');
            toplam += o;
            satir.push({ ad: bilesenler[i].ad, oran: o });
        }
        if (Math.abs(toplam - 100) > 0.001) {
            return red('oran_toplami',
                'Oranların toplamı %100 olmalı — şu an %' +
                (Math.round(toplam * 100) / 100) + '. ' +
                'Sessizce düzeltmiyoruz; bir oranı yanlış yazmış olabilirsiniz.');
        }

        var toplamYesil = h / (1 - f / 100);
        satir.forEach(function (s) {
            s.yesilKg = toplamYesil * s.oran / 100;
            s.kavrulmusKg = h * s.oran / 100;
        });
        return { gecerli: true, toplamYesil: toplamYesil, bilesenler: satir };
    }

    /* ---------------------------------------------------------------
       GELİŞİM ORANI (DTR) — ilk çatlaktan sonraki sürenin payı

       "İdeal aralık" YAZILMAZ. Tartışmalı bir konu ve makineye göre
       değişir; biz sayıyı hesaplarız, hüküm vermeyiz.
       --------------------------------------------------------------- */
    function gelisim_orani(toplamSn, catlakSn) {
        var t = sayi_oku(toplamSn), c = sayi_oku(catlakSn);
        if (t === null || c === null) return red('sayi_okunamadi');
        if (t <= 0) return red('sure_sifir', 'Toplam süre sıfırdan büyük olmalı.');
        if (c < 0) return red('sure_negatif', 'Süre eksi olamaz.');
        if (c > t) {
            return red('catlak_gec',
                'İlk çatlak, toplam süreden sonra olamaz.');
        }
        return { gecerli: true, dtr: (t - c) / t * 100, gelisimSn: t - c };
    }

    function red(kod, mesaj) {
        return {
            gecerli: false,
            kod: kod,
            mesaj: mesaj || 'Girilen değer sayı olarak okunamadı.'
        };
    }

    global.C = {
        sayi_oku: sayi_oku,
        fire_olc: fire_olc,
        kavrulmus_agirlik: kavrulmus_agirlik,
        yesil_gereken: yesil_gereken,
        maliyet: maliyet,
        harman: harman,
        gelisim_orani: gelisim_orani
    };
})(typeof window !== 'undefined' ? window : this);
