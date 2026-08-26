// ================= SAYFA YARDIMCILARI =================
// Her araç sayfasının ortak parçaları: üst bar, alt bilgi, tema, sayı kutuları.
// Hesap yok — hesap hesap.js'de. Burada sadece ekran işi var.

const ARACLAR = [
    { yol: "net-maas-hesaplama.html", ad: "Net Maaş", aciklama: "Brütten nete, 12 ayın tamamı", grup: "Maaş ve Çalışma", anahtar: "brüt net maaş bordro sgk gelir vergisi damga kesinti asgari ücret 2026 işçi çalışan" },
    { yol: "butce-hesaplama.html", ad: "Bütçe", aciklama: "Gelir, gider ve kalanla ne yapılır", grup: "Ev ve Yaşam", anahtar: "aylık bütçe gider gelir tasarruf harcama para yönetimi 50 30 20 kural" },
    { yol: "kidem-tazminati-hesaplama.html", ad: "Kıdem Tazminatı", aciklama: "Kıdem + ihbar, tavan dahil", grup: "Maaş ve Çalışma", anahtar: "kıdem ihbar tazminat işten çıkarma ayrılma tavan yıl hizmet" },
    { yol: "kredi-hesaplama.html", ad: "Kredi Taksiti", aciklama: "Aylık taksit ve ödeme planı", grup: "Kredi ve Borç", anahtar: "kredi taksit ihtiyaç konut taşıt faiz annüite ödeme planı kkdf bsmv banka" },
    { yol: "mevduat-faizi-hesaplama.html", ad: "Mevduat Faizi", aciklama: "Vade sonu net getiri", grup: "Birikim", anahtar: "mevduat vadeli hesap faiz getiri stopaj banka birikim tl" },
    { yol: "kdv-hesaplama.html", ad: "KDV", aciklama: "Dahil / hariç ayırma", grup: "Ticaret", anahtar: "kdv katma değer vergisi dahil hariç fatura yüzde 20 10 1 ticaret" },
    { yol: "yakit-maliyeti-hesaplama.html", ad: "Yakıt Maliyeti", aciklama: "Yol kaç lira tutar", grup: "Ev ve Yaşam", anahtar: "yakıt benzin mazot motorin lpg yol masrafı km litre araç seyahat tatil" },
    { yol: "elektrik-tuketimi-hesaplama.html", ad: "Elektrik Tüketimi", aciklama: "Cihaz ayda kaç lira", grup: "Ev ve Yaşam", anahtar: "elektrik kwh fatura tüketim cihaz klima kombi buzdolabı watt enerji" },
    { yol: "yuzde-hesaplama.html", ad: "Yüzde Hesaplama", aciklama: "İndirim, zam, değişim", grup: "Genel", anahtar: "yüzde indirim zam artış azalış oran hesaplama kaçtır kaç yüzde" },
    { yol: "tarih-hesaplama.html", ad: "Tarih ve Yaş", aciklama: "İki tarih arası, yaş", grup: "Genel", anahtar: "tarih gün hesaplama yaş kaç gün kaldı iki tarih arası doğum günü" },
    { yol: "vade-farki-hesaplama.html", ad: "Vade Farkı", aciklama: "Peşin mi taksit mi", grup: "Kredi ve Borç", anahtar: "vade farkı peşin taksit hangisi kârlı alışveriş fiyat karşılaştırma" },
    { yol: "vucut-kitle-indeksi-hesaplama.html", ad: "Vücut Kitle İndeksi", aciklama: "BKİ ve ideal kilo", grup: "Sağlık", anahtar: "vki bki kilo boy ideal kilo obezite zayıf fazla kilolu sağlık" },
    { yol: "kalori-ihtiyaci-hesaplama.html", ad: "Kalori İhtiyacı", aciklama: "Günlük kalori ve hedefler", grup: "Sağlık", anahtar: "kalori bmh bazal metabolizma diyet kilo verme alma günlük ihtiyaç" },
    { yol: "net-hesaplama.html", ad: "Sınav Neti", aciklama: "Doğru, yanlış, net", grup: "Okul", anahtar: "net doğru yanlış sınav tyt ayt kpss puan test soru" },
    { yol: "kredi-karti-asgari-odeme-hesaplama.html", ad: "Kart Asgari Ödeme", aciklama: "Borç kaç ayda biter", grup: "Kredi ve Borç", anahtar: "kredi kartı asgari ödeme borç kapatma faiz kart borcu taksit" },
    { yol: "maas-zammi-hesaplama.html", ad: "Maaş Zammı", aciklama: "Zam enflasyonu karşıladı mı", grup: "Maaş ve Çalışma", anahtar: "maaş zam enflasyon reel artış refah payı memur işçi zam oranı" },
    { yol: "altin-hesaplama.html", ad: "Altın Hesaplama", aciklama: "Çeyrek, gram, ayar", grup: "Birikim", anahtar: "altın gram çeyrek yarım tam cumhuriyet ata 22 ayar 14 ayar bilezik milyem" },
    { yol: "kira-artisi-hesaplama.html", ad: "Kira Artışı", aciklama: "Yasal üst sınır (TÜFE)", grup: "Ev ve Yaşam", anahtar: "kira zam artış tüfe yasal sınır ev sahibi kiracı konut oran" },
    { yol: "birikim-hesaplama.html", ad: "Birikim", aciklama: "Bileşik getiri ve reel karşılık", grup: "Birikim", anahtar: "birikim bileşik faiz düzenli yatırım tasarruf gelecek değer reel" },
    { yol: "ne-kadar-kredi-cekebilirim.html", ad: "Kredi Limiti", aciklama: "Gelire göre çekilebilir tutar", grup: "Kredi ve Borç", anahtar: "kredi limiti ne kadar çekebilirim gelir taksit oranı uygunluk" },
    { yol: "fazla-mesai-hesaplama.html", ad: "Fazla Mesai", aciklama: "Saat ücreti ve 1,5 kat", grup: "Maaş ve Çalışma", anahtar: "fazla mesai saat ücreti 1,5 kat ek çalışma hafta tatili bayram" },
    { yol: "yillik-izin-hesaplama.html", ad: "Yıllık İzin", aciklama: "Kaç gün, ne kadar ücret", grup: "Maaş ve Çalışma", anahtar: "yıllık izin kaç gün ücretli izin kıdem yıl izin ücreti" },
    { yol: "issizlik-maasi-hesaplama.html", ad: "İşsizlik Maaşı", aciklama: "Tutar ve süre", grup: "Maaş ve Çalışma", anahtar: "işsizlik maaşı ödeneği işkur kaç ay ne kadar prim gün" },
    { yol: "birim-cevirme.html", ad: "Birim Çevirme", aciklama: "Uzunluk, ağırlık, sıcaklık, alan", grup: "Genel", anahtar: "birim çevirme dönüştürme inç fit mil libre pound ons dönüm hektar fahrenhayt kelvin galon knot metre kilo" },
    { yol: "sayi-yaziyla-yazma.html", ad: "Sayı Yazıyla", aciklama: "Çek ve senet için tutar yazımı", grup: "Genel", anahtar: "sayı yazıyla rakam yazı çek senet tutar yazımı bin lira kuruş nasıl yazılır" },
    { yol: "not-ortalamasi-hesaplama.html", ad: "Not Ortalaması", aciklama: "Kredili ağırlıklı ortalama", grup: "Okul", anahtar: "not ortalaması ağırlıklı kredi gano ortalama okul üniversite ders dönem" },
    { yol: "boya-fayans-hesaplama.html", ad: "Boya ve Fayans", aciklama: "Oda kaç litre boya, kaç karo", grup: "Ev ve Yaşam", anahtar: "boya litre fayans karo seramik metrekare oda duvar tavan badana tadilat m2" },
    { yol: "alan-cevre-hacim-hesaplama.html", ad: "Alan, Çevre, Hacim", aciklama: "Kare, daire, üçgen, silindir…", grup: "Genel", anahtar: "alan çevre hacim geometri kare dikdörtgen üçgen daire yamuk küp silindir küre koni metrekare metreküp yüzey heron pi yarıçap" },
    { yol: "ortalama-standart-sapma-hesaplama.html", ad: "Ortalama ve Sapma", aciklama: "Medyan, mod, standart sapma", grup: "Okul", anahtar: "ortalama medyan mod standart sapma varyans istatistik çeyrek aykırı değer aritmetik dizi excel" },
    { yol: "saat-sure-hesaplama.html", ad: "Saat ve Süre", aciklama: "Mesai süresi, süre toplama", grup: "Genel", anahtar: "saat süre mesai vardiya çalışma dakika ondalık gece vardiyası mola bordro puantaj zaman fark" }
];

