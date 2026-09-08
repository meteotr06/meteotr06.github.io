/* arayuz.js — Repertuar arayüzü
   Kural: burada doğrulama YAPILMAZ. Veri kapısı depo.js'te, akor bilgisi
   akor.js/sarki.js'te. Arayüz sadece gösterir ve o kapıları çağırır (K-102).

   Ekranda hangi akorun gösterildiği (tutulan mı duyulan mı) HER ZAMAN yazar —
   karıştırılırsa her akor yanlış olur (K-22). */

'use strict';

var UYGULAMA_SURUM = '0.1.0';

var acilis = depoAc();
var DEPO = acilis.depo;
var KALICI = acilis.kalici;

var sarkilar = [];
var bozuklar = [];
var secili = null;

var adim = 0;                 // transpoze — MUTLAK, orijinalden
var kapo = 0;
var istenenYazim = 'duyulan'; // ekranda hangi yazım gösteriliyor
var ikiliAcik = false;      // tutulan ve duyulani BIRLIKTE goster
var setler = [];
var setBozuklar = [];
var acikSet = null;        // duzenlenen set
var calanSet = null;       // sahne sirasi: {set, sira}
var seciliEtiketler = [];
var kaydirmaAcik = false;
var kaydirmaBirikim = 0;
var uyanikKilit = null;

/* Her ekranin kaydirma konumu ayri tutulur. Rakibin Play'de duzeltmek
   zorunda kaldigi hata: "repertuardan sarki acip donunce liste basa
   donuyor". Yuz sarkilik bir listede bu, her donuste yeniden aramak
   demektir. */
var ekranKonumlari = {};
var suankiEkran = 'liste';

function $(id) { return document.getElementById(id); }

/* kacir() ve satirHtml() gorunum.js'te — sinama sayfasi da onlari kullaniyor. */

/* ---------- yükleme ---------- */

function yukle() {
  var o = DEPO.oku();
  sarkilar = o.sarkilar;
  bozuklar = o.bozuklar || [];
  var so = DEPO.setleriOku();
  setler = so.setler;
  setBozuklar = so.bozuklar || [];

  // Ornek yalnizca ILK acilista gelir. Kullanici hepsini silerse geri gelmez.
  if (sarkilar.length === 0 && bozuklar.length === 0 && !DEPO.tohumlandiMi()) {
    if (DEPO.tohumla(ORNEK_SARKILAR).tamam) sarkilar = ORNEK_SARKILAR.slice();
  }
}

/* ---------- liste ---------- */

function etiketSeridiCiz() {
  var hepsi = tumEtiketler(sarkilar);
  seciliEtiketler = seciliEtiketler.filter(function (e) { return hepsi.indexOf(e) !== -1; });
  var kutu = $('etiketler');
  if (hepsi.length === 0) { kutu.innerHTML = ''; return; }

  kutu.innerHTML = hepsi.map(function (e) {
    var s = seciliEtiketler.indexOf(e) !== -1 ? ' class="secili"' : '';
    return '<button' + s + ' data-etiket="' + kacir(e) + '">' + kacir(e) + '</button>';
  }).join('');

  Array.prototype.forEach.call(kutu.querySelectorAll('button'), function (b) {
    b.addEventListener('click', function () {
      var e = b.getAttribute('data-etiket');
      var i = seciliEtiketler.indexOf(e);
      if (i === -1) seciliEtiketler.push(e); else seciliEtiketler.splice(i, 1);
      etiketSeridiCiz();
      listeCiz();
    });
  });
}

function listeCiz() {
  var arama = $('arama').value;
  var kutu = $('liste');
  var gosterilecek = etiketleSuz(metinleSuz(sarkilar, arama), seciliEtiketler);

  if (gosterilecek.length === 0) {
    var sebep = (arama || seciliEtiketler.length)
      ? 'Süzgece uyan şarkı yok. (' + sarkilar.length + ' şarkı var, süzgeç gizliyor.)'
      : 'Henüz şarkı yok. “+ Şarkı” ile ekle.';
    kutu.innerHTML = '<div class="bos-durum">' + sebep + '</div>';
    return;
  }

  kutu.innerHTML = gosterilecek.map(function (s) {
    var alt = [s.sanatci, s.calgi, s.kapo ? 'kapo ' + s.kapo : '']
      .filter(function (x) { return x; }).join(' · ');
    return '<button class="kart" data-id="' + kacir(s.id) + '">' +
           '<div class="ad">' + kacir(s.ad) + '</div>' +
           '<div class="alt">' + kacir(alt) + '</div></button>';
  }).join('');

  Array.prototype.forEach.call(kutu.querySelectorAll('.kart'), function (b) {
    b.addEventListener('click', function () { sarkiAc(b.getAttribute('data-id')); });
  });
}

function depoUyarisiCiz() {
  var p = [];
  if (!KALICI) {
    p.push('<div class="uyari-kutu"><h3>Kayıt kalıcı değil</h3>' +
      'Tarayıcı deposu kapalı (gizli sekme olabilir). Uygulama çalışır ama ' +
      '<b>kapatınca şarkılar kaybolur</b>.</div>');
  }
  if (bozuklar.length) {
    p.push('<div class="uyari-kutu"><h3>' + bozuklar.length +
      ' kayıt okunamadı — silinmedi, diskte duruyor</h3><ul>' +
      bozuklar.map(function (b) {
        var ad = (b.ham && b.ham.ad) ? b.ham.ad : '(adsız kayıt)';
        return '<li>' + kacir(ad) + ' — ' + kacir(b.sebep) + '</li>';
      }).join('') + '</ul></div>');
  }
  $('uyariDepo').innerHTML = p.join('');
}

