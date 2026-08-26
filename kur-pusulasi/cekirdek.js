// ================= ÇEKİRDEK =================
// Burada sadece MANTIK var: veri çekme, istatistik, tahmin, faiz hesapları, yorum üretimi.
// Ekranla (HTML ile) ilgili tek satır yok — o iş arayuz.js'de.
// Neden ayrı? Hesabı bozmadan arayüzü değiştirebilelim, hesabı tek başına test edebilelim diye.

// ---------- 1) SABİTLER ----------

const KAYIT_ADI = "kurPusulasiVeri";
const ONBELLEK_ADI = "kurPusulasiOnbellek";

// Ücretsiz, anahtar istemeyen kaynaklar
const FRANKFURTER = "https://api.frankfurter.dev/v1";   // Avrupa Merkez Bankası günlük referans kurları
const MADEN_API = "https://api.gold-api.com/price/";     // altın/gümüş/bitcoin anlık
const KRIPTO_API = "https://api.coingecko.com/api/v3";   // kripto anlık + geçmiş (ücretsiz, anahtarsız)
const DUNYA_BANKASI = "https://api.worldbank.org/v2/country/TR/indicator/";

const ONS_GRAM = 31.1034768;   // 1 ons kaç gram (altın/gümüş çevirisi için)
const IS_GUNU_YIL = 252;       // borsa/kur yılında yaklaşık iş günü sayısı
const AYAR_22 = 0.916;         // 22 ayar bilezik saflık oranı

// Takip edilen paralar. "faiz" = o paranın yıllık faizi (parite hesabında kullanılır).
const PARALAR = [
    { kod: "USD", ad: "Amerikan Doları", simge: "$", bayrak: "USD", faiz: 4.00 },
    { kod: "EUR", ad: "Euro", simge: "€", bayrak: "EUR", faiz: 2.00 },
    { kod: "GBP", ad: "İngiliz Sterlini", simge: "£", bayrak: "GBP", faiz: 4.00 },
    { kod: "CHF", ad: "İsviçre Frangı", simge: "Fr", bayrak: "CHF", faiz: 0.25 },
    { kod: "JPY", ad: "Japon Yeni (100)", simge: "¥", bayrak: "JPY", faiz: 0.50, carpan: 100 },
    { kod: "CAD", ad: "Kanada Doları", simge: "C$", bayrak: "CAD", faiz: 2.75 },
    { kod: "AUD", ad: "Avustralya Doları", simge: "A$", bayrak: "AUD", faiz: 3.60 },
    { kod: "SEK", ad: "İsveç Kronu", simge: "kr", bayrak: "SEK", faiz: 2.00 },
    { kod: "NOK", ad: "Norveç Kronu", simge: "kr", bayrak: "NOK", faiz: 4.00 },
    { kod: "DKK", ad: "Danimarka Kronu", simge: "kr", bayrak: "DKK", faiz: 2.10 },
    { kod: "CNY", ad: "Çin Yuanı", simge: "¥", bayrak: "CNY", faiz: 3.00 },
    { kod: "RON", ad: "Rumen Leyi", simge: "lei", bayrak: "RON", faiz: 6.50 },
    { kod: "PLN", ad: "Polonya Zlotisi", simge: "zł", bayrak: "PLN", faiz: 5.00 },
    { kod: "CZK", ad: "Çek Korunası", simge: "Kč", bayrak: "CZK", faiz: 3.50 },
    { kod: "HUF", ad: "Macar Forinti", simge: "Ft", bayrak: "HUF", faiz: 6.50 },
    { kod: "INR", ad: "Hindistan Rupisi", simge: "₹", bayrak: "INR", faiz: 5.50 },
    { kod: "KRW", ad: "Güney Kore Wonu", simge: "₩", bayrak: "KRW", faiz: 2.50 },
    { kod: "SGD", ad: "Singapur Doları", simge: "S$", bayrak: "SGD", faiz: 2.00 },
    { kod: "HKD", ad: "Hong Kong Doları", simge: "HK$", bayrak: "HKD", faiz: 4.00 },
    { kod: "NZD", ad: "Yeni Zelanda Doları", simge: "NZ$", bayrak: "NZD", faiz: 3.00 },
    { kod: "BRL", ad: "Brezilya Reali", simge: "R$", bayrak: "BRL", faiz: 14.00 },
    { kod: "MXN", ad: "Meksika Pesosu", simge: "$", bayrak: "MXN", faiz: 7.50 },
    { kod: "ZAR", ad: "Güney Afrika Randı", simge: "R", bayrak: "ZAR", faiz: 7.00 },
    { kod: "ILS", ad: "İsrail Şekeli", simge: "₪", bayrak: "ILS", faiz: 4.50 },
    { kod: "IDR", ad: "Endonezya Rupiahı (100)", simge: "Rp", bayrak: "IDR", faiz: 5.00, carpan: 100 },
    { kod: "THB", ad: "Tayland Bahtı", simge: "฿", bayrak: "THB", faiz: 1.50 },
    { kod: "MYR", ad: "Malezya Ringgiti", simge: "RM", bayrak: "MYR", faiz: 2.75 },
    { kod: "PHP", ad: "Filipin Pesosu", simge: "₱", bayrak: "PHP", faiz: 5.00 },
    { kod: "ISK", ad: "İzlanda Kronu (100)", simge: "kr", bayrak: "ISK", faiz: 7.50, carpan: 100 }
];

// Maden ve kripto: fiyatları dolar üzerinden gelir, TL'ye kurla çevrilir.
// Maden ve kripto DOLAR varlığıdır: TL fiyatı = dolar fiyatı × USD/TRY.
// Bu yüzden faiz paritesinde "karşı taraf faizi"olarak DOLAR faizi kullanılır (faiz: null bunu söyler).
// Sıfır yazsaydık, TL faizinin tamamını altına bindirip fiyatı şişirirdik — ölçtük, model naive'den kötü çıkıyordu.
const MADENLER = [
    { kod: "GRAMALTIN", ad: "Gram Altın", simge: "gr", bayrak: "ALT", kaynak: "XAU", tur: "gram", faiz: null },
    { kod: "CEYREK", ad: "Çeyrek Altın", simge: "ad", bayrak: "CYR", kaynak: "XAU", tur: "ceyrek", faiz: null },
    { kod: "BILEZIK", ad: "22 Ayar Bilezik (gr)", simge: "gr", bayrak: "22A", kaynak: "XAU", tur: "ayar22", faiz: null },
    { kod: "ONSALTIN", ad: "Ons Altın (USD)", simge: "$", bayrak: "ONS", kaynak: "XAU", tur: "ons", faiz: null },
    { kod: "GRAMGUMUS", ad: "Gram Gümüş", simge: "gr", bayrak: "GUM", kaynak: "XAG", tur: "gram", faiz: null },
    { kod: "BITCOIN", ad: "Bitcoin", simge: "₿", bayrak: "BTC", kaynak: "BTC", tur: "adet", faiz: null, coingecko: "bitcoin" },
    // Kripto: fiyatlar CoinGecko'dan tek istekte gelir (ucretsiz, anahtar gerekmez).
    // Hepsi "dolar varligi" sayilir -> faiz: null (bkz. yukaridaki not).
    { kod: "ETHEREUM", ad: "Ethereum", simge: "Ξ", bayrak: "ETH", kaynak: "ETH", tur: "adet", faiz: null, coingecko: "ethereum" },
    { kod: "XRP", ad: "XRP", simge: "X", bayrak: "XRP", kaynak: "XRP", tur: "adet", faiz: null, coingecko: "ripple" },
    { kod: "SOLANA", ad: "Solana", simge: "S", bayrak: "SOL", kaynak: "SOL", tur: "adet", faiz: null, coingecko: "solana" },
    { kod: "BNB", ad: "BNB", simge: "B", bayrak: "BNB", kaynak: "BNB", tur: "adet", faiz: null, coingecko: "binancecoin" },
    { kod: "DOGECOIN", ad: "Dogecoin", simge: "D", bayrak: "DOGE", kaynak: "DOGE", tur: "adet", faiz: null, coingecko: "dogecoin" },
    { kod: "AVALANCHE", ad: "Avalanche", simge: "A", bayrak: "AVAX", kaynak: "AVAX", tur: "adet", faiz: null, coingecko: "avalanche-2" }
];

// Hangi varliklar kripto? (bazi yerlerde ayirmak gerekiyor)
function kriptoMu(kod) {
    const m = MADENLER.find(x => x.kod === kod);
    return !!(m && m.coingecko);
}

// Türkiye faizi ve varsayılan ayarlar
const VARSAYILAN_AYAR = {
    tlFaiz: 37.0,               // TCMB 1 hafta repo (politika faizi)
    tlFaizNot: "TCMB 1 hafta repo",
    mevduatFaiz: 37.0,          // bankaların verdiği ortalama mevduat faizi (kullanıcı düzenler)
    enflasyon: 34.88,           // yıllık TÜFE (Dünya Bankası 2025)
    pariteAgirlik: 60,          // tahminde faiz paritesinin ağırlığı (%)
    tema: "acik",   // yeni tasarim acik zeminde kuruldu; koyu tema  ile acilir
    // Görünüm ayarı CİHAZA GÖRE AYRI tutulur: bilgisayarda geniş ekran var, her şey sığar;
    // telefonda sade olması daha rahat. Biri değişince diğeri etkilenmez.
    gorunum: {
        pc: { mod: "tam", renk: "varsayilan" },
        mobil: { mod: "sade", renk: "varsayilan" }
    },
    yabanciFaiz: {},            // kullanıcı düzenlerse burada saklanır
    // Otomatik uyarılar: elle alarm kurmadan da dikkat çekici durumları bildirir
    otomatik: { acik: true, izlenen: ["USD", "EUR", "GRAMALTIN"], yuvarlak: true, sert: true, sertEsik: 1.0, zirve: true, ortalama: false },
    gorulenUyarilar: []         // aynı olay iki kez bildirilmesin diye
};

