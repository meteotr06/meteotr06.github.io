/* =====================================================================
   ARSA REHBERİ — ÇEKİRDEK
   ---------------------------------------------------------------------
   Burada EKRAN YOK. Sadece kural, hesap ve katsayı var.

   Neden ayrı dosya?
     1) Arayüz değişse de bu dosya aynı kalır.
     2) Node ile test edilebilir; yani "çalışıyor" demek yerine ÖLÇEBİLİRİZ.

   TEMEL KURAL: Kaynağı olmayan sayı bu projede gerçek sayılmaz.
   Her katsayı bir `guven` etiketi taşır; `baslangic` etiketli bir sayıyı
   kullanıcıya bilimsel gerçek gibi göstermek YASAKTIR.
   ===================================================================== */

(function (kok) {
'use strict';

var SURUM = '0.1.0';

/* ---------------------------------------------------------------------
   0. KAYNAK KÜNYELERİ
   Koddaki katsayılar buraya atıfla açıklanır. KARARLAR.md ile aynı kodlar.
   ------------------------------------------------------------------- */
var KAYNAK = {
  K1: 'Afşar, Yılmazel & Yılmazel (2017), Konut Fiyatlarını Etkileyen ' +
      'Faktörlerin Hedonik Model ile Belirlenmesi: Eskişehir Örneği, ' +
      'Selçuk Un. Sos. Bil. Ens. Der. 37:195-205. 4311 konut, R2=0,842.',
  K2: 'Başer, V. (2020), Tarımsal Arazi Değerlemesinde Mevcut Sorunlar ve ' +
      'Çözüm Yaklaşımları, Karadeniz Fen Bil. Der. 10(2):431-442.',
  K5: 'Yargıtay 18. Hukuk Dairesi 2014/4328 E., 2014/6755 K. — belediye ' +
      'hizmeti almayan taşınmaz arazi niteliğiyle değerlemeye konu edilir.',
  K6: 'Özgüven, M. & Erenoğlu, R.C. (2020), Taşınmaz değer haritalarının CBS ile ' +
      'üretilmesi: Çanakkale örneği, Jeodezi ve Jeoinformasyon Der. 7(1):29-46. ' +
      '87 YAPISIZ ARSA parseli, 15 SPK lisanslı uzmana AHS anketi, CR=0,05. ' +
      'ARSA-ÖZEL ağırlık seti.',
  K7: 'Doldur, M. & Alkan, R.M. (2021), Nominal Değerleme Yöntemi ile CBS Destekli ' +
      'Taşınmaz Değer Haritaları: Avanos/Nevşehir, AKÜ FEMÜBİD 21(4):846-863. ' +
      'AHP CR=0,00004. Yayımlanmış PUANLAMA TABLOLARI.',
  K8: 'Kılıç, O., Başer, U. & Gülser, C. (2019), Factors explaining urban land value ' +
      'variability: Atakum, Samsun, New Medit 18(4):79-88. 2017 yılında satılmış ' +
      '64 ARSA parseli, hedonik regresyon, R2=0,798.',
  K9: 'Çakır, P. & Sesli, F.A. (2013), Arsa Vasıflı Taşınmazların Değerine Etki Eden ' +
      'Faktörler, Harita Tek. Elektronik Der. 5(3):1-16. 50 yetkin uzman ' +
      '(kamulaştırma bilirkişisi + SPK uzmanı), Cronbach alfa=0,933.',
  K10: 'Yalpır, S. & Bünyan Ünel, F. (2016), Arsa Değerlemede Kullanılan Kriterlerin ' +
       'İrdelenmesi ve Faktör Analizi ile Azaltımı, AKÜ FEMÜBİD 16(2):303-322. ' +
       'N=559 uzman, KMO=0,865. 125 soru -> 64 kriter, 10 faktör. ' +
       'ÖNEMLİ NEGATİF BULGU: "arsanın hisseli olması" ve "arsanın alanı" ' +
       'korelasyon <%30 olduğu için ELENDİ; "arsanın eğimi" faktör yükü <0,40 ' +
       'olduğu için ELENDİ.'
};

/* Güven seviyeleri. Kullanıcıya gösterilecek dil de buradan gelir. */
var GUVEN = {
  MEVZUAT:   'mevzuat',    /* kanun / yonetmelik / ictihat - tartismasiz */
  OLCULDU:   'olculdu',    /* hakemli calismada olculmus SAYI */
  KALIBRE:   'kalibre',    /* buyuklugu bizim, SIRASI uzman anketiyle denetlendi */
  BASLANGIC: 'baslangic'   /* bizim baslangic tahminimiz - denetlenmedi */
};

var GUVEN_ETIKET = {
  mevzuat:   'Mevzuat',
  olculdu:   'Olculmus',
  kalibre:   'Uzman sıralamasıyla ayarlandı',
  baslangic: 'Tahmin (kalibre edilecek)'
};

/* ---------------------------------------------------------------------
   K9 — UZMAN ONEM SIRALAMASI  (Cakir & Sesli 2013)
   50 yetkin uzman (kamulastirma bilirkisisi + SPK degerleme uzmani),
   Cronbach alfa = 0,933. 32 faktorden 15'i istatistiksel olarak ANLAMLI.
   Puanlar 0-100 olceginde ONEM derecesidir — fiyat etkisi DEGILDIR.

   NICIN BURADA: Literatur bize katsayilarin BUYUKLUGUNU vermiyor
   (K8'in betalari 2017 Samsun lirasi cinsinden, tasinmaz degil). Ama
   SIRALAMAYI veriyor. Bizim katsayilarimizin urettigi etki sirasi 50
   uzmanin sirasiyla CELISIYORSA, bu gercek bir bulgudur ve duzeltilir.

   Buyuklugu hala biz koyuyoruz; o yuzden bu faktorler `olculdu` degil
   `kalibre` etiketi tasir. Farki kullaniciya da boyle gosteriyoruz.
   ------------------------------------------------------------------- */
var K9_ONEM = {
  kaks:           82.20,  /* "Izin verilen kat adedi" */
  imar_fonksiyon: 76.90,  /* "Parsel kullanim alani" */
  ada_ici_konum:  72.20,  /* "Imar adasi icindeki konum (kose parsel)" */
  altyapi:        69.80,  /* "Kamu hizmetlerinin mevcut olusu" */
  yola_cephe:     66.50,  /* "Caddeye cikis" */
  manzara:        63.24,  /* "Manzara" */
  cephe:          62.60   /* "Cephe" */
};

/* Modelin aciklayamadigi pay. K1'de R2 = 0,842 cikti; yani en iyi ihtimalle
   %15,8 aciklanamiyor. Belirsizlik bandinin tabani bu. */
var TABAN_BELIRSIZLIK = 0.158;

/* ---------------------------------------------------------------------
   1. DÜZELTME KATSAYILARI
   Motor, emsalin ozelliklerini notrleyip hedefin ozelliklerini uygular.
   Bu yuzden mutlak deger degil, ORAN onemlidir.
   ------------------------------------------------------------------- */
var DUZELTME = {

  nitelik: {
    ad: 'Hukuki vasıf',
    soru: 'Tapuda ne yazıyor, belediye hizmeti geliyor mu?',
    guven: GUVEN.BASLANGIC,
    kaynak: 'Kategori ayrımı K5 (mevzuat). Oranlar başlangıç tahmini.',
    tip: 'secenek',
    secenek: {
      arsa:         { ad: 'Arsa - imar planı içinde, belediye hizmeti var', carpan: 1.00 },
      arsa_plansiz: { ad: 'Belediye sınırında ama imar planı yok',          carpan: 0.55 },
      arazi:        { ad: 'Arazi / tarla - belediye hizmeti yok',           carpan: 0.22 }
    }
  },

  imar_fonksiyon: {
    ad: 'İmar fonksiyonu',
    soru: 'İmar planında ne olarak görünüyor?',
    guven: GUVEN.BASLANGIC,
    kaynak: 'BAŞLANGIÇ TAHMİNİ — ve uygulamanın kendi kaynağıyla TERS DÜŞTÜĞÜ tek yer. Buradaki çarpanlar sanayiyi konutun ALTINA koyuyor (0,85 < 1,00). Aynı uygulamanın nominal yönteminde kullanılan K7 puanlama tablosu ise sanayiyi konutun ÜSTÜNE koyuyor (90 > 80). İkisi aynı ölçek değildir (biri oran, öteki ağırlıklı puan) ama SIRALAMA karşılaştırılabilir ve ters. Hangisinin doğru olduğu bölgeye göre değişir: sanayi arsası kentin yakınında konuttan değerli, uzağında değersiz olabilir. Uydurup birini seçmiyoruz. Motor iki yöntemi de koşuyor ve aralarındaki ayrışmayı banda ekliyor; sanayi seçiliyken bu ayrışma ölçüldü: %18,6. Yani belirsizlik gizlenmiyor, kullanıcıya gösteriliyor.',
    tip: 'secenek',
    secenek: {
      ticari: { ad: 'Ticaret / ticaret + konut',  carpan: 1.35 },
      konut:  { ad: 'Konut',                      carpan: 1.00 },
      turizm: { ad: 'Turizm',                     carpan: 1.15 },
      sanayi: { ad: 'Sanayi / depolama',          carpan: 0.85 },
      tarim:  { ad: 'Tarımsal nitelikli alan',    carpan: 0.30 },
      kamu:   { ad: 'Yeşil alan / yol / kamu alanı', carpan: 0.08, engel: true }
    }
  },

  /* Yapilasma hakki sureklidir; secenek degil egridir.
     Deger insa edilebilir alanla artar ama dogrusal degil: yuksek emsalde
     birim arsa payina dusen katki azalir. Ustel < 1 bunu temsil eder. */
  kaks: {
    ad: 'Yapılaşma hakkı (KAKS / Emsal)',
    soru: 'İmar durumunda emsal kaç?',
    /* GUVEN DEGISMEDI: 'baslangic'. Literatur taramasi 27.08.2026'da
       yapildi ve ISLEV BICIMINI dogruladi, BUYUKLUGU dogrulamadi.

       Ne bulundu: arsa fiyatinin emsale (FAR/KAKS) gore esnekligi,
       icbukeylik geregi KURAMSAL OLARAK 1'in ALTINDADIR — yani azalan
       getiri varsayimimiz uydurma degil, turetilmis bir sonuc. Ayrica
       esneklik SABIT DEGIL: kisit ne kadar bagliyorsa o kadar buyuyor
       ve sehir merkezinden uzaklastikca dusuyor.

       Ne BULUNAMADI: Turkiye icin olculmus bir buyukluk. Olculen aralik
       da genis — bes ABD sehrinde temel belirtimde 0,42-0,98; posta kodu
       sabit etkileri eklenince 0,09-0,52 (San Francisco'da anlamsiz).
       Ustelimiz 0,60 bu araligin ICINDE ama Turkiye'den bir sayi degil.

       GECERLILIK ALANI: kaynak bes ABD sehri (New York, Chicago,
       Washington D.C., Boston, San Francisco), 2000-2018 BOS ARSA
       satislari, kent merkezleri. Turkiye ornekte YOK. Bu sayiyi buraya
       tasimak, nominal modelde kendi koydugumuz gecerlilik alani
       kuralini cignemek olurdu. O yuzden etiket 'tahmin' KALIYOR. */
    guven: GUVEN.BASLANGIC,
    kaynak: 'İşlev biçimi (üstel < 1, azalan getiri) kuramsal olarak ' +
            'türetilmiş ve olculmustur: Brueckner & Singh (2020), Journal ' +
            'of Urban Economics 116, doi:10.1016/j.jue.2020.103239; aynı ' +
            'çerçeve Brueckner, Fu, Gu & Zhang (2017), Rev. Econ. Stat. ' +
            '99(4) 663-677 (Çin). Ölçülen esneklik aralığı 0,09-0,98 ' +
            '(şehre ve belirtime göre). ÜSTEL 0,60 bu aralığın içinde ama ' +
            'Türkiye için ÖLÇÜLMEDİ — büyüklük tahmindir.',
    tip: 'surekli',
    referans: 1.00,
    ustel: 0.60,
    carpan: function (deger) {
      var d = Number(deger);
      if (!isFinite(d) || d <= 0) return null;
      return Math.pow(d / 1.00, 0.60);
    }
  },

  yola_cephe: {
    ad: 'Yola cephe',
    soru: 'Parselin imar yoluna cephesi var mı?',
    guven: GUVEN.BASLANGIC,
    kaynak: 'Başlangıç tahmini. Cephesiz parselde ruhsat alınamaz, iskonto büyük.',
    tip: 'secenek',
    secenek: {
      kose:      { ad: 'Köşe parsel - iki yola cepheli',     carpan: 1.12 },
      imar_yolu: { ad: 'İmar yoluna cepheli',                carpan: 1.00 },
      kadastro:  { ad: 'Sadece kadastro yoluna cepheli',     carpan: 0.82 },
      yok:       { ad: 'Yola cephesi yok (sıkışmış parsel)', carpan: 0.55, engel: true }
    }
  },

  altyapi: {
    ad: 'Altyapı',
    soru: 'Elektrik, su, kanalizasyon geliyor mu?',
    guven: GUVEN.KALIBRE,
    kaynak: 'K9: 50 uzman anketinde 15 anlamlı faktör arasında 4. sırada ' +
            '(69,80/100) — "caddeye çıkış"tan (66,50) DAHA önemli bulunmuş. ' +
            'Bizim ilk tahminimiz bunu 7. sıraya koyuyordu; etki aralığı ' +
            'yükseltildi. Büyüklük hâlâ bizim, sadece SIRASI denetlendi.',
    tip: 'secenek',
    secenek: {
      tam:   { ad: 'Elektrik + su + kanalizasyon var', carpan: 1.00 },
      kismi: { ad: 'Bir kısmı var',                    carpan: 0.84 },
      yok:   { ad: 'Hiçbiri yok',                      carpan: 0.66 }
    }
  },

  konum: {
    ad: 'Yerleşim içindeki konum',
    soru: 'Merkeze göre neresi?',
    guven: GUVEN.OLCULDU,
    kaynak: 'K1: mahalle katsayıları +%5,5 ile +%20,6 arasında ölçüldü. ' +
            'Bandın genişliği oradan gelir; seçenek eşleşmesi tahminidir.',
    tip: 'secenek',
    secenek: {
      merkez: { ad: 'Merkez / gelişmiş mahalle', carpan: 1.21 },
      orta:   { ad: 'Orta konum',                carpan: 1.06 },
      kenar:  { ad: 'Yerleşim kenarı',           carpan: 1.00 },
      disi:   { ad: 'Yerleşim dışı',             carpan: 0.80 }
    }
  },

  tapu_turu: {
    ad: 'Tapu türü',
    soru: 'Tapu müstakil mi, hisseli mi?',
    guven: GUVEN.BASLANGIC,
    kaynak: 'ÖLÇÜLMÜŞ ARALIK VAR, TÜRKİYE İÇİN DEĞİL. Bölünmemiş pay (fractional / undivided interest) iskontosu için uygulamadan derlenmiş aralık: en düşük %15, en yüksek %67; işlemlerin ÇOĞUNLUĞU %25-35 arasında (Valbridge Property Advisors, Fractional Interest Discounts in Real Estate, Beyaz Kitap, Mayıs 2020). Buradaki 0,68 yani -%32 bu çoğunluk bandının içinde. AMA ÜÇ ÇEKİNCE: (1) kaynak hakemli bir çalışma değil, değerleme uzmanlarının piyasa deneyimi; örneklem sayısı verilmemiş. (2) ABD miras ve hibe vergisi değerlemesi bağlamı; hukuki kurum Türk hukukundaki paylı mülkiyetle aynı değil. (3) Türkiye için ÖLÇÜLMEDİ. K10 kaynağındaki 559 uzmanlı çalışmada bu ölçütün korelasyonu %30 altında kaldığı için elenmişti; yani Türkiye verisinde sayısal dayanak hâlâ YOK. Bu yüzden güven seviyesi TAHMİN kaldı: büyüklük dış kaynakla tutarlı ama doğrulanmış değil.',
    tip: 'secenek',
    secenek: {
      mustakil: { ad: 'Müstakil (tam) tapu',               carpan: 1.00 },
      hisseli:  { ad: 'Hisseli tapu (müşterek mülkiyet)',  carpan: 0.68 },
      /* 0,60 (-%40) yukaridaki bandin DISINDA ve bir cikarim: hisseli olmanin ustune fiili taksim ve ifraz imkansizligi biniyor. Valbridge aralığının üst yarısında (15-67) ama çoğunluk bandının (25-35) dışında. Bileşik kusur için daha derin iskonto makul görünüyor, ama bu ÇIKARIM, ölçüm değil. */
      ifrazsiz: { ad: 'Hisseli + fiili taksim, ifraz yok', carpan: 0.60 }
    }
  },

  egim: {
    ad: 'Eğim',
    soru: 'Arazi düz mü, meyilli mi?',
    guven: GUVEN.BASLANGIC,
    kaynak: 'Başlangıç tahmini. Eğim inşaat maliyetini artırır.',
    tip: 'secenek',
    secenek: {
      duz:   { ad: 'Düz (%0-5)',           carpan: 1.00 },
      hafif: { ad: 'Hafif meyil (%5-15)',  carpan: 0.94 },
      dik:   { ad: 'Dik (%15 üzeri)',      carpan: 0.80 }
    }
  },

  geometri: {
    ad: 'Parsel şekli',
    soru: 'Parselin şekli düzgün mü?',
    guven: GUVEN.KALIBRE,
    kaynak: 'K8: Atakum/Samsun, 64 arsa parseli, hedonik regresyon. Düzgün ' +
            'şekilli parsel düzensiz olandan +138,11 TL/m2 pahalı (p<0,05, ' +
            'İSTATİSTİKSEL OLARAK ANLAMLI). Aynı modelde 1 birim emsal artışı ' +
            '+233,06 TL/m2; yani şekil, emsalin yaklaşık %59 kadarı etkili. ' +
            'İlk tahminimiz şekli en zayıf faktör yapıyordu, güçlendirildi. ' +
            'Mutlak TL değerleri 2017 Samsun fiyatıdır, taşınmaz.',
    tip: 'secenek',
    secenek: {
      duzgun:   { ad: 'Düzgün (kare / dikdörtgen)', carpan: 1.00 },
      duzensiz: { ad: 'Düzensiz şekilli',           carpan: 0.90 },
      dar:      { ad: 'Çok dar / uzun şerit',       carpan: 0.80 }
    }
  }
};

/* Motorun dikkate alacagi faktorler ve sirasi */
var FAKTOR_SIRASI = ['nitelik', 'imar_fonksiyon', 'kaks', 'yola_cephe',
                     'altyapi', 'konum', 'tapu_turu', 'egim', 'geometri'];

/* ---------------------------------------------------------------------
   2. YARDIMCILAR
   ------------------------------------------------------------------- */
/* TEK COZUMLEYICI. Bu fonksiyon eskiden `Number(x)` idi ve dogrudan
   asagidaki `sayi_oku`nun onlemek icin yazildigi hatayi yapiyordu:

       sayi("1.000")  ->  1        (1000 kat yanlis)

   Yani bu dosyada, birbirinden 7 satir uzakta, biri digerinin cozdugu
   sorunu yeniden ureten IKI cozumleyici duruyordu -- ve naif olani,
   uyariyi yazan yorumun hemen ustundeydi.

   Olculdu (27.08.2026): kullaniciya ULASMIYORDU, cunku `arayuz.js`
   kendi `sayi()`sini tanimlayip `C.sayi_oku`ya baglamis. Ama:
     - `cekirdek.js` belgelenmis bir API; `test.html` dogrudan cagiriyor,
     - iki dosyada AYNI ADLA iki farkli davranis vardi,
     - arayuzun korumasi bir tercihti, sozlesme degildi.
   Ulasilamayan bir hata, ulasilmaz KALACAGI anlamina gelmiyor.

   `tur` parametresi zorunlu: oran alanlarinda (TAKS/KAKS) ayrac HER
   ZAMAN ondalik olmalidir, yoksa "1,500" KAKS 1500 okunur. */
/* TURKCE SAYI YAZIMI CIKTIDA DA GECERLIDIR.
   Butun gun GIRDI tarafi kovalandi ("1.500" -> 1,5 hatasi). Cikti tarafi
   hic sorulmamisti. Ekranda "ayrisma %13.7" ve "12.00 m" yaziyordu:
   JavaScript ondalik ayraci NOKTA koyar, Turkce'de ayrac VIRGULDUR.
   Turkiye'de nokta BINLIK ayracidir; "%13.7" okuyan biri 137 anlayabilir.
   Girdi hatasiyla ayni sinif: sessiz yanlis sayi. */
function tr_sayi(x, basamak) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    return Number(x).toLocaleString('tr-TR', {
        minimumFractionDigits: basamak || 0,
        maximumFractionDigits: basamak === undefined ? 1 : basamak
    });
}

function sayi(x, tur) {
  return sayi_oku(x, tur);
}

/* ---------------------------------------------------------------------
   TURKCE SAYI COZUMLEYICI
   ---------------------------------------------------------------------
   NEDEN VAR: Turkiye'de binlik ayraci NOKTA, ondalik ayraci VIRGULdur.
   Kullanici "1.500,50" yazar. Yaygin cozum olan basit virgul->nokta
   donusumu bunu "1.500.50" yapar ve parseFloat 1,5 okur.

       1.500,50 TL   ->   1,5 TL      (1000 kat yanlis)

   Cokme yok, hata mesaji yok — sadece sessizce yanlis sayi. Bu projede
   yanlis sayi birinin parasi demek; en tehlikeli hata sinifi budur.

   KURAL: Hem nokta hem virgul varsa, SONDAKI ondalik ayracidir.
   Tek basina virgul varsa ondalik kabul edilir (12,5).
   Tek basina nokta varsa ve 3'lu gruplama kalibina uyuyorsa (1.234.567)
   binlik ayracidir; uymuyorsa ondalik kabul edilir (1500.50).

   Bu fonksiyon bilerek disa aciliyor — ayni hata butun Turkce sayi alan
   uygulamalarda var, kardes projeler bunu kopyalasin diye.
   ------------------------------------------------------------------- */
function sayi_oku(girdi, tur) {
  if (girdi === null || girdi === undefined) return null;
  if (typeof girdi === 'number') return isFinite(girdi) ? girdi : null;

  var m = String(girdi).trim().replace(/\s/g, '');
  if (!m) return null;

  /* Para/olcu isaretlerini at: TL, ₺, m2 vb. */
  m = m.replace(/[₺]/g, '').replace(/TL/gi, '').replace(/m²|m2/gi, '');
  if (!m) return null;

  var sonNokta = m.lastIndexOf('.');
  var sonVirgul = m.lastIndexOf(',');

  /* ═══ BAGLAM OLMADAN COZULEMEYEN DURUM ═══
     "1,500" ne demek? Fiyat alaninda 1500 TL, oran alaninda 1,5.
     "0,300" ise HICBIR alanda 300 degildir — kimse 300'u boyle yazmaz.
     Bu iki kural olmadan katsayi 1000 kat sisiyordu:
        TAKS "0,300"  -> 300      (dogrusu 0,3)
        KAKS "1,500"  -> 1500     (dogrusu 1,5)
     256 sinama bunu goremedi cunku uc ondalik haneli yazim hic denenmemisti.
     Kardes projedeki `tur="oran"` cozumunun aynisi. */
  var oranMi = (tur === 'oran');
  /* Basta tek basina "0" varsa binlik gruplama OLAMAZ: 0.300 / 0,250 */
  var sifirlaBasliyor = /^-?0[.,]/.test(m);
  var binlikOlabilir = !oranMi && !sifirlaBasliyor;

  if (sonNokta !== -1 && sonVirgul !== -1) {
    /* Ikisi de var: sondaki ondalik, digeri binlik */
    if (sonVirgul > sonNokta) m = m.replace(/\./g, '').replace(',', '.');
    else                      m = m.replace(/,/g, '');
  } else if (sonVirgul !== -1) {
    /* Sadece virgul.
       TEK virgul BELIRSIZDIR: "1,500" Turkce yazimda 1,5 demektir ama
       Ingilizce yazimda 1500. Turkce uygulamada Turkce yorum kazanir.
       IKI VEYA DAHA COK virgul ise belirsiz DEGILDIR: ondalik ayraci iki
       kez gelemez, o halde binlik ayracidir — ama gruplarin gercekten
       ucer haneli olmasi sart ("1,2,3" binlik degildir, bozuk girdidir).
       Ayni denetim nokta icin zaten vardi; virgulde yoktu. Asimetriydi. */
    if (binlikOlabilir && /^-?\d{1,3}(,\d{3})+$/.test(m)) m = m.replace(/,/g, '');
    else m = m.replace(/,/g, '.');
  } else if (sonNokta !== -1) {
    /* Sadece nokta: 3'lu gruplama kalibina uyuyorsa binlik ayracidir */
    if (binlikOlabilir && /^-?\d{1,3}(\.\d{3})+$/.test(m)) m = m.replace(/\./g, '');
  }

  /* BICIMI PARSEFLOAT'TAN ONCE DOGRULA.
     parseFloat ONDEN okur ve gerisini SESSIZCE ATAR:
        "12abc" -> 12      "0x1F" -> 0
        "1.2.3" -> 1,2     "1_000" -> 1     <-- yine 1000 kat hata
     Hicbiri hata vermez, hicbiri uyarmaz. Ayni sinif, ikinci kez.
     Kardes oturumun (01) ortak sinama kumesi bunlari yakaladi.

     "1e3" gibi bilimsel yazim da reddediliyor: arsa alani yazan kimse boyle
     yazmaz, kabul etmek sessiz kabul riski demek.
     KARAR: belirsiz girdide SAYI URETME. */
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(m)) return null;

  var d = parseFloat(m);
  return isFinite(d) ? d : null;
}