const KAYIT = "hesapAraclariAyar";

function ayarOku() {
    try { return JSON.parse(localStorage.getItem(KAYIT)) || {}; } catch (e) { return {}; }
}
function ayarYaz(a) {
    try { localStorage.setItem(KAYIT, JSON.stringify(a)); } catch (e) { }
}

// ---------- Üst bar ve alt bilgi ----------

function iskeletKur(aktifYol) {
    const ayar = ayarOku();
    if (ayar.tema === "koyu") document.documentElement.dataset.tema = "koyu";

    // ERİŞİLEBİLİRLİK: klavyeyle gezenler menüyü atlayıp doğrudan içeriğe geçebilsin
    const atla = document.createElement("a");
    atla.href = "#icerik";
    atla.className = "atlama-baglantisi";
    atla.textContent = "İçeriğe geç";
    document.body.insertBefore(atla, document.body.firstChild);

    const ust = document.createElement("header");
    ust.className = "ust";
    ust.innerHTML = `
        <div class="ust-sol">
            <a href="index.html" class="marka">Hesap <span>Araçları</span></a>
        </div>
        <div class="ust-sag">
            <button id="temaBtn" class="ikincil" type="button"
                    aria-label="Açık veya koyu temaya geç" title="Açık / koyu tema">${ayar.tema === "koyu" ? "◑" : "◐"}</button>
        </div>`;
    document.body.insertBefore(ust, atla.nextSibling);

    // Araçlar arası gezinti — her sayfadan diğerine tek dokunuş
    const gez = document.createElement("nav");
    gez.className = "arac-gezinti";
    gez.setAttribute("aria-label", "Hesaplama araçları");
    // 12 aracin hepsini menuye koymak menuyu okunmaz hale getiriyordu.
    // Menude en cok kullanilan 5 arac + aktif sayfa durur; gerisi "Tum araclar"da.
    const ONCELIKLI = ["net-maas-hesaplama.html", "butce-hesaplama.html", "kredi-hesaplama.html",
                       "kira-artisi-hesaplama.html", "kidem-tazminati-hesaplama.html"];
    const gosterilecek = ARACLAR.filter(a => ONCELIKLI.includes(a.yol) || a.yol === aktifYol);
    gez.innerHTML = gosterilecek.map(a =>
        `<a href="${a.yol}" class="${a.yol === aktifYol ? "aktif" : ""}"${a.yol === aktifYol ? ' aria-current="page"' : ""}>${a.ad}</a>`).join("") +
        `<a href="index.html" class="tum-araclar">Tüm araçlar (${ARACLAR.length})</a>`;
    document.body.insertBefore(gez, ust.nextSibling);

    // Ana içerik işareti ve canlı sonuç bildirimi (ekran okuyucular için)
    const anaAlan = document.querySelector("main");
    if (anaAlan) { anaAlan.id = "icerik"; anaAlan.setAttribute("tabindex", "-1"); }
    const sonucAlani = document.getElementById("ozet");
    if (sonucAlani) {
        sonucAlani.setAttribute("role", "status");
        sonucAlani.setAttribute("aria-live", "polite");
    }

    const alt = document.createElement("footer");
    alt.innerHTML = `
        <p><b>Uyarı:</b> Bu araçlar ${PARAMETRE.yil} yılı resmî oranlarıyla hesap yapar ve
        <b>bilgilendirme amaçlıdır</b>. Resmî işlemlerde bordronuzu, banka sözleşmenizi ya da
        mali müşavirinizi esas alın.</p>
        <p class="kucuk">Kullanılan ${PARAMETRE.yil} parametreleri: asgari ücret brüt
        ${para(PARAMETRE.asgariBrut)} · SGK tavanı ${para(PARAMETRE.sgkTavan)} ·
        damga vergisi binde ${sayi(PARAMETRE.damgaOran * 1000, 2)} ·
        gelir vergisi ilk dilim ${para(PARAMETRE.vergiDilimleri[0][0], 0)} (%15).
        Son güncelleme: ${PARAMETRE.guncelleme}.</p>`;
    document.body.appendChild(alt);

    document.getElementById("temaBtn").onclick = () => {
        const a = ayarOku();
        a.tema = a.tema === "koyu" ? "acik" : "koyu";
        if (a.tema === "koyu") document.documentElement.dataset.tema = "koyu";
        else delete document.documentElement.dataset.tema;
        document.getElementById("temaBtn").textContent = a.tema === "koyu" ? "◑" : "◐";
        ayarYaz(a);
    };
    cevrimdisiUyari(aktifYol);
}

