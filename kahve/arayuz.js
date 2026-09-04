/* ☕ KAHVE KAVURMA — EKRAN
   ==================================================================
   Hesap burada YAPILMAZ. Her sayı `cekirdek.js`'ten gelir; buranın işi
   göstermek ve sormak. Böylece hesap ekransız sınanabiliyor.
   ================================================================== */
(function () {
    'use strict';

    var $ = function (s) { return document.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

    var DEFTER_ANAHTAR = 'kahve-defter';
    var ENVANTER_ANAHTAR = 'kahve-envanter';
    var TEMA_ANAHTAR = 'kahve-tema';
    var RENK_ANAHTAR = 'kahve-renk';

    /* ---------------------------------------------------------------
       DEPOLAMA — KORUMALI.
       Gizli sekmede ya da site verileri engelliyken `localStorage`
       okumak İSTİSNA fırlatır ve sayfa BOMBOŞ açılır. Bu takımda iki
       uygulamada tam bu yaşandı. Sessiz kalmıyoruz: yazamıyorsak
       kullanıcıya bir kez söylüyoruz.
       --------------------------------------------------------------- */
    var HAFIZA_VAR = (function () {
        try {
            localStorage.setItem('kahve-deneme', '1');
            localStorage.removeItem('kahve-deneme');
            return true;
        } catch (e) { return false; }
    })();

    function oku(anahtar, varsayilan) {
        try {
            var h = localStorage.getItem(anahtar);
            return h ? JSON.parse(h) : varsayilan;
        } catch (e) { return varsayilan; }   /* bozuk JSON da buraya düşer */
    }
    function yaz(anahtar, deger) {
        try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; }
        catch (e) { return false; }
    }

    /* ---- BİÇİMLENDİRME ----
       Yerel BELİRTİLİR, tarayıcıdan alınmaz. Alınsaydı aynı uygulama
       iki telefonda farklı sayı gösterirdi.

       Yerel artık ETKİN DİLDEN gelir. Eskiden sabit 'tr-TR' idi;
       İngilizce arayüzde 1500,5 diye yazardı ve İngilizce okuyan biri
       bunu "bin beş yüz virgül beş" değil "bir nokta beş" sanabilirdi.
       Sayı doğru, OKUNUŞU yanlış — sessiz yanlış sayının kılık
       değiştirmiş hâli. */
    function yerel() { return (window.Dil && Dil.yerel) ? Dil.yerel() : 'tr-TR'; }
    function T() { return Dil.T.apply(null, arguments); }

    function sayi(d, basamak) {
        if (d === null || d === undefined || !isFinite(d)) return '—';
        return d.toLocaleString(yerel(), {
            minimumFractionDigits: basamak === undefined ? 2 : basamak,
            maximumFractionDigits: basamak === undefined ? 2 : basamak
        });
    }
    /* Para simgesi SEÇİLİDİR ve doğru yandan yazılır: "500,00 ₺" ama
       "$500.00". Simgeyi hep sona koysaydık İngilizce yanlış olurdu. */
    function para(d) {
        if (d === null || d === undefined || !isFinite(d)) return '—';
        return Dil.paraYaz(sayi(d));
    }
    function kg(d) { return sayi(d, 3) + ' kg'; }
    /* YUZDE ISARETININ YERI DILE BAGLIDIR: Turkce'de %15,0 · Ingilizce'de
       15.0%. Sozlukten gecen metinlerde bu ayrim zaten vardi; kodun
       dogrudan birlestirdigi alti yerde YOKTU ve Ingilizce arayuzde
       "%15.0" yaziyordu. Tek islev, tek kural. */
    function yuzde(d, basamak) {
        var s = sayi(d, basamak);
        return Dil.oku() === 'en' ? s + '%' : '%' + s;
    }

    function duyur(metin) {
        var d = $('#duyuru');
        if (!d) return;
        /* Önce boşalt: aynı metin üst üste gelirse ekran okuyucu susar. */
        d.textContent = '';
        setTimeout(function () { d.textContent = metin; }, 60);
    }

    function goster(kutu, ac) { if (kutu) kutu.hidden = !ac; }

    /* ================= SEKMELER ================= */
    function sekmeleriKur() {
        $$('.sekme').forEach(function (b) {
            b.addEventListener('click', function () { sekmeAc(b.dataset.hedef); });
            /* Sekme dizisinde ok tuşlarıyla gezinme — klavye kullanıcısı
               her sekmeye Tab'layarak ulaşmak zorunda kalmasın. */
            b.addEventListener('keydown', function (e) {
                var liste = $$('.sekme');
                var i = liste.indexOf(b);
                var y = e.key === 'ArrowRight' ? i + 1
                      : e.key === 'ArrowLeft' ? i - 1 : null;
                if (y === null) return;
                e.preventDefault();
                var h = liste[(y + liste.length) % liste.length];
                h.focus(); sekmeAc(h.dataset.hedef);
            });
        });
    }
    function sekmeAc(hedef) {
        $$('.sayfa').forEach(function (s) {
            var a = s.id === hedef;
            s.classList.toggle('aktif', a);
            s.hidden = !a;
        });
        $$('.sekme').forEach(function (b) {
            b.setAttribute('aria-selected', b.dataset.hedef === hedef ? 'true' : 'false');
        });
        if (hedef === 'sDefter') defterCiz();
    }

    /* ================= FİRE ÖLÇÜMÜ ================= */
    var sonFire = null;

    function fireHesapla() {
        var s = C.fire_olc($('#fGiris').value, $('#fCikis').value);
        var kutu = $('#fireSonuc'), uyari = $('#fireUyari');

        if (!$('#fGiris').value.trim() || !$('#fCikis').value.trim()) {
            goster(kutu, false); goster(uyari, false);
            goster($('#fireKaydet'), false);
            sonFire = null;
            return;
        }
        if (!s.gecerli) {
            goster(kutu, false);
            uyari.textContent = s.mesaj;
            goster(uyari, true);
            goster($('#fireKaydet'), false);
            sonFire = null;
            return;
        }
        goster(uyari, false);
        goster(kutu, true);
        goster($('#fireKaydet'), true);
        sonFire = s;

        $('#fireBuyuk').textContent = yuzde(s.fire, 1);
        $('#fireAlt').textContent = T('girdiCikti',
            kg(s.giris), kg(s.cikis), kg(s.giris - s.cikis));

        /* ANİMASYON: çubuk kavrulmuş orana iner, çekirdekler koyulaşır.
           Bilgi yalnız harekette değil; yüzde ve kilo yazıyla da var. */
        var kalan = s.cikis / s.giris * 100;
        $('#fireCubuk').style.width = kalan + '%';
        /* ETIKETLER BOLGELERIN USTUNE DOGRU OTURMALI.
           Ilk yazimda sol etikete GIREN, sag etikete CIKAN yazmistim ve
           ekranda gorunce yanlis oldugu anlasildi: turuncu bolge KAVRULMUS
           kahve, yesil serit ise KAYIP. Yani gorsel, dogrunun tam tersini
           anlatiyordu. Sayilar dogru olsa bile GORSEL YALAN SOYLERSE, o da
           bir sessiz yanlis bilgidir -- ustelik metinden once okunur. */
        $('#fireSol').textContent = T('etiketKavrulmus', kg(s.cikis));
        $('#fireSag').textContent = T('etiketKayip', kg(s.giris - s.cikis));
        cekirdekCiz(s.fire);
        etiketRengiTazele();

        duyur(T('duyurFire', sayi(s.fire, 1), kg(s.cikis)));
    }

    /* ---------------------------------------------------------------
       CUBUK ETIKETLERININ RENGI, USTUNDE DURDUKLARI CUBUKTAN TURETILIR.

       Etiketler cubuklarin UZERINDE duruyor; zeminleri kartin degil,
       cubugun rengidir. Sol etiket `var(--vurgu)` uzerinde -- ve vurgu
       BES secenek x IKI tema = on farkli deger alabiliyor.

       Olculdu: koyu temada kahve vurgusu #f0a35a; beyaz yazi 2,08.
       Acik temada ayni vurgu #9e4f00; beyaz yazi 5,88. Yani tek bir
       sabit renk on durumun hepsinde dogru olamaz.

       Sabit renk yerine PARLAKLIKTAN turetiyoruz: acik zeminde koyu
       yazi, koyu zeminde acik yazi. Yarin altinci bir renk eklense de
       kural tutar -- hesap rengin kendisini okuyor, listesini degil.
       --------------------------------------------------------------- */
    function _rgbCoz(renk) {
        var m = String(renk || '').match(/rgba?\(([^)]+)\)/i);
        if (m) {
            var p = m[1].split(',').map(parseFloat);
            return [p[0], p[1], p[2]];
        }
        m = String(renk || '').match(/^#([0-9a-f]{6})$/i);
        if (m) return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); });
        m = String(renk || '').match(/^#([0-9a-f]{3})$/i);
        if (m) return m[1].split('').map(function (h) { return parseInt(h + h, 16); });
        return null;
    }
    function _parlaklik(renk) {
        var r = _rgbCoz(renk);
        if (!r) return null;
        var v = r.map(function (x) {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    /* WCAG esigi 0,179: bundan acik zeminde koyu yazi, koyuda acik yazi
       en yuksek karsitligi verir. */
    function _ustYazi(zemin) {
        var p = _parlaklik(zemin);
        return (p === null || p > 0.179) ? '#111111' : '#ffffff';
    }
    function etiketRengiTazele() {
        var kav = $('#fireCubuk'), sol = $('#fireSol'), sag = $('#fireSag');
        var yes = document.querySelector('.cubuk-yesil');
        if (sol && kav) sol.style.color = _ustYazi(getComputedStyle(kav).backgroundColor);
        if (sag && yes) sag.style.color = _ustYazi(getComputedStyle(yes).backgroundColor);
        /* Golge de cevrilir: koyu yazinin altinda koyu golge, harfin
           kenarini yutar ve yaziyi bulaniklastirir. */
        var g = $('.cubuk-etiket');
        if (g && sol) {
            g.style.textShadow = (sol.style.color === 'rgb(17, 17, 17)' ||
                                  sol.style.color === '#111111')
                ? '0 1px 3px rgba(255,255,255,.55)'
                : '0 1px 3px rgba(0,0,0,.55)';
        }
    }
    /* Tema ya da renk degisince yeniden turetilir. Bir kez hesaplanan
       turetilmis deger, turetilmis degil KOPYALANMIS olur ve kaynagi
       degisince bayatlar -- bugun kurulum seridinde tam bunu yasadik. */
    try {
        new MutationObserver(function () {
            /* Gecis 0,55 sn suruyor; bitmeden okursak ARA rengi olcup
               yanlis yaziya karar veririz. Gecisin sonunu bekliyoruz. */
            setTimeout(etiketRengiTazele, 600);
        }).observe(document.documentElement,
                   { attributes: true, attributeFilter: ['data-tema', 'data-renk'] });
    } catch (e) {}

    /* Çekirdek görseli: fire arttıkça koyulaşır ve küçülür. */
    function cekirdekCiz(fire) {
        var kap = $('#fireCekirdek');
        if (!kap) return;
        if (!kap.children.length) {
            for (var i = 0; i < 5; i++) {
                kap.insertAdjacentHTML('beforeend',
                    '<svg class="cekirdek" viewBox="0 0 40 40">' +
                    '<ellipse class="govde" cx="20" cy="20" rx="12" ry="17" fill="#5d783e"/>' +
                    '<path d="M20 5 Q16 20 20 35" stroke="rgba(0,0,0,.35)" ' +
                    'stroke-width="2" fill="none"/></svg>');
            }
        }
        /* %0 fire -> yeşil, %25 fire -> koyu kahve. Ara değerler karışım. */
        var t = Math.max(0, Math.min(1, fire / 20));
        /* Baslangic rengi cubugunkiyle AYNI (#5d783e = 93,120,62).
           Ayri kalsaydi ayni kartta iki farkli yesil gorunurdu. */
        var r = Math.round(93 + (108 - 93) * t);
        var g = Math.round(120 + (60 - 120) * t);
        var b = Math.round(62 + (28 - 62) * t);
        var renk = 'rgb(' + r + ',' + g + ',' + b + ')';
        var kucul = 1 - t * 0.22;
        $$('#fireCekirdek .cekirdek').forEach(function (s, i) {
            s.querySelector('.govde').setAttribute('fill', renk);
            s.style.transform = 'scale(' + kucul + ')';
            s.style.transitionDelay = (i * 60) + 'ms';
        });
    }

    /* ================= ÇEVİRME (iki yönlü) ================= */
    function cevirHesapla(kaynak) {
        var fire = $('#hFire').value;
        var kutu = $('#cevirSonuc'), uyari = $('#cevirUyari');
        if (!fire.trim()) { goster(kutu, false); goster(uyari, false); return; }

        var s, metin, alt;
        if (kaynak === 'yesil' && $('#hYesil').value.trim()) {
            s = C.kavrulmus_agirlik($('#hYesil').value, fire);
            if (s.gecerli) {
                metin = kg(s.sonuc);
                alt = T('cevirCikar', kg(s.kayip));
            }
        } else if (kaynak === 'hedef' && $('#hHedef').value.trim()) {
            s = C.yesil_gereken($('#hHedef').value, fire);
            if (s.gecerli) {
                metin = kg(s.sonuc);
                alt = T('cevirKoymali');
            }
        } else {
            goster(kutu, false); goster(uyari, false); return;
        }

        if (!s.gecerli) {
            goster(kutu, false);
            uyari.textContent = s.mesaj; goster(uyari, true);
            return;
        }
        goster(uyari, false); goster(kutu, true);
        $('#cevirBuyuk').textContent = metin;
        $('#cevirAlt').textContent = alt;
        duyur(metin + ' ' + alt);
    }

    /* ================= MALİYET ================= */
    function maliyetHesapla() {
        var g = {
            fire: $('#mFire').value, yesilFiyat: $('#mFiyat').value,
            partiKg: $('#mParti').value, enerji: $('#mEnerji').value,
            iscilik: $('#mIscilik').value, paketGram: $('#mPaket').value,
            ambalaj: $('#mAmbalaj').value, fincanGram: $('#mFincan').value
        };
        var kutu = $('#maliyetSonuc'), uyari = $('#maliyetUyari'), fark = $('#maliyetFark');
        if (!g.fire.trim() || !g.yesilFiyat.trim()) {
            goster(kutu, false); goster(uyari, false); goster(fark, false);
            return;
        }
        var s = C.maliyet(g);
        if (!s.gecerli) {
            goster(kutu, false); goster(fark, false);
            uyari.textContent = s.mesaj; goster(uyari, true);
            return;
        }
        goster(uyari, false); goster(kutu, true);
        $('#maliyetBuyuk').textContent = para(s.kgMaliyet);

        var d = $('#maliyetDetay');
        d.innerHTML = '';
        function cift(ad, deger) {
            d.insertAdjacentHTML('beforeend',
                '<div class="cift"><dt>' + ad + '</dt><dd>' + deger + '</dd></div>');
        }
        cift(T('ciftYesilPayi'), para(s.yesilPayi));
        if (s.giderPayi > 0) cift(T('ciftGiderPayi'), para(s.giderPayi));
        if (s.paketMaliyet !== undefined) cift(T('ciftPaket'), para(s.paketMaliyet));
        if (s.fincanMaliyet !== undefined) cift(T('ciftFincan'), para(s.fincanMaliyet));

        /* UYGULAMANIN VAR OLMA SEBEBİ: farkı GÖSTER. */
        fark.innerHTML = T('maliyetFark', para(s.firesizSanilan),
            para(s.yesilPayi), para(s.fireFarki));
        goster(fark, true);

        if (s.eksik.length) {
            uyari.textContent = T('girilmedi', s.eksik.join(', '));
            goster(uyari, true);
        }
        duyur(T('duyurMaliyet', para(s.kgMaliyet)));
    }

    /* ================= HARMAN ================= */
    var bilesenSayi = 0;
    function bilesenEkle(ad, oran) {
        bilesenSayi++;
        var n = bilesenSayi;
        var mense = V.menseSirali().map(function (m) {
            return '<option value="' + m.kod + '"' +
                   (m.kod === ad ? ' selected' : '') + '>' +
                   V.ad(V.MENSE, m.kod) + '</option>';
        }).join('');
        $('#bilesenler').insertAdjacentHTML('beforeend',
            '<div class="satir ikili" data-bilesen="' + n + '">' +
            '<div><label for="bAd' + n + '">' + T('cekirdekEt') + '</label>' +
            '<select id="bAd' + n + '"><option value="">' + T('bosSecin') +
            '</option>' + mense + '</select></div>' +
            '<div><label for="bOran' + n + '">' + T('oranEt') +
            ' <small>%</small></label>' +
            '<input id="bOran' + n + '" inputmode="decimal" value="' + (oran || '') + '" /></div>' +
            '</div>');
        $('#bAd' + n).addEventListener('change', harmanHesapla);
        $('#bOran' + n).addEventListener('input', harmanHesapla);
    }

    function harmanHesapla() {
        var liste = $$('#bilesenler [data-bilesen]').map(function (d) {
            var n = d.dataset.bilesen;
            /* Ekranda GÖRÜNEN adı taşıyoruz, kodu değil: bu ad
               hesaba girmez, yalnız sonuç listesinde yazılır. */
            var kod = $('#bAd' + n).value;
            return { ad: kod ? V.ad(V.MENSE, kod) : T('cekirdekN', n),
                     oran: $('#bOran' + n).value };
        }).filter(function (b) { return String(b.oran).trim() !== ''; });

        var kutu = $('#harmanSonuc'), uyari = $('#harmanUyari');
        if (!liste.length || !$('#bHedef').value.trim() || !$('#bFire').value.trim()) {
            goster(kutu, false); goster(uyari, false); return;
        }
        var s = C.harman(liste, $('#bHedef').value, $('#bFire').value);
        if (!s.gecerli) {
            goster(kutu, false);
            uyari.textContent = s.mesaj; goster(uyari, true);
            return;
        }
        goster(uyari, false); goster(kutu, true);
        $('#harmanBuyuk').textContent = kg(s.toplamYesil);
        var d = $('#harmanDetay'); d.innerHTML = '';
        s.bilesenler.forEach(function (b) {
            d.insertAdjacentHTML('beforeend',
                '<div class="cift"><dt>' + b.ad + ' (' + yuzde(b.oran, 0) + ')</dt>' +
                '<dd>' + kg(b.yesilKg) + '</dd></div>');
        });
        duyur(T('duyurHarman', kg(s.toplamYesil)));
    }


    /* ================= ENVANTER =================
       Hesap YOK burada. Depoların son hâlini `C.stok_hesap` veriyor;
       buranın işi göstermek ve yeni hareketi ona sormak.

       Bir hareket eklenirken tek doğrulama yolu var: yeni hareketi
       listenin sonuna koyup HEPSİNİ yeniden hesaplatmak. Böylece ekran
       kendi başına "bu geçerli galiba" demiyor -- kural tek yerde. */

    /* YEREL gun. `toISOString()` once UTC'ye cevirir; Turkiye UTC+3
       oldugu icin gece 00:00-03:00 arasi girilen hareket BIR GUN GERIYE
       duserdi. Ayni tuzak Muhasebe'de yasanmis ve orada da boyle
       cozulmustu. */
    function bugunYerel() {
        var d = new Date(), iki = function (n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
    }

    /* YENI ALAN, ESKI SAYFA -- olculdu (03.09.2026).
       `?v=4` ile `?v=5` AYNI dosyayi sunar; damga yalnizca onbellek
       kiricidir. Yani tarayicisinda eski index.html duran bir kullanici
       YENI arayuz.js'i eski isaretle indirir. `$('#nTarih').value = ...`
       o sayfada null uzerinde calisir, `baslat()` COKER ve uygulama
       HIC ACILMAZ -- bir sekme bile gorunmez.
       Bu, yayin sonrasi ilk dakikalarda gercek bir risk. Yeni bir DOM
       ogesine dogrudan dokunmak yerine hep bu yardimcidan geciyoruz:
       oge yoksa tarih ozelligi calismaz, uygulamanin geri kalani ayakta
       kalir. Sessiz kayip degil: tarih bos gider, motor tarihsiz kaydi
       zaten "once gelir" diye ele alir. */
    function tarihAlani() { return $('#nTarih'); }

    /* SAYARAK YAZ -- sayi degisince fark edilsin diye.
       UC KURAL, ucu de bu takimin dersi:
       1. SON DEGER TAM OLARAK YAZILIR. Ara kareler yuvarlaktir ama
          bitis her zaman gercek deger; animasyon bir sayiyi asla
          degistirmez, yalnizca ona giden yolu gosterir.
       2. `prefers-reduced-motion` acikken hic oynamaz, dogrudan yazar.
       3. Yeni cagri oncekini IPTAL eder; iki animasyon ayni ogeye
          yazarsa ekranda zikzak yapan bir sayi kalir. */
    var sayacIsleri = {};
    var sayacAglari = {};   /* emniyet agi zamanlayicilari */
    /* Yalniz YENI eklenen satir belirsin. Butun listeyi her cizimde
       oynatmak degisen seyi gizler; goz nereye bakacagini sasirir. */
    var sonEklenenDizin = -1;
    function sayarakYaz(oge, deger, bicimle) {
        if (!oge) return;
        var anahtar = oge.id || (oge.dataset && oge.dataset.sayac) || 'x';
        if (sayacIsleri[anahtar]) cancelAnimationFrame(sayacIsleri[anahtar]);
        if (sayacAglari[anahtar]) clearTimeout(sayacAglari[anahtar]);

        var azHareket = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var onceki = parseFloat(oge.dataset.sonDeger);
        oge.dataset.sonDeger = deger;

        /* ARKA PLANDAKI SEKMEDE ANIMASYON YOK.
           OLCULDU (03.09.2026): sekme gorunur degilken tarayici
           `requestAnimationFrame` cagrilarini HIC calistirmiyor. Sayi
           eski degerinde DONUP KALDI -- motor 25,350 kg derken ekranda
           15,150 kg yaziyordu. Kullanici geri donunce YANLIS SAYI
           goruyordu, hicbir uyari olmadan.
           Bir animasyon ekranda yanlis sayi birakiyorsa, o artik
           susleme degil sessiz yanlis sayidir. */
        if (azHareket || document.hidden || !isFinite(onceki) ||
            onceki === deger || typeof requestAnimationFrame !== 'function') {
            oge.textContent = bicimle(deger);
            return;
        }

        var basla = null, sure = 420;
        function bitir() {
            if (sayacIsleri[anahtar]) {
                cancelAnimationFrame(sayacIsleri[anahtar]);
                delete sayacIsleri[anahtar];
            }
            if (sayacAglari[anahtar]) {
                clearTimeout(sayacAglari[anahtar]);
                delete sayacAglari[anahtar];
            }
            oge.textContent = bicimle(deger);          /* TAM deger */
        }
        function adim(zaman) {
            if (basla === null) basla = zaman;
            var t = Math.min(1, (zaman - basla) / sure);
            var yumusak = 1 - Math.pow(1 - t, 3);      /* ease-out */
            if (t < 1) {
                oge.textContent = bicimle(onceki + (deger - onceki) * yumusak);
                sayacIsleri[anahtar] = requestAnimationFrame(adim);
            } else { bitir(); }
        }
        sayacIsleri[anahtar] = requestAnimationFrame(adim);

        /* EMNIYET AGI. `setTimeout` arka planda kisilir ama CALISIR;
           `requestAnimationFrame` hic calismaz. Animasyon yarida kalsa
           bile son deger buradan yazilir. Bekleme sureden uzun tutuldu
           ki normal akista bu ag hic devreye girmesin. */
        sayacAglari[anahtar] = setTimeout(bitir, sure + 250);
    }

    /* TARİH BİÇİMİ DİLE BAĞLIDIR: 04.09.2026 · Sep 4, 2026.
       Sabit gg.aa.yyyy bıraksaydık, "04.09" İngilizce okuyan biri için
       4 Eylül değil 9 Nisan olurdu -- sessiz yanlış tarih.

       `new Date(dize)` KULLANILMIYOR: "2026-09-04" biçimi UTC olarak
       ayrıştırılır, saat dilimi eksi olan bir kullanıcıda bir GÜN GERİ
       kayar. Parçalardan yerel tarih kuruyoruz. */
    function tarihGoster(t) {
        var p = String(t || '').split('-');
        if (p.length !== 3) return '';
        var g = new Date(+p[0], +p[1] - 1, +p[2]);
        if (isNaN(g.getTime())) return '';
        return g.toLocaleDateString(yerel(),
            { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    /* Hareket TÜRÜ kodla saklanır ('alim'), ekrana çevirisi çıkar.
       Kaydın diline bağlı olmaması bunun sayesinde. */
    function turAdi(t) {
        return T({ alim: 'turAdiAlim', kavurma: 'turAdiKavurma',
                   satis: 'turAdiSatis', zayi: 'turAdiZayi' }[t] || t);
    }

    function hareketOku() {
        var h = oku(ENVANTER_ANAHTAR, []);
        return Object.prototype.toString.call(h) === '[object Array]' ? h : [];
    }

    /* Kilo fiyatı bilinmiyorsa "0,00 ₺" YAZMIYORUZ -- sıfır da bir
       yalandır. Boş depo "bilinmiyor" der. */
    function paraVarsa(d) { return d === null ? T('bilinmiyor') : para(d); }

    function turAlanlari() {
        var t = $('#nTur').value;
        goster($('#nFiyatKap'), t === 'alim');
        goster($('#nFireKap'), t === 'kavurma');
        goster($('#nCikisKap'), t === 'kavurma');
        goster($('#nNeredeKap'), t === 'satis' || t === 'zayi');
        $('#nKgEtiket').innerHTML = t === 'kavurma'
            ? '<span data-i18n="nKgKavurma">' + T('nKgKavurma') +
              '</span> <small data-i18n="nKgKavurmaAlt">' +
              T('nKgKavurmaAlt') + '</small>'
            : '<span data-i18n="nKgEt">' + T('nKgEt') +
              '</span> <small>kg</small>';
    }

    function hareketTopla() {
        var t = $('#nTur').value;
        var h = { tur: t, cesit: $('#nCesit').value, kg: $('#nKg').value,
                  tarih: (tarihAlani() && tarihAlani().value) || bugunYerel() };
        if (t === 'alim') h.kgFiyat = $('#nFiyat').value;
        if (t === 'kavurma') {
            h.fire = $('#nFire').value;
            h.cikisKg = $('#nCikis').value;
        }
        if (t === 'satis' || t === 'zayi') h.nerede = $('#nNerede').value;
        return h;
    }

    function hareketEkle() {
        var uyari = $('#hareketUyari');
        var liste = hareketOku().concat([hareketTopla()]);

        /* Kural motorda; ekran yalnız soruyor. */
        var s = C.stok_hesap(liste);
        if (!s.gecerli) {
            /* Motor 'Satır 3' der; kullanıcının listesinde 2 satır
               vardır ve üçüncüyü daha yeni yazıyordur. O numarayı
               göstermek 'hangi satır?' diye aratır. Hata eklemekte
               olduğu satırdaysa numarayı düşürüyoruz; eski bir satırsa
               numara KALIYOR, çünkü orada gerçekten aranacak bir satır var. */
            var m = s.mesaj.replace(new RegExp("^Satır " + liste.length + ": "), "");
            uyari.textContent = m;
            goster(uyari, true);
            duyur(T('hareketIslenmedi', m));
            return;
        }
        goster(uyari, false);

        if (!yaz(ENVANTER_ANAHTAR, liste)) {
            uyari.textContent = T('kaydedilemedi');
            goster(uyari, true);
            return;
        }
        ['#nKg', '#nFiyat', '#nFire', '#nCikis'].forEach(function (x) {
            $(x).value = '';
        });
        if (tarihAlani()) tarihAlani().value = bugunYerel();
        $('#hareketFormKap').open = false;
        sonEklenenDizin = liste.length - 1;   /* depodaki dizin */
        envanterCiz();
        sonEklenenDizin = -1;                 /* bir kez oynasin */
        duyur(T('hareketIslendi'));
    }

    function envanterCiz() {
        var liste = hareketOku();
        var s = C.stok_hesap(liste);
        var kutu = $('#envanterSonuc'), uyari = $('#envanterUyari');
        var depo = $('#envanterDepo');

        if (!s.gecerli) {
            /* Buraya normalde düşülmez; ama kayıt bozulursa SESSİZ
               kalmıyoruz -- yanlış bir stok, stok olmamasından kötüdür. */
            goster(kutu, false);
            depo.innerHTML = '';
            uyari.textContent = T('hesaplanamadi', s.mesaj);
            goster(uyari, true);
            hareketListesiCiz(liste);
            return;
        }
        goster(uyari, false);

        if (s.bos) {
            goster(kutu, false);
            depo.innerHTML = '<div class="bos-defter"></div>';
            depo.firstChild.textContent = T('depoBos');
            hareketListesiCiz(liste);
            return;
        }

        goster(kutu, true);
        sayarakYaz($('#envanterBuyuk'), s.toplam.kavrulmusKg,
                   function (d) { return T('kavrulmusEk', kg(d)); });
        $('#envanterAlt').textContent = T('depoOzet',
            kg(s.toplam.yesilKg),
            paraVarsa(s.toplam.yesilDeger + s.toplam.kavrulmusDeger === 0 &&
                      s.toplam.yesilKg + s.toplam.kavrulmusKg === 0
                      ? null : s.toplam.yesilDeger + s.toplam.kavrulmusDeger));

        depo.innerHTML = '';
        s.sira.forEach(function (ad) {
            var d = s.cesitler[ad];
            var fireNot = '';
            if (d.fireSayisi === 1) {
                fireNot = T('fireNotTek', sayi(d.fireEnDusuk, 1));
            } else if (d.fireSayisi > 1) {
                fireNot = T('fireNotAralik', d.fireSayisi,
                            sayi(d.fireEnDusuk, 1), sayi(d.fireEnYuksek, 1));
            }
            var p = document.createElement('div');
            p.className = 'depo';
            p.innerHTML =
                '<div class="ad"></div>' +
                '<div class="ikili-depo">' +
                  '<div class="kutu"><span class="etiket">' + T('etiketYesil') +
                    '</span><span class="miktar">' + kg(d.yesilKg) + '</span>' +
                    '<span class="fiyat">' +
                    T('kilosu', paraVarsa(d.yesilKgFiyat)) +
                  '</span></div>' +
                  '<div class="kutu"><span class="etiket">' +
                    T('etiketKavrulmusKisa') +
                    '</span><span class="miktar">' + kg(d.kavrulmusKg) + '</span>' +
                    '<span class="fiyat">' +
                    T('kilosu', paraVarsa(d.kavrulmusKgFiyat)) +
                  '</span></div>' +
                '</div>' +
                oranCubugu(d) +
                (fireNot ? '<div class="fire-not"></div>' : '');
            /* Çeşit adı ve fire notu METİN olarak konuyor: kullanıcının
               yazdığı ad HTML'e karışmasın. */
            p.querySelector('.ad').textContent = ad;
            if (fireNot) p.querySelector('.fire-not').textContent = fireNot;
            depo.appendChild(p);
        });

        hareketListesiCiz(liste);
    }

    /* Iki deponun agirligini OLCEKLI gosterir. Toplam sifirsa cubuk
       hic cizilmez -- bos depoyu "yarim yarim" gostermek yalan olurdu. */
    function oranCubugu(d) {
        var toplam = d.yesilKg + d.kavrulmusKg;
        if (!(toplam > 0)) return '';
        var y = d.yesilKg / toplam * 100;
        return '<div class="depo-oran" role="img" aria-label="' +
               T('cesitBaslik', kg(d.yesilKg), kg(d.kavrulmusKg)) + '">' +
               '<span class="y" style="width:' + y + '%"></span>' +
               '<span class="k" style="width:' + (100 - y) + '%"></span>' +
               '</div>' +
               '<div class="depo-oran-etiket" aria-hidden="true">' +
               '<span>' + T('etiketYesil') + '</span><span>' +
               T('etiketKavrulmusKisa') + '</span></div>';
    }

    function hareketListesiCiz(liste) {
        var k = $('#hareketListe');
        k.innerHTML = '';
        if (!liste.length) {
            k.innerHTML = '<div class="bos-defter"></div>';
            k.firstChild.textContent = T('hareketYok');
            return;
        }
        /* SIRALAMA ile SILME AYRI SEYLER.
           Liste artik TARIH sirasiyla ciziliyor ama depoda yazilma
           sirasiyla duruyor. Silerken gorunen sirayi kullanmak YANLIS
           KAYDI siler; bu yuzden ozgun dizin (`ozgunSira`) tasiniyor. */
        var ozgunSira = liste.map(function (h, i) { return { h: h, i: i }; })
            .sort(function (x, y) {
                var tx = String((x.h || {}).tarih || ''),
                    ty = String((y.h || {}).tarih || '');
                if (tx !== ty) return tx < ty ? -1 : 1;
                return x.i - y.i;
            });

        ozgunSira.forEach(function (kayit) {
            var h = kayit.h, i = kayit.i;
            var d = document.createElement('div');
            d.className = 'hareket' + (i === sonEklenenDizin ? ' yeni' : '');
            var detay = '';
            if (h.tur === 'alim') {
                /* Kullanıcının YAZDIĞI dizeyi olduğu gibi taşıyoruz --
                   yeniden biçimlemek, girdiği değeri değiştirmek olur. */
                detay = T('kilosu', Dil.paraYaz(h.kgFiyat));
            } else if (h.tur === 'kavurma') {
                detay = String(h.cikisKg || '').trim()
                    ? T('cikanKg', h.cikisKg)
                    : T('fireYuzde', h.fire);
            } else {
                detay = T('depodan', h.nerede === 'yesil'
                    ? T('etiketYesil') : T('etiketKavrulmusKisa'));
            }
            d.innerHTML = '<div class="ne"></div><div class="miktar"></div>' +
                '<button class="sil" type="button">' + T('silDugme') + '</button>' +
                '<div class="detay"></div>';
            d.querySelector('.ne').textContent =
                turAdi(h.tur) + ' · ' + h.cesit;
            d.querySelector('.miktar').textContent = h.kg + ' kg';
            var t = tarihGoster(h.tarih);
            d.querySelector('.detay').textContent =
                (t ? t + ' · ' : '') + detay;
            d.querySelector('.sil').addEventListener('click', function () {
                /* Defterde silme onay soruyor, envanterde sormuyordu.
                   Aynı uygulamada iki farklı davranış, kullanıcının
                   öğrendiğini boşa çıkarır -- üstelik bir stok hareketi
                   parti kaydından ucuz değildir, para taşır. Silinen
                   hareket geri alınamaz; sonrasındaki bütün depo
                   yeniden hesaplanır. */
                if (!confirm(T('hareketSilOnay'))) return;
                var l = hareketOku();
                l.splice(i, 1);
                yaz(ENVANTER_ANAHTAR, l);
                envanterCiz();
                duyur(T('hareketSilindi'));
            });
            k.appendChild(d);
        });
    }

    function envanterKur() {
        /* Çeşit alanı SERBEST METİNDİR: kullanıcı kendi parti adını
           yazabilir. Buradaki liste yalnız bir ÖNERİ; o yüzden koda
           değil, görünen ada dolduruluyor. */
        var dl = $('#menseListe');
        dl.innerHTML = '';
        V.menseSirali().forEach(function (m) {
            var o = document.createElement('option');
            o.value = V.ad(V.MENSE, m.kod);
            dl.appendChild(o);
        });
        if (tarihAlani()) tarihAlani().value = bugunYerel();
        $('#nTur').addEventListener('change', turAlanlari);
        $('#nEkle').addEventListener('click', hareketEkle);
        turAlanlari();
        envanterCiz();
    }

    /* ================= DEFTER ================= */
    function defterOku() { return oku(DEFTER_ANAHTAR, []); }

    function defterKaydet() {
        if (!sonFire) return;
        var liste = defterOku();
        var kayit = {
            t: new Date().toISOString(),
            giris: sonFire.giris, cikis: sonFire.cikis, fire: sonFire.fire
        };
        var ek = partiAyrintisi();
        Object.keys(ek).forEach(function (k) { kayit[k] = ek[k]; });
        liste.unshift(kayit);
        if (!yaz(DEFTER_ANAHTAR, liste)) {
            alert(T('kaydedilemediKisa'));
            return;
        }
        partiFormuTemizle();
        duyur(T('partiKaydedildi'));
        sekmeAc('sDefter');
        $$('.sekme').forEach(function (b) {
            b.setAttribute('aria-selected', b.dataset.hedef === 'sDefter' ? 'true' : 'false');
        });
    }

    function defterCiz() {
        var liste = defterOku();
        var ozet = $('#defterOzet'), kap = $('#defterListe');
        kap.innerHTML = '';

        if (!liste.length) {
            ozet.innerHTML = '';
            kap.innerHTML = '<p class="bos-defter">' + T('partiYok') + '</p>';
            return;
        }

        /* ORTALAMA VE OYNAMA — kullanıcının kendi verisinden.
           "İdeal fire" diye bir sayı YAZMIYORUZ; makineye ve çekirdeğe
           göre değişir. Yalnız KENDİ dağılımını gösteriyoruz. */
        var f = liste.map(function (p) { return p.fire; });
        var ort = f.reduce(function (a, b) { return a + b; }, 0) / f.length;
        var enAz = Math.min.apply(null, f), enCok = Math.max.apply(null, f);
        ozet.innerHTML =
            '<div class="sonuc"><div class="buyuk">' + yuzde(ort, 1) + '</div>' +
            '<div class="alt">' + T('ortalamaFire', liste.length) + '</div>' +
            '<dl><div class="cift"><dt>' + T('enDusuk') + '</dt><dd>' +
            yuzde(enAz, 1) + '</dd></div>' +
            '<div class="cift"><dt>' + T('enYuksek') + '</dt><dd>' +
            yuzde(enCok, 1) + '</dd></div>' +
            '<div class="cift"><dt>' + T('oynama') + '</dt><dd>' +
            T('puan', sayi(enCok - enAz, 1)) + '</dd></div></dl></div>';

        liste.forEach(function (p, i) {
            var t = new Date(p.t);
            var tarih = t.toLocaleDateString(yerel(), { day: '2-digit', month: 'short' }) +
                        ' ' + t.toLocaleTimeString(yerel(), { hour: '2-digit', minute: '2-digit' });
            var b = document.createElement('button');
            b.className = 'kart parti';
            b.type = 'button';
            b.setAttribute('aria-label',
                T('partiDuyur', tarih, sayi(p.fire, 1)));
            /* KAYIT KOD TUTAR, EKRAN ÇEVİRİ GÖSTERİR.
               `V.ad()` tanımadığı değeri olduğu gibi verir; eski
               Türkçe kayıtlar da, kullanıcının kendi yazdığı da
               kaybolmaz. */
            var menseAd = p.mense ? V.ad(V.MENSE, V.kodla(V.MENSE, p.mense)) : '';
            var dereceAd = p.derece ? V.ad(V.DERECE, V.kodla(V.DERECE, p.derece)) : '';
            var ayrinti = [kg(p.giris) + ' → ' + kg(p.cikis)];
            if (menseAd) ayrinti.push(menseAd);
            if (dereceAd) ayrinti.push(dereceAd);
            if (p.dtr !== undefined) ayrinti.push(T('gelisimKisa', sayi(p.dtr, 1)));
            if (p.not) ayrinti.push(p.not);
            b.innerHTML = '<span class="ad">' + tarih +
                (menseAd ? ' · ' + menseAd : '') + '</span>' +
                '<span class="fire">' + yuzde(p.fire, 1) + '</span>' +
                '<span class="detay">' + ayrinti.join(' · ') + '</span>';
            b.addEventListener('click', function () {
                if (!confirm(T('partiSilOnay'))) return;
                var l = defterOku(); l.splice(i, 1); yaz(DEFTER_ANAHTAR, l);
                defterCiz(); duyur(T('partiSilindi'));
            });
            kap.appendChild(b);
        });
    }


    /* ---------------------------------------------------------------
       SÜRE OKUMA — "10:30" ya da "10,5"

       İKİ BİÇİM DE KABUL, ama anlamları KARIŞTIRILMAZ:
         "10:30"  -> 10 dakika 30 saniye = 630 sn
         "10,5"   -> 10,5 DAKİKA         = 630 sn
         "10"     -> 10 DAKİKA           = 600 sn
       Düz sayıyı SANİYE saymıyoruz: kavurmacı "10" yazdığında 10
       saniye değil 10 dakika kasteder. Yanlış varsayım, gelişim
       oranını sessizce saçmalatırdı.
       --------------------------------------------------------------- */
    function sureOku(ham) {
        if (typeof ham !== 'string') return null;
        var s = ham.trim();
        if (!s) return null;
        if (s.indexOf(':') >= 0) {
            var p = s.split(':');
            if (p.length !== 2) return null;
            var d = C.sayi_oku(p[0]), sn = C.sayi_oku(p[1]);
            if (d === null || sn === null) return null;
            if (sn >= 60 || sn < 0 || d < 0) return null;   /* "10:75" saçma */
            return d * 60 + sn;
        }
        var dk = C.sayi_oku(s);
        return dk === null ? null : dk * 60;
    }

    function sureYaz(sn) {
        if (sn === null || !isFinite(sn)) return '—';
        var d = Math.floor(sn / 60), k = Math.round(sn % 60);
        return d + ':' + (k < 10 ? '0' : '') + k;
    }

    /* ================= DEMLEME ================= */
    function demlemeKur() {
        var y = $('#dYontem');
        /* Dil değişince yeniden doldurulur; SEÇİLİ yöntem korunur.
           Korumasaydık dil düğmesine basmak sessizce Espresso'yu
           Filtre'ye çevirir, ekrandaki gram sayısı değişirdi. */
        var onceki = y.value;
        y.innerHTML = '';
        V.DEMLEME.forEach(function (m, i) {
            var o = document.createElement('option');
            o.value = String(i);
            o.textContent = V.ad(V.DEMLEME, m.kod) + '  (1:' + m.oran + ')';
            y.appendChild(o);
        });
        if (onceki !== '' && V.DEMLEME[+onceki]) y.value = onceki;
        if (y.dataset.kurulu !== '1') {
            y.dataset.kurulu = '1';
            y.addEventListener('change', function () {
                $('#dOran').value = V.DEMLEME[+y.value].oran;
                demlemeHesapla();
            });
            $('#dOran').value = V.DEMLEME[0].oran;
        }
        ['#dSu', '#dOran'].forEach(function (s) {
            $(s).addEventListener('input', demlemeHesapla);
        });
    }

    function demlemeHesapla() {
        var su = C.sayi_oku($('#dSu').value);
        var oran = C.sayi_oku($('#dOran').value);
        var kutu = $('#demlemeSonuc'), uyari = $('#demlemeUyari');
        if (!$('#dSu').value.trim()) { goster(kutu, false); goster(uyari, false); return; }
        if (su === null || oran === null) {
            goster(kutu, false);
            uyari.textContent = T('okunamadi');
            goster(uyari, true); return;
        }
        if (su <= 0 || oran <= 0) {
            goster(kutu, false);
            uyari.textContent = T('suOranPozitif');
            goster(uyari, true); return;
        }
        goster(uyari, false); goster(kutu, true);
        var gram = su / oran;
        $('#demlemeBuyuk').textContent = sayi(gram, 1) + ' g';
        $('#demlemeAlt').textContent =
            T('demlemeAlt2', sayi(su, 0), sayi(oran, 0));
        duyur(T('duyurDemleme', sayi(gram, 1)));
    }

    /* ================= PARTİ FORMU ================= */
    function secenekDoldur(id, liste, bosMetin) {
        var s = $(id);
        if (!s) return;
        /* SEÇİLİ DEĞER KORUNUR. Dil değişince liste yeniden
           doldurulur; korunmasaydı kullanıcının seçtiği menşe sessizce
           silinirdi ve kaydederken boş giderdi. */
        var onceki = s.value;
        s.innerHTML = '<option value="">' + (bosMetin || T('bosSecim')) + '</option>';
        liste.forEach(function (x) {
            var o = document.createElement('option');
            o.value = x.kod;
            o.textContent = V.ad(liste, x.kod);
            var n = V.not(liste, x.kod);
            if (n) o.title = n;
            s.appendChild(o);
        });
        if (onceki) s.value = onceki;
    }

    function partiFormKur() {
        secenekDoldur('#pMense', V.menseSirali());
        secenekDoldur('#pIsleme', V.ISLEME);
        secenekDoldur('#pVaryete', V.varyeteSirali());
        secenekDoldur('#pDerece', V.DERECE);
        ['#pToplam', '#pCatlak'].forEach(function (s) {
            $(s).addEventListener('input', dtrGoster);
        });
    }

    function dtrGoster() {
        var kutu = $('#dtrKutu');
        var t = sureOku($('#pToplam').value), c = sureOku($('#pCatlak').value);
        if (t === null || c === null) { goster(kutu, false); return; }
        var s = C.gelisim_orani(t, c);
        if (!s.gecerli) {
            kutu.textContent = s.mesaj;
            goster(kutu, true);
            return;
        }
        /* "İDEAL ARALIK" YAZMIYORUZ. Tartışmalı bir konu ve makineye
           göre değişir; sayıyı veririz, hüküm vermeyiz. Uygulama
           zamanla KENDİ partilerinizin dağılımını gösterecek. */
        kutu.innerHTML = T('dtrKutu', sayi(s.dtr, 1), sureYaz(s.gelisimSn));
        goster(kutu, true);
    }

    function partiAyrintisi() {
        var d = {};
        [['mense', '#pMense'], ['isleme', '#pIsleme'], ['varyete', '#pVaryete'],
         ['derece', '#pDerece'], ['not', '#pNot']].forEach(function (p) {
            var v = $(p[1]) && $(p[1]).value.trim();
            if (v) d[p[0]] = v;
        });
        var t = sureOku($('#pToplam').value), c = sureOku($('#pCatlak').value);
        if (t !== null) d.toplamSn = t;
        if (c !== null) d.catlakSn = c;
        if (t !== null && c !== null) {
            var s = C.gelisim_orani(t, c);
            if (s.gecerli) d.dtr = s.dtr;
        }
        var sarj = C.sayi_oku($('#pSarj').value);
        var cikisIsi = C.sayi_oku($('#pCikisIsi').value);
        if (sarj !== null) d.sarj = sarj;
        if (cikisIsi !== null) d.cikisIsi = cikisIsi;
        return d;
    }

    function partiFormuTemizle() {
        ['#pMense','#pIsleme','#pVaryete','#pDerece','#pToplam','#pCatlak',
         '#pSarj','#pCikisIsi','#pNot'].forEach(function (s) {
            if ($(s)) $(s).value = '';
        });
        goster($('#dtrKutu'), false);
    }

    /* ================= TEMA VE RENK ================= */
    /* Renk ADLARI çevrilir; renk KODU ('kiraz') sabittir ve diske
       o yazılır. Ad diske yazılsaydı dil değişince seçili renk
       kaybolurdu. */
    var RENKLER = [
        ['varsayilan', 'renkKahve',   '#9e4f00'],
        ['kiraz',      'renkKiraz',   '#b3123c'],
        ['yesil',      'renkYesil',   '#00752b'],
        ['okyanus',    'renkOkyanus', '#036e8c'],
        ['mor',        'renkMor',     '#7b3fe4']
    ];

    function temayiKur() {
        var btn = $('#temaBtn');
        btn.addEventListener('click', function () {
            var su = document.documentElement.getAttribute('data-tema');
            var yeni = su === 'koyu' ? 'acik' : 'koyu';
            document.documentElement.setAttribute('data-tema', yeni);
            /* Bu bir SEÇİM, türetilmiş değer değil — diske yazılır. */
            try { localStorage.setItem(TEMA_ANAHTAR, yeni); } catch (e) {}
            var m = document.querySelector('meta[name="theme-color"]');
            if (m) m.setAttribute('content', yeni === 'koyu' ? '#0d0b09' : '#f5f6f8');
            duyur(T(yeni === 'koyu' ? 'temaKoyu' : 'temaAcik'));
        });
    }

    function renkleriKur() {
        var liste = $('#renkListe'), panel = $('#renkPanel'), btn = $('#renkBtn');
        RENKLER.forEach(function (r) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'renk-nokta';
            b.dataset.renk = r[0];
            b.dataset.i18nAd = r[1];
            b.setAttribute('aria-pressed', 'false');
            b.innerHTML = '<span class="yuvar" style="background:' + r[2] +
                          '"></span><span class="renk-ad"></span>';
            b.addEventListener('click', function () { renkUygula(r[0], true); });
            liste.appendChild(b);
        });
        renkAdlariniYaz();
        btn.addEventListener('click', function () {
            var ac = panel.hidden;
            panel.hidden = !ac;
            btn.setAttribute('aria-expanded', ac ? 'true' : 'false');
            if (ac) liste.querySelector('.renk-nokta').focus();
        });
        panel.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { panel.hidden = true;
                btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
        });
        var s = null;
        try { s = localStorage.getItem(RENK_ANAHTAR); } catch (e) {}
        renkUygula(s || 'varsayilan', false);
    }

    /* Renk adları dil değişince yeniden yazılır. Bir kez yazılıp
       bırakılsaydı, İngilizce'ye geçince noktaların yanında "Kiraz"
       yazmaya devam ederdi -- yarım çeviri. */
    function renkAdlariniYaz() {
        $$('.renk-nokta').forEach(function (b) {
            var ad = T(b.dataset.i18nAd);
            var y = b.querySelector('.renk-ad');
            if (y) y.textContent = ad;
            b.setAttribute('aria-label', T('renkEtiket', ad));
        });
    }

    function renkUygula(r, kaydet) {
        if (r && r !== 'varsayilan') document.documentElement.setAttribute('data-renk', r);
        else { document.documentElement.removeAttribute('data-renk'); r = 'varsayilan'; }
        if (kaydet) { try { localStorage.setItem(RENK_ANAHTAR, r); } catch (e) {} }
        $$('.renk-nokta').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.renk === r ? 'true' : 'false');
        });
    }

    /* ================= DİL ================= */
    function dilPanelKur() {
        var btn = $('#dilBtn'), panel = $('#dilPanel');
        var dl = $('#dilListe'), pl = $('#paraListe');
        if (!btn || !panel) return;

        [['tr', 'Türkçe'], ['en', 'English']].forEach(function (x) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'renk-nokta';
            b.dataset.dil = x[0];
            b.textContent = x[1];              /* dil adları ÇEVRİLMEZ:
                                                  kendi dilinde yazılır ki
                                                  o dili arayan bulsun */
            b.addEventListener('click', function () { Dil.ayarla(x[0]); });
            dl.appendChild(b);
        });

        Object.keys(Dil.PARALAR).forEach(function (kod) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'renk-nokta';
            b.dataset.para = kod;
            b.textContent = Dil.PARALAR[kod].simge + ' ' + kod;
            b.addEventListener('click', function () {
                Dil.paraAyarla(kod);
                paraIsaretle();
                paraBirimleriniYaz();
                yenidenCiz();
            });
            pl.appendChild(b);
        });

        btn.addEventListener('click', function () {
            var ac = panel.hidden;
            panel.hidden = !ac;
            btn.setAttribute('aria-expanded', ac ? 'true' : 'false');
        });
        panel.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { panel.hidden = true;
                btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
        });
        paraIsaretle();
    }

    function paraIsaretle() {
        var d = Dil.oku(), p = Dil.paraKodu();
        $$('#dilListe [data-dil]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.dil === d ? 'true' : 'false');
        });
        $$('#paraListe [data-para]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.para === p ? 'true' : 'false');
        });
        /* Düğmenin üstündeki yazı GEÇİLECEK dili gösterir. Etkin dili
           gösterseydi basınca ne olacağı belirsiz kalırdı. */
        var btn = $('#dilBtn');
        if (btn) btn.textContent = d === 'tr' ? 'EN' : 'TR';
    }

    /* `<small class="para-birim">` kutucukları: etikette geçen para
       simgesi sabit "TL" değil, SEÇİLEN birimdir. */
    function paraBirimleriniYaz() {
        $$('.para-birim').forEach(function (o) {
            o.textContent = Dil.paraSimge();
        });
    }

    /* DİL DEĞİŞİNCE EKRANDAKİ HER ÜRETİLEN METİN YENİDEN ÇİZİLİR.
       Yalnız duran metinleri çevirseydik, hesaplanmış sonuçlar eski
       dilde kalırdı: yarısı İngilizce yarısı Türkçe bir ekran. Ve
       bundan daha kötüsü, SAYILAR eski yerelde kalırdı. */
    function yenidenCiz() {
        try { partiFormKur(); } catch (e) {}
        try { demlemeKur(); } catch (e) {}
        try { turAlanlari(); } catch (e) {}
        try { renkAdlariniYaz(); } catch (e) {}
        try { envanterCiz(); } catch (e) {}
        try { defterCiz(); } catch (e) {}
        try { fireHesapla(); } catch (e) {}
        try { maliyetHesapla(); } catch (e) {}
        try { harmanHesapla(); } catch (e) {}
        try { demlemeHesapla(); } catch (e) {}
        try { dtrGoster(); } catch (e) {}
        try {
            cevirHesapla($('#hHedef').value.trim() ? 'hedef' : 'yesil');
        } catch (e) {}
        /* Harman bileşen satırlarındaki etiketler ve menşe listesi de
           dile bağlı; onları da tazeliyoruz. */
        try {
            var eski = $$('#bilesenler [data-bilesen]').map(function (o) {
                var n = o.dataset.bilesen;
                return { kod: $('#bAd' + n).value, oran: $('#bOran' + n).value };
            });
            $('#bilesenler').innerHTML = '';
            bilesenSayi = 0;
            eski.forEach(function (b) { bilesenEkle(b.kod, b.oran); });
            harmanHesapla();
        } catch (e) {}
    }

    /* ================= BAŞLAT ================= */
    function baslat() {
        /* DİL EN BAŞTA KURULUR. Sonra kurulsaydı arayüz bir kez Türkçe
           çizilir, sonra İngilizce'ye atlardı -- ve daha kötüsü, ilk
           çizimdeki sayılar Türkçe yerelde yazılmış olurdu. */
        Dil.baslat();
        dilPanelKur();
        paraBirimleriniYaz();

        sekmeleriKur();
        temayiKur();
        renkleriKur();

        ['#fGiris', '#fCikis'].forEach(function (s) {
            $(s).addEventListener('input', fireHesapla);
        });
        $('#fireKaydet').addEventListener('click', defterKaydet);

        $('#hFire').addEventListener('input', function () {
            cevirHesapla($('#hHedef').value.trim() ? 'hedef' : 'yesil');
        });
        $('#hYesil').addEventListener('input', function () {
            $('#hHedef').value = ''; cevirHesapla('yesil');
        });
        $('#hHedef').addEventListener('input', function () {
            $('#hYesil').value = ''; cevirHesapla('hedef');
        });

        ['#mFiyat','#mFire','#mParti','#mEnerji','#mIscilik','#mPaket','#mAmbalaj','#mFincan']
            .forEach(function (s) { $(s).addEventListener('input', maliyetHesapla); });

        bilesenEkle('', '60'); bilesenEkle('', '40');
        $('#bEkle').addEventListener('click', function () { bilesenEkle('', ''); });
        ['#bHedef', '#bFire'].forEach(function (s) {
            $(s).addEventListener('input', harmanHesapla);
        });

        envanterKur();

        if (!HAFIZA_VAR) {
            var u = document.createElement('div');
            u.className = 'uyari-kutu';
            /* İKİ defter de sayılır. Envanter eklenince bu cümle
               eksik kaldı: yalnız 'kavurma defteri' diyordu, oysa
               stok hareketleri de kaydedilemiyor. Eksik uyarı,
               kullanıcıya 'envanterim duruyor' dedirtir. */
            u.id = 'depolamaUyari';
            u.setAttribute('data-i18n', 'depolamaKapali');
            u.textContent = T('depolamaKapali');
            $('.sarmal').insertBefore(u, $('.sekmeler'));
        }
        demlemeKur();
        partiFormKur();
        defterCiz();

        /* Dil değişince: duran metinleri `Dil.uygula()` çevirir (dil.js
           içinde), üretilenleri burası yeniden çizer. İkisi ayrı ayrı
           yapılmazsa ekranın yarısı eski dilde kalır. */
        Dil.dinle(function () {
            paraIsaretle();
            paraBirimleriniYaz();
            yenidenCiz();
            /* KURULUM DAVETI DE CEVRILIR.
               Serit ve kapi ORTAK modulden gelir ve metinlerini
               KURULDUKLARI ANDA alirlar. Bildirmezsek, Ingilizce
               arayuzun altinda "Uygulama olarak kur / Simdi degil"
               Turkce kalir -- ekranda goruldu, yarim ceviri.

               Modul bir olay dinliyor; dil kavrami burada, modulde
               degil. Tek dilli sekiz kardes bu olayi hic gondermez. */
            try {
                document.dispatchEvent(new CustomEvent('kurulum-metin', {
                    detail: {
                        kapiMetni: T('kurKapi'), baslik: T('kurBaslik'),
                        metin: T('kurMetin'), kurBtn: T('kurBtn'),
                        sonraBtn: T('kurSonra'), nasilBtn: T('kurNasil'),
                        iosMetin: T('kurIos'), digerMetin: T('kurDiger')
                    }
                }));
            } catch (e) {}
            duyur(T('dilDegisti'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', baslat);
    } else { baslat(); }
})();
