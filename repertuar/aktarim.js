/* aktarim.js — repertuarı dışa/içe aktarma (yedek + toplu doldurma)
   Sınaması: sinama.html · grup 8

   BU DOSYANIN SESSİZ YANLIŞI: aktarımda bir ALAN kaybolur, uygulama çalışır,
   akorlar yanlıştır. En tehlikelisi `yazim` — kayıpsa kapo takan herkes yanlış
   akor görür ve nedenini bulamaz. O yüzden:
     - dışa aktarma bütün alanları yazar,
     - içe aktarma eksik/bozuk alanı SESSİZCE varsaymaz, uyarı listesine yazar,
     - içeri giren her şarkı `sarkiDogrula` kapısından geçer (K-102).

   İki biçim var, ikisi de gerekli:
     METİN (ChordPro) — okunaklı, elle düzenlenebilir, başka programla paylaşılır
     JSON            — kayıpsız yedek

   Bilinen sınır: içe aktarmada gövdenin sonundaki boş satırlar kırpılır. */

'use strict';

var AKTARIM_AYRAC = '{yeni_sarki}';
var NOT_BASLA = '{notlar}';
var NOT_BITIR = '{notlar_son}';

/* Not blogu komutlari BILEREK `KOMUT_KARSILIGI`ye eklenmedi: orasi sarki
   GOVDESINI cozen tablodur. Not, govdenin degil sarkinin alanidir; oraya
   konsaydi kullanicinin govdeye yazdigi `{notlar}` sessizce yutulurdu. */
function _notBaslangici(ad) { return ad === 'notlar' || ad === 'notes'; }
function _notBitisi(ad) { return ad === 'notlar_son' || ad === 'end_of_notes' || ad === 'eon'; }

/* Şarkının ALANI olan komutlar. Bunlar gövdeden çıkarılır: aynı değer iki
   yerde durursa hangisinin doğru olduğu belli olmaz. */
var ALAN_KOMUTLARI = {
  baslik: 'ad', sanatci: 'sanatci', ton: 'ton', kapo: 'kapo',
  calgi: 'calgi', yazim: 'yazim', etiketler: 'etiketler', tempo: 'tempo'
};

/* ---------- dışa ---------- */

function disaAktarMetin(sarkilar) {
  return sarkilar.map(function (s) {
    var p = [AKTARIM_AYRAC];
    p.push('{baslik: ' + s.ad + '}');
    if (s.sanatci) p.push('{sanatci: ' + s.sanatci + '}');
    p.push('{calgi: ' + s.calgi + '}');
    p.push('{yazim: ' + s.yazim + '}');          // kaybolursa akorlar yanlış olur
    p.push('{kapo: ' + s.kapo + '}');
    if (s.ton) p.push('{ton: ' + s.ton + '}');
    if (s.tempo !== null && s.tempo !== undefined) p.push('{tempo: ' + s.tempo + '}');
    if (s.etiketler && s.etiketler.length) p.push('{etiketler: ' + s.etiketler.join(', ') + '}');
    // Not COK SATIRLI olabilir; tek satirlik komuta sigmaz. Tab gibi blok yaziliyor.
    if (s.notlar && s.notlar.trim()) {
      p.push(NOT_BASLA);
      p.push(s.notlar);
      p.push(NOT_BITIR);
    }
    p.push(s.govde);
    return p.join('\n');
  }).join('\n') + '\n';
}

function disaAktarJson(sarkilar) {
  return JSON.stringify({
    surum: 1,
    uygulama: 'Repertuar',
    disaAktarildi: new Date().toISOString(),
    sarkilar: sarkilar
  }, null, 2);
}

/* ---------- içe ---------- */