function yuvarla(x, basamak) {
  var k = Math.pow(10, basamak || 0);
  return Math.round(x * k) / k;
}

function carpan_bul(anahtar, deger) {
  var f = DUZELTME[anahtar];
  if (!f || deger === undefined || deger === null || deger === '') return null;
  if (f.tip === 'surekli') return f.carpan(deger);
  var s = f.secenek[deger];
  return s ? s.carpan : null;
}

function secenek_adi(anahtar, deger) {
  var f = DUZELTME[anahtar];
  if (!f) return String(deger);
  if (f.tip === 'surekli') return 'Emsal ' + deger;
  return (f.secenek[deger] && f.secenek[deger].ad) || String(deger);
}

/* ---------------------------------------------------------------------
   SIRALAMA DENETIMI — katsayilarimiz uzmanlarla celisiyor mu?
   Her faktorun urettigi ETKI ARALIGI (en iyi secenek / en kotu secenek)
   hesaplanir ve K9'daki 50 uzmanin onem sirasiyla karsilastirilir.
   Buyuklugu denetleyemiyoruz ama SIRAYI denetleyebiliriz.
   ------------------------------------------------------------------- */
function etki_araligi(anahtar) {
  var f = DUZELTME[anahtar];
  if (!f) return null;
  if (f.tip === 'surekli') {
    /* Surekli faktorde makul kullanim araliginin uclari alinir */
    var alt = f.carpan(0.20), ust = f.carpan(4.00);
    return (alt && ust) ? ust / alt : null;
  }
  /* ENGEL secenekleri disarida birakilir.
     "Parselin tamami kamu alaninda" ya da "yola cephesi yok" birer DEGER
     KADEMESI degil, RUHSAT ENGELIDIR — yeri risk taramasi. Bunlari deger
     katsayisinin arligina katmak, K9'un ayri kriter olarak olctugu seyi
     baska bir kriterin icine saklamak olur ve siralamayi bozar.
     (K9'da "parselin tamami kamusal alana denk gelmesi" ayri bir kriter ve
     77,74 puanla en ustlerde; biz onu imar fonksiyonunun icine gomuyorduk.) */
  var degerler = Object.keys(f.secenek).filter(function (k) {
    return !f.secenek[k].engel;
  }).map(function (k) {
    return f.secenek[k].carpan;
  }).filter(function (x) { return isFinite(x) && x > 0; });
  if (!degerler.length) return null;
  return Math.max.apply(null, degerler) / Math.min.apply(null, degerler);
}