/* ---------- şarkı görünümü ---------- */

function sarkiAc(id) {
  secili = sarkilar.filter(function (s) { return s.id === id; })[0] || null;
  if (!secili) return;

  adim = 0;
  kapo = secili.kapo || 0;
  istenenYazim = secili.yazim;

  // Şarkının kendi temposu varsa metronom onunla açılır.
  if (Number.isFinite(secili.tempo) && secili.tempo) metronomBpm = secili.tempo;
  $('mNot').textContent = (Number.isFinite(secili.tempo) && secili.tempo)
    ? 'şarkının temposu' : 'şarkıda tempo yazılı değil';
  metronomCiz();

  ekranGoster('sarki');
  setSeridiCiz();
  sarkiCiz();
}

/* Toplam kaydırma tek seferde hesaplanır ve ORİJİNALE uygulanır.
   Üst üste aktarma yapılmaz — yoksa Eb → E → D# olur (zincir tuzağı). */
/* Ekranda gosterilmeyen OTEKI yazim (ikili gosterim icin). */
function otekiYazim() {
  return istenenYazim === 'tutulan' ? 'duyulan' : 'tutulan';
}

function yazimAdimi(hangiYazim) {
  var kapoAdim = 0;
  if (hangiYazim !== secili.yazim) {
    kapoAdim = (secili.yazim === 'tutulan') ? kapo : -kapo;
  }
  return adim + kapoAdim;
}

/* Enharmonik tercih YALNIZCA aktarim varken uygulanir.
   Adim 0 ise kullanicinin kendi yazimi hic degistirilmez -- gitarda bile
   "Bb" yazan kisi "A#" gormemeli. Yazim secmek zorunda kaldigimiz tek an,
   sesin yeniden adlandirilmasi gereken andir. */
function yazimSecenegi(toplam) {
  if (toplam === 0) return null;
  return { bemol: yazimTercihi(secili.calgi) };
}


function toplamAdim() {
  return yazimAdimi(istenenYazim);
}

function sarkiCiz() {
  $('sarkiAd').textContent = secili.ad;
  $('sarkiSanatci').textContent = secili.sanatci || '';
  $('ustBaslik').textContent = secili.ad;
  $('kapoDeger').textContent = String(kapo);
  $('yazimTutulan').className = (istenenYazim === 'tutulan') ? 'secili' : '';
  $('yazimDuyulan').className = (istenenYazim === 'duyulan') ? 'secili' : '';
  $('yazimIkili').className = ikiliAcik ? 'secili' : '';

  var cozum = metinCozumle(secili.govde);
  var toplam = toplamAdim();
  var secenek = yazimSecenegi(toplam);
  var g = govdeAktar(cozum, toplam, secenek);

  /* IKILI GOSTERIM: ayni sarki bir de OTEKI yazimla aktarilip yan yana
     konuyor. Kapo 0 ise ikisi zaten ayni olur, parantez acilmaz. */
  var ikincilG = (ikiliAcik && kapo > 0)
    ? govdeAktar(cozum, yazimAdimi(otekiYazim()), yazimSecenegi(yazimAdimi(otekiYazim())))
    : null;
  var ikincilSira = 0;

  // --- gövde ---
  var p = [];
  var kullanilan = [];
  var uyarilar = [];

  g.bloklar.forEach(function (b) {
    if (b.tur === 'satir') {
      b.akorlar.forEach(function (a) {
        if (kullanilan.indexOf(a.akor) === -1) kullanilan.push(a.akor);
        if (a.gecerli === false) uyarilar.push('Tanınmayan akor: ' + a.akor);
      });
      var ikincilAkorlar = null;
      if (ikincilG) {
        var ikincilBlok = ikincilG.bloklar.filter(function (x) { return x.tur === 'satir'; })[ikincilSira];
        ikincilAkorlar = ikincilBlok ? ikincilBlok.akorlar : null;
      }
      ikincilSira++;
      p.push(satirHtml(b, ikincilAkorlar));
    } else if (b.tur === 'bos')   { p.push('<div class="satir bos"></div>'); }
    else if (b.tur === 'bolum')   { p.push('<div class="bolum">' + kacir(b.ad) + '</div>'); }
    else if (b.tur === 'yorum')   { p.push('<div class="yorum">' + kacir(b.metin) + '</div>'); }
    else if (b.tur === 'tab')     { p.push('<div class="tab">' + kacir(b.satirlar.join('\n')) + '</div>'); }
    else if (b.tur === 'bozuk')   {
      p.push('<div class="bozuk-satir">satır ' + b.no + ' okunamadı: ' + kacir(b.ham) + '</div>');
      uyarilar.push('Satır ' + b.no + ': ' + b.sebep);
    } else if (b.tur === 'bilinmeyenKomut') {
      p.push('<div class="bozuk-satir">bilinmeyen komut: {' + kacir(b.ad) + '}</div>');
      uyarilar.push('Satır ' + b.no + ': bilinmeyen komut “' + b.ad + '”');
    }
  });
  $('sarkiGovde').innerHTML = p.join('');

  // Şarkıya özel not: varsa gösterilir, yoksa kutu HİÇ çıkmaz.
  var not = (secili.notlar || '').trim();
  $('sarkiNot').textContent = not;
  $('sarkiNot').classList.toggle('gizli', not === '');

  // --- hangi yazım gösteriliyor: HER ZAMAN yazar ---
  var serit = [];
  serit.push('Ekranda <b>' + (istenenYazim === 'tutulan' ? 'TUTULAN' : 'DUYULAN') + '</b> akorlar');
  if (kapo > 0) {
    serit.push(istenenYazim === 'tutulan'
      ? '— kapo <b>' + kapo + '</b> takılıyken parmağının bastığı'
      : '— gerçekte çıkan ses (kapo <b>' + kapo + '</b>)');
  } else {
    serit.push('— kapo yok');
  }
  if (adim !== 0) serit.push('· ton <b>' + (adim > 0 ? '+' : '') + adim + '</b> yarım ses');
  if (ikiliAcik) {
    serit.push(kapo > 0
      ? '· parantez i\u00e7inde <b>' + otekiYazim().toUpperCase() + '</b>'
      : '· ikili a\u00e7\u0131k ama <b>kapo yok</b> \u2014 ikisi ayn\u0131');
  }
  if (toplamAdim() !== 0) {
    serit.push('· yaz\u0131m: <b>' + (yazimTercihi(secili.calgi) ? 'bemol' : 'diyez') +
               '</b> (' + secili.calgi + ')');
  }
  serit.push('· kayıtlı hâli: <b>' + secili.yazim + '</b>');
  $('yazimSerit').innerHTML = serit.join(' ');

  // --- uyarılar (K-89: atlanan şey ekranda yazar) ---
  $('uyariSarki').innerHTML = uyarilar.length
    ? '<div class="uyari-kutu"><h3>' + uyarilar.length + ' uyarı</h3><ul>' +
      uyarilar.map(function (u) { return '<li>' + kacir(u) + '</li>'; }).join('') + '</ul></div>'
    : '';

  // --- şemalar ---
  var calgi = secili.calgi || 'gitar';
  $('semalar').innerHTML = kullanilan.map(function (ad) {
    var svg = semaSvg(ad, calgi);
    if (!svg) {
      return '<div class="sema yok"><div class="ad">' + kacir(ad) + '</div>şema yok</div>';
    }
    return '<div class="sema"><div class="ad">' + kacir(ad) + '</div>' + svg + '</div>';
  }).join('');

  $('sarkiBilgi').textContent =
    kullanilan.length + ' farklı akor · çalgı: ' + calgi +
    (secili.ton ? ' · kayıtlı ton: ' + secili.ton : '');
}