function iceAktarMetin(metin) {
  var satirlar = String(metin).replace(/\r\n/g, '\n').split('\n');
  var sarkilar = [];
  var uyarilar = [];

  var acik = null;          // { alanlar:{}, govde:[] }
  var tabIcinde = false;
  var notIcinde = false;
  var notSatirlari = [];
  var sira = 0;

  function yeniAc() { sira++; return { alanlar: {}, govde: [], sira: sira }; }

  function kapat() {
    if (!acik) return;
    if (acik.govde.length === 0 && Object.keys(acik.alanlar).length === 0) { acik = null; return; }

    var a = acik.alanlar;
    var yerel = [];

    if (a.yazim === undefined) {
      yerel.push('yazım belirtilmemiş, "duyulan" varsayıldı');
    } else if (a.yazim !== 'tutulan' && a.yazim !== 'duyulan') {
      yerel.push('yazım tanınmadı ("' + a.yazim + '"), "duyulan" varsayıldı');
      a.yazim = undefined;
    }

    if (a.calgi === undefined) {
      yerel.push('çalgı belirtilmemiş, gitar varsayıldı');
    } else if (SARKI_CALGILARI.indexOf(a.calgi) === -1) {
      yerel.push('çalgı tanınmadı ("' + a.calgi + '"), gitar varsayıldı');
      a.calgi = undefined;
    }

    var kapo = 0;
    if (a.kapo !== undefined) {
      if (/^\d+$/.test(String(a.kapo).trim())) kapo = parseInt(a.kapo, 10);
      else yerel.push('kapo sayı değil ("' + a.kapo + '"), 0 varsayıldı');
    }

    var tempo = null;
    if (a.tempo !== undefined) {
      if (/^\d+$/.test(String(a.tempo).trim())) tempo = parseInt(a.tempo, 10);
      else yerel.push('tempo sayı değil ("' + a.tempo + '"), boş bırakıldı');
    }

    // gövdenin sonundaki boş satırları kırp
    var govde = acik.govde.slice();
    while (govde.length && govde[govde.length - 1].trim() === '') govde.pop();

    var sarki = yeniSarki({
      notlar: (a.notlar === undefined ? '' : String(a.notlar)),
      ad: (a.ad === undefined ? '' : String(a.ad).trim()),
      sanatci: (a.sanatci === undefined ? '' : String(a.sanatci).trim()),
      yazim: (a.yazim === undefined ? 'duyulan' : a.yazim),
      calgi: (a.calgi === undefined ? 'gitar' : a.calgi),
      kapo: kapo,
      tempo: tempo,
      ton: (a.ton === undefined ? '' : String(a.ton).trim()),
      etiketler: (a.etiketler === undefined ? [] :
        String(a.etiketler).split(',').map(function (e) { return e.trim(); })
          .filter(function (e) { return e; })),
      govde: govde.join('\n')
    });

    var ad = sarki.ad || ('(' + acik.sira + '. kayıt)');
    var sebep = sarkiDogrula(sarki);
    if (sebep) {
      uyarilar.push(ad + ' alınmadı: ' + sebep);
    } else {
      sarkilar.push(sarki);
      yerel.forEach(function (u) { uyarilar.push(ad + ': ' + u); });
    }
    acik = null;
  }

  for (var i = 0; i < satirlar.length; i++) {
    var satir = satirlar[i];
    var k = komutCozumle(satir);
    var karsilik = k ? KOMUT_KARSILIGI[k.ad] : null;

    // NOT BLOGU: icerigi HAM. Icindeki `[Am]` akor sanilmaz, `{baslik}` sarki
    // bolmez -- not, kullanicinin kendi cumlesidir.
    if (notIcinde) {
      if (k && _notBitisi(k.ad)) {
        if (!acik) acik = yeniAc();
        acik.alanlar.notlar = notSatirlari.join('\n');
        notIcinde = false;
      } else {
        notSatirlari.push(satir);
      }
      continue;
    }
    if (k && _notBaslangici(k.ad)) {
      if (!acik) acik = yeniAc();
      notIcinde = true;
      notSatirlari = [];
      continue;
    }

    // Tab bloğunun İÇİ ham metindir: oradaki hiçbir şey komut sayılmaz,
    // yoksa tab satırı şarkıyı ikiye bölebilir.
    if (tabIcinde) {
      if (karsilik === 'tab_bitir') tabIcinde = false;
      if (acik) acik.govde.push(satir);
      continue;
    }
    if (karsilik === 'tab_basla') {
      tabIcinde = true;
      if (!acik) acik = yeniAc();
      acik.govde.push(satir);
      continue;
    }

    if (karsilik === 'yeni_sarki') { kapat(); acik = yeniAc(); continue; }

    if (karsilik && ALAN_KOMUTLARI[karsilik]) {
      // Yeni bir {baslik}, dolu bir şarkı varken yeni şarkı başlatır.
      if (karsilik === 'baslik' && acik &&
          (acik.alanlar.ad !== undefined || acik.govde.length > 0)) {
        kapat();
      }
      if (!acik) acik = yeniAc();
      acik.alanlar[ALAN_KOMUTLARI[karsilik]] = k.deger;
      continue;                                   // alan komutu gövdeye YAZILMAZ
    }

    if (satir.trim() === '' && !acik) continue;    // şarkı dışındaki boşluk
    if (!acik) acik = yeniAc();                    // başlıksız metin de kayıt sayılır
    acik.govde.push(satir);
  }
  if (notIcinde) {
    if (!acik) acik = yeniAc();
    acik.alanlar.notlar = notSatirlari.join('\n');
    uyarilar.push('dosyada kapanmamış bir {notlar} bloğu var');
  }
  kapat();

  if (tabIcinde) uyarilar.push('dosyada kapanmamış bir tab bloğu var');
  if (sarkilar.length === 0 && String(metin).trim() !== '' && uyarilar.length === 0) {
    uyarilar.push('dosyada şarkı bulunamadı');
  }
  return { sarkilar: sarkilar, uyarilar: uyarilar };
}