function siralama_denetimi() {
  /* K9'un kapsadigi ve bizde karsiligi olan faktorler */
  var eslesen = Object.keys(K9_ONEM).filter(function (k) { return !!DUZELTME[k]; });

  var bizim = eslesen.map(function (k) {
    return { anahtar: k, ad: DUZELTME[k].ad, aralik: etki_araligi(k),
             uzman_puan: K9_ONEM[k] };
  }).filter(function (x) { return x.aralik !== null; });

  var bizimSira = bizim.slice().sort(function (a, b) { return b.aralik - a.aralik; })
                       .map(function (x) { return x.anahtar; });
  var uzmanSira = bizim.slice().sort(function (a, b) { return b.uzman_puan - a.uzman_puan; })
                       .map(function (x) { return x.anahtar; });

  /* Ikili karsilastirma: kac cift ters sirada? */
  var celiski = [];
  for (var i = 0; i < uzmanSira.length; i++) {
    for (var j = i + 1; j < uzmanSira.length; j++) {
      var ust = uzmanSira[i], alt = uzmanSira[j];
      if (bizimSira.indexOf(ust) > bizimSira.indexOf(alt)) {
        celiski.push({ uzmana_gore_ustun: ust, bize_gore_ustun: alt });
      }
    }
  }

  return {
    karsilastirilan: bizim.length,
    faktorler: bizim.sort(function (a, b) { return b.aralik - a.aralik; }),
    bizim_sira: bizimSira,
    uzman_sira: uzmanSira,
    celiski: celiski,
    kaynak: KAYNAK.K9
  };
}

/* ---------------------------------------------------------------------
   3. HUKUKI VASIF TESTI  —  uygulamanin ILK sorusu
   Kaynak K5: belediye / mucavir alan icinde OLSA BILE yol, su, elektrik,
   ulasim, cop, kanalizasyon, aydinlatma hizmetlerinden yararlanmayan
   tasinmaz ARAZI sayilir.
   Insanlarin en cok kaziklandigi yer burasi: "belediyede arsa" diye
   satilan sey hukuken arazi olabiliyor ve degeri kat kat dusuk.
   ------------------------------------------------------------------- */
var BELEDIYE_HIZMETLERI = ['yol', 'su', 'elektrik', 'ulasim',
                           'cop', 'kanalizasyon', 'aydinlatma'];

var HIZMET_ADI = {
  yol: 'Yol', su: 'Su', elektrik: 'Elektrik', ulasim: 'Ulasim',
  cop: 'Çöp toplama', kanalizasyon: 'Kanalizasyon', aydinlatma: 'Aydinlatma'
};

