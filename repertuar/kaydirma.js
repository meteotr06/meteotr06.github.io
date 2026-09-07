/* kaydirma.js — otomatik kaydırmanın matematiği
   Ayrı dosya, çünkü tarayıcı çizim yapmadan (gizli sekme, ölçüm ortamı)
   requestAnimationFrame koşmuyor ve kaydırma ölçülemiyor. Matematiği
   ayırınca ölçülebilir kısım ölçülüyor, ölçülemeyen kısım açıkça söyleniyor.

   Sessiz yanlış riski: kesirli pikseller atılırsa yavaş hızda hiç kaydırmaz
   ya da hız iki katına çıkar. Birikim taşınır. */

'use strict';

var KAYDIRMA_TABAN = 8;   // hız 1 = saniyede 8 piksel

/* Doner: { piksel, birikim } — piksel TAM SAYI, artan kesir birikime kalir. */
function kaydirmaMiktari(hiz, gecenMs, birikim) {
  if (!Number.isFinite(hiz) || hiz <= 0) return { piksel: 0, birikim: birikim || 0 };
  if (!Number.isFinite(gecenMs) || gecenMs <= 0) return { piksel: 0, birikim: birikim || 0 };

  // Sekme arkaplandan dönünce gecen sure devasa olabilir; sicramayi engelle.
  if (gecenMs > 250) gecenMs = 250;

  var toplam = (birikim || 0) + hiz * KAYDIRMA_TABAN * (gecenMs / 1000);
  var tam = Math.floor(toplam);
  return { piksel: tam, birikim: toplam - tam };
}
