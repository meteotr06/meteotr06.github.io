/* gorunum.js — bir şarkı satırının ekran karşılığı
   Ayrı dosya, çünkü bu parça SINANABİLİR olmalı: sınama sayfası bunu
   çağırıp gerçek ölçüyle bakıyor (akor hecenin üstünde mi), arayüzü
   çalıştırmak zorunda kalmadan.

   TASARIM KARARI: hizalama BOŞLUK SAYISINA dayanmaz. Akor ile ait olduğu
   hece tek bir satır içi kutuda (`.parca`) durur. Kullanıcı yazı boyunu
   büyütse de, satır sarsa da, akor hecesinden ayrılamaz — çünkü fiziksel
   olarak aynı kutunun içindedir. Boşlukla hizalanan çözümler tam burada
   sessizce kayar ve göze "duruyor gibi" görünür. */

'use strict';

function kacir(s) {
  return String(s).replace(/[&<>"']/g, function (k) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[k];
  });
}

function satirHtml(blok) {
  var harfler = Array.from(blok.soz);
  var akorlar = blok.akorlar.slice().sort(function (a, b) { return a.sutun - b.sutun; });
  var p = [];
  var okunan = 0;

  function parca(akorHtml, metin) {
    p.push('<span class="parca">' + akorHtml +
           '<span class="sz">' + kacir(metin) + '</span></span>');
  }

  if (akorlar.length === 0 || akorlar[0].sutun > 0) {
    var bas = akorlar.length ? akorlar[0].sutun : harfler.length;
    parca('<span class="ak"></span>', harfler.slice(0, bas).join(''));
    okunan = bas;
  }

  for (var i = 0; i < akorlar.length; i++) {
    var a = akorlar[i];
    var son = (i + 1 < akorlar.length) ? akorlar[i + 1].sutun : harfler.length;
    if (son < a.sutun) son = a.sutun;
    var sinif = a.gecerli === false ? 'ak gecersiz' : 'ak';
    var baslik = a.gecerli === false ? ' title="Bu akor tanınmadı — olduğu gibi bırakıldı"' : '';
    parca('<span class="' + sinif + '"' + baslik + '>' + kacir(a.akor) + '</span>',
          harfler.slice(a.sutun, son).join(''));
    okunan = son;
  }

  if (okunan < harfler.length) parca('<span class="ak"></span>', harfler.slice(okunan).join(''));
  return '<div class="satir">' + p.join('') + '</div>';
}

/* --- liste suzgecleri ---
   Etiket secilmemisse HICBIR SEY gizlenmez: bos suzgec bos liste demek degil
   (K-96). Birden fazla etiket secilince liste DARALIR (hepsini tasiyanlar). */

function etiketleSuz(sarkilar, secilenler) {
  if (!secilenler || secilenler.length === 0) return sarkilar.slice();
  return sarkilar.filter(function (s) {
    var kendi = s.etiketler || [];
    for (var i = 0; i < secilenler.length; i++) {
      if (kendi.indexOf(secilenler[i]) === -1) return false;
    }
    return true;
  });
}

function tumEtiketler(sarkilar) {
  var havuz = [];
  sarkilar.forEach(function (s) {
    (s.etiketler || []).forEach(function (e) {
      if (e && havuz.indexOf(e) === -1) havuz.push(e);
    });
  });
  return havuz.sort(function (a, b) { return a.localeCompare(b, 'tr'); });
}

/* TURKCE ARAMA KATLAMASI
   `toLocaleLowerCase('tr')` yetmez: Turkcede buyuk I'nin kucugu NOKTASIZ
   "ı"dir. Yani "IsIk" -> "ısık" olur ve kullanicinin yazdigi "isik" ile
   ESLESMEZ. Olculdu (07.09.2026): sinama tam bunu dusurdu.

   Dahasi, telefonda kimse "Işık" diye yazmaz -- "isik" yazar. O yuzden
   yalniz kucultmuyoruz, TURKCE HARFLERI DE KATLIYORUZ. Katlama ARAMAYA
   ozeldir; sarkinin kendi yazimina dokunulmaz. */
var TR_KATLAMA = {
  'İ': 'i', 'I': 'i', 'ı': 'i', 'i': 'i',
  'Ş': 's', 'ş': 's',
  'Ğ': 'g', 'ğ': 'g',
  'Ü': 'u', 'ü': 'u',
  'Ö': 'o', 'ö': 'o',
  'Ç': 'c', 'ç': 'c',
  'Â': 'a', 'â': 'a', 'Î': 'i', 'î': 'i', 'Û': 'u', 'û': 'u'
};

function turkceKatla(metin) {
  return Array.from(String(metin === null || metin === undefined ? '' : metin))
    .map(function (h) { return TR_KATLAMA[h] || h; })
    .join('')
    .toLowerCase();
}


/* Metin aramasi — ad, sanatci ve etiketlerde gecer. */
function metinleSuz(sarkilar, arama) {
  var a = turkceKatla(String(arama || '').trim());
  if (!a) return sarkilar.slice();
  return sarkilar.filter(function (s) {
    // Not da aranir: "kapo 3" diye arayip o şarkıyı bulabilmek gerek.
    var havuz = [s.ad, s.sanatci, s.notlar || '']
      .concat(s.etiketler || []).join(' ');
    havuz = turkceKatla(havuz);
    return havuz.indexOf(a) !== -1;
  });
}