/* ---------- otomatik kaydırma ---------- */

function kaydirmaCevir() {
  kaydirmaAcik = !kaydirmaAcik;
  kaydirmaBaslangicZamani = performance.now();
  kaydirmaBirikim = 0;
  $('kaydirma').textContent = kaydirmaAcik ? '❚❚ Dur' : '▶ Kaydır';
  if (!kaydirmaAcik) kaydirmaDurumuYaz('');
  if (kaydirmaAcik) {
    uyanikTut(true);
    requestAnimationFrame(kaydirmaAdimi);
  } else {
    uyanikBirak();
  }
}

var sonZaman = 0;
var kaydirmaBaslangicZamani = 0;

function kaydirmaDurumuYaz(metin) {
  var e = document.getElementById('kaydirmaDurum');
  if (e) e.textContent = metin;
}

/* IKI KIP VAR, HANGISINDE OLDUGU EKRANDA YAZAR.

   SUREYE GORE (sarkinin suresi girilmisse) -- dort rakip de boyle calisiyor.
   Kullaniciya "hiz" sordurmak, sahnede deneme yanilma demektir; sahnede
   deneme yanilma sansi yoktur.
     · PRE-ROLL: hemen baslamaz, ilk satirlari okuyabilesin diye geri sayar.
     · ELLE DUZELTME: hiz HER KAREDE yeniden hesaplanir (kalan mesafe / kalan
       sure). Parmakla ileri alirsan yavaslar, geri alirsan hizlanir; sarki
       yine tam zamaninda biter. Sabit hizla gitseydi bir kez elle duzeltmek
       butun geri kalani kaydirirdi.

   HIZ KADEMESI (sure girilmemisse) -- eski davranis, kaydiracla. */
function kaydirmaAdimi(zaman) {
  if (!kaydirmaAcik) { sonZaman = 0; return; }
  if (!sonZaman) sonZaman = zaman;
  var gecen = zaman - sonZaman;
  sonZaman = zaman;

  var gecenSaniye = (zaman - kaydirmaBaslangicZamani) / 1000;
  var sure = (secili && Number.isFinite(secili.sure) && secili.sure > 0) ? secili.sure : null;
  var sonuc;

  if (sure) {
    var kalanPre = prerollKalan(PREROLL_VARSAYILAN, gecenSaniye);
    if (kalanPre > 0) {
      kaydirmaDurumuYaz(kalanPre + '\u2026');
      requestAnimationFrame(kaydirmaAdimi);
      return;
    }
    var kalanSaniye = kaydirmaKalanSure(sure, gecenSaniye);
    if (kalanSaniye <= 0) { kaydirmaCevir(); return; }          // sarki bitti

    var sonNokta = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var kalanMesafe = sonNokta - window.scrollY;
    kaydirmaDurumuYaz(sureYaz(kalanSaniye) + ' kald\u0131');
    sonuc = pikselMiktari(sureliHiz(kalanMesafe, kalanSaniye), gecen, kaydirmaBirikim);
  } else {
    kaydirmaDurumuYaz('h\u0131z ' + $('hiz').value);
    sonuc = kaydirmaMiktari(Number($('hiz').value), gecen, kaydirmaBirikim);
  }

  kaydirmaBirikim = sonuc.birikim;
  if (sonuc.piksel > 0) {
    var onceki = window.scrollY;
    window.scrollBy(0, sonuc.piksel);
    /* Hiz kipinde sona gelince durur. Sure kipinde DURMAZ: kullanici geri
       kaydirabilir ve kalan sure boyunca yeniden ilerlemesi gerekir. */
    if (window.scrollY === onceki && !sure) { kaydirmaCevir(); return; }
  }
  requestAnimationFrame(kaydirmaAdimi);
}