// ---------- Sonuç satırları ----------

// Arama icin: buyuk/kucuk ve Turkce harkleri esitler.
// "kidem" yazan "Kıdem"i, "SGK" yazan "sgk"yi bulsun diye.
function sadelestir(metin) {
    return String(metin || "")
        .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
        .toLowerCase()
        .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
        .replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i");
}

function satir(etiket, deger, sinif) {
    return `<div class="sonuc-satir ${sinif || ""}"><span>${etiket}</span><b>${deger}</b></div>`;
}

// Girdi kutularını dinle: her değişiklikte hesapla
function dinle(idler, isle) {
    idler.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", isle);
        el.addEventListener("change", isle);
    });
    isle();
}

// <input type="number"> her zaman NOKTALI ondalık verir; onu doğrudan okuruz.
// Metin kutularında ise Türkçe biçim (12.500,50) gelebilir, sayiOku onu çözer.
function oku(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.type === "number") { const d = parseFloat(el.value); return isFinite(d) ? d : 0; }
    return sayiOku(el.value);
}
function isaretli(id) { return document.getElementById(id).checked; }

// ================= GÜVEN VE KOLAYLIK KATMANI =================
// Rakip sitelerin çoğu sadece sonucu verir. Bizim farkımız:
//   1) hesabın adım adım dökümü (kullanıcı doğrulayabilsin)
//   2) paylaşılabilir bağlantı (sonuç linkle gönderilebilsin)
//   3) Google'da zengin sonuç için SSS işaretlemesi
//   4) binlik ayraçlı giriş, kopyala, yazdır gibi küçük kolaylıklar

