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

    /* ETKIN DIL. Sayi OKUMA ve YAZMA buna gore degisir; motorun
       kendisi diller arasi tek gercektir, yalnizca bicim degisir. */
    var DIL = 'tr';
    function dilAyarla(d) { DIL = (d === 'en') ? 'en' : 'tr'; return DIL; }
    function dilOku() { return DIL; }

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

        /* ---------------------------------------------------------------
           IKI YAZIM BICIMI

           Uygulama Ingilizce'ye acilinca burasi degismek ZORUNDAYDI.
           Olculdu (03.09.2026, eski surum):
               "1,500.50"  -> 1,5005      (dogrusu 1500,50)
               "12,345.67" -> 12,34567    (dogrusu 12345,67)
               "1,500"     -> 1,5         (Ingilizce'de 1500)
           Ucu de BIN KAT hata, uyarisiz. Muhasebe'de bu gece ayni sinif
           bulundu; oradaki kanitlanmis kural buraya tasindi.

           KURALLAR
           1. IKI AYRAC DA VARSA: SONDAKI ondaliktir. Bu kural DILDEN
              BAGIMSIZ dogrudur -- "1.500,50" da "1,500.50" da tek bir
              sekilde okunur.
           2. TEK AYRAC VARSA dil gerekir, cunku "1,500" gercekten
              belirsizdir: Turkce'de 1,5 · Ingilizce'de 1500.
              Dilin ONDALIK ayraci ise ondalik sayilir.
              Degilse binlik sayilir -- ama YALNIZCA duzgun binlik
              kaliba uyuyorsa ("1.500", "1.234.567"). Uymuyorsa
              ondalik kabul edilir; boylece Turkce'de "1.5" yine 1,5
              olur, "15" olmaz.
           --------------------------------------------------------------- */
        var ondalikAyrac = DIL === 'en' ? '.' : ',';
        var binlikAyrac = DIL === 'en' ? ',' : '.';

        if (nokta > 0 && virgul > 0) {
            /* 1. kural: sondaki ondaliktir */
            var sonNokta = s.lastIndexOf('.'), sonVirgul = s.lastIndexOf(',');
            if (sonVirgul > sonNokta) s = s.replace(/\./g, '').replace(/,/g, '.');
            else                      s = s.replace(/,/g, '');
        } else if (ondalikAyrac === ',' ? virgul > 0 : nokta > 0) {
            /* dilin ONDALIK ayraci */
            if ((ondalikAyrac === ',' ? virgul : nokta) > 1) return null;  /* "1,2,3" */
            s = s.replace(ondalikAyrac, '.');
        } else if (ondalikAyrac === ',' ? nokta > 0 : virgul > 0) {
            /* dilin BINLIK ayraci */
            var kacar = ondalikAyrac === ',' ? nokta : virgul;
            var kacip = binlikAyrac === '.' ? '\\.' : ',';
            var binlikKalip = new RegExp('^\\d{1,3}(' + kacip + '\\d{3})+$');
            if (binlikKalip.test(s)) {
                s = s.split(binlikAyrac).join('');
            } else if (kacar === 1) {
                /* Duzgun binlik degil -> ondalik say. Turkce'de "1.5"
                   boylece 1,5 kalir; "15" olmaz. */
                s = s.replace(binlikAyrac, '.');
            } else {
                return null;                        /* "1.23.4" belirsiz */
            }
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
            /* Fiyat ISTEGE BAGLI: yoksa `null` kalir ve asagida
               "eksik" sayilir -- sifir sayilmaz (K-66). */
            var fy = sayi_oku(bilesenler[i].fiyat);
            if (fy !== null && fy < 0) {
                return red('fiyat_negatif', 'Fiyat eksi olamaz.');
            }
            satir.push({ ad: bilesenler[i].ad, oran: o, fiyat: fy });
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
        /* ---- HARMANIN KILO MALIYETI ----
           Bilesen fiyatlarinin ORANLA agirliklandirilmis ortalamasi
           yesil maliyeti verir; kavrulmus kilonun maliyeti icin fire
           duzeltmesi gerekir (10 kg yesilden 8,5 kg cikiyorsa yesilin
           kilosu 500 ise kavrulmusun kilosu 588,24).

           TEK BIR FIYAT EKSIKSE HESAP YAPILMIYOR. Eksigi sifir saymak
           ortalamayi asagi ceker ve kullanici ucuz bir harman gorur --
           sessiz yanlis sayinin tam tarifi (K-66). */
        var eksikFiyat = satir.filter(function (x) { return x.fiyat === null; })
                              .map(function (x) { return x.ad; });
        var harmanMaliyet = null, yesilOrtalama = null;
        if (!eksikFiyat.length) {
            yesilOrtalama = satir.reduce(function (t, x) {
                return t + x.fiyat * x.oran / 100;
            }, 0);
            harmanMaliyet = yesilOrtalama / (1 - f / 100);
        }

        return { gecerli: true, toplamYesil: toplamYesil, bilesenler: satir,
                 /* yesil kilo maliyeti (fire hesaba katilmadan) */
                 yesilOrtalama: yesilOrtalama,
                 /* KAVRULMUS kilo maliyeti -- satis bunun uzerinden yapilir */
                 kgMaliyet: harmanMaliyet,
                 eksikFiyat: eksikFiyat };
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
    /* Ekranda fireyi tek ondalikla yaziyoruz; bundan kucuk bir
       farki gosteremiyoruz, dolayisiyla uyari da yapmiyoruz. */
    var EN_KUCUK_FARK_PUAN = 0.1;

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

        /* TARIH SIRASIYLA OYNAT.
           Hareketin `tarih` alani "YYYY-AA-GG" bicimindedir ve metin
           siralamasi bu bicimde tarih siralamasiyla aynidir.

           NIYE SIRALIYORUZ: onceden sira "ne zaman YAZILDIGI"ydi. Yanlisla
           silinen bir alimi geri eklemek ise yaramiyordu -- yeni kayit
           sona gidiyor, kavurma yine dayanaksiz kaliyordu. Kullanici
           defterini kurtaramiyordu.

           TARIHSIZ KAYITLAR ONCE gelir ve KENDI ARALARINDA eski sirasini
           korur. Boylece bu alan eklenmeden once yazilmis defterler
           birebir ayni sonucu verir -- veri donusturmeye gerek yok.

           Siralama KARARLIDIR (index ikincil anahtar): ayni gun icindeki
           hareketler yazilma sirasini korur, yoksa ayni defter iki kez
           hesaplaninca farkli sonuc verebilirdi. */
        var siralanmis = tarihSiralaDizinli(hareketler);

        var cesitler = {}, sira = [];

        function depo(ad) {
            var a = String(ad === undefined || ad === null ? '' : ad).trim();
            if (!a) return null;
            if (!cesitler[a]) { cesitler[a] = bosDepo(); sira.push(a); }
            return cesitler[a];
        }

        for (var i = 0; i < siralanmis.length; i++) {
            /* Satir numarasi KULLANICIYA GORUNEN sirayi gostermeli;
               ekran da bu sirayla ciziliyor. */
            var sonuc = birHareket(siralanmis[i].h, depo, i);
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
                 sira: sira, toplam: t,
                 /* Ekran listeyi BU sirayla cizmeli; motorun oynattigi
                    sira ile gosterilen sira ayrisirsa "Satir 3" ibaresi
                    yanlis satiri isaret eder. */
                 sirali: siralanmis.map(function (x) { return x.h; }) };
    }


    /* ---------------------------------------------------------------
       PARTI KARSILASTIRMA -- "bu parti oncekilere gore nasil gitti?"

       Defter zaten fire, gelisim orani, sureler ve mense tutuyor; ama
       yalnizca LISTELIYOR. Kavurmacinin sordugu soru bu degil: o,
       "gecen sefere gore ne degisti" diye soruyor.

       KURAL -- HICBIR IDEAL DEGER YOK. Bu islev "dogru fire %15'tir"
       gibi bir sey SOYLEMEZ; yalnizca KULLANICININ KENDI gecmis
       partilerini ozetler. Ideal fire makineye, cekirdege ve kavurma
       derecesine gore degisir; bir sayi yazsaydik kullanici onu olcum
       sanirdi (K-22). Uygulama bastan bu sozu veriyor (veri.js:
       "fire orani ... KULLANICIDAN olcerek ogrenir").

       KIYAS KUMESI: ayni MENSE ve ayni DERECE. Ikisi de tutmuyorsa
       kiyas anlamsiz -- Etiyopya'yi acik kavurmakla Brezilya'yi koyu
       kavurmayi karsilastirmak bilgi vermez, gurultu verir.

       YETERSIZ VERI DURUSTCE SOYLENIR: tek bir onceki parti "ortalama"
       degildir. En az IKI onceki kayit istiyoruz; yoksa `yeterli:false`
       ve sebebi doner. Bos donmek yerine NEDEN bos oldugunu soylemek,
       kullanicinin "uygulama bozuk mu" diye dusunmesini onler.
       --------------------------------------------------------------- */

    /** Bir partiyi, ayni mense+derecedeki onceki partilerle karsilastirir.
        kayit   : {fire, dtr, mense, derece, ...}
        gecmis  : defterdeki butun kayitlar (kayit da icinde olabilir)
        Doner   : {yeterli, sebep} ya da ozet nesnesi. */
    function parti_karsilastir(kayit, gecmis) {
        if (!kayit) return { yeterli: false, sebep: 'kayit_yok' };
        var mense = (kayit.mense || '').trim();
        var derece = (kayit.derece || '').trim();
        if (!mense || !derece) return { yeterli: false, sebep: 'kunye_eksik' };

        /* Kendisini disarida birak: zaman damgasi kimlik yerine geciyor.
           Damgasizsa nesne kimligine bakiyoruz -- ayni kaydin kendisiyle
           karsilastirilmasi ortalamayi kendine dogru ceker. */
        var oncekiler = (gecmis || []).filter(function (k) {
            if (!k || k === kayit) return false;
            if (kayit.t && k.t && k.t === kayit.t) return false;
            if ((k.mense || '').trim() !== mense) return false;
            if ((k.derece || '').trim() !== derece) return false;
            if (typeof k.fire !== 'number' || !isFinite(k.fire)) return false;
            /* FIRE SINIRI BURADA DA GECERLI. `fire_gecerli` bes islevde
               kullaniliyordu, burada YOKTU -- oysa bu islev de defterden
               gelen degerleri okuyor. Depoya bir sekilde girmis imkansiz
               bir deger (or. %150) ortalamayi kaydirirdi ve kullanici
               bunu kendi olcumu sanirdi (K-102: yazma tarafini kapatmak
               okuma tarafini kapatmaz).
               DIKKAT: `fire_gecerli` GECERLIYSE null doner. */
            return !fire_gecerli(k.fire);
        });

        if (oncekiler.length < 2) {
            return { yeterli: false, sebep: 'az_kayit',
                     bulunan: oncekiler.length, mense: mense, derece: derece };
        }

        var fireler = oncekiler.map(function (k) { return k.fire; });
        var ort = fireler.reduce(function (a, b) { return a + b; }, 0) / fireler.length;
        var enDusuk = Math.min.apply(null, fireler);
        var enYuksek = Math.max.apply(null, fireler);

        /* Standart sapma: "olagan salinim" ne kadar? Tek bir ortalamaya
           bakip "sapti" demek yaniltir -- kimi cekirdek dogal olarak
           daha oynak. Payda n (ornek degil, kullanicinin TUM gecmisi). */
        var kare = fireler.reduce(function (t, f) {
            return t + (f - ort) * (f - ort);
        }, 0) / fireler.length;
        var sapma = Math.sqrt(kare);

        var fark = kayit.fire - ort;

        /* ---------------------------------------------------------
           "OLAGANDISI" NE ZAMAN DENIR?

           ILK YAZDIGIM KURAL YANLISTI ve EKRANDA OLCEREK gorundu
           (06.09.2026). Kural "ortalamadan standart sapmadan fazla
           uzaksa uyar; sapma kucukse taban 0,2 puan" idi. Gercek
           bir defterle denendiginde DORT karsilastirmanin UCU
           turuncu "YUKSEK/DUSUK" yaziyordu:
               %15,2 · ortalama %15,0 · aralik 14,8-15,1  -> "YUKSEK"
               %14,8 · ortalama %15,1 · aralik 15,0-15,1  -> "DUSUK"
           Hicbir kavurmaci bunlara olagandisi demez. Surekli oten
           bir alarm, alarm olmamasindan KOTUDUR: kullanici okumayi
           birakir ve sirada gelen gercek %19,4'u de kacirir.

           YENI KURAL -- yine hicbir sabit uydurmadan:
             1. Parti, kullanicinin GORDUGU araligin (en dusuk-en
                yuksek) DISINDA olacak. Icerideki bir sayi, tanimi
                geregi daha once yasanmis demektir.
             2. Disari tasma, o araligin KENDI genisliginden (ya da
                standart sapmadan; hangisi buyukse) fazla olacak.
             3. Bunu soyleyebilmek icin EN AZ UC onceki parti gerek.
                Iki noktayla ortalama hesaplanir ama "olagan salinim"
                bilinmez; iki nokta her zaman bir dogru cizer.
           Ucu de kullanicinin KENDI sayilarindan turer.

           TEK SABIT: EN_KUCUK_FARK_PUAN. Butun gecmis birebir ayni
           sayiysa genislik de sapma da 0 cikar ve her kil payi fark
           "olagandisi" olurdu. Taban, EKRANDA YAZDIGIMIZ cozunurluk:
           fireyi tek ondalikla gosteriyoruz, yani 0,1 puandan kucuk
           bir farki kullaniciya gosteremiyoruz bile. Gosteremedigimiz
           bir farkla alarm calmayiz. */
        var genislik = enYuksek - enDusuk;
        var esik = Math.max(genislik, sapma, EN_KUCUK_FARK_PUAN);
        var yeterinceGecmis = oncekiler.length >= 3;
        var disarida = kayit.fire > enYuksek + esik || kayit.fire < enDusuk - esik;

        var dtrler = oncekiler.filter(function (k) {
            return typeof k.dtr === 'number' && isFinite(k.dtr);
        }).map(function (k) { return k.dtr; });
        var dtrOrt = dtrler.length
            ? dtrler.reduce(function (a, b) { return a + b; }, 0) / dtrler.length
            : null;

        return {
            yeterli: true,
            mense: mense, derece: derece,
            sayi: oncekiler.length,
            fire: kayit.fire,
            fireOrt: ort, fireEnDusuk: enDusuk, fireEnYuksek: enYuksek,
            sapma: sapma,
            genislik: genislik,
            esik: esik,
            fark: fark,
            /* Uyari icin uc kosul da saglanmali. `alarmaHazir`, ekranin
               "neden uyari yok" diye sorabilmesi icin ayrica veriliyor. */
            alarmaHazir: yeterinceGecmis,
            olagandisi: yeterinceGecmis && disarida,
            yon: fark > 0 ? 'yuksek' : (fark < 0 ? 'dusuk' : 'ayni'),
            dtr: (typeof kayit.dtr === 'number' && isFinite(kayit.dtr)) ? kayit.dtr : null,
            dtrOrt: dtrOrt,
            dtrSayisi: dtrler.length
        };
    }

    /* TARIH SIRALAMASI TEK YERDE.
       Bu kural 06.09.2026'ya kadar UC yerde ayri ayri yaziliydi:
       burada, `tarihSirala` disa aciminda ve arayuzun kendi ciziminde.
       Ucu de aynidiydi, yani ortada hata yoktu -- ama biri degisince
       uygulama cokmez, kullaniciya YANLIS SATIRI gosterir. Motor
       "Satir 3" der, kullanici listesinde bambaska bir satir sayar.
       Sessiz yanlis bilgi; en gec fark edilen sinif.

       DIZIN TASINIYOR (`i`). Arayuz silerken ozgun dizine muhtac:
       gorunen sirayla silmek YANLIS KAYDI siler. */
    function tarihSiralaDizinli(liste) {
        return (liste || []).map(function (h, i) {
            return { h: h || {}, i: i };
        }).sort(function (a, b) {
            /* Tarihsizler ONCE gelir (bos dize her tarihten kucuk) ve
               kendi aralarinda yazilma sirasini korur -- bu alan
               eklenmeden onceki defterler birebir ayni sonucu versin. */
            var ta = String(a.h.tarih || ''), tb = String(b.h.tarih || '');
            if (ta !== tb) return ta < tb ? -1 : 1;
            return a.i - b.i;   /* kararli: ayni gun -> yazilma sirasi */
        });
    }

    /* ---------------------------------------------------------------
       SATIS ANALIZI -- "kaca satarsam ne kazanirim?"

       MALIYETI KENDISI HESAPLAMAZ, DISARIDAN ALIR. Sebep: ekranda
       gosterilen maliyet ile kar hesabinda kullanilan maliyet AYNI
       sayi olmali. Islev kendi icinde yeniden hesaplasaydi, girdilerin
       biri degistiginde iki taraf ayrisabilir ve kullanici tutarli
       gorunen ama yanlis bir kar gorurdu.

       MARJ VE MARKUP AYRI AYRI DONER, cunku ayni sey degiller:
           marj   = kar / satis    (satisin yuzde kaci kar)
           markup = kar / maliyet  (maliyetin ustune yuzde kac konmus)
       500 maliyet + 750 satis -> marj %33,3 · markup %50. Tek bir
       "kar yuzdesi" dondurup hangisi oldugunu soylememek, sessiz
       yanlis sayinin ta kendisi olurdu.
       --------------------------------------------------------------- */
    function satis_analiz(satisFiyati, kgMaliyet) {
        var satis = sayi_oku(satisFiyati);
        if (satis === null) return red('sayi_okunamadi');
        if (satis <= 0) {
            return red('satis_sifir', 'Satış fiyatı sıfırdan büyük olmalı.');
        }
        /* Maliyet HESAPLANMIS bir sayi olarak gelir; okunamiyorsa
           uydurmuyoruz. `0` da bir maliyet degildir, bilinmiyordur. */
        if (typeof kgMaliyet !== 'number' || !isFinite(kgMaliyet) || kgMaliyet <= 0) {
            return red('maliyet_yok',
                'Önce kilo maliyetini hesaplayın — kâr, maliyet bilinmeden ' +
                'söylenemez.');
        }

        var kar = satis - kgMaliyet;
        return {
            gecerli: true,
            satis: satis,
            maliyet: kgMaliyet,
            kar: kar,
            /* Ikisi de yuzde; hangisi oldugu ADINDA yaziyor. */
            marj: kar / satis * 100,        /* satisin yuzde kaci kar */
            markup: kar / kgMaliyet * 100,  /* maliyetin ustune yuzde kac */
            zarar: kar < 0,
            /* Basabas: bu maliyette zarar etmemek icin en az bu fiyat.
               "Onerilen fiyat" DEGIL -- oneri, olculmemis bir sayidir. */
            basabas: kgMaliyet
        };
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
        dilAyarla: dilAyarla,
        dilOku: dilOku,
        fire_olc: fire_olc,
        kavrulmus_agirlik: kavrulmus_agirlik,
        yesil_gereken: yesil_gereken,
        maliyet: maliyet,
        harman: harman,
        gelisim_orani: gelisim_orani,
        satis_analiz: satis_analiz,
        parti_karsilastir: parti_karsilastir,
        stok_hesap: stok_hesap,
        tarihSirala: function (liste) {
            return tarihSiralaDizinli(liste).map(function (x) { return x.h; });
        },
        /* Arayuz bunu kullaniyor: hem sira hem OZGUN DIZIN lazim. */
        tarihSiralaDizinli: tarihSiralaDizinli,
        TOLERANS_KG: TOLERANS_KG,
        EN_KUCUK_FARK_PUAN: EN_KUCUK_FARK_PUAN
    };
})(typeof window !== 'undefined' ? window : this);
