/* akor.js — Repertuar akor cekirdegi
   Bu dosyanin tek isi DOGRU akor uretmek. Arayuz burada yok.
   Sinamasi: sinama.html (http ile ac, file:// olcum sayilmaz — K-95)

   Bu uygulamanin en tehlikeli hatasi SESSIZ YANLIS AKOR'dur: uygulama calisir,
   akor okunur, yanlistir. Asagidaki her satir yasanmis bir tuzaga karsi yazildi.
*/

'use strict';

// Yarim ses merdiveni. E-F ve B-C arasinda TAM ses YOKTUR.
const DIYEZLI = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BEMOLLU = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Dogal notalarin yeri. Degistiriciler ('#','b') bunun uzerine eklenir.
const DOGAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// TUZAK: JavaScript'te -1 % 12 === -1. Merdivenden asagi inerken
// dogrudan % kullanan kod undefined uretir, arayuz de bunu bos gosterir.
function mod12(sayi) {
  return ((sayi % 12) + 12) % 12;
}

// "C#m7" -> { yer:1, ek:'m7' } · tanimadigini null doner, UYDURMAZ.
function tekNotaCozumle(metin) {
  const es = /^([A-Ga-g])([#b]*)(.*)$/.exec(metin);
  if (!es) return null;

  const harf = es[1].toUpperCase();
  let yer = DOGAL[harf];
  for (const im of es[2]) yer += (im === '#') ? 1 : -1;

  return { yer: mod12(yer), ek: es[3], bemolMu: es[2].includes('b') };
}

/* Akoru parcalarina ayirir. Tanimadigi girdide null doner.
   Bas notasi ('F/G' icindeki G) AYRI bir notadir — unutulursa akor sessizce bozulur. */
function akorCozumle(metin) {
  if (typeof metin !== 'string') return null;
  const temiz = metin.trim();
  if (temiz === '') return null;

  const parcalar = temiz.split('/');
  if (parcalar.length > 2) return null;          // "C/E/G" gecerli akor degil

  const ana = tekNotaCozumle(parcalar[0]);
  if (!ana) return null;

  let bas = null;
  if (parcalar.length === 2) {
    bas = tekNotaCozumle(parcalar[1]);
    if (!bas || bas.ek !== '') return null;      // bas notasinin eki olmaz
  }

  return {
    kok: ana.yer,
    ek: ana.ek,
    bas: bas ? bas.yer : null,
    bemolMu: ana.bemolMu || (bas ? bas.bemolMu : false)
  };
}

function notaYaz(yer, bemolMu) {
  return (bemolMu ? BEMOLLU : DIYEZLI)[mod12(yer)];
}

/* Akoru `adim` yarim ses tasir. Cozumleyemezse null doner — yanlis akor degil.
   secenek.bemol: true/false ile yazim zorlanir; verilmezse girdinin yazimi korunur. */
function akorAktar(metin, adim, secenek) {
  const a = akorCozumle(metin);
  if (!a) return null;
  if (!Number.isInteger(adim)) return null;

  const bemolMu = (secenek && typeof secenek.bemol === 'boolean') ? secenek.bemol : a.bemolMu;

  let sonuc = notaYaz(a.kok + adim, bemolMu) + a.ek;
  if (a.bas !== null) sonuc += '/' + notaYaz(a.bas + adim, bemolMu);
  return sonuc;
}

/* KAPO — karistirilirsa HER akor yanlis olur, o yuzden iki isim ayri:
   tutulan  = parmagin bastigi, kagitta yazan akor
   duyulan  = kulagin duydugu ses (kapo kadar YUKARI)
   Ekranda hangisinin gosterildigi YAZMALI. */
function duyulanAkor(tutulanMetin, kapo) {
  return akorAktar(tutulanMetin, kapo);
}

function tutulanAkor(duyulanMetin, kapo) {
  return akorAktar(duyulanMetin, -kapo);
}

/* KAPO YONU — sadece "kapo 3" saklamak YETMEZ.
   Kagitta yazan akorlarin TUTULAN mi DUYULAN mi oldugu da saklanmali; yoksa
   ayni veri iki farkli akor kumesi uretir. Ornek: saklanan "D" + kapo 3
     tutulan olarak saklandiysa -> duyulan F
     duyulan olarak saklandiysa -> tutulan B
   Taninmayan yazim adinda null doner, tahmin etmez. */
var YAZIMLAR = ['tutulan', 'duyulan'];

function gosterilecekAkor(akor, kapo, saklananYazim, istenenYazim) {
  if (YAZIMLAR.indexOf(saklananYazim) === -1) return null;
  if (YAZIMLAR.indexOf(istenenYazim) === -1) return null;
  if (!Number.isInteger(kapo) || kapo < 0) return null;

  if (saklananYazim === istenenYazim) return akorAktar(akor, 0);
  if (saklananYazim === 'tutulan')     return akorAktar(akor, kapo);   // duyulan istendi
  return akorAktar(akor, -kapo);                                       // tutulan istendi
}

/* BILINEN SINIR (K-89 — atlanan sey ekranda yazar):
   "Cb5" gibi girdide yazim belirsizdir; bu cozumleyici degistiriciyi koke
   baglar (Cb + "5"), C + "b5" olarak okumaz. Gercek repertuarda alterasyon
   "C7b5" gibi rakamdan sonra yazildigi icin bu tuzak pratikte kapalidir. */