function vasif_belirle(g) {
  g = g || {};
  /* !! KULLANMIYORUZ: undefined'i false'a cevirirdi ve ucuncu hal
     dogmadan olurdu. Uc hal: true · false · undefined. */
  var belediye_icinde = g.belediye_icinde === true;
  var imar_plani = !!g.imar_plani_var;
  var hizmet = g.hizmetler || {};

  var gelen = [], gelmeyen = [];
  BELEDIYE_HIZMETLERI.forEach(function (h) {
    (hizmet[h] ? gelen : gelmeyen).push(h);
  });

  var kod, sonuc, gerekce;

  /* UCUNCU HAL — "CEVAPLANMADI".
     Olculdu (29.08.2026): belediye sorusu bir ONAY KUTUSU idi ve
     isaretsiz kutu "hayir" sayiliyordu. Ama ana sayfa "Sadece ilk iki
     alani doldurup da sonuc alabilirsiniz" diyor; o yolu izleyen
     kullanicinin parseli, HIC CEVAPLAMADIGI bir soru yuzunden ARAZI
     damgasi yiyor, degeri 0,22 ile carpiliyor (%78 dusuyor) ve raporun
     ustune "kritik engel" bandi biniyor. 3.000 TL/m2 giren kullanici
     660 TL/m2 goruyordu.
     Onay kutusu UC HALI TASIYAMAZ: "evet", "hayir" ve "bilmiyorum"
     ayri seylerdir. Bilmediğimizi soylemek, yanlis tahminden iyidir --
     ve motor bunu ZATEN biliyor: bilinmeyen faktor `eksik`e dusuyor,
     duzeltme atlaniyor ve bant geniisliyor ("belirsizligi buyutuyoruz").
     Burada yapilan, o duzenege baglanmaktan ibaret. */
  if (g.belediye_icinde === undefined || g.belediye_icinde === null) {
    kod = 'bilinmiyor';
    sonuc = 'BELİRSİZ';
    gerekce = 'Belediye / mücavir alan sorusu henüz cevaplanmadı. ' +
              'Bu tek cevap değeri kat kat değiştirir, o yüzden ' +
              'tahmin edilmiyor.';
  } else if (!belediye_icinde) {
    kod = 'arazi';
    sonuc = 'ARAZİ';
    gerekce = 'Belediye veya mücavir alan sınırları dışında.';
  } else if (gelen.length === 0) {
    kod = 'arazi';
    sonuc = 'ARAZİ';
    gerekce = 'Belediye sınırında olsa da hiçbir belediye hizmeti gelmiyor. ' +
              'K5 uyarınca arazi niteliğinde değerlendirilir.';
  } else if (!imar_plani) {
    kod = 'arsa_plansiz';
    sonuc = 'ARSA (imar planı yok)';
    gerekce = 'Belediye hizmeti var ama imar planı bulunmuyor; yapılaşma ' +
              'hakkı belirsiz.';
  } else {
    kod = 'arsa';
    sonuc = 'ARSA';
    gerekce = 'İmar planı içinde ve belediye hizmetlerinden yararlanıyor.';
  }

  return {
    kod: kod,
    sonuc: sonuc,
    gerekce: gerekce,
    gelen_hizmetler: gelen.map(function (h) { return HIZMET_ADI[h]; }),
    eksik_hizmetler: gelmeyen.map(function (h) { return HIZMET_ADI[h]; }),
    guven: GUVEN.MEVZUAT,
    kaynak: KAYNAK.K5
  };
}

/* ---------------------------------------------------------------------
   4. IMAR HESABI  —  "bu arsaya ne yapabilirim?"
   TAKS : taban alani katsayisi - zeminde kaplanabilecek alan orani
   KAKS : (emsal) toplam insaat alani orani
   ------------------------------------------------------------------- */
function imar_hesapla(g) {
  g = g || {};
  var alan = sayi(g.alan);
  var taks = sayi(g.taks, 'oran');
  var kaks = sayi(g.kaks, 'oran');
  var kat  = sayi(g.kat_adedi);
  var uyari = [];

  if (!alan || alan <= 0) return { hata: 'Arsa alanı girilmedi.' };

  /* KAKS yoksa ama TAKS + kat adedi varsa turetilebilir. */
  if (!kaks && taks && kat) {
    kaks = taks * kat;
    uyari.push('KAKS girilmedi; TAKS x kat adedi ile türetildi (' +
               yuvarla(kaks, 2) + ').');
  }
  /* Tersi de mumkun. */
  if (!taks && kaks && kat) {
    taks = kaks / kat;
    uyari.push('TAKS girilmedi; KAKS / kat adedi ile türetildi (' +
               yuvarla(taks, 2) + ').');
  }

  if (!kaks) {
    return { hata: 'Emsal (KAKS) bilinmeden inşaat alanı hesaplanamaz.',
             uyari: uyari };
  }

  var taban  = taks ? alan * taks : null;
  var toplam = alan * kaks;
  var tahmini_kat = (taks && taks > 0) ? kaks / taks : null;

  /* Daire sayisi kaba tahmindir; brut daire alani disaridan degistirilebilir. */
  var brut_daire = sayi(g.brut_daire_alani) || 120;
  var daire = Math.floor(toplam / brut_daire);

  return {
    alan: alan,
    taks: taks,
    kaks: kaks,
    taban_alani: taban ? yuvarla(taban, 1) : null,
    toplam_insaat_alani: yuvarla(toplam, 1),
    tahmini_kat_adedi: tahmini_kat ? yuvarla(tahmini_kat, 1) : null,
    brut_daire_alani: brut_daire,
    tahmini_daire_sayisi: daire,
    uyari: uyari,
    not: 'Çekme mesafeleri, minimum parsel büyüklüğü ve emsal harici alanlar ' +
         '(bodrum, otopark, sığınak) belediyenin imar durum belgesinde yazar. ' +
         'Bu hesap ÜST SINIRDIR; gerçek proje daha küçük çıkabilir.'
  };
}

/* ---------------------------------------------------------------------
   5. DEGER TAHMINI  —  emsal duzeltme motoru
   Mutlak fiyati BIZ VERMIYORUZ; kullanici emsali verir, biz duzeltiriz.
   Neden? Hedonik katsayilar yereldir (K1). Mutlak fiyat sehirden sehre
   tasinmaz, ama "yola cephesi yoksa deger duser" kurali tasinir.
   ------------------------------------------------------------------- */
function deger_tahmini(emsal, hedef) {
  emsal = emsal || {};
  hedef = hedef || {};

  var birim = sayi(emsal.birim_fiyat);
  if (!birim || birim <= 0) {
    return { hata: 'Emsal birim fiyatı (TL/m2) girilmeden tahmin yapılamaz.' };
  }
  var alan = sayi(hedef.alan);

  var duzeltmeler = [];
  var eksik = [];
  var toplam_oran = 1;
  var baslangic_sayisi = 0;

  FAKTOR_SIRASI.forEach(function (anahtar) {
    var f  = DUZELTME[anahtar];
    var ce = carpan_bul(anahtar, emsal[anahtar]);
    var ch = carpan_bul(anahtar, hedef[anahtar]);

    /* Biri bilinmiyorsa duzeltme yapilamaz. Bunu SAKLAMIYORUZ;
       belirsizligi buyutuyoruz. */
    if (ce === null || ch === null) {
      eksik.push({ anahtar: anahtar, ad: f.ad, soru: f.soru });
      return;
    }

    var oran = ch / ce;
    if (!isFinite(oran) || oran <= 0) return;

    toplam_oran *= oran;

    /* KATSAYI BELIRSIZLIGI, KATSAYI IS YAPTIGI KADAR ONEMLIDIR.
       Onceden her `baslangic` katsayi icin sabit pay ekliyorduk. Sonuc:
       emsalle BIREBIR AYNI bir parselde bile bant +/-%27,8 cikiyordu —
       yani "arsan 8,6 ile 15,3 milyon arasi eder". Kullaniciya hicbir
       sey soylemeyen bir aralik.
       Gercek su: duzeltme carpani 1,00 ise o katsayinin belirsizligi
       sonuca hic bulasmaz. Ancak 1'den saptigi olcude bulasir.
       Gercek senaryo denemesinde bulundu; birim sinamalar goremezdi. */
    var pay = (f.guven === GUVEN.BASLANGIC) ? 0.020
            : (f.guven === GUVEN.KALIBRE)   ? 0.010
            : 0;
    if (pay > 0) {
      var sapma = Math.min(1, Math.abs(oran - 1) / 0.50);
      baslangic_sayisi += pay * sapma;
    }

    duzeltmeler.push({
      anahtar: anahtar,
      ad: f.ad,
      emsal_durum: secenek_adi(anahtar, emsal[anahtar]),
      hedef_durum: secenek_adi(anahtar, hedef[anahtar]),
      oran: yuvarla(oran, 4),
      etki_yuzde: yuvarla((oran - 1) * 100, 1),
      guven: f.guven,
      guven_etiket: GUVEN_ETIKET[f.guven],
      kaynak: f.kaynak
    });
  });

  /* Belirsizlik bandi:
       taban  (modelin aciklayamadigi pay, K1)
     + her baslangic katsayisi icin kucuk pay
     + her eksik bilgi icin daha buyuk pay
     Boylece "az bilgi girdim ama net rakam aldim" yanilsamasi olusmaz. */
  /* baslangic_sayisi artik "adet" degil, dogrudan belirsizlik payi */
  var belirsizlik = TABAN_BELIRSIZLIK +
                    baslangic_sayisi +
                    eksik.length * 0.045;
  if (belirsizlik > 0.60) belirsizlik = 0.60;

  var orta = birim * toplam_oran;
  var alt  = orta * (1 - belirsizlik);
  var ust  = orta * (1 + belirsizlik);

  var sonuc = {
    emsal_birim_fiyat: birim,
    toplam_duzeltme: yuvarla(toplam_oran, 4),
    net_etki_yuzde: yuvarla((toplam_oran - 1) * 100, 1),
    birim_fiyat: { alt: yuvarla(alt, 0), orta: yuvarla(orta, 0), ust: yuvarla(ust, 0) },
    bant_yuzde: yuvarla(belirsizlik * 100, 1),
    duzeltmeler: duzeltmeler,
    eksik_bilgi: eksik
  };

  if (alan && alan > 0) {
    sonuc.alan = alan;
    /* Toplam, GOSTERILEN birim fiyattan hesaplanir — ham degerden degil.
       Yoksa kullanici birim fiyati alan ile carptiginda ekrandaki toplamla
       tutmuyor: olculdu, 4.567 m2'de fark 1.098 TL. Ekranda ayni seyin iki
       farkli sayisi olmamali; kidem tazminati aracindaki hata tam bu siniftandi.
       GUNCEL (29.08.2026): bu deger ARTIK ekranda gosteriliyor --
       `arayuz.js` icindeki "... m2 icin toplam" satiri dogrudan
       `toplam_deger.orta` okuyor. Yorumun eski hali "gosterilmiyor"
       diyordu; okuyani "bu kullanilmiyor, degistirsem zarari yok"
       diye yaniltabilirdi. Ekrandaki toplam bu satira baglidir. */
    sonuc.toplam_deger = {
      alt:  yuvarla(sonuc.birim_fiyat.alt  * alan, 0),
      orta: yuvarla(sonuc.birim_fiyat.orta * alan, 0),
      ust:  yuvarla(sonuc.birim_fiyat.ust  * alan, 0)
    };
  }

  sonuc.guven_notu =
    'Bu bir DEĞERLEME RAPORU DEĞİLDİR, bilgilendirme amaçlıdır. ' +
    'Hakemli bir hedonik modelin bile açıklama gücü %84 civarındadır (K1); ' +
    'yani en iyi durumda bile fiyatın yaklaşık altıda biri aciklanamaz. ' +
    (eksik.length ? (eksik.length + ' bilgi eksik olduğu için bant genişledi. ') : '') +
    'Kesin değer için SPK lisanslı değerleme uzmanına başvurun.';

  return sonuc;
}

