/* ☕ ÇEKİRDEK BİLGİSİ — seçenek listeleri
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
   ================================================================== */
(function (global) {
    'use strict';

    /* Menşe — kahve üreten başlıca ülkeler.
       Sıralama Türkçe alfabeye göre yapılır (localeCompare 'tr'),
       çünkü varsayılan sıralama Ç/Ğ/İ/Ö/Ş/Ü harflerini yanlış yere
       koyar ve kullanıcı aradığını bulamaz. */
    var MENSE = [
        'Brezilya', 'Etiyopya', 'Kolombiya', 'Guatemala', 'Kenya',
        'Kosta Rika', 'El Salvador', 'Honduras', 'Nikaragua', 'Peru',
        'Meksika', 'Endonezya', 'Vietnam', 'Hindistan', 'Ruanda',
        'Burundi', 'Tanzanya', 'Uganda', 'Yemen', 'Panama',
        'Bolivya', 'Ekvador', 'Papua Yeni Gine', 'Çin', 'Tayland'
    ];

    /* İşleme yöntemi — çekirdeğin meyveden nasıl ayrıldığı.
       Kavurma davranışını doğrudan etkiler: natural çekirdek daha çok
       şeker taşır, daha erken karamelize olur. */
    var ISLEME = [
        { ad: 'Yıkanmış', not: 'Meyve eti tamamen ayrılır. Berrak, asidik.' },
        { ad: 'Natural', not: 'Meyvesiyle kurutulur. Meyvemsi, tatlı, gövdeli.' },
        { ad: 'Honey', not: 'Meyve etinin bir kısmı bırakılır. Arada.' },
        { ad: 'Yaş göbek (wet-hulled)', not: 'Endonezya usulü. Toprağımsı, yoğun.' },
        { ad: 'Anaerobik', not: 'Oksijensiz fermentasyon. Belirgin, sıra dışı.' },
        { ad: 'Bilinmiyor', not: '' }
    ];

    /* Tür ve varyete — botanik sınıflandırma. */
    var TUR = ['Arabica', 'Robusta', 'Karışık', 'Bilinmiyor'];

    var VARYETE = [
        'Typica', 'Bourbon', 'Caturra', 'Catuai', 'Mundo Novo',
        'SL28', 'SL34', 'Geisha', 'Pacamara', 'Maragogype',
        'Heirloom', 'Castillo', 'Villa Sarchi', 'Pacas', 'Bilinmiyor'
    ];

    /* Kavurma derecesi — ADLARI ortak, ama her derecenin KAÇ fire
       verdiği makineye göre değişir. O yüzden burada fire yazmıyoruz;
       uygulama kullanıcının kendi partilerinden öğreniyor. */
    var DERECE = [
        { ad: 'Açık',        not: 'İlk çatlak biter bitmez alınır. Asidite yüksek.' },
        { ad: 'Açık-orta',   not: 'İlk çatlaktan biraz sonra.' },
        { ad: 'Orta',        not: 'Denge noktası. En yaygın filtre kavurması.' },
        { ad: 'Orta-koyu',   not: 'İkinci çatlağın eşiği. Gövde artar.' },
        { ad: 'Koyu',        not: 'İkinci çatlak içinde. Kavrulma tadı öne çıkar.' },
        { ad: 'Espresso',    not: 'Makineye göre değişir; ayrı bir hedef.' }
    ];

    /* Demleme oranları — su:kahve. Bunlar TARİF, ölçüm değil;
       kullanıcı kendi zevkine göre değiştirir. */
    var DEMLEME = [
        { ad: 'Filtre (V60, Chemex)', oran: 16 },
        { ad: 'French press',          oran: 15 },
        { ad: 'Moka pot',              oran: 10 },
        { ad: 'Cold brew',             oran: 8 },
        { ad: 'Espresso',              oran: 2 }
    ];

    function sirala(liste) {
        return liste.slice().sort(function (a, b) {
            return String(a).localeCompare(String(b), 'tr');
        });
    }

    global.V = {
        MENSE: MENSE,
        MENSE_SIRALI: sirala(MENSE),
        ISLEME: ISLEME,
        TUR: TUR,
        VARYETE: VARYETE,
        VARYETE_SIRALI: sirala(VARYETE),
        DERECE: DERECE,
        DEMLEME: DEMLEME
    };
})(typeof window !== 'undefined' ? window : this);
