/* =====================================================================
   ARSA REHBERİ — ARAYÜZ
   ---------------------------------------------------------------------
   Burada HESAP YOK. Hesap `cekirdek.js` ve `mevzuat.js` içinde.
   Bu dosya sadece: ekranı kurar, kullanıcıdan bilgi toplar, sonucu yazar.

   Önemli tasarım kararı: form alanlarının çoğu ELLE YAZILMIYOR,
   motorun tanımlarından (Cekirdek.DUZELTME) ÜRETİLİYOR. Böylece motora
   yeni bir faktör eklendiğinde arayüz kendiliğinden uyar; ikisi ayrışmaz.
   ===================================================================== */

(function () {
'use strict';

var C = window.Cekirdek;
var M = window.Mevzuat;

var DEPO_ANAHTAR = 'arsa-rehberi-defter';
var TEMA_ANAHTAR = 'arsa-rehberi-tema';
/* AYRI ANAHTAR - bilerek defterin ya da temanin yaninda degil.
   05 Goz Molasi'nda bu isaret ayar nesnesine konmustu; oradaki
   kaydet() nesneyi alan alan yeniden kurdugu icin isaret 15
   saniyede bir siliniyor, serit her acilista geri geliyordu.
   Burada oyle bir toplu kayit yok ama eklenirse diye ayri. */
var GORULEN_ANAHTAR = 'arsa-rehberi-gorulen';
/* Yarim kalan formun taslagi. AYRI anahtar: defter ve tema
   nesnelerine hic dokunmuyor, o yuzden onlari yeniden kuran bir
   kayit islevi bunu silemez. */
var TASLAK_ANAHTAR = 'arsa-rehberi-taslak';

function $(id) { return document.getElementById(id); }
function el(etiket, sinif, metin) {
    var d = document.createElement(etiket);
    if (sinif) d.className = sinif;
    if (metin !== undefined) d.textContent = metin;
    return d;
}
function tl(x) {
    if (!isFinite(x)) return '—';
    return Number(x).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL';
}
/* YUZDEYI TURKCE YAZ.
   Olculdu (27.08.2026, tarayicida): ekranda "±%32.3" yaziyordu. Para
   dogru yazilirken (381.920 TL) yuzde yanlis yaziliyordu, cunku sayi
   dogrudan metne ekleniyordu ve JavaScript ondalik ayraci NOKTA koyar.
   Turkce'de ondalik ayraci VIRGULDUR.

   Bu sadece gorunum degil: Turkiye'de nokta BINLIK ayracidir. "%32.3"
   okuyan biri bunu 32,3 yerine 323 diye anlayabilir -- uygulama calisir,
   sayi yanlis okunur. Sessiz yanlis sayinin ta kendisi.

   Isaret de basa alindi: TDK yazimi "%45", "45%" degil. Uygulama zaten
   her yerde "%13,7" diye yaziyordu; yalniz "farki yaratan kalemler"
   tablosu "-45%" diyordu. Ayni ekranda iki farkli yazim, hangisinin
   dogru oldugunu bilmeyen kullaniciyi tereddute dusurur. */
function yuzde(x, isaretli) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    var n = Number(x);
    var metin = n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    if (!isaretli) return '%' + metin;
    /* Isaret yuzdenin ONUNE gelir: "-%45", "%-45" degil. */
    return (n > 0 ? '+' : n < 0 ? '-' : '') + '%' + Math.abs(n)
        .toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}
/* Sayi okumayi CEKIRDEGE biraktik. Burada basit bir virgul->nokta
   donusumu vardi ve "1.500,50" girdisini 1,5 okuyordu — 1000 kat sessiz
   hata. Supurme sinamasi yakaladi; cozumleyici cekirdege tasindi ki
   kardes projeler de ayni dogru cozumu kullansin. */
function sayi(x) { return C.sayi_oku(x); }

/* ---------------------------------------------------------------------
   1. EKRAN KURULUMU
   ------------------------------------------------------------------- */

/* Eğim: K7 tablosu yüzde ister, çarpan motoru kategori ister.
   Tek soruyla ikisini de beslemek için eşleme tablosu. */
var EGIM_SECENEK = [
    { deger: '5',  ad: 'Düz (%0–10)',           kategori: 'duz' },
    { deger: '15', ad: 'Hafif meyilli (%11–20)', kategori: 'hafif' },
    { deger: '25', ad: 'Meyilli (%21–30)',       kategori: 'dik' },
    { deger: '35', ad: 'Dik (%31–40)',           kategori: 'dik' },
    { deger: '45', ad: 'Çok dik (%41–50)',       kategori: 'dik' },
    { deger: '60', ad: 'Uçurum gibi (%50+)',     kategori: 'dik' }
];

/* Fiziki bölümde sorulacaklar. Kaynağı motor olanlar `duzeltme` ile
   işaretli; onların seçenekleri koddan üretilir. */
var FIZIKI_ALANLAR = [
    { id: 'gYolaCephe', duzeltme: 'yola_cephe', etiket: 'Yola cephe', yardim: 'yolacephe' },
    { id: 'gAltyapi',   duzeltme: 'altyapi',    etiket: 'Altyapı' },
    { id: 'gKonum',     duzeltme: 'konum',      etiket: 'Yerleşim içindeki konum' },
    { id: 'gGeometri',  duzeltme: 'geometri',   etiket: 'Parsel şekli' },
    { id: 'gEgim', etiket: 'Eğim', secenekler: EGIM_SECENEK },
    { id: 'gAdaIci', etiket: 'Ada içindeki konum', secenekler: [
        { deger: 'kose', ad: 'Köşe parsel (iki yola cepheli)' },
        { deger: 'bas',  ad: 'Baş parsel' },
        { deger: 'ara',  ad: 'Ara parsel' }
    ]},
    { id: 'gBaki', etiket: 'Bakı (hangi yöne bakıyor)', secenekler: [
        { deger: 'guney',      ad: 'Güney' },
        { deger: 'guneydogu',  ad: 'Güneydoğu' },
        { deger: 'guneybati',  ad: 'Güneybatı' },
        { deger: 'bati',       ad: 'Batı' },
        { deger: 'dogu',       ad: 'Doğu' },
        { deger: 'kuzeydogu',  ad: 'Kuzeydoğu' },
        { deger: 'kuzeybati',  ad: 'Kuzeybatı' },
        { deger: 'kuzey',      ad: 'Kuzey' },
        { deger: 'duz',        ad: 'Düz arazi, bakısı yok' }
    ]},
    { id: 'gZemin', etiket: 'Zemin durumu', secenekler: [
        { deger: 'saglam',  ad: 'Sağlam zemin' },
        { deger: 'orta',    ad: 'Orta' },
        { deger: 'alüvyon', ad: 'Alüvyon / gevşek' },
        { deger: 'sorunlu', ad: 'Sorunlu (heyelan, dolgu, taşkın)' }
    ]},
    { id: 'gDeprem', etiket: 'Deprem bölgesi', secenekler: [
        { deger: '5', ad: '5. derece (en düşük risk)' },
        { deger: '4', ad: '4. derece' },
        { deger: '3', ad: '3. derece' },
        { deger: '2', ad: '2. derece' },
        { deger: '1', ad: '1. derece (en yüksek risk)' }
    ]},
    { id: 'gManzara', etiket: 'Manzara', secenekler: [
        { deger: 'var', ad: 'Manzarası var' },
        { deger: 'yok', ad: 'Manzarası yok' }
    ]}
];

var MESAFE_ALANLAR = [
    { id: 'gAnaCadde',  etiket: 'Ana caddeye',     anahtar: 'ana_cadde_m' },
    { id: 'gMerkez',    etiket: 'Merkeze',         anahtar: 'merkez_m' },
    { id: 'gEgitim',    etiket: 'Okula',           anahtar: 'egitim_m' },
    { id: 'gYesilAlan', etiket: 'Parka / yeşile',  anahtar: 'yesil_alan_m' },
    { id: 'gSaglik',    etiket: 'Sağlık ocağına',  anahtar: 'saglik_m' }
];

var YARDIM = {
    emsal: {
        baslik: 'Emsal birim fiyat nedir?',
        metin: '<p>Yakınınızdaki benzer bir arsanın <b>metrekare fiyatı</b>. ' +
               'Emlakçıya "buralarda arsanın metrekaresi kaça gidiyor" diye ' +
               'sorabilir, ya da yakın zamanda satılan bir parselin fiyatını ' +
               'kullanabilirsiniz.</p>' +
               '<p><b>Neden biz vermiyoruz?</b> Çünkü arsa fiyatı mahalleden ' +
               'mahalleye değişiyor ve bunun bilimsel karşılığı var: hakemli ' +
               'bir çalışmada tek bir şehirde mahalleler arası fark %5,5 ile ' +
               '%20,6 arasında ölçülmüş. Türkiye geneli tek bir fiyat listesi ' +
               'kurmak dürüst olmaz.</p>' +
               '<p>Bizim yaptığımız şey: <b>sizin verdiğiniz rakamı</b>, ' +
               'parselin özelliklerine göre yukarı veya aşağı düzeltmek.</p>'
    },

    /* AÇIKLAMA "NE DEMEK" DEĞİL, "NEREDEN BULACAKSIN" DEMEK.
       Uygulamanın işi sayıyı hesaplamak değil, kullanıcıyı doğru veriye
       ulaştırmak. Bilmediği bir sayıyı isteyip nereden alacağını
       söylememek, aralığın geniş kalmasının asıl sebebi — ve aralık
       geniş kalırsa rapor işe yaramaz.
       Sıra ölçüme göre: KAKS 6,03× · imar fonksiyonu 4,50× ·
       tapu türü 1,67× (motorun `etki_araligi` çıktısı). */
    kaks: {
        baslik: 'KAKS / Emsal nedir, nereden bulurum?',
        metin: '<p><b>Ne demek:</b> Arsanın kaç <b>katı</b> toplam inşaat ' +
               'yapılabileceği. 500 m² arsada KAKS 1,50 ise toplam ' +
               '<b>750 m²</b> inşaat hakkınız var demektir.</p>' +
               '<p><b>Nerede yazar:</b> Belediyeden alınan <b>İmar Durumu ' +
               'Belgesi</b>nde (halk arasında “çap”) — <b>“Emsal (E)”</b> ya ' +
               'da <b>“KAKS”</b> satırında. Belgeyi belediyenin <b>İmar ve ' +
               'Şehircilik Müdürlüğü</b> verir; çoğu belediyede e-belediye ' +
               'üzerinden de sorgulanabiliyor.</p>' +
               '<p><b>Yanınıza alın:</b> ada ve parsel numarası. İkisi de ' +
               'tapu senedinizde yazar.</p>' +
               '<p><b>Karıştırmayın:</b> “emsal” bu uygulamada iki ayrı yerde ' +
               'geçiyor. Burada <b>yapılaşma katsayısı</b> kastediliyor; ' +
               '“emsal birim fiyat” ise komşu parselin metrekare fiyatıdır.</p>'
    },
    taks: {
        baslik: 'TAKS nedir, nereden bulurum?',
        metin: '<p><b>Ne demek:</b> Arsanın yüzde kaçının üstüne ' +
               '<b>oturulabileceği</b> — yani binanın zemindeki ayak izi. ' +
               '500 m² arsada TAKS 0,30 ise taban en fazla <b>150 m²</b> olur.</p>' +
               '<p><b>Nerede yazar:</b> KAKS ile aynı belgede — <b>İmar Durumu ' +
               'Belgesi</b>, <b>“TAKS”</b> satırı.</p>' +
               '<p>TAKS binanın <b>genişliğini</b>, KAKS <b>toplam inşaatı</b> ' +
               'sınırlar. İkisi birlikte kaç kat çıkabileceğinizi belirler.</p>'
    },
    fonksiyon: {
        baslik: 'İmar fonksiyonu nedir, nereden bulurum?',
        metin: '<p><b>Ne demek:</b> Parselin imar planında <b>ne için</b> ' +
               'ayrıldığı: konut, ticaret, sanayi, turizm, tarım…</p>' +
               '<p><b>Nerede yazar:</b> <b>İmar Durumu Belgesi</b>nin üst ' +
               'kısmında <b>“Plan Fonksiyonu”</b> ya da <b>“Kullanım ' +
               'Kararı”</b> olarak geçer. Belediyenin <b>imar planı ' +
               'paftasında</b> da rengiyle bellidir (konut sarı, ticaret ' +
               'kırmızı, yeşil alan yeşil).</p>' +
               '<p><b>Önemli:</b> Parsel <b>yol, park veya kamu alanına</b> ' +
               'isabet ediyorsa bu, değer değil <b>ruhsat</b> meselesidir; ' +
               'raporun risk bölümünde ayrıca çıkar.</p>'
    },
    tapu: {
        baslik: 'Tapu müstakil mi hisseli mi, nereden anlarım?',
        metin: '<p><b>Nerede yazar:</b> <b>Tapu senedinde</b> “Hisse” ' +
               'sütununa bakın. <b>1/1</b> yazıyorsa tapu tek başına ' +
               'sizindir (müstakil). <b>1/4, 3/8</b> gibi bir kesir varsa ' +
               '<b>hisseli</b>dir.</p>' +
               '<p><b>Elinizde tapu yoksa:</b> e-Devlet → <b>Tapu ve Kadastro ' +
               'Genel Müdürlüğü</b> → “Tapu Bilgilerim”.</p>' +
               '<p><b>Neden önemli:</b> Hisseli tapuda parselin belirli bir ' +
               'yeri size ait değildir; satış, ipotek ve inşaat için diğer ' +
               'hissedarların onayı gerekir. Piyasada ciddi iskonto görür.</p>'
    },
    yolacephe: {
        baslik: 'Yola cephe — hangi yol sayılır?',
        metin: '<p><b>Ne demek:</b> Parselin <b>imar planındaki bir yola</b> ' +
               'değip değmediği. Ruhsat için belirleyicidir.</p>' +
               '<p><b>Nerede görülür:</b> Belediyenin <b>imar planı ' +
               'paftasında</b>, parselin sınırının imar yoluna değip ' +
               'değmediğine bakılır. İmar müdürlüğünde okutabilirsiniz.</p>' +
               '<p><b>Dikkat:</b> <b>Kadastro yolu</b> ile <b>imar yolu</b> ' +
               'aynı şey değildir. Araçla gidebiliyor olmanız, o yolun imar ' +
               'planında yol olduğu anlamına gelmez. İmar yoluna cephesi ' +
               'olmayan parselde kural olarak <b>inşaat ruhsatı alınamaz</b>.</p>' +
               /* KAPANAN KAPIYI YAZIYORSAN ACIK KALANI DA YAZ.
                  Buraya kadar dogruydu ama EKSIKTI: yonetmelik iki cikis
                  yolu tanimliyor ve ikisinin de kosullari var. Cozumu
                  yazmadan yalniz yasagi yazmak, kullaniciyi olmadigi
                  kadar caresiz birakir -- ayni zararin oteki yonu. */
               '<p><b>Peki ne yapılabilir?</b> Planlı Alanlar İmar ' +
               'Yönetmeliği iki yol tanımlıyor:</p>' +
               '<p><b>1) Tevhit (birleştirme).</b> Yola cephesi olan ' +
               'komşu bir parselle birleştirilir. Diğer hükümler ' +
               'uygulanamıyorsa bu <b>zorunludur</b> — yani komşuyla ' +
               'anlaşmak tek yol olabilir.</p>' +
               '<p><b>2) Geçit hakkı.</b> Ruhsat verilebilmesi için üç ' +
               'koşulun <b>birlikte</b> sağlanması gerekir: parsel ' +
               'yönetmelikten <b>önce</b> oluşmuş olmalı, bitişiğinde ' +
               'boş parsel <b>bulunmamalı</b>, ve komşu parsellerden ' +
               '<b>sınırsız</b> geçit hakkı alınıp <b>tapuya şerh</b> ' +
               'edilmiş olmalı. Sözlü izin ya da fiilen kullanılan yol ' +
               'yetmez.</p>' +
               '<p class="kucuk">Bu bir hukuki görüş değildir; kesin ' +
               'durumu belediyenin imar müdürlüğü söyler.</p>'
    }
};

function secenek_ekle(select, deger, ad) {
    var o = document.createElement('option');
    o.value = deger; o.textContent = ad;
    select.appendChild(o);
}

function bos_secenekli(select, metin) {
    secenek_ekle(select, '', metin || '— bilmiyorum / boş bırak —');
}

function ekrani_kur() {
    /* Belediye hizmetleri onay kutuları — motorun listesinden üretilir. */
    var hk = $('hizmetKutu');
    C.BELEDIYE_HIZMETLERI.forEach(function (h) {
        var lab = el('label', 'onay');
        var inp = document.createElement('input');
        inp.type = 'checkbox'; inp.dataset.hizmet = h;
        lab.appendChild(inp);
        lab.appendChild(el('span', null, C.HIZMET_ADI[h]));
        hk.appendChild(lab);
    });

    /* Tapu türü ve imar fonksiyonu — doğrudan motor tanımından. */
    var tt = $('gTapuTuru');
    bos_secenekli(tt);
    Object.keys(C.DUZELTME.tapu_turu.secenek).forEach(function (k) {
        secenek_ekle(tt, k, C.DUZELTME.tapu_turu.secenek[k].ad);
    });

    var fn = $('gFonksiyon');
    bos_secenekli(fn);
    Object.keys(C.DUZELTME.imar_fonksiyon.secenek).forEach(function (k) {
        secenek_ekle(fn, k, C.DUZELTME.imar_fonksiyon.secenek[k].ad);
    });

    /* Fiziki alanlar */
    var fk = $('fizikiKutu');
    FIZIKI_ALANLAR.forEach(function (a) {
        var lab = el('label', 'alan');
        var sp = el('span', 'etiket');
        sp.appendChild(el('b', null, a.etiket));
        /* Terim açıklaması — HTML'de değil burada, çünkü bu alanlar
           koddan üretiliyor. Açıklama "ne demek" değil "nereden
           bulacaksın" diyor. */
        if (a.yardim) {
            var yb = el('button', 'yardim', '?');
            yb.type = 'button';
            yb.dataset.yardim = a.yardim;
            sp.appendChild(yb);
        }
        lab.appendChild(sp);

        var sel = document.createElement('select');
        sel.id = a.id;
        /* Etiketin ICINDE once "?" dugmesi var. HTML kuralina gore bir
           <label> ICINDEKI ILK adlandirilabilir ogeyi adlandirir -- ve
           <button> adlandirilabilir. Yani etiket dugmeyi adlandiriyor,
           alani DEGIL: ekran okuyucu alanda "adsiz" diyor.
           Olculdu (28.08.2026, tarayicida): labels.length = 0.
           `for` yazmak bu sirayi ezer. */
        lab.htmlFor = a.id;
        bos_secenekli(sel);

        if (a.duzeltme) {
            var tanim = C.DUZELTME[a.duzeltme];
            Object.keys(tanim.secenek).forEach(function (k) {
                secenek_ekle(sel, k, tanim.secenek[k].ad);
            });
        } else {
            a.secenekler.forEach(function (s) { secenek_ekle(sel, s.deger, s.ad); });
        }
        lab.appendChild(sel);
        fk.appendChild(lab);
    });

    /* Mesafeler */
    var mk = $('mesafeKutu');
    MESAFE_ALANLAR.forEach(function (a) {
        var lab = el('label', 'alan');
        var sp = el('span', 'etiket');
        sp.appendChild(el('b', null, a.etiket));
        var i = el('i', null, '(m)');
        sp.appendChild(i);
        lab.appendChild(sp);
        var inp = document.createElement('input');
        inp.type = 'text'; inp.id = a.id; inp.inputMode = 'numeric';
        inp.placeholder = 'örn. 300';
        lab.appendChild(inp);
        mk.appendChild(lab);
    });
}

/* ---------------------------------------------------------------------
   2. GİRDİ TOPLAMA
   Tek bir nesne üretir; hem çekirdek hem mevzuat bunu kullanır.
   ------------------------------------------------------------------- */
function girdi_topla() {
    var g = {};

    g.alan = sayi($('gAlan').value);
    g.emsal_birim_fiyat = sayi($('gEmsalFiyat').value);

    g.belediye_icinde = $('gBelediye').checked;
    g.imar_plani_var = $('gImarPlani').checked;
    g.takyidat_var = $('gTakyidat').checked;
    g.kamulastirma_riski = $('gKamulastirma').checked;

    g.hizmetler = {};
    document.querySelectorAll('[data-hizmet]').forEach(function (i) {
        if (i.checked) g.hizmetler[i.dataset.hizmet] = true;
    });

    g.tapu_turu = $('gTapuTuru').value || undefined;
    g.imar_fonksiyon = $('gFonksiyon').value || undefined;
    g.yola_cephe = $('gYolaCephe').value || undefined;
    g.altyapi = $('gAltyapi').value || undefined;
    g.konum = $('gKonum').value || undefined;
    g.geometri = $('gGeometri').value || undefined;

    /* Eğim tek soruyla iki motoru birden besler. */
    var egimDeger = $('gEgim').value;
    if (egimDeger) {
        g.egim_yuzde = Number(egimDeger);
        var esles = EGIM_SECENEK.filter(function (s) { return s.deger === egimDeger; })[0];
        if (esles) g.egim = esles.kategori;
    }

    g.ada_ici_konum = $('gAdaIci').value || undefined;
    g.baki = $('gBaki').value || undefined;
    g.zemin = $('gZemin').value || undefined;
    var dep = $('gDeprem').value;
    if (dep) g.deprem_bolgesi = Number(dep);
    var manz = $('gManzara').value;
    if (manz) g.manzara = (manz === 'var');

    MESAFE_ALANLAR.forEach(function (a) {
        var v = sayi($(a.id).value);
        if (v !== null) g[a.anahtar] = v;
    });

    /* TAKS ve KAKS ORAN alanidir: "1,500" burada 1,5 demektir, 1500 degil.
       Ayni dizi fiyat alaninda 1500 TL demek — bu yuzden tur bildiriliyor. */
    g.taks = C.sayi_oku($('gTaks').value, 'oran');
    g.kaks = C.sayi_oku($('gKaks').value, 'oran');

    /* Nominal modül parsel şeklini `sekil` adıyla bekliyor. */
    if (g.geometri) {
        g.sekil = (g.geometri === 'duzgun') ? 'dortgen'
                : (g.geometri === 'duzensiz') ? 'cokgen' : 'ucgen';
    }

    /* Hukuki vasfı kullanıcıya ayrıca sormuyoruz — belediye/plan/hizmet
       cevaplarından Yargıtay ölçütüyle ZATEN çıkıyor. Değer motoruna da
       oradan besliyoruz ki "vasıf bilinmiyor" diye bant boşuna genişlemesin. */
    /* HER ZAMAN hesapla. Once "belediye kutusu isaretliyse" sartina baglıydi
       ve koy tarlasi senaryosunda su celiski cikti: rapor ustte "ARAZI" yazip
       altta "hukuki vasif bilgisi eksik" diyordu. Ayni raporda hem biliyor
       hem bilmiyordu. Kutunun BOS olmasi da bir bilgidir (belediye disinda). */
    g.nitelik = C.vasif_belirle(g).kod;

    return g;
}

/* Bilgi kapsamı: kullanıcı ne kadar doldurdu? Kesinlik taklidine karşı
   en basit araç — kullanıcı eksiğini GÖRÜR. */
var KAPSAM_ALANLARI = [
    'alan', 'emsal_birim_fiyat', 'tapu_turu', 'imar_fonksiyon', 'yola_cephe',
    'altyapi', 'konum', 'geometri', 'egim_yuzde', 'ada_ici_konum', 'baki',
    'zemin', 'deprem_bolgesi', 'manzara', 'taks', 'kaks',
    'ana_cadde_m', 'merkez_m', 'egitim_m', 'yesil_alan_m', 'saglik_m'
];

function kapsam_hesapla(g) {
    var dolu = 0;
    KAPSAM_ALANLARI.forEach(function (k) {
        var v = g[k];
        if (v !== undefined && v !== null && v !== '') dolu++;
    });
    /* Belediye hizmetleri tek bir kalem sayılır. */
    var toplam = KAPSAM_ALANLARI.length + 1;
    if (Object.keys(g.hizmetler || {}).length > 0) dolu++;
    return Math.round(dolu / toplam * 100);
}

/* Raporun hesaplandigi ANDAKI girdilerin parmak izi.
   Olculdu (26.08.2026): rapor alindiktan sonra formu degistirince rapor
   ESKI parselin sayilarini gostermeye devam ediyordu — alan tamamen
   bosaltilsa bile. Kullanici artik girmedigi bir parselin rakamlarini
   okuyordu. Ayni kusuru 09 Hesap Araclari'nda bulmustum; kendi projemde
   bakmayi atlamisim. */
var sonHesapImzasi = null;

function girdi_imzasi(g) {
    return JSON.stringify(g);
}

function bayatlik_guncelle(g) {
    var kutu = $('bayatUyari');
    if (!kutu) return;
    var bayat = sonHesapImzasi !== null && girdi_imzasi(g) !== sonHesapImzasi;
    kutu.hidden = !bayat;
    document.querySelectorAll('#raporIcerik, #imarIcerik').forEach(function (e) {
        e.classList.toggle('bayat', bayat);
    });
}

function kapsam_guncelle() {
    var g = girdi_topla();
    var y = kapsam_hesapla(g);

    $('kapsamYuzde').textContent = yuzde(y);
    $('kapsamDolgu').style.width = y + '%';

    var rozet = $('kapsamRozet');
    rozet.textContent = 'bilgi: ' + yuzde(y);
    rozet.className = 'rozet ' + (y >= 70 ? 'iyi' : y >= 35 ? 'orta' : 'bekle');

    var not;
    if (!g.alan) not = 'Boş. En az arsa alanını girin.';
    else if (!g.emsal_birim_fiyat) not = 'Emsal fiyat girilmeden değer tahmini yapılamaz.';
    else if (y < 35) not = 'Az bilgi var; tahmin aralığı çok geniş çıkacak.';
    else if (y < 70) not = 'İdare eder. Doldurdukça aralık daralır.';
    else not = 'İyi. Bu kadar bilgiyle aralık epey daralır.';
    $('kapsamNot').textContent = not;

    /* Örnek teklifi YALNIZ hiçbir şey girilmemişken görünür; kullanıcı
       kendi verisini girmeye başladıysa yolundan çekilir. */
    var ob = $('kapsamOrnekBtn');
    if (ob) ob.hidden = !!(g.alan || g.emsal_birim_fiyat);

    vasif_goster(g);
    bayatlik_guncelle(g);
}

/* Hukuki vasıf CANLI gösterilir — kullanıcı kutuları işaretlerken
   sonucun değiştiğini anında görsün. Uygulamanın en önemli anı bu. */
function vasif_goster(g) {
    var kutu = $('vasifSonuc');
    if (!g.belediye_icinde && Object.keys(g.hizmetler || {}).length === 0) {
        kutu.hidden = true;
        return;
    }
    var v = C.vasif_belirle(g);
    kutu.hidden = false;
    kutu.className = 'vasif-kutu ' +
        (v.kod === 'arsa' ? 'arsa' : v.kod === 'arsa_plansiz' ? 'uyari' : 'arazi');
    kutu.innerHTML = '';
    kutu.appendChild(el('p', 'vasif-sonuc', 'Hukuken: ' + v.sonuc));
    kutu.appendChild(el('p', 'vasif-gerekce', v.gerekce));
    if (v.eksik_hizmetler.length) {
        kutu.appendChild(el('p', 'alt-not', 'Gelmeyen hizmetler: ' +
                            v.eksik_hizmetler.join(', ')));
    }
}

/* ---------------------------------------------------------------------
   3. RAPOR
   ------------------------------------------------------------------- */
/* Kritik engelleri DEGERIN USTUNE yazan kisa bant.
   Amac sayiyi gizlemek degil, sayinin hangi kosulla gecerli oldugunu
   sayidan ONCE soylemek. */
function engel_bandi(r) {
    var kritikler = (r.bulgular || []).filter(function (b) { return b.seviye === 'kritik'; });
    var d = el('div', 'engel-bandi');
    d.appendChild(el('p', 'engel-baslik', kritikler.length === 1
        ? 'Bu parselde kritik bir engel var'
        : 'Bu parselde ' + kritikler.length + ' kritik engel var'));
    var liste = el('ul', 'engel-liste');
    kritikler.forEach(function (b) { liste.appendChild(el('li', null, b.baslik)); });
    d.appendChild(liste);
    d.appendChild(el('p', 'engel-not',
        'Aşağıdaki değer, bu engeller giderilebilirse geçerlidir. ' +
        'Giderilemezse parsel bu fiyata alıcı bulmayabilir. Ne yapmanız ' +
        'gerektiği aşağıdaki “Risk taraması” bölümünde yazılı.'));
    return d;
}

/* ---------------------------------------------------------------------
   ARALIGI DARALTAN SORULAR
   ---------------------------------------------------------------------
   NEDEN VAR: uygulama iki alanla sonuc veriyor ama o sonucun bandi
   +/-%60 olabiliyor -- "arsaniz 8,6 ile 15,3 milyon arasi eder". Boyle
   bir cevap kullaniciya hicbir sey soylemez; ise yaramaz bir cevap, hic
   cevap vermemekten kotudur cunku kullanici uygulamayi kapatir.

   Motor hangi bilginin eksik oldugunu (`eksik_bilgi`) ve hangi faktorun
   sonucu ne kadar oynatabildigini (`etki_araligi`) ZATEN biliyor; bu
   bilgi ekranda yoktu. Var olan bilgiyi gostermek, yeni ozellik
   yazmaktan hem ucuz hem saglam.

   SIRALAMA OLCULUR, TAHMIN EDILMEZ. `etki_araligi` en iyi/en kotu
   secenek arasindaki carpani verir ve RUHSAT ENGELLERINI disarida
   birakir (onlar deger kademesi degil, risk taramasinin isi). Kendi
   "bence bu onemli" siralamamizi yazsaydik kullaniciya YANLIS oncelik
   gosterirdik.

   SOYLENEN SAYI DA HESAPLANIR. Bant formulu tavanli (%60), o yuzden
   "her cevap 4,5 puan daraltir" HER ZAMAN dogru degil. Uc soru
   cevaplanmis gibi yeniden hesaplayip gercek sonucu yaziyoruz. */
var ALAN_ESLEME = {
    nitelik:        'gBelediye',
    imar_fonksiyon: 'gFonksiyon',
    kaks:           'gKaks',
    yola_cephe:     'gYolaCephe',
    altyapi:        'gAltyapi',
    konum:          'gKonum',
    tapu_turu:      'gTapuTuru',
    egim:           'gEgim',
    geometri:       'gGeometri'
};

function alana_git(id) {
    sekme_ac('sParsel');
    var e = document.getElementById(id);
    if (!e) return;
    var kap = e.closest('details');
    if (kap) kap.open = true;
    setTimeout(function () {
        e.scrollIntoView({ block: 'center', behavior: 'smooth' });
        try { e.focus({ preventScroll: true }); } catch (x) { try { e.focus(); } catch (y) {} }
        e.classList.add('alan-vurgu');
        setTimeout(function () { e.classList.remove('alan-vurgu'); }, 1800);
    }, 60);
}

/* Uc soru cevaplansa bant ne olurdu? Emsalle AYNI cevap varsayilir:
   oran 1 olur, katsayi belirsizligi bulasmaz -- yani bu, cevaplamanin
   getirebilecegi EN IYI durum. Kullaniciya "en az bu kadar" diyoruz. */
function bant_ne_olurdu(emsal, hedef, anahtarlar) {
    var deneme = {};
    Object.keys(hedef).forEach(function (a) { deneme[a] = hedef[a]; });
    anahtarlar.forEach(function (a) {
        if (deneme[a] === undefined && emsal[a] !== undefined) deneme[a] = emsal[a];
    });
    var an = C.deger_analizi(emsal, deneme);
    return an && !an.hata ? an.bant_yuzde : null;
}

function daraltan_sorular(an, emsal, g) {
    var eksik = (an.carpan && an.carpan.eksik_bilgi) || [];
    if (!eksik.length) return null;

    var sirali = eksik.map(function (e) {
        return { anahtar: e.anahtar, ad: e.ad, soru: e.soru,
                 etki: C.etki_araligi(e.anahtar) || 1 };
    }).sort(function (a, b) { return b.etki - a.etki; });

    var ilk3 = sirali.slice(0, 3);
    var sonra = bant_ne_olurdu(emsal, g, ilk3.map(function (x) { return x.anahtar; }));
    var hepsiSonra = bant_ne_olurdu(emsal, g, sirali.map(function (x) { return x.anahtar; }));

    var d = el('div', 'daraltan');
    d.appendChild(el('h3', 'daraltan-baslik', 'Aralığı daraltmak için'));

    /* Asıl motive eden sayı "3 soru" değil, "hepsi": bant tavanlı (%60)
       olduğu için 3 soru azken azı götürür. İkisini de yazıyoruz — hangisi
       daha çarpıcı diye değil, ikisi de doğru olduğu için. */
    var satirlar = ['Şu an aralık ±' + yuzde(an.bant_yuzde) + '.'];
    if (hepsiSonra !== null && hepsiSonra < an.bant_yuzde) {
        satirlar.push('Eksik ' + eksik.length + ' bilginin hepsini girersen ±' +
                      yuzde(hepsiSonra) + "'e iner.");
    }
    if (sonra !== null && sonra < an.bant_yuzde) {
        satirlar.push('Yalnız aşağıdaki ' + ilk3.length + ' soru bile ±' + yuzde(sonra) +
                      "'e indirir — ve sonucu en çok bunlar değiştirir:");
    } else {
        satirlar.push('En çok bunlar sonucu değiştirir:');
    }
    d.appendChild(el('p', 'daraltan-not', satirlar.join(' ')));

    var liste = el('ol', 'daraltan-liste');
    ilk3.forEach(function (x) {
        var li = el('li');
        var ust = el('div', 'daraltan-ust');
        ust.appendChild(el('span', 'daraltan-ad', x.ad));
        if (x.etki > 1.05) {
            var kat = (Math.round(x.etki * 10) / 10).toString().replace('.', ',');
            ust.appendChild(el('span', 'daraltan-etki', kat + '× fark'));
        }
        li.appendChild(ust);
        li.appendChild(el('p', 'daraltan-soru', x.soru));
        var btn = el('button', 'daraltan-git', 'Bu soruyu cevapla');
        btn.type = 'button';
        btn.onclick = function () { alana_git(ALAN_ESLEME[x.anahtar]); };
        li.appendChild(btn);
        liste.appendChild(li);
    });
    d.appendChild(liste);

    if (eksik.length > ilk3.length) {
        d.appendChild(el('p', 'daraltan-alt',
            'Kalan ' + (eksik.length - ilk3.length) +
            ' bilgi de aralığı daraltır ama sonucu daha az oynatır.'));
    }
    return d;
}

/* ---------------------------------------------------------------------
   RAPORU DISARI CIKARMA — yazdir/PDF ve panoya kopyala
   ---------------------------------------------------------------------
   NEDEN: arsa bakan biri raporu esine, ortagina, emlakciya gosterecek.
   Su an cikti yalnizca ekranda kaliyor.

   NEDEN BAGLANTI DEGIL: girdileri URL'ye koymak 09'da calisiyor ama arsa
   formu uzun; adres sisip WhatsApp'ta kirilir. Yazdirma ve panoya kopyalama
   ise CEVRIMDISI calisir, sunucu istemez -- ve gosterilecek sey zaten bir
   belge.

   KAGITTA DA AYNI SIRA. Ekranda kritik engelleri sayinin ustune aldik;
   yazdirmada altina kacsaydi ayni hatayi kagitta tekrarlamis olurduk.
   Yazdirma duzeni raporun DOM sirasini korur, o yuzden sira kendiliginden
   dogru -- ama olculdu, varsayilmadi. */
function rapor_metni() {
    var kok = $('raporIcerik');
    if (!kok || kok.hidden) return '';
    var satir = [];
    satir.push('ARSA REHBERİ — PARSEL ÖN DEĞERLENDİRMESİ');
    satir.push(new Date().toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric' }));
    satir.push('');

    /* Kritik engeller EN USTE — panoya yapistirilan metinde de uyari
       sayidan once gelmeli. */
    var bant = kok.querySelector('.engel-bandi');
    if (bant) {
        satir.push('!! ' + bant.querySelector('.engel-baslik').textContent.trim());
        Array.prototype.forEach.call(bant.querySelectorAll('li'), function (li) {
            satir.push('   - ' + li.textContent.trim());
        });
        satir.push('');
    }

    var vasif = kok.querySelector('.vasif-sonuc');
    if (vasif) {
        satir.push('HUKUKİ DURUM: ' + vasif.textContent.trim());
        var ger = kok.querySelector('.vasif-gerekce');
        if (ger) satir.push(ger.textContent.trim());
        satir.push('');
    }

    var orta = kok.querySelector('.bant .orta');
    var aralik = kok.querySelector('.bant .aralık');
    if (orta) {
        satir.push('DEĞER TAHMİNİ');
        satir.push('  ' + orta.textContent.trim());
        if (aralik) satir.push('  ' + aralik.textContent.replace(/\s+/g, ' ').trim());
    }

    /* Deger karti satirlari: "ad: deger". Guven etiketi ADIN icinde
       oldugu icin ayri okunuyor, yoksa "Altyapikalibre" gibi yapisik
       bir metin cikiyordu (olculdu). */
    Array.prototype.forEach.call(kok.querySelectorAll('.kart-blok .satir'), function (s) {
        /* Deger `<span class="deger">` icinde; ilk yazdigimda `b` aradim
           ve TOPLAM ile yontem satirlari metinden sessizce dustu.
           Sinama yuzeyi olmasaydi bunu goremezdim. */
        var ad = s.querySelector('.ad'), dg = s.querySelector('.deger');
        if (!ad || !dg) return;
        var etiket = ad.querySelector('.etiket-kucuk');
        var adMetni = (ad.childNodes[0] ? ad.childNodes[0].textContent : ad.textContent).trim();
        satir.push('  ' + adMetni + ': ' + dg.textContent.trim() +
                   (etiket ? '  [' + etiket.textContent.trim() + ']' : ''));
    });
    satir.push('');

    var risk = kok.querySelector('#rRisk');
    if (risk && risk.textContent.trim()) {
        satir.push('RİSK TARAMASI');
        Array.prototype.forEach.call(risk.querySelectorAll('.bulgu'), function (b) {
            var bas = b.querySelector('.bulgu-baslik') || b.querySelector('b');
            if (bas) satir.push('  - ' + bas.textContent.trim());
        });
        satir.push('');
    }

    var uyari = $('rUyari');
    if (uyari) satir.push(uyari.textContent.replace(/\s+/g, ' ').trim());
    return satir.join('\n');
}

function rapor_eylemleri_bagla() {
    var yb = $('yazdirBtn'), kb = $('kopyalaBtn'), durum = $('kopyaDurum');
    if (yb) yb.onclick = function () {
        var t = $('rTarih');
        if (t) t.textContent = new Date().toLocaleDateString('tr-TR',
            { year: 'numeric', month: 'long', day: 'numeric' });
        window.print();
    };
    if (kb) kb.onclick = function () {
        var metin = rapor_metni();
        if (!metin) { durum.textContent = 'Önce raporu çıkarın.'; return; }
        function bildir(ok) {
            durum.textContent = ok ? 'Kopyalandı.' : 'Kopyalanamadı — metni elle seçin.';
            setTimeout(function () { durum.textContent = ''; }, 3000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(metin).then(function () { bildir(true); },
                                                      function () { bildir(false); });
        } else {
            /* Eski tarayici / güvensiz baglam: yedek yol. */
            var ta = document.createElement('textarea');
            ta.value = metin; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            ta.remove(); bildir(ok);
        }
    };
}

function kart(baslik) {
    var k = el('div', 'kart-blok');
    if (baslik) k.appendChild(el('h2', null, baslik));
    return k;
}

function satir_ekle(kap, ad, deger, sinif) {
    var s = el('div', 'satir');
    s.appendChild(el('span', 'ad', ad));
    s.appendChild(el('span', 'deger' + (sinif ? ' ' + sinif : ''), deger));
    kap.appendChild(s);
    return s;
}

function rapor_ciz() {
    var g = girdi_topla();

    if (!g.alan) { uyar('Önce arsa alanını girin.'); return false; }

    $('raporBos').hidden = true;
    $('raporIcerik').hidden = false;

    /* --- Hukuki vasıf --- */
    var v = C.vasif_belirle(g);
    var kv = kart('Hukuki durum');
    var vk = el('div', 'vasif-kutu ' +
        (v.kod === 'arsa' ? 'arsa' : v.kod === 'arsa_plansiz' ? 'uyari' : 'arazi'));
    vk.appendChild(el('p', 'vasif-sonuc', v.sonuc));
    vk.appendChild(el('p', 'vasif-gerekce', v.gerekce));
    kv.appendChild(vk);
    var kay = el('p', 'kaynak-liste', 'Dayanak: ' + v.kaynak);
    kv.appendChild(kay);
    $('rVasif').innerHTML = ''; $('rVasif').appendChild(kv);

    /* --- Risk taraması ÖNCE koşar --------------------------------------
       Ölçüldü (27.08.2026, gerçek ekranda): hisseli tapulu ve yola cephesi
       olmayan bir parselde ekran şunu gösteriyordu —

           y=444   "1.347 TL/m²"  ·  "500 m² için toplam 673.500 TL"  (32 px)
           y=1031  "Risk taraması" → 2 KRİTİK bulgu

       Pencere yüksekliği 720. Yani kullanıcı güvenli görünen bir rakamı
       görüyor, "üstüne bir şey yapılamaz" ve "ruhsat alınamaz" bilgisini
       görmek için ~600 px aşağı kaydırması gerekiyordu. Hesap doğruydu,
       SUNUM yanlış sıradaydı — 09'daki kıdem tazminatı hatasının kardeşi:
       uyarı, yalanladığı sayının ALTINDA kalmamalı.
       Ayrıntı ve "ne yapmalı" aşağıdaki bölümde kalıyor; buraya yalnız
       engelin varlığı ve sayının hangi koşulla geçerli olduğu yazılıyor. */
    var r = C.risk_tara(g);

    /* --- Değer analizi --- */
    var kd = $('rDeger'); kd.innerHTML = '';
    if (r.kritik_sayisi > 0) kd.appendChild(engel_bandi(r));
    if (!g.emsal_birim_fiyat) {
        var uyari_k = kart('Değer tahmini');
        uyari_k.appendChild(el('p', 'alt-not',
            'Emsal birim fiyat girilmediği için değer tahmini yapılamadı. ' +
            'Parsel sekmesindeki 1. bölümden girebilirsiniz.'));
        kd.appendChild(uyari_k);
    } else {
        var emsal = emsal_kur(g);
        var an = C.deger_analizi(emsal, g);
        kd.appendChild(deger_karti(an, g, daraltan_sorular(an, emsal, g)));
    }

    /* --- Risk taraması (tam liste, ne yapmalı ile) --- */
    $('rRisk').innerHTML = ''; $('rRisk').appendChild(risk_karti(r));

    /* --- Hukuki uyarı --- */
    $('rUyari').innerHTML =
        '<b>Bu bir değerleme raporu değildir.</b> Uygulama bilgilendirme ' +
        'amaçlıdır; gayrimenkul değerleme Türkiye\'de SPK lisansına tabi bir ' +
        'faaliyettir. Kesin değer için SPK lisanslı değerleme uzmanına, hukuki ' +
        'sorunlar için avukata başvurun.';

    imar_ciz(g);

    /* Rapor artik BU girdilere ait. Sonraki degisiklikte bayat sayilacak. */
    sonHesapImzasi = girdi_imzasi(g);
    bayatlik_guncelle(g);
    return true;
}

/* Emsal parsel: kullanıcı tek tek emsal özelliği girmesin diye,
   emsali "standart iyi parsel" kabul ediyoruz ve hedefi ona göre
   düzeltiyoruz. Bu varsayım kullanıcıya raporda yazılıyor. */
function emsal_kur(g) {
    return {
        birim_fiyat: g.emsal_birim_fiyat,
        nitelik: 'arsa',
        imar_fonksiyon: 'konut',
        kaks: g.kaks || 1.0,
        yola_cephe: 'imar_yolu',
        altyapi: 'tam',
        konum: 'orta',
        tapu_turu: 'mustakil',
        egim: 'duz',
        geometri: 'duzgun',
        hizmetler: { yol:1, su:1, elektrik:1, ulasim:1, cop:1, kanalizasyon:1, aydinlatma:1 },
        deprem_bolgesi: g.deprem_bolgesi,
        zemin: 'saglam',
        egim_yuzde: 5,
        ada_ici_konum: 'ara',
        sekil: 'dortgen',
        baki: 'guney',
        manzara: false,
        ana_cadde_m: 100, merkez_m: 500, egitim_m: 300,
        yesil_alan_m: 300, saglik_m: 500
    };
}

function deger_karti(an, g, ek_kutu) {
    var k = kart('Değer tahmini');

    if (an.hata) {
        k.appendChild(el('p', 'alt-not', an.hata));
        return k;
    }

    var b = el('div', 'bant');
    b.appendChild(el('div', 'orta', tl(an.birim_fiyat.orta) + '/m²'));
    var ar = el('div', 'aralik');
    ar.innerHTML = '<b>' + tl(an.birim_fiyat.alt) + '</b> ile <b>' +
                   tl(an.birim_fiyat.ust) + '</b> arasında  (±' + yuzde(an.bant_yuzde) + ')';
    b.appendChild(ar);
    k.appendChild(b);

    /* Bandı görselleştir: ne kadar geniş olduğu göze görünsün. */
    var cz = el('div', 'bant-cizgi');
    var dolgu = el('i');
    var genislik = Math.min(100, an.bant_yuzde * 2);
    dolgu.style.left = (50 - genislik / 2) + '%';
    dolgu.style.width = genislik + '%';
    cz.appendChild(dolgu);
    var isaret = el('u'); isaret.style.left = 'calc(50% - 1px)';
    cz.appendChild(isaret);
    k.appendChild(cz);

    /* "Aralığı daraltmak için" kutusu BURAYA girer — bandın hemen altına.
       Ölçüldü: kartın sonuna konduğunda y=3983'te kalıyordu, büyük sayı
       ise y=1624'te. Geniş bandı gören kullanıcının ilk sorusu "ne
       yapmalıyım"; cevabın 2.400 px aşağıda olması cevap sayılmaz. */
    if (ek_kutu) k.appendChild(ek_kutu);

    if (an.toplam_deger) {
        satir_ekle(k, g.alan + ' m² için toplam', tl(an.toplam_deger.orta));
    }

    if (an.yontem_sayisi === 2) {
        satir_ekle(k, 'Yöntem 1 — emsal düzeltme', tl(an.yontemler.carpan) + '/m²');
        var n2 = satir_ekle(k, 'Yöntem 2 — nominal puanlama',
                            tl(an.yontemler.nominal) + '/m²');
        /* GECERLILIK ALANINI SOYLE.
           Olculdu (28.08.2026): rapor bu sayiyi veriyor ama agirliklarin
           NEREDEN geldigini hicbir yerde soylemiyordu. Agirlik seti 87
           yapisiz arsa parselinden turetilmis ve hepsi Canakkale Merkez /
           Esenler Mahallesi. Nevsehir'deki bir kullaniciya, kendi bolgesi
           icin olculmemis bir agirlikla sayi uretiliyor ve bunu bilmiyor.

           Hesap savunulabilir; savunulamayan sey, KOSULUN soylenmemesi.
           Cekirdekte baska bolge profilleri VAR (BOLGE_PROFILI) ama
           arayuzden secilemiyor -- kodda olmasi isin bittigi anlamina
           gelmez, kullaniciya ulasmayan ozellik yoktur.
           Secim arayuze eklenene kadar en azindan kosul yaziliyor. */
        if (n2) {
            /* IPUCU TELEFONDA GORUNMEZ. Uygulama mobil oncelikli; `title`
               yalnizca fare ustune gelince cikar. Kosulu yalniz ipucuna
               yazmak, sadece masaustunde soylemek demektir.
               O yuzden var olan etiket deseni kullaniliyor: gorunur bir
               rozet + ayrintisi ipucunda. */
            var rz = el('span', 'etiket-kucuk olculdu', 'bölgesel');
            /* ROZET METNI OLCULDU, TAHMIN EDILMEDI.
               Ilk yazdigim metin "sizin bolgeniz icin olculmedi" diyordu.
               Dogruydu ama EKSIKTI ve gereginden cok korkutuyordu: cekirdek
               yayimlanmis butun agirlik setlerini kosuyor, aralarindaki
               farki olcuyor ve BANDA TABAN olarak koyuyor
               (`bant = Math.max(bant, yayilim)`).
               75 senaryo olculdu: profil secimi sonucu tipik olarak %4-6,
               en fazla %18,1 oynatiyor -- bant ise en az %20,9. Yani
               bolgesel belirsizlik zaten bandin icinde kaliyor.
               Kullaniciya korkutucu degil, OLCULEN sey soylenir. */
            rz.title = 'Ağırlıklar 87 yapısız arsa parselinden türetildi ' +
                       '(Çanakkale Merkez / Esenler Mah., 15 SPK lisanslı ' +
                       'uzman). Başka bölgeler için yayımlanmış ağırlık ' +
                       'setleri de hesaba katılıyor: aralarındaki fark ' +
                       'ölçülüp yukarıdaki aralığa taban olarak ekleniyor. ' +
                       'Ölçüldü — profil seçimi sonucu tipik olarak %4-6, ' +
                       'en fazla %18 oynatıyor; bu aralığın içinde kalıyor.';
            var ad2 = n2.querySelector('.ad');
            if (ad2) { ad2.appendChild(document.createTextNode(' ')); ad2.appendChild(rz); }
        }
        satir_ekle(k, 'İki yöntem arası fark', yuzde(an.ayrisma_yuzde));
    }

    /* Farkı yaratan kalemler */
    if (an.carpan && an.carpan.duzeltmeler) {
        var etkili = an.carpan.duzeltmeler.filter(function (d) { return d.etki_yuzde !== 0; });
        if (etkili.length) {
            k.appendChild(el('div', 'alt-baslik', 'Farkı yaratan kalemler'));
            etkili.sort(function (a, b) { return Math.abs(b.etki_yuzde) - Math.abs(a.etki_yuzde); });
            etkili.forEach(function (d) {
                var s = satir_ekle(k, d.ad,
                    yuzde(d.etki_yuzde, true),
                    d.etki_yuzde > 0 ? 'artis' : 'azalis');
                /* HER seviye etiketlenir, yalniz "tahmin" degil.
                   Olculdu (27.08.2026): sadece BASLANGIC etiketleniyordu;
                   "olculdu" ile "kalibre" ETIKETSIZ kaliyor ve kullanici
                   ikisini ayirt edemiyordu. Etiketsiz bir satir, okuyan
                   icin "kesin" demektir -- oysa biri hakemli calismada
                   olculmus SAYI, oteki bizim buyuklugumuz. Ikisini ayni
                   gostermek, guveni oldugundan yuksek sunmaktir. */
                var kisa = { mevzuat: 'mevzuat', olculdu: 'ölçüldü',
                             kalibre: 'kalibre', baslangic: 'tahmin' }[d.guven];
                if (kisa) {
                    var e = el('span', 'etiket-kucuk ' + d.guven, kisa);
                    e.title = d.guven_etiket + (d.kaynak ? ' — ' + d.kaynak : '');
                    s.querySelector('.ad').appendChild(e);
                }
            });
        }
    }

    if (an.carpan && an.carpan.eksik_bilgi && an.carpan.eksik_bilgi.length) {
        k.appendChild(el('p', 'alt-not',
            'Şu bilgiler eksik olduğu için aralık genişledi: ' +
            an.carpan.eksik_bilgi.map(function (e) { return e.ad; }).join(', ') + '.'));
    }

    k.appendChild(el('p', 'alt-not',
        'Emsal parsel "standart iyi parsel" kabul edildi (imar yoluna cepheli, ' +
        'altyapısı tam, müstakil tapulu, düz). Girdiğiniz fiyat böyle bir ' +
        'parselin fiyatıysa sonuç daha isabetli olur.'));

    k.appendChild(el('p', 'alt-not', an.guven_notu));
    return k;
}

function risk_karti(r) {
    var k = kart('Risk taraması');

    var ozet = el('div', 'risk-ozet');
    [['kritik', r.kritik_sayisi, 'kritik'],
     ['uyari',  r.uyari_sayisi,  'uyarı'],
     ['',       r.bilgi_sayisi,  'bilgi']].forEach(function (x) {
        var d = el('div', 'risk-say' + (x[0] ? ' ' + x[0] : ''));
        d.appendChild(el('b', null, String(x[1])));
        d.appendChild(el('span', null, x[2]));
        ozet.appendChild(d);
    });
    k.appendChild(ozet);

    if (!r.bulgular.length) {
        k.appendChild(el('p', 'alt-not',
            'Girdiğiniz bilgilerde bilinen bir tuzak görünmüyor. Yine de tapu ' +
            'kaydının tam örneğini ve belediyeden imar durum belgesini almadan ' +
            'para vermeyin.'));
        return k;
    }

    r.bulgular.forEach(function (b) {
        var d = el('div', 'bulgu ' + b.seviye);
        d.appendChild(el('p', 'bulgu-baslik', b.baslik));
        d.appendChild(el('p', null, b.aciklama));
        var y = el('div', 'yapilacak');
        y.appendChild(el('b', null, 'Ne yapmalı:'));
        y.appendChild(document.createTextNode(b.ne_yapmali));
        d.appendChild(y);
        k.appendChild(d);
    });
    return k;
}

/* ---------------------------------------------------------------------
   4. İMAR SEKMESİ
   ------------------------------------------------------------------- */
function imar_ciz(g) {
    var im = C.imar_hesapla(g);
    if (im.hata) {
        $('imarBos').hidden = false;
        $('imarIcerik').hidden = true;
        $('imarBos').innerHTML = '<p>' + im.hata + '</p>' +
            '<p class="alt-not">Parsel sekmesindeki 5. bölümden TAKS ve KAKS girin. ' +
            'Bu bilgiler belediyeden alınan imar durum belgesinde yazar.</p>';
        return;
    }
    $('imarBos').hidden = true;
    $('imarIcerik').hidden = false;

    /* Ne yapabilirim */
    var k1 = kart('Bu arsaya ne yapabilirsiniz');
    satir_ekle(k1, 'Zeminde kaplanabilecek alan',
               im.taban_alani ? im.taban_alani + ' m²' : '—');
    satir_ekle(k1, 'Toplam inşaat alanı', im.toplam_insaat_alani + ' m²');
    satir_ekle(k1, 'Tahmini kat adedi', im.tahmini_kat_adedi || '—');
    satir_ekle(k1, 'Tahmini daire sayısı',
               im.tahmini_daire_sayisi + ' adet (' + im.brut_daire_alani + ' m² brüt)');
    im.uyari.forEach(function (u) { k1.appendChild(el('p', 'alt-not', u)); });
    k1.appendChild(el('p', 'alt-not', im.not));
    $('iYapilabilir').innerHTML = ''; $('iYapilabilir').appendChild(k1);

    /* Çekme mesafeleri */
    var kat = Math.round(im.tahmini_kat_adedi || 0);
    var k2 = kart('Çekme (bahçe) mesafeleri');
    if (kat > 0) {
        var c = M.cekme_mesafeleri({ kat_adedi: kat });
        satir_ekle(k2, 'Ön bahçe',  c.on + ' m');
        satir_ekle(k2, 'Yan bahçe', c.yan + ' m');
        satir_ekle(k2, 'Arka bahçe', c.arka + ' m');
        k2.appendChild(el('p', 'alt-not', c.gerekce));
    } else {
        k2.appendChild(el('p', 'alt-not', 'Kat adedi hesaplanamadı; TAKS girin.'));
    }
    $('iCekme').innerHTML = ''; $('iCekme').appendChild(k2);

    /* İnşaat maliyeti */
    var k3 = kart('İnşaat maliyeti (2026 resmî birim fiyatları)');
    var sinif = M.konut_sinifi({ kat_adedi: kat });
    if (sinif.hata) {
        k3.appendChild(el('p', 'alt-not', sinif.hata));
    } else {
        var mal = M.insaat_maliyeti(im.toplam_insaat_alani, sinif.sinif, { kdv_orani: 0.20 });
        satir_ekle(k3, 'Yapı sınıfı', sinif.sinif + ' — ' + sinif.gerekce);
        satir_ekle(k3, 'Birim maliyet', tl(mal.birim_maliyet) + '/m²');
        satir_ekle(k3, 'KDV hariç', tl(mal.kdv_haric));
        satir_ekle(k3, 'KDV %20 dahil', tl(mal.kdv_dahil));
        if (sinif.uyari) k3.appendChild(el('p', 'alt-not', sinif.uyari));
        k3.appendChild(el('p', 'alt-not', mal.dahil));
        k3.appendChild(el('p', 'alt-not', mal.dahil_degil));
        k3.appendChild(el('p', 'kaynak-liste', 'Kaynak: ' + mal.kaynak));
    }

    /* Tapu harcı ve emlak vergisi */
    if (g.emsal_birim_fiyat && g.alan) {
        var bedel = g.emsal_birim_fiyat * g.alan;
        var h = M.tapu_harci({ beyan_bedeli: bedel });
        satir_ekle(k3, 'Tapu harcı (alıcı payı)', tl(h.alici_harci));
        var ev = M.emlak_vergisi({ vergi_degeri: bedel, tur: 'arsa', buyuksehir: false });
        satir_ekle(k3, 'Yıllık emlak vergisi', tl(ev.toplam));
        k3.appendChild(el('p', 'alt-not',
            'Emlak vergisi büyükşehir belediyesi sınırındaysa iki katına çıkar.'));
    }
    $('iMaliyet').innerHTML = ''; $('iMaliyet').appendChild(k3);
}

/* ---------------------------------------------------------------------
   5. DEFTER — uygulamayı "her gün açılan" yapan parça
   Kayıtlar sadece bu cihazda durur; hiçbir yere gönderilmez.
   ------------------------------------------------------------------- */
function defter_oku() {
    try { return JSON.parse(localStorage.getItem(DEPO_ANAHTAR) || '[]'); }
    catch (e) { return []; }
}
function defter_yaz(liste) {
    try { localStorage.setItem(DEPO_ANAHTAR, JSON.stringify(liste)); }
    catch (e) { uyar('Kayıt yapılamadı; tarayıcı depolamaya izin vermiyor.'); }
}

function defter_ekle() {
    var g = girdi_topla();
    if (!g.alan) { uyar('Önce arsa alanını girin.'); return; }

    var ad = prompt('Bu parsele bir isim verin (örn. "Köyün üstü 5 dönüm"):', '');
    if (ad === null) return;

    var kayit = { ad: ad || ('Parsel ' + (defter_oku().length + 1)), girdi: g,
                  tarih: new Date().toISOString() };

    if (g.emsal_birim_fiyat) {
        var an = C.deger_analizi(emsal_kur(g), g);
        if (!an.hata) {
            kayit.ozet = { birim: an.birim_fiyat.orta,
                           toplam: an.toplam_deger ? an.toplam_deger.orta : null,
                           bant: an.bant_yuzde };
        }
    }
    var r = C.risk_tara(g);
    kayit.risk = { kritik: r.kritik_sayisi, uyari: r.uyari_sayisi,
                   vasif: r.vasif.sonuc };

    var liste = defter_oku();
    liste.unshift(kayit);
    defter_yaz(liste);
    defter_ciz();
    sekme_ac('sDefter');
}

function defter_ciz() {
    var kap = $('defterListe');
    kap.innerHTML = '';
    var liste = defter_oku();

    if (!liste.length) {
        var b = el('div', 'bos-durum');
        b.appendChild(el('p', null, 'Defter boş.'));
        b.appendChild(el('p', 'alt-not',
            'Baktığınız her arsayı kaydedin; hangisinin daha iyi olduğunu ' +
            'yan yana görürsünüz.'));
        kap.appendChild(b);
        return;
    }

    liste.forEach(function (k, i) {
        var d = el('div', 'defter-kart');
        var ust = el('div', 'defter-ust');
        var sol = el('div');
        sol.appendChild(el('p', 'defter-ad', k.ad));
        sol.appendChild(el('span', 'defter-tarih',
            new Date(k.tarih).toLocaleDateString('tr-TR')));
        ust.appendChild(sol);

        var sil = el('button', 'defter-sil', '×');
        sil.title = 'Sil';
        sil.onclick = function () {
            if (!confirm('"' + k.ad + '" defterden silinsin mi?')) return;
            var l = defter_oku(); l.splice(i, 1); defter_yaz(l); defter_ciz();
        };
        ust.appendChild(sil);
        d.appendChild(ust);

        satir_ekle_basit(d, 'Alan', (k.girdi.alan || '—') + ' m²');
        satir_ekle_basit(d, 'Hukuki durum', k.risk ? k.risk.vasif : '—');
        if (k.ozet) {
            satir_ekle_basit(d, 'Tahmini birim', tl(k.ozet.birim) + '/m²  (±' + yuzde(k.ozet.bant) + ')');
            if (k.ozet.toplam) satir_ekle_basit(d, 'Tahmini toplam', tl(k.ozet.toplam));
        }
        if (k.risk) {
            satir_ekle_basit(d, 'Risk',
                k.risk.kritik + ' kritik / ' + k.risk.uyari + ' uyarı');
        }
        kap.appendChild(d);
    });
}

function satir_ekle_basit(kap, ad, deger) {
    var s = el('div', 'defter-satir');
    s.appendChild(el('span', 'ad', ad));
    s.appendChild(el('span', 'deger', deger));
    kap.appendChild(s);
}

/* ---------------------------------------------------------------------
   6. GEZİNTİ, TEMA, YARDIM
   ------------------------------------------------------------------- */
function sekme_ac(hedef) {
    document.querySelectorAll('.sayfa').forEach(function (s) {
        s.classList.toggle('aktif', s.id === hedef);
    });
    document.querySelectorAll('.sekme').forEach(function (b) {
        b.classList.toggle('aktif', b.dataset.hedef === hedef);
    });
    window.scrollTo(0, 0);
}

function uyar(metin) {
    yardim_ac('Bilgi', '<p>' + metin + '</p>');
}

function yardim_ac(baslik, metin) {
    $('yardimBaslik').textContent = baslik;
    $('yardimMetin').innerHTML = metin;
    $('yardimKatman').hidden = false;
}

function tema_uygula(t) {
    document.documentElement.setAttribute('data-tema', t);
    try { localStorage.setItem(TEMA_ANAHTAR, t); } catch (e) {}
}

function baglantilari_kur() {
    document.querySelectorAll('.sekme').forEach(function (b) {
        b.onclick = function () { sekme_ac(b.dataset.hedef); };
    });

    document.querySelectorAll('.bolum-baslik').forEach(function (b) {
        b.onclick = function () { b.parentElement.classList.toggle('acik'); };
    });

    /* Her değişiklikte kapsam, vasıf ve GİRDİ GEÇERLİLİĞİ güncellensin. */
    document.querySelectorAll('input, select').forEach(function (i) {
        i.addEventListener('input', kapsam_guncelle);
        i.addEventListener('change', kapsam_guncelle);
        i.addEventListener('input', girdileri_denetle);
        i.addEventListener('input', taslak_kaydet);
        i.addEventListener('change', taslak_kaydet);
        i.addEventListener('blur', girdileri_denetle);
    });

    /* ---- BOZUK GIRDIYI GOSTER ----------------------------------------
       Cekirdek okuyamadigi degeri null dondurur ve o bilgi EKSIK sayilir;
       sayi uydurulmaz, aralik genisler. Dogru davranis. Ama kullanici
       "abc" yazdiginda ekranda hicbir sey degismiyordu: yazdigini girdi
       saniyor, araligin neden genis oldugunu anlamiyordu.

       Hata sayida degil, KULLANICININ ZANNINDA. Sessiz yanlis sayinin
       kardesi: sessiz yanlis GUVEN.

       Sebep alanin ALTINA yazilir ve `aria-describedby` ile alana
       baglanir -- ekran okuyucu kullanan biri de sebebi duyar. Uyari
       kutusu `data-icin` ile isaretlenir; kardes secici kullanmak
       (`:scope >`) 09'da yanlislikla komsu uyarilari siliyordu. */
    function girdileri_denetle() {
        document.querySelectorAll('input[inputmode]').forEach(function (a) {
            var ham = (a.value || '').trim();
            var eski = document.querySelector('.girdi-uyari[data-icin="' + a.id + '"]');
            var sebep = null;

            if (ham !== '') {
                var d = C.sayi_oku(ham, a.dataset.tur || null);
                if (d === null || !isFinite(d)) {
                    sebep = 'Bu sayı okunamadı. Ondalık için virgül kullanın ' +
                            '(örn. 1.500,50). Harf ve boşluk olmamalı. ' +
                            'Şu an bu bilgi GİRİLMEMİŞ sayılıyor.';
                } else if (d < 0) {
                    sebep = 'Eksi değer olamaz.';
                }
            }

            a.classList.toggle('gecersiz', !!sebep);
            if (sebep) {
                a.setAttribute('aria-invalid', 'true');
            } else {
                a.removeAttribute('aria-invalid');
            }

            if (!sebep) {
                if (eski) { eski.remove(); a.removeAttribute('aria-describedby'); }
                return;
            }
            if (!eski) {
                eski = document.createElement('span');
                eski.className = 'girdi-uyari';
                eski.dataset.icin = a.id;
                eski.id = 'uyari-' + a.id;
                a.insertAdjacentElement('afterend', eski);
            }
            eski.textContent = sebep;
            a.setAttribute('aria-describedby', eski.id);
        });
    }
    girdileri_denetle();

    $('hesaplaBtn').onclick = function () {
        if (rapor_ciz()) sekme_ac('sRapor');
    };

    $('kaydetBtn').onclick = defter_ekle;

    var kob = $('kapsamOrnekBtn');
    if (kob) kob.onclick = function () { $('ornekBtn').click(); };

    rapor_eylemleri_bagla();

    $('ornekBtn').onclick = function () {
        ornek_doldur();
        sekme_ac('sRapor');
    };

    $('temaBtn').onclick = function () {
        var su = document.documentElement.getAttribute('data-tema');
        tema_uygula(su === 'koyu' ? 'acik' : 'koyu');
    };

    $('sifirlaBtn').onclick = function () {
        if (!confirm('Formdaki bütün bilgiler silinsin mi? (Defter kayıtları kalır)')) return;
        document.querySelectorAll('input').forEach(function (i) {
            if (i.type === 'checkbox') i.checked = false; else i.value = '';
        });
        document.querySelectorAll('select').forEach(function (s) { s.value = ''; });
        $('raporBos').hidden = false; $('raporIcerik').hidden = true;
        $('imarBos').hidden = false;  $('imarIcerik').hidden = true;
        sonHesapImzasi = null;
        kapsam_guncelle();
    };

    document.querySelectorAll('[data-yardim]').forEach(function (b) {
        b.onclick = function (e) {
            e.preventDefault();
            var y = YARDIM[b.dataset.yardim];
            if (y) yardim_ac(y.baslik, y.metin);
        };
    });

    $('yardimKapat').onclick = function () { $('yardimKatman').hidden = true; };
    $('yardimKatman').onclick = function (e) {
        if (e.target === $('yardimKatman')) $('yardimKatman').hidden = true;
    };
}

/* ---------------------------------------------------------------------
   7. ÖRNEK PARSEL
   Boş formla karşılaşan kullanıcı ne gireceğini bilmiyor. "Örnek göster"
   gerçek bir senaryoyu doldurup sonucu gösterir; kullanıcı ne beklediğini
   görüp kendi parseline geçer.
   Aynı zamanda mağaza ekran görüntüleri bu yolla üretiliyor (?ornek=1).
   ------------------------------------------------------------------- */
var ORNEK = {
    gAlan: '620', gEmsalFiyat: '2800',
    gBelediye: true, gImarPlani: false,
    hizmetler: ['yol', 'elektrik'],
    gTapuTuru: 'hisseli', gYolaCephe: 'kadastro', gAltyapi: 'kismi',
    gKonum: 'kenar', gGeometri: 'duzensiz', gEgim: '25', gAdaIci: 'ara',
    gBaki: 'kuzeybati', gZemin: 'orta', gDeprem: '2', gManzara: 'yok',
    gAnaCadde: '450', gMerkez: '1800', gEgitim: '700',
    gYesilAlan: '600', gSaglik: '850',
    gTaks: '0.30', gKaks: '1.20', gFonksiyon: 'konut'
};

function ornek_doldur() {
    Object.keys(ORNEK).forEach(function (k) {
        if (k === 'hizmetler') return;
        var e = $(k);
        if (!e) return;
        if (e.type === 'checkbox') e.checked = !!ORNEK[k];
        else e.value = ORNEK[k];
    });
    document.querySelectorAll('[data-hizmet]').forEach(function (i) {
        i.checked = ORNEK.hizmetler.indexOf(i.dataset.hizmet) !== -1;
    });
    kapsam_guncelle();
    rapor_ciz();
}

/* ---------------------------------------------------------------------
   8. BAŞLAT
   ------------------------------------------------------------------- */
var SEKME_ADRESI = {
    parsel: 'sParsel', rapor: 'sRapor', imar: 'sImar', defter: 'sDefter'
};

/* NE DEĞİŞTİ ŞERİDİ (K-44).
   Bu uygulama insanların para kararını etkiliyor; sessizce yayınlamak,
   kullanıcının yanlış bir rakamla karar vermiş olabileceğini ondan
   saklamak demek. `gizlilik.html` zaten söz veriyor.

   SÜRÜM YÜKLÜ DAMGADAN OKUNUYOR. Ayrı bir sürüm sabiti tutmak ikinci
   bir elle yazılan sayı olurdu; 27-28 Ağustos'ta tam bu yüzden üç ayrı
   projede bildirim sessizce hiç çıkmadı (K-46). */
function yenilik_goster() {
    if (typeof DEGISIKLIKLER === 'undefined' || !DEGISIKLIKLER.length) return;

    var b = document.querySelector('script[src*="arayuz.js"]');
    var m = b && (b.getAttribute('src') || '').match(/[?&]v=(\d+)/);
    var damga = m ? parseInt(m[1], 10) : 0;
    if (!damga) return;

    var onceki = gorulen_oku();

    /* İŞARETİ YOK AMA YENİ DEĞİL.

       Ölçüldü: defteri ve teması olan bir kullanıcı — yani uygulamayı
       zaten kullanan biri — işaret anahtarı bulunmadığı için "ilk
       ziyaret" sayılıyordu ve "neler değişti" şeridini HİÇ görmüyordu.
       Yani bildirim, en çok gerektiği anda (geçişte) tam hedef
       kitlesini ıskalıyordu.

       Aynı hata 05 Göz Molası'nda bulunup düzeltilmişti; buraya
       kendiliğinden geçmemişti (K-28). Bir sınıfın bir projede
       kapatılması, diğerlerinde kapandığı anlamına gelmiyor.

       Kaydı olan ama işareti olmayan kişi ESKİ kullanıcıdır. */
    if (!onceki) {
        var izVar = false;
        try {
            izVar = !!(localStorage.getItem(DEPO_ANAHTAR)
                    || localStorage.getItem(TEMA_ANAHTAR)
                    || localStorage.getItem(TASLAK_ANAHTAR));
        } catch (e) { izVar = false; }
        if (izVar) onceki = 1;          // eski kullanıcı: her kaydı görsün
    }

    /* Gerçekten ilk ziyaret: hiçbirini görmemiş, "şunları düzelttik"
       demek anlamsız. Sadece işaretle, sus. */
    if (!onceki) { gorulen_yaz(damga); return; }

    /* Damgaya EŞİT kayıt aramıyoruz. Damga her yayında artıyor (bir
       yazım düzeltmesi bile), kayıt yalnızca anlatılacak bir şey
       olunca yazılıyor. Eşitlik arayan kod, ikisi ayrışır ayrışmaz
       sessizce hiç çıkmaz. */
    var yeniler = [];
    for (var i = 0; i < DEGISIKLIKLER.length; i++) {
        if (DEGISIKLIKLER[i].surum > onceki) yeniler.push(DEGISIKLIKLER[i]);
    }
    if (!yeniler.length) { gorulen_yaz(damga); return; }

    var kayit = yeniler[0];
    var not = document.getElementById('yenilikNotu');
    var metin = document.getElementById('yenilikMetin');
    if (!not || !metin) return;

    var govde = kayit.ozet;
    if (kayit.hesapDuzeltmesi) {
        govde += ' Daha önce sonuç aldıysanız, sonucunuzu bir kez daha alın.';
    }
    metin.textContent = govde;

    /* İKİ BİLDİRİM ÜST ÜSTE BİNMESİN.
       `taslakNotu` — "yarım kalan parseliniz geri yüklendi" — daha
       acil: kullanıcının emeği söz konusu ve yanlış parseli hesaplama
       riski var. O çıkıyorsa yenilik bir sonraki açılışa kalır.

       Bir tik erteliyoruz çünkü `taslak_yukle()` bu işlevden SONRA
       koşuyor; şimdi baksak kutu daha DOM'da olmaz ve kural hiç
       işlemezdi. Anahtar adına değil kutuya bakıyoruz: soru
       "taslak GÖRÜNÜYOR mu", "kayıtlı taslak var mı" değil. */
    setTimeout(function () {
        var taslak = document.getElementById('taslakNotu');
        if (taslak && !taslak.hidden) return;   // işaretlemeden çık

        not.hidden = false;
        /* İşaret ANCAK gösterdikten sonra yazılıyor. Göstermeden önce
           yazsaydık, ertelenen açılışta kullanıcı değişiklikleri HİÇ
           görmeyecekti — bugün üç kez çıkan "sessizce hiç görünmeyen
           bildirim" sınıfının aynısı. */
        gorulen_yaz(damga);
    }, 0);

    var kapat = document.getElementById('yenilikKapat');
    if (kapat) {
        kapat.addEventListener('click', function () { not.hidden = true; });
    }
}

function gorulen_oku() {
    try { return parseInt(localStorage.getItem(GORULEN_ANAHTAR), 10) || 0; }
    catch (e) { return 0; }
}

function gorulen_yaz(s) {
    try { localStorage.setItem(GORULEN_ANAHTAR, String(s)); } catch (e) {}
}

/* ---- YARIM KALAN FORMU KORU -------------------------------------
   Olculdu (28 Agustos 2026, gercek kullanim turu, 375x812):
   9 alan + 4 kutucuk dolduruldu, sayfa YENILENDI, hepsi gitti.
   Uyari da yoktu. Telefonda form 5 bolum / ~20 alan; uygulama
   degisimi ya da bellek baskisiyla gelen bir yenileme butun emegi
   siliyordu. Defter kaydi duruyordu -- yani uygulama saklayabiliyor,
   calisma formunu saklamiyordu.

   ALAN LISTESI ELLE TUTULMUYOR: butun input/select ogeleri geziliyor.
   Elle liste tutmak, ikinci bir liste demektir ve iki liste er gec
   ayrisir (bugun uc ayri yerde bunu gorduk).

   GERI YUKLERKEN TARIH DE YAZILIYOR. Sessizce geri gelen uc gunluk
   bir form, kullaniciya BUGUNKU parseli hesapladigini dusundurur --
   bu, silmekten daha kotudur. */
function taslak_alanlari() {
    return Array.prototype.slice.call(
        document.querySelectorAll('#sParsel input[id], #sParsel select[id]'));
}

function taslak_kaydet() {
    try {
        var v = {};
        taslak_alanlari().forEach(function (e) {
            if (e.type === 'checkbox') { if (e.checked) v[e.id] = true; }
            else if (e.value !== '') v[e.id] = e.value;
        });
        if (!Object.keys(v).length) { localStorage.removeItem(TASLAK_ANAHTAR); return; }
        localStorage.setItem(TASLAK_ANAHTAR, JSON.stringify({ t: Date.now(), v: v }));
        taslakHatasi = 0;
    } catch (e) {
        /* SESSİZ KALMASIN.

           Bu işlevin tek amacı "yarım kalan formun kaybolmasın".
           Sessizce başarısız olursa tam da önlemek için yazıldığı
           kaybı gizlemiş olur: kullanıcı işinin güvende olduğunu
           sanır, sayfa yenilenince her şey gider.

           Defter kaydı zaten söylüyor ("Kayıt yapılamadı..."); burada
           söylememek tutarsızdı.

           HER TUŞTA UYARMIYORUZ: bu işlev `input` olayına bağlı,
           yani saniyede birkaç kez çağrılabiliyor. Üst üste üç
           başarısızlıkta bir kez uyarıyoruz. */
        taslakHatasi++;
        if (taslakHatasi === 3 && !taslakUyarisiVerildi) {
            taslakUyarisiVerildi = true;
            uyar('Girdikleriniz <b>kaydedilemiyor</b> — cihazın depolama alanı '
               + 'dolu olabilir ya da tarayıcı site verilerini engelliyor. '
               + 'Hesaplama çalışmaya devam eder, ama sayfayı yenilerseniz '
               + 'form boşalır. Deftere kaydetmeyi de deneyemezsiniz.');
        }
    }
}

var taslakHatasi = 0;
var taslakUyarisiVerildi = false;

function taslak_sil() {
    try { localStorage.removeItem(TASLAK_ANAHTAR); } catch (e) {}
    taslak_alanlari().forEach(function (e) {
        if (e.type === 'checkbox') e.checked = false; else e.value = '';
    });
    var n = document.getElementById('taslakNotu');
    if (n) n.remove();
    kapsam_guncelle();
}

function taslak_yukle() {
    var kayit;
    try { kayit = JSON.parse(localStorage.getItem(TASLAK_ANAHTAR) || 'null'); }
    catch (e) { return; }
    if (!kayit || !kayit.v) return;
    var n = 0;
    Object.keys(kayit.v).forEach(function (id) {
        var e = document.getElementById(id);
        if (!e) return;
        if (e.type === 'checkbox') e.checked = !!kayit.v[id];
        else e.value = kayit.v[id];
        n++;
    });
    if (!n) return;
    kapsam_guncelle();

    var tarih = new Date(kayit.t);
    var gun = tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    var saat = tarih.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    /* TAKVİM GÜNÜ, GEÇEN 24 SAAT DEĞİL.

       Eski hâli `(şimdi - t) / 86400000` ile geçen 24 saati sayıyordu.
       Ölçüldü, iki durumda YANLIŞ cevap veriyordu:
         Pzt 23:50 yazıldı, Salı 00:10 açıldı   -> "bugün"  (oysa DÜN)
         Pzt 23:50 yazıldı, Çarşamba 00:10      -> "dün"    (oysa 2 gün önce)

       Bu mesajın amacı "elindeki taslak ESKİ olabilir" diye uyarmak.
       Yanlış yönü de tam ters: taslağı olduğundan TAZE gösteriyordu. */
    var gunBasi = function (zaman) {
        var d = new Date(zaman);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };
    var gecen = Math.round((gunBasi(Date.now()) - gunBasi(kayit.t)) / 86400000);
    var ne = gecen === 0 ? ('bugün ' + saat) : (gecen === 1 ? ('dün ' + saat) : (gun));

    var kutu = document.createElement('div');
    kutu.id = 'taslakNotu';
    kutu.className = 'kutu uyari-kutu';
    kutu.innerHTML = '<p><b>Yarım kalan parseliniz geri yüklendi</b> — ' +
        n + ' alan, <b>' + ne + '</b> girilmiş. Bu <b>eski</b> bir parsel ' +
        'olabilir; yeni bir arsaya bakıyorsanız önce temizleyin.</p>' +
        '<p><button type="button" class="ikincil" id="taslakSilBtn">' +
        'Temizle ve sıfırdan başla</button></p>';
    var hedef = document.getElementById('sParsel');
    if (hedef) hedef.insertBefore(kutu, hedef.firstChild);
    var d = document.getElementById('taslakSilBtn');
    if (d) d.onclick = taslak_sil;
}

function baslat() {
    try {
        var t = localStorage.getItem(TEMA_ANAHTAR);
        if (t) document.documentElement.setAttribute('data-tema', t);
    } catch (e) {}

    ekrani_kur();
    baglantilari_kur();
    yenilik_goster();
    taslak_yukle();          /* f2'nin sirasi korunuyor: yenilikten SONRA */
    kapsam_guncelle();
    defter_ciz();

    /* Adres çubuğundaki parametreler.
       ?sekme=defter  -> manifest'teki kısayollar bunu kullanıyor
       ?ornek=1       -> örnek parseli doldurup raporu açar */
    var par = new URLSearchParams(location.search);

    if (par.get('ornek')) {
        ornek_doldur();
        sekme_ac('sRapor');
    }

    var s = par.get('sekme');
    if (s && SEKME_ADRESI[s]) sekme_ac(SEKME_ADRESI[s]);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
} else {
    baslat();
}

/* SINAMA YUZEYI — yalnizca OKUMA.
   `rapor_metni` kullanicinin panoya alip WhatsApp'a yapistiracagi metni
   uretiyor; yani uygulamadan DISARI cikan bir cikti. Disari cikan bir
   ciktinin sinanamaz olmasi kabul edilemez: bozuk HTML etiketi,
   "undefined" ya da yapisik kelime kacarsa kimse gormeden gider.
   Arayuzun geri kalani kapali kalir; burada hicbir sey DEGISTIRILEMEZ. */
if (typeof window !== 'undefined') {
    window.ArayuzSinama = { rapor_metni: rapor_metni };
}

})();