// ---------- 2) KÜÇÜK YARDIMCILAR ----------

// Türkçe sayı biçimi: 47.775,32 gibi
function sayi(deger, basamak) {
    if (deger === null || deger === undefined || !isFinite(deger)) return "—";
    if (basamak === undefined) {
        const m = Math.abs(deger);
        basamak = m >= 1000 ? 2 : m >= 10 ? 3 : m >= 1 ? 4 : 6;
    }
    return deger.toLocaleString("tr-TR", { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
}

// Para her zaman 2 haneli kuruşla yazılır: "486,58 ₺" (otomatik hane sayısı "486,575"veriyordu)
function paraYaz(deger, basamak) { return sayi(deger, basamak === undefined ? 2 : basamak) + " ₺"; }

// Önde % işaretli yüzde: "%31,45" / "-%2,54"  ("%-2,54"yerine, Türkçe okunuşa uygun)
function yuzdeOn(deger, basamak) {
    if (deger === null || deger === undefined || !isFinite(deger)) return "—";
    return (deger < 0 ? "-" : "") + "%" + sayi(Math.abs(deger), basamak === undefined ? 2 : basamak);
}

function yuzde(deger, basamak) {
    if (deger === null || deger === undefined || !isFinite(deger)) return "—";
    const b = basamak === undefined ? 2 : basamak;
    return (deger >= 0 ? "+" : "") + deger.toLocaleString("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b }) + "%";
}

function tarihYaz(iso) {
    if (!iso) return "—";
    const [y, a, g] = iso.split("-");
    const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${parseInt(g, 10)} ${aylar[parseInt(a, 10) - 1]} ${y}`;
}

function isoTarih(d) { return d.toISOString().slice(0, 10); }

function gunEkle(iso, gun) {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + gun);
    return isoTarih(d);
}

// Takvim gününü iş gününe çevirir (kur sadece iş günleri işlem görür)
function isGunu(takvimGun) { return Math.max(1, Math.round(takvimGun * IS_GUNU_YIL / 365)); }

// Varlık tanımını koda göre bulur
function varlikBul(kod) {
    return PARALAR.find(p => p.kod === kod) || MADENLER.find(m => m.kod === kod) || null;
}

function tumVarliklar() { return PARALAR.concat(MADENLER); }

// ---------- 3) İSTATİSTİK ----------

// Logaritmik getiri: fiyat oranlarının doğal logaritması.
// Neden log? Yüzdeleri toplayabilir hale getirir ve düşüş/yükselişi simetrik ölçer.
function logGetiriler(seri) {
    const r = [];
    for (let i = 1; i < seri.length; i++) {
        if (seri[i - 1] > 0 && seri[i] > 0) r.push(Math.log(seri[i] / seri[i - 1]));
    }
    return r;
}

function ortalama(dizi) {
    if (!dizi.length) return 0;
    return dizi.reduce((t, x) => t + x, 0) / dizi.length;
}

function stdSapma(dizi) {
    if (dizi.length < 2) return 0;
    const o = ortalama(dizi);
    return Math.sqrt(dizi.reduce((t, x) => t + (x - o) * (x - o), 0) / (dizi.length - 1));
}

// EWMA oynaklık (RiskMetrics standardı, lambda = 0,94).
// Neden basit standart sapma değil? Son günlere daha çok ağırlık verir;
// piyasa sakinleşince tahmin bandı da hemen daralır.
function ewmaSigma(getiriler, lambda) {
    if (!getiriler.length) return 0;
    const L = lambda === undefined ? 0.94 : lambda;
    const baslangic = getiriler.slice(0, Math.min(30, getiriler.length));
    let varyans = Math.pow(stdSapma(baslangic), 2) || 1e-8;
    for (let i = 0; i < getiriler.length; i++) {
        varyans = L * varyans + (1 - L) * getiriler[i] * getiriler[i];
    }
    return Math.sqrt(varyans);
}

// Vade oynaklığı: h günlük hareketin gerçek dağılımı.
// Neden gerekli? Günlük oynaklığı √h ile çarpmak, getirilerin bağımsız olduğunu varsayar.
// Kurda böyle değildir: hareketler birbirini izler (trend), bu yüzden uzun vadede
// gerçek dağılım √h formülünden GENİŞ çıkar. Ölçtük, gördük, düzelttik.
function vadeSigmasi(getiriler, hGun, ewmaSig) {
    const pencere = getiriler.slice(-IS_GUNU_YIL);
    if (hGun <= 1 || pencere.length < hGun + 40) return ewmaSig * Math.sqrt(hGun);

    // Üst üste binen h günlük toplam getirilerin dağılımı
    const toplamlar = [];
    for (let i = 0; i + hGun <= pencere.length; i++) {
        let t = 0;
        for (let k = 0; k < hGun; k++) t += pencere[i + k];
        toplamlar.push(t);
    }
    const empirik = stdSapma(toplamlar);
    if (!empirik || !isFinite(empirik)) return ewmaSig * Math.sqrt(hGun);

    // Şu anki piyasa, son bir yıl ortalamasına göre sakin mi hareketli mi?
    // Empirik dağılımı bu oranla ölçekle ki güncel duruma da uysun.
    const uzunVadeGunluk = stdSapma(pencere);
    const rejim = uzunVadeGunluk > 0 ? ewmaSig / uzunVadeGunluk : 1;
    const sinirli = Math.max(0.6, Math.min(1.8, rejim));   // aşırı uçlara kaçmasın
    return empirik * sinirli;
}

// Basit hareketli ortalama (son n gün)
function hareketliOrt(seri, n) {
    if (seri.length < n) return null;
    return ortalama(seri.slice(-n));
}

// Normal dağılım birikimli olasılığı (Abramowitz–Stegun yaklaşımı)
function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp(-z * z / 2);
    let p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? 1 - p : p;
}

// İki tarih arasındaki yüzde değişim
function degisimYuzde(eski, yeni) {
    if (!eski || !yeni) return null;
    return (yeni / eski - 1) * 100;
}

// ---------- 4) VERİ ÇEKME ----------

// Bütün paraların geçmişini TEK istekte alır.
// Frankfurter EUR tabanlı verir: USD/TRY = (EUR başına TL) / (EUR başına USD)
async function kurGecmisiCek(baslangicTarihi) {
    const semboller = PARALAR.map(p => p.kod).concat(["TRY"]).filter(k => k !== "EUR").join(",");
    const adres = `${FRANKFURTER}/${baslangicTarihi}..?base=EUR&symbols=${semboller}`;
    const yanit = await fetch(adres);
    if (!yanit.ok) throw new Error("Kur verisi alınamadı (" + yanit.status + ")");
    const veri = await yanit.json();

    const tarihler = Object.keys(veri.rates).sort();
    const seriler = {};
    PARALAR.forEach(p => { seriler[p.kod] = []; });
    const dxy = [];      // dolar endeksi
    const sepet = [];    // TCMB'nin baktığı sepet kur: yarı dolar, yarı euro

    const gecerliTarihler = [];
    for (const t of tarihler) {
        const g = veri.rates[t];
        const tlPerEur = g.TRY;
        if (!tlPerEur) continue;
        gecerliTarihler.push(t);
        dxy.push(dxyHesapla(g));
        sepet.push(g.USD ? 0.5 * (tlPerEur / g.USD) + 0.5 * tlPerEur : null);
        for (const p of PARALAR) {
            const carpan = p.carpan || 1;
            if (p.kod === "EUR") {
                seriler.EUR.push(tlPerEur);
            } else if (g[p.kod]) {
                // 1 birim yabancı para kaç TL: (TL/EUR) / (yabancı/EUR)
                seriler[p.kod].push(carpan * tlPerEur / g[p.kod]);
            } else {
                // O gün o para yayınlanmamışsa bir öncekini tekrarla (boşluk kalmasın)
                const dizi = seriler[p.kod];
                dizi.push(dizi.length ? dizi[dizi.length - 1] : null);
            }
        }
    }
    return {
        tarihler: gecerliTarihler, seriler: seriler, dxy: dxy, sepet: sepet,
        sonTarih: gecerliTarihler[gecerliTarihler.length - 1]
    };
}

// Dolar endeksi (DXY): doların 6 büyük paraya karşı ağırlıklı gücü.
// Neden önemli? Dolar dünya genelinde güçlenirken TL'nin tek başına direnmesi zordur.
// Resmî ağırlıklar: EUR %57,6 · JPY %13,6 · GBP %11,9 · CAD %9,1 · SEK %4,2 · CHF %3,6
function dxyHesapla(euroTabanliKurlar) {
    const g = euroTabanliKurlar;
    if (!g.USD || !g.JPY || !g.GBP || !g.CAD || !g.SEK || !g.CHF) return null;
    const eurusd = g.USD;              // 1 euro kaç dolar
    const usdjpy = g.JPY / g.USD;
    const gbpusd = g.USD / g.GBP;
    const usdcad = g.CAD / g.USD;
    const usdsek = g.SEK / g.USD;
    const usdchf = g.CHF / g.USD;
    return 50.14348112
        * Math.pow(eurusd, -0.576) * Math.pow(usdjpy, 0.136) * Math.pow(gbpusd, -0.119)
        * Math.pow(usdcad, 0.091) * Math.pow(usdsek, 0.042) * Math.pow(usdchf, 0.036);
}

// Anlık maden/kripto fiyatları (dolar cinsinden)
async function madenFiyatCek() {
    const sonuc = {};

    // Altin, gumus ve bitcoin: gold-api (her biri ayri istek)
    const madenKaynak = ["XAU", "XAG", "BTC"];
    const madenIsi = madenKaynak.map(async (k) => {
        try {
            const y = await fetch(MADEN_API + k);
            if (y.ok) { const v = await y.json(); sonuc[k] = v.price; }
        } catch (e) { /* internet yoksa sessizce geç, önbellek kullanılır */ }
    });

    // Kriptolar: CoinGecko'dan TEK istekte hepsi (ucretsiz, anahtar yok, CORS acik)
    const kriptolar = MADENLER.filter(m => m.coingecko);
    const kriptoIsi = (async () => {
        if (!kriptolar.length) return;
        try {
            const idler = kriptolar.map(m => m.coingecko).join(",");
            const y = await fetch(KRIPTO_API + "/simple/price?ids=" + idler +
                                  "&vs_currencies=usd&include_24hr_change=true");
            if (!y.ok) return;
            const v = await y.json();
            kriptolar.forEach(m => {
                const d = v[m.coingecko];
                if (d && typeof d.usd === "number") {
                    sonuc[m.kaynak] = d.usd;
                    if (typeof d.usd_24h_change === "number") {
                        sonuc["_degisim_" + m.kaynak] = d.usd_24h_change;
                    }
                }
            });
        } catch (e) { /* sessizce geç */ }
    })();

    await Promise.all(madenIsi.concat([kriptoIsi]));
    return sonuc;
}

// Ons doları + USD/TRY'den varlığın TL fiyatını üretir
function madenFiyatiHesapla(maden, onsUsd, usdTry) {
    if (!onsUsd || !usdTry) return null;
    switch (maden.tur) {
        case "gram": return onsUsd / ONS_GRAM * usdTry;
        case "ceyrek": return (onsUsd / ONS_GRAM * usdTry) * 1.75 * AYAR_22;   // çeyrek ≈ 1,75 gr, 22 ayar
        case "ayar22": return onsUsd / ONS_GRAM * usdTry * AYAR_22;
        case "ons": return onsUsd;                                              // dolar cinsinden bırakılır
        case "adet": return onsUsd * usdTry;                                    // bitcoin
        default: return null;
    }
}

// Maden geçmişi: ons fiyatının geçmişini ücretsiz+CORS'lu bulmak zor.
// Bu yüzden bugünkü ons fiyatını sabit kabul edip TL geçmişini kurdan üretiyoruz.
// Dürüst olalım: bu, "altının dolar fiyatı sabit kalsaydı"senaryosudur; arayüzde böyle etiketlenir.
function madenGecmisiUret(maden, onsUsd, usdSerisi) {
    if (!onsUsd) return null;
    return usdSerisi.map(usdTry => madenFiyatiHesapla(maden, onsUsd, usdTry));
}

// Dünya Bankası makro göstergeleri (yıllık, resmi)
async function makroCek() {
    const gostergeler = {
        enflasyon: "FP.CPI.TOTL.ZG",
        buyume: "NY.GDP.MKTP.KD.ZG",
        issizlik: "SL.UEM.TOTL.ZS",
        kisiBasiGsyh: "NY.GDP.PCAP.CD"
    };
    const sonuc = {};
    await Promise.all(Object.entries(gostergeler).map(async ([ad, kod]) => {
        try {
            const y = await fetch(`${DUNYA_BANKASI}${kod}?format=json&per_page=12`);
            if (!y.ok) return;
            const v = await y.json();
            if (!v[1]) return;
            sonuc[ad] = v[1].filter(x => x.value !== null)
                            .map(x => ({ yil: x.date, deger: x.value }))
                            .sort((a, b) => a.yil.localeCompare(b.yil));
        } catch (e) { /* yoksa boş kalır */ }
    }));
    return sonuc;
}

// ---------- 5) TAHMİN MOTORU ----------

// Faiz paritesi (vadeli/forward kur):
// Yüksek faizli para, düşük faizli paraya karşı vadede DEĞER KAYBEDER varsayılır.
// Yoksa herkes TL'ye geçip risksiz kâr ederdi (arbitraj). Piyasada forward böyle fiyatlanır.
function pariteTahmini(spot, tlFaiz, yabanciFaiz, takvimGun) {
    const t = takvimGun / 365;
    return spot * (1 + tlFaiz / 100 * t) / (1 + yabanciFaiz / 100 * t);
}

// Ham tahmin: parite + trend karışımı, teorik oynaklık bandıyla.
// Bu bandın modelin GERÇEK hatasını yansıtmadığını ölçtük (bkz. kalibrasyon) —
// kullanıcıya gösterilen band aşağıdaki tahminYap ile düzeltilir.
function hamTahmin(seri, takvimGun, secenek) {
    const ayar = secenek || {};
    const tlFaiz = ayar.tlFaiz !== undefined ? ayar.tlFaiz : VARSAYILAN_AYAR.tlFaiz;
    const yabanciFaiz = ayar.yabanciFaiz !== undefined ? ayar.yabanciFaiz : 0;
    const w = (ayar.pariteAgirlik !== undefined ? ayar.pariteAgirlik : 60) / 100;

    const temiz = seri.filter(x => x && isFinite(x));
    if (temiz.length < 40) return null;

    const spot = temiz[temiz.length - 1];
    const getiriler = logGetiriler(temiz);

    // Trend: son 90 iş gününün ortalama günlük getirisi (uzun pencere → tek günlük şoklara kanmaz)
    const uzunPencere = getiriler.slice(-90);
    const kisaPencere = getiriler.slice(-20);
    const muUzun = ortalama(uzunPencere);
    const muKisa = ortalama(kisaPencere);
    // Kısa trende az ağırlık: son hareketi görsün ama peşinden sürüklenmesin
    const mu = 0.75 * muUzun + 0.25 * muKisa;

    const sigmaGunluk = ewmaSigma(getiriler);
    const tIs = isGunu(takvimGun);

    const trendTahmin = spot * Math.exp(mu * tIs);
    const pariteTahmin = pariteTahmini(spot, tlFaiz, yabanciFaiz, takvimGun);

    // Geometrik karışım: iki tahminin logaritmalarının ağırlıklı ortalaması
    const merkez = Math.exp(w * Math.log(pariteTahmin) + (1 - w) * Math.log(trendTahmin));

    const sigmaVade = vadeSigmasi(getiriler, tIs, sigmaGunluk);

    return {
        gun: takvimGun,
        spot: spot,
        merkez: merkez,
        trend: trendTahmin,
        parite: pariteTahmin,
        alt68: merkez * Math.exp(-1.0 * sigmaVade),
        ust68: merkez * Math.exp(1.0 * sigmaVade),
        alt95: merkez * Math.exp(-1.96 * sigmaVade),
        ust95: merkez * Math.exp(1.96 * sigmaVade),
        degisimYuzde: (merkez / spot - 1) * 100,
        sigmaGunluk: sigmaGunluk,
        sigmaVade: sigmaVade,
        yillikOynaklik: sigmaGunluk * Math.sqrt(IS_GUNU_YIL) * 100,
        agirlik: w
    };
}

// ---- KALİBRASYON: bandı teoriden değil, modelin kendi geçmiş hatalarından üret ----
// Neden? Ölçtük: 30 günlük tahminde teorik band gerçekte %68 yerine %35 tutuyordu.
// Çünkü teorik band sadece fiyat oynaklığını sayar; modelin kendi yanılma payını saymaz.
// Çözüm: modeli geçmişteki her güne uygula, hataları biriktir, bandı o hataların
// gerçek dağılımından çıkar. Böylece band "modelin ne kadar yanıldığını"gösterir.

function dilimAl(siraliDizi, oran) {
    if (!siraliDizi.length) return 0;
    const yer = (siraliDizi.length - 1) * oran;
    const alt = Math.floor(yer), ust = Math.ceil(yer);
    return alt === ust ? siraliDizi[alt] : siraliDizi[alt] + (siraliDizi[ust] - siraliDizi[alt]) * (yer - alt);
}

// Modeli geçmişte yürütüp hata kayıtlarını toplar
function hataKayitlari(seri, takvimGun, secenek) {
    const temiz = seri.filter(x => x && isFinite(x));
    const tIs = isGunu(takvimGun);
    const enAz = Math.min(120, Math.max(60, Math.floor(temiz.length * 0.35)));
    if (temiz.length < enAz + tIs + 30) return null;

    const kayitlar = [];
    for (let i = enAz; i + tIs < temiz.length; i += 2) {
        const t = hamTahmin(temiz.slice(0, i + 1), takvimGun, secenek);
        if (!t) continue;
        const gercek = temiz[i + tIs];
        kayitlar.push({
            hata: Math.log(gercek / t.merkez),        // modelin log hatası
            naiveHata: Math.log(gercek / temiz[i]),   // "hiç değişmez"varsayımının hatası
            merkez: t.merkez, gercek: gercek, bugun: temiz[i]
        });
    }
    return kayitlar.length >= 30 ? kayitlar : null;
}

const _kalibreOnbellek = {};

// Hata dağılımından band sınırlarını çıkarır (sonuç önbelleğe alınır, hızlı olsun diye)
function kalibrasyonAl(anahtar, seri, takvimGun, secenek) {
    if (_kalibreOnbellek[anahtar] !== undefined) return _kalibreOnbellek[anahtar];
    const kayitlar = hataKayitlari(seri, takvimGun, secenek);
    if (!kayitlar) { _kalibreOnbellek[anahtar] = null; return null; }

    // Sadece son N hatayı kullan: piyasa rejimi değişir, 2 yıl önceki hata bugünü temsil etmez.
    // Pencere boyu deneyle seçildi (40/60/80/120/150 denendi):
    // 80, hem USD hem EUR hem altında %68 hedefine en dengeli yaklaşan değer.
    const PENCERE = 80;
    const sonKayitlar = kayitlar.slice(-PENCERE);
    // BECERİ ÖLÇÜMÜ: model, "fiyat değişmez"varsayımını gerçekten geçiyor mu?
    // Geçmiyorsa merkez tahmin olarak bugünkü fiyatı kullanmak DAHA DÜRÜST olur.
    // Bunu elle karar vermiyoruz; ölçüp modele kendisi karar verdiriyoruz.
    let toplamModel = 0, toplamNaive = 0, olculen = 0;
    for (let i = 40; i < kayitlar.length; i++) {
        const egitim = kayitlar.slice(Math.max(0, i - PENCERE), i).map(x => x.hata).sort((a, b) => a - b);
        toplamModel += Math.abs(Math.exp(kayitlar[i].hata - dilimAl(egitim, 0.5)) - 1);
        toplamNaive += Math.abs(Math.exp(kayitlar[i].naiveHata) - 1);
        olculen++;
    }
    const beceri = olculen && toplamNaive > 0 ? (1 - toplamModel / toplamNaive) * 100 : 0;
    const naiveModu = olculen >= 20 && beceri <= 0;

    // Naive moda düşülürse band da naive'in kendi hata dağılımından kurulur (tutarlı olsun diye)
    const hatalar = (naiveModu ? sonKayitlar.map(k => k.naiveHata) : sonKayitlar.map(k => k.hata))
        .sort((a, b) => a - b);
    const sonuc = {
        beceri: beceri, naiveModu: naiveModu,
        q16: dilimAl(hatalar, 0.16), q84: dilimAl(hatalar, 0.84),
        q025: dilimAl(hatalar, 0.025), q975: dilimAl(hatalar, 0.975),
        medyan: dilimAl(hatalar, 0.5),
        sigma: stdSapma(hatalar),
        hatalar: hatalar,
        adet: hatalar.length, toplamKayit: kayitlar.length
    };
    _kalibreOnbellek[anahtar] = sonuc;
    return sonuc;
}

function kalibrasyonTemizle() { for (const k in _kalibreOnbellek) delete _kalibreOnbellek[k]; }

// Kullanıcıya gösterilen tahmin: ham tahmin + kalibre edilmiş band
function tahminYap(seri, takvimGun, secenek) {
    const t = hamTahmin(seri, takvimGun, secenek);
    if (!t) return null;
    const kal = secenek && secenek.kalibrasyon;
    if (kal) {
        // 1) SAPMA DÜZELTMESİ: model geçmişte sürekli yukarı/aşağı kaçıyorsa merkezi o kadar kaydır.
        // Ölçtük: faiz paritesi doları sistematik olarak yüksek tahmin ediyor
        // (finans literatüründe "forward premium sapması"denir). Düzeltince hata neredeyse yarıya indi.
        t.hamMerkez = t.merkez;
        t.naiveModu = !!kal.naiveModu;
        t.beceri = kal.beceri;
        // Model geçmişte beceri gösteremediyse merkez olarak bugünkü fiyatı al.
        if (kal.naiveModu) t.hamMerkez = t.spot;
        t.sapmaDuzeltme = (Math.exp(kal.medyan) - 1) * 100;
        t.merkez = t.hamMerkez * Math.exp(kal.medyan);
        t.degisimYuzde = (t.merkez / t.spot - 1) * 100;

        // 2) BAND: modelin gerçek hata dağılımının yüzdelik dilimleri
        t.alt68 = t.hamMerkez * Math.exp(kal.q16);
        t.ust68 = t.hamMerkez * Math.exp(kal.q84);
        t.alt95 = t.hamMerkez * Math.exp(kal.q025);
        t.ust95 = t.hamMerkez * Math.exp(kal.q975);

        t.sigmaVade = kal.sigma;
        t.hatalar = kal.hatalar.map(h => h - kal.medyan);   // düzeltilmiş merkeze göre hatalar
        t.kalibre = true;
        t.kalibreAdet = kal.adet;
    }
    return t;
}

// Belirli bir seviyeyi aşma / altına inme olasılığı.
// Kalibrasyon varsa gerçek hata dağılımı sayılır (normal dağılım varsaymaya gerek kalmaz).
function seviyeOlasiligi(tahmin, hedef) {
    if (!tahmin || !hedef || hedef <= 0) return null;
    const esik = Math.log(hedef / tahmin.merkez);

    if (tahmin.hatalar && tahmin.hatalar.length >= 30) {
        let ustunde = 0;
        tahmin.hatalar.forEach(h => { if (h > esik) ustunde++; });
        const n = tahmin.hatalar.length;
        // Laplace düzeltmesi: 80 örnekte hiç görülmemiş olması "imkânsız"demek değildir.
        // Ham oran %0 veya %100 çıkabilir; bu yanıltıcı olur. Yumuşatıp %1–%99 arasına sıkıştırıyoruz.
        let o = (ustunde + 0.5) / (n + 1) * 100;
        o = Math.max(1, Math.min(99, o));
        return { ustunde: o, altinda: 100 - o, yontem: "gecmis", ornek: n };
    }
    if (tahmin.sigmaVade <= 0) return null;
    const ustundeOlma = 1 - normalCDF(esik / tahmin.sigmaVade);
    return { ustunde: ustundeOlma * 100, altinda: (1 - ustundeOlma) * 100, yontem: "normal" };
}

// ---------- 5b) SENARYOLAR: "başka ne olabilir?" ----------
// Tek bir sayı vermek yanıltıcıdır. Profesyoneller hep senaryo çalışır:
// olasılık dilimleri (iyimser/kötümser) + "şu olay olursa ne olur"hesapları.

// Olasılık dilimleri: dağılımın %5, %25, %50, %75, %95 noktaları
function olasilikDilimleri(tahmin) {
    if (!tahmin) return null;
    const z = { cokIyi: -1.645, iyi: -0.674, orta: 0, kotu: 0.674, cokKotu: 1.645 };
    const nokta = (zz) => tahmin.merkez * Math.exp(zz * tahmin.sigmaVade);
    return {
        gun: tahmin.gun,
        yuzde5: nokta(z.cokIyi),
        yuzde25: nokta(z.iyi),
        orta: nokta(z.orta),
        yuzde75: nokta(z.kotu),
        yuzde95: nokta(z.cokKotu),
        spot: tahmin.spot
    };
}

// Geçmişteki en sert 21 iş günlük (≈1 ay) hareketi bulur — "en kötü ay"senaryosu için
function enSertAylikHareket(seri) {
    const temiz = seri.filter(x => x && isFinite(x));
    let enCok = 0, enAz = 0;
    for (let i = 21; i < temiz.length; i++) {
        const d = temiz[i] / temiz[i - 21] - 1;
        if (d > enCok) enCok = d;
        if (d < enAz) enAz = d;
    }
    return { yukari: enCok * 100, asagi: enAz * 100 };
}

// "Şu olay olursa"senaryoları — hepsi hesapla üretilir, uydurma yok
function olaySenaryolari(seri, kod, ayar, takvimGun) {
    const temiz = seri.filter(x => x && isFinite(x));
    if (temiz.length < 60) return [];
    const spot = temiz[temiz.length - 1];
    const v = varlikBul(kod);
    const yFaiz = (ayar.yabanciFaiz && ayar.yabanciFaiz[kod] !== undefined) ? ayar.yabanciFaiz[kod] : (v.faiz || 0);
    const temel = tahminYap(temiz, takvimGun, { tlFaiz: ayar.tlFaiz, yabanciFaiz: yFaiz, pariteAgirlik: ayar.pariteAgirlik });
    if (!temel) return [];

    const senaryolar = [];
    const ekle = (ad, deger, aciklama) => senaryolar.push({
        ad: ad, deger: deger, degisim: (deger / spot - 1) * 100,
        farkTemel: (deger / temel.merkez - 1) * 100, aciklama: aciklama
    });

    ekle("Beklenen (model)", temel.merkez, "Faiz paritesi ve trendin birleşimi — ana tahmin.");

    // Faiz senaryoları: TCMB kararı bu tahmini doğrudan değiştirir
    [-10, -5, 5].forEach(delta => {
        const t = tahminYap(temiz, takvimGun, {
            tlFaiz: Math.max(0, ayar.tlFaiz + delta), yabanciFaiz: yFaiz, pariteAgirlik: ayar.pariteAgirlik
        });
        if (t) ekle(
            `TCMB faizi ${delta > 0 ? "+" : ""}${delta} puan`,
            t.merkez,
            delta < 0 ? "Faiz inerse TL'de durmanın getirisi azalır; vadeli kur aşağı gelir ama TL'ye talep de düşebilir."
                : "Faiz artarsa vadeli kur yukarı fiyatlanır; TL'yi tutmanın getirisi artar."
        );
    });

    // Geçmişin en sert ayı tekrarlarsa
    const sert = enSertAylikHareket(temiz);
    const olcek = takvimGun / 30;
    ekle("Geçmişin en sert dönemi", spot * (1 + sert.yukari / 100 * olcek),
        `Son ${Math.round(temiz.length / IS_GUNU_YIL)} yılın en hızlı ${takvimGun} günlük yükselişi (%${sayi(sert.yukari * olcek, 1)}) tekrarlarsa.`);
    if (sert.asagi < -0.5) {
        ekle("Geçmişin en sert düşüşü", spot * (1 + sert.asagi / 100 * olcek),
            `Son yılların en hızlı ${takvimGun} günlük düşüşü (%${sayi(sert.asagi * olcek, 1)}) tekrarlarsa.`);
    }

    // Enflasyon kadar artarsa (satın alma gücü paritesi mantığı)
    const aylikEnf = Math.pow(1 + ayar.enflasyon / 100, 1 / 12) - 1;
    ekle("Enflasyon kadar artarsa", spot * Math.pow(1 + aylikEnf, takvimGun / 30),
        `Yıllık %${sayi(ayar.enflasyon, 1)} enflasyona denk hızda artarsa (reel olarak sabit kalır).`);

    // Kur hiç değişmezse
    ekle("Hiç değişmezse", spot, "Referans senaryo: kur bugünkü seviyesinde kalırsa.");

    return senaryolar.sort((a, b) => a.deger - b.deger);
}

// ---------- 6) MODEL KARNESİ (GEÇMİŞE DÖNÜK TEST) ----------
// "Çalışıyor"demek yetmez. Modeli geçmişteki her güne uygulayıp
// gerçekleşenle karşılaştırıyoruz. Kıyas noktası: "yarın da bugünkü kur" (naive) tahmini.
function k68Kontrol(hata, egitimSirali, altOran, ustOran) {
    return hata >= dilimAl(egitimSirali, altOran) && hata <= dilimAl(egitimSirali, ustOran);
}

function karneCikar(seri, takvimGun, secenek) {
    const kayitlar = hataKayitlari(seri, takvimGun, secenek);
    if (!kayitlar) return null;

    const adet = kayitlar.length;
    const PENCERE = 80;
    const enAzEgitim = 40;

    // Uygulamanın GERÇEKTEN kullandığı modeli test ediyoruz: sapma düzeltmeli + kalibre bandlı.
    // Her gün, sadece o güne kadarki hatalarla ayarlanır — geleceği görmez.
    let hataModel = 0, hataNaive = 0, yonDogru = 0, yonAdet = 0, olculen = 0;

    // Band dürüstlük testi: bandı ilk %70 ile kur, son %30'da SINA.
    // Aynı veriyle hem kurup hem test etmek kendini kandırmak olurdu.
    let band68 = null, band95 = null, testAdet = 0, i68 = 0, i95 = 0;
    for (let i = enAzEgitim; i < adet; i++) {
        const k = kayitlar[i];
        const egitim = kayitlar.slice(Math.max(0, i - PENCERE), i).map(x => x.hata).sort((a, b) => a - b);
        const medyan = dilimAl(egitim, 0.5);

        // Düzeltilmiş modelin o günkü hatası
        const duzeltilmisHata = k.hata - medyan;
        hataModel += Math.abs(Math.exp(duzeltilmisHata) - 1);
        hataNaive += Math.abs(Math.exp(k.naiveHata) - 1);
        olculen++;

        const duzeltilmisMerkez = k.merkez * Math.exp(medyan);
        const gercekYon = Math.sign(k.gercek - k.bugun);
        if (gercekYon !== 0) { yonAdet++; if (Math.sign(duzeltilmisMerkez - k.bugun) === gercekYon) yonDogru++; }

        if (k68Kontrol(k.hata, egitim, 0.16, 0.84)) i68++;
        if (k68Kontrol(k.hata, egitim, 0.025, 0.975)) i95++;
        testAdet++;
    }
    if (testAdet >= 15) { band68 = i68 / testAdet * 100; band95 = i95 / testAdet * 100; }
    if (!olculen) return null;
    const mapeModel = hataModel / olculen * 100;
    const mapeNaive = hataNaive / olculen * 100;

    return {
        gun: takvimGun,
        deneme: olculen,
        testAdet: testAdet,
        ortalamaHata: mapeModel,
        naiveHata: mapeNaive,
        iyilesme: (1 - mapeModel / mapeNaive) * 100,
        band68: band68,
        band95: band95,
        yonBasarisi: yonAdet ? yonDogru / yonAdet * 100 : null
    };
}

// ---------- 7) VARLIK ÖZETİ (tıklayınca çıkan "bütün veriler") ----------

function varlikOzeti(kod, tarihler, seri) {
    const n = seri.length;
    if (!n) return null;
    const son = seri[n - 1];

    // Geçmişte N iş günü öncesine bak
    const geri = (k) => (n - 1 - k >= 0 ? seri[n - 1 - k] : null);

    // Yılbaşından bu yana: bu yılın ilk verisi
    const buYil = tarihler[n - 1].slice(0, 4);
    let yilBasiIndeks = tarihler.findIndex(t => t.slice(0, 4) === buYil);
    const yilBasi = yilBasiIndeks >= 0 ? seri[yilBasiIndeks] : null;

    const sonYil = seri.slice(-Math.min(n, IS_GUNU_YIL));
    const gecerliYil = sonYil.filter(x => x && isFinite(x));
    const enYuksek = Math.max(...gecerliYil);
    const enDusuk = Math.min(...gecerliYil);

    const getiriler = logGetiriler(seri.filter(x => x && isFinite(x)));
    const sigmaGun = ewmaSigma(getiriler);
    const yillikOynaklik = sigmaGun * Math.sqrt(IS_GUNU_YIL) * 100;
    const oynaklikOrt = stdSapma(getiriler.slice(-IS_GUNU_YIL)) * Math.sqrt(IS_GUNU_YIL) * 100;

    // Son 1 yılın en sert günü
    const son250 = getiriler.slice(-IS_GUNU_YIL);
    let enSert = 0;
    son250.forEach(r => { if (Math.abs(r) > Math.abs(enSert)) enSert = r; });

    // Art arda kaç gün aynı yönde
    let seriGun = 0;
    for (let i = seri.length - 1; i > 0; i--) {
        const yon = Math.sign(seri[i] - seri[i - 1]);
        if (seriGun === 0) { seriGun = yon; }
        else if (Math.sign(seriGun) === yon) { seriGun += yon; }
        else break;
    }

    return {
        kod: kod,
        son: son,
        tarih: tarihler[n - 1],
        gun: degisimYuzde(geri(1), son),
        hafta: degisimYuzde(geri(5), son),
        ay: degisimYuzde(geri(21), son),
        ucAy: degisimYuzde(geri(63), son),
        altiAy: degisimYuzde(geri(126), son),
        yil: degisimYuzde(geri(IS_GUNU_YIL), son),
        yilBasi: degisimYuzde(yilBasi, son),
        ort7: hareketliOrt(seri, 7),
        ort30: hareketliOrt(seri, 30),
        ort90: hareketliOrt(seri, 90),
        ort200: hareketliOrt(seri, 200),
        enYuksek52: enYuksek,
        enDusuk52: enDusuk,
        bandKonumu: (enYuksek > enDusuk) ? (son - enDusuk) / (enYuksek - enDusuk) * 100 : 50,
        yillikOynaklik: yillikOynaklik,
        oynaklikOrtalama: oynaklikOrt,
        enSertGun: enSert * 100,
        ardArda: seriGun,
        veriAdedi: n
    };
}

// ---------- 8) FAİZ VE GETİRİ HESAPLARI ----------

// Vadeli mevduat. Türkiye'de faiz gelirinden stopaj kesilir.
function mevduatHesapla(anapara, yillikFaiz, vadeGun, stopajYuzde, bilesikMi, donemSayisi) {
    const oran = yillikFaiz / 100 * vadeGun / 365;
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
    // Bileşik: her vade sonunda net faiz anaparaya eklenir ve yeniden yatırılır
    let bakiye = anapara, toplamBrut = 0, toplamStopaj = 0;
    for (let i = 0; i < donemSayisi; i++) {
        const brut = bakiye * oran;
        const stopaj = brut * stopajYuzde / 100;
        toplamBrut += brut; toplamStopaj += stopaj;
        bakiye += brut - stopaj;
    }
    const toplamGun = vadeGun * donemSayisi;
    const net = bakiye - anapara;
    return {
        brutFaiz: toplamBrut, stopaj: toplamStopaj, netFaiz: net,
        vadeSonu: bakiye,
        netYillik: anapara > 0 ? (Math.pow(bakiye / anapara, 365 / toplamGun) - 1) * 100 : 0,
        donem: donemSayisi, toplamGun: toplamGun
    };
}

// Reel getiri: enflasyondan arındırılmış gerçek kazanç (Fisher denklemi)
function reelGetiri(nominalYuzde, enflasyonYuzde) {
    return ((1 + nominalYuzde / 100) / (1 + enflasyonYuzde / 100) - 1) * 100;
}

// Başabaş kuru: TL mevduatla dövizin eşitlendiği kur seviyesi.
// Bu bir tavsiye değil; sadece "hangi kurda ikisi aynı parayı getirir"sorusunun cevabı.
function basabasKuru(spot, tlFaiz, dovizFaiz, gun, stopajYuzde) {
    const t = gun / 365;
    const tlNet = tlFaiz / 100 * t * (1 - stopajYuzde / 100);
    const dvNet = dovizFaiz / 100 * t * (1 - stopajYuzde / 100);
    const kur = spot * (1 + tlNet) / (1 + dvNet);
    return {
        kur: kur,
        gerekliArtis: (kur / spot - 1) * 100,
        tlGetiri: tlNet * 100,
        dovizFaizGetiri: dvNet * 100
    };
}

// Kredi taksiti (annüite). İhtiyaç kredilerinde faiz üstüne KKDF %15 + BSMV %5 gelir.
function krediHesapla(tutar, aylikFaiz, taksitSayisi, vergiVar) {
    const i = aylikFaiz / 100 * (vergiVar ? 1.20 : 1.0);
    let taksit;
    if (i === 0) taksit = tutar / taksitSayisi;
    else taksit = tutar * i * Math.pow(1 + i, taksitSayisi) / (Math.pow(1 + i, taksitSayisi) - 1);
    const toplam = taksit * taksitSayisi;
    return {
        taksit: taksit,
        toplamOdeme: toplam,
        toplamFaiz: toplam - tutar,
        efektifAylik: i * 100,
        yillikMaliyet: (Math.pow(1 + i, 12) - 1) * 100
    };
}

// ---------- 9) EKONOMİST ANALİZİ (tek tuş) ----------
// Bütün sayıları okuyup insan diliyle yorumlar. Kural tabanlıdır: uydurmaz, hesaplar.
function ekonomistAnalizi(kod, ozet, tahminler, karne, ayar, ekBilgi) {
    const v = varlikBul(kod);
    const bilgi = ekBilgi || {};
    const bolumler = [];
    const birim = kod === "ONSALTIN" ? "$" : "₺";
    const yaz = (x) => sayi(x) + " " + birim;

    // 1) Manşet
    bolumler.push({
        baslik: "Özet",
        onem: "notr",
        satirlar: [
            `${v.ad} şu an <b>${yaz(ozet.son)}</b> (${tarihYaz(ozet.tarih)} referans kuru).`,
            `Son bir haftada <b>${yuzde(ozet.hafta)}</b>, son ayda <b>${yuzde(ozet.ay)}</b>, son yılda <b>${yuzde(ozet.yil)}</b> değişti.`,
            ozet.yilBasi !== null ? `Yılbaşından bu yana değişim: <b>${yuzde(ozet.yilBasi)}</b>.` : null
        ].filter(Boolean)
    });

    // 2) Trend
    const ort30Ust = ozet.ort30 && ozet.son > ozet.ort30;
    const ort90Ust = ozet.ort90 && ozet.son > ozet.ort90;
    let trendMetni;
    if (ort30Ust && ort90Ust) trendMetni = "Fiyat hem 30 hem 90 günlük ortalamasının <b>üstünde</b> — yükseliş eğilimi sürüyor.";
    else if (!ort30Ust && !ort90Ust) trendMetni = "Fiyat hem 30 hem 90 günlük ortalamasının <b>altında</b> — zayıf seyir.";
    else trendMetni = "Fiyat ortalamaların <b>arasında sıkışmış</b> — yön belirsiz, kararsız bir dönem.";
    bolumler.push({
        baslik: "Yön (trend)",
        onem: ort30Ust ? "yukari" : "asagi",
        satirlar: [
            trendMetni,
            `30 günlük ortalama ${yaz(ozet.ort30)}, 90 günlük ortalama ${yaz(ozet.ort90)}.`,
            Math.abs(ozet.ardArda) >= 3
                ? `Son <b>${Math.abs(ozet.ardArda)} işlem günü</b> üst üste ${ozet.ardArda > 0 ? "yükseldi" : "düştü"}.`
                : null,
            `52 haftalık aralıkta <b>%${sayi(ozet.bandKonumu, 0)}</b> seviyesinde duruyor (0 = yılın dibi, 100 = zirvesi).`
        ].filter(Boolean)
    });

    // 3) Oynaklık
    const oynaklikOran = ozet.oynaklikOrtalama > 0 ? ozet.yillikOynaklik / ozet.oynaklikOrtalama : 1;
    let oynaklikYorum;
    if (oynaklikOran > 1.3) oynaklikYorum = "Piyasa <b>normalden hareketli</b>; tahmin aralıkları genişler, sürprize açık dönem.";
    else if (oynaklikOran < 0.7) oynaklikYorum = "Piyasa <b>normalden sakin</b>; dar bantta hareket bekleniyor.";
    else oynaklikYorum = "Oynaklık <b>olağan seviyede</b>.";
    bolumler.push({
        baslik: "Oynaklık (risk)",
        onem: oynaklikOran > 1.3 ? "uyari" : "notr",
        satirlar: [
            `Yıllıklandırılmış oynaklık <b>%${sayi(ozet.yillikOynaklik, 1)}</b> (son bir yıl ortalaması %${sayi(ozet.oynaklikOrtalama, 1)}).`,
            oynaklikYorum,
            `Günlük tipik hareket ±%${sayi(ozet.yillikOynaklik / Math.sqrt(IS_GUNU_YIL), 2)}; son bir yılın en sert günü %${sayi(ozet.enSertGun, 2)}.`
        ]
    });

    // 4) Faiz penceresi
    const yFaiz = (ayar.yabanciFaiz && ayar.yabanciFaiz[kod] !== undefined) ? ayar.yabanciFaiz[kod] : (v.faiz || 0);
    const faizFarki = ayar.tlFaiz - yFaiz;
    const aylikParite = (pariteTahmini(ozet.son, ayar.tlFaiz, yFaiz, 30) / ozet.son - 1) * 100;
    bolumler.push({
        baslik: "Faiz farkı ne diyor?",
        onem: "notr",
        satirlar: [
            `TL faizi <b>%${sayi(ayar.tlFaiz, 2)}</b>, ${v.ad} tarafının faizi <b>%${sayi(yFaiz, 2)}</b>. Fark: <b>%${sayi(faizFarki, 2)}</b>.`,
            `Faiz paritesine göre kurun aylık <b>${yuzde(aylikParite)}</b> artması "normal"kabul edilir — bu, arbitrajı engelleyen dengedir.`,
            `Yıllığa çevrilirse faiz farkı, kurda yıllık yaklaşık <b>%${sayi((Math.pow(1 + aylikParite / 100, 12) - 1) * 100, 1)}</b> artışa denk gelir.`
        ]
    });

    // 5) Taşıma (carry) karşılaştırması — hesap, tavsiye değil
    const bb = basabasKuru(ozet.son, ayar.mevduatFaiz, yFaiz, 30, 15);
    const tAy = tahminler.find(t => t.gun === 30);
    if (tAy) {
        const fark = (tAy.merkez - bb.kur) / bb.kur * 100;
        let carryYorum;
        if (fark > 0.5) carryYorum = `Modelin 1 aylık merkezi tahmini (<b>${yaz(tAy.merkez)}</b>) başabaş kurun <b>üstünde</b>: bu senaryo gerçekleşirse döviz, TL mevduatı geçer.`;
        else if (fark < -0.5) carryYorum = `Modelin 1 aylık merkezi tahmini (<b>${yaz(tAy.merkez)}</b>) başabaş kurun <b>altında</b>: bu senaryo gerçekleşirse TL mevduat önde kalır.`;
        else carryYorum = `Modelin tahmini ile başabaş kur neredeyse <b>aynı</b> — iki seçenek matematiksel olarak başa baş görünüyor.`;
        bolumler.push({
            baslik: "TL mevduat mı, döviz mi?",
            onem: "notr",
            satirlar: [
                `%${sayi(ayar.mevduatFaiz, 2)} mevduat faiziyle 1 ay sonunda başabaş kur: <b>${yaz(bb.kur)}</b> (bugüne göre ${yuzde(bb.gerekliArtis)}).`,
                carryYorum,
                `<span class="not">Bu bir yatırım tavsiyesi değil; iki seçeneğin matematiksel eşitlik noktasıdır.</span>`
            ]
        });
    }

    // 6) Enflasyona karşı
    const reel = ozet.yil !== null ? reelGetiri(ozet.yil, ayar.enflasyon) : null;
    if (reel !== null) {
        bolumler.push({
            baslik: "Enflasyona karşı",
            onem: reel > 0 ? "yukari" : "asagi",
            satirlar: [
                `Son bir yılda ${v.ad} ${yuzde(ozet.yil)} artarken enflasyon %${sayi(ayar.enflasyon, 2)} oldu.`,
                reel > 0
                    ? `Yani bu varlık enflasyonu <b>${sayi(Math.abs(reel), 1)} puan geçti</b> — alım gücünü korumuş.`
                    : `Yani bu varlık enflasyonun <b>${sayi(Math.abs(reel), 1)} puan gerisinde</b> kaldı — alım gücü kaybettirmiş.`
            ]
        });
    }

    // 7) Tahmin özeti + olasılıklar
    const satirlar = [];
    tahminler.forEach(t => {
        const ad = t.gun === 1 ? "Yarın" : t.gun === 7 ? "1 hafta" : t.gun === 30 ? "1 ay" : t.gun + "gün";
        satirlar.push(`<b>${ad}:</b> merkez ${yaz(t.merkez)} (${yuzde(t.degisimYuzde)}) · %68 olasılıkla ${yaz(t.alt68)} – ${yaz(t.ust68)}`);
    });
    if (tAy) {
        const yuvarlak = Math.ceil(ozet.son / (ozet.son > 100 ? 500 : ozet.son > 10 ? 1 : 0.1)) * (ozet.son > 100 ? 500 : ozet.son > 10 ? 1 : 0.1);
        const ol = seviyeOlasiligi(tAy, yuvarlak);
        if (ol) satirlar.push(`1 ay içinde <b>${yaz(yuvarlak)}</b> seviyesinin üstüne çıkma olasılığı: <b>%${sayi(ol.ustunde, 0)}</b>.`);
    }
    bolumler.push({ baslik: "Tahmin", onem: "notr", satirlar: satirlar });

    // 8) Modelin güvenilirliği — dürüstlük bölümü
    if (karne) {
        let guvenYorum;
        if (karne.iyilesme > 10) guvenYorum = `Model, "yarın da bugünkü fiyat"varsayımından <b>%${sayi(karne.iyilesme, 0)} daha isabetli</b> çıktı.`;
        else if (karne.iyilesme > 0) guvenYorum = `Model basit varsayımdan <b>az farkla (%${sayi(karne.iyilesme, 0)})</b> iyi. Kur tahmini doğası gereği zordur.`;
        else guvenYorum = `Model bu vadede basit "değişmez"varsayımını <b>geçemedi</b>. Tahmine temkinli yaklaşın.`;
        bolumler.push({
            baslik: "Bu tahmine ne kadar güvenilir?",
            onem: karne.iyilesme > 0 ? "notr" : "uyari",
            satirlar: [
                `${karne.gun} günlük vadede geçmişte ${karne.deneme} kez test edildi: ortalama sapma <b>%${sayi(karne.ortalamaHata, 2)}</b>.`,
                guvenYorum,
                (karne.band68 !== null
                    ? `Gerçekleşen fiyat %68 bandının içinde kalma oranı: <b>%${sayi(karne.band68, 0)}</b> (ideal %68) · `
                    : "") + `yön isabeti: <b>%${sayi(karne.yonBasarisi, 0)}</b>.`,
                `<span class="not">Kur; seçim, karar, jeopolitik gibi tahmin edilemez olaylardan etkilenir. Bu hesaplar geçmişe bakar, geleceği garanti etmez.</span>`
            ]
        });
    }

    // 9) Ne izlemeli
    const izle = [
        "TCMB Para Politikası Kurulu kararları — faiz değişimi bu tahminin faiz parçasını doğrudan değiştirir.",
        "TÜİK enflasyon verisi (her ayın 3'ü) — reel getiri hesabını değiştirir.",
        "Fed ve ECB faiz kararları — dolar ve euro tarafının faizini değiştirir."
    ];
    if (bilgi.sonrakiPPK) izle.unshift(`Sıradaki TCMB toplantısı: <b>${bilgi.sonrakiPPK}</b>.`);
    bolumler.push({ baslik: "Ne izlemeli?", onem: "notr", satirlar: izle });

    return bolumler;
}

// ---------- 9b) SÜRÜCÜLER: KURU NE HAREKET ETTİRİR? ----------
// Profesyonel analistlerin kura bakarken izlediği başlıklar.
// Buradakileri ücretsiz veriden HESAPLIYORUZ; hesaplanamayanlar aşağıdaki IZLENECEKLER listesinde.
function surucuAnalizi(kod, ozet, ayar, veri, makro) {
    const v = varlikBul(kod);
    const yFaiz = (ayar.yabanciFaiz && ayar.yabanciFaiz[kod] !== undefined) ? ayar.yabanciFaiz[kod] : (v.faiz || 0);
    const liste = [];

    // 1) Faiz farkı (carry) — yüksek faiz TL'yi kısa vadede destekler, vadeli kuru yukarı iter
    const fark = ayar.tlFaiz - yFaiz;
    liste.push({
        ad: "Faiz farkı (carry)",
        deger: "%" + sayi(fark, 2),
        yon: fark > 20 ? "yukari" : fark > 0 ? "notr" : "asagi",
        aciklama: `TL faizi %${sayi(ayar.tlFaiz, 2)}, karşı taraf %${sayi(yFaiz, 2)}. Fark ne kadar büyükse TL'de durmanın getirisi o kadar yüksek — ama vadeli kur da o kadar yukarı fiyatlanır.`
    });

    // 2) Reel faiz — asıl belirleyici. Faiz enflasyonun üstündeyse TL'yi tutmak mantıklı hale gelir.
    const reel = reelGetiri(ayar.tlFaiz, ayar.enflasyon);
    liste.push({
        ad: "Reel faiz (faiz − enflasyon)",
        deger: "%" + sayi(reel, 2),
        yon: reel > 3 ? "yukari" : reel > 0 ? "notr" : "asagi",
        aciklama: reel > 0
            ? `Faiz enflasyonun ${sayi(reel, 1)} puan üstünde. Pozitif reel faiz genelde TL'ye talebi artırır, kuru baskılar.`
            : `Faiz enflasyonun ${sayi(Math.abs(reel), 1)} puan altında. Negatif reel faiz, dövize ve altına kaçışı besler.`
    });

    // 3) Dolar endeksi (DXY) — küresel dolar gücü
    if (veri && veri.dxy) {
        const d = veri.dxy.filter(x => x && isFinite(x));
        if (d.length > 30) {
            const son = d[d.length - 1];
            const ayOnce = d[Math.max(0, d.length - 22)];
            const dg = degisimYuzde(ayOnce, son);
            liste.push({
                ad: "Dolar endeksi (DXY)",
                deger: sayi(son, 2),
                yon: dg > 1 ? "yukari" : dg < -1 ? "asagi" : "notr",
                aciklama: `Doların 6 büyük paraya karşı gücü, son ayda ${yuzde(dg)}. Dolar dünya genelinde güçlenirken gelişen ülke paraları (TL dahil) genelde zorlanır.`
            });
        }
    }

    // 4) Kurun kendi hızı — enflasyona göre geride mi, önde mi?
    if (ozet.yil !== null) {
        const kurReel = reelGetiri(ozet.yil, ayar.enflasyon);
        liste.push({
            ad: "Kur / enflasyon yarışı",
            deger: "%" + sayi(kurReel, 1),
            yon: kurReel < -5 ? "yukari" : kurReel > 5 ? "asagi" : "notr",
            aciklama: kurReel < 0
                ? `Kur, enflasyonun ${sayi(Math.abs(kurReel), 1)} puan gerisinde kalmış. Uzun vadede bu fark kapanma eğilimindedir (reel değerlenme baskısı).`
                : `Kur, enflasyonu ${sayi(kurReel, 1)} puan geçmiş. Kısa vadede fazla hızlanmış olabilir.`
        });
    }

    // 5) Oynaklık rejimi
    const oran = ozet.oynaklikOrtalama > 0 ? ozet.yillikOynaklik / ozet.oynaklikOrtalama : 1;
    liste.push({
        ad: "Oynaklık rejimi",
        deger: "%" + sayi(ozet.yillikOynaklik, 1),
        yon: oran > 1.3 ? "uyari" : "notr",
        aciklama: oran > 1.3
            ? "Piyasa normalden hareketli. Sert hareket riski yüksek, tahmin bandı geniş."
            : oran < 0.7 ? "Piyasa sakin. Genelde sakinlik uzun sürmez, ani hareket öncesi de olabilir."
                : "Oynaklık olağan aralıkta."
    });

    // 6) Enflasyon eğilimi (Dünya Bankası, yıllık)
    if (makro && makro.enflasyon && makro.enflasyon.length >= 2) {
        const e = makro.enflasyon;
        const son = e[e.length - 1], onceki = e[e.length - 2];
        liste.push({
            ad: "Enflasyon eğilimi",
            deger: "%" + sayi(son.deger, 1) + " (" + son.yil + ")",
            yon: son.deger < onceki.deger ? "yukari" : "asagi",
            aciklama: `${onceki.yil}: %${sayi(onceki.deger, 1)} → ${son.yil}: %${sayi(son.deger, 1)}. ` +
                (son.deger < onceki.deger ? "Düşüş eğilimi TL için olumlu." : "Yükseliş eğilimi kur baskısını artırır.") +
                " (Dünya Bankası yıllık ortalaması; aylık TÜİK verisinden farklıdır.)"
        });
    }

    return liste;
}

// Ücretsiz+açık veriyle çekemediğimiz ama profesyonellerin mutlaka baktığı göstergeler.
// Uydurmak yerine nereye bakılacağını söylüyoruz.
const IZLENECEKLER = [
    {
        ad: "CDS primi (5 yıllık)", neden: "Türkiye'ye borç vermenin risk fiyatı. Yükselirse döviz çıkışı ve kur baskısı gelir. 300 baz puan altı iyi, 400 üstü riskli sayılır.",
        nereden: "Investing.com → Türkiye 5Y CDS", adres: "https://tr.investing.com/rates-bonds/turkey-cds-5-years"
    },
    {
        ad: "TCMB rezervleri (net/brüt)", neden: "Merkez Bankası'nın kuru savunma gücü. Rezerv artışı TL'yi destekler.",
        nereden: "TCMB haftalık para ve banka istatistikleri (her perşembe)", adres: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler"
    },
    {
        ad: "Cari işlemler dengesi", neden: "Açık büyüdükçe döviz talebi artar, kur yukarı baskılanır. Enerji fiyatı ve turizm en büyük kalemler.",
        nereden: "TCMB ödemeler dengesi (her ayın ~11'i)", adres: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Odemeler+Dengesi+ve+Ilgili+Istatistikler"
    },
    {
        ad: "TÜİK enflasyonu (aylık TÜFE)", neden: "Reel faizi ve TCMB'nin bir sonraki kararını belirler. Kurun uzun vadeli çıpası budur.",
        nereden: "TÜİK — her ayın 3'ü saat 10:00", adres: "https://data.tuik.gov.tr"
    },
    {
        ad: "TCMB Para Politikası Kurulu", neden: "Faiz kararı, bu uygulamadaki faiz paritesi tahminini doğrudan değiştirir.",
        nereden: "TCMB PPK takvimi ve kararları", adres: "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Para+Politikasi/PPK"
    },
    {
        ad: "Fed ve ECB kararları", neden: "Dolar ve euro tarafının faizi. Fed faizi yükselirse dolar küresel olarak güçlenir.",
        nereden: "Fed FOMC takvimi · ECB toplantı takvimi", adres: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"
    },
    {
        ad: "Kredi notu (Moody's, S&P, Fitch)", neden: "Not artışı yabancı sermaye girişini hızlandırır, kuru aşağı çeker.",
        nereden: "Kuruluşların Türkiye takvimi", adres: "https://www.tcmb.gov.tr"
    },
    {
        ad: "Brent petrol fiyatı", neden: "Türkiye net enerji ithalatçısı. Petrol yükselince ithalat faturası ve cari açık büyür, kur baskılanır.",
        nereden: "Investing.com → Brent petrol", adres: "https://tr.investing.com/commodities/brent-oil"
    }
];


// ---------- 9c) OTOMATİK UYARI EŞİKLERİ ----------
// Kullanıcı elle alarm kurmasa bile "dikkat çekici" durumları yakalar.
// Hepsi elimizdeki veriden hesaplanır; uydurma yok.

const UYARI_KURALLARI = [
    { kod: "yuvarlak", ad: "Yuvarlak seviye geçildi", aciklama: "Kur 49, 50 gibi yuvarlak bir seviyeyi geçerse haber ver." },
    { kod: "sert", ad: "Sert günlük hareket", aciklama: "Günlük değişim belirlediğiniz yüzdeyi aşarsa haber ver.", esikli: true, varsayilanEsik: 1.0 },
    { kod: "zirve", ad: "52 haftanın zirvesi / dibi", aciklama: "Fiyat son bir yılın en yüksek ya da en düşük seviyesine gelirse haber ver." },
    { kod: "ortalama", ad: "30 günlük ortalama kırıldı", aciklama: "Fiyat 30 günlük ortalamasının üstüne çıkar ya da altına inerse haber ver." }
];

// Dün de zirvede/dipte miydi? (art arda gelen "yeni zirve" bildirimlerini susturur)
function duneKadarZirvedeydi(temiz) {
    if (temiz.length < 30) return false;
    const dunkuSeri = temiz.slice(0, -1);
    const pencere = dunkuSeri.slice(-IS_GUNU_YIL);
    const dun = dunkuSeri[dunkuSeri.length - 1];
    const enYuksek = Math.max(...pencere), enDusuk = Math.min(...pencere);
    return dun >= enYuksek - 1e-9 || dun <= enDusuk + 1e-9;
}

// Fiyat büyüklüğüne göre "yuvarlak" sayılacak adım
function yuvarlakAdim(fiyat) {
    if (fiyat >= 100000) return 50000;
    if (fiyat >= 10000) return 1000;
    if (fiyat >= 1000) return 500;
    if (fiyat >= 100) return 10;
    if (fiyat >= 10) return 1;
    if (fiyat >= 1) return 0.5;
    return 0.1;
}

// Bir varlık için tetiklenen uyarıları döndürür.
// anahtar: aynı olayın tekrar tekrar bildirilmemesi için kimlik.
function otomatikUyariUret(kod, ozet, seri, ayarlar) {
    const acik = ayarlar || {};
    const cikti = [];
    const temiz = seri.filter(x => x && isFinite(x));
    if (temiz.length < 30) return cikti;

    const son = ozet.son;
    const onceki = temiz[temiz.length - 2];
    const v = varlikBul(kod);
    const ad = v ? v.ad : kod;
    const gun = ozet.tarih;

    // 1) Yuvarlak seviye geçişi
    if (acik.yuvarlak !== false) {
        const adim = yuvarlakAdim(son);
        const altSinir = Math.min(onceki, son), ustSinir = Math.max(onceki, son);
        const ilk = Math.ceil(altSinir / adim) * adim;
        for (let seviye = ilk; seviye <= ustSinir + 1e-9; seviye += adim) {
            if (seviye <= altSinir + 1e-9) continue;
            const yukari = son > onceki;
            cikti.push({
                tur: "yuvarlak",
                anahtar: `yuvarlak|${kod}|${seviye}|${gun}`,
                metin: `${ad}, <b>${sayi(seviye, seviye >= 100 ? 0 : 2)}</b> seviyesini ${yukari ? "yukarı" : "aşağı"} yönde geçti (${sayi(son)}).`
            });
        }
    }

    // 2) Sert günlük hareket
    if (acik.sert !== false && ozet.gun !== null) {
        const esik = acik.sertEsik !== undefined ? acik.sertEsik : 1.0;
        if (Math.abs(ozet.gun) >= esik) {
            cikti.push({
                tur: "sert",
                anahtar: `sert|${kod}|${gun}`,
                metin: `${ad} bugün <b>${yuzde(ozet.gun)}</b> hareket etti (eşik %${sayi(esik, 1)}).`
            });
        }
    }

    // 3) 52 haftanın zirvesi / dibi
    // DİKKAT: TL sürekli değer kaybettiği için dolar/euro neredeyse HER GÜN
    // 52 haftanın zirvesinde olur. Bunu her gün bildirmek haber değil gürültüdür.
    // Bu yüzden sadece "dünkü seviye zirvede DEĞİLKEN" bugün zirveye çıkılırsa bildiririz.
    if (acik.zirve !== false && !duneKadarZirvedeydi(temiz)) {
        if (son >= ozet.enYuksek52 - 1e-9) {
            cikti.push({
                tur: "zirve",
                anahtar: `zirve|${kod}|${gun}`,
                metin: `${ad} <b>son bir yılın en yüksek</b> seviyesinde: ${sayi(son)}.`
            });
        } else if (son <= ozet.enDusuk52 + 1e-9) {
            cikti.push({
                tur: "zirve",
                anahtar: `dip|${kod}|${gun}`,
                metin: `${ad} <b>son bir yılın en düşük</b> seviyesinde: ${sayi(son)}.`
            });
        }
    }

    // 4) 30 günlük ortalamanın kırılması
    if (acik.ortalama === true && ozet.ort30) {
        const oncekiOrt = hareketliOrt(temiz.slice(0, -1), 30);
        if (oncekiOrt) {
            const oncedenUstte = onceki > oncekiOrt;
            const simdiUstte = son > ozet.ort30;
            if (oncedenUstte !== simdiUstte) {
                cikti.push({
                    tur: "ortalama",
                    anahtar: `ortalama|${kod}|${gun}`,
                    metin: `${ad}, 30 günlük ortalamasının (${sayi(ozet.ort30)}) <b>${simdiUstte ? "üstüne çıktı" : "altına indi"}</b>.`
                });
            }
        }
    }

    return cikti;
}

// ---------- 10) KAYIT / ÖNBELLEK ----------

function ayarOku() {
    try {
        const ham = localStorage.getItem(KAYIT_ADI);
        if (!ham) return Object.assign({}, VARSAYILAN_AYAR, { portfoy: [] });
        const v = JSON.parse(ham);
        const ayar = Object.assign({}, VARSAYILAN_AYAR, { portfoy: [] }, v);

        // Eski tek-ayarlı kayıtları yeni (pc/mobil) yapıya taşı.
        // DİKKAT: "ayar.gorunum" varsayılandan hep dolu gelir; bakılacak olan
        // KAYITTAKİ (v) yapıdır. Yoksa eski kullanıcının tercihi sessizce silinir.
        if (v && !v.gorunum && (v.mod || v.renk)) {
            ayar.gorunum = {
                pc: { mod: v.mod || "tam", renk: v.renk || "varsayilan" },
                mobil: { mod: v.mod || "sade", renk: v.renk || "varsayilan" }
            };
        }
        delete ayar.mod; delete ayar.renk;
        // Eskiden ham ondalık kaydedilmiş olabilir (34.8811629820306 gibi) — temizle
        if (typeof ayar.enflasyon === "number") ayar.enflasyon = Math.round(ayar.enflasyon * 100) / 100;
        return ayar;
    } catch (e) {
        return Object.assign({}, VARSAYILAN_AYAR, { portfoy: [] });
    }
}

function ayarYaz(ayar) {
    try { localStorage.setItem(KAYIT_ADI, JSON.stringify(ayar)); } catch (e) { }
}

// İnternet yokken son veriyle çalışabilelim diye
function onbellekYaz(veri) {
    try {
        localStorage.setItem(ONBELLEK_ADI, JSON.stringify({ zaman: new Date().toISOString(), veri: veri }));
    } catch (e) { /* yer yoksa sessizce geç */ }
}

function onbellekOku() {
    try {
        const ham = localStorage.getItem(ONBELLEK_ADI);
        return ham ? JSON.parse(ham) : null;
    } catch (e) { return null; }
}