function uyanikBirak() {
  if (uyanikKilit) { try { uyanikKilit.release(); } catch (h) {} uyanikKilit = null; }
}

/* ---------- düzenleme ---------- */

var duzenlenen = null;

function duzenAc(sarki) {
  duzenlenen = sarki;
  $('dAd').value = sarki.ad;
  $('dSanatci').value = sarki.sanatci || '';
  $('dCalgi').value = sarki.calgi || 'gitar';
  $('dKapo').value = String(sarki.kapo || 0);
  $('dYazim').value = sarki.yazim || 'duyulan';
  $('dEtiketler').value = (sarki.etiketler || []).join(', ');
  $('dGovde').value = sarki.govde || '';
  $('dNotlar').value = sarki.notlar || '';
  $('dSure').value = sureYaz(sarki.sure) || '';
  $('dSil').className = sarkilar.indexOf(sarki) === -1 ? 'tehlike gizli' : 'tehlike';
  $('ustBaslik').textContent = sarki.ad || 'Yeni şarkı';
  ekranGoster('duzen');
}

/* Sure kutusu bos birakilabilir. Ama YAZILMISSA anlasilmali: anlasilmayan
   bir sure sessizce 0 ya da 3 saniye olmamali -- kaydirma o zaman sarkiyla
   hic tutmaz ve kullanici sebebini bulamaz. */
function sureAlaniniOku() {
  var ham = $('dSure').value.trim();
  if (ham === '') return null;
  var s = sureCozumle(ham);
  if (!Number.isFinite(s)) {
    alert('S\u00fcre anla\u015f\u0131lmad\u0131: "' + ham + '"\n\u00d6rnek: 3:35 ya da 215');
    return undefined;                       // kaydetmeyi durdurur
  }
  return s;
}

function duzenKaydet() {
  var kapoDeger = tamSayiOku($('dKapo').value);   // "3,5" sessizce 3 olmaz
  var taslak = {
    id: duzenlenen.id,
    ad: $('dAd').value.trim(),
    sanatci: $('dSanatci').value.trim(),
    yazim: $('dYazim').value,
    kapo: Number.isInteger(kapoDeger) ? kapoDeger : NaN,
    calgi: $('dCalgi').value,
    akort: duzenlenen.akort || 'standart',
    ton: duzenlenen.ton || '',
    tempo: duzenlenen.tempo || null,
    etiketler: $('dEtiketler').value.split(',')
      .map(function (e) { return e.trim(); }).filter(function (e) { return e; }),
    govde: $('dGovde').value,
    notlar: $('dNotlar').value,
    sure: sureAlaniniOku(),
    eklendi: duzenlenen.eklendi || new Date().toISOString()
  };

  // Doğrulama kapıda yapılır; arayüz sadece sebebi gösterir.
  if (taslak.sure === undefined) return;   // süre anlaşılmadı, uyarıldı

  var sebep = sarkiDogrula(taslak);
  if (sebep) { alert('Kaydedilemedi: ' + sebep); return; }

  var varMi = sarkilar.some(function (s) { return s.id === taslak.id; });
  var sonuc = varMi ? DEPO.guncelle(taslak) : DEPO.ekle(taslak);
  if (!sonuc.tamam) { alert('Kaydedilemedi: ' + sonuc.sebep); return; }

  yukle();
  etiketSeridiCiz();
  listeCiz();
  depoUyarisiCiz();
  sarkiAc(taslak.id);
}

function duzenSil() {
  if (!confirm('“' + duzenlenen.ad + '” silinsin mi? Bu geri alınamaz.')) return;
  var sonuc = DEPO.sil(duzenlenen.id);
  if (!sonuc.tamam) { alert('Silinemedi: ' + sonuc.sebep); return; }
  yukle(); listeCiz(); depoUyarisiCiz(); ekranGoster('liste');
}

/* ---------- baski ----------
   Kurallar TEK YERDE: stil.css icindeki `.baski` sinifi. Yazdirmadan hemen
   once govdeye o sinif ekleniyor, bitince kaldiriliyor. `@media print`
   kurallari KOPYALANMIYOR -- kopyalansaydi biri duzelip oteki bozuk kalabilir
   ve bunu kimse goremezdi (K-102). */

function baskiKipi(acik) {
  document.body.classList.toggle('baski', !!acik);
}

function baskiyaHazirla() {
  if (kaydirmaAcik) kaydirmaCevir();     // kayarken yazdirma
  if (METRONOM.calisiyorMu()) { METRONOM.dur(); metronomCiz(); }
  baskiKipi(true);
}

