/* sema.js — Akor semalari (gitar · ukulele · piyano)
   Sinamasi: sinama.html · grup 4 (http ile ac — K-95)

   BU DOSYANIN SESSIZ YANLISI: yanlis parmak basma. Sema duzgun cizilir,
   kullanici basar, ses yanlistir. Elle yazilan bir tablo er gec yanlis olur.

   O YUZDEN: her sema, akorun TEORIK notalarina karsi dogrulanir
   (`semaDogrula`). Tablodaki her giris sinamada tek tek kosuluyor —
   yabanci nota varsa veya akoru akor yapan aralik eksikse DUSER.

   Dis kutuphane KULLANILMIYOR (lisans denetlenmedi). Veri de cizim de burada.
*/

'use strict';

/* Akort = her telin bos hali, yarim ses merdiveninde yeri. */
var AKORTLAR = {
  gitar:   { adlar: ['E', 'A', 'D', 'G', 'B', 'e'], sesler: [4, 9, 2, 7, 11, 4] },
  ukulele: { adlar: ['G', 'C', 'E', 'A'],           sesler: [7, 0, 4, 9] }
};

/* Ekin araliklari: izinli = akorun butun notalari,
   gerekli = olmazsa o akor OLMAYAN notalar (yaygin voicing'lerde 5'li atlanabilir,
   ama 3'lu ve 7'li atlanamaz — atlanirsa akor baska akor olur). */
var EK_ARALIKLARI = {
  '':      { izinli: [0, 4, 7],        gerekli: [0, 4] },
  'm':     { izinli: [0, 3, 7],        gerekli: [0, 3] },
  '5':     { izinli: [0, 7],           gerekli: [0, 7] },
  '6':     { izinli: [0, 4, 7, 9],     gerekli: [0, 4, 9] },
  'm6':    { izinli: [0, 3, 7, 9],     gerekli: [0, 3, 9] },
  '7':     { izinli: [0, 4, 7, 10],    gerekli: [0, 4, 10] },
  'm7':    { izinli: [0, 3, 7, 10],    gerekli: [0, 3, 10] },
  'maj7':  { izinli: [0, 4, 7, 11],    gerekli: [0, 4, 11] },
  'mmaj7': { izinli: [0, 3, 7, 11],    gerekli: [0, 3, 11] },
  '9':     { izinli: [0, 2, 4, 7, 10], gerekli: [0, 4, 10] },
  'm9':    { izinli: [0, 2, 3, 7, 10], gerekli: [0, 3, 10] },
  'add9':  { izinli: [0, 2, 4, 7],     gerekli: [0, 4] },
  'sus2':  { izinli: [0, 2, 7],        gerekli: [0, 2] },
  'sus4':  { izinli: [0, 5, 7],        gerekli: [0, 5] },
  '7sus4': { izinli: [0, 5, 7, 10],    gerekli: [0, 5, 10] },
  'dim':   { izinli: [0, 3, 6],        gerekli: [0, 3, 6] },
  'dim7':  { izinli: [0, 3, 6, 9],     gerekli: [0, 3, 6, 9] },
  'm7b5':  { izinli: [0, 3, 6, 10],    gerekli: [0, 3, 6, 10] },
  'aug':   { izinli: [0, 4, 8],        gerekli: [0, 4, 8] }
};

var EK_ESANLAMI = { 'min': 'm', '-': 'm', 'M7': 'maj7', 'maj': '', 'M': '', 'sus': 'sus4' };

/* Akorun izinli/gerekli nota kumeleri. Taninmayan ekte null doner — UYDURMAZ. */
function akorNotalari(akorAdi) {
  var c = akorCozumle(akorAdi);
  if (!c) return null;

  var ek = c.ek;
  if (EK_ESANLAMI[ek] !== undefined) ek = EK_ESANLAMI[ek];
  var a = EK_ARALIKLARI[ek];
  if (!a) return null;

  function kaydir(dizi) {
    return dizi.map(function (x) { return (c.kok + x) % 12; });
  }
  var izinli = kaydir(a.izinli);
  if (c.bas !== null && izinli.indexOf(c.bas) === -1) izinli = izinli.concat([c.bas]);

  return { kok: c.kok, ek: ek, izinli: izinli, gerekli: kaydir(a.gerekli) };
}

