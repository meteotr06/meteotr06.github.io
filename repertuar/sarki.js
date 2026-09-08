/* sarki.js — Repertuar sarki satiri: cozumleme, hizalama, satir transpozu
   Sinamasi: sinama.html · grup 2 (http ile ac — K-95)

   IKINCI HATA SINIFI: akor DOGRU, ama YANLIS HECENIN ustunde duruyor.
   Ekranda duzgun gorunur, calinca yanlistir. Bu dosyanin tek isi bunu onlemek.

   Bicim (ChordPro): akor, ait oldugu hecenin ONUNE koseli parantezle yazilir.
       [Am]Bir gun [C]gelir
   Akorun sutunu SOZDE olculur; parantezli ham metinde olculurse her akor
   kendinden onceki parantezler kadar saga kayar. */

'use strict';

/* Bir satiri soz + akor listesine ayirir.
   Kapanmamis koseli parantezde null doner — satiri sessizce yutmaz. */
function satirCozumle(metin) {
  if (typeof metin !== 'string') return null;

  var harfler = Array.from(metin);          // kod noktasi bazli: Turkce harfler tek sayilir
  var soz = '';
  var akorlar = [];
  var i = 0;

  while (i < harfler.length) {
    if (harfler[i] === '[') {
      var kapanis = harfler.indexOf(']', i + 1);
      if (kapanis === -1) return null;       // "[Am Bir gun" — bozuk satir
      var ad = harfler.slice(i + 1, kapanis).join('');
      akorlar.push({
        akor: ad,
        sutun: Array.from(soz).length,       // SOZDEKI sutun
        gecerli: (typeof akorCozumle === 'function') ? (akorCozumle(ad) !== null) : true
      });
      i = kapanis + 1;
    } else {
      soz += harfler[i];
      i++;
    }
  }
  return { soz: soz, akorlar: akorlar };
}

/* Akor satiri ile soz satirini AYNI sutunlara oturtur.
   Uzun bir akor sonrakine yer birakmiyorsa soz de itilir; boylece akor
   her zaman ait oldugu hecenin ustunde kalir. Esaralikli yazi tipi sarttir. */
function hizala(cozum) {
  if (!cozum) return null;

  var harfler = Array.from(cozum.soz);
  var akorlar = cozum.akorlar.slice().sort(function (a, b) { return a.sutun - b.sutun; });

  var akorSatiri = '';
  var sozSatiri = '';
  var okunan = 0;

  for (var i = 0; i < akorlar.length; i++) {
    var a = akorlar[i];
    var hedef = Math.min(Math.max(a.sutun, 0), harfler.length);

    sozSatiri += harfler.slice(okunan, hedef).join('');
    okunan = hedef;

    // iki satiri ayni sutuna getir
    while (akorSatiri.length < sozSatiri.length) akorSatiri += ' ';
    while (sozSatiri.length < akorSatiri.length) sozSatiri += ' ';

    // onceki akora yapismasin: en az bir bosluk
    if (akorSatiri.length > 0 && akorSatiri.charAt(akorSatiri.length - 1) !== ' ') {
      akorSatiri += ' ';
      sozSatiri += ' ';
    }
    akorSatiri += a.akor;
  }

  sozSatiri += harfler.slice(okunan).join('');
  return { akorSatiri: akorSatiri, sozSatiri: sozSatiri };
}

/* Satirdaki akorlari ORIJINALE gore `adim` yarim ses tasir.
   `adim` MUTLAKTIR, birikmez: ust uste cagirmak sonucu bozmaz.

   NIYE: sektorun en sik gercek hatasi, transpoze edip GERI alinca YAZIMIN
   bozulmasidir. Ust uste aktarilirsa Eb -> E -> D# olur; ses ayni, yazim
   degismistir ve kullanici "ben boyle yazmamistim" der. Cozum, her seferinde
   saklanan ORIJINALDEN aktarmaktir — o yuzden `kaynak` tasinir (K-102: deger
   nereden GIRIYOR, nerede SAKLANIYOR?).

   Taninmayan akor UYDURULMAZ: oldugu gibi kalir, gecerli=false ile isaretlenir
   ki ekranda uyari gosterilebilsin (K-89 — atlanan sey ekranda yazar). */
function satirAktar(cozum, adim) {
  if (!cozum) return null;

  var kaynak = cozum.kaynak || cozum.akorlar;   // HER ZAMAN orijinalden
  var yeni = [];
  for (var i = 0; i < kaynak.length; i++) {
    var a = kaynak[i];
    var cevrilmis = akorAktar(a.akor, adim);
    if (cevrilmis === null) {
      yeni.push({ akor: a.akor, sutun: a.sutun, gecerli: false });
    } else {
      yeni.push({ akor: cevrilmis, sutun: a.sutun, gecerli: true });
    }
  }
  return { soz: cozum.soz, akorlar: yeni, kaynak: kaynak, adim: adim };
}

/* --- KOMUTLAR (ChordPro) ---
   Standart adlar da Turkce adlar da kabul edilir; kullanicinin yazdigi
   bicim bozulmadan saklanir. Bilinmeyen komut SESSIZCE ATILMAZ (K-89). */
