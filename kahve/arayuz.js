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

    /* ---- Türkçe biçimlendirme ----
       Dil BELİRTİLİR. Belirtilmezse tarayıcının diline göre değişir ve
       aynı uygulama iki telefonda farklı sayı gösterir. */
    function sayi(d, basamak) {
        if (d === null || d === undefined || !isFinite(d)) return '—';
        return d.toLocaleString('tr-TR', {
            minimumFractionDigits: basamak === undefined ? 2 : basamak,
            maximumFractionDigits: basamak === undefined ? 2 : basamak
        });
    }
    function para(d) { return sayi(d) + ' ₺'; }
    function kg(d) { return sayi(d, 3) + ' kg'; }

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

        $('#fireBuyuk').textContent = '%' + sayi(s.fire, 1);
        $('#fireAlt').textContent =
            kg(s.giris) + ' girdi, ' + kg(s.cikis) + ' çıktı — ' +
            kg(s.giris - s.cikis) + ' kayıp.';

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
        $('#fireSol').textContent = 'kavrulmuş ' + kg(s.cikis);
        $('#fireSag').textContent = 'kayıp ' + kg(s.giris - s.cikis);
        cekirdekCiz(s.fire);

        duyur('Fire yüzde ' + sayi(s.fire, 1) + '. ' +
              kg(s.cikis) + ' kavrulmuş kahve çıkar.');
    }

    /* Çekirdek görseli: fire arttıkça koyulaşır ve küçülür. */
    function cekirdekCiz(fire) {
        var kap = $('#fireCekirdek');
        if (!kap) return;
        if (!kap.children.length) {
            for (var i = 0; i < 5; i++) {
                kap.insertAdjacentHTML('beforeend',
                    '<svg class="cekirdek" viewBox="0 0 40 40">' +
                    '<ellipse class="govde" cx="20" cy="20" rx="12" ry="17" fill="#6f8f4a"/>' +
                    '<path d="M20 5 Q16 20 20 35" stroke="rgba(0,0,0,.35)" ' +
                    'stroke-width="2" fill="none"/></svg>');
            }
        }
        /* %0 fire -> yeşil, %25 fire -> koyu kahve. Ara değerler karışım. */
        var t = Math.max(0, Math.min(1, fire / 20));
        var r = Math.round(111 + (108 - 111) * t);
        var g = Math.round(143 + (60 - 143) * t);
        var b = Math.round(74 + (28 - 74) * t);
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
                alt = 'kavrulmuş çıkar — ' + kg(s.kayip) + ' kayıp';
            }
        } else if (kaynak === 'hedef' && $('#hHedef').value.trim()) {
            s = C.yesil_gereken($('#hHedef').value, fire);
            if (s.gecerli) {
                metin = kg(s.sonuc);
                alt = 'yeşil kahve koymalısınız';
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
        cift('yeşil kahve payı', para(s.yesilPayi));
        if (s.giderPayi > 0) cift('enerji + işçilik payı', para(s.giderPayi));
        if (s.paketMaliyet !== undefined) cift('paket maliyeti', para(s.paketMaliyet));
        if (s.fincanMaliyet !== undefined) cift('fincan maliyeti', para(s.fincanMaliyet));

        /* UYGULAMANIN VAR OLMA SEBEBİ: farkı GÖSTER. */
        fark.innerHTML = 'Yeşil kahveye <strong>' + para(s.firesizSanilan) +
            '</strong> veriyorsunuz, ama kavrulmuşun kilosu size <strong>' +
            para(s.yesilPayi) + '</strong>. Aradaki <strong>' + para(s.fireFarki) +
            '</strong> fire yüzünden. Bu farkı hesaba katmayan zararına satar.';
        goster(fark, true);

        if (s.eksik.length) {
            uyari.textContent = 'Şunlar girilmedi, hesaba KATILMADI (sıfır sayılmadı): ' +
                s.eksik.join(', ') + '.';
            goster(uyari, true);
        }
        duyur('Kilo maliyeti ' + para(s.kgMaliyet));
    }

    /* ================= HARMAN ================= */
    var bilesenSayi = 0;
    function bilesenEkle(ad, oran) {
        bilesenSayi++;
        var n = bilesenSayi;
        var mense = V.MENSE_SIRALI.map(function (m) {
            return '<option' + (m === ad ? ' selected' : '') + '>' + m + '</option>';
        }).join('');
        $('#bilesenler').insertAdjacentHTML('beforeend',
            '<div class="satir ikili" data-bilesen="' + n + '">' +
            '<div><label for="bAd' + n + '">Çekirdek</label>' +
            '<select id="bAd' + n + '"><option value="">— seçin —</option>' + mense + '</select></div>' +
            '<div><label for="bOran' + n + '">Oran <small>%</small></label>' +
            '<input id="bOran' + n + '" inputmode="decimal" value="' + (oran || '') + '" /></div>' +
            '</div>');
        $('#bAd' + n).addEventListener('change', harmanHesapla);
        $('#bOran' + n).addEventListener('input', harmanHesapla);
    }

    function harmanHesapla() {
        var liste = $$('#bilesenler [data-bilesen]').map(function (d) {
            var n = d.dataset.bilesen;
            return { ad: $('#bAd' + n).value || 'Çekirdek ' + n, oran: $('#bOran' + n).value };
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
                '<div class="cift"><dt>' + b.ad + ' (%' + sayi(b.oran, 0) + ')</dt>' +
                '<dd>' + kg(b.yesilKg) + '</dd></div>');
        });
        duyur('Toplam ' + kg(s.toplamYesil) + ' yeşil kahve gerekiyor.');
    }


    /* ================= ENVANTER =================
       Hesap YOK burada. Depoların son hâlini `C.stok_hesap` veriyor;
       buranın işi göstermek ve yeni hareketi ona sormak.

       Bir hareket eklenirken tek doğrulama yolu var: yeni hareketi
       listenin sonuna koyup HEPSİNİ yeniden hesaplatmak. Böylece ekran
       kendi başına "bu geçerli galiba" demiyor -- kural tek yerde. */

    var TUR_ADI = {
        alim: 'Alım', kavurma: 'Kavurma', satis: 'Satış', zayi: 'Zayi'
    };

    function hareketOku() {
        var h = oku(ENVANTER_ANAHTAR, []);
        return Object.prototype.toString.call(h) === '[object Array]' ? h : [];
    }

    /* Kilo fiyatı bilinmiyorsa "0,00 ₺" YAZMIYORUZ -- sıfır da bir
       yalandır. Boş depo "bilinmiyor" der. */
    function paraVarsa(d) { return d === null ? 'bilinmiyor' : para(d); }

    function turAlanlari() {
        var t = $('#nTur').value;
        goster($('#nFiyatKap'), t === 'alim');
        goster($('#nFireKap'), t === 'kavurma');
        goster($('#nCikisKap'), t === 'kavurma');
        goster($('#nNeredeKap'), t === 'satis' || t === 'zayi');
        $('#nKgEtiket').innerHTML = t === 'kavurma'
            ? 'Kavurmaya giren <small>kg yeşil</small>'
            : 'Ağırlık <small>kg</small>';
    }

    function hareketTopla() {
        var t = $('#nTur').value;
        var h = { tur: t, cesit: $('#nCesit').value, kg: $('#nKg').value };
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
            duyur('Hareket işlenmedi: ' + m);
            return;
        }
        goster(uyari, false);

        if (!yaz(ENVANTER_ANAHTAR, liste)) {
            uyari.textContent = 'Kaydedilemedi — tarayıcı site verilerini ' +
                'engelliyor olabilir. Hesap ekranda duruyor ama ' +
                'KAYDEDİLMEDİ; kapatırsanız kaybolur.';
            goster(uyari, true);
            return;
        }
        ['#nKg', '#nFiyat', '#nFire', '#nCikis'].forEach(function (x) {
            $(x).value = '';
        });
        $('#hareketFormKap').open = false;
        envanterCiz();
        duyur('Hareket işlendi.');
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
            uyari.textContent = 'Kayıtlı hareketler hesaplanamadı: ' + s.mesaj;
            goster(uyari, true);
            hareketListesiCiz(liste);
            return;
        }
        goster(uyari, false);

        if (s.bos) {
            goster(kutu, false);
            depo.innerHTML = '<div class="bos-defter">Depo boş. ' +
                'İlk hareketi ekleyin — yeşil kahve alımı iyi bir başlangıç.</div>';
            hareketListesiCiz(liste);
            return;
        }

        goster(kutu, true);
        $('#envanterBuyuk').textContent = kg(s.toplam.kavrulmusKg) + ' kavrulmuş';
        $('#envanterAlt').textContent =
            kg(s.toplam.yesilKg) + ' yeşil bekliyor · depodaki para ' +
            paraVarsa(s.toplam.yesilDeger + s.toplam.kavrulmusDeger === 0 &&
                      s.toplam.yesilKg + s.toplam.kavrulmusKg === 0
                      ? null : s.toplam.yesilDeger + s.toplam.kavrulmusDeger);

        depo.innerHTML = '';
        s.sira.forEach(function (ad) {
            var d = s.cesitler[ad];
            var fireNot = '';
            if (d.fireSayisi === 1) {
                fireNot = 'Kavrulmuş stok %' + sayi(d.fireEnDusuk, 1) +
                          ' fireyle hesaplandı.';
            } else if (d.fireSayisi > 1) {
                fireNot = d.fireSayisi + ' kavurma · fire %' +
                    sayi(d.fireEnDusuk, 1) + ' – %' + sayi(d.fireEnYuksek, 1) +
                    ' arasında. Ortalama fire yazmıyoruz; partiler ' +
                    'farklı ağırlıkta.';
            }
            var p = document.createElement('div');
            p.className = 'depo';
            p.innerHTML =
                '<div class="ad"></div>' +
                '<div class="ikili-depo">' +
                  '<div class="kutu"><span class="etiket">yeşil</span>' +
                    '<span class="miktar">' + kg(d.yesilKg) + '</span>' +
                    '<span class="fiyat">kilosu ' + paraVarsa(d.yesilKgFiyat) +
                  '</span></div>' +
                  '<div class="kutu"><span class="etiket">kavrulmuş</span>' +
                    '<span class="miktar">' + kg(d.kavrulmusKg) + '</span>' +
                    '<span class="fiyat">kilosu ' +
                    paraVarsa(d.kavrulmusKgFiyat) +
                  '</span></div>' +
                '</div>' +
                (fireNot ? '<div class="fire-not"></div>' : '');
            /* Çeşit adı ve fire notu METİN olarak konuyor: kullanıcının
               yazdığı ad HTML'e karışmasın. */
            p.querySelector('.ad').textContent = ad;
            if (fireNot) p.querySelector('.fire-not').textContent = fireNot;
            depo.appendChild(p);
        });

        hareketListesiCiz(liste);
    }

    function hareketListesiCiz(liste) {
        var k = $('#hareketListe');
        k.innerHTML = '';
        if (!liste.length) {
            k.innerHTML = '<div class="bos-defter">Henüz hareket yok.</div>';
            return;
        }
        liste.forEach(function (h, i) {
            var d = document.createElement('div');
            d.className = 'hareket';
            var detay = '';
            if (h.tur === 'alim') {
                detay = 'kilosu ' + h.kgFiyat + ' ₺';
            } else if (h.tur === 'kavurma') {
                detay = String(h.cikisKg || '').trim()
                    ? 'çıkan ' + h.cikisKg + ' kg (fire ölçüldü)'
                    : 'fire %' + h.fire;
            } else {
                detay = (h.nerede === 'yesil' ? 'yeşil' : 'kavrulmuş') + ' depodan';
            }
            d.innerHTML = '<div class="ne"></div><div class="miktar"></div>' +
                '<button class="sil" type="button">sil</button>' +
                '<div class="detay"></div>';
            d.querySelector('.ne').textContent =
                (TUR_ADI[h.tur] || h.tur) + ' · ' + h.cesit;
            d.querySelector('.miktar').textContent = h.kg + ' kg';
            d.querySelector('.detay').textContent = detay;
            d.querySelector('.sil').addEventListener('click', function () {
                var l = hareketOku();
                l.splice(i, 1);
                yaz(ENVANTER_ANAHTAR, l);
                envanterCiz();
                duyur('Hareket silindi.');
            });
            k.appendChild(d);
        });
    }

    function envanterKur() {
        var dl = $('#menseListe');
        V.MENSE_SIRALI.forEach(function (m) {
            var o = document.createElement('option');
            o.value = m;
            dl.appendChild(o);
        });
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
            alert('Kaydedilemedi — tarayıcı site verilerini engelliyor olabilir.');
            return;
        }
        partiFormuTemizle();
        duyur('Parti deftere kaydedildi.');
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
            kap.innerHTML = '<p class="bos-defter">Henüz parti yok.<br>' +
                'Fire ölçüp <strong>Deftere kaydet</strong> deyin — uygulama ' +
                'zamanla sizin firenizi öğrenir.</p>';
            return;
        }

        /* ORTALAMA VE OYNAMA — kullanıcının kendi verisinden.
           "İdeal fire" diye bir sayı YAZMIYORUZ; makineye ve çekirdeğe
           göre değişir. Yalnız KENDİ dağılımını gösteriyoruz. */
        var f = liste.map(function (p) { return p.fire; });
        var ort = f.reduce(function (a, b) { return a + b; }, 0) / f.length;
        var enAz = Math.min.apply(null, f), enCok = Math.max.apply(null, f);
        ozet.innerHTML =
            '<div class="sonuc"><div class="buyuk">%' + sayi(ort, 1) + '</div>' +
            '<div class="alt">' + liste.length + ' partide ortalama fireniz</div>' +
            '<dl><div class="cift"><dt>en düşük</dt><dd>%' + sayi(enAz, 1) + '</dd></div>' +
            '<div class="cift"><dt>en yüksek</dt><dd>%' + sayi(enCok, 1) + '</dd></div>' +
            '<div class="cift"><dt>oynama</dt><dd>' + sayi(enCok - enAz, 1) +
            ' puan</dd></div></dl></div>';

        liste.forEach(function (p, i) {
            var t = new Date(p.t);
            var tarih = t.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) +
                        ' ' + t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            var b = document.createElement('button');
            b.className = 'kart parti';
            b.type = 'button';
            b.setAttribute('aria-label',
                tarih + ', fire yüzde ' + sayi(p.fire, 1) + '. Silmek için etkinleştirin.');
            var ayrinti = [kg(p.giris) + ' → ' + kg(p.cikis)];
            if (p.mense) ayrinti.push(p.mense);
            if (p.derece) ayrinti.push(p.derece);
            if (p.dtr !== undefined) ayrinti.push('gelişim %' + sayi(p.dtr, 1));
            if (p.not) ayrinti.push(p.not);
            b.innerHTML = '<span class="ad">' + tarih +
                (p.mense ? ' · ' + p.mense : '') + '</span>' +
                '<span class="fire">%' + sayi(p.fire, 1) + '</span>' +
                '<span class="detay">' + ayrinti.join(' · ') + '</span>';
            b.addEventListener('click', function () {
                if (!confirm('Bu parti silinsin mi?')) return;
                var l = defterOku(); l.splice(i, 1); yaz(DEFTER_ANAHTAR, l);
                defterCiz(); duyur('Parti silindi.');
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
        V.DEMLEME.forEach(function (m, i) {
            var o = document.createElement('option');
            o.value = String(i); o.textContent = m.ad + '  (1:' + m.oran + ')';
            y.appendChild(o);
        });
        y.addEventListener('change', function () {
            $('#dOran').value = V.DEMLEME[+y.value].oran;
            demlemeHesapla();
        });
        $('#dOran').value = V.DEMLEME[0].oran;
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
            uyari.textContent = 'Girilen değer sayı olarak okunamadı.';
            goster(uyari, true); return;
        }
        if (su <= 0 || oran <= 0) {
            goster(kutu, false);
            uyari.textContent = 'Su ve oran sıfırdan büyük olmalı.';
            goster(uyari, true); return;
        }
        goster(uyari, false); goster(kutu, true);
        var gram = su / oran;
        $('#demlemeBuyuk').textContent = sayi(gram, 1) + ' g';
        $('#demlemeAlt').textContent =
            sayi(su, 0) + ' ml su için — 1:' + sayi(oran, 0) + ' oranında';
        duyur(sayi(gram, 1) + ' gram kahve gerekiyor.');
    }

    /* ================= PARTİ FORMU ================= */
    function secenekDoldur(id, liste, bosMetin) {
        var s = $(id);
        if (!s) return;
        s.innerHTML = '<option value="">' + (bosMetin || '— belirtilmedi —') + '</option>';
        liste.forEach(function (x) {
            var ad = typeof x === 'string' ? x : x.ad;
            var o = document.createElement('option');
            o.value = ad; o.textContent = ad;
            if (typeof x !== 'string' && x.not) o.title = x.not;
            s.appendChild(o);
        });
    }

    function partiFormKur() {
        secenekDoldur('#pMense', V.MENSE_SIRALI);
        secenekDoldur('#pIsleme', V.ISLEME);
        secenekDoldur('#pVaryete', V.VARYETE_SIRALI);
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
        kutu.innerHTML = 'Gelişim oranı <strong>%' + sayi(s.dtr, 1) +
            '</strong> — ilk çatlaktan sonra ' + sureYaz(s.gelisimSn) +
            ' geçmiş. <em>Bu sayı için "doğru" bir aralık yazmıyoruz; ' +
            'makineye ve çekirdeğe göre değişir.</em>';
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
    var RENKLER = [
        ['varsayilan', 'Kahve', '#9e4f00'],
        ['kiraz', 'Kiraz', '#b3123c'],
        ['yesil', 'Yeşil', '#00752b'],
        ['okyanus', 'Okyanus', '#036e8c'],
        ['mor', 'Mor', '#7b3fe4']
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
            duyur(yeni === 'koyu' ? 'Koyu tema' : 'Açık tema');
        });
    }

    function renkleriKur() {
        var liste = $('#renkListe'), panel = $('#renkPanel'), btn = $('#renkBtn');
        RENKLER.forEach(function (r) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'renk-nokta';
            b.dataset.renk = r[0];
            b.setAttribute('aria-label', r[1] + ' rengi');
            b.setAttribute('aria-pressed', 'false');
            b.innerHTML = '<span class="yuvar" style="background:' + r[2] + '"></span>' + r[1];
            b.addEventListener('click', function () { renkUygula(r[0], true); });
            liste.appendChild(b);
        });
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

    function renkUygula(r, kaydet) {
        if (r && r !== 'varsayilan') document.documentElement.setAttribute('data-renk', r);
        else { document.documentElement.removeAttribute('data-renk'); r = 'varsayilan'; }
        if (kaydet) { try { localStorage.setItem(RENK_ANAHTAR, r); } catch (e) {} }
        $$('.renk-nokta').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.renk === r ? 'true' : 'false');
        });
    }

    /* ================= BAŞLAT ================= */
    function baslat() {
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
            u.textContent = 'Tarayıcınız site verilerini engelliyor — ' +
                'kavurma defteri KAYDEDİLEMEZ. Hesaplar çalışmaya devam eder.';
            $('.sarmal').insertBefore(u, $('.sekmeler'));
        }
        demlemeKur();
        partiFormKur();
        defterCiz();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', baslat);
    } else { baslat(); }
})();