// ---------- 1) Adım adım hesap dökümü ----------
// "Şu sayı nereden geldi?" sorusunun cevabını satır satır gösterir.
function dokumKur(baslik) {
    return {
        baslik: baslik || "Hesabın adımları",
        adimlar: [],
        ekle: function (aciklama, islem, sonuc) {
            this.adimlar.push({ aciklama: aciklama, islem: islem, sonuc: sonuc });
            return this;
        },
        html: function () {
            if (!this.adimlar.length) return "";
            return `<details class="kutu katlanir dokum">
                <summary><span>${this.baslik}</span><span class="ipuc">bu sayı nereden geldi?</span></summary>
                <div class="katlanir-ic">
                    <p class="kucuk" style="margin-top:0">Her satır tek bir işlemi gösterir;
                    hesap makinesiyle kontrol edebilirsiniz.</p>
                    <ol class="dokum-liste">${this.adimlar.map(a => `
                        <li>
                            <span class="d-aciklama">${a.aciklama}</span>
                            <code class="d-islem">${a.islem}</code>
                            <b class="d-sonuc">${a.sonuc}</b>
                        </li>`).join("")}</ol>
                </div>
            </details>`;
        }
    };
}

// ---------- 2) Paylaşılabilir bağlantı ----------
// Girilen değerler adres çubuğuna yazılır; link gönderilince aynı hesap açılır.
function baglantiyaYaz(alanlar) {
    const p = new URLSearchParams();
    alanlar.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const d = el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value;
        if (d !== "" && d !== null) p.set(id, d);
    });
    try { history.replaceState(null, "", "?" + p.toString()); } catch (e) { }
}

function baglantidanOku(alanlar) {
    const p = new URLSearchParams(location.search);
    let bulundu = false;
    alanlar.forEach(id => {
        if (!p.has(id)) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === "checkbox") el.checked = p.get(id) === "1";
        else el.value = p.get(id);
        bulundu = true;
    });
    return bulundu;
}

