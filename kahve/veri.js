/* ROASTMATE — ÇEKİRDEK BİLGİSİ / BEAN REFERENCE DATA
   ==================================================================
   BURADA NE VAR, NE YOK:

   VAR   : menşe ülkeleri, işleme yöntemleri, kavurma dereceleri,
           varyeteler. Bunlar SINIFLANDIRMADIR -- sektörde ortak,
           değişmeyen adlar. Uydurma değil, seçenek listesi.

   YOK   : fire oranı, "ideal" sıcaklık, "doğru" gelişim oranı.
           Bunlar makineye, çekirdeğe ve kavurmacıya göre DEĞİŞİR.
           Bir sayı yazsaydım kullanıcı onu ölçüm sanırdı; bu takımın
           en pahalı hatası tam olarak budur (sessiz yanlış sayı).
           Uygulama bu sayıları KULLANICIDAN ölçerek öğrenir.

   ------------------------------------------------------------------
   04.09.2026 — HER SEÇENEĞİN ARTIK BİR KODU VAR. NEDEN:

   İngilizce katmanı eklenirken ölçüldü. Eskiden `<option>` değeri
   GÖRÜNEN METİNDİ (`o.value = ad`), ve kavurma defterine o metin
   yazılıyordu:  { mense: "Etiyopya", isleme: "Yıkanmış" }

   Listeyi çevirseydik ve kullanıcı İngilizce'ye geçseydi:
     - kayıtlı "Etiyopya" hiçbir seçeneğe uymaz -> parti yeniden
       açıldığında menşe alanı BOŞ görünür, kullanıcı sildiğini sanır;
     - İngilizce arayüzde Türkçe menşe yazar;
     - dil geri çevrilince eski hâline döner -- yani veri DİLE BAĞLI
       olur. Veri hiçbir zaman dile bağlı olmamalıdır.

   Artık kaydedilen şey KOD (`etiyopya`, `yikanmis`), gösterilen şey
   çeviridir. `kodla()` eski Türkçe kayıtları koda çevirir; tanımadığı
   değeri OLDUĞU GİBİ bırakır -- kullanıcının kendi yazdığı bir şey
   olabilir ve onu silmek veri kaybıdır.
   ================================================================== */
