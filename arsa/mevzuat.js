/* =====================================================================
   ARSA REHBERİ — MEVZUAT
   ---------------------------------------------------------------------
   Resmî oranlar, birim maliyetler ve kanuni hesaplar.

   NEDEN AYRI DOSYA?
     Buradaki sayıların neredeyse tamamı HER OCAK AYINDA DEĞİŞİR.
     Ayrı dosyada durursa yıllık güncelleme tek yerden yapılır ve
     unutulmaz. `cekirdek.js` (değerleme mantığı) yıllara göre değişmez,
     burası değişir.

   GÜNCELLEME NOTU: Bu dosyadaki her sabit, kaynağı ve yürürlük tarihiyle
   birlikte yazılmıştır. Yeni yıl geldiğinde `YIL` sabitini ve altındaki
   tabloları yenileyin; `dogrulanma` alanı false olanları da teyit edin.
   ===================================================================== */

(function (kok) {
'use strict';

/* TURKCE SAYI OKUMA — cekirdekteki TEK cozumleyiciye baglanir.
   Burada `Number(...)` kullaniliyordu ve olculdu (27.08.2026):

       deger_artis_kazanci(..., giderler: 500000)    -> vergi 355.000 TL
       deger_artis_kazanci(..., giderler: "500.000") -> vergi 529.825 TL

   175.000 TL fark; cunku `Number("500.000")` 500 eder. Gider dusuk
   okununca vergi YUKSEK cikiyor -- yani hata kullanicinin aleyhine.
   `Number("1.000.000")` ise NaN degil 1 verir; alis bedeli sessizce
   bozulur.

   Arayuz bu modulu ham metinle cagirmiyor (girdiler `C.sayi_oku`dan
   geciyor) ama `mevzuat.js` disa acik bir API; `test.html` dogrudan
   cagiriyor ve cagiranin dikkatli olmasi bir TERCIHTIR, sozlesme degil.

   NaN dondurur, null degil: boylece asagidaki butun `isFinite(...)`
   denetimleri aynen calismaya devam eder. (null olsaydi `isFinite(null)`
   true doner ve eksik veri 0 sayilirdi -- duzeltirken yeni bir sessiz
   hata acmis olurduk.) */
function sayi(x, tur) {
  var d = (typeof Cekirdek !== 'undefined' && Cekirdek && Cekirdek.sayi_oku)
        ? Cekirdek.sayi_oku(x, tur) : null;
  return d === null || d === undefined ? NaN : d;
}

var YIL = 2026;

/* RAYIC CETVELININ OMRU — veri dosyasindaki `gecerlilik` alani.
   Mevzuat yillik degisir; rayic cetveli 4 yilda bir belirlenir. */
var RAYIC_SON_YIL = 2029;

/* ---------------------------------------------------------------------
   YASAL TAVAN — EVK gecici md. 23 (7566 s.K., RG 19/12/2025-33112)
   ---------------------------------------------------------------------
   NE DIYOR
     2025'te 2026 icin takdir edilen asgari olcude arsa/arazi m2 birim
     degerleri esas alinarak hesaplanan 2026 vergi degeri, 2025 vergi
     degerinin "IKI KAT FAZLASINI" gecemez -- yani UC KATINI. Tavan hem
     vergi degerine hem de m2 birim degerinin kendisine isler; ayrica bu
     degerler uzerinden alinan "vergi, harc ve diger mali yukumlulukler"
     icin de gecerlidir (yani tapu harcinin emlak-vergisi tabanina da).
     2027-2028-2029 bu SINIRLI degerler uzerinden yurur.

   NEDEN BURADA
     Belediyelerin yayimladigi cetveller Haziran 2025 tarihli, yani
     kanundan ONCE. Cetveldeki sayi HAM TAKDIR degeridir; tavan
     uygulanmamistir. Uygulama cetvel sayisini oldugu gibi gosterirse
     kullanici yasanin izin verdiginden yuksek bir degere razi olur.

   CARPAN NEDEN 3
     89 Seri No.lu EVK Genel Tebligi, Ornek 1 -- TABLONUN KENDI SATIRLARI:

       3  Arsanin 2025 yili vergi degeri (1 x 2)            900.000,00 TL
       5  2026 icin hesaplanan vergi degeri (2 x 4)       6.000.000,00 TL
       6  2025 vergi degerinin 2 kat fazlasi [3+(3x2 kat)] 2.700.000,00 TL
       7  2026 yilinda uygulanacak vergi degeri            2.700.000,00 TL
       8  2026 asgari olcude m2 birim degeri (7 / 2)          1.800,00 TL

     Formulun kendisi ayrimi kapatiyor: [3 + (3 x 2)] = degerin kendisi
     + iki kati = UC KAT. Teblig ayrica duz cumleyle de soyluyor:
     "2025 yilinda vergi degeri 1.000 TL ise 2026 yilinda bu degerin
     3.000 TL'yi gecemeyecegi anlamina gelmektedir."

     ILK SURUM 2 YAZIYORDU VE YANLISTI (30.08.2026, v104 canlida kaldi).
     Sebep: tabloyu degil bir sirkulerin OZETINI okumustum; ozet
     "900.000 -> 1.800.000" demisti. 1.800 sayisi tabloda GERCEKTEN var
     ama 8. satirda ve BASKA BIR SEY: tavanli m2 BIRIM degeri (7/2).
     Yani ozet iki satiri birbirine karistirmis, ben de ona guvenmistim.
     Ders: ozetin verdigi sayi da ozettir. Tablonun satirini kopyala.
     3 numarali oturum ayni gun bunu olcup itiraz etti; PDF metni
     dogrudan cikarilarak dogrulandi.

   OLCULEMEZ HALI
     Kullanicinin 2025 degeri elimizde yok; cetvelde de yok. O yuzden
     tavan KENDILIGINDEN uygulanmaz — bilinmiyorsa "olculemedi" denir
     ve kullaniciya sorulur. Tahmin edilmis bir 2025 degeriyle tavan
     uygulamak, sessizce yanlis sayi uretmenin baska bir yoludur.        */
var TAVAN_KAT = 3;
var TAVAN_ILK_YIL = 2026;
var TAVAN_SON_YIL = 2029;

function deger_tavani(g) {
  g = g || {};
  var hesaplanan = sayi(g.hesaplanan);
  var onceki = sayi(g.onceki);
  var yil = g.yil || YIL;
  var ad = g.ad || 'değer';

  if (!isFinite(hesaplanan) || hesaplanan <= 0) {
    return { hata: 'Hesaplanan ' + ad + ' geçersiz.' };
  }

  var kapsamda = yil >= TAVAN_ILK_YIL && yil <= TAVAN_SON_YIL;
  if (!kapsamda) {
    return {
      uygulanan: Math.round(hesaplanan), kapsamda: false, olculemedi: false,
      sinirlandi: false,
      metin: yil + ' yılı, EVK geçici md. 23 kapsamı dışında (' +
             TAVAN_ILK_YIL + '-' + TAVAN_SON_YIL + ').'
    };
  }

  if (!isFinite(onceki) || onceki <= 0) {
    return {
      uygulanan: Math.round(hesaplanan), kapsamda: true, olculemedi: true,
      sinirlandi: false, kat: TAVAN_KAT,
      metin: '2025 değeri girilmediği için yasal tavan ÖLÇÜLEMEDİ. ' +
             'EVK geçici md. 23 (7566 s.K.): ' + yil + ' için uygulanacak ' +
             ad + ', 2025 değerinin ' + TAVAN_KAT + ' katını geçemez. ' +
             'Belediye cetvelindeki sayı ham takdir değeridir; tavan ' +
             'uygulanmamış olabilir. 2025 değerini girerseniz hesaplanır.',
      kaynak: MEVZUAT_KAYNAK.M7
    };
  }

  var tavan = onceki * TAVAN_KAT;
  var sinirlandi = hesaplanan > tavan;
  return {
    uygulanan: Math.round(sinirlandi ? tavan : hesaplanan),
    ham: Math.round(hesaplanan),
    onceki_2025: Math.round(onceki),
    tavan: Math.round(tavan),
    kat: TAVAN_KAT,
    kapsamda: true,
    olculemedi: false,
    sinirlandi: sinirlandi,
    metin: sinirlandi
      ? ('YASAL TAVAN UYGULANDI. Hesaplanan ' + ad + ' ' +
         bicim_tl(hesaplanan) + ', ancak 2025 değerinin ' + TAVAN_KAT +
         ' katı olan ' + bicim_tl(tavan) + ' ile sınırlı ' +
         '(EVK geçici md. 23). Fazlası ' + TAVAN_SON_YIL + ' sonuna kadar ' +
         'uygulanmaz.')
      : ('Yasal tavanın altında: hesaplanan değer, 2025 değerinin ' +
         TAVAN_KAT + ' katı olan ' + bicim_tl(tavan) + ' sınırını aşmıyor.'),
    kaynak: MEVZUAT_KAYNAK.M7
  };
}

/* Tavan metinlerinde sayilar okunakli olmali; toLocaleString ortama gore
   degisiyor (Node'da ICU eksikse bosluk ayirici cikiyordu). Sabit bicim. */
function bicim_tl(n) {
  var t = String(Math.round(n));
  var s = '';
  for (var i = 0; i < t.length; i++) {
    if (i > 0 && (t.length - i) % 3 === 0) s += '.';
    s += t.charAt(i);
  }
  return s + ' TL';
}

/* UYGULAMA ESKIDIGINI SOYLEMELI.
   Olculdu (29.08.2026): kod hicbir yerde `getFullYear` cagirmiyordu;
   yani 2027'de acan bir kullanici 2026 birim fiyatlariyla, 2026 harc
   ve vergi oranlariyla hesap yapiyor ve BUNU HIC OGRENMIYOR. Sayilar
   makul gorunur, kaynak satiri "2026" yazar, kimse fark etmez.
   Sessiz yanlis sayinin en sinsi bicimi: dogru sayi, YANLIS YIL.

   Iki omru AYRI soyluyoruz -- birlikte soylemek yaniltir:
     mevzuat (birim fiyat, harc, vergi) : YILLIK
     rayic cetveli                       : 2026-2029

   Cihaz saati yanlissa yanlis alarm cikabilir; bu yuzden metin
   "cihazinizin tarihine gore" diyor ve hicbir sey ENGELLENMIYOR. */
function guncellik(bugun_yil) {
  var y = bugun_yil;
  if (y === undefined || y === null) {
    try { y = new Date().getFullYear(); } catch (e) { y = null; }
  }
  y = parseInt(y, 10);
  if (!isFinite(y) || y < 2000 || y > 2100) {
    return { olculemedi: true, sebep: 'Cihaz tarihi okunamadı.' };
  }
  var mev_fark = y - YIL;
  var ray_fark = y - RAYIC_SON_YIL;
  return {
    bugun: y,
    mevzuat_yili: YIL,
    rayic_son_yil: RAYIC_SON_YIL,
    mevzuat_eski: mev_fark > 0,
    mevzuat_kac_yil: mev_fark > 0 ? mev_fark : 0,
    rayic_eski: ray_fark > 0,
    metin: mev_fark <= 0 ? null
      : ('Bu hesap ' + YIL + ' yılı birim fiyatlarına, harç ve vergi ' +
         'oranlarına dayanıyor. Cihazınızın tarihine göre ' + y + ' ' +
         'yılındasınız — ' + (mev_fark === 1 ? 'geçen yılın' : mev_fark + ' yıl önceki') +
         ' rakamlarını görüyorsunuz. Resmî oranlar her yıl değişir.'),
    rayic_metin: ray_fark <= 0 ? null
      : ('Rayiç cetveli ' + RAYIC_SON_YIL + ' sonuna kadar geçerliydi; ' +
         'yenisi belirlenmiş olmalı.')
  };
}

var MEVZUAT_KAYNAK = {
  M1: 'Çevre, Şehircilik ve Iklim Değişikliği Bakanlığı — 2026 Yılı Yapı ' +
      'Yaklaşık Birim Maliyetleri Hakkında Tebliğ. RG 3/2/2026, Sayı 33157. ' +
      'Yürürlük: 1/1/2026.',
  M2: '492 sayılı Harçlar Kanunu, (4) sayılı tarife I-20/a (tapu satış harcı) ' +
      've md. 63 (matrah, emlak vergisi değerinden az olamaz).',
  M3: '1319 sayılı Emlak Vergisi Kanunu md. 8 (bina) ve md. 18 (arazi/arsa). ' +
      'Büyükşehirde oranlar iki kat (5216 s.K.).',
  M4: 'GVK mukerrer md. 80/6, 81 ve md. 103. 2026 istisna ve tarife: ' +
      '332 Seri No.lu Gelir Vergisi Genel Tebliği, RG 31/12/2025, ' +
      'Sayı 33124 (5. Mukerrer).',
  M5: 'Planlı Alanlar İmar Yönetmeliği, RG 3/7/2017-30113. Son değişiklikler: ' +
      'RG 13/8/2025-32985, RG 14/1/2026-33137, RG 1/7/2026-33297.',
  M6: 'TKGM 2026 Yılı Döner Sermaye Tarife Cetveli. Yürürlük 1/1/2026.',
  M7: '1319 sayılı EVK geçici md. 23 (7566 sayılı Kanun, RG 19/12/2025, ' +
      'Sayı 33112). Uygulama esasları: 89 Seri No.lu EVK Genel Tebliği, ' +
      'RG 31/12/2025, Sayı 33124 (5. Mükerrer). 2026 vergi değeri, 2025 ' +
      'vergi değerinin "iki kat fazlasını" — yani ÜÇ KATINI — geçemez. ' +
      'Tebliğin Örnek 1 tablosu: 2025 değeri 900.000 TL, tavan ' +
      '[900.000 + (900.000 x 2)] = 2.700.000 TL. 2027-2029 bu sınırlı ' +
      'değerler üzerinden yürür; aynı sınır bu değerlere dayanan harçlara ' +
      'da işler.'
};

/* ---------------------------------------------------------------------
   1. YAPI YAKLAŞIK BİRİM MALİYETLERİ — 2026  (M1)
   KDV HARIC. Genel giderler (%15) ve yuklenici kari (%10) DAHIL.
   DAHIL DEGIL: arsa bedeli, cevre duzenlemesi, bina disi altyapi.

   ONEMLI: 2026 tebliginde II., III. ve IV. siniflarda (D) ve (E) grubu
   YOKTUR. Eski yillarin "III-D" gibi kodlarini kullanmayin.
   ------------------------------------------------------------------- */
var YAPI_BIRIM_MALIYET = {
  '1A': { tl: 2600,   ad: 'I-A — Basit tarım/hayvancılık yapıları, çardak, plastik sera' },
  '1B': { tl: 3900,   ad: 'I-B — Basit padok, cam/sert plastik sera' },
  '1C': { tl: 4200,   ad: 'I-C — Su deposu, büyükbaş ahır, istinat duvarı, EV şarj' },
  '1D': { tl: 4800,   ad: 'I-D — Güneş enerji santrali (GES)' },
  '2A': { tl: 8100,   ad: 'II-A — Genel amaçlı depo, tarımsal endüstri, deniz iskelesi' },
  '2B': { tl: 12500,  ad: 'II-B — Konteyner kent, hangar, halı saha, kapalı pazar yeri' },
  '2C': { tl: 15100,  ad: 'II-C — Bağ/köy/yayla evi (kırsal, brüt <200 m2), bungalov' },
  '3A': { tl: 19800,  ad: 'III-A — KONUT: apartman tipi, uc kata kadar (uc kat dahil)' },
  '3B': { tl: 21050,  ad: 'III-B — KONUT: uc kat üzeri, yapı yüksekliği <=21,50 m; ' +
                           'müstakil/ikiz konut (brüt <200 m2)' },
  '3C': { tl: 23400,  ad: 'III-C — KONUT: 21,50 m < H <= 30,50 m; müstakil/ikiz ' +
                           '(200-500 m2); lise; öğrenci yurdu' },
  '4A': { tl: 26450,  ad: 'IV-A — KONUT: 30,50 m < H <= 51,50 m; AVM (<25.000 m2); otel 1-2 yıldız' },
  '4B': { tl: 33900,  ad: 'IV-B — KONUT: H > 51,50 m; müstakil/ikiz (>=500 m2); banka; düğün salonu' },
  '4C': { tl: 40500,  ad: 'IV-C — Adalet sarayı, AVM (>=25.000 m2), hastane (<200 yatak), otel 3 yıldız' },
  '5A': { tl: 42350,  ad: 'V-A — Büyükelçilik, eğitim-araştırma hastanesi, stadyum' },
  '5B': { tl: 43850,  ad: 'V-B — Hastane (200-400 yatak), otel 4 yıldız' },
  '5C': { tl: 48750,  ad: 'V-C — Opera/tiyatro, hastane (>=400 yatak), kongre merkezi, müze' },
  '5D': { tl: 53500,  ad: 'V-D — Havalimanı terminali, metro istasyonu, otel 5 yıldız, şehir hastanesi' },
  '5E': { tl: 103500, ad: 'V-E — Rüzgâr enerji santrali (RES)' }
};

/* Konut yapmak isteyen kullanici icin kisayol: yapi yuksekligine gore sinif. */
function konut_sinifi(g) {
  g = g || {};
  var kat = sayi(g.kat_adedi);
  var yukseklik = sayi(g.yapi_yuksekligi_m);
  var mustakil = !!g.mustakil;
  var brut = sayi(g.bagimsiz_bolum_brut_m2);

  if (mustakil) {
    /* Mustakil/ikiz konutlarda olcut bagimsiz bolum brut alanidir (M1). */
    if (!isFinite(brut)) return { hata: 'Müstakil konutta bağımsız bölüm brüt alanı gerekli.' };
    if (brut < 200) return { sinif: '3B', gerekce: 'Müstakil/ikiz konut, brüt < 200 m2' };
    if (brut < 500) return { sinif: '3C', gerekce: 'Müstakil/ikiz konut, brüt 200-500 m2' };
    return { sinif: '4B', gerekce: 'Müstakil/ikiz konut, brüt >= 500 m2' };
  }

  /* Apartman tipi: once kat, sonra yukseklik olcutu. */
  if (isFinite(kat) && kat <= 3) {
    return { sinif: '3A', gerekce: 'Apartman tipi konut, uc kata kadar' };
  }

  var uyari = null;
  if (!isFinite(yukseklik)) {
    /* Kullanici kat sayisini bilir ama metre cinsinden yuksekligi genelde
       bilmez. Yonetmeligin kendi olcutunu tersine cevirip yaklastiriyoruz:
       md. 23/1-d kat adedini "toplam yukseklik / 3" ile buluyor, yani kat
       basina 3,00 m kabul ediliyor. Bu bir VARSAYIMDIR, kullaniciya soylenir. */
    if (!isFinite(kat) || kat <= 0) {
      return { hata: 'Kat adedi veya yapı yüksekliği (m) gerekli.' };
    }
    yukseklik = kat * 3.00;
    uyari = 'Yapı yüksekliği girilmedi; kat başına 3,00 m kabul edilerek ' +
            kat + ' kat = ' + yukseklik.toLocaleString('tr-TR',
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
            ' m varsayıldı ' +
            '(Planlı Alanlar İmar Yön. md. 23/1-d kat adedi ölçütü). ' +
            'Gerçek yükseklik farklıysa yapı sınıfı ve maliyet değişir.';
  }

  var sonuc;
  if (yukseklik <= 21.50)      sonuc = { sinif: '3B', gerekce: 'Yapı yüksekliği <= 21,50 m' };
  else if (yukseklik <= 30.50) sonuc = { sinif: '3C', gerekce: '21,50 m < H <= 30,50 m' };
  else if (yukseklik <= 51.50) sonuc = { sinif: '4A', gerekce: '30,50 m < H <= 51,50 m' };
  else                         sonuc = { sinif: '4B', gerekce: 'H > 51,50 m' };

  sonuc.kullanilan_yukseklik = yukseklik;
  if (uyari) sonuc.uyari = uyari;
  return sonuc;
}

/* KDV orani insaat teslimlerinde degisken oldugu icin disaridan alinir. */
function insaat_maliyeti(toplam_insaat_alani, sinif, secenek) {
  secenek = secenek || {};
  var alan = sayi(toplam_insaat_alani);
  var kayit = YAPI_BIRIM_MALIYET[sinif];

  if (!isFinite(alan) || alan <= 0) return { hata: 'Toplam inşaat alanı geçersiz.' };
  if (!kayit) return { hata: 'Bilinmeyen yapı sınıfı: ' + sinif };

  var kdv_haric = alan * kayit.tl;
  var kdv_orani = isFinite(sayi(secenek.kdv_orani, 'oran')) ? sayi(secenek.kdv_orani, 'oran') : null;

  var sonuc = {
    yil: YIL,
    sinif: sinif,
    sinif_ad: kayit.ad,
    birim_maliyet: kayit.tl,
    alan: alan,
    kdv_haric: Math.round(kdv_haric),
    kaynak: MEVZUAT_KAYNAK.M1,
    dahil: 'Genel giderler (%15) ve yüklenici kârı (%10) DAHİLDİR.',
    dahil_degil: 'Arsa bedeli, çevre düzenlemesi (peyzaj, ihata duvarı, ada içi yol, ' +
                 'drenaj, çevre aydınlatma) ve bina dışı altyapı (zemin iyileştirme, ' +
                 'elektrik/su/doğalgaz/kanalizasyon/haberleşme) DAHİL DEĞİLDİR.'
  };

  if (kdv_orani !== null) {
    sonuc.kdv_orani = kdv_orani;
    sonuc.kdv = Math.round(kdv_haric * kdv_orani);
    sonuc.kdv_dahil = Math.round(kdv_haric * (1 + kdv_orani));
  }
  return sonuc;
}

/* ---------------------------------------------------------------------
   2. TAPU HARCI  (M2)
   Binde 20 alici + binde 20 satici = toplam binde 40 (%4).
   Matrah: beyan edilen bedel, ANCAK emlak vergisi degerinden az olamaz.
   ------------------------------------------------------------------- */
var TAPU_HARCI_ORANI = 0.020;   /* her taraf icin binde 20 */

function tapu_harci(g) {
  g = g || {};
  var beyan = sayi(g.beyan_bedeli);
  var emlak_ham = sayi(g.emlak_vergi_degeri);

  if (!isFinite(beyan) || beyan <= 0) return { hata: 'Beyan bedeli geçersiz.' };

  /* TAVAN HARCA DA ISLER. EVK gecici md. 23 son fikrasi: bu degerler esas
     alinarak uygulanan "vergi, HARC ve diger mali yukumlulukler" icin de
     sinirli degerler dikkate alinir. Tavansiz bir emlak vergi degeri,
     Harclar K. md. 63 tabani uzerinden harci da sisirir.                */
  var harc_tavani = null;
  var emlak_degeri = emlak_ham;
  if (isFinite(emlak_ham) && emlak_ham > 0) {
    harc_tavani = deger_tavani({
      hesaplanan: emlak_ham,
      onceki: g.emlak_vergi_degeri_2025,
      ad: 'emlak vergi değeri'
    });
    emlak_degeri = harc_tavani.uygulanan;
  }

  var matrah = beyan;
  var uyari = null;
  /* Harclar Kanunu md. 63: matrah emlak vergisi degerinden dusuk olamaz. */
  if (isFinite(emlak_degeri) && emlak_degeri > beyan) {
    matrah = emlak_degeri;
    uyari = 'Beyan bedeli emlak vergisi değerinin altında kaldı; harç emlak ' +
            'vergisi değeri üzerinden hesaplandı (Harçlar K. md. 63). ' +
            'Düşük beyan hâlinde harç farkı ikmalen tarh edilir ve %25 vergi ' +
            'ziyaı cezası uygulanır.';
  }

  var taraf = matrah * TAPU_HARCI_ORANI;
  return {
    yil: YIL,
    matrah: Math.round(matrah),
    emlak_vergi_degeri_ham: isFinite(emlak_ham) ? Math.round(emlak_ham) : null,
    tavan: harc_tavani,
    oran_taraf: TAPU_HARCI_ORANI,
    alici_harci: Math.round(taraf),
    satici_harci: Math.round(taraf),
    toplam_harc: Math.round(taraf * 2),
    uyari: uyari,
    not: 'Uygulamada harcın tamamı çoğu zaman alıcı tarafından ödenir; ancak ' +
         'KANUNEN alıcı ve satıcı ayrı ayrı sorumludur.',
    kaynak: MEVZUAT_KAYNAK.M2
  };
}

/* ---------------------------------------------------------------------
   3. EMLAK VERGİSİ  (M3)
   Buyuksehir belediye sinirlari ve mucavir alanda oranlar IKI KAT.
   ------------------------------------------------------------------- */
var EMLAK_VERGISI_ORANI = {
  mesken: { normal: 0.001, ad: 'Mesken (konut)' },
  isyeri: { normal: 0.002, ad: 'İşyeri / diğer binalar' },
  arsa:   { normal: 0.003, ad: 'Arsa' },
  arazi:  { normal: 0.001, ad: 'Arazi' }
};

var BUYUKSEHIR_ILLERI = [
  'Adana','Ankara','Antalya','Aydin','Balikesir','Bursa','Denizli','Diyarbakir',
  'Erzurum','Eskisehir','Gaziantep','Hatay','Istanbul','Izmir','Kahramanmaras',
  'Kayseri','Kocaeli','Konya','Malatya','Manisa','Mardin','Mersin','Mugla',
  'Ordu','Sakarya','Samsun','Sanliurfa','Tekirdag','Trabzon','Van'
];

function emlak_vergisi(g) {
  g = g || {};
  var ham_deger = sayi(g.vergi_degeri);
  var tur = g.tur || 'arsa';
  var buyuksehir = !!g.buyuksehir;
  var kayit = EMLAK_VERGISI_ORANI[tur];

  if (!kayit) return { hata: 'Bilinmeyen taşınmaz türü: ' + tur };
  if (!isFinite(ham_deger) || ham_deger <= 0) {
    return { hata: 'Vergi değeri geçersiz.' };
  }

  /* YASAL TAVAN once uygulanir; vergi TAVANLI deger uzerinden hesaplanir.
     Tersi yapilirsa vergi yasanin izin verdiginden yuksek cikar.        */
  var tavan = deger_tavani({
    hesaplanan: ham_deger,
    onceki: g.vergi_degeri_2025,
    ad: 'vergi değeri'
  });
  var deger = tavan.uygulanan;

  var oran = kayit.normal * (buyuksehir ? 2 : 1);
  var vergi = deger * oran;
  /* 2863 s.K. md. 12 — Tasinmaz Kultur Varliklarinin Korunmasina Katki Payi. */
  var katki_payi = vergi * 0.10;

  return {
    yil: YIL,
    tur: tur,
    tur_ad: kayit.ad,
    buyuksehir: buyuksehir,
    oran: oran,
    oran_binde: Math.round(oran * 1000 * 100) / 100,
    vergi_degeri: Math.round(deger),
    vergi_degeri_ham: Math.round(ham_deger),
    tavan: tavan,
    yillik_vergi: Math.round(vergi),
    kultur_varliklari_katki_payi: Math.round(katki_payi),
    toplam: Math.round(vergi + katki_payi),
    odeme: '1. taksit Mart-Nisan-Mayıs, 2. taksit Kasım (EVK md. 30).',
    kaynak: MEVZUAT_KAYNAK.M3
  };
}

/* ---------------------------------------------------------------------
   4. DEĞER ARTIŞ KAZANCI VERGİSİ  (M4)
   Iktisap tarihinden itibaren 5 YIL icinde elden cikarma vergiye tabidir.
   2026 istisna: 150.000 TL.
   ------------------------------------------------------------------- */
var DAK_ISTISNA = 150000;
var DAK_YIL_SINIRI = 5;

/* 2026 gelir vergisi tarifesi — UCRET DISI gelirler (M4).
   Deger artis kazanci bu tarifeye tabidir; ucret tarifesi FARKLIDIR. */
var GELIR_VERGISI_TARIFE = [
  { ust:  190000, oran: 0.15, taban_vergi: 0,       taban_matrah: 0 },
  { ust:  400000, oran: 0.20, taban_vergi: 28500,   taban_matrah: 190000 },
  { ust: 1000000, oran: 0.27, taban_vergi: 70500,   taban_matrah: 400000 },
  { ust: 5300000, oran: 0.35, taban_vergi: 232500,  taban_matrah: 1000000 },
  { ust: Infinity, oran: 0.40, taban_vergi: 1737500, taban_matrah: 5300000 }
];

function gelir_vergisi(matrah) {
  var m = sayi(matrah);
  if (!isFinite(m) || m <= 0) return 0;
  for (var i = 0; i < GELIR_VERGISI_TARIFE.length; i++) {
    var d = GELIR_VERGISI_TARIFE[i];
    if (m <= d.ust) return d.taban_vergi + (m - d.taban_matrah) * d.oran;
  }
  return 0;
}

/* Yil farkini gun hassasiyetinde hesaplar (5 yil siniri icin). */
function yil_farki(baslangic, bitis) {
  var a = new Date(baslangic), b = new Date(bitis);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  var yil = b.getFullYear() - a.getFullYear();
  var ay = b.getMonth() - a.getMonth();
  var gun = b.getDate() - a.getDate();
  if (gun < 0) ay--;
  if (ay < 0) yil--;
  return yil + (ay + (gun < 0 ? 12 : 0)) / 12;
}

/* endeks: {alis_yiufe, satis_yiufe} verilirse maliyet endekslenir.
   GVK mukerrer md.81: artis orani %10 VEYA UZERI olmak sartiyla. */
function deger_artis_kazanci(g) {
  g = g || {};
  var alis = sayi(g.alis_bedeli);
  var satis = sayi(g.satis_bedeli);
  var giderlerHam = sayi(g.giderler);
  /* `|| 0` yerine acik denetim: gider verilmediyse 0 mesrudur ve
     kullanilan deger sonuca `giderler` alaninda yaziliyor. */
  var giderler = isFinite(giderlerHam) ? giderlerHam : 0;

  if (!isFinite(alis) || !isFinite(satis)) {
    return { hata: 'Alış ve satış bedeli gerekli.' };
  }

  var sure = null;
  if (g.alis_tarihi && g.satis_tarihi) {
    sure = yil_farki(g.alis_tarihi, g.satis_tarihi);
  }

  if (g.bedelsiz_iktisap) {
    return {
      vergi_var_mi: false,
      gerekce: 'Bedelsiz iktisap (miras/bağış) yoluyla edinilen taşınmazın ' +
               'elden çıkarılması değer artış kazancina tabi değildir ' +
               '(GVK mukerrer md. 80).',
      kaynak: MEVZUAT_KAYNAK.M4
    };
  }

  if (sure !== null && sure >= DAK_YIL_SINIRI) {
    return {
      vergi_var_mi: false,
      elde_tutma_yili: Math.round(sure * 100) / 100,
      gerekce: DAK_YIL_SINIRI + ' yıldan fazla elde tutulduğu için değer artış ' +
               'kazancı vergisi DOĞMAZ (GVK mukerrer md. 80/6).',
      kaynak: MEVZUAT_KAYNAK.M4
    };
  }

  /* Maliyet endeksleme (istege bagli, veri disaridan gelir). */
  var maliyet = alis;
  var endeks_notu = null;
  var ay = sayi(g.alis_yiufe), ay2 = sayi(g.satis_yiufe);
  if (isFinite(ay) && isFinite(ay2) && ay > 0) {
    var artis = (ay2 - ay) / ay;
    if (artis >= 0.10) {
      maliyet = alis * (ay2 / ay);
      endeks_notu = 'Maliyet Yi-UFE ile endekslendi (artış %' +
                    (Math.round(artis * 1000) / 10) + ').';
    } else {
      endeks_notu = 'Yi-UFE artışı %10\'un altında kaldığı için endeksleme ' +
                    'YAPILAMAZ (GVK mukerrer md. 81).';
    }
  }

  var safi = satis - maliyet - giderler;
  var matrah = safi - DAK_ISTISNA;
  if (matrah < 0) matrah = 0;
  var vergi = gelir_vergisi(matrah);

  return {
    yil: YIL,
    vergi_var_mi: true,
    elde_tutma_yili: sure === null ? null : Math.round(sure * 100) / 100,
    alis_bedeli: Math.round(alis),
    endekslenmis_maliyet: Math.round(maliyet),
    endeks_notu: endeks_notu,
    satis_bedeli: Math.round(satis),
    giderler: Math.round(giderler),
    safi_kazanc: Math.round(safi),
    istisna: DAK_ISTISNA,
    matrah: Math.round(matrah),
    vergi: Math.round(vergi),
    efektif_oran: safi > 0 ? Math.round(vergi / safi * 1000) / 10 : 0,
    beyan: 'İzleyen yılın MART ayında yıllık gelir vergisi beyannamesi ile ' +
           'beyan edilir (GVK md. 92).',
    kaynak: MEVZUAT_KAYNAK.M4
  };
}

/* ---------------------------------------------------------------------
   5. İMAR KURALLARI  (M5) — Planlı Alanlar İmar Yönetmeliği
   ------------------------------------------------------------------- */

/* Md. 5/6 — 1/7/2026'da tamamen degisti (RG 33297). */
function taks_siniri(g) {
  g = g || {};
  if (g.nizam === 'bitisik') {
    return { sinir: null,
             gerekce: 'Bitişik nizam bu fıkra kapsamında değildir; plan hükmü geçerlidir.' };
  }
  if (isFinite(sayi(g.planda_taks, 'oran')) && sayi(g.planda_taks, 'oran') > 0) {
    return { sinir: sayi(g.planda_taks, 'oran'),
             gerekce: 'Planda TAKS belirlenmiş; plan değeri geçerlidir.' };
  }
  if (!g.kaks_var) {
    return { sinir: 0.60, taban_kaks_taks: 0.40,
             gerekce: 'KAKS verilmeyen parsel: %40 ile bulunan KAKS içinde kalmak ve ' +
                      'TAKS %60\'i gecmemek sartiyla yapı yaklaşma mesafelerine göre ' +
                      'uygulama yapılır.' };
  }
  return { sinir: 0.60,
           gerekce: 'Yapı yaklaşma mesafesi ve KAKS var, TAKS yok: TAKS %60\'i geçemez.' };
}

/* Md. 23 — cekme (bahce) mesafeleri.
   On 5,00 m sabit. Yan/arka 3,00 m; 4 kati asan HER KAT icin +0,50 m.
   Yukseklik >= 60,50 m ise tum cephelerde en az 15,00 m. */
function cekme_mesafeleri(g) {
  g = g || {};
  var kat = sayi(g.kat_adedi);
  var yukseklik = sayi(g.yapi_yuksekligi_m);
  var park_komsu = !!g.park_alanina_komsu;

  if (isFinite(yukseklik) && yukseklik >= 60.50) {
    var ek = Math.max(0, Math.ceil((yukseklik - 60.50) / 3)) * 0.50;
    return {
      on: 15.00 + ek, yan: 15.00 + ek, arka: 15.00 + ek,
      gerekce: 'Yapı yüksekliği 60,50 m ve üzeri: tüm parsel sınırlarından en az ' +
               '15,00 m; sonraki her kat için +0,50 m (md. 23/1-g).',
      kaynak: MEVZUAT_KAYNAK.M5
    };
  }

  if (!isFinite(kat) || kat <= 0) return { hata: 'Kat adedi gerekli.' };

  /* Park alanina komsu cephelerde 0,50 m artis UYGULANMAZ (md. 23/1-c). */
  var artis = (kat > 4 && !park_komsu) ? (kat - 4) * 0.50 : 0;

  return {
    on: 5.00,
    yan: 3.00 + artis,
    arka: 3.00 + artis,
    kat_adedi: kat,
    artis: artis,
    gerekce: 'Ön bahçe 5,00 m (kat artışı uygulanmaz). Yan ve arka bahçe 3,00 m; ' +
             '4 katı aşan her kat için +0,50 m.' +
             (park_komsu ? ' Park alanına komşu cephede artış uygulanmadı.' : ''),
    kaynak: MEVZUAT_KAYNAK.M5
  };
}

/* Md. 5/8 — emsal harici alanlarin TOPLAMI, emsale esas alanin %30'unu asamaz.
   (Bazi kalemler bu tavana girmez; onlar ayri hesaplanir.) */
var EMSAL_HARICI_TAVAN = 0.30;

function emsal_harici_kontrol(g) {
  g = g || {};
  var emsale_esas = sayi(g.emsale_esas_alan);
  var harici = sayi(g.emsal_harici_alan);
  if (!isFinite(emsale_esas) || emsale_esas <= 0) {
    return { hata: 'Emsale esas alan geçersiz.' };
  }
  if (!isFinite(harici) || harici < 0) harici = 0;

  var tavan = emsale_esas * EMSAL_HARICI_TAVAN;
  return {
    emsale_esas_alan: Math.round(emsale_esas),
    emsal_harici_alan: Math.round(harici),
    tavan: Math.round(tavan),
    asim: harici > tavan ? Math.round(harici - tavan) : 0,
    uygun_mu: harici <= tavan,
    kullanim_yuzde: Math.round(harici / emsale_esas * 1000) / 10,
    not: 'Yangın merdiveni, teras çatı, bahçedeki açık otopark, deprem yalıtım katı ' +
         've bodrumdaki zorunlu otoparkin 2 katı gibi kalemler bu %30 TAVANINA ' +
         'GİRMEZ (md. 5/8 "Ancak..." bölümü). Aynı kullanım normal katta yapılırsa ' +
         'md. 22\'ye tabidir ve tavana DAHİL olur.',
    kaynak: MEVZUAT_KAYNAK.M5
  };
}

/* ---------------------------------------------------------------------
   6. TAPU DÖNER SERMAYE  (M6)
   ------------------------------------------------------------------- */
var DONER_SERMAYE = {
  gosterge: 2227.00,
  ilave_gosterge: 307.00,
  dogrulanma: true,
  katsayi_dogrulanma: false,   /* il/ilce yoresel katsayi listesi teyit edilemedi */
  not: 'Ücret = (gösterge + varsa ilave gösterge) x yöresel katsayı. KDV dahil. ' +
       'Yöresel katsayılar 1 / 1,5 / 2 / 2,5 / 3 olarak il-ilçe bazında değişir; ' +
       'KATSAYI LİSTESİ DOĞRULANMADI, kullanıcıdan alınmalı.',
  kaynak: MEVZUAT_KAYNAK.M6
};

function doner_sermaye(katsayi, ilave_var) {
  var k = sayi(katsayi);
  if (!isFinite(k) || k <= 0) {
    return { hata: 'Yöresel katsayı gerekli (1 / 1,5 / 2 / 2,5 / 3).' };
  }
  var taban = DONER_SERMAYE.gosterge + (ilave_var ? DONER_SERMAYE.ilave_gosterge : 0);
  return {
    yil: YIL,
    katsayi: k,
    ucret: Math.round(taban * k * 100) / 100,
    dogrulanma: DONER_SERMAYE.katsayi_dogrulanma,
    not: DONER_SERMAYE.not,
    kaynak: MEVZUAT_KAYNAK.M6
  };
}

/* ---------------------------------------------------------------------
   7. DIŞA AÇILAN ARAYÜZ
   ------------------------------------------------------------------- */
var API = {
  YIL: YIL,
  MEVZUAT_KAYNAK: MEVZUAT_KAYNAK,

  YAPI_BIRIM_MALIYET: YAPI_BIRIM_MALIYET,
  konut_sinifi: konut_sinifi,
  insaat_maliyeti: insaat_maliyeti,

  TAPU_HARCI_ORANI: TAPU_HARCI_ORANI,
  guncellik: guncellik,
  tapu_harci: tapu_harci,

  TAVAN_KAT: TAVAN_KAT,
  TAVAN_ILK_YIL: TAVAN_ILK_YIL,
  TAVAN_SON_YIL: TAVAN_SON_YIL,
  deger_tavani: deger_tavani,

  EMLAK_VERGISI_ORANI: EMLAK_VERGISI_ORANI,
  BUYUKSEHIR_ILLERI: BUYUKSEHIR_ILLERI,
  emlak_vergisi: emlak_vergisi,

  DAK_ISTISNA: DAK_ISTISNA,
  DAK_YIL_SINIRI: DAK_YIL_SINIRI,
  GELIR_VERGISI_TARIFE: GELIR_VERGISI_TARIFE,
  gelir_vergisi: gelir_vergisi,
  deger_artis_kazanci: deger_artis_kazanci,

  taks_siniri: taks_siniri,
  cekme_mesafeleri: cekme_mesafeleri,
  EMSAL_HARICI_TAVAN: EMSAL_HARICI_TAVAN,
  emsal_harici_kontrol: emsal_harici_kontrol,

  DONER_SERMAYE: DONER_SERMAYE,
  doner_sermaye: doner_sermaye
};

kok.Mevzuat = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;

})(typeof window !== 'undefined' ? window : globalThis);
