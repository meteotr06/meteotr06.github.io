/* depo.js — Repertuar veri kapisi
   Sinamasi: sinama.html · grup 3 (http ile ac — K-95)

   K-102: deger nereden GIRIYOR, nerede SAKLANIYOR? Sarki verisi uygulamaya
   SADECE buradan girer. Dogrulama arayuze kopyalanmaz; kapi tektir.

   Iki ayri sey karistirilmaz:
     - okunamayan kaydi EKRANDA GOSTERMEMEK  -> dogru
     - okunamayan kaydi DISKTEN SILMEK       -> yanlis, kullanici verisidir
   Bozuk kayitlar ayri listede doner, yazarken oldugu gibi geri yazilir. */

'use strict';

var DEPO_ANAHTAR = 'repertuar.v1';
var DEPO_YEDEK_ANAHTAR = 'repertuar.bozuk';
var DEPO_SURUM = 1;

var SARKI_YAZIMLARI = ['tutulan', 'duyulan'];
var SARKI_CALGILARI = ['gitar', 'ukulele', 'piyano'];

/* Gecerliyse null, degilse SEBEBI doner. Sebep ekranda gosterilir (K-89). */
function sarkiDogrula(sarki) {
  if (!sarki || typeof sarki !== 'object' || Array.isArray(sarki)) return 'kayit nesne degil';
  if (typeof sarki.ad !== 'string' || sarki.ad.trim() === '') return 'ad bos';
  if (SARKI_YAZIMLARI.indexOf(sarki.yazim) === -1) return 'yazim tutulan/duyulan olmali';
  if (!Number.isInteger(sarki.kapo) || sarki.kapo < 0) return 'kapo 0 veya daha buyuk tam sayi olmali';
  if (SARKI_CALGILARI.indexOf(sarki.calgi) === -1) return 'calgi gitar/ukulele/piyano olmali';
  if (typeof sarki.govde !== 'string') return 'govde metin olmali';
  return null;
}

/* Kullanicinin yazdigi metni TAM SAYI olarak okur; okuyamazsa NaN doner.
   NIYE parseInt yetmez: parseInt("3,5") = 3 ve parseInt("3abc") = 3 doner.
   Yani kullanici "3,5" yazar, uygulama sessizce 3 kaydeder ve kimse fark
   etmez. Burada once yazimin TAMAMI rakam mi diye bakilir.
   (Ayrica ev kurali: sayi kutusu type="number" olmaz -- Turkce yazimi bozar.) */
function tamSayiOku(metin) {
  var t = String(metin === null || metin === undefined ? '' : metin).trim();
  if (!/^\d+$/.test(t)) return NaN;
  return parseInt(t, 10);
}

/* SET (sahne sirasi). Ayni sarki birden fazla kez olabilir — bir sarki
   iki kez calinabilir, bu hata degil. */
function setDogrula(set) {
  if (!set || typeof set !== 'object' || Array.isArray(set)) return 'set nesne degil';
  if (typeof set.ad !== 'string' || set.ad.trim() === '') return 'set adi bos';
  if (!Array.isArray(set.sarkiIdleri)) return 'sarkiIdleri dizi olmali';
  for (var i = 0; i < set.sarkiIdleri.length; i++) {
    if (typeof set.sarkiIdleri[i] !== 'string' || !set.sarkiIdleri[i]) return 'sarki kimligi metin olmali';
  }
  return null;
}

function yeniSet(alanlar) {
  var s = {
    id: 'set' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
    ad: '',
    sarkiIdleri: [],
    olusturuldu: new Date().toISOString()
  };
  if (alanlar) for (var k in alanlar) s[k] = alanlar[k];
  return s;
}

/* Yeni sarki iskeleti — varsayilanlar burada, arayuzde degil. */
function yeniSarki(alanlar) {
  var s = {
    id: 's' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
    ad: '',
    sanatci: '',
    yazim: 'duyulan',        // kagitta yazan akorlar ne anlama geliyor
    kapo: 0,
    calgi: 'gitar',
    akort: 'standart',       // calgiya ozgu akort/duzen
    ton: '',
    tempo: null,
    sure: null,           // saniye — otomatik kaydirma bunu kullanir
    etiketler: [],
    govde: '',
    notlar: '',
    eklendi: new Date().toISOString()
  };
  if (alanlar) for (var k in alanlar) s[k] = alanlar[k];
  return s;
}