function baskidanDon() { baskiKipi(false); }

window.addEventListener('beforeprint', baskiyaHazirla);
window.addEventListener('afterprint', baskidanDon);
if (window.matchMedia) {                 // Safari 'beforeprint' yerine bunu kullanir
  var _bs = window.matchMedia('print');
  if (_bs.addEventListener) {
    _bs.addEventListener('change', function (o) {
      if (o.matches) baskiyaHazirla(); else baskidanDon();
    });
  }
}

/* ---------- metronom ---------- */

var METRONOM = MetronomKur();
var metronomBpm = 100;

function metronomCiz() {
  $('mBpm').textContent = metronomBpm + ' BPM';
  $('mCal').className = METRONOM.calisiyorMu() ? 'secili' : '';
  $('mCal').textContent = METRONOM.calisiyorMu() ? '■ Metronom' : '♪ Metronom';
}

function metronomAyarla() {
  var a = METRONOM.ayarla(metronomBpm, parseInt($('mOlcu').value, 10));
  metronomBpm = a.bpm;
  metronomCiz();
}

/* ---------- set listeleri (sahne sırası) ---------- */

function sarkiBul(id) {
  for (var i = 0; i < sarkilar.length; i++) if (sarkilar[i].id === id) return sarkilar[i];
  return null;
}

function setleriCiz() {
  var kutu = $('setListesi');
  var p = [];

  if (setBozuklar.length) {
    p.push('<div class="uyari-kutu"><h3>' + setBozuklar.length +
      ' set okunamadı — silinmedi</h3></div>');
  }
  if (setler.length === 0) {
    p.push('<div class="bos-durum">Henüz set yok. Yukarıdan bir ad yazıp “+ Set” de.</div>');
  } else {
    setler.forEach(function (st) {
      var eksik = st.sarkiIdleri.filter(function (i) { return !sarkiBul(i); }).length;
      var alt = st.sarkiIdleri.length + ' şarkı' + (eksik ? (' · ' + eksik + ' eksik') : '');
      p.push('<button class="kart" data-set="' + kacir(st.id) + '">' +
             '<div class="ad">' + kacir(st.ad) + '</div>' +
             '<div class="alt">' + kacir(alt) + '</div></button>');
    });
  }
  kutu.innerHTML = p.join('');
  Array.prototype.forEach.call(kutu.querySelectorAll('.kart'), function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-set');
      for (var i = 0; i < setler.length; i++) if (setler[i].id === id) setAc(setler[i]);
    });
  });
}

function setAc(st) {
  acikSet = JSON.parse(JSON.stringify(st));       // kopya üstünde çalış
  $('sAd').value = acikSet.ad;
  $('ustBaslik').textContent = acikSet.ad || 'Set';
  setIcerikCiz();
  ekranGoster('set');
}

function setIcerikCiz() {
  $('sSarkiSec').innerHTML = sarkilar.map(function (s) {
    return '<option value="' + kacir(s.id) + '">' + kacir(s.ad) + '</option>';
  }).join('') || '<option value="">(şarkı yok)</option>';

  var kutu = $('setIcerik');
  if (acikSet.sarkiIdleri.length === 0) {
    kutu.innerHTML = '<div class="bos-durum">Set boş. Yukarıdan şarkı ekle.</div>';
    return;
  }

  kutu.innerHTML = acikSet.sarkiIdleri.map(function (id, i) {
    var s = sarkiBul(id);
    // Silinmiş şarkı sessizce DÜŞÜRÜLMEZ: sahnede eksiği fark etmen gerekir.
    var ad = s ? kacir(s.ad) : ('eksik şarkı (silinmiş) — ' + kacir(id));
    return '<div class="set-satir' + (s ? '' : ' eksik') + '">' +
           '<span class="no">' + (i + 1) + '.</span>' +
           '<span class="ad">' + ad + '</span>' +
           '<button data-yukari="' + i + '" aria-label="Yukarı">▲</button>' +
           '<button data-asagi="' + i + '" aria-label="Aşağı">▼</button>' +
           '<button data-cikar="' + i + '" class="tehlike" aria-label="Çıkar">✕</button></div>';
  }).join('');

  function bagla(nitelik, is_) {
    Array.prototype.forEach.call(kutu.querySelectorAll('[data-' + nitelik + ']'), function (b) {
      b.addEventListener('click', function () {
        is_(parseInt(b.getAttribute('data-' + nitelik), 10));
        setIcerikCiz();
      });
    });
  }
  bagla('yukari', function (i) {
    if (i === 0) return;
    var d = acikSet.sarkiIdleri;
    var t = d[i - 1]; d[i - 1] = d[i]; d[i] = t;
  });
  bagla('asagi', function (i) {
    var d = acikSet.sarkiIdleri;
    if (i >= d.length - 1) return;
    var t = d[i + 1]; d[i + 1] = d[i]; d[i] = t;
  });
  bagla('cikar', function (i) { acikSet.sarkiIdleri.splice(i, 1); });
}

function setiKaydet() {
  acikSet.ad = $('sAd').value.trim();
  var sebep = setDogrula(acikSet);
  if (sebep) { alert('Kaydedilemedi: ' + sebep); return false; }
  var sonuc = DEPO.setKaydet(acikSet);
  if (!sonuc.tamam) { alert('Kaydedilemedi: ' + sonuc.sebep); return false; }
  yukle(); setleriCiz();
  return true;
}