/* ---------------------------------------------------------------------
   6. RISK TARAMASI  —  "bu arsaya para vermeden once"
   Amac magduriyeti onlemek. Her madde NE YAPILMASI gerektigini de soyler.
   ------------------------------------------------------------------- */
function risk_tara(g) {
  g = g || {};
  var bulgular = [];

  function ekle(seviye, baslik, aciklama, ne_yapmali) {
    bulgular.push({ seviye: seviye, baslik: baslik,
                    aciklama: aciklama, ne_yapmali: ne_yapmali });
  }

  var vasif = vasif_belirle(g);

  if (vasif.kod === 'bilinmiyor') {
    ekle('uyari', 'Belediye sınırı sorusu cevaplanmadı',
      'Taşınmazın belediye veya mücavir alan sınırları içinde olup olmadığı ' +
      'girilmedi. Bu tek cevap, arsa ile arazi arasındaki farkı belirler ve ' +
      'değeri kat kat değiştirir; tahmin edilmedi, değer aralığı geniş bırakıldı.',
      'Belediyeye sorun ya da tapu kaydına bakın. Cevapladığınızda hem vasıf ' +
      'kesinleşir hem değer aralığı daralır.');
  } else if (vasif.kod === 'arazi') {
    ekle('kritik', 'Bu taşınmaz hukuken ARSA değil, ARAZİ',
      vasif.gerekce + ' Arazi vasfindaki taşınmazın değeri arsaya göre kat kat düşüktür.',
      'Satıcı "arsa" diyorsa tapu kaydını ve belediyeden imar durumunu isteyin. ' +
      'Eksik hizmetler: ' + (vasif.eksik_hizmetler.join(', ') || '-'));
  } else if (vasif.kod === 'arsa_plansiz') {
    ekle('uyari', 'İmar planı yok',
      'Belediye hizmeti var ama imar planı bulunmuyor; ne yapabileceğiniz belirsiz.',
      'Belediyeden imar durum belgesi (çap) isteyin. Plan yapilana kadar ' +
      'inşaat ruhsatı alinamayabilir.');
  }

  if (g.tapu_turu === 'hisseli' || g.tapu_turu === 'ifrazsiz') {
    ekle('kritik', 'Hisseli tapu',
      'Müşterek mülkiyette parselin belirli bir yeri size ait değildir; ' +
      'tamamında hisseniz vardır. Diğer hissedarlar olmadan satış, ipotek ve ' +
      'inşaat süreçleri tıkanır.',
      'İfraz (ayırma) mümkün mü, belediyeden sorun. Diğer hissedarların sayısını ' +
      've satış niyetlerini öğrenin. "Fiilen su köşe senin" sözü hukuken ' +
      'bağlayıcı DEĞİLDİR.');
  }

  if (g.yola_cephe === 'yok') {
    ekle('kritik', 'Yola cephesi yok',
      'İmar yoluna cephesi olmayan parselde kural olarak inşaat ruhsatı alınamaz.',
      'Tevhid (birleştirme) veya geçit hakkı gerekir. Bunlar komşu parsel ' +
      'sahibinin rızasına bağlıdır - yani sizin elinizde değildir.');
  } else if (g.yola_cephe === 'kadastro') {
    ekle('uyari', 'Sadece kadastro yoluna cepheli',
      'Kadastro yolu imar yolu değildir; ruhsat için yeterli olmayabilir.',
      'Belediyeden yolun imar planındaki durumunu teyit ettirin.');
  }

  if (g.takyidat_var) {
    ekle('kritik', 'Tapuda şerh / takyidat var',
      'İpotek, haciz, irtifak veya beyanlar taşınmazın kullanımını ve satışını kısıtlar.',
      'Tapu kaydının takyidatlı tam örneğini alın ve her satırı sorgulayın.');
  }

  if (g.kamulastirma_riski) {
    ekle('uyari', 'Kamulaştırma / yol geçirme ihtimali',
      'İmar planında yol, park veya kamu alanına isabet eden kısım bedelsiz ' +
      'terk edilebilir veya kamulaştırılabilir.',
      'İmar planını parsel üzerinde okutun; terke konu alan yüzdesini öğrenin.');
  }

  if (g.altyapi === 'yok') {
    ekle('uyari', 'Altyapı yok',
      'Elektrik, su ve kanalizasyon yoksa bunları getirme maliyeti alıcıya aittir ' +
      've bazen arsa bedelini aşar.',
      'İlgili idarelerden abonelik ve altyapı getirme maliyetini YAZILI sorun.');
  }

  if (g.egim === 'dik') {
    ekle('bilgi', 'Dik arazi',
      'Eğim; istinat duvarı, hafriyat ve temel maliyeti demektir.',
      'İnşaat maliyetine eğim payı ekleyin; proje öncesi zemin etudu yaptırın.');
  }

  var sirala = { kritik: 0, uyari: 1, bilgi: 2 };
  bulgular.sort(function (a, b) { return sirala[a.seviye] - sirala[b.seviye]; });

  return {
    vasif: vasif,
    bulgular: bulgular,
    kritik_sayisi: bulgular.filter(function (b) { return b.seviye === 'kritik'; }).length,
    uyari_sayisi:  bulgular.filter(function (b) { return b.seviye === 'uyari'; }).length,
    bilgi_sayisi:  bulgular.filter(function (b) { return b.seviye === 'bilgi'; }).length
  };
}

/* =====================================================================
   7. NOMINAL DEGERLEME MODULU   —  ikinci, bagimsiz yontem
   ---------------------------------------------------------------------
   Neden ikinci bir yontem?
     Bolum 5'teki carpan motoru bizim kurdugumuz bir modeldi. Bu modul ise
     TAMAMEN YAYIMLANMIS sayilarla calisir: agirliklar K6'dan (Canakkale,
     87 arsa parseli, 15 SPK uzmani, CR=0,05), puanlama tablolari K7'den
     (Avanos, AHP CR=0,00004).

   Nasil calisir?
     Her parsel 0-100 arasi bir "nominal puan" alir. Emsalin ve hedefin
     puanlari oranlanir:  hedef_birim = emsal_birim x (puan_h / puan_e)
     Bu, Yomralioglu'nun nominal degerleme yonteminin ta kendisidir.

   Neden bu daha guclu?
     - Birimsizdir: 2017 fiyatiyla kalibre edilmis TL katsayilari gibi
       enflasyonla bozulmaz.
     - Agirliklar hakemli yayindan gelir, bizim tahminimiz degildir.
   ===================================================================== */

/* K6 — Canakkale AHS agirliklari (toplam 99,90; yayindaki haliyle). */
var NOMINAL_AGIRLIK = {
  yapilasma_hakki:  { agirlik: 16.70, ad: 'Toplam inşaat alanı (emsal)' },
  kamu_hizmetleri:  { agirlik: 15.00, ad: 'Kamu hizmetlerinden yararlanma' },
  ada_kullanimi:    { agirlik: 13.40, ad: 'İmar durumunda ada kullanımı' },
  depremsellik:     { agirlik:  9.00, ad: 'Depremsellik' },
  zemin:            { agirlik:  8.90, ad: 'Zemin durumu' },
  egim:             { agirlik:  8.50, ad: 'Eğim' },
  ada_ici_konum:    { agirlik:  5.90, ad: 'Ada içindeki konum (köşe/ara)' },
  parsel_sekli:     { agirlik:  4.70, ad: 'Parsel şekli' },
  baki:             { agirlik:  4.20, ad: 'Bakı' },
  manzara:          { agirlik:  3.30, ad: 'Manzara' },
  ana_cadde:        { agirlik:  2.60, ad: 'Ana caddeye uzaklık' },
  merkez:           { agirlik:  2.50, ad: 'Merkeze uzaklık' },
  egitim:           { agirlik:  1.90, ad: 'Eğitim alanına uzaklık' },
  yesil_alan:       { agirlik:  1.70, ad: 'Yeşil alana uzaklık' },
  saglik:           { agirlik:  1.60, ad: 'Sağlık alanına uzaklık' }
};

/* K7 — Avanos mesafe/puan tablosu. Yakinlik faktorlerinin tamaminda ayni. */
function puan_mesafe(m) {
  var d = sayi(m);
  if (d === null || d < 0) return null;
  if (d <=  24) return 100;
  if (d <=  49) return  90;
  if (d <=  74) return  80;
  if (d <=  99) return  70;
  if (d <= 124) return  60;
  if (d <= 149) return  50;
  if (d <= 174) return  40;
  if (d <= 199) return  30;
  if (d <= 249) return  20;
  if (d <= 299) return  10;
  if (d <= 400) return   5;
  return 1;
}

/* K7 — ana yola yakinlik: <=50 m 100 puan, sonra her 100 m'de 10 puan azalir. */
function puan_ana_cadde(m) {
  var d = sayi(m);
  if (d === null || d < 0) return null;
  if (d <= 50) return 100;
  if (d <= 100) return 90;
  /* 100 m'den sonra HER 100 m'de 10 puan azalir -> ceil kullanilir.
     floor ile 150 m yanlislikla 90 puan aliyordu. */
  var p = 90 - Math.ceil((d - 100) / 100) * 10;
  return p < 0 ? 0 : p;
}

/* K7 — ilce merkezine yakinlik (Model-1 tablosu). */
function puan_merkez(m) {
  var d = sayi(m);
  if (d === null || d < 0) return null;
  if (d <=  100) return 100;
  if (d <=  250) return  90;
  if (d <=  500) return  80;
  if (d <=  750) return  70;
  if (d <= 1000) return  60;
  if (d <= 1500) return  50;
  if (d <= 2000) return  40;
  if (d <= 2500) return  30;
  if (d <= 3000) return  20;
  return 10;
}

/* K7 — egim tablosu. Yuzde egim degeri beklenir. */
function puan_egim(yuzde_egim) {
  var e = sayi(yuzde_egim);
  if (e === null || e < 0) return null;
  if (e <= 10) return 100;
  if (e <= 20) return  70;
  if (e <= 30) return  50;
  if (e <= 40) return  20;
  if (e <= 50) return  10;
  return 0;
}

/* K7 — baki (yon) tablosu. */
var PUAN_BAKI = {
  guney: 100, guneydogu: 90, guneybati: 80, bati: 70,
  dogu: 50, kuzeydogu: 50, kuzeybati: 50, kuzey: 50, duz: 100
};

/* K6 — imar ada kullanimi: ticaret 100 / konut 50 / kamu 0.
   K7'de ayni kavram farkli olceklenmis (ticari 100 / sanayi 90 / konut 80 /
   tarim 50). Iki kaynak AYNI FIKIRDE DEGIL; ikisini de tasiyoruz ki
   sapma belirsizlige yansisin. */
