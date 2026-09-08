/* kaydirma.js — otomatik kaydırmanın matematiği
   Ayrı dosya, çünkü tarayıcı çizim yapmadan (gizli sekme, ölçüm ortamı)
   requestAnimationFrame koşmuyor ve kaydırma ölçülemiyor. Matematiği
   ayırınca ölçülebilir kısım ölçülüyor, ölçülemeyen kısım açıkça söyleniyor.

   Sessiz yanlış riski: kesirli pikseller atılırsa yavaş hızda hiç kaydırmaz
   ya da hız iki katına çıkar. Birikim taşınır. */

'use strict';

var KAYDIRMA_TABAN = 8;   // hız 1 = saniyede 8 piksel

/* Doner: { piksel, birikim } — piksel TAM SAYI, artan kesir birikime kalir. */
/* Piksel/saniye hizini kareye dagitir. Hem "hiz kademesi" kipi hem "sureye
   gore" kipi BU islevi cagirir -- iki ayri hesap yazsaydik biri duzelip
   oteki bozuk kalabilirdi (K-102). */
function pikselMiktari(hizPxSn, gecenMs, birikim) {
  if (!Number.isFinite(hizPxSn) || hizPxSn <= 0) return { piksel: 0, birikim: birikim || 0 };
  if (!Number.isFinite(gecenMs) || gecenMs <= 0) return { piksel: 0, birikim: birikim || 0 };

  // Sekme arkaplandan dönünce gecen sure devasa olabilir; sicramayi engelle.
  if (gecenMs > 250) gecenMs = 250;

  var toplam = (birikim || 0) + hizPxSn * (gecenMs / 1000);
  var tam = Math.floor(toplam);
  return { piksel: tam, birikim: toplam - tam };
}

function kaydirmaMiktari(hiz, gecenMs, birikim) {
  if (!Number.isFinite(hiz) || hiz <= 0) return { piksel: 0, birikim: birikim || 0 };
  return pikselMiktari(hiz * KAYDIRMA_TABAN, gecenMs, birikim);
}

/* ================= SUREYE GORE KAYDIRMA =================
   Arastirmadan (ORNEK-UYGULAMALAR.md · bolum 2): dort rakip de kullaniciya
   HIZ degil SURE soruyor. OnSong saniye ya da MM:SS aliyor, BandHelper
   sarkinin Duration alanindan hesapliyor, SongbookPro "sarkinin suresini gir"
   diyor. ChordPro'da `{duration}` zaten standart.

   NIYE ONEMLI: "hiz" sorarsan kullanici dogru degeri deneme yanilmayla
   bulmak zorunda kalir -- ve sahnede deneme yanilma sansi yoktur.

   UC PARCA:
     1. SURE      -> kaydirma sarkiyla ayni anda bitsin
     2. PRE-ROLL  -> hemen baslamasin, ilk satirlari okuyabilesin
     3. DUZELTME  -> calarken parmakla kaydirinca hiz YENIDEN hesaplansin

   Ucuncusu icin hiz her karede YENIDEN hesaplaniyor: kalan mesafe / kalan
   sure. Boylece kullanici ileri kaydirirsa yavaslar, geri kaydirirsa hizlanir
   ve sarki yine tam zamaninda biter. Sabit hizla gitseydi, bir kez elle
   duzeltmek butun geri kalani kaydirirdi. */

var PREROLL_VARSAYILAN = 5;      // saniye

/* "215", "3:35", "03:35" -> saniye. Anlayamazsa NaN -- tahmin etmez.
   `parseInt` KULLANILMIYOR: parseInt("3,5") = 3 doner ve kullanici
   3 dakika 5 saniye yazdigini sanirken 3 SANIYE kaydedilirdi. */
function sureCozumle(metin) {
  var t = String(metin === null || metin === undefined ? '' : metin).trim();
  if (t === '') return NaN;

  if (/^\d+$/.test(t)) {
    var s = parseInt(t, 10);
    return s > 0 ? s : NaN;
  }
  var es = /^(\d{1,3}):([0-5]\d)$/.exec(t);      // 3:35 · 03:35 · 12:07
  if (!es) return NaN;
  var toplam = parseInt(es[1], 10) * 60 + parseInt(es[2], 10);
  return toplam > 0 ? toplam : NaN;
}

/* Saniyeyi ekranda gosterilecek bicime cevirir: 215 -> "3:35" */
function sureYaz(saniye) {
  if (!Number.isFinite(saniye) || saniye <= 0) return '';
  var d = Math.floor(saniye / 60), s = Math.round(saniye % 60);
  if (s === 60) { d++; s = 0; }
  return d + ':' + (s < 10 ? '0' : '') + s;
}

/* Kalan mesafeyi kalan sureye yayan hiz (piksel/saniye).
   Bolme hatasi ve negatif deger uretmez: sonuc her zaman >= 0. */
function sureliHiz(kalanMesafe, kalanSaniye) {
  if (!Number.isFinite(kalanMesafe) || kalanMesafe <= 0) return 0;
  if (!Number.isFinite(kalanSaniye) || kalanSaniye <= 0) return 0;
  return kalanMesafe / kalanSaniye;
}

/* Pre-roll geri sayimi: kac saniye kaldi (tam sayi, asagi inmez). */
function prerollKalan(preroll, gecenSaniye) {
  if (!Number.isFinite(preroll) || preroll <= 0) return 0;
  if (!Number.isFinite(gecenSaniye) || gecenSaniye < 0) return Math.ceil(preroll);
  var kalan = preroll - gecenSaniye;
  return kalan > 0 ? Math.ceil(kalan) : 0;
}

/* Sarkinin bitmesine kalan sure (pre-roll dahil toplam sureden dusulur). */
function kaydirmaKalanSure(toplamSure, gecenSaniye) {
  if (!Number.isFinite(toplamSure) || toplamSure <= 0) return 0;
  if (!Number.isFinite(gecenSaniye) || gecenSaniye < 0) gecenSaniye = 0;
  var kalan = toplamSure - gecenSaniye;
  return kalan > 0 ? kalan : 0;
}