function setCal() {
  if (!setiKaydet()) return;
  var calinabilir = acikSet.sarkiIdleri.filter(function (i) { return sarkiBul(i); });
  if (calinabilir.length === 0) { alert('Bu sette çalınabilir şarkı yok.'); return; }
  calanSet = { idler: calinabilir, sira: 0, ad: acikSet.ad };
  sarkiAc(calanSet.idler[0]);
}

function setSeridiCiz() {
  var acikMi = !!calanSet;
  $('setSerit').classList.toggle('gizli', !acikMi);
  if (!acikMi) return;
  $('setKonum').textContent = calanSet.ad + ' — ' + (calanSet.sira + 1) + ' / ' + calanSet.idler.length;
  $('setOnceki').disabled = (calanSet.sira === 0);
  $('setSonraki').disabled = (calanSet.sira >= calanSet.idler.length - 1);
}

function setteGit(yon) {
  if (!calanSet) return;
  var yeni = calanSet.sira + yon;
  if (yeni < 0 || yeni >= calanSet.idler.length) return;
  calanSet.sira = yeni;
  sarkiAc(calanSet.idler[yeni]);
}

/* ---------- yedek / aktarım ---------- */

function dosyayaVer(adSonu, tur, icerik) {
  var damga = new Date().toISOString().slice(0, 10);
  var b = new Blob([icerik], { type: tur + ';charset=utf-8' });
  var u = URL.createObjectURL(b);
  var a = document.createElement('a');
  a.href = u;
  a.download = 'repertuar-' + damga + adSonu;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
}

function yedekRaporu(baslik, gelen, sonuc) {
  var p = ['<div class="uyari-kutu"><h3>' + kacir(baslik) + '</h3><ul>'];
  p.push('<li>' + gelen.sarkilar.length + ' şarkı okundu' +
         (sonuc ? (', ' + sonuc.eklenen + ' tanesi eklendi') : '') + '</li>');
  gelen.uyarilar.forEach(function (u) { p.push('<li>' + kacir(u) + '</li>'); });
  if (sonuc && !sonuc.tamam) p.push('<li>KAYDEDİLEMEDİ: ' + kacir(sonuc.sebep) + '</li>');
  p.push('</ul></div>');
  $('yRapor').innerHTML = p.join('');
}

function iceAl(metin) {
  if (!metin || !metin.trim()) {
    $('yRapor').innerHTML = '<div class="uyari-kutu"><h3>Boş</h3>Alınacak bir şey yok.</div>';
    return;
  }
  var gelen = (metin.trim().charAt(0) === '{' && metin.indexOf('"sarkilar"') !== -1)
    ? iceAktarJson(metin)
    : iceAktarMetin(metin);

  if (gelen.sarkilar.length === 0) { yedekRaporu('Hiçbir şarkı alınamadı', gelen, null); return; }

  var sonuc = iceAktarDepoyaKat(DEPO, gelen.sarkilar);
  yukle();
  etiketSeridiCiz();
  listeCiz();
  depoUyarisiCiz();
  yedekRaporu(sonuc.tamam ? 'İçe alındı' : 'Sorun var', gelen, sonuc);
}

/* ---------- pedal / klavye ----------
   Bluetooth sayfa pedallari klavye tusu gonderir (ok tuslari, bosluk,
   PageUp/PageDown). Yani pedal icin ayri bir sey yazmiyoruz.

   Yarim sayfa ilerliyoruz, tam sayfa degil: tam sayfa cevirince muzisyen
   bir an nerede oldugunu kaybediyor. Ustte kalan yari, gozun yerini
   bulmasini sagliyor.

   SABIT SERIDIN ORTTUGU KISIM DUSULUYOR: ust cubuk + kumanda seridi
   sayfanin ustunu ortuyor. Pencerenin yarisi kadar kaydirsak ortulen kadari
   OKUNMADAN gecerdi -- ekranda hata gorunmez, calan kisi satir atlar. */

function sabitSeritYuksekligi() {
  var toplam = 0;
  ['.ust', '.kumanda'].forEach(function (secici) {
    var e = document.querySelector(secici);
    if (!e) return;
    var s = getComputedStyle(e);
    if (s.display === 'none') return;
    if (s.position !== 'sticky' && s.position !== 'fixed') return;
    toplam += e.getBoundingClientRect().height;
  });
  return toplam;
}

/* Yumusak kaydirma HER ZAMAN calismaz: 'hareketi azalt' ayari acikken
   tarayici animasyonu yok sayar, bazi ortamlarda ise hic uygulanmaz.
   Boyle bir yerde pedala basan kisi HICBIR SEY olmadigini gorur ve
   'pedal bozuk' der. O yuzden once hedef hesaplaniyor, sonra gercekten
   oraya gidilip gidilmedigi OLCULUYOR; gitmediyse aninda atlaniyor. */
function yarimSayfaGit(yon) {
  var miktar = yarimSayfaMiktari(window.innerHeight, sabitSeritYuksekligi());
  var oncekiY = window.scrollY;
  var azalt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    window.scrollBy({ top: yon * miktar, behavior: azalt ? 'auto' : 'smooth' });
  } catch (h) {
    window.scrollBy(0, yon * miktar);        // eski tarayici: nesne bicimini bilmiyor
  }

  if (azalt) return;
  setTimeout(function () {
    if (window.scrollY === oncekiY) window.scrollBy(0, yon * miktar);
  }, 250);
}