var PUAN_ADA_K6 = { ticari: 100, konut: 50, kamu: 0 };
var PUAN_ADA_K7 = { ticari: 100, sanayi: 90, konut: 80, turizm: 85, tarim: 50, kamu: 0 };

/* K6 — kose parsel 100 / ara parsel 0. */
var PUAN_ADA_ICI = { kose: 100, ara: 0, bas: 60 };

/* Asagidaki iki olcek YAYIMLANMADI; K6 metnindeki ifadelerden turetildi.
   Bu yuzden `baslangic` guveninde. */
var PUAN_SEKIL = { dortgen: 100, ucgen: 70, cokgen: 50 };
var PUAN_ZEMIN = { saglam: 100, orta: 70, alüvyon: 40, sorunlu: 20 };
var PUAN_DEPREM = { '5': 100, '4': 80, '3': 60, '2': 40, '1': 20 };

/* Yapilasma hakki puani: K6 kriteri "toplam insaat alani".
   Yayimlanmis bir olcek yok; KAKS 2,0 ve uzeri 100 kabul eden dogrusal
   olcek kullaniyoruz. `baslangic`. */
function puan_yapilasma(kaks) {
  var k = sayi(kaks, 'oran');
  if (k === null || k < 0) return null;
  var p = (k / 2.0) * 100;
  return p > 100 ? 100 : p;
}

/* Kamu hizmetleri: K6/K7 — yararlanilan hizmet sayisi / toplam x 100. */
function puan_kamu_hizmetleri(hizmetler) {
  if (!hizmetler || typeof hizmetler !== 'object') return null;
  var toplam = BELEDIYE_HIZMETLERI.length, var_ = 0;
  BELEDIYE_HIZMETLERI.forEach(function (h) { if (hizmetler[h]) var_++; });
  return (var_ / toplam) * 100;
}