/* Piyano: tus kumesi dogrudan teoriden uretilir — elle tablo yok, yanlis olamaz. */
function piyanoTuslari(akorAdi) {
  var n = akorNotalari(akorAdi);
  if (!n) return null;
  var c = akorCozumle(akorAdi);
  var tuslar = n.izinli.slice();
  if (c.bas !== null && tuslar.indexOf(c.bas) === -1) tuslar.push(c.bas);
  return tuslar;
}

/* Bir semanin gercekten o akoru verip vermedigini denetler.
   null = dogru; metin = neden yanlis. */
function semaDogrula(perdeler, akorAdi, calgi) {
  var akort = AKORTLAR[calgi];
  if (!akort) return 'bilinmeyen calgi: ' + calgi;
  if (!Array.isArray(perdeler) || perdeler.length !== akort.sesler.length) {
    return 'tel sayisi uymuyor (' + akort.sesler.length + ' bekleniyor)';
  }
  var n = akorNotalari(akorAdi);
  if (!n) return 'akor cozumlenemedi: ' + akorAdi;

  var duyulan = [];
  for (var i = 0; i < perdeler.length; i++) {
    var p = perdeler[i];
    if (p === -1) continue;                       // susturulmus tel
    if (!Number.isInteger(p) || p < 0 || p > 24) return 'gecersiz perde: ' + p;
    var ses = (akort.sesler[i] + p) % 12;
    if (n.izinli.indexOf(ses) === -1) {
      return 'YABANCI NOTA: ' + akort.adlar[i] + ' teli ' + p + '. perde';
    }
    if (duyulan.indexOf(ses) === -1) duyulan.push(ses);
  }
  if (duyulan.length === 0) return 'butun teller susturulmus';

  for (var j = 0; j < n.gerekli.length; j++) {
    if (duyulan.indexOf(n.gerekli[j]) === -1) {
      return 'EKSIK NOTA: akoru akor yapan ses yok';
    }
  }
  return null;
}

/* Sema tablosu. Perdeler: -1 susturulmus, 0 bos tel, n = n. perde.
   Her giris sinamada `semaDogrula` ile teoriye karsi kosuluyor. */
