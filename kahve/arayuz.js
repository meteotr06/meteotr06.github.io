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
            /* MAKINE DE GIZLENIR. Ekranda kalsaydi ONCEKI hesabin
               dolgusunu gosterirdi -- kullanici alanlari sildikten
               sonra hala eski sayiya bakiyor olurdu. */
            goster($('#makineKap'), false);
            goster($('#fireGecmis'), false);
            sonFire = null;
            return;
        }
        if (!s.gecerli) {
            goster(kutu, false);
            uyari.textContent = s.mesaj;
            goster(uyari, true);
            goster($('#makineKap'), false);
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
        etiketSigdir();
        makineyiCiz(s);
        try { makine3dTazele(); } catch (e) {}

        fireGecmisCiz(s.fire);

        duyur(T('duyurFire', sayi(s.fire, 1), kg(s.cikis)));
    }

    /* ---------------------------------------------------------------
       "KENDİ GEÇMİŞİNİZ" — sonuç kutusunun sağ sütunu.

       Kullanıcı Fire sekmesi için "sağı boş" dedi; ekranda baktım,
       haklıydı: büyük sayı solda duruyor, sağ yarı kararmış boşluk.

       Oraya UYDURMA bir şey koymuyoruz. Bütün sayılar kullanıcının
       KENDİ defterinden geliyor. Defter boşsa tek bir sayı bile
       üretilmiyor — sebebi yazılıp susuluyor (K-22, K-96). "Sektör
       ortalaması %15'tir" gibi bir cümle buraya asla girmemeli:
       kullanıcı onu kendi ölçümü sanır.
       --------------------------------------------------------------- */
    function fireGecmisCiz(buFire) {
        var kutu = $('#fireGecmis');
        if (!kutu) return;                    /* eski sayfa açıksa çökmesin */
        goster(kutu, true);

        /* Ayni suzgec: `defterFireleri` (K-102 -- tek yer). */
        var f = defterFireleri(defterOku());

        if (!f.length) {
            kutu.innerHTML = '<h3></h3><p class="yok"></p>';
            kutu.querySelector('h3').textContent = T('gecmisBaslik');
            kutu.querySelector('.yok').textContent = T('gecmisYok');
            return;
        }

        var ort = f.reduce(function (x, y) { return x + y; }, 0) / f.length;
        var enAz = Math.min.apply(null, f), enCok = Math.max.apply(null, f);
        var fark = buFire - ort;

        /* EŞİK EKRAN ÇÖZÜNÜRLÜĞÜ. Fireyi tek ondalıkla yazıyoruz;
           0,1 puandan küçük bir farkı gösteremiyoruz bile, o yüzden
           "üstünde/altında" demiyoruz. Aynı kural çekirdekteki parti
           karşılaştırmasında da var (C.EN_KUCUK_FARK_PUAN). */
        var esik = C.EN_KUCUK_FARK_PUAN;
        var notAnahtar = Math.abs(fark) < esik ? 'gecmisAyni'
                       : (fark > 0 ? 'gecmisUstunde' : 'gecmisAltinda');

        var html = '<h3>' + T('gecmisBaslik') + '</h3>' +
            '<div class="buyukcik">' + yuzde(ort, 1) + '</div>' +
            '<div class="satir-ic"><span>' +
            (f.length === 1 ? T('gecmisTek') : T('gecmisOrt', f.length)) +
            '</span></div>';
        /* Tek kayıtta "en düşük / en yüksek" göstermek yanıltır:
           ikisi de aynı sayıdır, aralık varmış gibi görünür. */
        if (f.length > 1) {
            html += '<div class="satir-ic"><span>' + T('enDusuk') +
                    '</span><b>' + yuzde(enAz, 1) + '</b></div>' +
                    '<div class="satir-ic"><span>' + T('enYuksek') +
                    '</span><b>' + yuzde(enCok, 1) + '</b></div>';
        }
        html += '<div class="kiyas-not">' +
                T(notAnahtar, sayi(Math.abs(fark), 1)) + '</div>';
        kutu.innerHTML = html;
    }

    /* ---------------------------------------------------------------
       KAVURMA MAKİNESİ — SÜS DEĞİL, GÖSTERGE

       Kullanıcı istedi (05.09.2026): "böyle çok kullanılan makineden
       bir tane 3D şekil koyalım ama ETKİLEŞİMLİ olsun."

       Etkileşimli olmasının anlamı burada şu: çizimdeki her parça
       kullanıcının GİRDİĞİ bir sayıya bağlı. Süs bir animasyon
       gürültüdür ve pil yakar; bir gösterge bilgi taşır.

         huni dolgusu     → giren yeşil (kg)
         tambur rengi     → ölçülen fire: yeşilden koyu kahveye
         soğutma tepsisi  → çıkan kavrulmuş (kg)
         buhar            → kaybolan kilo, fire arttıkça belirginleşir
         panel            → kullanıcının Defter'e yazdığı çıkış sıcaklığı;
                            YAZMADIYSA "—" (uydurulmuş bir sıcaklık YOK)

       ÖLÇEK EN BÜYÜK GİRDİYE GÖRE: iki kap da aynı orana bölünüyor,
       yoksa 10 kg giren ile 8,5 kg çıkan kap gözle aynı görünürdü ve
       fire kaybolurdu -- oysa gösterilmek istenen tam da o fark.

       Hareketin tamamı `prefers-reduced-motion` altında (stil.css);
       hareket kapalıyken de bütün bilgi duruyor, çünkü bilgi
       YÜKSEKLİKTE ve RENKTE, harekette değil.
       --------------------------------------------------------------- */
    function makineyiCiz(s) {
        var kap = $('#makineKap');
        if (!kap) return;
        goster(kap, true);

        /* Ortak ölçek: en büyük değer kabın tamamını doldurur. */
        var enBuyuk = Math.max(s.giris, s.cikis, 0.0001);
        var HUNI_Y = 26, TEPSI_Y = 17;

        var huni = $('#huniDolgu');
        if (huni) {
            var h = HUNI_Y * (s.giris / enBuyuk);
            huni.setAttribute('y', String(38 - h));
            huni.setAttribute('height', String(h));
        }
        var tepsi = $('#tepsiDolgu');
        if (tepsi) {
            var t = TEPSI_Y * (s.cikis / enBuyuk);
            tepsi.setAttribute('y', String(167 - t));
            tepsi.setAttribute('height', String(t));
        }

        /* TAMBURDAKİ ÇEKİRDEKLER kavrulma rengini taşıyor. Renk
           `cekirdekCiz` ile AYNI hesaptan geliyor -- iki ayrı formül
           olsaydı ikisi ayrışır ve aynı ekranda iki farklı "kavrulma"
           görünürdü (K-81). */
        var renk = kavrulmaRengi(s.fire);
        var g = $('#tamburCekirdek');
        if (g) {
            if (!g.childNodes.length) {
                /* Konumlar SABİT: her hesapta yeniden dağıtılsaydı
                   çekirdekler zıplar, kullanıcı bunu "değişti" sanırdı. */
                var yer = [[-11,-6],[0,-10],[11,-5],[-7,3],[5,2],[-1,9],[13,5],[-14,4]];
                yer.forEach(function (p) {
                    var e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    e.setAttribute('cx', String(130 + p[0]));
                    e.setAttribute('cy', String(86 + p[1]));
                    e.setAttribute('rx', '4'); e.setAttribute('ry', '5.5');
                    e.setAttribute('class', 'tambur-cekirdek');
                    g.appendChild(e);
                });
            }
            $$('#tamburCekirdek .tambur-cekirdek').forEach(function (e) {
                e.setAttribute('fill', renk);
            });
        }

        /* BUHAR = kaybolan kilo. Fire %25'te tam görünür; ölçek
           uydurma değil, `cekirdekCiz` ile aynı üst sınırı kullanıyor. */
        var buhar = $('#buhar');
        if (buhar) {
            buhar.setAttribute('opacity',
                String(Math.max(0, Math.min(1, s.fire / 25)).toFixed(2)));
        }

        /* PANEL: yalnız KULLANICININ yazdığı sıcaklık. Yoksa "—".
           Buraya makul bir sayı koymak, ölçülmemiş bir değeri ölçüm
           gibi göstermek olurdu -- bu takımın en pahalı hata sınıfı. */
        var isi = $('#panelIsi');
        if (isi) {
            var cikisIsi = C.sayi_oku(($('#pCikisIsi') && $('#pCikisIsi').value) || '');
            isi.textContent = cikisIsi === null ? '—' : sayi(cikisIsi, 0) + '°';
        }

        var ozet = $('#makineOzet');
        if (ozet) {
            ozet.textContent = T('makineOzet', kg(s.giris), kg(s.cikis),
                                 kg(s.giris - s.cikis));
        }
    }

    /* Fire oranından kavrulma rengi. `cekirdekCiz` ile TEK kaynak:
       ikisi ayrı hesaplasaydı aynı ekranda iki farklı renk çıkardı. */
    function kavrulmaRengi(fire) {
        var t = Math.max(0, Math.min(1, fire / 20));
        return 'rgb(' + Math.round(93 + (108 - 93) * t) + ','
                      + Math.round(120 + (60 - 120) * t) + ','
                      + Math.round(62 + (28 - 62) * t) + ')';
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
    /* ---------------------------------------------------------------
       ETİKET KENDİ BÖLGESİNE SIĞIYOR MU?

       Etiket rengi `_ustYazi()` ile kendi bölgesinin zemininden
       türetiliyor: sağ etiket YEŞİL'den, yani beyaz. Matematik doğru --
       ama etiketin gerçekten o bölgede durduğunu kimse denetlemiyordu.

       Ölçüldü (07.09.2026): %15 firede "kayıp 1,500 kg" etiketi
       842→932 px, turuncu çubuk 850'de bitiyor. İlk 8 piksel turuncunun
       üstünde ve beyaz/turuncu karşıtlığı 2,08 -- okunmuyor. Fire
       düştükçe yeşil daralıyor ve taşma büyüyor.

       Sığmıyorsa GİZLENİYOR. Bilgi kaybı yok: aynı sayılar üstteki
       metin satırında zaten yazıyor; çubuk etiketi bir tekrar. Okunmayan
       bir etiket, olmayan etiketten kötüdür.

       `visibility` kullanılıyor, `hidden` DEĞİL: `hidden` öğeyi
       yerleşimden çıkarır, genişliği 0 olur, bir sonraki ölçümde "sığdı"
       sanılıp yeniden gösterilir -- titreme döngüsü. `visibility`
       yerleşimi korur, ölçüm kararlı kalır.
       --------------------------------------------------------------- */
    function etiketSigdir() {
        var sol = $('#fireSol'), sag = $('#fireSag');
        var cub = $('#fireCubuk'), kap = document.querySelector('.cubuk-kap');
        if (!sol || !sag || !cub || !kap) return;
        var rk = kap.getBoundingClientRect(), rc = cub.getBoundingClientRect();
        /* Yerleşim yoksa karar VERMİYORUZ. Sıfır genişlikte her etiket
           "sığmıyor" görünür ve ikisi birden gizlenirdi. */
        if (rk.width < 1) return;
        var bosluk = 14;                       /* iki yandaki dolgu payı */
        var turuncuGen = rc.width;
        var yesilGen = rk.right - rc.right;
        sol.classList.toggle('dar-etiket', sol.offsetWidth + bosluk > turuncuGen);
        sag.classList.toggle('dar-etiket', sag.offsetWidth + bosluk > yesilGen);
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
            setTimeout(function () {
                etiketRengiTazele(); etiketSigdir();
            }, 600);
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
            /* Maliyet yoksa kar da yok: kutuyu ACIK BIRAKMAK, eski
               maliyete gore hesaplanmis bir kari ekranda tutardi. */
            goster($('#satisSonuc'), false); goster($('#satisUyari'), false);
            return;
        }
        var s = C.maliyet(g);
        if (!s.gecerli) {
            goster(kutu, false); goster(fark, false);
            goster($('#satisSonuc'), false); goster($('#satisUyari'), false);
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
        satisCiz(s.kgMaliyet);

        duyur(T('duyurMaliyet', para(s.kgMaliyet)));
    }

    /* ---------------------------------------------------------------
       SATIŞ ANALİZİ — "kaça satarsam ne kazanırım?"

       MALİYETİ YENİDEN HESAPLAMIYORUZ. Ekranda gösterilen `kgMaliyet`
       neyse, kâr ona göre çıkıyor. Yeniden hesaplasaydık iki taraf
       ayrışabilirdi ve kullanıcı tutarlı görünen ama yanlış bir kâr
       görürdü — merkezin bugün Muhasebe'de bulduğu hata tam buydu
       (ciro bir kümeden, maliyet başka kümeden).

       MARJ ve MARKUP AYRI AYRI yazılıyor, çünkü aynı şey değiller ve
       ikisi de "kâr yüzdesi" gibi görünür. Tek bir yüzde yazıp
       hangisi olduğunu söylememek sessiz yanlış sayıdır.
       --------------------------------------------------------------- */
    function satisCiz(kgMaliyet) {
        var kutu = $('#satisSonuc'), uyari = $('#satisUyari'), alan = $('#mSatis');
        if (!kutu || !alan) return;                /* eski sayfa açıksa çökmesin */
        if (!alan.value.trim()) {
            goster(kutu, false); goster(uyari, false);
            return;
        }
        var s = C.satis_analiz(alan.value, kgMaliyet);
        if (!s.gecerli) {
            goster(kutu, false);
            uyari.textContent = s.mesaj; goster(uyari, true);
            return;
        }
        goster(uyari, false); goster(kutu, true);

        $('#satisBuyuk').textContent = para(s.kar);
        $('#satisBuyuk').style.color = s.zarar ? 'var(--kritik)' : '';
        $('#satisAlt').textContent = T(s.zarar ? 'satisZarar' : 'satisKar');

        var d = $('#satisDetay');
        d.innerHTML = '';
        function cift(ad, deger) {
            d.insertAdjacentHTML('beforeend',
                '<div class="cift"><dt>' + ad + '</dt><dd>' + deger + '</dd></div>');
        }
        cift(T('ciftMarj'), yuzde(s.marj, 1));
        cift(T('ciftMarkup'), yuzde(s.markup, 1));
        cift(T('ciftBasabas'), para(s.basabas));

        /* ZARAR SESSIZ GECILMEZ. Hesap Araclari'nda canlida yasanan sey
           tersiydi: kullanici zarardaydi, ekran soylemiyordu. */
        if (s.zarar) {
            uyari.textContent = T('satisZararNot', para(s.basabas));
            goster(uyari, true);
        }
    }

    /* ================= HARMAN ================= */
    var bilesenSayi = 0;
    function bilesenEkle(ad, oran, fiyat) {
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
            /* FIYAT ISTEGE BAGLI. Girilirse harmanin kilo maliyeti
               cikiyor; girilmezse hicbir sey uydurulmuyor. */
            '<div><label for="bFiyat' + n + '">' + T('bFiyatEt') +
            ' <small><span class="para-birim"></span> ' + T('birimKg') + '</small></label>' +
            '<input id="bFiyat' + n + '" inputmode="decimal" value="' +
            (fiyat || '') + '" /></div>' +
            '</div>');
        $('#bAd' + n).addEventListener('change', harmanHesapla);
        $('#bOran' + n).addEventListener('input', harmanHesapla);
        $('#bFiyat' + n).addEventListener('input', harmanHesapla);
        /* Para simgesi yeni satirda da dogru olmali: mevcut dil/para
           ayarindan turetiliyor, elle yazilmiyor. */
        try { paraBirimleriniYaz(); } catch (e) {}
    }

    function harmanHesapla() {
        var liste = $$('#bilesenler [data-bilesen]').map(function (d) {
            var n = d.dataset.bilesen;
            /* Ekranda GÖRÜNEN adı taşıyoruz, kodu değil: bu ad
               hesaba girmez, yalnız sonuç listesinde yazılır. */
            var kod = $('#bAd' + n).value;
            return { ad: kod ? V.ad(V.MENSE, kod) : T('cekirdekN', n),
                     oran: $('#bOran' + n).value,
                     fiyat: ($('#bFiyat' + n) || {}).value };
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

        /* ---- BU HARMANIN KİLO MALİYETİ ----
           Bileşen fiyatlarının oranla ağırlıklandırılmış ortalaması,
           üstüne fire düzeltmesi. Elde yapılması kolay yanılınan bir
           işlem — uygulamanın var olma sebebi bu.

           TEK BİR FİYAT EKSİKSE SAYI YOK. Eksiği sıfır saymak
           ortalamayı aşağı çeker ve kullanıcı ucuz bir harman görür.
           Hangi çekirdeğin eksik olduğu yazılıyor ki tamamlanabilsin
           (K-66). */
        var mk = $('#harmanMaliyet');
        if (mk) {
            if (s.kgMaliyet !== null) {
                mk.innerHTML = '<div class="cift"><dt>' +
                    T('harmanMaliyetBaslik') + '</dt><dd><b>' +
                    para(s.kgMaliyet) + '</b></dd></div>' +
                    '<div class="cift"><dt>' + T('harmanYesilOrt') +
                    '</dt><dd>' + para(s.yesilOrtalama) + '</dd></div>';
                goster(mk, true);
            } else if (s.eksikFiyat.length) {
                mk.innerHTML = '<p class="eksik-not"></p>';
                mk.querySelector('.eksik-not').textContent =
                    T('harmanFiyatEksik', s.eksikFiyat.join(', '));
                goster(mk, true);
            } else {
                goster(mk, false);
            }
        }

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
        /* SIRALAMA MOTORDAN GELIR, burada yeniden yazilmaz.
           Aynı kural burada da yazılıydı; ikisi ayrışırsa motorun
           "Satır 3" uyarısı kullanıcının listesinde başka bir satırı
           gösterirdi. Tek kaynak: `C.tarihSiralaDizinli`. */
        var ozgunSira = C.tarihSiralaDizinli(liste);

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
    /* DEPODAN GIREN VERI DIZI OLMAK ZORUNDA.
       06.09.2026'da olculdu: `kahve-defter` anahtarina dizi olmayan bir
       deger konunca (eski surum, elle duzenleme, baska cihaz) fire
       olcumu hata firlatiyordu -- "(liste || []).filter is not a
       function" -- ve o hatadan SONRAKI adimlar hic calismiyordu.

       Ayni dosyadaki `hareketOku()` bu denetimi bastan beri yapiyordu;
       defter okuyucusunda YOKTU. Ayni uygulama, iki depo okuyucusu,
       birinde koruma var otekinde yok (K-102).

       Koruma BURADA, giris kapisinda. Her okuyucuya ayri savunma
       eklemek bir sonraki okuyucuda yine unutulur. */
    function defterOku() {
        var d = oku(DEFTER_ANAHTAR, []);
        return Object.prototype.toString.call(d) === '[object Array]' ? d : [];
    }

    /* DEFTERDEKI KULLANILABILIR FIRE DEGERLERI -- TEK YERDE.

       06.09.2026'da olculdu: deftere fire alani olmayan TEK bir kayit
       koyunca defter ozetinin tamami dusuyordu ("%—", "en dusuk %—"),
       ama Fire sekmesindeki ozet dogru calisiyordu. Ayni veri, ayni
       hesap; biri suzuyordu, oteki suzmuyordu (K-102).

       Suzgeci ikinci kez YAZMIYORUZ. K-102'nin dersi "korumayi her
       yere kopyala" degil, "koruma tek yerde olsun, herkes onu
       cagirsin" -- kopyalanan koruma bir sonraki degisiklikte yine
       ayrisir.

       Bozuk kayit nasil olusur: eski surum, elle duzenlenmis
       localStorage, yarim kalmis yazma, baska cihazdan gelen veri.
       Yazma tarafinin dogrulamasi OKUMA tarafini korumaz. */
    function defterFireleri(liste) {
        var l = (liste && liste.length) ? liste : [];
        return l.filter(function (p) {
            return p && typeof p.fire === 'number' && isFinite(p.fire);
        }).map(function (p) { return p.fire; });
    }

    /* KAC KAYIT HESABA KATILMADI?
       Bozuk kaydi sessizce atmak, kirpmak kadar olmasa da bir yalanin
       yumusak hali: kullanici dort parti kaydettigini bilir, ekran uc
       gosterir ve sebebini soylemez. Sayiyi soruyoruz ki soylenebilsin
       (K-89 / K-94). */
    function defterDusen(liste) {
        var l = (liste && liste.length) ? liste : [];
        return l.length - defterFireleri(l).length;
    }

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
        var f = defterFireleri(liste);
        var dusen = defterDusen(liste);
        /* SAYI, OZETLENEN KAYIT SAYISIDIR -- listenin uzunlugu degil.
           Eskiden "4 partide ortalama fireniz" yazip yanina "%—"
           koyuyordu: gosteremedigi bir sayi icin dort parti iddia
           ediyordu. Bozuk kayit varsa sayilar da, sayi da kuculuyor. */
        if (!f.length) {
            /* `partiYok` cevirisi HTML iceriyor (<br>, <strong>).
               Ilk yazimda `textContent` kullandim ve etiketler
               EKRANDA DUZ METIN olarak gorundu. Ust taraftaki es
               dal zaten innerHTML kullaniyor; ikisi ayni
               gorunmeli -- yoksa ayni durum iki turlu cikar. */
            ozet.innerHTML = '';
            kap.innerHTML = '<p class="bos-defter">' + T('partiYok') + '</p>';
            return;
        }
        var ort = f.reduce(function (a, b) { return a + b; }, 0) / f.length;
        var enAz = Math.min.apply(null, f), enCok = Math.max.apply(null, f);
        ozet.innerHTML =
            '<div class="sonuc"><div class="buyuk">' + yuzde(ort, 1) + '</div>' +
            '<div class="alt">' + T('ortalamaFire', f.length) + '</div>' +
            '<dl><div class="cift"><dt>' + T('enDusuk') + '</dt><dd>' +
            yuzde(enAz, 1) + '</dd></div>' +
            '<div class="cift"><dt>' + T('enYuksek') + '</dt><dd>' +
            yuzde(enCok, 1) + '</dd></div>' +
            '<div class="cift"><dt>' + T('oynama') + '</dt><dd>' +
            T('puan', sayi(enCok - enAz, 1)) + '</dd></div></dl>' +
            (dusen ? '<p class="dusen-not">' +
                (dusen === 1 ? T('kayitAtlandiTek') : T('kayitAtlandi', dusen)) +
                '</p>' : '') +
            '</div>';

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
            /* Tur de KOD tutulur, ekranda cevirisi cikar; eski
               kayitlarda bu alan yok, o zaman hic yazilmaz. */
            if (p.tur) ayrinti.push(V.ad(V.TUR, V.kodla(V.TUR, p.tur)));
            if (p.dtr !== undefined) ayrinti.push(T('gelisimKisa', sayi(p.dtr, 1)));
            if (p.not) ayrinti.push(p.not);

            /* BU PARTI ONCEKILERE GORE NASIL?
               KIYAS YALNIZ GECMISE BAKAR. Liste yeniden eskiye
               siralidir; `slice(i + 1)` bu partiden ONCE kaydedilenler
               demektir. Butun defteri verseydik eski bir karti, ondan
               SONRA gelen partilerle kiyaslamis olurduk -- o gun
               bilinmeyen bir sayiyla. Ekranda dogru gorunur, anlami
               yanlis olurdu (K-22).
               Olcut kullanicinin KENDI ortalamasi; "ideal fire" diye
               bir sayi yazmiyoruz. */
            var kiyas = C.parti_karsilastir(p, liste.slice(i + 1));
            var kiyasSatir = '';
            if (kiyas.yeterli) {
                var anahtar = kiyas.olagandisi
                    ? (kiyas.yon === 'yuksek' ? 'kiyasYuksek' : 'kiyasDusuk')
                    : 'kiyasOlagan';
                var parcalar = [T(anahtar, kiyas.sayi, yuzde(kiyas.fireOrt, 1)),
                                T('kiyasAralik', yuzde(kiyas.fireEnDusuk, 1),
                                  yuzde(kiyas.fireEnYuksek, 1))];
                /* DTR ortalamasi YALNIZ onu giren partilerden gelir;
                   kac partiden geldigi de yaziliyor -- yoksa kullanici
                   butun defterin ortalamasi sanir. */
                if (kiyas.dtrOrt !== null) {
                    parcalar.push(kiyas.dtrSayisi === 1
                        ? T('kiyasDtrTek', yuzde(kiyas.dtrOrt, 1))
                        : T('kiyasDtr', yuzde(kiyas.dtrOrt, 1), kiyas.dtrSayisi));
                }
                kiyasSatir = '<span class="kiyas' +
                    (kiyas.olagandisi ? ' dikkat' : '') + '">' +
                    parcalar.join(' · ') + '</span>';
            } else if (i === 0) {
                /* YALNIZ EN YENI KARTTA sebebini soyluyoruz. Bos birakmak
                   "uygulama bozuk" izlenimi verir; her karta yazmak
                   defteri gurultuye bogar. */
                if (kiyas.sebep === 'kunye_eksik') {
                    kiyasSatir = '<span class="kiyas soluk">' + T('kiyasKunye') + '</span>';
                } else if (kiyas.sebep === 'az_kayit') {
                    kiyasSatir = '<span class="kiyas soluk">' +
                        T('kiyasAz', kiyas.bulunan) + '</span>';
                }
            }

            b.innerHTML = '<span class="ad">' + tarih +
                (menseAd ? ' · ' + menseAd : '') + '</span>' +
                '<span class="fire">' + yuzde(p.fire, 1) + '</span>' +
                '<span class="detay">' + ayrinti.join(' · ') + '</span>' +
                kiyasSatir;
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
        secenekDoldur('#pTur', V.TUR);
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
        [['mense', '#pMense'], ['isleme', '#pIsleme'], ['tur', '#pTur'],
         ['varyete', '#pVaryete'], ['derece', '#pDerece'],
         ['not', '#pNot']].forEach(function (p) {
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
        ['#pMense','#pIsleme','#pTur','#pVaryete','#pDerece','#pToplam','#pCatlak',
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
        /* 3D makine sekmesinin ÜRETİLEN metinleri de dile bağlı:
           alttaki not ve parça açıklamaları. Buraya eklenmeseydi
           düğmeler Türkçeye döner, not İngilizce kalırdı -- ekranda
           yarım çeviri. Ölçerek görüldü (06.09.2026). */
        try { makine3dTazele(); } catch (e) {}
        try { parcaListesiCiz(); } catch (e) {}
        try {
            cevirHesapla($('#hHedef').value.trim() ? 'hedef' : 'yesil');
        } catch (e) {}
        /* Harman bileşen satırlarındaki etiketler ve menşe listesi de
           dile bağlı; onları da tazeliyoruz. */
        try {
            /* FIYAT DA TASINIR. Bu satira eklemeyi unutunca, dil
               degistiren kullanicinin girdigi butun fiyatlar sessizce
               siliniyordu -- uygulama cokmuyor, veri kayboluyordu.
               Yeni bir alan eklerken alanin GECTIGI HER YOL guncellenmeli:
               yazilma, okunma, temizlenme, YENIDEN CIZILME. */
            var eski = $$('#bilesenler [data-bilesen]').map(function (o) {
                var n = o.dataset.bilesen;
                return { kod: $('#bAd' + n).value, oran: $('#bOran' + n).value,
                         fiyat: ($('#bFiyat' + n) || {}).value };
            });
            $('#bilesenler').innerHTML = '';
            bilesenSayi = 0;
            eski.forEach(function (b) { bilesenEkle(b.kod, b.oran, b.fiyat); });
            harmanHesapla();
        } catch (e) {}
    }

    /* ================= 3D MAKİNE =================
       Kullanıcı istedi: "oynanır falan, ayrı bir sekmede 3D."

       GERÇEK 3D, KİTAPLIKSIZ. Katmanlar `translateZ` ile farklı
       derinliklerde; kap `preserve-3d` ile döndürülüyor. Sürüklerken
       katmanlar birbirine göre kayıyor -- derinlik buradan geliyor,
       resim numarasından değil.

       TAMBUR GERÇEK SİLİNDİR: 16 yüzey halka üzerinde diziliyor, her
       biri kendi açısına döndürülüp yarıçap kadar öne itiliyor.
       Döndürünce arkası da görünüyor.

       RENK ÖLÇÜLEN KAVRULMADAN GELİYOR. Hiç fire ölçülmediyse nötr
       yeşil duruyor -- uydurulmuş bir kavrulma göstermiyoruz. Bu
       takımın en pahalı hata sınıfı, ekranda ölçülmemiş bir değeri
       ölçüm gibi göstermektir. */

    /* ================= KAVURMA MAKİNESİ =================
       06.09.2026'da yeniden yazıldı. Öncesinde makine CSS kutularından
       kurulmuş bir 3B silindirdi; kullanıcı bir bakışta "hiç anlaşılmıyor,
       gerçek fotoğrafların aynısını yapmalıyız" dedi. Haklıydı: kutu
       yığarak kavurma makinesi çıkmıyor. Şimdi makine çizim, parçalar
       gerçek yerlerinde ve kendi menteşelerinden dönüyor.

       VE ETKİLEŞİM DOĞRUDAN PARÇANIN ÜZERİNDE (kullanıcı: "direk
       etkileşimli olmalı"). Sahne altına düğme dizmek gerçek makineye
       benzemiyor — kolu tutup çekiyorsun. Klavye karşılığı Enter/Boşluk,
       yani klavye kullanan da dışarıda kalmıyor. */

    /* SAYILAR UYDURULMAZ. Makinenin gösterdiği her kilo, kullanıcının Fire
       sekmesine KENDİ girdiği sayıdır. Ölçüm yoksa makine çalışır ama
       "henüz ölçmedin" der; sahte bir 10 kg göstermez. */
    function makVeri() {
        var g = null, c = null, f = null;
        if (sonFire) {
            if (isFinite(sonFire.fire))  f = sonFire.fire;
            if (isFinite(sonFire.giris)) g = sonFire.giris;
            if (isFinite(sonFire.cikis)) c = sonFire.cikis;
        }
        if (g === null) g = C.sayi_oku(($('#fGiris') && $('#fGiris').value) || '');
        if (c === null) c = C.sayi_oku(($('#fCikis') && $('#fCikis').value) || '');
        return { g: g, c: c, f: f };
    }
    function makKg(x) { return x === null ? null : sayi(x, 1) + ' kg'; }

    function makDurum(anahtar, a1, a2) {
        var n = $('#makine3dNot');
        if (n) n.textContent = a2 === undefined ? (a1 === undefined ? T(anahtar) : T(anahtar, a1))
                                                : T(anahtar, a1, a2);
    }

    /* KAPSAM KANCASI. `ucBoyutKavrulma` `makine3dKur` ICINDE tanimli;
       `makine3dTazele` disaridan onu goremez. Bu depoda ayni kapsam
       hatasi ucuncu kez yapildi (once _c, sonra renkleriTazele) --
       bu sefer modul duzeyinde bir kanca ile baglaniyor. */
    var _ucKavrulmaKanca = null;

    function makine3dKur() {
        var mak = $('#makine');
        if (!mak) return;

        function sarjEt() {
            if (mak.classList.contains('sarjli')) return;
            var v = makVeri();
            mak.classList.add('sarjli'); noktalariTazele(); ucBoyutEylem('hazne');
            makDurum(v.g === null ? 'makDurDokulOlcumsuz' : 'makDurDokuluyor', makKg(v.g));
            setTimeout(function () {
                if (!mak.classList.contains('sarjli')) return;
                makDurum('makDurSarjTamam');
            }, 1000);
        }

        function kasikCek() {
            if (!mak.classList.contains('sarjli')) { makDurum('makDurOnceSarj'); return; }
            var acik = mak.classList.toggle('kasikta'); noktalariTazele(); ucBoyutEylem('kasik');
            if (!acik) { makDurum('makDurKasikGirdi'); return; }
            var v = makVeri();
            if (v.f === null) { makDurum('makDurKasikOlcumsuz'); return; }
            kok().style.setProperty('--tambur-renk', kavrulmaRengi(v.f));
            makDurum('makDurKasik', yuzde(v.f, 1));
        }

        function bosalt() {
            if (!mak.classList.contains('sarjli')) { makDurum('makDurOnceSarj'); return; }
            if (mak.classList.contains('bosaldi')) return;
            mak.classList.add('bosaldi');
            mak.classList.remove('kasikta');
            noktalariTazele(); ucBoyutEylem('bosalt');
            makDurum('makDurBosaliyor');
            setTimeout(function () {
                if (!mak.classList.contains('bosaldi')) return;
                var v = makVeri();
                if (v.c === null || v.g === null || v.f === null) { makDurum('makDurBosaldiOlcumsuz'); return; }
                /* Siklondaki kabuk = giren eksi çıkan. Aynı fark Fire
                   sekmesinde de yazıyor; iki yerde iki farklı sayı çıkmasın
                   diye ikisi de aynı iki alandan hesaplanıyor (K-81). */
                makDurum('makDurBosaldi', makKg(v.c), makKg(v.g - v.c));
            }, 1100);
        }


        /* ---------- 3B MAKİNE ----------
           Kullanıcı: "animasyon olayına çevir aynısını, 3d şekilde,
           yapılır be." Daha önce "kitaplık olmaz" denmişti; o gerekçe
           yanlıştı — yüklenemeyen şey CDN'di, dosyayı depoya koyunca
           çevrimdışı da çalışıyor.

           594 KB'lık kitaplık SEKME AÇILINCA yükleniyor, uygulama
           açılışında değil. Açılışı yavaşlatmasını istemiyoruz. */
        var uc = { denendi: false, kap: null };

        /* DAMGA SAYFANIN KENDI BETIKLERINDEN OKUNUR.
           `makine3d.js`, `three.min.js` ve `gltf-okuyucu.js` duz adla
           isteniyordu, yani `?v=NN` damgasi YOKTU. index.html'deki
           butun betikler damgali; bu ucu degildi.

           Olculdu (07.09.2026): dosyaya yeni bir disa acim ekledim,
           diskte vardi, tarayici yine ESKI surumu calistirdi.
           `caches` temizlendi, servis calisani kaldirildi, sayfa
           zorla yenilendi -- yine eskisi geldi. HTTP onbellegini
           kiran tek sey damgadir.

           Urundeki anlami daha agir: elinde eski `makine3d.js` olan
           kullanici, yeni index.html'i indirse bile ESKI makineyi
           gorur ve bunu anlamasinin yolu yoktur.

           Sayi ELLE YAZILMIYOR; sayfanin kendi betik etiketinden
           turuyor. Ikinci bir yere yazsaydik biri guncellenip oteki
           unutuldugunda yine ayrisirdi (K-69). */
        function ucBoyutDamga() {
            var b = document.querySelector('script[src*="cekirdek.js"]');
            var m = b && b.getAttribute('src').match(/[?&]v=([^&]+)/);
            return m ? ('?v=' + m[1]) : '';
        }

        function ucBoyutDosyaYukle(yol) {
            return new Promise(function (tamam, hata) {
                var s = document.createElement('script');
                s.src = yol + ucBoyutDamga(); s.async = true;
                s.onload = tamam;
                s.onerror = function () { hata(new Error(yol)); };
                document.head.appendChild(s);
            });
        }

        function ucBoyutAc() {
            if (uc.denendi) {
                if (window.Makine3D && Makine3D.hazirMi()) Makine3D.ac();
                return;
            }
            uc.denendi = true;

            /* Hareket azaltma seçilmişse 3B hiç başlamıyor; fotoğraf kalıyor.
               WebGL yoksa da aynısı. Ne olursa olsun boş çerçeve görünmüyor. */
            var azHareket = window.matchMedia &&
                matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (azHareket) return;

            uc.kap = $('#mak3dKap');
            if (!uc.kap) return;

            /* 3B YALNIZ GERCEK MODEL VARSA ACILIR.
               Elle yazilmis model kullanicinin referanslarina
               benzemedi ve ekrandan kaldirildi (kullanici: "once
               modeli kaldir, direkt yanlis model"). Makine artik
               GERCEK FOTOGRAF; 3B ancak klasore dogru lisansli bir
               makine.glb konunca devreye giriyor.
               Boylece yanlis bir model bir daha gorunmuyor. */
            /* 3B yeniden acik: model hedefe gore duzeltildi.
               makine.glb konulursa yine o devraliyor. */
            ucBoyutBaslat(bekleGoster());
            return;
        }

        function bekleGoster() {

            var bekle = document.createElement('div');
            bekle.className = 'mak-yukleniyor';
            bekle.textContent = T('makine3dYukleniyor');
            uc.kap.parentNode.appendChild(bekle);
            return bekle;
        }

        function ucBoyutBaslat(bekle) {
            ucBoyutDosyaYukle('three.min.js')
                .then(function () { return ucBoyutDosyaYukle('gltf-okuyucu.js'); })
                .then(function () { return ucBoyutDosyaYukle('makine3d.js'); })
                .then(function () {
                    if (!window.THREE || !window.Makine3D || !Makine3D.destekleniyorMu()) {
                        throw new Error('webgl yok');
                    }
                    if (!Makine3D.kur(uc.kap, window.THREE, ucBoyutTiklandi)) {
                        throw new Error('kurulamadi');
                    }
                    uc.kap.hidden = false;
                    var sahne = uc.kap.parentNode;
                    if (sahne) sahne.classList.add('uc-boyut');
                    var km = $('#makKumanda'); if (km) km.hidden = false;
                    Makine3D.ac();
                    ucBoyutKavrulma();
                    bekle.remove();
                })
                .catch(function () {
                    /* Sessizce fotoğrafta kalınıyor — ama kullanıcı neden
                       olduğunu bilsin diye tek satır yazılıyor. */
                    bekle.textContent = T('makine3dOlmadi');
                    setTimeout(function () { bekle.remove(); }, 4000);
                });
        }

        function ucBoyutTiklandi(ad) {
            if (ad === 'hazne') sarjEt();
            else if (ad === 'kasik') kasikCek();
            else if (ad === 'bosalt') bosalt();
            else if (ad === 'tepsi') tepsiBilgi();
        }

        function ucBoyutKavrulma() {
            if (!window.Makine3D || !Makine3D.hazirMi()) return;
            var v = makVeri();
            Makine3D.kavrulmaVer(v.f === null ? null : v.f);
        }

        function ucBoyutEylem(ad) {
            if (window.Makine3D && Makine3D.hazirMi()) Makine3D.eylem(ad);
        }

        function kok() { return document.documentElement; }

        /* Soğutma teknesine dokunmak bir EYLEM değil, bir SORU: "burada ne
           var?" Cevap ölçülen sayılardan gelir; ölçüm yoksa söylenmez. */
        function tepsiBilgi() {
            var v = makVeri();
            if (!mak.classList.contains('bosaldi')) { makDurum('makDurTepsiBos'); return; }
            if (v.c === null || v.g === null) { makDurum('makDurBosaldiOlcumsuz'); return; }
            makDurum('makDurBosaldi', makKg(v.c), makKg(v.g - v.c));
        }

        function bastan() {
            mak.classList.remove('sarjli', 'kasikta', 'bosaldi');
            ucBoyutEylem('bastan');
            
            makine3dTazele();
            noktalariTazele();
        }

        /* Hangi parçanın şu an "açık" olduğu fotoğraf üzerinde de
           görünsün; yoksa kullanıcı neyi yaptığını yalnız yazıdan anlar. */
        function noktalariTazele() {
            var s = mak.classList;
            var d = {
                nHazne:  s.contains('sarjli'),  b3Hazne:  s.contains('sarjli'),
                nKasik:  s.contains('kasikta'), b3Kasik:  s.contains('kasikta'),
                nBosalt: s.contains('bosaldi'), b3Bosalt: s.contains('bosaldi'),
                nTepsi:  s.contains('bosaldi'), b3Tepsi:  s.contains('bosaldi')
            };
            Object.keys(d).forEach(function (k) {
                var o = document.getElementById(k);
                if (o) o.classList.toggle('acik', d[k]);
            });
        }

        /* Doğrudan tutma. Eşik yalnız boşaltmada var: boşaltma geri
           alınamaz bir eylem, kazayla olmasın diye 40px aşağı çekmek gerekiyor.
           Diğerlerinde dokunmak yetiyor. */
        function kolKur(kimlik, is, esik) {
            var g = document.getElementById(kimlik);
            if (!g) return;
            var bas = null;
            g.addEventListener('pointerdown', function (e) {
                bas = { x: e.clientX, y: e.clientY };
                try { g.setPointerCapture(e.pointerId); } catch (x) {}
                e.preventDefault();
            });
            g.addEventListener('pointermove', function (e) {
                if (!bas || !esik) return;
                if (e.clientY - bas.y >= esik) { bas = null; kilitli(); }
            });
            g.addEventListener('pointerup', function (e) {
                if (!bas) return;
                var dy = Math.abs(e.clientY - bas.y), dx = Math.abs(e.clientX - bas.x);
                bas = null;
                if (dy < 6 && dx < 6) kilitli();
                else if (!esik) kilitli();
            });
            ['pointercancel', 'lostpointercapture'].forEach(function (o) {
                g.addEventListener(o, function () { bas = null; });
            });
            g.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kilitli(); }
            });
            /* EKRAN OKUYUCU YOLU. Yardimci teknolojiler pointer olayi
               uretmeden dogrudan `click` gonderir; yalniz pointer
               dinlemek o kullaniciyi tamamen disarida birakiyordu.
               `sonAn` kilidi, pointerup + click ikilisinde islemin iki
               kez kosmasini engelliyor. */
            var sonAn = 0;
            function kilitli() {
                var t = Date.now();
                if (t - sonAn < 350) return;
                sonAn = t; is();
            }
            g.addEventListener('click', function (e) { e.preventDefault(); kilitli(); });
        }

        kolKur('nHazne',  sarjEt,   0);
        kolKur('nKasik',  kasikCek, 0);
        kolKur('nBosalt', bosalt,  40);
        kolKur('nTepsi',  tepsiBilgi, 0);
        kolKur('b3Hazne',  sarjEt,     0);
        kolKur('b3Kasik',  kasikCek,   0);
        kolKur('b3Bosalt', bosalt,     0);
        kolKur('b3Tepsi',  tepsiBilgi, 0);

        /* Sekme açılınca 3B başlar; kapanınca durur.
           Durmayan bir çizim döngüsü cepteki telefonda pil yakar ve
           kimse görmez. */
        var sekmeDgm = $('#tMakine');
        if (sekmeDgm) sekmeDgm.addEventListener('click', function () { setTimeout(ucBoyutAc, 60); });
        document.addEventListener('visibilitychange', function () {
            if (!window.Makine3D || !Makine3D.hazirMi()) return;
            if (document.hidden) Makine3D.kapa();
            else if (!$('#sMakine').hidden) Makine3D.ac();
        });

        var sfr = $('#sifirlaBtn');
        if (sfr) sfr.addEventListener('click', bastan);

        _ucKavrulmaKanca = ucBoyutKavrulma;
        makine3dTazele();
        parcaListesiCiz();
    }

    /* Fire sekmesinde ölçülen kavrulma buraya taşınıyor. Ölçüm yoksa
       DOKUNMUYORUZ: nötr yeşil kalıyor ve not öyle söylüyor. */
    function makine3dTazele() {
        var v = makVeri();
        /* KAVRULMA RENGİ ÖLÇÜMDEN GELİR, YOKSA HİÇ ÇİZİLMEZ.
           `--tambur-renk` tanımsız kalırsa fotoğrafın üzerindeki leke
           saydam kalıyor; uydurulmuş bir kavrulma göstermiyoruz. */
        var kok = document.documentElement;
        if (v.f === null) {
            kok.style.removeProperty('--tambur-renk');
            makDurum('makDurOlcumYok');
        } else {
            kok.style.setProperty('--tambur-renk', kavrulmaRengi(v.f));
            makDurum('makDurHazir', yuzde(v.f, 1));
        }
        if (_ucKavrulmaKanca) _ucKavrulmaKanca();
    }

    /* Parça listesi: hangi sayının nereye gittiğini anlatır.
       Kullanıcı "daha kolay bir anlatımla işlevi gerçekleştirebilme"
       istedi -- makinenin parçalarını uygulamanın alanlarına
       bağlamak, metinle anlatmaktan daha çabuk öğretiyor. */
    function parcaListesiCiz() {
        var d = $('#parcaListe');
        if (!d) return;
        d.innerHTML = '';
        [['parcaHuni', 'parcaHuniAcik'],
         ['parcaTambur', 'parcaTamburAcik'],
         ['parcaTepsi', 'parcaTepsiAcik'],
         ['parcaPanel', 'parcaPanelAcik'],
         ['parcaKavuz', 'parcaKavuzAcik']].forEach(function (p) {
            var s = document.createElement('div');
            s.className = 'cift';
            var dt = document.createElement('dt'); dt.textContent = T(p[0]);
            var dd = document.createElement('dd'); dd.textContent = T(p[1]);
            s.appendChild(dt); s.appendChild(dd);
            d.appendChild(s);
        });
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

        /* '#mSatis' de burada: yazarken kar aninda guncellensin.
           Listeye eklemeyi unutmak, alani ekleyip CALISMAMASI demekti. */
        ['#mFiyat','#mFire','#mParti','#mEnerji','#mIscilik','#mPaket','#mAmbalaj',
         '#mFincan','#mSatis']
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
        makine3dKur();

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