function depoKur(saklama) {

  function yedekle(ham) {
    try { saklama.setItem(DEPO_YEDEK_ANAHTAR, ham); } catch (h) { /* yedek de alinamadi */ }
  }

  function oku() {
    var ham;
    try {
      ham = saklama.getItem(DEPO_ANAHTAR);
    } catch (h) {
      return { sarkilar: [], bozuklar: [{ ham: null, sebep: 'saklama okunamadi: ' + h.message }] };
    }
    if (ham === null || ham === '') return { sarkilar: [], bozuklar: [] };

    var paket;
    try {
      paket = JSON.parse(ham);
    } catch (h) {
      yedekle(ham);                       // SILME — yedege al
      return { sarkilar: [], bozuklar: [{ ham: ham, sebep: 'JSON okunamadi' }] };
    }

    if (!paket || !Array.isArray(paket.sarkilar)) {
      yedekle(ham);
      return { sarkilar: [], bozuklar: [{ ham: ham, sebep: 'sarkilar listesi yok' }] };
    }

    var iyi = [], bozuk = [];
    for (var i = 0; i < paket.sarkilar.length; i++) {
      var sebep = sarkiDogrula(paket.sarkilar[i]);
      if (sebep) bozuk.push({ ham: paket.sarkilar[i], sebep: sebep });
      else iyi.push(paket.sarkilar[i]);
    }
    return { sarkilar: iyi, bozuklar: bozuk, surum: paket.surum, paket: paket };
  }

  /* Gecerli sarkilari yazar. `bozuklar` verilirse oldugu gibi geri yazilir —
     ekranda gosterilmeyen kayit diskten SILINMEZ. */
  function yaz(sarkilar, bozuklar) {
    for (var i = 0; i < sarkilar.length; i++) {
      var sebep = sarkiDogrula(sarkilar[i]);
      if (sebep) return { tamam: false, sebep: 'kayit ' + i + ': ' + sebep };
    }

    var hepsi = sarkilar.slice();
    if (bozuklar) {
      for (var j = 0; j < bozuklar.length; j++) {
        if (bozuklar[j] && bozuklar[j].ham !== undefined && bozuklar[j].ham !== null) {
          hepsi.push(bozuklar[j].ham);
        }
      }
    }

    // Var olan paketin BILMEDIGIMIZ alanlarini dusurme: sadece degistirdigimiz
    // alanlari yaz. (Ornegin `tohumlandi` bayragi burada korunur.)
    var paket = {};
    try {
      var eski = saklama.getItem(DEPO_ANAHTAR);
      if (eski) {
        var c = JSON.parse(eski);
        if (c && typeof c === 'object') paket = c;
      }
    } catch (h) { paket = {}; }

    paket.surum = DEPO_SURUM;
    paket.yazildi = new Date().toISOString();
    paket.sarkilar = hepsi;

    try {
      saklama.setItem(DEPO_ANAHTAR, JSON.stringify(paket));
    } catch (h) {
      // Kota dolu / gizli sekme: ESKI VERIYE DOKUNULMADI.
      return { tamam: false, sebep: 'saklama yazilamadi: ' + h.message };
    }
    return { tamam: true, yazilan: sarkilar.length, korunanBozuk: hepsi.length - sarkilar.length };
  }

  function ekle(sarki) {
    var sebep = sarkiDogrula(sarki);
    if (sebep) return { tamam: false, sebep: sebep };
    var o = oku();
    o.sarkilar.push(sarki);
    return yaz(o.sarkilar, o.bozuklar);
  }

  function guncelle(sarki) {
    var sebep = sarkiDogrula(sarki);
    if (sebep) return { tamam: false, sebep: sebep };
    var o = oku();
    var bulundu = false;
    for (var i = 0; i < o.sarkilar.length; i++) {
      if (o.sarkilar[i].id === sarki.id) { o.sarkilar[i] = sarki; bulundu = true; break; }
    }
    if (!bulundu) return { tamam: false, sebep: 'id bulunamadi: ' + sarki.id };
    return yaz(o.sarkilar, o.bozuklar);
  }

  function sil(id) {
    var o = oku();
    var kalan = o.sarkilar.filter(function (s) { return s.id !== id; });
    if (kalan.length === o.sarkilar.length) return { tamam: false, sebep: 'id bulunamadi: ' + id };
    return yaz(kalan, o.bozuklar);
  }

  /* --- SETLER --- ayni pakette durur; sarki yazmak setleri dusurmez. */

  function paketiAl() {
    try {
      var ham = saklama.getItem(DEPO_ANAHTAR);
      if (!ham) return {};
      var c = JSON.parse(ham);
      return (c && typeof c === 'object') ? c : {};
    } catch (h) { return {}; }
  }

  function setleriOku() {
    var paket = paketiAl();
    if (!Array.isArray(paket.setler)) return { setler: [], bozuklar: [] };
    var iyi = [], bozuk = [];
    for (var i = 0; i < paket.setler.length; i++) {
      var sebep = setDogrula(paket.setler[i]);
      if (sebep) bozuk.push({ ham: paket.setler[i], sebep: sebep });
      else iyi.push(paket.setler[i]);
    }
    return { setler: iyi, bozuklar: bozuk };
  }

  function setleriYaz(setler, bozuklar) {
    for (var i = 0; i < setler.length; i++) {
      var sebep = setDogrula(setler[i]);
      if (sebep) return { tamam: false, sebep: 'set ' + i + ': ' + sebep };
    }
    var hepsi = setler.slice();
    if (bozuklar) {
      for (var j = 0; j < bozuklar.length; j++) {
        if (bozuklar[j] && bozuklar[j].ham) hepsi.push(bozuklar[j].ham);
      }
    }
    var paket = paketiAl();
    paket.surum = DEPO_SURUM;
    paket.yazildi = new Date().toISOString();
    paket.setler = hepsi;
    if (!Array.isArray(paket.sarkilar)) paket.sarkilar = [];   // sarkilari dusurme
    try {
      saklama.setItem(DEPO_ANAHTAR, JSON.stringify(paket));
    } catch (h) {
      return { tamam: false, sebep: 'saklama yazilamadi: ' + h.message };
    }
    return { tamam: true, yazilan: setler.length };
  }

  function setKaydet(set) {
    var sebep = setDogrula(set);
    if (sebep) return { tamam: false, sebep: sebep };
    var o = setleriOku();
    var bulundu = false;
    for (var i = 0; i < o.setler.length; i++) {
      if (o.setler[i].id === set.id) { o.setler[i] = set; bulundu = true; break; }
    }
    if (!bulundu) o.setler.push(set);
    return setleriYaz(o.setler, o.bozuklar);
  }

  function setSil(id) {
    var o = setleriOku();
    var kalan = o.setler.filter(function (s) { return s.id !== id; });
    if (kalan.length === o.setler.length) return { tamam: false, sebep: 'set bulunamadi: ' + id };
    return setleriYaz(kalan, o.bozuklar);
  }

  /* Ornek repertuar SADECE ilk acilista ekilir. Kullanici hepsini silerse
     geri gelmez — silinen sey geri gelmemeli. */
  function tohumlandiMi() {
    try {
      var ham = saklama.getItem(DEPO_ANAHTAR);
      if (!ham) return false;
      var c = JSON.parse(ham);
      return !!(c && c.tohumlandi);
    } catch (h) { return false; }
  }

  function tohumla(ornekler) {
    var sonuc = yaz(ornekler, []);
    if (!sonuc.tamam) return sonuc;
    try {
      var c = JSON.parse(saklama.getItem(DEPO_ANAHTAR));
      c.tohumlandi = true;
      saklama.setItem(DEPO_ANAHTAR, JSON.stringify(c));
    } catch (h) { /* bayrak yazilamadi; en fazla ornek bir kez daha gelir */ }
    return sonuc;
  }

  return { oku: oku, yaz: yaz, ekle: ekle, guncelle: guncelle, sil: sil,
           setleriOku: setleriOku, setleriYaz: setleriYaz,
           setKaydet: setKaydet, setSil: setSil,
           tohumlandiMi: tohumlandiMi, tohumla: tohumla, anahtar: DEPO_ANAHTAR };
}

/* Gercek tarayici deposu. localStorage kapaliysa (gizli sekme, izin yok)
   uygulama COKMEZ: bellekte calisir ve bunu SOYLER (K-89). */
function depoAc() {
  try {
    var d = '__repertuar_deneme__';
    window.localStorage.setItem(d, '1');
    window.localStorage.removeItem(d);
    return { depo: depoKur(window.localStorage), kalici: true };
  } catch (h) {
    var bellek = {};
    return {
      depo: depoKur({
        getItem: function (a) { return (a in bellek) ? bellek[a] : null; },
        setItem: function (a, v) { bellek[a] = String(v); },
        removeItem: function (a) { delete bellek[a]; }
      }),
      kalici: false,
      sebep: h.message
    };
  }
}
