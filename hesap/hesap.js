// ================= HESAP ÇEKİRDEĞİ =================
// Burada sadece MATEMATİK var. Ekranla ilgili hiçbir şey yok — o iş sayfa.js'de.
// Her araç sayfası bu dosyayı yükler, kendi hesabını buradan çağırır.
//
// KURAL: Resmî orana/tutara bağlı her sayı en üstteki PARAMETRE bloğunda durur.
// Böylece yıl değişince tek yerden güncellenir, koda dokunmaya gerek kalmaz.

// ---------- RESMÎ PARAMETRELER ----------
// ⚠️ Bunlar her yıl (bazıları 6 ayda bir) değişir. Kaynak ve tarih yanlarında yazılı.
const PARAMETRE = {
    yil: 2026,
    guncelleme: "2026-08-26",

    // Asgari ücret (1 Ocak 2026'dan itibaren)
    asgariBrut: 33030.00,
    asgariNet: 28075.50,
    asgariGunlukBrut: 1101.00,

    // SGK matrah sınırları
    sgkTaban: 33030.00,
    sgkTavan: 297270.00,

    // Kesinti oranları (işçi payı)
    sgkIsciOran: 0.14,        // %14
    issizlikIsciOran: 0.01,   // %1
    damgaOran: 0.00759,       // binde 7,59

    // Gelir vergisi tarifesi — ÜCRET gelirleri (2026)
    // Kaynak: GİB "Gelir Vergisi Tarifesi 2026" resmî belgesi (193 sayılı Kanun md.103)
    // DİKKAT: Ücret gelirlerinin 3. ve 4. dilim sınırları diğer gelirlerden FARKLIDIR
    // (ücrette 1.500.000 ve 5.300.000; diğer gelirlerde 1.000.000 ve 5.300.000).
    // [dilimin üst sınırı, oran] — son dilimin üst sınırı yoktur
    vergiDilimleri: [
        [190000, 0.15],
        [400000, 0.20],
        [1500000, 0.27],
        [5300000, 0.35],
        [Infinity, 0.40]
    ],

    // Kredi vergileri (ihtiyaç kredisi)
    kkdf: 0.15,               // %15
    bsmv: 0.05,               // %5

    // MEVDUAT STOPAJI VADEYE GORE DEGISIR — tek oran degildir.
    // Eskiden burada duz 0,15 vardi ve yorumda "vadeye gore degisir"
    // yaziyordu; yani kural BILINIYOR ama UYGULANMIYORDU. En yaygin
    // durum olan 6 aya kadar vadede gercek oran %17,5 -- yani net
    // getiri OLDUGUNDAN YUKSEK gosteriliyordu.
    // Kaynak: 09.07.2025 tarihli Cumhurbaskani Karari ile belirlenen
    // oranlar; 20.06.2026 tarih ve 33286 sayili R.G.'de yayimlanan
    // 11444 sayili Cumhurbaskani Karari ile 31.12.2026'ya uzatildi.
    // SINIF 1 (resmi olcut).
    // SINIRI: karar tarihinden ONCE acilmis ve vadesi devam eden
    // hesaplarda acilis tarihindeki oran gecerlidir; bu hesap YENI
    // acilan/yenilenen hesabi varsayar.
    mevduatStopajKademe: [
        { enCokGun: 183, oran: 0.175 },   // 6 aya kadar (183 gun dahil)
        { enCokGun: 366, oran: 0.15 },    // 1 yila kadar (366 gun dahil)
        { enCokGun: Infinity, oran: 0.10 } // 1 yildan uzun
    ],
    mevduatStopaj: 0.15,          // eski cagri bicimi icin; kademe tercih edilir

    // KDV oranları
    kdvOranlari: [1, 10, 20],

    // Kıdem tazminatı tavanı — 6 ayda bir değişir, çıkış tarihine göre uygulanır
    // Kaynak: resmî tebliğler (Verginet/PwC duyuruları ile teyit edildi)
    kidemTavanlari: [
        { baslangic: "2026-01-01", bitis: "2026-06-30", tutar: 64948.77 },
        { baslangic: "2026-07-01", bitis: "2026-12-31", tutar: 73729.87 }
    ]
};

// ---------- BİÇİMLEME ----------