// ---------- 3) Sonucu kopyala / paylaş / yazdır ----------
function eylemCubugu(sonucGetir) {
    const c = document.createElement("div");
    c.className = "eylem-cubugu";
    c.setAttribute("role", "group");
    c.setAttribute("aria-label", "Sonuç işlemleri");
    c.innerHTML = `
        <button class="ikincil" type="button" id="kopyalaBtn">Sonucu kopyala</button>
        <button class="ikincil" type="button" id="paylasBtn">Bağlantıyı paylaş</button>
        <button class="ikincil" type="button" id="yazdirBtn">Yazdır</button>`;
    return c;
}

function eylemleriBagla(sonucGetir) {
    const kopyala = async (metin, dugme) => {
        try { await navigator.clipboard.writeText(metin); }
        catch (e) { window.prompt("Kopyalayın:", metin); return; }
        const eski = dugme.textContent;
        dugme.textContent = "Kopyalandı";
        setTimeout(() => dugme.textContent = eski, 1600);
    };

    const kb = document.getElementById("kopyalaBtn");
    if (kb) kb.onclick = () => kopyala(sonucGetir(), kb);

    const pb = document.getElementById("paylasBtn");
    if (pb) pb.onclick = async () => {
        const adres = location.href;
        if (navigator.share) {
            try { await navigator.share({ title: document.title, url: adres }); return; }
            catch (e) { return; }
        }
        kopyala(adres, pb);
    };

    const yb = document.getElementById("yazdirBtn");
    if (yb) yb.onclick = () => window.print();
}

// Ekrandaki sonuç satırlarını düz metne çevirir (kopyalamak için)
function sonucMetni(baslik) {
    const satirlar = [baslik || document.querySelector("h1").innerText.trim(), ""];
    document.querySelectorAll("#ozet .sonuc-satir").forEach(s => {
        const p = s.innerText.split("\n").filter(Boolean);
        if (p.length >= 2) satirlar.push(p[0] + ": " + p[p.length - 1]);
    });
    satirlar.push("", location.href);
    return satirlar.join("\n");
}

// ---------- 4) Sık sorulan sorular + Google zengin sonuç ----------
// FAQPage işaretlemesi, arama sonucunda sorunun açılır şekilde görünmesini sağlar.
function sssEkle(sorular) {
    const bolum = document.createElement("section");
    bolum.className = "kutu sss";
    bolum.innerHTML = `<h2>Sık sorulan sorular</h2>` + sorular.map(s => `
        <details class="sss-madde">
            <summary>${s.soru}</summary>
            <div class="sss-cevap">${s.cevap}</div>
        </details>`).join("");
    document.querySelector("main").appendChild(bolum);

    const veri = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": sorular.map(s => ({
            "@type": "Question",
            "name": s.soru,
            "acceptedAnswer": { "@type": "Answer", "text": s.cevap.replace(/<[^>]+>/g, "") }
        }))
    };
    const et = document.createElement("script");
    et.type = "application/ld+json";
    et.textContent = JSON.stringify(veri);
    document.head.appendChild(et);
}

// ---------- 5) Yapısal veri: bu bir hesaplama aracı ----------
function yapisalVeri(ad, aciklama) {
    const veri = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": ad,
        "description": aciklama,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Tüm cihazlar",
        "inLanguage": "tr-TR",
        "isAccessibleForFree": true,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY" }
    };
    const et = document.createElement("script");
    et.type = "application/ld+json";
    et.textContent = JSON.stringify(veri);
    document.head.appendChild(et);
}

// ---------- 6) İlgili araçlar ----------
function ilgiliAraclar(aktifYol) {
    // Ayni gruptan olanlar once gelsin, en fazla 4 tane goster
    const aktif = ARACLAR.find(a => a.yol === aktifYol);
    const grup = aktif ? aktif.grup : null;
    const digerleri = ARACLAR.filter(a => a.yol !== aktifYol)
        .sort((a, b) => (b.grup === grup) - (a.grup === grup))
        .slice(0, 4);
    const b = document.createElement("section");
    b.className = "kutu";
    b.innerHTML = `<h3>Bunlar da işinize yarayabilir</h3>
        <div class="arac-izgara">${digerleri.map(a =>
            `<a class="arac-kart" href="${a.yol}"><b>${a.ad}</b><span>${a.aciklama}</span></a>`).join("")}</div>`;
    document.querySelector("main").appendChild(b);
}