function pedalDinle(olay) {
  if (suankiEkran !== 'sarki') return;
  var eylem = tusEylemi(olay.key, {
    yaziliyor: yaziKutusundaMi(document.activeElement),
    sette: !!calanSet
  });
  if (!eylem) return;
  olay.preventDefault();

  if (eylem === 'ileri') yarimSayfaGit(1);
  else if (eylem === 'geri') yarimSayfaGit(-1);
  else if (eylem === 'sonrakiSarki') setteGit(1);
  else if (eylem === 'oncekiSarki') setteGit(-1);
  else if (eylem === 'kaydirmaCevir') kaydirmaCevir();
  else if (eylem === 'basa') window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (eylem === 'sona') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

document.addEventListener('keydown', pedalDinle);

/* ---------- ekran geçişleri ---------- */

/* Ekran degisince: konumu geri getir, ekrani uyanik tut ya da birak. */
function ekranaGecildi(hangi) {
  suankiEkran = hangi;
  var konum = ekranKonumlari[hangi];
  var hedef = (hangi === 'liste' && Number.isFinite(konum)) ? konum : 0;

  /* UC KEZ ayarlaniyor, ucu de gerekli -- olcerek ogrenildi (08.09.2026):
     Uzun listeden kisa bir sarkiya gecerken tarayici, ESKI konumu yeni
     sayfanin sonuna KIRPIYOR. Sonuc: sarki 199. pikselden aciliyordu, yani
     kullanici sahnede sarkinin BASINI goremiyordu. Ekranda hata gorunmuyor.
       1. hemen        -> gecisin kendisi
       2. setTimeout 0 -> yerlesim yeni yuksekligi hesapladiktan sonra
       3. rAF          -> cizim oncesi son duzeltme
     rAF tek basina YETMEZ: sekme arkadayken hic calismiyor. */
  window.scrollTo(0, hedef);
  setTimeout(function () { window.scrollTo(0, hedef); }, 0);
  requestAnimationFrame(function () { window.scrollTo(0, hedef); });

  uyanikTut(hangi === 'sarki');
}

/* EKRANI UYANIK TUTMA — sahne uygulamasinin olmazsa olmazi.
   Onceden yalniz otomatik kaydirma acikken isteniyordu; oysa kullanici
   kaydirmayi kapatip elle takip ettiginde de ekran kararmamali. Artik
   sarki ekraninda oldugu surece isteniyor.
   Kilit, sekme arkaya alininca tarayici tarafindan BIRAKILIR; geri
   donuldugunde yeniden isteniyor -- yoksa "bir kez istedim, tamamdir"
   sanip ekran sahnede kararir. */
function uyanikTut(istensin) {
  if (!istensin) { uyanikBirak(); return; }
  if (uyanikKilit || !navigator.wakeLock) return;
  navigator.wakeLock.request('screen').then(function (k) {
    uyanikKilit = k;
    k.addEventListener('release', function () { uyanikKilit = null; });
  }).catch(function () { /* izin yok ya da pil dusuk -- uygulama yine calisir */ });
}

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && suankiEkran === 'sarki') uyanikTut(true);
});


function ekranGoster(hangi) {
  ekranKonumlari[suankiEkran] = window.scrollY;
  if (kaydirmaAcik) kaydirmaCevir();
  if (hangi !== 'sarki' && METRONOM.calisiyorMu()) { METRONOM.dur(); metronomCiz(); }
  ['Liste', 'Sarki', 'Duzen', 'Yedek', 'Setler', 'Set'].forEach(function (e) {
    $('ekran' + e).classList.add('gizli');
  });
  $('ekran' + hangi.charAt(0).toUpperCase() + hangi.slice(1)).classList.remove('gizli');

  $('geri').classList.toggle('gizli', hangi === 'liste');
  $('duzenle').classList.toggle('gizli', hangi !== 'sarki');
  $('yeni').classList.toggle('gizli', hangi !== 'liste');
  $('yedek').classList.toggle('gizli', hangi !== 'liste');
  $('setlerAc').classList.toggle('gizli', hangi !== 'liste');
  if (hangi === 'liste') $('ustBaslik').textContent = 'Repertuar';
  ekranaGecildi(hangi);
}

/* ---------- yazı boyu (kişisel tercih, kalıcı olmasa da olur) ---------- */

function yaziBoyuUygula(boy) {
  document.documentElement.style.setProperty('--sarki-boy', boy + 'px');
  try { localStorage.setItem('repertuar.yaziBoyu', String(boy)); } catch (h) {}
}
function yaziBoyuOku() {
  try {
    var v = parseInt(localStorage.getItem('repertuar.yaziBoyu'), 10);
    return Number.isInteger(v) ? Math.min(40, Math.max(12, v)) : 18;
  } catch (h) { return 18; }
}
var yaziBoyu = yaziBoyuOku();

/* ---------- bağlama ---------- */

