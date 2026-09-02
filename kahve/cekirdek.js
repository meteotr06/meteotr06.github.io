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


    /* ---------------------------------------------------------------
       ENVANTER — YEŞİL STOK ve KAVRULMUŞ STOK

       İKİSİ AYRI DEPODUR. Aralarındaki tek köprü FİRE:
       10 kg yeşil düşer, %15 fireyle 8,5 kg kavrulmuş artar.
       Yarım kilo buharlaşmıştır; hiçbir depoda yoktur.

       Bu köprü BURADA kurulu, ekranda değil. Ekran yalnız gösterir.

       MALİYET NASIL TAŞINIYOR (yöntem açıkça yazılıyor, çünkü
       "kahvenin kilosu kaça?" sorusunun cevabı yönteme göre değişir):
       AĞIRLIKLI ORTALAMA. 500 TL'lik 10 kg ile 600 TL'lik 10 kg
       karışınca depodaki yeşilin kilosu 550 TL olur.

       Kavurmada para BUHARLAŞMAZ, ağırlık buharlaşır: 10 kg yeşilin
       tuttuğu 5.500 TL, 8,5 kg kavrulmuşa geçer -> kavrulmuşun kilosu
       647,06 TL. Kavurmacının zararına satmasının sebebi tam da bu
       farkı görmemesidir.
       --------------------------------------------------------------- */

    /* ÇIPA (K-65): kilo karşılaştırmalarında yarım gramlık tolerans.
       Niye var: kullanıcı 10 kg alıp 10 kg kavurunca kayan nokta
       yüzünden "stokta 10 kg yok, 9,999999 kg var" deyip
       reddedebiliriz. Niye YARIM GRAM: ekran kiloyu üç haneyle
       gösteriyor (0,001 kg = 1 g), yani bu toleransın altındaki fark
       zaten görünmüyor. Büyütülürse gerçek eksik stok gizlenir.
       Bozununca düşen sınama: "tolerans YARIM GRAMDIR". */
    var TOLERANS_KG = 0.0005;

    function bosDepo() {
        return {
            yesilKg: 0, yesilDeger: 0,
            kavrulmusKg: 0, kavrulmusDeger: 0,
            fireler: []
        };
    }

    function ortalama(deger, kg) {
        /* Stok yoksa "0 ₺" DEMİYORUZ — sıfır da bir yalandır.
           Kilo fiyatı bilinmiyor demek için null döner. */
        return kg > TOLERANS_KG ? deger / kg : null;
    }

    /* Hata cümlesinde kilo göstermek için. Ekranın biçimlendirmesi
       burada YOK, ama hata cümlesi sayısız kalırsa kullanıcı neyin
       yetmediğini bilemez. */
    function bicim(d) {
        return (Math.round(d * 1000) / 1000).toString().replace('.', ',');
    }

    function birHareket(h, depo, i) {
        var sn = 'Satır ' + (i + 1) + ': ';
        var d = depo(h.cesit);
        if (!d) return red('cesit_yok', sn + 'Çeşit adı boş olamaz.');

        var kg = sayi_oku(h.kg);
        if (kg === null) return red('sayi_okunamadi', sn + 'Ağırlık okunamadı.');
        if (kg <= 0) {
            return red('kg_sifir', sn + 'Ağırlık sıfırdan büyük olmalı. ' +
                'Stok düşürmek için hareketin türünü değiştirin, eksi ' +
                'ağırlık yazmayın.');
        }

        if (h.tur === 'alim') {
            var f = sayi_oku(h.kgFiyat);
            if (f === null) {
                return red('fiyat_yok', sn + 'Alım fiyatı okunamadı. ' +
                    'Fiyatsız alım girilirse depodaki kahvenin kilosu ' +
                    'hesaplanamaz; sıfır saymıyoruz.');
            }
            if (f < 0) return red('fiyat_eksi', sn + 'Fiyat eksi olamaz.');
            d.yesilKg += kg;
            d.yesilDeger += kg * f;
            return { gecerli: true };
        }

        if (h.tur === 'kavurma') {
            /* Fire iki yoldan gelir; UYDURULMAZ.
               a) kullanıcı fire yüzdesini biliyor
               b) tartmış: çıkan ağırlığı yazar, fireyi BİZ ölçeriz */
            var fire = null;
            if (h.cikisKg !== undefined && h.cikisKg !== null &&
                String(h.cikisKg).trim() !== '') {
                var o = fire_olc(kg, h.cikisKg);
                if (!o.gecerli) return red(o.kod, sn + o.mesaj);
                fire = o.fire;
            } else if (h.fire !== undefined && h.fire !== null &&
                       String(h.fire).trim() !== '') {
                var fy = sayi_oku(h.fire);
                if (fy === null) return red('sayi_okunamadi', sn + 'Fire okunamadı.');
                /* DİKKAT: `fire_gecerli` GEÇERLİYSE null döner,
                   hatada nesne döner. Ters okumak %150 fireyi sessizce
                   kabul ettirirdi — sınama bunu kırmızı yakaladı. */
                var g = fire_gecerli(fy);
                if (g) return red(g.kod, sn + g.mesaj);
                fire = fy;
            } else {
                return red('fire_yok', sn + 'Kavurma için fire yüzdesi ya ' +
                    'da çıkan ağırlık gerekli. Fireyi biz uyduramayız — ' +
                    'makineye ve çekirdeğe göre değişir.');
            }

            if (kg > d.yesilKg + TOLERANS_KG) {
                return red('yesil_yetmez', sn + 'Depoda ' +
                    bicim(d.yesilKg) + ' kg yeşil ' + h.cesit + ' var, ' +
                    bicim(kg) + ' kg kavrulamaz. Eksi stok bir sayı ' +
                    'değil, bir hatadır.');
            }

            var birim = ortalama(d.yesilDeger, d.yesilKg);
            var tasinan = birim === null ? 0 : birim * kg;
            d.yesilKg -= kg;
            d.yesilDeger -= tasinan;
            if (d.yesilKg <= TOLERANS_KG) { d.yesilKg = 0; d.yesilDeger = 0; }

            d.kavrulmusKg += kg * (1 - fire / 100);
            d.kavrulmusDeger += tasinan;      /* para buharlaşmaz */
            d.fireler.push(fire);
            return { gecerli: true };
        }

        if (h.tur === 'satis' || h.tur === 'zayi') {
            var yesilMi = h.nerede === 'yesil';
            var varKg = yesilMi ? d.yesilKg : d.kavrulmusKg;
            var ad = yesilMi ? 'yeşil' : 'kavrulmuş';
            if (kg > varKg + TOLERANS_KG) {
                return red('stok_yetmez', sn + 'Depoda ' + bicim(varKg) +
                    ' kg ' + ad + ' ' + h.cesit + ' var, ' + bicim(kg) +
                    ' kg çıkışı yapılamaz. Eksi stok bir sayı değil, ' +
                    'bir hatadır.');
            }
            var b = yesilMi ? ortalama(d.yesilDeger, d.yesilKg)
                            : ortalama(d.kavrulmusDeger, d.kavrulmusKg);
            var dus = b === null ? 0 : b * kg;
            if (yesilMi) {
                d.yesilKg -= kg; d.yesilDeger -= dus;
                if (d.yesilKg <= TOLERANS_KG) { d.yesilKg = 0; d.yesilDeger = 0; }
            } else {
                d.kavrulmusKg -= kg; d.kavrulmusDeger -= dus;
                if (d.kavrulmusKg <= TOLERANS_KG) {
                    d.kavrulmusKg = 0; d.kavrulmusDeger = 0;
                }
            }
            return { gecerli: true };
        }

        return red('tur_bilinmiyor', sn + 'Bilinmeyen hareket türü: ' +
            String(h.tur) + '.');
    }

    /* Hareket dizisini baştan oynatır, depoların son hâlini verir.
       Tek bir hareket geçersizse HEPSİ reddedilir — yarım işlenmiş
       bir defter, yanlış bir defterden beterdir. */
    function stok_hesap(hareketler) {
        if (!hareketler || !hareketler.length) {
            return {
                gecerli: true, bos: true, cesitler: {}, sira: [],
                toplam: { yesilKg: 0, yesilDeger: 0, kavrulmusKg: 0,
                          kavrulmusDeger: 0, yesilKgFiyat: null,
                          kavrulmusKgFiyat: null }
            };
        }

        var cesitler = {}, sira = [];

        function depo(ad) {
            var a = String(ad === undefined || ad === null ? '' : ad).trim();
            if (!a) return null;
            if (!cesitler[a]) { cesitler[a] = bosDepo(); sira.push(a); }
            return cesitler[a];
        }

        for (var i = 0; i < hareketler.length; i++) {
            var sonuc = birHareket(hareketler[i] || {}, depo, i);
            if (!sonuc.gecerli) return sonuc;
        }

        var t = { yesilKg: 0, yesilDeger: 0, kavrulmusKg: 0, kavrulmusDeger: 0 };
        sira.forEach(function (ad) {
            var d = cesitler[ad];
            t.yesilKg += d.yesilKg;         t.yesilDeger += d.yesilDeger;
            t.kavrulmusKg += d.kavrulmusKg; t.kavrulmusDeger += d.kavrulmusDeger;
            d.yesilKgFiyat = ortalama(d.yesilDeger, d.yesilKg);
            d.kavrulmusKgFiyat = ortalama(d.kavrulmusDeger, d.kavrulmusKg);
            /* Hangi fireyle hesaplandığı SÖYLENİR: tek fire varsa
               onu, birden çoksa aralığı yazarız. Ortalama fire
               UYDURMUYORUZ — partiler farklı ağırlıkta. */
            d.fireEnDusuk = d.fireler.length ? Math.min.apply(null, d.fireler) : null;
            d.fireEnYuksek = d.fireler.length ? Math.max.apply(null, d.fireler) : null;
            d.fireSayisi = d.fireler.length;
        });
        t.yesilKgFiyat = ortalama(t.yesilDeger, t.yesilKg);
        t.kavrulmusKgFiyat = ortalama(t.kavrulmusDeger, t.kavrulmusKg);

        return { gecerli: true, bos: false, cesitler: cesitler,
                 sira: sira, toplam: t };
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
        gelisim_orani: gelisim_orani,
        stok_hesap: stok_hesap,
        TOLERANS_KG: TOLERANS_KG
    };
})(typeof window !== 'undefined' ? window : this);