// ---------- 7) Binlik ayraçlı giriş ----------
// 12500 yazınca 12.500 göstermek okunurluğu ciddi artırır.
// type="number" bunu yapamaz; o yüzden alanı metne çevirip kendimiz biçimlendiriyoruz.
function paraGirisi(idler) {
    idler.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.paraliGiris) return;
        el.dataset.paraliGiris = "1";
        el.type = "text";
        el.inputMode = "decimal";

        const bicimle = () => {
            const ham = el.value.replace(/\./g, "").replace(/[^\d,]/g, "");
            if (ham === "") { el.value = ""; return; }
            const parca = ham.split(",");
            const tam = parca[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            el.value = parca.length > 1 ? tam + "," + parca.slice(1).join("") : tam;
        };

        el.addEventListener("input", () => {
            const sonda = el.selectionStart === el.value.length;
            bicimle();
            if (sonda) el.setSelectionRange(el.value.length, el.value.length);
        });
        bicimle();
    });
}

// ---------- REKLAM ALANI ----------
// KURAL: Reklam, hesap sonucunun YANINA ya da ARASINA konmaz.
// Kullanıcı cevabını aldıktan sonra, açıklama bölümünden önce gelir.
// Sebebi: finans sayfasında sonucun yanındaki kredi/yatırım reklamı,
// bizim verdiğimiz tavsiye sanılır — güveni bitirir.
function reklamAlani() {
    const anlatim = document.querySelector(".anlatim");
    if (!anlatim) return;
    const k = document.createElement("div");
    k.className = "reklam";
    k.innerHTML = `<span class="reklam-etiket">Reklam</span>
        <div class="reklam-yuva"><ins class="adsbygoogle"
             style="display:block" data-ad-format="auto"
             data-ad-client="ca-pub-4471538043632173"
             data-full-width-responsive="true"></ins></div>`;
    anlatim.parentNode.insertBefore(k, anlatim);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
}

// Alt bilgiye gizlilik bağlantısı ekle (AdSense bunu ister, kullanıcı da hak eder)
function gizlilikBaglantisi() {
    const alt = document.querySelector("footer");
    if (!alt || alt.querySelector(".gizlilik-bag")) return;
    const p = document.createElement("p");
    p.className = "kucuk gizlilik-bag";
    p.innerHTML = `<a href="gizlilik.html">Gizlilik politikası</a> ·
        <a href="index.html">Bütün araçlar</a> ·
        Bu sitede Google AdSense reklamları gösterilir.`;
    alt.appendChild(p);
    kurulumDugmesi();
}

// ================= UYGULAMA OLARAK KURULUM =================
// Site tarayıcıdan da çalışır; isteyen telefonuna/bilgisayarına kurup
// simgesinden açabilir. Çevrimdışıyken de son açtığı sayfalar gelir.

let kurulumOlayi = null;

// Tarayıcı "bu site kurulabilir" dediğinde kendi düğmemizi gösterebilmek için
// olayı yakalayıp saklıyoruz.
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    kurulumOlayi = e;
    const b = document.getElementById("kurBtn");
    if (b) b.hidden = false;
});

window.addEventListener("appinstalled", () => {
    kurulumOlayi = null;
    const b = document.getElementById("kurBtn");
    if (b) b.hidden = true;
    try { localStorage.setItem("hesapKurulu", "1"); } catch (e) { }
});

function uygulamaKurulu() {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator.standalone) return true;   // iOS
    try { return localStorage.getItem("hesapKurulu") === "1"; } catch (e) { return false; }
}

