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

function tarihEkle(baslangic, gunSayisi) {
    const d = new Date(baslangic + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + gunSayisi);
    return d.toISOString().slice(0, 10);
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
    const satirlar = dersler.filter(d => d.kredi > 0).map(d => {
        toplamAgirlikli += d.not * d.kredi;
        toplamKredi += d.kredi;
        return { ad: d.ad, not: d.not, kredi: d.kredi, katki: d.not * d.kredi };
    });
    const ort = toplamKredi > 0 ? toplamAgirlikli / toplamKredi : 0;
    return {
        satirlar: satirlar, ortalama: ort,
        toplamKredi: toplamKredi, toplamAgirlikli: toplamAgirlikli,
        dortluk: ort / 25,          // yaklaşık dönüşüm
        dersSayisi: satirlar.length
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

function sayiListesiOku(metin) {
    // Virgül hem ayraç hem ondalık olabilir. Kural: virgülden sonra BOŞLUK
    // varsa ayraç ("1, 2, 3"), yoksa ondalık ("1,5 2,5").
    let s = String(metin || "").replace(/[;\t\r]/g, "\n").replace(/,\s+/g, "\n");
    return s.split(/[\n ]+/).map(x => x.trim()).filter(x => x !== "")
            .map(x => sayiOku(x)).filter(x => isFinite(x));
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

function dakikayaCevir(metin) {
    const s = String(metin || "").trim();
    if (s === "") return null;
    const p = s.split(":");
    if (p.length === 2) {
        const sa = parseInt(p[0], 10) || 0, dk = parseInt(p[1], 10) || 0;
        return sa * 60 + (s.charAt(0) === "-" ? -dk : dk);
    }
    return Math.round(sayiOku(s) * 60);   // "7,5" yazıldıysa saat kabul edilir
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
    const b = dakikayaCevir(baslangic), s = dakikayaCevir(bitis);
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
    let toplam = 0; const gecerli = [];
    satirlar.forEach(x => {
        const d = dakikayaCevir(x);
        if (d !== null && d !== 0) { toplam += d; gecerli.push(d); }
    });
    const c = dakikayiSaate(toplam);
    c.adet = gecerli.length; c.satirlar = gecerli;
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
    let oncesi = (calisilacakHafta === null || calisilacakHafta === undefined || calisilacakHafta === "")
        ? oncesiHak : Number(calisilacakHafta);
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