function sayi(deger, basamak) {
    if (deger === null || deger === undefined || !isFinite(deger)) return "—";
    const b = basamak === undefined ? 2 : basamak;
    return deger.toLocaleString("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
}

function para(deger, basamak) { return sayi(deger, basamak) + " ₺"; }

function yuzdeOn(deger, basamak) {
    if (deger === null || deger === undefined || !isFinite(deger)) return "—";
    return (deger < 0 ? "-" : "") + "%" + sayi(Math.abs(deger), basamak === undefined ? 2 : basamak);
}

// Kullanıcının yazdığı metni sayıya çevirir.
//
// BURASI ÜÇ KEZ HATA ÜRETTİ. Üçünü de yazıyorum ki dördüncüsü olmasın:
//   1) Nokta koşulsuz binlik sayıldı: "3.29" faiz 329 okundu, taksit 60 kat şişti.
//   2) Sonra koşulsuz ondalık sayıldı: "1.500" tutar 1,5 oldu, 1000 kat küçüldü.
//   3) Harf ve üstel yazım sessizce kırpıldı: "12abc" -> 12, "1e3" -> 13.
//      Bu en kötüsü: kullanıcı saçma bir şey yazdı, ekranda makul bir sayı çıktı.
//
// Sınavı ortak: HESAP MAKİNESİ\SAYI-SINAMA.md (24 zorunlu satır).
// Kararlarımız o dosyaya göre:
//   "1.500"       -> 1500      (tek ayraç, arkasında tam 3 hane -> binlik)
//   "3.29"        -> 3.29      (arkasında 3 hane yok -> ondalık)
//   "1.500,50"    -> 1500.50   (iki ayraç -> SONDAKİ ondalıktır)
//   "1,500.50"    -> 1500.50   (aynı kural, İngilizce yazım)
//   "1,2,3"       -> GEÇERSİZ  (binlik grupları 3 hane değil)
//   "1.500.5"     -> GEÇERSİZ  (aynı sebep; belirsiz yazımı tahmin etmiyoruz)
//   "1e3" "nan"   -> GEÇERSİZ
//   "1500 TL"     -> 1500      (para birimi ve % işareti kırpılır -- bizim kararımız)
//
// tur === "oran" ise (faiz, yüzde, TÜFE) binlik yorumu HİÇ yapılmaz:
// oran alanında "1.500" diye bir şey yazılmaz, ayraç her zaman ondalıktır.

// Çekirdek: { bos, gecerli, deger }. Geçersiz ile boş AYRI şeylerdir --
// boş "henüz yazmadı", geçersiz "yazdı ama sayı değil".
function sayiCozumle(metin, tur) {
    const bosCevap = { bos: true, gecerli: false, deger: 0 };
    if (typeof metin === "number")
        return isFinite(metin) ? { bos: false, gecerli: true, deger: metin } : { bos: false, gecerli: false, deger: 0 };
    if (metin === null || metin === undefined) return bosCevap;

    let s = String(metin).replace(/\s/g, "").replace(/TL/gi, "").replace(/[₺%]/g, "");
    if (s === "") return bosCevap;

    const eksi = s.charAt(0) === "-";
    if (eksi || s.charAt(0) === "+") s = s.slice(1);
    // ARTIK yalnız rakam, nokta, virgül olmalı. Harf kırpmak yok:
    // "12abc" sayı değildir, 12 değildir.
    if (!/^[\d.,]+$/.test(s)) return { bos: false, gecerli: false, deger: 0 };

    const noktaSayisi = (s.match(/\./g) || []).length;
    const virgulSayisi = (s.match(/,/g) || []).length;
    let ondalik = null, binlik = null;

    if (noktaSayisi && virgulSayisi) {
        ondalik = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
        binlik = ondalik === "," ? "." : ",";
    } else if (virgulSayisi === 1) {
        ondalik = ",";                                  // Türkçe: tek virgül hep ondalık
    } else if (virgulSayisi > 1) {
        binlik = ",";
    } else if (noktaSayisi === 1) {
        const p = s.split(".");
        // "1.500" binlik; "3.29" ondalık. Ayıran şey: arkasında TAM 3 hane var mı
        // ve baştaki grup 1-3 haneli mi. "0.500" binlik olamaz (0 bin diye bir şey yok).
        if (tur !== "oran" && p[1].length === 3 && /^[1-9]\d{0,2}$/.test(p[0])) binlik = ".";
        else ondalik = ".";
    } else if (noktaSayisi > 1) {
        if (tur === "oran") return { bos: false, gecerli: false, deger: 0 };
        binlik = ".";                                   // "1.234.567"
    }

    let tamKisim = s, ondalikKisim = "";
    if (ondalik) {
        const k = s.lastIndexOf(ondalik);
        tamKisim = s.slice(0, k);
        ondalikKisim = s.slice(k + 1);
        if (ondalikKisim.indexOf(",") >= 0 || ondalikKisim.indexOf(".") >= 0)
            return { bos: false, gecerli: false, deger: 0 };
    }

    if (binlik) {
        const g = tamKisim.split(binlik);
        // İlk grup 1-3 hane, KALAN HER GRUP tam 3 hane. "1,2,3" burada elenir.
        if (!/^\d{1,3}$/.test(g[0])) return { bos: false, gecerli: false, deger: 0 };
        for (let i = 1; i < g.length; i++)
            if (!/^\d{3}$/.test(g[i])) return { bos: false, gecerli: false, deger: 0 };
        tamKisim = g.join("");
    } else if (tamKisim !== "" && !/^\d+$/.test(tamKisim)) {
        return { bos: false, gecerli: false, deger: 0 };
    }

    if (tamKisim === "" && ondalikKisim === "") return { bos: false, gecerli: false, deger: 0 };
    const d = parseFloat((tamKisim || "0") + "." + (ondalikKisim || "0"));
    if (!isFinite(d)) return { bos: false, gecerli: false, deger: 0 };
    return { bos: false, gecerli: true, deger: eksi ? -d : d };
}

// Eski çağrı biçimi: her zaman SAYI döner, geçersizde 0.
function sayiOku(metin, tur) {
    const c = sayiCozumle(metin, tur);
    return c.gecerli ? c.deger : 0;
}

// "Kullanıcı bir şey yazdı ama sayı değil" durumunu ayırt etmek için.
// Boş kutu geçersiz sayılmaz; henüz yazılmamıştır.
function sayiGecersizMi(metin, tur) {
    const c = sayiCozumle(metin, tur);
    return !c.bos && !c.gecerli;
}

// ---------- 1) KREDİ TAKSİTİ ----------
// Annüite (eşit taksit) formülü: her ay aynı tutar ödenir.
// İhtiyaç kredisinde faizin üstüne KKDF (%15) ve BSMV (%5) biner.

function krediHesapla(tutar, aylikFaiz, taksitSayisi, vergiVar) {
    // Vade 0 girilirse bölme sonsuza gider; sayfa korumayı unutursa diye burada da durduruyoruz
    if (!(taksitSayisi >= 1) || !(tutar > 0)) {
        return { taksit: 0, toplamOdeme: 0, toplamFaiz: 0, anapara: tutar || 0,
                 vadeAy: taksitSayisi || 0, plan: [], gecersiz: true };
    }
    const i = (aylikFaiz / 100) * (vergiVar ? (1 + PARAMETRE.kkdf + PARAMETRE.bsmv) : 1);
    let taksit;
    if (i === 0) taksit = tutar / taksitSayisi;
    else taksit = tutar * i * Math.pow(1 + i, taksitSayisi) / (Math.pow(1 + i, taksitSayisi) - 1);

    // Ödeme planı: her ay anaparanın ne kadarı, faizin ne kadarı ödeniyor?
    const plan = [];
    let kalan = tutar;
    for (let ay = 1; ay <= taksitSayisi; ay++) {
        const faizPayi = kalan * i;
        const anaparaPayi = taksit - faizPayi;
        kalan = Math.max(0, kalan - anaparaPayi);
        plan.push({ ay: ay, taksit: taksit, faiz: faizPayi, anapara: anaparaPayi, kalan: kalan });
    }

    const toplam = taksit * taksitSayisi;
    return {
        taksit: taksit,
        toplamOdeme: toplam,
        toplamFaiz: toplam - tutar,
        efektifAylik: i * 100,
        yillikMaliyet: (Math.pow(1 + i, 12) - 1) * 100,
        plan: plan
    };
}

// ---------- 2) MEVDUAT FAİZİ ----------
// Türkiye'de faiz gelirinden stopaj kesilir; kullanıcı vade sonunda net alır.

/* Vadeye dusen stopaj oranini dondurur (yuzde olarak). */
function mevduatStopajOrani(vadeGun) {
    const g = Number(vadeGun);
    if (!isFinite(g) || g <= 0) return null;
    const k = PARAMETRE.mevduatStopajKademe.find(function (x) { return g <= x.enCokGun; });
    return k ? k.oran * 100 : null;
}

function mevduatHesapla(anapara, yillikFaiz, vadeGun, stopajYuzde, bilesikMi, donemSayisi) {
    // Anapara ya da vade 0 iken oranlar NaN üretiyordu
    if (!(anapara > 0) || !(vadeGun > 0)) {
        return { anapara: anapara || 0, brutFaiz: 0, stopaj: 0, netFaiz: 0,
                 vadeSonu: anapara || 0, gunlukGetiri: 0, aylikGetiri: 0,
                 yillikBasit: 0, gecersiz: true };
    }
    const oran = (yillikFaiz / 100) * vadeGun / 365;

    if (!bilesikMi) {
        const brut = anapara * oran;
        const stopaj = brut * stopajYuzde / 100;
        const net = brut - stopaj;
        return {
            brutFaiz: brut, stopaj: stopaj, netFaiz: net,
            vadeSonu: anapara + net,
            netYillik: anapara > 0 ? net / anapara * 365 / vadeGun * 100 : 0,
            donem: 1, toplamGun: vadeGun
        };
    }

    // Bileşik: her vade sonunda net faiz anaparaya eklenip yeniden yatırılır
    let bakiye = anapara, toplamBrut = 0, toplamStopaj = 0;
    for (let d = 0; d < donemSayisi; d++) {
        const brut = bakiye * oran;
        const stopaj = brut * stopajYuzde / 100;
        toplamBrut += brut;
        toplamStopaj += stopaj;
        bakiye += brut - stopaj;
    }
    const toplamGun = vadeGun * donemSayisi;
    return {
        brutFaiz: toplamBrut, stopaj: toplamStopaj, netFaiz: bakiye - anapara,
        vadeSonu: bakiye,
        netYillik: anapara > 0 ? (Math.pow(bakiye / anapara, 365 / toplamGun) - 1) * 100 : 0,
        donem: donemSayisi, toplamGun: toplamGun
    };
}

// Enflasyondan arındırılmış gerçek getiri (Fisher denklemi)
function reelGetiri(nominalYuzde, enflasyonYuzde) {
    return ((1 + nominalYuzde / 100) / (1 + enflasyonYuzde / 100) - 1) * 100;
}

// ---------- 3) KDV ----------
// İki yön var: KDV hariç tutardan KDV eklemek, ya da KDV dahil tutardan ayırmak.

function kdvHesapla(tutar, oran, dahilMi) {
    const k = oran / 100;
    if (dahilMi) {
        const haric = tutar / (1 + k);
        return { haric: haric, kdv: tutar - haric, dahil: tutar, oran: oran };
    }
    const kdv = tutar * k;
    return { haric: tutar, kdv: kdv, dahil: tutar + kdv, oran: oran };
}

// ---------- YARDIMCI: GELİR VERGİSİ ----------
// Dilimli (kademeli) vergi: her dilim kendi oranıyla vergilenir.
// Yıl içinde biriken matraha göre hangi dilimde olduğunuz değişir.

function gelirVergisi(matrah, oncekiKumulatif) {
    const onceki = oncekiKumulatif || 0;
    let vergi = 0;
    let alt = 0;
    let kalan = matrah;
    let konum = onceki;

    for (const [ust, oran] of PARAMETRE.vergiDilimleri) {
        if (kalan <= 0) break;
        const dilimUst = ust;
        if (konum >= dilimUst) { alt = dilimUst; continue; }
        const buDilimdeKullanilabilir = dilimUst - Math.max(konum, alt);
        const buDilimde = Math.min(kalan, buDilimdeKullanilabilir);
        vergi += buDilimde * oran;
        kalan -= buDilimde;
        konum += buDilimde;
        alt = dilimUst;
    }
    return vergi;
}

// Bir matrahın hangi dilime denk geldiğini söyler (ekranda göstermek için)
function vergiDilimi(kumulatifMatrah) {
    let sira = 1;
    for (const [ust, oran] of PARAMETRE.vergiDilimleri) {
        if (kumulatifMatrah <= ust) return { sira: sira, oran: oran * 100, ustSinir: ust };
        sira++;
    }
    return { sira: PARAMETRE.vergiDilimleri.length, oran: 40, ustSinir: Infinity };
}

// ---------- 4) NET MAAŞ ----------
// Türkiye'de net maaş yıl boyunca AYNI KALMAZ: gelir vergisi matrahı biriktikçe
// üst dilime geçilir ve net maaş düşer. Bu yüzden tek ay değil, 12 ayın tamamını
// hesaplıyoruz — çoğu hesaplayıcının atladığı yer burası.
//
// Asgari ücret istisnası: herkesin maaşının asgari ücrete denk gelen kısmı
// gelir vergisinden ve damga vergisinden muaftır. Bu yüzden asgari ücretin
// kendi vergisi ayrı bir "kümülatif" hattında takip edilip düşülür.

function netMaasPlani(brutAylik, baslangicAy) {
    const p = PARAMETRE;
    const ilkAy = baslangicAy || 1;
    const asgariGvMatrah = p.asgariBrut * (1 - p.sgkIsciOran - p.issizlikIsciOran);
    const damgaIstisna = p.asgariBrut * p.damgaOran;

    let kumulatif = 0;          // çalışanın birikmiş vergi matrahı
    let asgariKumulatif = 0;    // asgari ücretin birikmiş matrahı (istisna için)
    const aylar = [];

    for (let ay = ilkAy; ay <= 12; ay++) {
        const sgkMatrah = Math.min(Math.max(brutAylik, p.sgkTaban), p.sgkTavan);
        const sgkIsci = sgkMatrah * p.sgkIsciOran;
        const issizlik = sgkMatrah * p.issizlikIsciOran;

        const gvMatrah = Math.max(0, brutAylik - sgkIsci - issizlik);
        const gvHam = gelirVergisi(gvMatrah, kumulatif);
        const asgariGv = gelirVergisi(asgariGvMatrah, asgariKumulatif);
        const istisna = Math.min(gvHam, asgariGv);
        const gv = gvHam - istisna;

        const damgaHam = brutAylik * p.damgaOran;
        const damga = Math.max(0, damgaHam - damgaIstisna);

        const net = brutAylik - sgkIsci - issizlik - gv - damga;

        kumulatif += gvMatrah;
        asgariKumulatif += asgariGvMatrah;

        aylar.push({
            ay: ay,
            brut: brutAylik,
            sgkIsci: sgkIsci,
            issizlik: issizlik,
            gvMatrah: gvMatrah,
            kumulatifMatrah: kumulatif,
            gelirVergisi: gv,
            istisna: istisna,
            damga: damga,
            net: net,
            dilim: vergiDilimi(kumulatif)
        });
    }

    const toplamNet = aylar.reduce((t, a) => t + a.net, 0);
    return {
        aylar: aylar,
        ilkAyNet: aylar[0].net,
        sonAyNet: aylar[aylar.length - 1].net,
        yillikNet: toplamNet,
        ortalamaNet: toplamNet / aylar.length,
        dususTutari: aylar[0].net - aylar[aylar.length - 1].net
    };
}

// Ters hesap: "elime şu kadar geçsin" → brüt kaç olmalı?
// Formülü tersine çevirmek dilimler yüzünden zor; ikili arama ile buluyoruz.
function nettenBrute(hedefNet, ay) {
    let alt = hedefNet, ust = hedefNet * 3, brut = hedefNet;
    for (let i = 0; i < 60; i++) {
        brut = (alt + ust) / 2;
        const bulunan = netMaasPlani(brut, ay || 1).aylar[0].net;
        if (Math.abs(bulunan - hedefNet) < 0.01) break;
        if (bulunan < hedefNet) alt = brut; else ust = brut;
    }
    return brut;
}

// İşverene maliyet (işveren payları dahil)
function isvereneMaliyet(brutAylik) {
    const p = PARAMETRE;
    const matrah = Math.min(Math.max(brutAylik, p.sgkTaban), p.sgkTavan);
    const sgkIsveren = matrah * 0.2075;      // %20,75 (5 puanlık indirim uygulanmamış hâli)
    const issizlikIsveren = matrah * 0.02;   // %2
    return {
        brut: brutAylik,
        sgkIsveren: sgkIsveren,
        issizlikIsveren: issizlikIsveren,
        toplam: brutAylik + sgkIsveren + issizlikIsveren
    };
}

// ---------- 5) BÜTÇE ----------
// Ay sonunda cebinde ne kalıyor? Ve o kalanla ne yapılabilir?
// Buradaki "öneriler" tavsiye değil HESAPTIR: aynı parayı farklı yerlerde
// tutunca ne olacağını sayıyla gösterir, kararı kullanıcı verir.

// Gider kalemleri — 50/30/20 kuralı için "ihtiyaç mı istek mi" etiketli
const GIDER_KALEMLERI = [
    { kod: "kira", ad: "Kira / konut kredisi", grup: "Konut", tur: "ihtiyac" },
    { kod: "aidat", ad: "Aidat", grup: "Konut", tur: "ihtiyac" },
    { kod: "elektrik", ad: "Elektrik", grup: "Konut", tur: "ihtiyac" },
    { kod: "su", ad: "Su", grup: "Konut", tur: "ihtiyac" },
    { kod: "dogalgaz", ad: "Doğalgaz / ısınma", grup: "Konut", tur: "ihtiyac" },
    { kod: "internet", ad: "İnternet / telefon", grup: "Konut", tur: "ihtiyac" },

    { kod: "market", ad: "Market / mutfak", grup: "Yaşam", tur: "ihtiyac" },
    { kod: "disari", ad: "Dışarıda yemek", grup: "Yaşam", tur: "istek" },
    { kod: "saglik", ad: "Sağlık / ilaç", grup: "Yaşam", tur: "ihtiyac" },
    { kod: "giyim", ad: "Giyim", grup: "Yaşam", tur: "istek" },
    { kod: "egitim", ad: "Eğitim / kurs", grup: "Yaşam", tur: "ihtiyac" },

    { kod: "yakit", ad: "Yakıt / benzin", grup: "Ulaşım", tur: "ihtiyac" },
    { kod: "toplu", ad: "Toplu taşıma", grup: "Ulaşım", tur: "ihtiyac" },
    { kod: "aracBakim", ad: "Araç bakım / lastik", grup: "Ulaşım", tur: "ihtiyac" },
    { kod: "aracSigorta", ad: "Sigorta / MTV (aylığa bölünmüş)", grup: "Ulaşım", tur: "ihtiyac" },

    { kod: "kredi", ad: "Kredi taksiti", grup: "Borç", tur: "ihtiyac" },
    { kod: "kart", ad: "Kredi kartı ödemesi", grup: "Borç", tur: "ihtiyac" },

    { kod: "abonelik", ad: "Abonelikler (dizi, müzik…)", grup: "Diğer", tur: "istek" },
    { kod: "eglence", ad: "Eğlence / hobi", grup: "Diğer", tur: "istek" },
    { kod: "diger", ad: "Diğer", grup: "Diğer", tur: "istek" }
];

function butceOzeti(gelir, giderler) {
    let toplam = 0, ihtiyac = 0, istek = 0;
    const gruplar = {};
    const kalemler = [];

    GIDER_KALEMLERI.forEach(k => {
        const tutar = giderler[k.kod] || 0;
        if (tutar <= 0) return;
        toplam += tutar;
        if (k.tur === "ihtiyac") ihtiyac += tutar; else istek += tutar;
        gruplar[k.grup] = (gruplar[k.grup] || 0) + tutar;
        kalemler.push({ ad: k.ad, tutar: tutar, grup: k.grup, tur: k.tur });
    });

    kalemler.sort((a, b) => b.tutar - a.tutar);
    const kalan = gelir - toplam;

    return {
        gelir: gelir,
        toplamGider: toplam,
        kalan: kalan,
        tasarrufOrani: gelir > 0 ? kalan / gelir * 100 : 0,
        ihtiyac: ihtiyac,
        istek: istek,
        ihtiyacOran: gelir > 0 ? ihtiyac / gelir * 100 : 0,
        istekOran: gelir > 0 ? istek / gelir * 100 : 0,
        gruplar: gruplar,
        kalemler: kalemler,
        enBuyuk: kalemler[0] || null
    };
}

// Her ay düzenli para koyarsan yıl sonunda ne olur? (yıllık gelir dizisi / annüite)
function duzenliBirikim(aylikTutar, yillikFaiz, ayAdedi, stopajYuzde) {
    const netAylikOran = (yillikFaiz / 100 / 12) * (1 - (stopajYuzde || 0) / 100);
    let bakiye = 0;
    for (let a = 0; a < ayAdedi; a++) bakiye = (bakiye + aylikTutar) * (1 + netAylikOran);
    const yatirilan = aylikTutar * ayAdedi;
    return { bakiye: bakiye, yatirilan: yatirilan, kazanc: bakiye - yatirilan };
}

// Krediye her ay fazladan ödeme yaparsan kaç ay erken biter, ne kadar faizden kurtulursun?
function erkenKapatma(kalanBorc, aylikFaizYuzde, normalTaksit, ekOdeme) {
    const i = aylikFaizYuzde / 100;
    const sim = (taksit) => {
        let borc = kalanBorc, ay = 0, faiz = 0;
        while (borc > 0.01 && ay < 600) {
            const f = borc * i;
            const odenen = Math.min(taksit, borc + f);
            faiz += f;
            borc = borc + f - odenen;
            ay++;
            if (odenen <= f) return null;   // taksit faizi bile karşılamıyor
        }
        return { ay: ay, faiz: faiz };
    };
    const normal = sim(normalTaksit);
    const hizli = sim(normalTaksit + ekOdeme);
    if (!normal || !hizli) return null;
    return {
        normalAy: normal.ay, hizliAy: hizli.ay,
        kazanilanAy: normal.ay - hizli.ay,
        faizTasarrufu: normal.faiz - hizli.faiz
    };
}

// ---------- 6) KİRA ARTIŞI ----------
// Konut kiralarında yasal üst sınır: 12 aylık TÜFE ORTALAMASI.
// Dikkat: yıllık enflasyon (son 12 ayın değişimi) DEĞİL, 12 aylık ortalamadır.
// İkisi karıştırılır ve fazla zam istenmesine yol açar; araç bunu ayırt eder.

function kiraArtisi(mevcutKira, tufeOrtalama, istenenOran) {
    const yasalOran = tufeOrtalama;
    const yasalKira = mevcutKira * (1 + yasalOran / 100);
    const istenen = (istenenOran === null || istenenOran === undefined) ? yasalOran : istenenOran;
    const istenenKira = mevcutKira * (1 + istenen / 100);
    const asimVar = istenen > yasalOran + 1e-9;

    return {
        mevcut: mevcutKira,
        yasalOran: yasalOran,
        yasalKira: yasalKira,
        yasalArtis: yasalKira - mevcutKira,
        istenenOran: istenen,
        istenenKira: istenenKira,
        asimVar: asimVar,
        asimTutari: asimVar ? istenenKira - yasalKira : 0,
        yillikFark: (istenenKira - mevcutKira) * 12
    };
}

// ---------- 7) BİRİKİM / BİLEŞİK GETİRİ ----------
// "Her ay şu kadar ayırırsam N yıl sonra ne olur?" sorusunun cevabı.
// Nominal tutar tek başına yanıltıcıdır; bu yüzden REEL (enflasyondan
// arındırılmış) karşılığı da hesaplanır.

function birikimPlani(baslangic, aylikEkleme, yillikGetiriYuzde, yilSayisi, yillikEnflasyon) {
    const aylikOran = Math.pow(1 + yillikGetiriYuzde / 100, 1 / 12) - 1;
    const aylikEnf = Math.pow(1 + (yillikEnflasyon || 0) / 100, 1 / 12) - 1;

    let bakiye = baslangic, yatirilan = baslangic;
    const yillar = [];

    for (let ay = 1; ay <= yilSayisi * 12; ay++) {
        bakiye = bakiye * (1 + aylikOran) + aylikEkleme;
        yatirilan += aylikEkleme;
        if (ay % 12 === 0) {
            const yil = ay / 12;
            const enflasyonCarpani = Math.pow(1 + aylikEnf, ay);
            yillar.push({
                yil: yil,
                bakiye: bakiye,
                yatirilan: yatirilan,
                kazanc: bakiye - yatirilan,
                reelBakiye: bakiye / enflasyonCarpani
            });
        }
    }

    const son = yillar[yillar.length - 1] || { bakiye: baslangic, yatirilan: baslangic, kazanc: 0, reelBakiye: baslangic };
    return {
        yillar: yillar,
        sonBakiye: son.bakiye,
        toplamYatirilan: son.yatirilan,
        toplamKazanc: son.kazanc,
        reelBakiye: son.reelBakiye,
        reelKazanc: son.reelBakiye - son.yatirilan,
        katlanma: son.yatirilan > 0 ? son.bakiye / son.yatirilan : 0
    };
}

// ---------- 8) ALIM-SATIM KÂRI (altın, döviz, hisse…) ----------
// Kaç lira kazandığınız kadar, o parayı NE KADAR SÜREDE kazandığınız da önemli.
// Bu yüzden yıllıklandırılmış getiri ve enflasyona göre reel kâr da hesaplanır.

function alimSatimKar(alisBirim, satisBirim, miktar, gunSayisi, yillikEnflasyon, komisyonYuzde) {
    const kom = (komisyonYuzde || 0) / 100;
    const maliyet = alisBirim * miktar * (1 + kom);
    const hasilat = satisBirim * miktar * (1 - kom);
    const kar = hasilat - maliyet;
    const oran = maliyet > 0 ? kar / maliyet * 100 : 0;

    const gun = Math.max(1, gunSayisi || 1);
    const yillik = maliyet > 0 ? (Math.pow(hasilat / maliyet, 365 / gun) - 1) * 100 : 0;
    const donemEnflasyon = (Math.pow(1 + (yillikEnflasyon || 0) / 100, gun / 365) - 1) * 100;
    const reel = reelGetiri(oran, donemEnflasyon);

    return {
        maliyet: maliyet, hasilat: hasilat, kar: kar, oran: oran,
        gun: gun, yillikGetiri: yillik,
        donemEnflasyon: donemEnflasyon, reelOran: reel,
        reelKar: maliyet * reel / 100,
        komisyonTutari: alisBirim * miktar * kom + satisBirim * miktar * kom
    };
}

// ---------- 9) KIDEM VE İHBAR TAZMİNATI ----------
// Kıdem tazminatı: her TAM YIL için 30 günlük GİYDİRİLMİŞ brüt ücret.
// Küsurat günler orantılı eklenir.
//
// İKİ ÖNEMLİ AYRINTI:
// 1) "Giydirilmiş ücret" = çıplak brüt maaş + düzenli yan haklar
//    (yol, yemek, ikramiye, prim…) aylık karşılığı. Sadece maaş değildir.
// 2) Kıdem tazminatından SADECE damga vergisi kesilir.
//    Gelir vergisi ve SGK primi kesilmez. İhbar tazminatında ise
//    hem gelir vergisi hem damga kesilir — ikisi karıştırılır.

function kidemTavani(cikisTarihi) {
    const t = PARAMETRE.kidemTavanlari.find(x => cikisTarihi >= x.baslangic && cikisTarihi <= x.bitis);
    return t ? t : PARAMETRE.kidemTavanlari[PARAMETRE.kidemTavanlari.length - 1];
}

function gunFarki(baslangic, bitis) {
    const a = new Date(baslangic + "T00:00:00Z"), b = new Date(bitis + "T00:00:00Z");
    return Math.max(0, Math.round((b - a) / 86400000));
}

function kidemTazminati(giydirilmisBrut, giris, cikis) {
    const toplamGun = gunFarki(giris, cikis);
    if (toplamGun <= 0) return null;

    const tavan = kidemTavani(cikis);
    const tavanAsildi = giydirilmisBrut > tavan.tutar;
    const esasUcret = Math.min(giydirilmisBrut, tavan.tutar);

    const yil = Math.floor(toplamGun / 365);
    const artanGun = toplamGun - yil * 365;

    const brut = esasUcret * (toplamGun / 365);
    const damga = brut * PARAMETRE.damgaOran;

    return {
        toplamGun: toplamGun, yil: yil, artanGun: artanGun,
        tavan: tavan.tutar, tavanAsildi: tavanAsildi,
        esasUcret: esasUcret, giydirilmis: giydirilmisBrut,
        brut: brut, damga: damga, net: brut - damga,
        hakEdiyorMu: toplamGun >= 365
    };
}

// İhbar süresi kıdeme göre değişir (İş Kanunu md. 17)
function ihbarSuresi(toplamGun) {
    if (toplamGun < 182) return 2;        // 6 aydan az → 2 hafta
    if (toplamGun < 548) return 4;        // 6 ay – 1,5 yıl → 4 hafta
    if (toplamGun < 1095) return 6;       // 1,5 – 3 yıl → 6 hafta
    return 8;                             // 3 yıldan fazla → 8 hafta
}

function ihbarTazminati(giydirilmisBrut, toplamGun, gelirVergisiOrani) {
    const hafta = ihbarSuresi(toplamGun);
    const gunluk = giydirilmisBrut / 30;
    const brut = gunluk * hafta * 7;
    const gv = brut * (gelirVergisiOrani / 100);
    const damga = brut * PARAMETRE.damgaOran;
    return {
        hafta: hafta, gun: hafta * 7, gunlukUcret: gunluk,
        brut: brut, gelirVergisi: gv, damga: damga,
        net: brut - gv - damga
    };
}

// ---------- 10) NE KADAR KREDİ ÇEKEBİLİRİM ----------
// Bankalar taksitin gelire oranına sınır koyar (yaygın uygulama: en fazla %50).
// Buradan geriye doğru gidip alınabilecek en yüksek anaparayı buluruz.

function krediKapasitesi(aylikGelir, mevcutTaksitler, aylikFaiz, vade, oranSiniri, vergiVar) {
    const sinir = (oranSiniri === undefined ? 50 : oranSiniri) / 100;
    const kapasite = Math.max(0, aylikGelir * sinir - (mevcutTaksitler || 0));
    const i = (aylikFaiz / 100) * (vergiVar ? (1 + PARAMETRE.kkdf + PARAMETRE.bsmv) : 1);

    let anapara;
    if (i === 0) anapara = kapasite * vade;
    else anapara = kapasite * (Math.pow(1 + i, vade) - 1) / (i * Math.pow(1 + i, vade));

    return {
        taksitKapasitesi: kapasite,
        anapara: anapara,
        toplamOdeme: kapasite * vade,
        toplamFaiz: kapasite * vade - anapara,
        efektifAylik: i * 100,
        oranSiniri: sinir * 100,
        kalanGelir: aylikGelir - kapasite - (mevcutTaksitler || 0)
    };
}

// ---------- 11) FAZLA MESAİ ----------
// Saat ücreti = aylık brüt ÷ 225  (30 gün × 7,5 saat)
// Haftalık 45 saati aşan çalışma "fazla çalışma"dır: saat ücretinin 1,5 katı.
// Sözleşmede haftalık süre 45'ten azsa, aradaki fark "fazla sürelerle
// çalışma"dır ve 1,25 kat ödenir. İkisi karıştırılır.

const MESAI_TURLERI = [
    { kod: "fazlaCalisma", ad: "Fazla çalışma (45 saat üstü)", carpan: 1.5 },
    { kod: "fazlaSure", ad: "Fazla sürelerle çalışma (45 saat altı sözleşme)", carpan: 1.25 },
    { kod: "tatil", ad: "Genel tatil / bayram günü çalışması", carpan: 2.0 }
];

function fazlaMesai(aylikBrut, saatler, gelirVergisiOrani) {
    const saatUcreti = aylikBrut / 225;
    const kalemler = [];
    let brutToplam = 0;

    MESAI_TURLERI.forEach(t => {
        const saat = saatler[t.kod] || 0;
        if (saat <= 0) return;
        const tutar = saatUcreti * t.carpan * saat;
        brutToplam += tutar;
        kalemler.push({ ad: t.ad, saat: saat, carpan: t.carpan, birim: saatUcreti * t.carpan, tutar: tutar });
    });

    const gv = brutToplam * (gelirVergisiOrani / 100);
    const sgk = brutToplam * (PARAMETRE.sgkIsciOran + PARAMETRE.issizlikIsciOran);
    const damga = brutToplam * PARAMETRE.damgaOran;

    return {
        saatUcreti: saatUcreti, kalemler: kalemler,
        brut: brutToplam, sgk: sgk, gelirVergisi: gv, damga: damga,
        net: brutToplam - sgk - gv - damga
    };
}

// ---------- 12) YILLIK İZİN ----------
// İş Kanunu md. 53: kıdeme göre en az izin süreleri.
// 18 yaşından küçük ve 50 yaşından büyük çalışanlarda en az 20 gün.

function yillikIzin(hizmetYili, yas) {
    let gun;
    if (hizmetYili < 1) gun = 0;
    else if (hizmetYili <= 5) gun = 14;
    else if (hizmetYili <= 15) gun = 20;
    else gun = 26;

    const yasKurali = (yas > 0 && (yas < 18 || yas > 50));
    if (yasKurali && gun > 0 && gun < 20) gun = 20;

    return {
        gun: gun, yasKuraliUygulandi: yasKurali && gun === 20 && hizmetYili <= 5,
        hakEdiyorMu: hizmetYili >= 1
    };
}

// Kullanılmayan izin, işten ayrılırken ücrete çevrilir (izin ücreti)
function izinUcreti(gunSayisi, giydirilmisBrut, gelirVergisiOrani) {
    const gunluk = giydirilmisBrut / 30;
    const brut = gunluk * gunSayisi;
    const sgk = brut * (PARAMETRE.sgkIsciOran + PARAMETRE.issizlikIsciOran);
    const gv = brut * (gelirVergisiOrani / 100);
    const damga = brut * PARAMETRE.damgaOran;
    return { gunluk: gunluk, brut: brut, sgk: sgk, gelirVergisi: gv, damga: damga,
             net: brut - sgk - gv - damga };
}

// ---------- 13) İŞSİZLİK MAAŞI ----------
// Günlük ödenek = son 4 ayın günlük prime esas kazanç ortalaması × %40
// Aylık ödenek, brüt asgari ücretin %80'ini geçemez.
// Sadece damga vergisi kesilir.

function issizlikMaasi(son4AyBrutOrtalama, primGunu) {
    const gunlukKazanc = son4AyBrutOrtalama / 30;
    const hamAylik = gunlukKazanc * 0.40 * 30;
    const tavan = PARAMETRE.asgariBrut * 0.80;
    const aylik = Math.min(hamAylik, tavan);
    const damga = aylik * PARAMETRE.damgaOran;

    let sure = 0;
    if (primGunu >= 1080) sure = 300;
    else if (primGunu >= 900) sure = 240;
    else if (primGunu >= 600) sure = 180;

    return {
        gunlukKazanc: gunlukKazanc,
        hamAylik: hamAylik, tavan: tavan, tavanUygulandi: hamAylik > tavan,
        aylikBrut: aylik, damga: damga, aylikNet: aylik - damga,
        sureGun: sure, sureAy: sure / 30,
        toplamNet: (aylik - damga) * (sure / 30),
        hakEdiyorMu: primGunu >= 600
    };
}

// ---------- 14) YAKIT MALİYETİ ----------
// Aracın "100 km'de kaç litre" değeri üzerinden yol maliyeti.

function yakitMaliyeti(mesafeKm, tuketim100, litreFiyat, gidisDonus, kisiSayisi) {
    const mesafe = mesafeKm * (gidisDonus ? 2 : 1);
    const litre = mesafe * tuketim100 / 100;
    const tutar = litre * litreFiyat;
    const kisi = Math.max(1, kisiSayisi || 1);
    return {
        mesafe: mesafe, litre: litre, tutar: tutar,
        kmBasina: mesafe > 0 ? tutar / mesafe : 0,
        kisiBasina: tutar / kisi, kisiSayisi: kisi
    };
}

// ---------- 15) ELEKTRİK TÜKETİMİ ----------
// Bir cihaz ayda kaç lira yakıyor? Birim fiyatı kullanıcı faturasından girer;
// tarifeler bölgeye ve döneme göre değiştiği için buraya sabit yazmıyoruz.

function elektrikMaliyeti(gucWatt, gunlukSaat, birimFiyat, cihazAdedi) {
    const adet = Math.max(1, cihazAdedi || 1);
    const gunlukKwh = (gucWatt * gunlukSaat * adet) / 1000;
    return {
        gunlukKwh: gunlukKwh, aylikKwh: gunlukKwh * 30, yillikKwh: gunlukKwh * 365,
        gunluk: gunlukKwh * birimFiyat,
        aylik: gunlukKwh * 30 * birimFiyat,
        yillik: gunlukKwh * 365 * birimFiyat,
        adet: adet
    };
}

// ---------- 16) YÜZDE HESAPLARI ----------

function yuzdeHesap(tur, a, b) {
    switch (tur) {
        case "yuzdesi":      // A'nın %B'si kaçtır
            return { sonuc: a * b / 100, aciklama: `${sayi(a)} sayısının %${sayi(b)}'i` };
        case "yuzdeKaci":    // A, B'nin yüzde kaçıdır
            return { sonuc: b !== 0 ? a / b * 100 : 0, aciklama: `${sayi(a)}, ${sayi(b)} sayısının yüzde kaçı`, yuzdeMi: true };
        case "degisim":      // A'dan B'ye yüzde değişim
            return { sonuc: a !== 0 ? (b - a) / a * 100 : 0, aciklama: `${sayi(a)} → ${sayi(b)} değişimi`, yuzdeMi: true };
        case "artir":        // A'yı %B artır
            return { sonuc: a * (1 + b / 100), aciklama: `${sayi(a)} sayısını %${sayi(b)} artır` };
        case "azalt":        // A'yı %B azalt
            return { sonuc: a * (1 - b / 100), aciklama: `${sayi(a)} sayısını %${sayi(b)} azalt` };
        default:
            return { sonuc: 0, aciklama: "" };
    }
}

// ---------- 17) TARİH VE YAŞ ----------

function tarihFarki(bas, bit) {
    const a = new Date(bas + "T00:00:00Z"), b = new Date(bit + "T00:00:00Z");
    const gun = Math.round((b - a) / 86400000);
    const isaret = gun < 0 ? -1 : 1;
    const mutlak = Math.abs(gun);

    // Tam yıl/ay/gün ayrıştırması (takvime uygun)
    let ilk = gun < 0 ? b : a, son = gun < 0 ? a : b;
    let yil = son.getUTCFullYear() - ilk.getUTCFullYear();
    let ay = son.getUTCMonth() - ilk.getUTCMonth();
    let g = son.getUTCDate() - ilk.getUTCDate();
    if (g < 0) {
        ay--;
        const oncekiAy = new Date(Date.UTC(son.getUTCFullYear(), son.getUTCMonth(), 0));
        g += oncekiAy.getUTCDate();
    }
    if (ay < 0) { yil--; ay += 12; }

    return {
        gun: mutlak, isaret: isaret,
        hafta: Math.floor(mutlak / 7), kalanGun: mutlak % 7,
        yilAyGun: { yil: yil, ay: ay, gun: g },
        saat: mutlak * 24, dakika: mutlak * 1440,
        isGunu: isGunuSay(gun < 0 ? bit : bas, gun < 0 ? bas : bit)
    };
}

// Hafta sonlarını çıkararak iş günü sayar (resmî tatiller hariç değildir)
function isGunuSay(bas, bit) {
    let d = new Date(bas + "T00:00:00Z");
    const son = new Date(bit + "T00:00:00Z");
    let sayac = 0;
    while (d < son) {
        const h = d.getUTCDay();
        if (h !== 0 && h !== 6) sayac++;
        d = new Date(d.getTime() + 86400000);
    }
    return sayac;
}

// SINIRSIZ GUN KABUL ETME. Olculdu (28 Agustos 2026, CANLIDA):
//     tarihEkle("2026-08-26",   8000000)  ->  "+023929-11"   BOZUK DIZGI
//     tarihEkle("2026-08-26", 999999999)  ->  RangeError firlatiyor
// Firlatilan hata sayfanin hesabini YARIDA KESIYOR; ekranda ONCEKI sonuc
// kaliyor. Kullanici 999999999 yaziyor, ekran hala "100 gun sonrasi"
// diyor. Cokme yok, uyari yok -- sadece yanlis. Bayat sonuc hatasinin
// istisna yolundan sizmis hali.
//
// JavaScript tarihleri 1970'ten +/-100.000.000 gun tasiyabilir; ISO
// dizgisi de 4 haneyi asinca "+023929-11" gibi bicim degistirir ve
// `split("-")` ile ayristiran her yer bozulur. O yuzden sinir, dizginin
// bozulmadigi araliktir.
const TARIH_EN_COK_GUN = 2900000;   // yaklasik 7900 yil; yil 9999'un altinda

function tarihEkle(baslangic, gunSayisi) {
    const n = Number(gunSayisi);
    if (!isFinite(n) || Math.abs(n) > TARIH_EN_COK_GUN) return null;
    const d = new Date(baslangic + "T00:00:00Z");
    if (isNaN(d.getTime())) return null;
    d.setUTCDate(d.getUTCDate() + Math.round(n));
    const t = d.getTime();
    if (isNaN(t)) return null;
    const s = d.toISOString();
    /* Dizgi 4 haneli yil bicimini korumali; "+023929-11-..." kabul edilmez. */
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

// ---------- 18) TAKSİT / VADE FARKI ----------
// "Peşin şu kadar, taksitle bu kadar" — aradaki fark aslında gizli bir faizdir.
// Bu faizi ortaya çıkarıp mevduat getirisiyle karşılaştırılabilir hale getiriyoruz.

function vadeFarki(pesinFiyat, taksitTutari, taksitSayisi) {
    const toplam = taksitTutari * taksitSayisi;
    const fark = toplam - pesinFiyat;

    // Gizli aylık faiz: annüite denklemini sayısal olarak çözeriz
    let alt = 0, ust = 1, oran = 0;
    if (fark > 0 && pesinFiyat > 0) {
        for (let i = 0; i < 100; i++) {
            oran = (alt + ust) / 2;
            const bugunkuDeger = oran === 0
                ? taksitTutari * taksitSayisi
                : taksitTutari * (1 - Math.pow(1 + oran, -taksitSayisi)) / oran;
            if (bugunkuDeger > pesinFiyat) alt = oran; else ust = oran;
        }
    }

    return {
        pesin: pesinFiyat, taksitli: toplam, fark: fark,
        farkYuzde: pesinFiyat > 0 ? fark / pesinFiyat * 100 : 0,
        aylikFaiz: oran * 100,
        yillikFaiz: (Math.pow(1 + oran, 12) - 1) * 100,
        taksit: taksitTutari, sayi: taksitSayisi
    };
}

// ---------- 19) VÜCUT KİTLE İNDEKSİ ----------
// BMI bir TARAMA göstergesidir, teşhis değildir. Kas kütlesini,
// yaşı ve vücut tipini ayırt etmez — sayfada bunu açıkça yazıyoruz.

/* KAYNAK — Dünya Sağlık Örgütü (WHO) yetişkin BKİ sınıflandırması.
   Kesme noktaları 18,5 / 25 / 30 / 35 / 40 birebir WHO'nun tanımıdır:
   WHO Technical Report Series 894, "Obesity: preventing and managing
   the global epidemic" (2000); WHO güncel bilgi notlarinda ayni.
   SINIF 1 (resmi olcut) — bu sayilar bizim yorumumuz DEGIL.
   SINIRI: yetiskinler icindir. Cocuk, gebe, sporcu ve yasli
   gruplarinda ayni esikler kullanilmaz. */
const BMI_ARALIKLARI = [
    { ust: 18.5, ad: "Zayıf", renk: "uyari" },
    { ust: 25, ad: "Normal", renk: "artis" },
    { ust: 30, ad: "Fazla kilolu", renk: "uyari" },
    { ust: 35, ad: "Obez (1. derece)", renk: "azalis" },
    { ust: 40, ad: "Obez (2. derece)", renk: "azalis" },
    { ust: Infinity, ad: "İleri derecede obez", renk: "azalis" }
];

function vucutKitleIndeksi(kiloKg, boyCm) {
    const m = boyCm / 100;
    if (m <= 0) return null;
    const bki = kiloKg / (m * m);
    const aralik = BMI_ARALIKLARI.find(a => bki < a.ust);
    return {
        bki: bki, kategori: aralik.ad, renk: aralik.renk,
        idealAlt: 18.5 * m * m, idealUst: 24.9 * m * m,
        hedefFark: bki < 18.5 ? 18.5 * m * m - kiloKg : (bki >= 25 ? kiloKg - 24.9 * m * m : 0)
    };
}

// ---------- 20) GÜNLÜK KALORİ İHTİYACI ----------
// Mifflin-St Jeor denklemi — beslenme alanında en yaygın kabul gören formül.
// Sonuç bir TAHMİNDİR; kişiye göre %10-15 sapabilir.

/* KAYNAK — iki ayri sinif, karistirilmamali:

   1) BAZAL METABOLIZMA formulu (asagidaki `kaloriIhtiyaci` icinde):
      10 x kg + 6,25 x cm - 5 x yas + (E: +5 / K: -161)
      Mifflin MD, St Jeor ST ve ark., "A new predictive equation for
      resting energy expenditure in healthy individuals",
      Am J Clin Nutr 1990;51(2):241-247.  SINIF 1 — yayimlanmis denklem.

   2) Asagidaki HAREKET CARPANLARI (1,2 - 1,9): beslenme
      uygulamasinda yaygin kullanilan bir DUZEN; tek bir yetkili
      kaynagi yoktur, kisiden kisiye degisir.
      SINIF 3 — YAKLASIKTIR. Ayni kisi icin secilen basamak
      sonucu %20-30 oynatabilir; bu, hesabin en belirsiz parcasidir. */
const AKTIVITE = [
    { kod: 1.2, ad: "Hareketsiz (masa başı, spor yok)" },
    { kod: 1.375, ad: "Az hareketli (haftada 1-3 gün hafif spor)" },
    { kod: 1.55, ad: "Orta hareketli (haftada 3-5 gün spor)" },
    { kod: 1.725, ad: "Çok hareketli (haftada 6-7 gün spor)" },
    { kod: 1.9, ad: "Aşırı hareketli (ağır iş veya günde iki antrenman)" }
];

function kaloriIhtiyaci(kiloKg, boyCm, yas, cinsiyet, aktiviteKatsayi) {
    const temel = 10 * kiloKg + 6.25 * boyCm - 5 * yas + (cinsiyet === "erkek" ? 5 : -161);
    const gunluk = temel * aktiviteKatsayi;
    return {
        bazal: temel, gunluk: gunluk,
        kiloVerme: gunluk - 500,      // haftada ~0,5 kg
        hizliVerme: gunluk - 1000,    // haftada ~1 kg
        kiloAlma: gunluk + 500
    };
}

// ---------- 21) SINAV NETİ ----------
// Net = doğru − (yanlış ÷ bölen). Bölen sınava göre değişir (genelde 4, bazen 3).

function sinavNeti(dersler, bolen) {
    const b = bolen || 4;
    let toplamNet = 0, toplamDogru = 0, toplamYanlis = 0, toplamSoru = 0;
    const satirlar = dersler.map(d => {
        const net = d.dogru - d.yanlis / b;
        toplamNet += net; toplamDogru += d.dogru; toplamYanlis += d.yanlis;
        toplamSoru += d.soru || (d.dogru + d.yanlis + (d.bos || 0));
        return { ad: d.ad, dogru: d.dogru, yanlis: d.yanlis, bos: d.bos || 0, net: net };
    });
    return {
        satirlar: satirlar, toplamNet: toplamNet,
        toplamDogru: toplamDogru, toplamYanlis: toplamYanlis, toplamSoru: toplamSoru,
        basariYuzde: toplamSoru > 0 ? toplamNet / toplamSoru * 100 : 0, bolen: b
    };
}

// ---------- 22) KREDİ KARTI ASGARİ ÖDEME ----------
// En çok zarar ettiren finansal alışkanlıklardan biri: sadece asgari ödemek.
// Borç her ay küçülüyor gibi görünse de faiz onu geri şişirir.
// Bu araç, borcun kaç ayda biteceğini ve toplam ne ödeneceğini gösterir.

function asgariOdemeSimulasyonu(borc, aylikFaiz, asgariOran, sabitOdeme) {
    const i = aylikFaiz / 100;
    const oran = asgariOran / 100;

    const calistir = (odemeHesapla) => {
        let kalan = borc, ay = 0, toplamOdenen = 0, toplamFaiz = 0;
        const ilkAylar = [];
        while (kalan > 1 && ay < 360) {
            const odeme = Math.min(odemeHesapla(kalan), kalan * (1 + i));
            if (odeme <= kalan * i + 0.01) return null;   // faizi bile karşılamıyor
            const faiz = (kalan - odeme) > 0 ? (kalan - odeme) * i : 0;
            toplamOdenen += odeme;
            toplamFaiz += faiz;
            kalan = kalan - odeme + faiz;
            ay++;
            if (ay <= 6) ilkAylar.push({ ay: ay, odeme: odeme, faiz: faiz, kalan: Math.max(0, kalan) });
        }
        return { ay: ay, toplamOdenen: toplamOdenen, toplamFaiz: toplamFaiz,
                 bitmedi: kalan > 1, ilkAylar: ilkAylar };
    };

    const asgari = calistir(k => k * oran);
    const sabit = sabitOdeme > 0 ? calistir(() => sabitOdeme) : null;

    return {
        borc: borc, aylikFaiz: aylikFaiz, asgariOran: asgariOran,
        ilkAsgariTutar: borc * oran,
        asgari: asgari, sabit: sabit,
        kazanc: (asgari && sabit) ? asgari.toplamOdenen - sabit.toplamOdenen : 0,
        kazanilanAy: (asgari && sabit) ? asgari.ay - sabit.ay : 0
    };
}

// ---------- 23) MAAŞ ZAMMI ----------
// Zam oranı enflasyonun altındaysa, maaş artmış görünse de alım gücü düşer.

function maasZammi(eskiBrut, zamOrani, enflasyon) {
    const yeniBrut = eskiBrut * (1 + zamOrani / 100);
    const eskiNet = netMaasPlani(eskiBrut, 1).ilkAyNet;
    const yeniNet = netMaasPlani(yeniBrut, 1).ilkAyNet;
    const netZamOrani = eskiNet > 0 ? (yeniNet / eskiNet - 1) * 100 : 0;

    return {
        eskiBrut: eskiBrut, yeniBrut: yeniBrut, brutArtis: yeniBrut - eskiBrut,
        eskiNet: eskiNet, yeniNet: yeniNet, netArtis: yeniNet - eskiNet,
        zamOrani: zamOrani, netZamOrani: netZamOrani,
        reelZam: reelGetiri(zamOrani, enflasyon),
        reelNetZam: reelGetiri(netZamOrani, enflasyon),
        enflasyonuGecti: zamOrani > enflasyon,
        // Enflasyonu karşılamak için gereken brüt
        gerekenBrut: eskiBrut * (1 + enflasyon / 100)
    };
}

// ---------- 24) ALTIN ÇEVİRİMİ ----------
// Piyasadaki altın türleri 22 ayardır (saflık 0,916). Gram altın 24 ayar sayılır.

/* KAYNAK — T.C. Darphane ve Damga Matbaasi basim olculeri.
   Ziynet altinlari 22 ayar = 916 milyem (0,916 saflik):
     ceyrek 1,75 g · yarim 3,50 g · tam 7,00 g
     Cumhuriyet (Ata) 7,216 g
   Taki ayarlari: 22 ayar 0,916 · 18 ayar 0,750 · 14 ayar 0,585.
   SINIF 1 (resmi olcut) — basim standardi.
   SINIRI: eski ve yeni basimlar ile farkli darphaneler arasinda
   kucuk agirlik farklari olabilir; elinizdeki parcanin tartisi
   esastir. Ayrica burada ISCILIK ve alis-satis makasi YOKTUR;
   kuyumcu fiyati bu hesaptan farkli cikar. */
const ALTIN_TURLERI = [
    { kod: "gram", ad: "Gram altın (24 ayar)", gram: 1, ayar: 1.0 },
    { kod: "ceyrek", ad: "Çeyrek altın", gram: 1.75, ayar: 0.916 },
    { kod: "yarim", ad: "Yarım altın", gram: 3.50, ayar: 0.916 },
    { kod: "tam", ad: "Tam altın", gram: 7.00, ayar: 0.916 },
    { kod: "ata", ad: "Ata / Cumhuriyet altını", gram: 7.216, ayar: 0.916 },
    { kod: "bilezik22", ad: "22 ayar bilezik (1 gram)", gram: 1, ayar: 0.916 },
    { kod: "bilezik18", ad: "18 ayar takı (1 gram)", gram: 1, ayar: 0.750 },
    { kod: "bilezik14", ad: "14 ayar takı (1 gram)", gram: 1, ayar: 0.585 }
];

// Bir altın türünün saf altın karşılığı (gram cinsinden)
function safAltin(tur, adet) {
    const t = ALTIN_TURLERI.find(x => x.kod === tur);
    if (!t) return 0;
    return t.gram * t.ayar * adet;
}

function altinDegeri(tur, adet, gramFiyat) {
    const saf = safAltin(tur, adet);
    const t = ALTIN_TURLERI.find(x => x.kod === tur);
    return {
        tur: t ? t.ad : tur, adet: adet,
        safGram: saf, toplamGram: t ? t.gram * adet : 0,
        deger: saf * gramFiyat,
        birimDeger: adet > 0 ? saf * gramFiyat / adet : 0
    };
}

// ---------- 25) BİRİM ÇEVİRME ----------
// Her birim, grubun "temel birimi" cinsinden bir katsayıyla tanımlanır.
// Çeviri: önce temele çevir, sonra hedefe böl. Sıcaklık istisnadır (formül gerekir).

/* KAYNAK — uluslararasi tanimlar (SI ve NIST). Bu katsayilar tahmin
   degil TANIMDIR; birebir sabittir:
     1 inc = 2,54 cm      (tam)      1 ft = 30,48 cm     (tam)
     1 yd  = 0,9144 m     (tam)      1 mil = 1609,344 m  (tam)
     1 deniz mili = 1852 m (tam)     1 lb = 0,45359237 kg (tam)
     1 oz  = 28,349523125 g          1 galon (ABD) = 3,785411784 L
     1 hektar = 10.000 m²            1 donum = 1.000 m² (Turkiye)
     1 ft² = 0,09290304 m²           1 knot = 1,852 km/sa
   SINIF 1 (resmi olcut). Sicaklik dogrusal katsayiyla cevrilmez,
   ayri islenir (0 °C = 32 °F = 273,15 K).
   OLCULDU: bu katsayilarin hepsi `sinama.html` L bolumunde DIS
   REFERANSA karsi sinaniyor. Kendi icinde tutarli bir sinama
   (gidis-donus) yanlis katsayiyi YAKALAYAMAZ -- denendi, kacirdi. */
const BIRIM_GRUPLARI = {
    uzunluk: { ad: "Uzunluk", temel: "metre", birimler: [
        { kod: "mm", ad: "Milimetre", kat: 0.001 }, { kod: "cm", ad: "Santimetre", kat: 0.01 },
        { kod: "m", ad: "Metre", kat: 1 }, { kod: "km", ad: "Kilometre", kat: 1000 },
        { kod: "inc", ad: "İnç", kat: 0.0254 }, { kod: "ft", ad: "Fit (foot)", kat: 0.3048 },
        { kod: "yd", ad: "Yarda", kat: 0.9144 }, { kod: "mil", ad: "Mil", kat: 1609.344 },
        { kod: "denizmili", ad: "Deniz mili", kat: 1852 }
    ]},
    agirlik: { ad: "Ağırlık", temel: "kilogram", birimler: [
        { kod: "mg", ad: "Miligram", kat: 0.000001 }, { kod: "g", ad: "Gram", kat: 0.001 },
        { kod: "kg", ad: "Kilogram", kat: 1 }, { kod: "ton", ad: "Ton", kat: 1000 },
        { kod: "lb", ad: "Libre (pound)", kat: 0.45359237 }, { kod: "oz", ad: "Ons", kat: 0.028349523 }
    ]},
    alan: { ad: "Alan", temel: "metrekare", birimler: [
        { kod: "cm2", ad: "Santimetrekare", kat: 0.0001 }, { kod: "m2", ad: "Metrekare", kat: 1 },
        { kod: "ar", ad: "Ar", kat: 100 }, { kod: "donum", ad: "Dönüm", kat: 1000 },
        { kod: "hektar", ad: "Hektar", kat: 10000 }, { kod: "km2", ad: "Kilometrekare", kat: 1000000 },
        { kod: "ft2", ad: "Fitkare", kat: 0.09290304 }
    ]},
    hacim: { ad: "Hacim", temel: "litre", birimler: [
        { kod: "ml", ad: "Mililitre", kat: 0.001 }, { kod: "l", ad: "Litre", kat: 1 },
        { kod: "m3", ad: "Metreküp", kat: 1000 }, { kod: "galon", ad: "Galon (ABD)", kat: 3.785411784 }
    ]},
    hiz: { ad: "Hız", temel: "m/s", birimler: [
        { kod: "ms", ad: "Metre/saniye", kat: 1 }, { kod: "kmh", ad: "Kilometre/saat", kat: 0.277777778 },
        { kod: "mph", ad: "Mil/saat", kat: 0.44704 }, { kod: "knot", ad: "Knot", kat: 0.514444 }
    ]},
    sicaklik: { ad: "Sıcaklık", temel: "°C", ozel: true, birimler: [
        { kod: "C", ad: "Santigrat (°C)" }, { kod: "F", ad: "Fahrenhayt (°F)" }, { kod: "K", ad: "Kelvin" }
    ]}
};

function birimCevir(grup, kaynak, hedef, deger) {
    const g = BIRIM_GRUPLARI[grup];
    if (!g) return 0;

    if (g.ozel) {   // sıcaklık: doğrusal katsayı yetmez
        let c;
        if (kaynak === "C") c = deger;
        else if (kaynak === "F") c = (deger - 32) * 5 / 9;
        else c = deger - 273.15;
        if (hedef === "C") return c;
        if (hedef === "F") return c * 9 / 5 + 32;
        return c + 273.15;
    }

    const k = g.birimler.find(b => b.kod === kaynak);
    const h = g.birimler.find(b => b.kod === hedef);
    if (!k || !h) return 0;
    return deger * k.kat / h.kat;
}

// ---------- 26) SAYIYI YAZIYLA YAZMA ----------
// Çek, senet ve faturada tutarın yazıyla yazılması gerekir.

const _BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const _ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const _BASAMAK = ["", "bin", "milyon", "milyar", "trilyon", "katrilyon"];

function _ucBasamak(n) {
    let s = "";
    const yuz = Math.floor(n / 100), on = Math.floor((n % 100) / 10), bir = n % 10;
    if (yuz > 0) s += (yuz > 1 ? _BIRLER[yuz] : "") + "yüz";
    if (on > 0) s += _ONLAR[on];
    if (bir > 0) s += _BIRLER[bir];
    return s;
}

function sayiyiYaziyaCevir(sayi) {
    const tam = Math.floor(Math.abs(sayi));
    const kurus = Math.round((Math.abs(sayi) - tam) * 100);

    let metin = "";
    if (tam === 0) metin = "sıfır";
    else {
        const gruplar = [];
        let kalan = tam;
        while (kalan > 0) { gruplar.push(kalan % 1000); kalan = Math.floor(kalan / 1000); }
        for (let i = gruplar.length - 1; i >= 0; i--) {
            const g = gruplar[i];
            if (g === 0) continue;
            // "birbin" değil "bin" denir; ama "birmilyon" doğrudur
            if (i === 1 && g === 1) metin += "bin";
            else metin += _ucBasamak(g) + _BASAMAK[i];
        }
    }

    return {
        tam: metin,
        kurus: kurus,
        kurusYazi: kurus > 0 ? _ucBasamak(kurus) : "",
        negatif: sayi < 0,
        tamSayi: tam,
        // Çek/senet biçimi
        paraYazi: (sayi < 0 ? "eksi " : "") + metin + " lira" +
                  (kurus > 0 ? " " + _ucBasamak(kurus) + " kuruş" : "")
    };
}

// ---------- 27) NOT ORTALAMASI ----------
// Ağırlıklı ortalama: her dersin notu kredisiyle çarpılır, toplam krediye bölünür.

function notOrtalamasi(dersler) {
    let toplamAgirlikli = 0, toplamKredi = 0;

    // BOZUK SATIRI SESSIZCE DUSURME.
    // Olculdu (27.08.2026, capraz denetim): `d.kredi > 0` suzgeci, kredi
    // NaN oldugunda HER ZAMAN false doner (NaN ile yapilan her karsilastirma
    // false'tur). Sonuc: kullanici 3 ders girer, 2 ders hesaplanir, ortalama
    // 75 yerine 85 cikar ve HICBIR UYARI OLMAZ.
    // Ayni dosyada istatistik aracinda dogru desen zaten var (isFinite
    // suzgeci); burada eksikti.
    const atlanan = dersler.filter(d =>
        !Number.isFinite(d.kredi) || !Number.isFinite(d.not) || d.kredi <= 0);

    const satirlar = dersler.filter(d =>
        Number.isFinite(d.kredi) && Number.isFinite(d.not) && d.kredi > 0
    ).map(d => {
        toplamAgirlikli += d.not * d.kredi;
        toplamKredi += d.kredi;
        return { ad: d.ad, not: d.not, kredi: d.kredi, katki: d.not * d.kredi };
    });
    const ort = toplamKredi > 0 ? toplamAgirlikli / toplamKredi : 0;
    return {
        satirlar: satirlar, ortalama: ort,
        toplamKredi: toplamKredi, toplamAgirlikli: toplamAgirlikli,
        dortluk: ort / 25,          // yaklaşık dönüşüm
        dersSayisi: satirlar.length,
        // Hesaba KATILMAYAN satirlar. Arayuz bunu gostermezse bile burada
        // durur; "3 ders girdim ama 2 ders hesaplandi" sessiz kalmasin.
        atlananSayisi: atlanan.length,
        atlananlar: atlanan.map(d => d.ad || "(adsiz)")
    };
}

// ---------- 28) BOYA VE FAYANS ----------

function odaAlani(en, boy, yukseklik, kapiPencereM2) {
    const taban = en * boy;
    const cevre = 2 * (en + boy);
    const duvarHam = cevre * yukseklik;
    const duvar = Math.max(0, duvarHam - (kapiPencereM2 || 0));
    return { taban: taban, cevre: cevre, duvarHam: duvarHam, duvar: duvar, tavan: taban };
}

function boyaHesap(alanM2, verimM2Litre, katSayisi) {
    const litre = alanM2 * katSayisi / Math.max(0.1, verimM2Litre);
    return { litre: litre, kutu25: Math.ceil(litre / 2.5), kutu75: Math.ceil(litre / 7.5),
             kutu15: Math.ceil(litre / 15) };
}

function fayansHesap(alanM2, karoEnCm, karoBoyCm, firePayiYuzde) {
    const karoAlan = (karoEnCm / 100) * (karoBoyCm / 100);
    if (karoAlan <= 0) return null;
    const adetHam = alanM2 / karoAlan;
    const adet = Math.ceil(adetHam * (1 + (firePayiYuzde || 10) / 100));
    return { karoAlan: karoAlan, adetHam: adetHam, adet: adet,
             fireAdet: adet - Math.ceil(adetHam), kutuM2: adet * karoAlan };
}

// ---------- 29) ALAN, ÇEVRE VE HACİM (GEOMETRİ) ----------
// Öğrenci, usta, çiftçi hepsi kullanır. Formüller değişmez; risk yok.

const SEKILLER = {
    kare:        { ad: "Kare", tur: "duzlem", girdiler: [["a", "Kenar"]] },
    dikdortgen:  { ad: "Dikdörtgen", tur: "duzlem", girdiler: [["a", "Kısa kenar"], ["b", "Uzun kenar"]] },
    ucgen:       { ad: "Üçgen (taban ve yükseklik)", tur: "duzlem", girdiler: [["a", "Taban"], ["h", "Yükseklik"]] },
    ucgen3:      { ad: "Üçgen (üç kenarı belli)", tur: "duzlem", girdiler: [["a", "1. kenar"], ["b", "2. kenar"], ["c", "3. kenar"]] },
    daire:       { ad: "Daire", tur: "duzlem", girdiler: [["r", "Yarıçap"]] },
    yamuk:       { ad: "Yamuk", tur: "duzlem", girdiler: [["a", "Alt taban"], ["b", "Üst taban"], ["h", "Yükseklik"]] },
    paralelkenar:{ ad: "Paralelkenar", tur: "duzlem", girdiler: [["a", "Taban"], ["h", "Yükseklik"]] },
    kup:         { ad: "Küp", tur: "cisim", girdiler: [["a", "Ayrıt"]] },
    prizma:      { ad: "Dikdörtgen prizma (kutu)", tur: "cisim", girdiler: [["a", "En"], ["b", "Boy"], ["h", "Yükseklik"]] },
    silindir:    { ad: "Silindir", tur: "cisim", girdiler: [["r", "Yarıçap"], ["h", "Yükseklik"]] },
    kure:        { ad: "Küre", tur: "cisim", girdiler: [["r", "Yarıçap"]] },
    koni:        { ad: "Koni", tur: "cisim", girdiler: [["r", "Yarıçap"], ["h", "Yükseklik"]] }
};

function geometri(sekil, g) {
    const PI = Math.PI;
    const a = g.a || 0, b = g.b || 0, c = g.c || 0, h = g.h || 0, r = g.r || 0;
    const s = { sekil: sekil, gecerli: true, adimlar: [] };
    const ad = (aciklama, islem, sonuc) => s.adimlar.push({ aciklama: aciklama, islem: islem, sonuc: sonuc });

    switch (sekil) {
        case "kare":
            s.alan = a * a; s.cevre = 4 * a;
            ad("Alan = kenar × kenar", a + " × " + a, s.alan);
            ad("Çevre = 4 × kenar", "4 × " + a, s.cevre);
            break;
        case "dikdortgen":
            s.alan = a * b; s.cevre = 2 * (a + b);
            ad("Alan = en × boy", a + " × " + b, s.alan);
            ad("Çevre = 2 × (en + boy)", "2 × (" + a + " + " + b + ")", s.cevre);
            break;
        case "ucgen":
            s.alan = a * h / 2;
            ad("Alan = taban × yükseklik ÷ 2", a + " × " + h + " ÷ 2", s.alan);
            break;
        case "ucgen3": {
            // Heron formülü. Önce üçgen kurulabiliyor mu diye bak.
            const buyuk = Math.max(a, b, c), toplam = a + b + c;
            if (a <= 0 || b <= 0 || c <= 0 || buyuk >= toplam - buyuk) {
                s.gecerli = false;
                s.hata = "Bu üç kenarla üçgen çizilemez: en uzun kenar, diğer ikisinin toplamından kısa olmalı.";
                s.alan = 0; s.cevre = toplam; break;
            }
            const u = toplam / 2;
            s.alan = Math.sqrt(u * (u - a) * (u - b) * (u - c));
            s.cevre = toplam;
            ad("Çevrenin yarısı (u) bulunur", "(" + a + " + " + b + " + " + c + ") ÷ 2", u);
            ad("Heron formülü: kök[ u(u−a)(u−b)(u−c) ]",
               "kök[" + u + " × " + (u - a).toFixed(2) + " × " + (u - b).toFixed(2) + " × " + (u - c).toFixed(2) + "]", s.alan);
            break;
        }
        case "daire":
            s.alan = PI * r * r; s.cevre = 2 * PI * r;
            ad("Alan = pi × yarıçap²", "3,1416 × " + r + "²", s.alan);
            ad("Çevre = 2 × pi × yarıçap", "2 × 3,1416 × " + r, s.cevre);
            break;
        case "yamuk":
            s.alan = (a + b) * h / 2;
            ad("Alan = (alt taban + üst taban) × yükseklik ÷ 2", "(" + a + " + " + b + ") × " + h + " ÷ 2", s.alan);
            break;
        case "paralelkenar":
            s.alan = a * h;
            ad("Alan = taban × yükseklik", a + " × " + h, s.alan);
            break;
        case "kup":
            s.hacim = a * a * a; s.yuzey = 6 * a * a;
            ad("Hacim = ayrıt³", a + "³", s.hacim);
            ad("Yüzey alanı = 6 × ayrıt²", "6 × " + a + "²", s.yuzey);
            break;
        case "prizma":
            s.hacim = a * b * h; s.yuzey = 2 * (a * b + a * h + b * h);
            ad("Hacim = en × boy × yükseklik", a + " × " + b + " × " + h, s.hacim);
            ad("Yüzey = 2 × (en·boy + en·yük + boy·yük)", "2 × (" + (a * b) + " + " + (a * h) + " + " + (b * h) + ")", s.yuzey);
            break;
        case "silindir":
            s.hacim = PI * r * r * h; s.yuzey = 2 * PI * r * (r + h);
            ad("Hacim = pi × yarıçap² × yükseklik", "3,1416 × " + r + "² × " + h, s.hacim);
            ad("Yüzey = 2pi × yarıçap × (yarıçap + yükseklik)", "2 × 3,1416 × " + r + " × (" + r + " + " + h + ")", s.yuzey);
            break;
        case "kure":
            s.hacim = 4 / 3 * PI * r * r * r; s.yuzey = 4 * PI * r * r;
            ad("Hacim = 4/3 × pi × yarıçap³", "1,3333 × 3,1416 × " + r + "³", s.hacim);
            ad("Yüzey = 4 × pi × yarıçap²", "4 × 3,1416 × " + r + "²", s.yuzey);
            break;
        case "koni": {
            const yanAyrit = Math.sqrt(r * r + h * h);
            s.hacim = PI * r * r * h / 3; s.yuzey = PI * r * (r + yanAyrit);
            ad("Hacim = pi × yarıçap² × yükseklik ÷ 3", "3,1416 × " + r + "² × " + h + " ÷ 3", s.hacim);
            ad("Yan ayrıt = kök(yarıçap² + yükseklik²)", "kök(" + (r * r) + " + " + (h * h) + ")", yanAyrit);
            ad("Yüzey = pi × yarıçap × (yarıçap + yan ayrıt)", "3,1416 × " + r + " × (" + r + " + " + yanAyrit.toFixed(2) + ")", s.yuzey);
            break;
        }
        default: s.gecerli = false;
    }
    return s;
}

// ---------- 30) İSTATİSTİK: ORTALAMA, MEDYAN, STANDART SAPMA ----------

// OKUNAMAYAN GIRDI SIFIR OLUP LISTEYE GIRIYORDU.
//
// Olculdu (28 Agustos 2026, CANLIDA):
//     "12 abc 15"     -> [12, 0, 15]   ortalama 9    (dogrusu 13,5)
//     "10 20 nan 30"  -> [10,20,0,30]  ortalama 15   (dogrusu 20)
// Cokme yok, uyari yok -- ortalama sifira dogru cekiliyordu.
//
// Sebep ince: eski kod sonluluk suzgeciyle korundugunu saniyordu.
// Ama `sayiOku` gecersiz girdiyi 0 dondurur ve 0 SONLUDUR; suzgec
// hicbir sey elemiyordu. Sifira cevrilmis bir hata, sonluluk
// denetiminden her zaman gecer.
//
// Daha kotusu: bu arac, not ortalamasi duzeltilirken 'dogru desen'
// diye ORNEK GOSTERILMISTI (bkz. notOrtalamasi aciklamasi). Ornek
// alinan uygulamanin kendisi bozuktu.
//
// Atmak da cozum degil: 3 sayi yazip 2 sayinin ortalamasini gormek,
// yanlis ortalamayi gormek kadar sessizdir. Okunamayanlar AYRI
// tutuluyor ve arayuz onlari yaziyor -- `notOrtalamasi`ndaki
// `atlanan` deseninin ayni.
function sayiListesiOku(metin) {
    // Virgül hem ayraç hem ondalık olabilir. Kural: virgülden sonra BOŞLUK
    // varsa ayraç ("1, 2, 3"), yoksa ondalık ("1,5 2,5").
    let s = String(metin || "").replace(/[;\t\r]/g, "\n").replace(/,\s+/g, "\n");
    const parcalar = s.split(/[\n ]+/).map(x => x.trim()).filter(x => x !== "");
    const sayilar = [], atlananlar = [];
    parcalar.forEach(function (x) {
        const c = sayiCozumle(x);
        if (c.gecerli && isFinite(c.deger)) sayilar.push(c.deger);
        else atlananlar.push(x);
    });
    /* Eski cagri bicimi DIZI bekliyordu; dizi donmeye devam ediyor,
       uzerine `atlananlar` ilistiriliyor. Dizi islemleri bozulmaz,
       atlananlari soran da bulur. */
    sayilar.atlananlar = atlananlar;
    return sayilar;
}

function istatistik(dizi) {
    const n = dizi.length;
    if (!n) return { n: 0 };
    const sirali = dizi.slice().sort((x, y) => x - y);
    const toplam = dizi.reduce((t, x) => t + x, 0);
    const ort = toplam / n;

    // Doğrusal ara değer: Excel'in YÜZDEBİRLİK.DHL (PERCENTILE.INC) yöntemi
    const ceyrek = (p) => {
        const yer = (n - 1) * p, alt = Math.floor(yer), ust = Math.ceil(yer);
        return alt === ust ? sirali[alt] : sirali[alt] + (yer - alt) * (sirali[ust] - sirali[alt]);
    };

    const kareToplam = dizi.reduce((t, x) => t + (x - ort) * (x - ort), 0);
    const varyansAna = kareToplam / n;                      // popülasyon
    const varyansOrn = n > 1 ? kareToplam / (n - 1) : 0;    // örneklem

    const sayac = {};
    dizi.forEach(x => sayac[x] = (sayac[x] || 0) + 1);
    const enCok = Math.max.apply(null, Object.keys(sayac).map(k => sayac[k]));
    const mod = enCok > 1 ? Object.keys(sayac).filter(k => sayac[k] === enCok).map(Number).sort((x, y) => x - y) : [];

    return {
        n: n, toplam: toplam, ortalama: ort,
        medyan: ceyrek(0.5), q1: ceyrek(0.25), q3: ceyrek(0.75),
        iqr: ceyrek(0.75) - ceyrek(0.25),
        enKucuk: sirali[0], enBuyuk: sirali[n - 1], aralik: sirali[n - 1] - sirali[0],
        varyansAna: varyansAna, varyansOrn: varyansOrn,
        sapmaAna: Math.sqrt(varyansAna), sapmaOrn: Math.sqrt(varyansOrn),
        mod: mod, modSiklik: enCok > 1 ? enCok : 0,
        sirali: sirali
    };
}

// ---------- 31) SAAT VE SÜRE HESABI ----------
// Bordroda en çok karıştırılan şey: 7 saat 30 dakika = 7,5 saat (7,30 değil).

// `saatKipi` true ise deger GUNUN SAATIdir (0-23). false/atlanirsa SUREdir
// ve 30:00 gibi 24'u asan degerler mesrudur (30 saat calisilmis olabilir).
//
// ONCEDEN `parseInt(p[0], 10) || 0` yaziyordu ve HATAYI GIZLIYORDU:
//     "abc:def" -> 0 dakika        (sessiz)
//     "10 pm"   -> sayiOku 0 -> 0  (sessiz)
//     "12:75"   -> 795 dakika      (dakika 59'u asamaz)
//     "25:00"   -> 1500 dakika     (gunun saati olarak gecersiz)
// `|| 0` sayiyi kurtarmaz, hatayi gizler. SAYI-SINAMA.md B bolumu bu dort
// satiri acikca null istiyor. Cozumleyici duzgun olsa bile bicime
// bakmayan bir okuma onu bosa cikarir.
function dakikayaCevir(metin, saatKipi) {
    const s = String(metin === null || metin === undefined ? "" : metin).trim();
    if (s === "") return null;
    const p = s.split(":");
    if (p.length === 2) {
        if (!/^-?\d{1,3}$/.test(p[0]) || !/^\d{1,2}$/.test(p[1])) return null;
        const sa = parseInt(p[0], 10), dk = parseInt(p[1], 10);
        if (dk > 59) return null;                            // "12:75"
        if (saatKipi && (sa < 0 || sa > 23)) return null;     // "25:00"
        return sa * 60 + (s.charAt(0) === "-" ? -dk : dk);
    }
    if (p.length !== 1) return null;                          // "1:2:3"
    const d = sayiCozumle(s);
    if (!d.gecerli) return null;          // "10 pm" sessizce 0 olmasin
    return Math.round(d.deger * 60);      // "7,5" yazildiysa saat kabul edilir
}

function dakikayiSaate(toplamDk) {
    const eksi = toplamDk < 0, m = Math.abs(Math.round(toplamDk));
    const sa = Math.floor(m / 60), dk = m % 60;
    const iki = (x) => (x < 10 ? "0" : "") + x;
    return {
        saat: sa, dakika: dk, toplamDakika: toplamDk,
        // "0 saat 30 dakika" ya da "8 saat 0 dakika" kulagi tirmaliyor; gereksizi at
        metin: (eksi ? "−" : "") +
               (sa > 0 && dk > 0 ? sa + " saat " + dk + " dakika"
                : sa > 0 ? sa + " saat"
                : dk + " dakika"),
        ssdd: (eksi ? "−" : "") + iki(sa) + ":" + iki(dk),
        ondalik: toplamDk / 60
    };
}

function saatFarki(baslangic, bitis, molaDk) {
    // Gunun saati: 25:00 kabul edilmemeli.
    const b = dakikayaCevir(baslangic, true), s = dakikayaCevir(bitis, true);
    if (b === null || s === null) return null;
    let fark = s - b;
    const gecelik = fark < 0;
    if (gecelik) fark += 24 * 60;         // gece vardiyası: 22:00 → 06:00
    fark -= (molaDk || 0);
    const c = dakikayiSaate(fark);
    c.geceVardiyasi = gecelik; c.mola = molaDk || 0;
    c.brutDakika = fark + (molaDk || 0);
    return c;
}

function sureTopla(satirlar) {
    let toplam = 0; const gecerli = [], atlananlar = [];
    satirlar.forEach(x => {
        const ham = String(x === null || x === undefined ? "" : x).trim();
        if (ham === "") return;                 // bos satir: kullanici yazmamis
        const d = dakikayaCevir(x);
        // OKUNAMAYAN SATIRI SESSIZCE DUSURME. Ayni hata bu dosyada
        // `notOrtalamasi`da yasandi: kullanici 3 satir girip 2 satirin
        // toplamini goruyordu, hicbir uyari olmadan.
        if (d === null) { atlananlar.push(ham); return; }
        if (d === 0) return;                    // gercekten sifir sure
        toplam += d; gecerli.push(d);
    });
    const c = dakikayiSaate(toplam);
    c.adet = gecerli.length; c.satirlar = gecerli;
    c.atlananlar = atlananlar; c.atlananSayisi = atlananlar.length;
    c.ortalamaDakika = gecerli.length ? toplam / gecerli.length : 0;
    return c;
}

// ---------- 32) TAPU HARCI ----------
// Harçlar Kanunu 4 sayılı tarife: satış bedelinin binde 20'si alıcıdan,
// binde 20'si satıcıdan. Toplam %4. Oran 2026'da değişmedi.
// ÖNEMLİ: Matrah, beyan edilen satış bedelidir AMA belediyenin emlak vergi
// değerinin (rayiç) altında olamaz. Düşük beyan cezaya yol açar.

const TAPU = {
    aliciOran: 0.02,            // binde 20
    saticiOran: 0.02,           // binde 20
    donerSermaye: 2534,         // 2026: 2.227 + 307 ilave (büyükşehirde bölge katsayısıyla artabilir)
    guncelleme: "2026"
};

function tapuHarci(satisBedeli, emlakVergiDegeri, aliciHepsiniOdesin) {
    // Matrah ikisinden BÜYÜK olanı: beyan rayicin altında olamaz
    const matrah = Math.max(satisBedeli || 0, emlakVergiDegeri || 0);
    const dusukBeyan = (emlakVergiDegeri || 0) > (satisBedeli || 0);

    const aliciHarc = matrah * TAPU.aliciOran;
    const saticiHarc = matrah * TAPU.saticiOran;
    const toplamHarc = aliciHarc + saticiHarc;

    const aliciOdeme = (aliciHepsiniOdesin ? toplamHarc : aliciHarc) + TAPU.donerSermaye;
    const saticiOdeme = aliciHepsiniOdesin ? 0 : saticiHarc;

    return {
        matrah: matrah, dusukBeyan: dusukBeyan,
        satisBedeli: satisBedeli || 0, emlakVergiDegeri: emlakVergiDegeri || 0,
        aliciHarc: aliciHarc, saticiHarc: saticiHarc, toplamHarc: toplamHarc,
        donerSermaye: TAPU.donerSermaye,
        aliciOdeme: aliciOdeme, saticiOdeme: saticiOdeme,
        genelToplam: toplamHarc + TAPU.donerSermaye,
        // Düşük beyanla "kazanılacak" tutar — ceza riskini göstermek için
        beyanFarki: dusukBeyan ? 0 : Math.max(0, (satisBedeli || 0) - (emlakVergiDegeri || 0)) * 0.04
    };
}

// ---------- 33) EMLAK VERGİSİ ----------
// Emlak Vergisi Kanunu: mesken binde 1, işyeri binde 2, arsa binde 3, arazi binde 1.
// Büyükşehir belediyesi sınırları içinde bu oranlar İKİ KAT uygulanır.
// İki eşit taksit: 1. taksit Mart-Mayıs, 2. taksit Kasım.

const EMLAK = {
    oranlar: {                  // [normal, büyükşehir]
        mesken: [0.001, 0.002],
        isyeri: [0.002, 0.004],
        arsa:   [0.003, 0.006],
        arazi:  [0.001, 0.002]
    },
    adlar: { mesken: "Mesken (konut)", isyeri: "İş yeri", arsa: "Arsa", arazi: "Arazi" },
    // Değerli Konut Vergisi — 31.12.2025 Resmî Gazete, Emlak Vergisi K. Genel Tebliği No: 88
    dkvEsik: 17711000,
    dkvDilimler: [
        { ustSinir: 26567000, birikmis: 0,      taban: 17711000, oran: 0.003 },
        { ustSinir: 35425000, birikmis: 26568,  taban: 26567000, oran: 0.006 },
        { ustSinir: Infinity, birikmis: 79716,  taban: 35425000, oran: 0.010 }
    ],
    guncelleme: "2026"
};

function degerliKonutVergisi(vergiDegeri, tekKonutMu) {
    if (vergiDegeri <= EMLAK.dkvEsik) return { kapsamda: false, vergi: 0, sebep: "esikAlti" };
    // Türkiye'de tek meskeni olan, değeri ne olursa olsun muaf
    if (tekKonutMu) return { kapsamda: true, vergi: 0, sebep: "tekKonutMuafiyeti" };

    for (const d of EMLAK.dkvDilimler) {
        if (vergiDegeri <= d.ustSinir) {
            return {
                kapsamda: true, muaf: false,
                vergi: d.birikmis + (vergiDegeri - d.taban) * d.oran,
                dilimOrani: d.oran, dilimTabani: d.taban, dilimBirikmis: d.birikmis
            };
        }
    }
    return { kapsamda: false, vergi: 0 };
}

function emlakVergisi(tur, vergiDegeri, buyuksehirMi, muafiyetVarMi) {
    const oranCifti = EMLAK.oranlar[tur] || EMLAK.oranlar.mesken;
    const oran = oranCifti[buyuksehirMi ? 1 : 0];
    // Emekli/dul/yetim/malul/gazi + tek konut + brüt 200 m² altı => oran SIFIR
    const muaf = !!muafiyetVarMi && tur === "mesken";
    const yillik = muaf ? 0 : (vergiDegeri || 0) * oran;

    const dkv = tur === "mesken"
        ? degerliKonutVergisi(vergiDegeri || 0, !!muafiyetVarMi)
        : { kapsamda: false, vergi: 0 };

    return {
        tur: tur, turAd: EMLAK.adlar[tur] || tur,
        vergiDegeri: vergiDegeri || 0,
        buyuksehir: !!buyuksehirMi,
        oran: oran, oranBinde: oran * 1000,
        normalOran: oranCifti[0],
        muaf: muaf,
        yillik: yillik,
        taksit: yillik / 2,
        dkv: dkv,
        toplamYillik: yillik + (dkv.vergi || 0)
    };
}

// ---------- 34) KÂR MARJI VE SATIŞ FİYATI ----------
// Esnafın en çok karıştırdığı şey: "%50 kâr koydum" derken maliyetin %50'sini
// eklemek (markup) ile satışın %50'sini kâr saymak (marj) AYNI ŞEY DEĞİLDİR.
//   Maliyet 100'e %50 eklersen satış 150 olur; kâr 50, ama satışın %33,3'ü.
//   Satışın %50'si kâr olsun istiyorsan satış 200 olmalı.

function karMarji(maliyet, deger, yontem, kdvOran) {
    maliyet = maliyet || 0;
    deger = deger || 0;
    const kdv = (kdvOran || 0) / 100;
    let satis;

    if (yontem === "marj") {            // deger = satış üzerinden kâr yüzdesi
        const m = Math.min(99.99, deger) / 100;
        satis = maliyet / (1 - m);
    } else if (yontem === "markup") {   // deger = maliyet üzerine eklenen yüzde
        satis = maliyet * (1 + deger / 100);
    } else {                            // yontem === "fiyat": satış fiyatı verildi
        satis = deger;
    }

    const kar = satis - maliyet;
    const marj = satis > 0 ? kar / satis * 100 : 0;        // satış üzerinden
    const markup = maliyet > 0 ? kar / maliyet * 100 : 0;  // maliyet üzerine

    return {
        maliyet: maliyet, satis: satis, kar: kar,
        marj: marj, markup: markup,
        kdvTutar: satis * kdv,
        kdvliSatis: satis * (1 + kdv),
        zararda: kar < 0,
        // Aynı kârı korumak için indirimden sonra kaç adet fazla satmak gerekir
        basaBasKatsayi: marj > 0 ? 100 / marj : 0
    };
}

// İndirim sonrası aynı KÂRI korumak için satışın ne kadar artması gerekir?
// Esnafın "indirim yapayım, ciro artar" varsayımının gerçek bedeli.
function indirimEtkisi(maliyet, satis, indirimYuzde) {
    const eskiKar = satis - maliyet;
    const yeniSatis = satis * (1 - (indirimYuzde || 0) / 100);
    const yeniKar = yeniSatis - maliyet;
    return {
        eskiKar: eskiKar, yeniSatis: yeniSatis, yeniKar: yeniKar,
        karKaybi: eskiKar - yeniKar,
        // Aynı toplam kâra ulaşmak için gereken adet çarpanı
        gerekenArtis: yeniKar > 0 ? (eskiKar / yeniKar - 1) * 100 : Infinity,
        zararaGecti: yeniKar < 0
    };
}

// ---------- 35) İSKONTO (ARDIŞIK İNDİRİM) ----------
// %20 + %10 iskonto, %30 DEĞİLDİR. İkinci indirim, birinciden kalan tutara uygulanır:
//   100 → %20 indirim → 80 → %10 indirim → 72. Yani toplam %28.

function iskonto(listeFiyat, oranlar, kdvOran) {
    listeFiyat = listeFiyat || 0;
    const gecerli = (oranlar || []).filter(o => o > 0);
    let fiyat = listeFiyat;
    const adimlar = [];
    gecerli.forEach(o => {
        const dusen = fiyat * o / 100;
        adimlar.push({ oran: o, oncesi: fiyat, dusen: dusen, sonrasi: fiyat - dusen });
        fiyat -= dusen;
    });
    const toplamIndirim = listeFiyat - fiyat;
    const kdv = (kdvOran || 0) / 100;
    return {
        listeFiyat: listeFiyat, netFiyat: fiyat,
        toplamIndirim: toplamIndirim,
        gercekOran: listeFiyat > 0 ? toplamIndirim / listeFiyat * 100 : 0,
        // İnsanların yanlışlıkla topladığı oran
        toplananOran: gecerli.reduce((t, o) => t + o, 0),
        adimlar: adimlar,
        kdvTutar: fiyat * kdv,
        kdvliNet: fiyat * (1 + kdv)
    };
}

// Net fiyattan geriye: toplam iskonto oranı kaçmış?
function iskontoOraniBul(listeFiyat, netFiyat) {
    if (!listeFiyat || listeFiyat <= 0) return 0;
    return (listeFiyat - netFiyat) / listeFiyat * 100;
}

// ---------- 36) DOĞALGAZ FATURASI ----------
// Sayaç m³ ölçer ama fatura kWh üzerinden kesilir. Çevrim, gazın
// "üst ısıl değeri" ile yapılır ve bölgeye/aya göre değişir; faturanızda yazar.

function dogalgazFaturasi(m3, isilDeger, birimFiyatKwh, sabitBedel, kdvOran) {
    m3 = m3 || 0;
    const kat = isilDeger || 10.64;          // kWh/m³ — faturada "üst ısıl değer"
    const kwh = m3 * kat;
    const tuketim = kwh * (birimFiyatKwh || 0);
    const araToplam = tuketim + (sabitBedel || 0);
    const kdv = araToplam * ((kdvOran || 0) / 100);
    return {
        m3: m3, isilDeger: kat, kwh: kwh,
        tuketimBedeli: tuketim, sabitBedel: sabitBedel || 0,
        araToplam: araToplam, kdv: kdv,
        toplam: araToplam + kdv,
        m3BasinaMaliyet: m3 > 0 ? (araToplam + kdv) / m3 : 0
    };
}

// Sayaç okumasından tüketim: endeks farkı (sayaç devrederse dikkat)
function sayacFarki(ilk, son, basamak) {
    ilk = ilk || 0; son = son || 0;
    if (son >= ilk) return son - ilk;
    // Sayaç turladı: 999999 -> 000012 gibi
    const tur = Math.pow(10, basamak || String(Math.floor(ilk)).length);
    return (tur - ilk) + son;
}

// ---------- 37) DOĞUM İZNİ, SÜT İZNİ VE BABALIK İZNİ ----------
// 7578 sayılı Kanun (Resmî Gazete 01.05.2026) 4857 sayılı İş Kanunu md. 74'ü
// değiştirdi. Kanun metninden birebir:
//   "doğumdan sonra sekiz" -> "doğumdan sonra ONALTI"
//   "toplam onaltı"        -> "toplam YİRMİDÖRT"
//   doğum öncesi çalışma "üç" hafta -> "İKİ" hafta
//   ücretsiz izin fıkrası: "onaltı" -> "yirmidört", "onsekiz" -> "yirmialtı"
// Yani: tekil 8+16 = 24 hafta, çoğul 10+16 = 26 hafta.
// Babalık izni aynı kanunla 5 günden 10 güne çıktı.

const DOGUM_IZNI = {
    oncesiTekil: 8,          // hafta
    oncesiCogul: 10,         // çoğul gebelikte 2 hafta fazla
    sonrasi: 16,             // ESKİDEN 8'Dİ — 01.05.2026'da değişti
    enAzOncesi: 2,           // doktor onayıyla doğuma 2 hafta kalana dek çalışılabilir
    babalikGun: 10,          // ESKİDEN 5'Tİ
    sutIzniSaat: 1.5,        // günde, çocuk 1 yaşına gelene kadar
    ucretsizAy: 6,           // analık izni bitiminden sonra, istek hâlinde
    dayanak: "4857/74 — 7578 sayılı Kanun, R.G. 01.05.2026",
    guncelleme: "2026"
};

function gunEkle(tarih, gun) {
    const t = new Date(tarih.getTime());
    t.setDate(t.getDate() + gun);
    return t;
}

function ayEkle(tarih, ay) {
    const t = new Date(tarih.getTime());
    const g = t.getDate();
    t.setMonth(t.getMonth() + ay);
    if (t.getDate() !== g) t.setDate(0);   // 31 Ocak + 1 ay = 28/29 Şubat
    return t;
}

function tarihYaz(t) {
    if (!t || isNaN(t.getTime())) return "—";
    const AY = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
                "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    const GUN = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    return t.getDate() + " " + AY[t.getMonth()] + " " + t.getFullYear() + " " + GUN[t.getDay()];
}

function dogumIzni(dogumTarihi, cogulMu, calisilacakHafta) {
    const d = new Date(dogumTarihi);
    if (isNaN(d.getTime())) return null;

    const oncesiHak = cogulMu ? DOGUM_IZNI.oncesiCogul : DOGUM_IZNI.oncesiTekil;

    // Doktor onayıyla doğuma "calisilacakHafta" kalana dek çalışılabilir.
    // Boş bırakılırsa hakkın tamamı doğum öncesinde kullanılır.
    // NaN KORUMASI: Math.max(2, Math.min(8, NaN)) yine NaN verir ve ekrana
    // "NaN hafta" diye yazilirdi. Sayi olmayan her sey "bos" sayilir.
    let oncesi = (calisilacakHafta === null || calisilacakHafta === undefined || calisilacakHafta === "")
        ? oncesiHak : Number(calisilacakHafta);
    if (!isFinite(oncesi)) oncesi = oncesiHak;
    oncesi = Math.max(DOGUM_IZNI.enAzOncesi, Math.min(oncesiHak, oncesi));

    // Kullanılmayan doğum öncesi süre, doğum sonrasına EKLENİR
    const aktarilan = oncesiHak - oncesi;
    const sonrasi = DOGUM_IZNI.sonrasi + aktarilan;

    const baslangic = gunEkle(d, -oncesi * 7);
    const bitis = gunEkle(d, sonrasi * 7 - 1);     // son gün dahil

    const sutBitis = ayEkle(d, 12);                 // çocuk 1 yaşına gelene kadar
    const ucretsizBitis = ayEkle(bitis, DOGUM_IZNI.ucretsizAy);

    return {
        dogum: d,
        cogul: !!cogulMu,
        oncesiHak: oncesiHak, oncesi: oncesi, aktarilan: aktarilan,
        sonrasi: sonrasi,
        toplamHafta: oncesi + sonrasi,
        toplamGun: (oncesi + sonrasi) * 7,
        baslangic: baslangic, bitis: bitis,
        kalanGun: Math.ceil((bitis - new Date()) / 86400000),
        sutBitis: sutBitis, sutSaat: DOGUM_IZNI.sutIzniSaat,
        ucretsizBitis: ucretsizBitis, ucretsizAy: DOGUM_IZNI.ucretsizAy,
        babalikGun: DOGUM_IZNI.babalikGun,
        // Eski düzenlemeyle karşılaştırma (8 hafta sonrası, 5 gün babalık)
        eskiSonrasi: 8 + aktarilan,
        eskiToplam: oncesi + 8 + aktarilan,
        kazanilanHafta: sonrasi - (8 + aktarilan)
    };
}

// ---------- 38) KİRA GELİRİ VERGİSİ (GMSİ) ----------
// DİKKAT: Kira geliri "ücret dışı" gelirdir; vergi tarifesi ÜCRETTEN FARKLIDIR.
// Üçüncü dilim ücrette 1.500.000, ücret dışında 1.000.000'da biter.
// Doğrulama: kanunun yazdığı birikmiş tutarlar dilimlerden birebir çıkıyor —
//   ücret     : 5.300.000'de 1.697.500 TL
//   ücret dışı: 5.300.000'de 1.737.500 TL

const KIRA_VERGI = {
    konutIstisna: 58000,        // 2026 konut kira geliri istisnası
    goturuGiderOran: 0.15,      // istisna düşüldükten SONRA kalanın %15'i
    // Ücret DIŞI gelir tarifesi 2026
    dilimler: [
        [190000, 0.15],
        [400000, 0.20],
        [1000000, 0.27],
        [5300000, 0.35],
        [Infinity, 0.40]
    ],
    guncelleme: "2026"
};

function ucretDisiVergi(matrah) {
    if (matrah <= 0) return { vergi: 0, dokum: [] };
    let kalan = matrah, alt = 0, toplam = 0;
    const dokum = [];
    for (const [ust, oran] of KIRA_VERGI.dilimler) {
        if (kalan <= 0) break;
        const dilimTutar = Math.min(kalan, ust - alt);
        const v = dilimTutar * oran;
        dokum.push({ alt: alt, ust: ust, oran: oran, tutar: dilimTutar, vergi: v });
        toplam += v; kalan -= dilimTutar; alt = ust;
    }
    return { vergi: toplam, dokum: dokum, ortalamaOran: matrah > 0 ? toplam / matrah * 100 : 0 };
}

function kiraGeliriVergisi(yillikKira, yontem, gercekGider, istisnaVarMi) {
    yillikKira = yillikKira || 0;
    const istisna = istisnaVarMi === false ? 0 : Math.min(yillikKira, KIRA_VERGI.konutIstisna);
    const istisnaSonrasi = Math.max(0, yillikKira - istisna);

    // Götürü giderde oran, istisna DÜŞÜLDÜKTEN SONRAKİ tutara uygulanır
    const gider = yontem === "gercek"
        ? Math.min(istisnaSonrasi, gercekGider || 0)
        : istisnaSonrasi * KIRA_VERGI.goturuGiderOran;

    const matrah = Math.max(0, istisnaSonrasi - gider);
    const v = ucretDisiVergi(matrah);

    // İstisna sınırının altındaysa beyan gerekmez
    const beyanGerekli = yillikKira > KIRA_VERGI.konutIstisna || istisnaVarMi === false;

    return {
        yillikKira: yillikKira, aylikKira: yillikKira / 12,
        istisna: istisna, istisnaSonrasi: istisnaSonrasi,
        yontem: yontem, gider: gider,
        matrah: matrah,
        vergi: v.vergi, dilimDokum: v.dokum, ortalamaOran: v.ortalamaOran,
        taksit: v.vergi / 2,
        netKalan: yillikKira - v.vergi,
        beyanGerekli: beyanGerekli,
        // Diğer yöntemle karşılaştırma
        digerYontemGider: yontem === "gercek" ? istisnaSonrasi * KIRA_VERGI.goturuGiderOran : (gercekGider || 0)
    };
}

// ---------- 39) GEBELİK HAFTASI VE TAHMİNİ DOĞUM TARİHİ ----------
// Naegele kuralı: tahmini doğum = son adet tarihi + 280 gün (40 hafta).
// Tıbbi teşhis değildir; hekimin ultrason ölçümü esastır.

/* KAYNAK — Naegele kurali: tahmini dogum tarihi, son adet kanamasinin
   ILK gununden itibaren 280 gun (40 hafta). Kadin dogum uygulamasinin
   standart kabulu; 28 gunluk duzenli dongu varsayar.
   SINIF 1 (yerlesik olcut) ama SINIRI genis: dongusu duzensiz ya da
   28 gunden farkli olanlarda tarih kayar. Kesin tarih ULTRASONLA
   belirlenir; buradaki sayi bir TAHMINDIR. */
const GEBELIK = { toplamGun: 280, toplamHafta: 40 };

function gebelikHesap(sonAdetTarihi, bugunTarihi) {
    const sat = new Date(sonAdetTarihi);
    if (isNaN(sat.getTime())) return null;
    const bugun = bugunTarihi ? new Date(bugunTarihi) : new Date();
    bugun.setHours(0, 0, 0, 0); sat.setHours(0, 0, 0, 0);

    const dogum = gunEkle(sat, GEBELIK.toplamGun);
    const gecen = Math.floor((bugun - sat) / 86400000);
    const hafta = Math.floor(gecen / 7);
    const gun = gecen % 7;
    const kalanGun = Math.ceil((dogum - bugun) / 86400000);

    const donem = hafta < 14 ? 1 : hafta < 28 ? 2 : 3;
    const donemAd = ["", "1. üç ay (ilk trimester)", "2. üç ay (ikinci trimester)", "3. üç ay (üçüncü trimester)"][donem];

    // Doğum izni bu tarihten başlar (tekil gebelikte 8 hafta önce)
    const izinTekil = gunEkle(dogum, -8 * 7);
    const izinCogul = gunEkle(dogum, -10 * 7);

    return {
        sonAdet: sat, tahminiDogum: dogum, bugun: bugun,
        gecenGun: gecen, hafta: hafta, gun: gun,
        metin: hafta + " hafta " + gun + " gün",
        kalanGun: kalanGun, kalanHafta: Math.floor(kalanGun / 7),
        yuzde: Math.max(0, Math.min(100, gecen / GEBELIK.toplamGun * 100)),
        donem: donem, donemAd: donemAd,
        izinTekil: izinTekil, izinCogul: izinCogul,
        gecerli: gecen >= 0 && gecen <= 320,
        dogduMu: gecen > GEBELIK.toplamGun
    };
}

// Tahmini doğum tarihinden geriye: son adet ne zamandı?
function gebelikGeriye(tahminiDogum) {
    const d = new Date(tahminiDogum);
    if (isNaN(d.getTime())) return null;
    return gunEkle(d, -GEBELIK.toplamGun);
}

// ---------- 40) EV: KİRALAMAK MI, SATIN ALMAK MI? ----------
// Çoğu karşılaştırma haksızdır: sadece "taksit vs kira" bakar.
// DÜRÜST karşılaştırma üç şeyi de hesaba katmalı:
//   1. Peşinatı vermeseydin o para yatırımda kazanç getirecekti (fırsat maliyeti)
//   2. Ev sahibinin aidat, emlak vergisi, bakım gibi ek giderleri var
//   3. Dönem sonunda evin bir değeri var, kiracının böyle bir varlığı yok
// Ayrıca kira her yıl artar; taksit sabit kalır. Bu da hesaba katılıyor.

function kiralaAlKarsilastir(g) {
    const fiyat = g.fiyat || 0;
    const pesinat = Math.min(g.pesinat || 0, fiyat);
    const kredi = Math.max(0, fiyat - pesinat);
    const aylikFaiz = (g.faiz || 0) / 100;
    const vadeAy = Math.max(1, Math.round(g.vadeAy || 120));
    const yil = Math.max(1, Math.round(g.yil || 10));
    const ayToplam = yil * 12;

    // Kredi taksiti (annüite)
    const taksit = aylikFaiz > 0
        ? kredi * aylikFaiz * Math.pow(1 + aylikFaiz, vadeAy) / (Math.pow(1 + aylikFaiz, vadeAy) - 1)
        : kredi / vadeAy;

    const yatirimAylik = Math.pow(1 + (g.yatirimGetiri || 0) / 100, 1 / 12) - 1;
    const evArtisAylik = Math.pow(1 + (g.evArtis || 0) / 100, 1 / 12) - 1;
    const kiraArtisYillik = (g.kiraArtis || 0) / 100;

    let borc = kredi;
    let evDeger = fiyat;
    let kira = g.kira || 0;
    let toplamTaksit = 0, toplamFaiz = 0, toplamKira = 0, toplamGider = 0;
    // Kiracı peşinatı yatırımda tutar; ayrıca taksit-kira farkını da yatırır
    let kiraciBirikim = pesinat;
    const yillikIz = [];

    for (let ay = 1; ay <= ayToplam; ay++) {
        // --- SATIN ALAN ---
        let odenenTaksit = 0;
        if (ay <= vadeAy && borc > 0.01) {
            const faizPay = borc * aylikFaiz;
            const anaPay = Math.min(borc, taksit - faizPay);
            borc -= anaPay;
            odenenTaksit = faizPay + anaPay;
            toplamFaiz += faizPay;
            toplamTaksit += odenenTaksit;
        }
        // Ev sahibinin ek giderleri
        const gider = (g.aidat || 0)
                    + evDeger * ((g.emlakVergisiBinde || 0) / 1000) / 12
                    + evDeger * ((g.bakimYuzde || 0) / 100) / 12;
        toplamGider += gider;
        evDeger *= (1 + evArtisAylik);

        // --- KİRACI ---
        toplamKira += kira;
        // Ev sahibinin o ay cebinden çıkan − kiracının çıkanı = kiracının yatırabileceği fark
        const fark = (odenenTaksit + gider) - kira;
        kiraciBirikim = kiraciBirikim * (1 + yatirimAylik) + Math.max(0, fark);
        if (fark < 0) kiraciBirikim += fark;   // kira daha pahalıysa birikimden yer

        if (ay % 12 === 0) {
            kira *= (1 + kiraArtisYillik);     // kira yılda bir artar
            yillikIz.push({
                yil: ay / 12,
                evDeger: evDeger, borc: borc,
                alanServet: evDeger - borc,
                kiraciServet: kiraciBirikim,
                aylikKira: kira
            });
        }
    }

    const alanServet = evDeger - borc;          // dönem sonu net varlık
    const alanMaliyet = pesinat + toplamTaksit + toplamGider - (evDeger - borc);
    const kiraciMaliyet = toplamKira - (kiraciBirikim - pesinat);

    // Hangi yılda satın alan öne geçiyor?
    let basabasYil = null;
    for (const y of yillikIz) {
        if (y.alanServet >= y.kiraciServet) { basabasYil = y.yil; break; }
    }

    return {
        fiyat: fiyat, pesinat: pesinat, kredi: kredi, taksit: taksit,
        yil: yil,
        toplamTaksit: toplamTaksit, toplamFaiz: toplamFaiz,
        toplamGider: toplamGider, toplamKira: toplamKira,
        sonEvDeger: evDeger, kalanBorc: borc,
        alanServet: alanServet, kiraciServet: kiraciBirikim,
        alanMaliyet: alanMaliyet, kiraciMaliyet: kiraciMaliyet,
        fark: kiraciBirikim - alanServet,
        kazanan: alanServet > kiraciBirikim ? "satin-al" : "kirala",
        basabasYil: basabasYil,
        sonKira: kira,
        yillikIz: yillikIz
    };
}

// ---------- 41) ELEKTRİKLİ ARAÇ ŞARJ MALİYETİ ----------
// Elektrikli araçta "100 km kaç lira" hesabı benzinden farklı çalışır:
// ev şarjı ile hızlı şarj arasında 3-4 kat fark olabilir.

function sarjMaliyeti(g) {
    const km = g.aylikKm || 0;
    const tuketim = g.tuketim || 18;           // kWh / 100 km
    const evFiyat = g.evKwh || 0;              // TL / kWh
    const istasyonFiyat = g.istasyonKwh || 0;
    const evOran = Math.min(100, Math.max(0, g.evOran === undefined ? 80 : g.evOran)) / 100;
    const kayip = 1 + (g.sarjKaybi === undefined ? 10 : g.sarjKaybi) / 100;  // şarj verimi kaybı

    const kwhAylik = km * tuketim / 100 * kayip;
    const evKwh = kwhAylik * evOran;
    const istKwh = kwhAylik * (1 - evOran);
    const aylikTL = evKwh * evFiyat + istKwh * istasyonFiyat;

    // Benzinli karşılaştırma
    const bKm = g.benzinTuketim || 7;          // litre / 100 km
    const bFiyat = g.benzinFiyat || 0;         // TL / litre
    const benzinAylik = km * bKm / 100 * bFiyat;

    return {
        aylikKm: km, kwhAylik: kwhAylik,
        evKwh: evKwh, istKwh: istKwh,
        aylikTL: aylikTL, yillikTL: aylikTL * 12,
        kmBasina: km > 0 ? aylikTL / km : 0,
        yuzKmMaliyet: km > 0 ? aylikTL / km * 100 : 0,
        benzinAylik: benzinAylik, benzinYillik: benzinAylik * 12,
        benzinYuzKm: km > 0 ? benzinAylik / km * 100 : 0,
        tasarrufAylik: benzinAylik - aylikTL,
        tasarrufYillik: (benzinAylik - aylikTL) * 12,
        tasarrufYuzde: benzinAylik > 0 ? (benzinAylik - aylikTL) / benzinAylik * 100 : 0,
        // Sadece evde şarj edilse
        hepEvde: kwhAylik * evFiyat,
        hepIstasyon: kwhAylik * istasyonFiyat
    };
}

// ---------- 42) ARABA MASRAFI — TOPLAM SAHİP OLMA MALİYETİ ----------
// Çoğu insan "araba masrafı = yakıt" sanır. Genelde en büyük kalem
// DEĞER KAYBIDIR ve hiç hesaplanmaz: araç park hâlindeyken bile para yakar.

function arabaMasrafi(g) {
    const yil = Math.max(1, g.yil || 5);
    const ay = yil * 12;
    const yillikKm = g.yillikKm || 0;
    const toplamKm = yillikKm * yil;

    // Değer kaybı: her yıl kalan değerin belirli bir yüzdesi gider
    const alis = g.alisFiyat || 0;
    const kayipOran = (g.degerKaybi || 0) / 100;
    const sonDeger = alis * Math.pow(1 - kayipOran, yil);
    const degerKaybi = alis - sonDeger;

    // Yakıt
    const yakit = yillikKm * (g.tuketim || 0) / 100 * (g.yakitFiyat || 0) * yil;

    // Sabit yıllık kalemler
    const mtv = (g.mtv || 0) * yil;
    const sigorta = (g.sigorta || 0) * yil;
    const bakim = (g.bakim || 0) * yil;
    const otopark = (g.otopark || 0) * ay;

    // Lastik: kaç yılda bir değişiyor
    const lastikYil = Math.max(0.5, g.lastikYil || 4);
    const lastik = (g.lastikFiyat || 0) * Math.ceil(yil / lastikYil);

    // Muayene: 2 yılda bir
    const muayene = (g.muayene || 0) * Math.ceil(yil / 2);

    const kalemler = [
        { ad: "Değer kaybı", tutar: degerKaybi, tur: "gizli" },
        { ad: "Yakıt", tutar: yakit, tur: "kullanim" },
        { ad: "Sigorta ve kasko", tutar: sigorta, tur: "sabit" },
        { ad: "Bakım ve onarım", tutar: bakim, tur: "kullanim" },
        { ad: "Lastik", tutar: lastik, tur: "kullanim" },
        { ad: "MTV", tutar: mtv, tur: "sabit" },
        { ad: "Otopark / garaj", tutar: otopark, tur: "sabit" },
        { ad: "Muayene", tutar: muayene, tur: "sabit" }
    ].filter(k => k.tutar > 0).sort((a, b) => b.tutar - a.tutar);

    const toplam = kalemler.reduce((t, k) => t + k.tutar, 0);
    // Araç hiç kullanılmasa bile çıkan giderler
    const parkHalinde = degerKaybi + sigorta + mtv + otopark + muayene;

    return {
        yil: yil, toplamKm: toplamKm,
        alis: alis, sonDeger: sonDeger, degerKaybi: degerKaybi,
        kalemler: kalemler, toplam: toplam,
        aylik: toplam / ay, yillik: toplam / yil,
        kmBasina: toplamKm > 0 ? toplam / toplamKm : 0,
        yuzKm: toplamKm > 0 ? toplam / toplamKm * 100 : 0,
        yakit: yakit,
        yakitPay: toplam > 0 ? yakit / toplam * 100 : 0,
        degerKaybiPay: toplam > 0 ? degerKaybi / toplam * 100 : 0,
        parkHalinde: parkHalinde,
        parkHalindeAylik: parkHalinde / ay,
        enBuyuk: kalemler[0] || null
    };
}

// ---------- 43) LPG DÖNÜŞÜMÜ KAÇ AYDA AMORTİ EDER? ----------
// LPG'li araç litre başına daha fazla yakar (yaklaşık 1,15–1,25 kat)
// ama litre fiyatı çok daha düşüktür. Fark, dönüşüm masrafını karşılar.

function lpgAmortisman(g) {
    const aylikKm = g.aylikKm || 0;
    const benzinTuketim = g.benzinTuketim || 0;          // L/100 km
    const benzinFiyat = g.benzinFiyat || 0;
    const artis = 1 + (g.lpgArtis === undefined ? 20 : g.lpgArtis) / 100;  // LPG daha çok yakar
    const lpgTuketim = benzinTuketim * artis;
    const lpgFiyat = g.lpgFiyat || 0;

    const benzinAylik = aylikKm * benzinTuketim / 100 * benzinFiyat;
    const lpgAylik = aylikKm * lpgTuketim / 100 * lpgFiyat;
    // LPG'nin ek bakım yükü (buji, filtre, tüp muayenesi) aylığa bölünmüş
    const ekBakimAylik = (g.ekBakimYillik || 0) / 12;

    const netTasarrufAylik = benzinAylik - lpgAylik - ekBakimAylik;
    const maliyet = g.donusumMaliyet || 0;

    const ay = netTasarrufAylik > 0 ? maliyet / netTasarrufAylik : Infinity;
    const km = netTasarrufAylik > 0 ? ay * aylikKm : Infinity;

    return {
        aylikKm: aylikKm,
        lpgTuketim: lpgTuketim,
        benzinAylik: benzinAylik, lpgAylik: lpgAylik,
        ekBakimAylik: ekBakimAylik,
        netTasarrufAylik: netTasarrufAylik,
        netTasarrufYillik: netTasarrufAylik * 12,
        maliyet: maliyet,
        amortiAy: ay, amortiKm: km,
        amortiEdiyorMu: netTasarrufAylik > 0,
        // 5 yılda ne kazanır?
        besYilNet: netTasarrufAylik * 60 - maliyet,
        yuzKmBenzin: benzinTuketim * benzinFiyat,
        yuzKmLpg: lpgTuketim * lpgFiyat
    };
}
