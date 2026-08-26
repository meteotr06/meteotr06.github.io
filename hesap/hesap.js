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

    // Mevduat stopajı (vadeye göre değişir, varsayılan)
    mevduatStopaj: 0.15,

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
// DİKKAT — burada bir hata yapmıştık: noktayı KOŞULSUZ binlik ayracı sayıyorduk,
// bu yüzden "3.29" faiz oranı 329 olarak okunup taksit 60 kat yanlış çıkıyordu.
// Doğrusu: virgül varsa Türkçe biçimdir (nokta binlik), virgül yoksa nokta ONDALIKTIR.
function sayiOku(metin) {
    if (typeof metin === "number") return metin;
    if (metin === null || metin === undefined || metin === "") return 0;
    let s = String(metin).trim().replace(/\s/g, "");
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    const d = parseFloat(s);
    return isFinite(d) ? d : 0;
}

// ---------- 1) KREDİ TAKSİTİ ----------
// Annüite (eşit taksit) formülü: her ay aynı tutar ödenir.
// İhtiyaç kredisinde faizin üstüne KKDF (%15) ve BSMV (%5) biner.

function krediHesapla(tutar, aylikFaiz, taksitSayisi, vergiVar) {
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

function mevduatHesapla(anapara, yillikFaiz, vadeGun, stopajYuzde, bilesikMi, donemSayisi) {
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