var SEMALAR = {
  gitar: {
    'C':     [-1, 3, 2, 0, 1, 0],
    'Cm':    [-1, 3, 5, 5, 4, 3],
    'C7':    [-1, 3, 2, 3, 1, 0],
    'Cmaj7': [-1, 3, 2, 0, 0, 0],
    'C#':    [-1, 4, 6, 6, 6, 4],
    'D':     [-1, -1, 0, 2, 3, 2],
    'Dm':    [-1, -1, 0, 2, 3, 1],
    'D7':    [-1, -1, 0, 2, 1, 2],
    'Dm7':   [-1, -1, 0, 2, 1, 1],
    'Dmaj7': [-1, -1, 0, 2, 2, 2],
    'Dsus2': [-1, -1, 0, 2, 3, 0],
    'Dsus4': [-1, -1, 0, 2, 3, 3],
    'D#':    [-1, -1, 1, 3, 4, 3],
    'E':     [0, 2, 2, 1, 0, 0],
    'Em':    [0, 2, 2, 0, 0, 0],
    'E7':    [0, 2, 0, 1, 0, 0],
    'Em7':   [0, 2, 0, 0, 0, 0],
    'Esus4': [0, 2, 2, 2, 0, 0],
    'F':     [1, 3, 3, 2, 1, 1],
    'Fm':    [1, 3, 3, 1, 1, 1],
    'Fmaj7': [-1, -1, 3, 2, 1, 0],
    'F#':    [2, 4, 4, 3, 2, 2],
    'F#m':   [2, 4, 4, 2, 2, 2],
    'G':     [3, 2, 0, 0, 0, 3],
    'Gm':    [3, 5, 5, 3, 3, 3],
    'G7':    [3, 2, 0, 0, 0, 1],
    'G#':    [4, 6, 6, 5, 4, 4],
    'A':     [-1, 0, 2, 2, 2, 0],
    'Am':    [-1, 0, 2, 2, 1, 0],
    'A7':    [-1, 0, 2, 0, 2, 0],
    'Am7':   [-1, 0, 2, 0, 1, 0],
    'Amaj7': [-1, 0, 2, 1, 2, 0],
    'Asus2': [-1, 0, 2, 2, 0, 0],
    'Asus4': [-1, 0, 2, 2, 3, 0],
    'A#':    [-1, 1, 3, 3, 3, 1],
    'B':     [-1, 2, 4, 4, 4, 2],
    'Bm':    [-1, 2, 4, 4, 3, 2],
    'B7':    [-1, 2, 1, 2, 0, 2],
    'Bm7':   [-1, 2, 4, 2, 3, 2]
  },
  ukulele: {
    'C':   [0, 0, 0, 3],
    'C7':  [0, 0, 0, 1],
    'Cm':  [0, 3, 3, 3],
    'D':   [2, 2, 2, 0],
    'Dm':  [2, 2, 1, 0],
    'D7':  [2, 2, 2, 3],
    'E':   [4, 4, 4, 2],
    'Em':  [0, 4, 3, 2],
    'E7':  [1, 2, 0, 2],
    'F':   [2, 0, 1, 0],
    'F7':  [2, 3, 1, 0],
    'G':   [0, 2, 3, 2],
    'Gm':  [0, 2, 3, 1],
    'G7':  [0, 2, 1, 2],
    'A':   [2, 1, 0, 0],
    'Am':  [2, 0, 0, 0],
    'A7':  [0, 1, 0, 0],
    'Am7': [0, 0, 0, 0],
    'A#':  [3, 2, 1, 1],
    'B':   [4, 3, 2, 2],
    'Bm':  [4, 2, 2, 2]
  }
};

/* Sema arama — ADA gore degil, SESE gore. Boylece D# yazilmis akor
   tablodaki Eb girisini de bulur (esanlamli yazim sorunu cozulur). */
function semaBul(akorAdi, calgi, tanimlar) {
  /* Kullanicinin kendi tanimi HER ZAMAN once gelir: kendi tuttugu sekil,
     bizim tablomuzdaki genel sekilden onceliklidir. */
  var kendi = tanimHaritasi(tanimlar)[akorAdi];
  if (kendi) return { perdeler: kendi.perdeler, adi: akorAdi, birebir: true, kullanici: true };

  var tablo = SEMALAR[calgi];
  if (!tablo) return null;
  var c = akorCozumle(akorAdi);
  if (!c) return null;

  if (tablo[akorAdi]) return { perdeler: tablo[akorAdi], adi: akorAdi, birebir: true };

  for (var ad in tablo) {                     // ayni ses + ayni ek + ayni BAS
    var t = akorCozumle(ad);
    if (t && t.kok === c.kok && t.ek === c.ek && t.bas === c.bas) {
      return { perdeler: tablo[ad], adi: ad, birebir: false };
    }
  }
  // F/G icin F semasi DONMEZ: bas notasi akorun tanimidir, susturulursa
  // kullanici yanlis sey calar. Sema yoksa "sema yok" demek daha durustur.
  return null;
}

/* --- Cizim --- */