(function (global) {
    'use strict';

    /* Menşe — kahve üreten başlıca ülkeler. */
    var MENSE = [
        { kod: 'brezilya',   tr: 'Brezilya',         en: 'Brazil' },
        { kod: 'etiyopya',   tr: 'Etiyopya',         en: 'Ethiopia' },
        { kod: 'kolombiya',  tr: 'Kolombiya',        en: 'Colombia' },
        { kod: 'guatemala',  tr: 'Guatemala',        en: 'Guatemala' },
        { kod: 'kenya',      tr: 'Kenya',            en: 'Kenya' },
        { kod: 'kostarika',  tr: 'Kosta Rika',       en: 'Costa Rica' },
        { kod: 'elsalvador', tr: 'El Salvador',      en: 'El Salvador' },
        { kod: 'honduras',   tr: 'Honduras',         en: 'Honduras' },
        { kod: 'nikaragua',  tr: 'Nikaragua',        en: 'Nicaragua' },
        { kod: 'peru',       tr: 'Peru',             en: 'Peru' },
        { kod: 'meksika',    tr: 'Meksika',          en: 'Mexico' },
        { kod: 'endonezya',  tr: 'Endonezya',        en: 'Indonesia' },
        { kod: 'vietnam',    tr: 'Vietnam',          en: 'Vietnam' },
        { kod: 'hindistan',  tr: 'Hindistan',        en: 'India' },
        { kod: 'ruanda',     tr: 'Ruanda',           en: 'Rwanda' },
        { kod: 'burundi',    tr: 'Burundi',          en: 'Burundi' },
        { kod: 'tanzanya',   tr: 'Tanzanya',         en: 'Tanzania' },
        { kod: 'uganda',     tr: 'Uganda',           en: 'Uganda' },
        { kod: 'yemen',      tr: 'Yemen',            en: 'Yemen' },
        { kod: 'panama',     tr: 'Panama',           en: 'Panama' },
        { kod: 'bolivya',    tr: 'Bolivya',          en: 'Bolivia' },
        { kod: 'ekvador',    tr: 'Ekvador',          en: 'Ecuador' },
        { kod: 'png',        tr: 'Papua Yeni Gine',  en: 'Papua New Guinea' },
        { kod: 'cin',        tr: 'Çin',              en: 'China' },
        { kod: 'tayland',    tr: 'Tayland',          en: 'Thailand' }
    ];

    /* İşleme yöntemi — çekirdeğin meyveden nasıl ayrıldığı.
       Kavurma davranışını doğrudan etkiler: natural çekirdek daha çok
       şeker taşır, daha erken karamelize olur. */
    var ISLEME = [
        { kod: 'yikanmis',  tr: 'Yıkanmış', en: 'Washed',
          notTr: 'Meyve eti tamamen ayrılır. Berrak, asidik.',
          notEn: 'Fruit pulp fully removed. Clean, acidic.' },
        { kod: 'natural',   tr: 'Natural', en: 'Natural',
          notTr: 'Meyvesiyle kurutulur. Meyvemsi, tatlı, gövdeli.',
          notEn: 'Dried in the fruit. Fruity, sweet, full-bodied.' },
        { kod: 'honey',     tr: 'Honey', en: 'Honey',
          notTr: 'Meyve etinin bir kısmı bırakılır. Arada.',
          notEn: 'Some mucilage left on. In between.' },
        { kod: 'wethulled', tr: 'Yaş göbek (wet-hulled)', en: 'Wet-hulled',
          notTr: 'Endonezya usulü. Toprağımsı, yoğun.',
          notEn: 'Indonesian method. Earthy, heavy.' },
        { kod: 'anaerobik', tr: 'Anaerobik', en: 'Anaerobic',
          notTr: 'Oksijensiz fermentasyon. Belirgin, sıra dışı.',
          notEn: 'Oxygen-free fermentation. Distinct, unusual.' },
        { kod: 'bilinmiyor', tr: 'Bilinmiyor', en: 'Unknown',
          notTr: '', notEn: '' }
    ];

    /* Tür ve varyete — botanik sınıflandırma. */
    var TUR = [
        { kod: 'arabica',    tr: 'Arabica',    en: 'Arabica' },
        { kod: 'robusta',    tr: 'Robusta',    en: 'Robusta' },
        { kod: 'karisik',    tr: 'Karışık',    en: 'Blend' },
        { kod: 'bilinmiyor', tr: 'Bilinmiyor', en: 'Unknown' }
    ];

    /* Varyete adları botanik özel adlardır; iki dilde de aynıdır.
       Yalnız "Bilinmiyor" çevrilir. */
    var VARYETE = ['Typica', 'Bourbon', 'Caturra', 'Catuai', 'Mundo Novo',
        'SL28', 'SL34', 'Geisha', 'Pacamara', 'Maragogype',
        'Heirloom', 'Castillo', 'Villa Sarchi', 'Pacas'
    ].map(function (a) {
        return { kod: a.toLowerCase().replace(/\s/g, ''), tr: a, en: a };
    }).concat([{ kod: 'bilinmiyor', tr: 'Bilinmiyor', en: 'Unknown' }]);

    /* Kavurma derecesi — ADLARI ortak, ama her derecenin KAÇ fire
       verdiği makineye göre değişir. O yüzden burada fire yazmıyoruz;
       uygulama kullanıcının kendi partilerinden öğreniyor. */
    var DERECE = [
        { kod: 'acik',      tr: 'Açık', en: 'Light',
          notTr: 'İlk çatlak biter bitmez alınır. Asidite yüksek.',
          notEn: 'Dropped as first crack ends. High acidity.' },
        { kod: 'acikorta',  tr: 'Açık-orta', en: 'Light-medium',
          notTr: 'İlk çatlaktan biraz sonra.',
          notEn: 'Shortly after first crack.' },
        { kod: 'orta',      tr: 'Orta', en: 'Medium',
          notTr: 'Denge noktası. En yaygın filtre kavurması.',
          notEn: 'The balance point. Most common filter roast.' },
        { kod: 'ortakoyu',  tr: 'Orta-koyu', en: 'Medium-dark',
          notTr: 'İkinci çatlağın eşiği. Gövde artar.',
          notEn: 'Edge of second crack. Body increases.' },
        { kod: 'koyu',      tr: 'Koyu', en: 'Dark',
          notTr: 'İkinci çatlak içinde. Kavrulma tadı öne çıkar.',
          notEn: 'Into second crack. Roast flavour dominates.' },
        { kod: 'espresso',  tr: 'Espresso', en: 'Espresso',
          notTr: 'Makineye göre değişir; ayrı bir hedef.',
          notEn: 'Machine-dependent; a target of its own.' }
    ];

    /* Demleme oranları — su:kahve. Bunlar TARİF, ölçüm değil;
       kullanıcı kendi zevkine göre değiştirir. */
    var DEMLEME = [
        { kod: 'filtre',   tr: 'Filtre (V60, Chemex)', en: 'Pour-over (V60, Chemex)', oran: 16 },
        { kod: 'french',   tr: 'French press',         en: 'French press',            oran: 15 },
        { kod: 'moka',     tr: 'Moka pot',             en: 'Moka pot',                oran: 10 },
        { kod: 'coldbrew', tr: 'Cold brew',            en: 'Cold brew',               oran: 8 },
        { kod: 'espresso', tr: 'Espresso',             en: 'Espresso',                oran: 2 }
    ];

    /* ---------------- ORTAK YARDIMCILAR ---------------- */

    function dil() {
        return (global.Dil && global.Dil.oku && global.Dil.oku() === 'en') ? 'en' : 'tr';
    }

    /** Bir kodu, ETKİN dildeki adına çevirir.
        Kod tanınmazsa DEĞER OLDUĞU GİBİ döner -- kullanıcının kendi
        yazdığı bir şey olabilir; onu "—" yapmak veri kaybıdır. */
    function ad(liste, kod) {
        if (!kod) return '';
        for (var i = 0; i < liste.length; i++) {
            if (liste[i].kod === kod) return liste[i][dil()] || liste[i].tr;
        }
        return kod;
    }

    /** Notu etkin dilde verir. */
    function not(liste, kod) {
        var alan = dil() === 'en' ? 'notEn' : 'notTr';
        for (var i = 0; i < liste.length; i++) {
            if (liste[i].kod === kod) return liste[i][alan] || '';
        }
        return '';
    }

    /** Eski kayıtları göç ettirir: görünen adı koda çevirir.
        Tanımadığını OLDUĞU GİBİ bırakır. */
    function kodla(liste, deger) {
        if (!deger) return deger;
        for (var i = 0; i < liste.length; i++) {
            if (liste[i].kod === deger) return deger;          /* zaten kod */
            if (liste[i].tr === deger || liste[i].en === deger) return liste[i].kod;
        }
        return deger;
    }

    /** Etkin dile göre adıyla sıralı kopya.
        Sıralama DİLE göre yapılır: Türkçe'de Ç/Ğ/İ/Ö/Ş/Ü doğru yere
        otursun, İngilizce'de alfabetik olsun. */
    function sirali(liste) {
        var d = dil();
        return liste.slice().sort(function (a, b) {
            return String(a[d] || a.tr).localeCompare(String(b[d] || b.tr), d);
        });
    }

    global.V = {
        MENSE: MENSE,
        ISLEME: ISLEME,
        TUR: TUR,
        VARYETE: VARYETE,
        DERECE: DERECE,
        DEMLEME: DEMLEME,
        ad: ad,
        not: not,
        kodla: kodla,
        sirali: sirali,
        /* Sıralı listeler artık ÇAĞRILDIĞINDA üretilir. Sabit olsaydı
           dil değişince sıralama Türkçe kalırdı. */
        menseSirali: function () { return sirali(MENSE); },
        varyeteSirali: function () { return sirali(VARYETE); }
    };
})(typeof window !== 'undefined' ? window : this);