function iceAktarJson(metin) {
  var paket;
  try {
    paket = JSON.parse(metin);
  } catch (h) {
    return { sarkilar: [], uyarilar: ['JSON okunamadı: ' + h.message] };
  }

  var liste = Array.isArray(paket) ? paket
            : (paket && Array.isArray(paket.sarkilar) ? paket.sarkilar : null);
  if (!liste) return { sarkilar: [], uyarilar: ['dosyada şarkı listesi yok'] };

  var iyi = [], uyarilar = [];
  for (var i = 0; i < liste.length; i++) {
    var sebep = sarkiDogrula(liste[i]);
    if (sebep) {
      var ad = (liste[i] && liste[i].ad) ? liste[i].ad : ('(' + (i + 1) + '. kayıt)');
      uyarilar.push(ad + ' alınmadı: ' + sebep);
    } else {
      iyi.push(liste[i]);
    }
  }
  return { sarkilar: iyi, uyarilar: uyarilar };
}

/* İçeri alınanları depoya katar. Var olan id'ler ÜZERİNE YAZILMAZ:
   yeni id verilir, böylece aktarım kullanıcının mevcut şarkısını ezmez. */
function iceAktarDepoyaKat(depo, gelenler) {
  var o = depo.oku();
  var mevcutIdler = o.sarkilar.map(function (s) { return s.id; });
  var eklenen = [];

  for (var i = 0; i < gelenler.length; i++) {
    var s = gelenler[i];
    if (mevcutIdler.indexOf(s.id) !== -1) {
      var kopya = JSON.parse(JSON.stringify(s));
      delete kopya.id;                            // yeniSarki taze id versin
      s = yeniSarki(kopya);
    }
    eklenen.push(s);
  }
  var sonuc = depo.yaz(o.sarkilar.concat(eklenen), o.bozuklar);
  return { tamam: sonuc.tamam, sebep: sonuc.sebep, eklenen: eklenen.length };
}