function semaSvg(akorAdi, calgi, tanimlar) {
  if (calgi === 'piyano') return piyanoSvg(akorAdi);

  var bulunan = semaBul(akorAdi, calgi, tanimlar);
  if (!bulunan) return null;

  var perdeler = bulunan.perdeler;
  var telSayisi = perdeler.length;
  var basilanlar = perdeler.filter(function (p) { return p > 0; });
  var enDusuk = basilanlar.length ? Math.min.apply(null, basilanlar) : 1;
  var enYuksek = basilanlar.length ? Math.max.apply(null, basilanlar) : 1;
  var baslangic = (enYuksek <= 4) ? 1 : enDusuk;
  var perdeSayisi = 4;

  var telAra = 16, perdeAra = 20, solBosluk = 18, ustBosluk = 22;
  var g = (telSayisi - 1) * telAra;
  var y = perdeSayisi * perdeAra;
  var en = solBosluk * 2 + g, boy = ustBosluk + y + 14;
  var p = [];

  p.push('<svg viewBox="0 0 ' + en + ' ' + boy + '" width="' + en + '" height="' + boy +
         '" role="img" aria-label="' + akorAdi + ' ' + calgi + ' şeması">');
  p.push('<rect width="' + en + '" height="' + boy + '" fill="none"/>');

  // ust esik veya perde numarasi
  if (baslangic === 1) {
    p.push('<rect x="' + solBosluk + '" y="' + (ustBosluk - 4) + '" width="' + g +
           '" height="4" fill="currentColor"/>');
  } else {
    p.push('<text x="' + (solBosluk - 6) + '" y="' + (ustBosluk + 14) +
           '" font-size="11" text-anchor="end" fill="currentColor">' + baslangic + '</text>');
  }

  for (var t = 0; t < telSayisi; t++) {
    var x = solBosluk + t * telAra;
    p.push('<line x1="' + x + '" y1="' + ustBosluk + '" x2="' + x + '" y2="' + (ustBosluk + y) +
           '" stroke="currentColor" stroke-width="1"/>');
  }
  for (var f = 0; f <= perdeSayisi; f++) {
    var yy = ustBosluk + f * perdeAra;
    p.push('<line x1="' + solBosluk + '" y1="' + yy + '" x2="' + (solBosluk + g) + '" y2="' + yy +
           '" stroke="currentColor" stroke-width="1"/>');
  }

  for (var i = 0; i < telSayisi; i++) {
    var xx = solBosluk + i * telAra;
    var perde = perdeler[i];
    if (perde === -1) {
      p.push('<text x="' + xx + '" y="' + (ustBosluk - 7) +
             '" font-size="11" text-anchor="middle" fill="currentColor">×</text>');
    } else if (perde === 0) {
      p.push('<circle cx="' + xx + '" cy="' + (ustBosluk - 10) +
             '" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>');
    } else {
      var cy = ustBosluk + (perde - baslangic) * perdeAra + perdeAra / 2;
      p.push('<circle cx="' + xx + '" cy="' + cy + '" r="6" fill="currentColor"/>');
    }
  }
  p.push('</svg>');
  return p.join('');
}

var PIYANO_BEYAZ = [0, 2, 4, 5, 7, 9, 11];
var PIYANO_SIYAH = [1, 3, 6, 8, 10];

function piyanoSvg(akorAdi) {
  var tuslar = piyanoTuslari(akorAdi);
  if (!tuslar) return null;

  var bEn = 16, bBoy = 62, sEn = 10, sBoy = 38;
  var en = PIYANO_BEYAZ.length * bEn + 2, boy = bBoy + 2;
  var p = ['<svg viewBox="0 0 ' + en + ' ' + boy + '" width="' + en + '" height="' + boy +
           '" role="img" aria-label="' + akorAdi + ' piyano şeması">'];

  for (var i = 0; i < PIYANO_BEYAZ.length; i++) {
    var basili = tuslar.indexOf(PIYANO_BEYAZ[i]) !== -1;
    p.push('<rect x="' + (1 + i * bEn) + '" y="1" width="' + bEn + '" height="' + bBoy +
           '" fill="' + (basili ? 'currentColor' : 'none') +
           '" stroke="currentColor" stroke-width="1" opacity="' + (basili ? '0.85' : '1') + '"/>');
  }
  // siyah tuslar beyazlarin arasinda: C#,D# (1,2) ve F#,G#,A# (4,5,6)
  var yerler = [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]];
  for (var j = 0; j < yerler.length; j++) {
    var ses = yerler[j][0], sira = yerler[j][1];
    var x = 1 + sira * bEn - sEn / 2;
    var bas = tuslar.indexOf(ses) !== -1;
    p.push('<rect x="' + x + '" y="1" width="' + sEn + '" height="' + sBoy +
           '" fill="' + (bas ? '#ff9f43' : 'currentColor') + '" stroke="currentColor"/>');
  }
  p.push('</svg>');
  return p.join('');
}