/* Her faktorun puanini nasil cikaracagimiz + guven etiketi. */
var NOMINAL_PUANLAYICI = {
  yapilasma_hakki: { al: function (p) { return puan_yapilasma(p.kaks); },
                     guven: GUVEN.BASLANGIC, kaynak: 'Ağırlık K6; ölçek yayımlanmadı, doğrusal varsayım.' },
  kamu_hizmetleri: { al: function (p) { return puan_kamu_hizmetleri(p.hizmetler); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K6/K7 — yararlanılan hizmet oranı.' },
  ada_kullanimi:   { al: function (p) { return PUAN_ADA_K7[p.imar_fonksiyon]; },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 puanlama tablosu (K6 ile farklı ölçekte; sapma banda yansır).' },
  depremsellik:    { al: function (p) { return PUAN_DEPREM[String(p.deprem_bolgesi)]; },
                     guven: GUVEN.BASLANGIC, kaynak: 'Ağırlık K6; ölçek yayımlanmadı.' },
  zemin:           { al: function (p) { return PUAN_ZEMIN[p.zemin]; },
                     guven: GUVEN.BASLANGIC, kaynak: 'Ağırlık K6; K7 Z2=70 / Z3=40 ile uyumlu ölçek.' },
  egim:            { al: function (p) { return puan_egim(p.egim_yuzde); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 eğim tablosu. UYARI: K10 eğimi eledi, tartışmalı.' },
  ada_ici_konum:   { al: function (p) { return PUAN_ADA_ICI[p.ada_ici_konum]; },
                     guven: GUVEN.OLCULDU,  kaynak: 'K6 — köşe 100 / ara 0.' },
  parsel_sekli:    { al: function (p) { return PUAN_SEKIL[p.sekil]; },
                     guven: GUVEN.BASLANGIC, kaynak: 'Ağırlık K6; ölçek K6 metninden türetildi.' },
  baki:            { al: function (p) { return PUAN_BAKI[p.baki]; },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 bakı tablosu.' },
  manzara:         { al: function (p) { return p.manzara === undefined ? null : (p.manzara ? 100 : 0); },
                     guven: GUVEN.BASLANGIC, kaynak: 'Ağırlık K6; ikili ölçek.' },
  ana_cadde:       { al: function (p) { return puan_ana_cadde(p.ana_cadde_m); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 ana yola yakınlık tablosu.' },
  merkez:          { al: function (p) { return puan_merkez(p.merkez_m); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 ilçe merkezine yakınlık tablosu (Model-1).' },
  egitim:          { al: function (p) { return puan_mesafe(p.egitim_m); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 mesafe tablosu.' },
  yesil_alan:      { al: function (p) { return puan_mesafe(p.yesil_alan_m); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 mesafe tablosu.' },
  saglik:          { al: function (p) { return puan_mesafe(p.saglik_m); },
                     guven: GUVEN.OLCULDU,  kaynak: 'K7 mesafe tablosu.' }
};

/* Bir parselin nominal puanini (0-100) hesaplar.
   Bilinmeyen faktorler DISLANIR ve agirliklar yeniden normalize edilir;
   boylece eksik bilgi puani haksiz yere dusurmez, sadece belirsizligi artirir. */
function nominal_puan(parsel, sadece) {
  parsel = parsel || {};
  var kalemler = [], eksik = [];
  var agirlik_toplami = 0, puan_toplami = 0;

  Object.keys(NOMINAL_AGIRLIK).forEach(function (k) {
    /* ORTAK KUME KISITI (29.08.2026). `sadece` verilirse yalnizca o
       faktorler puanlanir. Sebep asagida, nominal_oran icinde yazili:
       emsal ile hedef AYNI faktor kumesi uzerinden karsilastirilmali. */
    if (sadece && sadece.indexOf(k) === -1) return;
    var tanim = NOMINAL_AGIRLIK[k];
    var puanlayici = NOMINAL_PUANLAYICI[k];
    var p = null;
    try { p = puanlayici.al(parsel); } catch (e) { p = null; }

    if (p === null || p === undefined || !isFinite(p)) {
      eksik.push({ anahtar: k, ad: tanim.ad, agirlik: tanim.agirlik });
      return;
    }
    agirlik_toplami += tanim.agirlik;
    puan_toplami += tanim.agirlik * p;
    kalemler.push({
      anahtar: k, ad: tanim.ad, agirlik: tanim.agirlik, puan: yuvarla(p, 1),
      katki: yuvarla(tanim.agirlik * p / 100, 2),
      guven: puanlayici.guven, guven_etiket: GUVEN_ETIKET[puanlayici.guven],
      kaynak: puanlayici.kaynak
    });
  });

  if (agirlik_toplami === 0) {
    return { hata: 'Nominal puan için hiçbir faktör bilgisi girilmedi.',
             eksik: eksik };
  }

  return {
    puan: yuvarla(puan_toplami / agirlik_toplami, 2),
    kullanilan_agirlik: yuvarla(agirlik_toplami, 2),
    kapsam_yuzde: yuvarla(agirlik_toplami / 99.90 * 100, 1),
    kalemler: kalemler.sort(function (a, b) { return b.agirlik - a.agirlik; }),
    eksik: eksik
  };
}

/* K6 agirlik setinin GORMEDIGI faktorler.
   Canakkale AHS listesinde yola cephe, tapu turu ve arsa/arazi vasfi YOK.
   Bunlar tesadufen tam da hukuken en agir basan uc faktor — ve K10'a gore
   literaturde sayisal karsiligi olmayan faktorler de bunlar.

   Iki yontemi bu haliyle yan yana koymak YANILTICI olurdu: nominal yontem
   parselin en buyuk kusurlarini goremediginden hep daha iyimser cikardi.
   Bu yuzden bu uc faktorun duzeltmesi HER IKI yonteme de uygulanir; boylece
   yontemler ayni bilgiyi gorur ve aralarindaki fark GERCEK belirsizligi
   olcer, bilgi farkini degil. */
var NOMINAL_KOR_NOKTA = ['nitelik', 'yola_cephe', 'tapu_turu'];

function kor_nokta_carpani(emsal, hedef) {
    var oran = 1, kalemler = [], eksik = [];
    NOMINAL_KOR_NOKTA.forEach(function (anahtar) {
        var f = DUZELTME[anahtar];
        var ce = carpan_bul(anahtar, emsal[anahtar]);
        var ch = carpan_bul(anahtar, hedef[anahtar]);
        if (ce === null || ch === null) { eksik.push(f.ad); return; }
        var o = ch / ce;
        if (!isFinite(o) || o <= 0) return;
        oran *= o;
        kalemler.push({ ad: f.ad, oran: yuvarla(o, 4),
                        etki_yuzde: yuvarla((o - 1) * 100, 1), guven: f.guven });
    });
    return { oran: oran, kalemler: kalemler, eksik: eksik };
}

/* ---------------------------------------------------------------------
   NOMINAL MODELIN GECERLILIK ALANI
   ---------------------------------------------------------------------
   K6 agirliklari 87 adet YAPISIZ ARSA parseli uzerinde uretildi. Model
   agirlikli ortalamadir: tek bir faktor, puani en fazla kendi agirligi
   kadar oynatabilir. Bu yuzden tarla, kamu alani ya da uc emsal gibi
   durumlarda gercek piyasa etkisini TEMSIL EDEMEZ.

   Supurme sinamasi bunu sayiyla gosterdi (41 girdi, 10'u %15 uzeri ayristi):
     imar_fonksiyon = tarim  ->  carpan 300 TL/m2  |  nominal 943 TL/m2  (%103)
     kaks = 0,2              ->  carpan 381        |  nominal 905        (%81)
     kaks = 4                ->  carpan 2297       |  nominal 1119       (%69)

   Bu bir yazilim hatasi degil, modelin SINIRI. Sinirin disinda sayi
   uretmek yerine "bu yontem burada gecerli degil" demek dogrusu.
   Yanlis sayi gostermek, sayi gostermemekten kotudur.
   ------------------------------------------------------------------- */
var NOMINAL_GECERLI = {
  nitelik: ['arsa', 'arsa_plansiz'],
  imar_fonksiyon: ['konut', 'ticari', 'sanayi', 'turizm'],
  kaks_alt: 0.30,
  kaks_ust: 3.00
};

function nominal_gecerli_mi(parsel) {
  parsel = parsel || {};
  var sebep = [];

  if (parsel.nitelik && NOMINAL_GECERLI.nitelik.indexOf(parsel.nitelik) === -1) {
    sebep.push('Nominal ağırlık seti YAPISIZ ARSA parselleriyle üretildi; ' +
               'arazi/tarla vasfında geçerli değil.');
  }
  if (parsel.imar_fonksiyon &&
      NOMINAL_GECERLI.imar_fonksiyon.indexOf(parsel.imar_fonksiyon) === -1) {
    sebep.push('İmar fonksiyonu "' + parsel.imar_fonksiyon + '" modelin ' +
               'doğrulandığı kentsel kullanımlar dışında.');
  }
  var k = sayi(parsel.kaks);
  if (k !== null && (k < NOMINAL_GECERLI.kaks_alt || k > NOMINAL_GECERLI.kaks_ust)) {
    sebep.push('Emsal ' + k + '; model ' + NOMINAL_GECERLI.kaks_alt + '-' +
               NOMINAL_GECERLI.kaks_ust + ' aralığında doğrulandı.');
  }

  return { gecerli: sebep.length === 0, sebep: sebep };
}

/* Nominal yontemle deger tahmini: puan orani x emsal birim fiyati,
   sonra nominal modelin goremedigi faktorlerin duzeltmesi. */
function deger_nominal(emsal, hedef) {
  var birim = sayi(emsal && emsal.birim_fiyat);
  if (!birim || birim <= 0) {
    return { hata: 'Emsal birim fiyatı girilmeden nominal tahmin yapılamaz.' };
  }
  /* Once gecerlilik alani: disaridaysa SAYI URETMIYORUZ. */
  var alan_kontrol = nominal_gecerli_mi(hedef);
  if (!alan_kontrol.gecerli) {
    return {
      hata: 'Nominal yöntem bu parsel için geçerli değil.',
      gecerlilik_disi: true,
      sebep: alan_kontrol.sebep,
      kaynak: KAYNAK.K6
    };
  }

  /* ═══ EMSAL VE HEDEF AYNI FAKTOR KUMESINDE PUANLANIR ═══
     OLCULDU (29.08.2026): emsal parsel 15 nominal faktorun HEPSINI
     dolduruyor (`emsal_kur`), hedef ise kullanicinin doldurmadigini
     `undefined` birakiyor. Iki puan AYRI kumeler uzerinden
     hesaplaniyordu ve sonuc su oldu:

         emsalin BIREBIR AYNISI hedef        -> oran 1,0000  (dogru)
         ayni parsel, 4. bolum BOS birakildi -> oran 1,1054

     Yani hicbir sey degismeden, sirf CEVAPLAMAMAK parseli %10,5 daha
     degerli gosteriyordu. Sebep: emsalin sabitlerinde DUSUK puanlilar
     var (ada ici 'ara' = 0 puan, manzara yok = 0 puan, merkez 500 m =
     1 puan); bunlar emsalin ortalamasini asagi cekiyor. Hedef ayni
     alanlari bos birakinca o cekisten KURTULUYOR ve ustune cikiyor.

     Uygulama tam tersini vaat ediyor: "hesaba katilmaz ve bant
     genisler". Bant gercekten genisliyordu -- ama MERKEZ de kayiyordu,
     ve kaymis bir merkezi genis bant duzeltmez.

     Cozum, bu dosyanin NOMINAL_KOR_NOKTA yorumunda zaten yazili olan
     ilkenin ta kendisi: "boylece yontemler AYNI BILGIYI gorur ve
     aralarindaki fark GERCEK belirsizligi olcer, bilgi farkini degil."
     Ayni ilke yontemler arasinda uygulanmisti, PARSELLER arasinda
     uygulanmamisti. Simdi ortak kume kuruluyor. */
  var pe0 = nominal_puan(emsal);
  var ph0 = nominal_puan(hedef);
  if (pe0.hata) return { hata: 'Emsal parsel için: ' + pe0.hata };
  if (ph0.hata) return { hata: 'Hedef parsel için: ' + ph0.hata };

  var eAnahtar = (pe0.kalemler || []).map(function (x) { return x.anahtar; });
  var hAnahtar = (ph0.kalemler || []).map(function (x) { return x.anahtar; });
  var ortak = eAnahtar.filter(function (k) { return hAnahtar.indexOf(k) !== -1; });
  if (ortak.length === 0) {
    return { hata: 'Emsal ile hedefin ortak bildiği hiçbir faktör yok; ' +
                   'nominal karşılaştırma kurulamaz.' };
  }
  var disarida = eAnahtar.filter(function (k) { return ortak.indexOf(k) === -1; })
    .concat(hAnahtar.filter(function (k) { return ortak.indexOf(k) === -1; }));

  var pe = nominal_puan(emsal, ortak);
  var ph = nominal_puan(hedef, ortak);
  if (pe.hata) return { hata: 'Emsal parsel için: ' + pe.hata };
  if (ph.hata) return { hata: 'Hedef parsel için: ' + ph.hata };
  if (pe.puan <= 0) {
    return { hata: 'Emsal parselin nominal puanı sıfır; oran kurulamaz.' };
  }

  var puan_orani = ph.puan / pe.puan;
  var kor = kor_nokta_carpani(emsal, hedef);
  var oran = puan_orani * kor.oran;

  return {
    yontem: 'nominal',
    emsal_puan: pe.puan,
    hedef_puan: ph.puan,
    puan_orani: yuvarla(puan_orani, 4),
    kor_nokta_orani: yuvarla(kor.oran, 4),
    kor_nokta_kalemler: kor.kalemler,
    kor_nokta_eksik: kor.eksik,
    oran: yuvarla(oran, 4),
    net_etki_yuzde: yuvarla((oran - 1) * 100, 1),
    birim_fiyat: yuvarla(birim * oran, 0),
    kapsam_yuzde: Math.min(pe.kapsam_yuzde, ph.kapsam_yuzde),
    ortak_faktor_sayisi: ortak.length,
    adalet_icin_dislanan: disarida,
    emsal_kalemler: pe.kalemler,
    hedef_kalemler: ph.kalemler,
    eksik: ph.eksik,
    not: 'Nominal ağırlık seti (K6) yola cephe, tapu türü ve arsa/arazi vasfını ' +
         'içermez. Bu uc faktörün düzeltmesi ayrıca uygulanmistir; aksi halde ' +
         'yöntem parselin en ağır kusurlarını göremezdi.',
    kaynak: KAYNAK.K6 + ' | ' + KAYNAK.K7
  };
}


/* =====================================================================
   BOLGE PROFILLERI — "tek sabit agirlik seti savunulamaz"
   ---------------------------------------------------------------------
   K7 ayni 19 faktor icin IKI agirlik seti yayimliyor ve "ilce merkezine
   yakinlik" 5,37 -> 12,21 (2,3 KAT) degisiyor. Yani agirliklar bolgeye
   ve yonteme gore ciddi oynuyor.

   NE YAPMIYORUZ: Uydurma bir bolge sayisi secip "İç Anadolu profili"
   gibi seyler tanimlamiyoruz. Elimizde YAYIMLANMIS bes Turkiye seti var
   (Canakkale, Avanos M1, Avanos M2, Istanbul BWM, Foca); bes ornek
   istatistiksel kumeleme icin yetmez ve uydurmak, olculmus gibi
   gostermek olurdu.

   NE YAPIYORUZ: Yayimlanmis setleri YAN YANA kosup aralarindaki
   YAYILIMI olcuyoruz. Setler birbirinden ne kadar ayrisiyorsa, gercek
   belirsizlik o kadar buyuktur ve bant o kadar genisler. Iki yontemli
   tasarimin aynisi: emin olmadigimiz yerde emin gorunmuyoruz.

   Her profilin hangi ornek kumesinden geldigi asagida yazili — bir
   agirligi uretildigi kumenin disinda kullanmak, bugun yakaladigimiz
   "gecerlilik alani" hatasinin ta kendisi.
   ===================================================================== */
var BOLGE_PROFILI = {
  canakkale: {
    ad: 'Kıyı ilçesi (Çanakkale)',
    kume: '87 yapısız arsa parseli, Çanakkale Merkez/Esenler Mah., ' +
          '15 SPK lisanslı uzman AHS, CR=0,05',
    kaynak: 'K6',
    /* Varsayilan agirliklar zaten bu setten geliyor */
    agirlik: {}
  },
  avanos_m1: {
    ad: 'İç Anadolu ilçesi — literatür ağırlıkları (Avanos M-1)',
    kume: 'Avanos/Nevşehir; ağırlıklar Nişancı 2005, Erbil 2014, Mete 2019 ' +
          'calismalarindan devralinmis',
    kaynak: 'K7',
    agirlik: { merkez: 5.37, kamu_hizmetleri: 6.37, egim: 3.22 }
  },
  avanos_m2: {
    ad: 'İç Anadolu ilçesi — AHP ağırlıkları (Avanos M-2)',
    kume: 'Avanos/Nevşehir; aynı 19 faktör, arastirmacilarin kendi AHP ' +
          'anketi, CR=0,00004',
    kaynak: 'K7',
    agirlik: { merkez: 12.21, kamu_hizmetleri: 8.46, egim: 3.24 }
  }
};

/* Bir profilin agirliklariyla nominal puan hesaplar.
   Profilde tanimli olmayan faktorler varsayilan (K6) agirligini korur. */
function nominal_puan_profilli(parsel, profil_adi) {
  var profil = BOLGE_PROFILI[profil_adi];
  if (!profil) return { hata: 'Bilinmeyen bölge profili: ' + profil_adi };

  var yedek = {};
  Object.keys(profil.agirlik).forEach(function (k) {
    if (NOMINAL_AGIRLIK[k]) {
      yedek[k] = NOMINAL_AGIRLIK[k].agirlik;
      NOMINAL_AGIRLIK[k].agirlik = profil.agirlik[k];
    }
  });

  var sonuc;
  try { sonuc = nominal_puan(parsel); }
  finally {
    /* Agirliklari MUTLAKA geri koy. Koymazsak bir sonraki hesap sessizce
       yanlis profille calisir — tam olarak avladigimiz hata turu. */
    Object.keys(yedek).forEach(function (k) {
      NOMINAL_AGIRLIK[k].agirlik = yedek[k];
    });
  }
  return sonuc;
}

/* Yayimlanmis butun profilleri kosup aralarindaki yayilimi olcer. */
function profil_yayilimi(emsal, hedef) {
  var birim = sayi(emsal && emsal.birim_fiyat);
  if (!birim || birim <= 0) return { hata: 'Emsal birim fiyatı gerekli.' };

  var alan_kontrol = nominal_gecerli_mi(hedef);
  if (!alan_kontrol.gecerli) {
    return { hata: 'Nominal yöntem bu parsel için geçerli değil.',
             gecerlilik_disi: true, sebep: alan_kontrol.sebep };
  }

  var sonuclar = [];
  Object.keys(BOLGE_PROFILI).forEach(function (ad) {
    var pe = nominal_puan_profilli(emsal, ad);
    var ph = nominal_puan_profilli(hedef, ad);
    if (pe.hata || ph.hata || !pe.puan) return;
    var oran = ph.puan / pe.puan;
    sonuclar.push({
      profil: ad, profil_ad: BOLGE_PROFILI[ad].ad,
      kume: BOLGE_PROFILI[ad].kume, kaynak: BOLGE_PROFILI[ad].kaynak,
      oran: yuvarla(oran, 4), birim_fiyat: yuvarla(birim * oran, 0)
    });
  });

  if (!sonuclar.length) return { hata: 'Hiçbir profil hesaplanamadı.' };

  var fiyatlar = sonuclar.map(function (x) { return x.birim_fiyat; });
  var enAz = Math.min.apply(null, fiyatlar);
  var enCok = Math.max.apply(null, fiyatlar);
  var ortalama = fiyatlar.reduce(function (a, b) { return a + b; }, 0) / fiyatlar.length;
  var yayilim = ortalama > 0 ? (enCok - enAz) / ortalama : 0;

  return {
    profiller: sonuclar,
    en_az: enAz, en_cok: enCok, ortalama: yuvarla(ortalama, 0),
    yayilim_yuzde: yuvarla(yayilim * 100, 1),
    not: 'Yayımlanmış ağırlık setleri arasındaki fark. Büyükse, bölgeye ' +
         'göre değişen bir şey ölçüyoruz demektir ve bant genişler.'
  };
}

/* =====================================================================
   8. BIRLESIK ANALIZ  —  iki yontemi yan yana kosar
   Iki bagimsiz yontem ayni sonuca yaklasiyorsa guven artar; ayrisiyorsa
   bant genisler. "Tek rakam" yanilsamasina karsi en guclu korumamiz bu.
   ===================================================================== */
function deger_analizi(emsal, hedef) {
  var carpan_sonuc  = deger_tahmini(emsal, hedef);
  var nominal_sonuc = deger_nominal(emsal, hedef);

  var tahminler = [];
  if (!carpan_sonuc.hata)  tahminler.push(carpan_sonuc.birim_fiyat.orta);
  if (!nominal_sonuc.hata) tahminler.push(nominal_sonuc.birim_fiyat);

  if (tahminler.length === 0) {
    return { hata: carpan_sonuc.hata || nominal_sonuc.hata,
             carpan: carpan_sonuc, nominal: nominal_sonuc };
  }

  var ortalama = tahminler.reduce(function (a, b) { return a + b; }, 0) / tahminler.length;

  /* Iki yontem arasindaki ayrisma, belirsizligin dogrudan olcusudur. */
  var ayrisma = 0;
  if (tahminler.length === 2 && ortalama > 0) {
    ayrisma = Math.abs(tahminler[0] - tahminler[1]) / ortalama;
  }

  var bant = (carpan_sonuc.hata ? TABAN_BELIRSIZLIK : carpan_sonuc.bant_yuzde / 100);
  bant = Math.max(bant, ayrisma);          /* ayrisma bandi asamaz */

  /* Tek yontemle kaldiysak dogrulama imkanimiz yok: bandi genislet.
     Ikinci yontem bir "ikinci gorus"tu; olmadan daha az emin olmaliyiz. */
  if (tahminler.length === 1) bant += 0.10;

  /* YAYIMLANMIS AGIRLIK SETLERI ARASINDAKI FARK da gercek belirsizliktir.
     K7 ayni faktore 5,37 ve 12,21 diyor; hangisinin dogru oldugunu
     bilmiyoruz. Bilmedigimizi bandda gostermek zorundayiz. */
  var yayilim = profil_yayilimi(emsal, hedef);
  if (!yayilim.hata) {
    bant = Math.max(bant, yayilim.yayilim_yuzde / 100);
  }

  /* BANT TAVANI — ve tavanin sessiz yalani.
     Olculdu (29.08.2026, 4000 parsellik supurme): yukaridaki
     `Math.max(bant, ayrisma)` satirlarinin AMACI, bandin bilinen
     ayrismayi KAPSAMASIYDI. Buradaki kirpma o amaci sessizce geri
     aliyordu. En kotu ornek:
         carpan  362.552 TL/m2
         nominal  32.752 TL/m2
         ekranda 79.061 - 316.243 TL/m2  (±%60)
     Uygulama, KENDI IKI TAHMINININ IKISINI DE gosterdigi araligin
     disinda birakiyordu; ustelik ayni ekranda "iki yontem arasi
     fark %166,9" yaziyordu. 4000 parselin 65'inde (%1,6) oldu.

     Tavan kalkmiyor: ±%167'lik bir aralik kullaniciya bilgi degil.
     Ama kirpildigi ANDA bunu SOYLEMEK zorundayiz. */
  var BANT_TAVANI = 0.60;
  var bant_kirpildi = false;
  if (bant > BANT_TAVANI) { bant = BANT_TAVANI; bant_kirpildi = true; }

  var alan = sayi(hedef && hedef.alan);
  var sonuc = {
    yontem_sayisi: tahminler.length,
    yontemler: {
      carpan:  carpan_sonuc.hata  ? null : carpan_sonuc.birim_fiyat.orta,
      nominal: nominal_sonuc.hata ? null : nominal_sonuc.birim_fiyat
    },
    ayrisma_yuzde: yuvarla(ayrisma * 100, 1),
    birim_fiyat: {
      alt:  yuvarla(ortalama * (1 - bant), 0),
      orta: yuvarla(ortalama, 0),
      ust:  yuvarla(ortalama * (1 + bant), 0)
    },
    bant_yuzde: yuvarla(bant * 100, 1),
    carpan: carpan_sonuc,
    nominal: nominal_sonuc
  };

  /* DEGISMEZ KURAL: gosterilen aralik, kendisini ureten her tahmini
     KAPSAMALIDIR. Kapsamiyorsa aralik bir olcu degil, bir yanilticidir.
     Bunu varsaymiyoruz -- her hesapta OLCUYORUZ. */
  var kapsanmayan = tahminler.filter(function (v) {
    return v < sonuc.birim_fiyat.alt || v > sonuc.birim_fiyat.ust;
  });
  if (kapsanmayan.length > 0) {
    sonuc.aralik_kapsamiyor = true;
    sonuc.aralik_disi_tahmin = kapsanmayan.map(function (v) { return yuvarla(v, 0); });
    sonuc.aralik_sebep =
      'İki yöntem birbirinden çok uzak (%' + tr_sayi(sonuc.ayrisma_yuzde, 1) +
      '). Bu farkı dürüstçe kapsayan bir aralık, karar verilemeyecek kadar ' +
      'geniş olurdu; dar bir aralık ise yanıltıcı olurdu. Bu parsel için ' +
      'TEK BİR ARALIK VERMİYORUZ — iki tahmini ayrı ayrı gösteriyoruz.';
  }
  if (bant_kirpildi) sonuc.bant_kirpildi = true;

  if (alan && alan > 0) {
    sonuc.alan = alan;
    sonuc.toplam_deger = {
      alt:  yuvarla(sonuc.birim_fiyat.alt  * alan, 0),
      orta: yuvarla(sonuc.birim_fiyat.orta * alan, 0),
      ust:  yuvarla(sonuc.birim_fiyat.ust  * alan, 0)
    };
  }

  if (!yayilim.hata) {
    sonuc.bolge_yayilimi = {
      yuzde: yayilim.yayilim_yuzde,
      en_az: yayilim.en_az, en_cok: yayilim.en_cok,
      profiller: yayilim.profiller
    };
  }

  if (nominal_sonuc.gecerlilik_disi) {
    sonuc.nominal_dusuruldu = true;
    sonuc.nominal_dusurme_sebebi = nominal_sonuc.sebep;
  }

  sonuc.guven_notu =
    (tahminler.length === 2
      ? ('İki bağımsız yöntem kullanıldı; aralarındaki ayrışma %' +
         tr_sayi(sonuc.ayrisma_yuzde, 1) + '. ')
      : (nominal_sonuc.gecerlilik_disi
          ? ('İkinci yöntem (nominal puanlama) bu parsel için GEÇERLİ DEĞİL, ' +
             'kullanılmadı: ' + nominal_sonuc.sebep.join(' ') +
             ' Tek yöntemle kalındığı için bant genişletildi. ')
          : 'Tek yöntem kullanılabildi; bant bu yüzden geniş. ')) +
    'Bu bir DEĞERLEME RAPORU DEĞİLDİR. Kesin değer için SPK lisanslı ' +
    'değerleme uzmanına başvurun.';

  return sonuc;
}

/* ---------------------------------------------------------------------
   9. DISA ACILAN ARAYUZ
   ------------------------------------------------------------------- */
var API = {
  SURUM: SURUM,
  KAYNAK: KAYNAK,
  GUVEN: GUVEN,
  GUVEN_ETIKET: GUVEN_ETIKET,
  DUZELTME: DUZELTME,
  FAKTOR_SIRASI: FAKTOR_SIRASI,
  BELEDIYE_HIZMETLERI: BELEDIYE_HIZMETLERI,
  HIZMET_ADI: HIZMET_ADI,
  TABAN_BELIRSIZLIK: TABAN_BELIRSIZLIK,
  sayi_oku: sayi_oku,
  K9_ONEM: K9_ONEM,
  etki_araligi: etki_araligi,
  siralama_denetimi: siralama_denetimi,
  BOLGE_PROFILI: BOLGE_PROFILI,
  nominal_puan_profilli: nominal_puan_profilli,
  profil_yayilimi: profil_yayilimi,
  vasif_belirle: vasif_belirle,
  imar_hesapla: imar_hesapla,
  deger_tahmini: deger_tahmini,
  risk_tara: risk_tara,

  /* Nominal degerleme modulu (K6 agirliklari + K7 puanlama tablolari) */
  NOMINAL_AGIRLIK: NOMINAL_AGIRLIK,
  NOMINAL_PUANLAYICI: NOMINAL_PUANLAYICI,
  PUAN_BAKI: PUAN_BAKI,
  PUAN_ADA_K6: PUAN_ADA_K6,
  PUAN_ADA_K7: PUAN_ADA_K7,
  PUAN_ADA_ICI: PUAN_ADA_ICI,
  PUAN_SEKIL: PUAN_SEKIL,
  PUAN_ZEMIN: PUAN_ZEMIN,
  PUAN_DEPREM: PUAN_DEPREM,
  puan_mesafe: puan_mesafe,
  puan_ana_cadde: puan_ana_cadde,
  puan_merkez: puan_merkez,
  puan_egim: puan_egim,
  puan_yapilasma: puan_yapilasma,
  puan_kamu_hizmetleri: puan_kamu_hizmetleri,
  nominal_puan: nominal_puan,
  deger_nominal: deger_nominal,
  NOMINAL_KOR_NOKTA: NOMINAL_KOR_NOKTA,
  kor_nokta_carpani: kor_nokta_carpani,
  NOMINAL_GECERLI: NOMINAL_GECERLI,
  nominal_gecerli_mi: nominal_gecerli_mi,

  /* Iki yontemi yan yana kosan birlesik analiz */
  deger_analizi: deger_analizi
};

kok.Cekirdek = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;

})(typeof window !== 'undefined' ? window : globalThis);
