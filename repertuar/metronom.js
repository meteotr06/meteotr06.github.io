/* metronom.js — ayarlanabilir vuruş
   Sınaması: sinama.html · grup 10

   BU DOSYANIN SESSİZ YANLIŞI: KAYMA. Metronom çalar, sesi duyulur, ama
   yavaş yavaş tempodan kayar. Bir dakika sonra şarkıyla tutmaz ve çalan
   kişi "ben mi kaçırdım" diye düşünür.

   Kaymanın sebebi kesirli sayı değil, ZAMANLAYICI GECİKMESİDİR: setInterval
   her turda birkaç milisaniye geç ateşler. "Bir sonraki vuruş = ŞU AN + aralık"
   diyen kod bu gecikmeyi biriktirir; 120 BPM'de turda 3 ms gecikme, 5 dakikada
   1.8 saniye kayma demektir — ve bu duyulur.

   Burada her vuruşun zamanı BAŞLANGIÇTAN hesaplanır: baslangic + n*(60/bpm).
   Zamanlayıcı geç ateşlese de vuruşun düşeceği an değişmez; ses kartının
   kendi saatine önceden yerleştirilir. Akor transpozundaki "hep orijinalden
   hesapla" kuralının zaman hâli. */

'use strict';

var METRONOM_EN_AZ = 40;
var METRONOM_EN_COK = 240;

/* n. vuruşun zamanı (saniye). Geçersiz girdide null — tahmin etmez. */
function vurusZamani(baslangic, bpm, n) {
  if (!Number.isFinite(baslangic) || baslangic < 0) return null;
  if (!Number.isFinite(bpm) || bpm < METRONOM_EN_AZ || bpm > METRONOM_EN_COK) return null;
  if (!Number.isInteger(n) || n < 0) return null;
  return baslangic + n * (60 / bpm);
}

/* Ölçünün ilk vuruşu vurguludur. olcu=1 ise her vuruş vurgulu. */
function vurusVurgulu(n, olcu) {
  if (!Number.isInteger(n) || n < 0) return false;
  if (!Number.isInteger(olcu) || olcu < 1) return false;
  return (n % olcu) === 0;
}

/* Verilen pencerede çalınacak vuruşları planlar (ileriye bakışlı zamanlama). */
function vuruslariPlanla(baslangic, bpm, olcu, simdi, pencere, sonrakiNo) {
  var plan = [];
  var n = sonrakiNo;
  for (var guvenlik = 0; guvenlik < 1000; guvenlik++) {
    var t = vurusZamani(baslangic, bpm, n);
    if (t === null) return { vuruslar: [], sonrakiNo: sonrakiNo };
    if (t >= simdi + pencere) break;
    if (t >= simdi) plan.push({ no: n, zaman: t, vurgulu: vurusVurgulu(n, olcu) });
    n++;
  }
  return { vuruslar: plan, sonrakiNo: n };
}

/* --- ses ---
   Ses üretimi bu ortamda ÖLÇÜLEMEZ (ses aygıtı yok). Zamanlama matematiği
   yukarıda ölçülüyor; buradaki kısım gerçek cihazda kulakla denenmeli. */
function MetronomKur() {
  var ctx = null, zamanlayici = null;
  var baslangic = 0, sonrakiNo = 0;
  var bpm = 100, olcu = 4;
  var PENCERE = 0.2, ARALIK = 50;

  function sesCal(zaman, vurgulu) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.frequency.value = vurgulu ? 1600 : 900;
    g.gain.setValueAtTime(0.0001, zaman);
    g.gain.exponentialRampToValueAtTime(vurgulu ? 0.5 : 0.28, zaman + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, zaman + 0.05);
    o.connect(g); g.connect(ctx.destination);
    o.start(zaman); o.stop(zaman + 0.06);
  }

  function tik() {
    var p = vuruslariPlanla(baslangic, bpm, olcu, ctx.currentTime, PENCERE, sonrakiNo);
    p.vuruslar.forEach(function (v) { sesCal(v.zaman, v.vurgulu); });
    sonrakiNo = p.sonrakiNo;
  }

  return {
    calisiyorMu: function () { return zamanlayici !== null; },
    ayarla: function (yeniBpm, yeniOlcu) {
      // Tempo değişince BAŞTAN kurulur: eski başlangıca göre hesap sürerse
      // yeni tempo yanlış yerlere düşer.
      if (Number.isFinite(yeniBpm)) bpm = Math.min(METRONOM_EN_COK, Math.max(METRONOM_EN_AZ, yeniBpm));
      if (Number.isInteger(yeniOlcu) && yeniOlcu >= 1) olcu = yeniOlcu;
      if (zamanlayici !== null) { baslangic = ctx.currentTime + 0.05; sonrakiNo = 0; }
      return { bpm: bpm, olcu: olcu };
    },
    basla: function () {
      if (zamanlayici !== null) return { tamam: true };
      try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
      } catch (h) {
        return { tamam: false, sebep: 'ses açılamadı: ' + h.message };
      }
      baslangic = ctx.currentTime + 0.05;
      sonrakiNo = 0;
      tik();
      zamanlayici = setInterval(tik, ARALIK);
      return { tamam: true };
    },
    dur: function () {
      if (zamanlayici !== null) { clearInterval(zamanlayici); zamanlayici = null; }
    }
  };
}