var KOMUT_KARSILIGI = {
  'title': 'baslik', 't': 'baslik', 'baslik': 'baslik',
  'subtitle': 'altbaslik', 'st': 'altbaslik', 'altbaslik': 'altbaslik',
  'artist': 'sanatci', 'sanatci': 'sanatci',
  'key': 'ton', 'ton': 'ton',
  'capo': 'kapo', 'kapo': 'kapo',
  'tempo': 'tempo', 'hiz': 'tempo',
  'duration': 'sure', 'sure': 'sure',
  'calgi': 'calgi', 'instrument': 'calgi',
  'yazim': 'yazim',
  'etiketler': 'etiketler', 'tags': 'etiketler',
  'new_song': 'yeni_sarki', 'ns': 'yeni_sarki', 'yeni_sarki': 'yeni_sarki',
  'comment': 'yorum', 'c': 'yorum', 'not': 'yorum',
  'start_of_chorus': 'nakarat_basla', 'soc': 'nakarat_basla', 'nakarat': 'nakarat_basla',
  'end_of_chorus': 'bolum_bitir', 'eoc': 'bolum_bitir', 'nakarat_son': 'bolum_bitir',
  'start_of_verse': 'kita_basla', 'sov': 'kita_basla', 'kita': 'kita_basla',
  'end_of_verse': 'bolum_bitir', 'eov': 'bolum_bitir', 'kita_son': 'bolum_bitir',
  'start_of_tab': 'tab_basla', 'sot': 'tab_basla', 'tab': 'tab_basla',
  'end_of_tab': 'tab_bitir', 'eot': 'tab_bitir', 'tab_son': 'tab_bitir'
};

function komutCozumle(satir) {
  var es = /^\s*\{\s*([^:}]+?)\s*(?::\s*([\s\S]*?))?\s*\}\s*$/.exec(satir);
  if (!es) return null;
  return { ad: es[1].toLowerCase(), deger: (es[2] === undefined ? '' : es[2]) };
}

/* Cok satirli sarki govdesini cozumler.
   Doner: { kunye:{...}, bloklar:[...] }
   Bloklar: satir | bos | yorum | bolum | tab | bozuk
   Bozuk satir ATLANMAZ; ekranda uyari cikabilsin diye blok olarak doner. */
function metinCozumle(metin) {
  var satirlar = String(metin).replace(/\r\n/g, '\n').split('\n');
  var kunye = {};
  var bloklar = [];
  var tabAcik = false;
  var tabSatirlari = [];
  var tabBaslangicNo = 0;

  for (var i = 0; i < satirlar.length; i++) {
    var satir = satirlar[i];
    var k = komutCozumle(satir);

    if (k) {
      var karsilik = KOMUT_KARSILIGI[k.ad];

      if (karsilik === 'tab_basla') {
        if (tabAcik) bloklar.push({ tur: 'bozuk', ham: satir, no: i + 1, sebep: 'onceki tab blogu kapanmamis' });
        tabAcik = true; tabSatirlari = []; tabBaslangicNo = i + 1;
        continue;
      }
      if (karsilik === 'tab_bitir') {
        if (!tabAcik) bloklar.push({ tur: 'bozuk', ham: satir, no: i + 1, sebep: 'acilmamis tab blogu kapatiliyor' });
        else { bloklar.push({ tur: 'tab', satirlar: tabSatirlari, no: tabBaslangicNo }); tabAcik = false; }
        continue;
      }
      if (tabAcik) { tabSatirlari.push(satir); continue; }

      if (karsilik === 'kapo' || karsilik === 'tempo') {
        var sayi = /^\d+$/.test(k.deger.trim()) ? parseInt(k.deger.trim(), 10) : null;
        if (sayi === null) bloklar.push({ tur: 'bozuk', ham: satir, no: i + 1, sebep: karsilik + ' sayi olmali' });
        else kunye[karsilik] = sayi;
        continue;
      }
      if (karsilik === 'yorum') { bloklar.push({ tur: 'yorum', metin: k.deger, no: i + 1 }); continue; }
      if (karsilik === 'nakarat_basla') { bloklar.push({ tur: 'bolum', ad: k.deger || 'Nakarat', no: i + 1 }); continue; }
      if (karsilik === 'kita_basla') { bloklar.push({ tur: 'bolum', ad: k.deger || 'Kita', no: i + 1 }); continue; }
      if (karsilik === 'bolum_bitir') { bloklar.push({ tur: 'bolum_bitir', no: i + 1 }); continue; }
      if (karsilik) { kunye[karsilik] = k.deger; continue; }

      bloklar.push({ tur: 'bilinmeyenKomut', ad: k.ad, deger: k.deger, no: i + 1 });
      continue;
    }

    if (tabAcik) { tabSatirlari.push(satir); continue; }

    if (satir.trim() === '') { bloklar.push({ tur: 'bos' }); continue; }

    var c = satirCozumle(satir);
    if (c === null) bloklar.push({ tur: 'bozuk', ham: satir, no: i + 1, sebep: 'kapanmamis koseli parantez' });
    else bloklar.push({ tur: 'satir', soz: c.soz, akorlar: c.akorlar, no: i + 1 });
  }

  if (tabAcik) {
    bloklar.push({ tur: 'tab', satirlar: tabSatirlari, no: tabBaslangicNo });
    bloklar.push({ tur: 'bozuk', ham: '{tab}', no: tabBaslangicNo, sebep: 'tab blogu kapanmadi' });
  }
  return { kunye: kunye, bloklar: bloklar };
}

/* Tum govdeyi ORIJINALDEN mutlak adimla aktarir (zincir tuzagina karsi). */
function govdeAktar(cozulmus, adim) {
  var yeni = [];
  for (var i = 0; i < cozulmus.bloklar.length; i++) {
    var b = cozulmus.bloklar[i];
    if (b.tur !== 'satir') { yeni.push(b); continue; }
    var a = satirAktar({ soz: b.soz, akorlar: b.akorlar, kaynak: b.kaynak || b.akorlar }, adim);
    yeni.push({ tur: 'satir', soz: b.soz, akorlar: a.akorlar, kaynak: a.kaynak, no: b.no });
  }
  return { kunye: cozulmus.kunye, bloklar: yeni };
}
