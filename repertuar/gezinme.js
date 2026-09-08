/* gezinme.js — sahnede eller doluyken ilerleme
   Sınaması: sinama.html · grup 12

   ÜÇ ŞEY ARAŞTIRMADAN GELDİ (ORNEK-UYGULAMALAR.md · bölüm 2):

   1. PEDAL DESTEĞİ ASLINDA KLAVYE DESTEĞİDİR. Bluetooth sayfa pedalları
      klavye tuşu gönderir (ok tuşları, boşluk, PageUp/PageDown). Yani pedal
      için ayrı bir şey yazmıyoruz — klavye olaylarını dinliyoruz.

   2. TAM SAYFA DEĞİL, YARIM SAYFA. Tam sayfa çevirince müzisyen bir an
      nerede olduğunu kaybediyor; telefonda daha da kötü. Üstte kalan yarı,
      gözün yerini bulmasını sağlıyor.

   3. SABİT ŞERİDİN ALTINDA KALAN KISIM SAYILMAZ. Üst çubuk ve kumanda şeridi
      sayfanın üstünü örtüyor. Pencere yüksekliğinin yarısı kadar kaydırırsak
      örtülen kadarı okunmadan geçer — yani kullanıcı satır atlar ve bunu
      fark etmez. Ölçü, GÖRÜNEN yükseklik üzerinden alınır.

   Burası saf hesap: DOM'a dokunmaz, bu yüzden sınanabilir. */

'use strict';

var YARIM_SAYFA_ORANI = 0.5;
var EN_AZ_KAYDIRMA = 40;          // çok küçük ekranda bile bir şey ilerlesin

function yarimSayfaMiktari(pencereYuksekligi, sabitYukseklik) {
  if (!Number.isFinite(pencereYuksekligi) || pencereYuksekligi <= 0) return 0;
  var sabit = (Number.isFinite(sabitYukseklik) && sabitYukseklik > 0) ? sabitYukseklik : 0;
  if (sabit >= pencereYuksekligi) sabit = 0;          // saçma ölçü geldiyse yok say
  var gorunur = pencereYuksekligi - sabit;
  return Math.max(EN_AZ_KAYDIRMA, Math.round(gorunur * YARIM_SAYFA_ORANI));
}

/* Tuş -> eylem. Tanımadığı tuşta null döner; "her tuş ileri" davranışı
   kullanıcının yazdığı harfi sayfa çevirmeye dönüştürürdü.

   durum.yaziliyor : imleç bir yazı kutusundaysa HİÇBİR tuş kapılmaz
   durum.sette     : set çalınıyorsa sağ/sol şarkı değiştirir */
function tusEylemi(tus, durum) {
  durum = durum || {};
  if (durum.yaziliyor) return null;

  switch (tus) {
    case ' ':
    case 'Spacebar':
    case 'PageDown':
    case 'ArrowDown':
      return 'ileri';
    case 'PageUp':
    case 'ArrowUp':
      return 'geri';
    case 'ArrowRight':
      return durum.sette ? 'sonrakiSarki' : 'ileri';
    case 'ArrowLeft':
      return durum.sette ? 'oncekiSarki' : 'geri';
    case 'Enter':
      return 'kaydirmaCevir';
    case 'Home':
      return 'basa';
    case 'End':
      return 'sona';
    default:
      return null;
  }
}

/* Yazı kutusunda mıyız? Pedal tuşu ile yazı yazmak aynı tuşlar olabilir. */
function yaziKutusundaMi(oge) {
  if (!oge) return false;
  var ad = (oge.tagName || '').toLowerCase();
  if (ad === 'input' || ad === 'textarea' || ad === 'select') return true;
  return !!oge.isContentEditable;
}
