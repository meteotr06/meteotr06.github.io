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
        var siralanmis = hareketler.map(function (h, i) {
            return { h: h || {}, i: i };
        }).sort(function (a, b) {
            var ta = String(a.h.tarih || ''), tb = String(b.h.tarih || '');
            if (ta !== tb) return ta < tb ? -1 : 1;
            return a.i - b.i;
        });

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
        stok_hesap: stok_hesap,
        tarihSirala: function (liste) {
            return (liste || []).map(function (h, i) { return { h: h, i: i }; })
                .sort(function (a, b) {
                    var ta = String((a.h || {}).tarih || ''),
                        tb = String((b.h || {}).tarih || '');
                    if (ta !== tb) return ta < tb ? -1 : 1;
                    return a.i - b.i;
                }).map(function (x) { return x.h; });
        },
        TOLERANS_KG: TOLERANS_KG
    };
})(typeof window !== 'undefined' ? window : this);