// Alt bilgiye "Uygulama olarak kur" düğmesi ekler.
// Kurulamayan tarayıcıda (iOS Safari) düğme yerine nasıl yapılacağını anlatır.
function kurulumDugmesi() {
    const alt = document.querySelector("footer");
    if (!alt || alt.querySelector(".kurulum-serit") || uygulamaKurulu()) return;

    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const s = document.createElement("div");
    s.className = "kurulum-serit";
    s.innerHTML = `
        <span class="kurulum-yazi"><b>Telefonunuza kurun.</b>
        Simgeden tek dokunuşla açılır, internet olmadan da çalışır.</span>
        <button type="button" id="kurBtn" class="ikincil" hidden>Uygulama olarak kur</button>
        <button type="button" id="kurNasil" class="ikincil">Nasıl kurulur?</button>`;
    alt.insertBefore(s, alt.firstChild);

    document.getElementById("kurBtn").addEventListener("click", async () => {
        if (!kurulumOlayi) return;
        kurulumOlayi.prompt();
        const sonuc = await kurulumOlayi.userChoice;
        if (sonuc.outcome === "accepted") {
            try { localStorage.setItem("hesapKurulu", "1"); } catch (e) { }
        }
        kurulumOlayi = null;
        document.getElementById("kurBtn").hidden = true;
    });

    document.getElementById("kurNasil").addEventListener("click", () => {
        const yardim = document.getElementById("kurulumYardim");
        if (yardim) { yardim.hidden = !yardim.hidden; return; }
        const y = document.createElement("div");
        y.id = "kurulumYardim";
        y.className = "kurulum-yardim";
        y.innerHTML = iOS ? `
            <p><b>iPhone / iPad (Safari)</b></p>
            <ol>
                <li>Alttaki <b>Paylaş</b> düğmesine dokunun (kutudan çıkan ok).</li>
                <li>Listeyi kaydırıp <b>Ana Ekrana Ekle</b>'yi seçin.</li>
                <li><b>Ekle</b>'ye dokunun. Simge ana ekranınıza gelir.</li>
            </ol>` : `
            <p><b>Android (Chrome)</b></p>
            <ol>
                <li>Sağ üstteki <b>⋮</b> menüsüne dokunun.</li>
                <li><b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seçin.</li>
            </ol>
            <p><b>Bilgisayar (Chrome / Edge)</b></p>
            <ol>
                <li>Adres çubuğunun sağındaki <b>kurulum simgesine</b> tıklayın.</li>
                <li>Ya da menüden <b>Uygulamayı yükle</b>'yi seçin.</li>
            </ol>`;
        document.querySelector(".kurulum-serit").appendChild(y);
    });
}

// Çevrimdışı katmanını kaydet. Hata olursa site normal çalışmaya devam eder.
function cevrimdisiKur() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => { });
    });
}

cevrimdisiKur();

// ---------- Çevrimdışı uyarısı ----------
// İnternet yokken kayıtlı olmayan bir sayfaya girilirse ana sayfa açılır.
// Adres çubuğu başka sayfayı gösterdiği için kullanıcı şaşırmasın diye söylüyoruz.
function cevrimdisiUyari(aktifYol) {
    const istenen = location.pathname.split("/").pop() || "index.html";
    const yanlisSayfa = istenen !== aktifYol && istenen !== "";

    const goster = (metin, kalici) => {
        let s = document.getElementById("cevrimdisiSerit");
        if (!s) {
            s = document.createElement("div");
            s.id = "cevrimdisiSerit";
            s.className = "cevrimdisi-serit";
            s.setAttribute("role", "status");
            document.body.insertBefore(s, document.body.firstChild);
        }
        s.innerHTML = metin;
        s.hidden = false;
        if (!kalici) setTimeout(() => { s.hidden = true; }, 6000);
    };

    if (!navigator.onLine && yanlisSayfa) {
        goster('<b>İnternet yok.</b> Aradığınız sayfa daha önce açılmadığı için kaydedilmemiş — ' +
               'bunun yerine araç listesi gösteriliyor. Daha önce açtığınız araçlar çevrimdışı da çalışır.', true);
    } else if (!navigator.onLine) {
        goster('<b>İnternet yok.</b> Bu araç çevrimdışı çalışmaya devam ediyor.', true);
    }

    window.addEventListener("offline", () => goster('<b>İnternet kesildi.</b> Bu sayfa çalışmaya devam ediyor.', true));
    window.addEventListener("online", () => goster('İnternet geri geldi.', false));
}