/* ================= KULLANICININ KENDI SEMASI ({define:}) =================
   Tablomuzda 60 sema var; olmayan akorda durustce "sema yok" diyoruz.
   Ama ChordPro'da sema tanimlama komutu ZATEN STANDART:

     {define: F/G base-fret 1 frets 1 3 3 2 1 3}

   Kullanici kendi tuttugu sekli yazabilmeli. Turkce karsiligi da kabul
   ediliyor: {tanim: ... perde 1 perdeler ...}

   BASE-FRET: ChordPro'da perdeler base-fret'e GORE verilir; base-fret 5 ise
   "1" bes perde demektir. Mutlaga cevriliyor, yoksa sema bes perde asagi
   cizilir ve kullanici yanlis yere basar.

   DOGRULAMA: kullanicinin tanimi da `semaDogrula`dan geciriliyor. Gecmezse
   sema YINE DE gosteriliyor -- kendi sekli, belki bilerek boyle tutuyor --
   ama ekranda uyari cikiyor (K-89). Sessizce kabul de etmiyoruz, sessizce
   reddetmiyoruz da. */

function tanimCozumle(deger) {
  if (typeof deger !== 'string') return null;
  var parcalar = deger.trim().split(/\s+/);
  if (parcalar.length < 3) return null;

  var ad = parcalar[0];
  if (!akorCozumle(ad)) return null;                 // taninmayan akor adi

  var baslangic = 1;
  var perdeMetinleri = null;

  for (var i = 1; i < parcalar.length; i++) {
    var anahtar = parcalar[i].toLowerCase().replace(/:$/, '');
    if (anahtar === 'base-fret' || anahtar === 'perde') {
      var b = parcalar[i + 1];
      if (!/^\d+$/.test(b || '')) return null;
      baslangic = parseInt(b, 10);
      if (baslangic < 1 || baslangic > 20) return null;
      i++;
    } else if (anahtar === 'frets' || anahtar === 'perdeler') {
      perdeMetinleri = parcalar.slice(i + 1);
      break;
    } else if (anahtar === 'fingers' || anahtar === 'parmaklar') {
      break;                                          // parmak bilgisi cizimde kullanilmiyor
    }
  }
  if (!perdeMetinleri || perdeMetinleri.length === 0) return null;

  var perdeler = [];
  for (var j = 0; j < perdeMetinleri.length; j++) {
    var p = perdeMetinleri[j].toLowerCase();
    if (p === 'x' || p === '-' || p === '-1') { perdeler.push(-1); continue; }
    if (!/^\d+$/.test(p)) return null;
    var n = parseInt(p, 10);
    // base-fret'e gore verilen perde MUTLAGA cevriliyor
    perdeler.push(n === 0 ? 0 : (baslangic - 1 + n));
  }
  return { ad: ad, perdeler: perdeler, baslangic: baslangic };
}

/* Tanim listesini ada gore haritaya cevirir; sonraki tanim oncekini ezer. */
function tanimHaritasi(tanimlar) {
  var harita = {};
  (tanimlar || []).forEach(function (t) { if (t && t.ad) harita[t.ad] = t; });
  return harita;
}