function baglantilariKur() {
  $('arama').addEventListener('input', listeCiz);
  $('geri').addEventListener('click', function () { ekranGoster('liste'); });
  $('duzenle').addEventListener('click', function () { duzenAc(secili); });
  $('yeni').addEventListener('click', function () { duzenAc(yeniSarki()); });

  $('tonAsagi').addEventListener('click', function () { adim--; sarkiCiz(); });
  $('tonYukari').addEventListener('click', function () { adim++; sarkiCiz(); });
  $('tonSifir').addEventListener('click', function () { adim = 0; sarkiCiz(); });
  $('kapoAzalt').addEventListener('click', function () { if (kapo > 0) { kapo--; sarkiCiz(); } });
  $('kapoArtir').addEventListener('click', function () { if (kapo < 12) { kapo++; sarkiCiz(); } });
  $('yazimTutulan').addEventListener('click', function () { istenenYazim = 'tutulan'; sarkiCiz(); });
  $('yazimDuyulan').addEventListener('click', function () { istenenYazim = 'duyulan'; sarkiCiz(); });
  $('yazimIkili').addEventListener('click', function () { ikiliAcik = !ikiliAcik; sarkiCiz(); });

  $('yaziBuyut').addEventListener('click', function () { yaziBoyu = Math.min(40, yaziBoyu + 2); yaziBoyuUygula(yaziBoyu); });
  $('yaziKucult').addEventListener('click', function () { yaziBoyu = Math.max(12, yaziBoyu - 2); yaziBoyuUygula(yaziBoyu); });
  $('kaydirma').addEventListener('click', kaydirmaCevir);

  $('dKaydet').addEventListener('click', duzenKaydet);
  $('dVazgec').addEventListener('click', function () {
    if (secili && sarkilar.some(function (s) { return s.id === secili.id; })) sarkiAc(secili.id);
    else ekranGoster('liste');
  });
  $('dSil').addEventListener('click', duzenSil);

  $('yedek').addEventListener('click', function () {
    $('yRapor').innerHTML = ''; $('yMetin').value = '';
    $('ustBaslik').textContent = 'Yedek / aktarım';
    ekranGoster('yedek');
  });
  $('yKapat').addEventListener('click', function () { ekranGoster('liste'); });
  $('yDisaMetin').addEventListener('click', function () {
    dosyayaVer('.txt', 'text/plain', disaAktarMetin(sarkilar));
  });
  $('yDisaJson').addEventListener('click', function () {
    dosyayaVer('.json', 'application/json', disaAktarJson(sarkilar));
  });
  $('yIceAl').addEventListener('click', function () { iceAl($('yMetin').value); });

  $('setlerAc').addEventListener('click', function () {
    $('ustBaslik').textContent = 'Set listeleri';
    setleriCiz();
    ekranGoster('setler');
  });
  $('sYeniEkle').addEventListener('click', function () {
    var ad = $('sYeniAd').value.trim();
    if (!ad) { alert('Set adı boş olamaz.'); return; }
    $('sYeniAd').value = '';
    setAc(yeniSet({ ad: ad }));
  });
  $('sSarkiEkle').addEventListener('click', function () {
    var id = $('sSarkiSec').value;
    if (!id) return;
    acikSet.sarkiIdleri.push(id);
    setIcerikCiz();
  });
  $('sKaydet').addEventListener('click', function () {
    if (setiKaydet()) { $('ustBaslik').textContent = 'Set listeleri'; ekranGoster('setler'); }
  });
  $('sCal').addEventListener('click', setCal);
  $('sSil').addEventListener('click', function () {
    if (!confirm('“' + acikSet.ad + '” seti silinsin mi?')) return;
    DEPO.setSil(acikSet.id);
    yukle(); setleriCiz();
    $('ustBaslik').textContent = 'Set listeleri';
    ekranGoster('setler');
  });
  $('yazdir').addEventListener('click', function () {
    baskiyaHazirla();
    window.print();
    setTimeout(baskidanDon, 1000);       // 'afterprint' gelmezse ekran koyu temaya donsun
  });

  $('mCal').addEventListener('click', function () {
    if (METRONOM.calisiyorMu()) { METRONOM.dur(); metronomCiz(); return; }
    METRONOM.ayarla(metronomBpm, parseInt($('mOlcu').value, 10));
    var s = METRONOM.basla();
    if (!s.tamam) { $('mNot').textContent = s.sebep; return; }
    metronomCiz();
  });
  $('mAzalt').addEventListener('click', function () { metronomBpm = Math.max(40, metronomBpm - 4); metronomAyarla(); });
  $('mArtir').addEventListener('click', function () { metronomBpm = Math.min(240, metronomBpm + 4); metronomAyarla(); });
  $('mOlcu').addEventListener('change', metronomAyarla);

  $('setOnceki').addEventListener('click', function () { setteGit(-1); });
  $('setSonraki').addEventListener('click', function () { setteGit(1); });
  $('setCik').addEventListener('click', function () { calanSet = null; setSeridiCiz(); });
  $('yDosya').addEventListener('change', function (o) {
    var d = o.target.files && o.target.files[0];
    if (!d) return;
    var okuyucu = new FileReader();
    okuyucu.onload = function () { $('yMetin').value = String(okuyucu.result); iceAl($('yMetin').value); };
    okuyucu.onerror = function () {
      $('yRapor').innerHTML = '<div class="uyari-kutu"><h3>Dosya okunamadı</h3></div>';
    };
    okuyucu.readAsText(d, 'utf-8');
  });
}

/* ---------- açılış ---------- */

yaziBoyuUygula(yaziBoyu);
yukle();
baglantilariKur();
etiketSeridiCiz();
listeCiz();
depoUyarisiCiz();
ekranGoster('liste');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function () { /* çevrimdışı olmaz, uygulama yine çalışır */ });
}
