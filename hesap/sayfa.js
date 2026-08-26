// ================= SAYFA YARDIMCILARI =================
// Her araç sayfasının ortak parçaları: üst bar, alt bilgi, tema, sayı kutuları.
// Hesap yok — hesap hesap.js'de. Burada sadece ekran işi var.

const ARACLAR = [
    { yol: "net-maas-hesaplama.html", ad: "Net Maaş", aciklama: "Brütten nete, 12 ayın tamamı", grup: "Maaş ve Çalışma" },
    { yol: "butce-hesaplama.html", ad: "Bütçe", aciklama: "Gelir, gider ve kalanla ne yapılır", grup: "Ev ve Yaşam" },
    { yol: "kidem-tazminati-hesaplama.html", ad: "Kıdem Tazminatı", aciklama: "Kıdem + ihbar, tavan dahil", grup: "Maaş ve Çalışma" },
    { yol: "kredi-hesaplama.html", ad: "Kredi Taksiti", aciklama: "Aylık taksit ve ödeme planı", grup: "Kredi ve Borç" },
    { yol: "mevduat-faizi-hesaplama.html", ad: "Mevduat Faizi", aciklama: "Vade sonu net getiri", grup: "Birikim" },
    { yol: "kdv-hesaplama.html", ad: "KDV", aciklama: "Dahil / hariç ayırma", grup: "Ticaret" },
    { yol: "yakit-maliyeti-hesaplama.html", ad: "Yakıt Maliyeti", aciklama: "Yol kaç lira tutar", grup: "Ev ve Yaşam" },
    { yol: "elektrik-tuketimi-hesaplama.html", ad: "Elektrik Tüketimi", aciklama: "Cihaz ayda kaç lira", grup: "Ev ve Yaşam" },
    { yol: "yuzde-hesaplama.html", ad: "Yüzde Hesaplama", aciklama: "İndirim, zam, değişim", grup: "Genel" },
    { yol: "tarih-hesaplama.html", ad: "Tarih ve Yaş", aciklama: "İki tarih arası, yaş", grup: "Genel" },
    { yol: "vade-farki-hesaplama.html", ad: "Vade Farkı", aciklama: "Peşin mi taksit mi", grup: "Kredi ve Borç" },
    { yol: "vucut-kitle-indeksi-hesaplama.html", ad: "Vücut Kitle İndeksi", aciklama: "BKİ ve ideal kilo", grup: "Sağlık" },
    { yol: "kalori-ihtiyaci-hesaplama.html", ad: "Kalori İhtiyacı", aciklama: "Günlük kalori ve hedefler", grup: "Sağlık" },
    { yol: "net-hesaplama.html", ad: "Sınav Neti", aciklama: "Doğru, yanlış, net", grup: "Genel" },
    { yol: "kredi-karti-asgari-odeme-hesaplama.html", ad: "Kart Asgari Ödeme", aciklama: "Borç kaç ayda biter", grup: "Kredi ve Borç" },
    { yol: "maas-zammi-hesaplama.html", ad: "Maaş Zammı", aciklama: "Zam enflasyonu karşıladı mı", grup: "Maaş ve Çalışma" },
    { yol: "altin-hesaplama.html", ad: "Altın Hesaplama", aciklama: "Çeyrek, gram, ayar", grup: "Birikim" },
    { yol: "kira-artisi-hesaplama.html", ad: "Kira Artışı", aciklama: "Yasal üst sınır (TÜFE)", grup: "Ev ve Yaşam" },
    { yol: "birikim-hesaplama.html", ad: "Birikim", aciklama: "Bileşik getiri ve reel karşılık", grup: "Birikim" },
    { yol: "ne-kadar-kredi-cekebilirim.html", ad: "Kredi Limiti", aciklama: "Gelire göre çekilebilir tutar", grup: "Kredi ve Borç" },
    { yol: "fazla-mesai-hesaplama.html", ad: "Fazla Mesai", aciklama: "Saat ücreti ve 1,5 kat", grup: "Maaş ve Çalışma" },
    { yol: "yillik-izin-hesaplama.html", ad: "Yıllık İzin", aciklama: "Kaç gün, ne kadar ücret", grup: "Maaş ve Çalışma" },
    { yol: "issizlik-maasi-hesaplama.html", ad: "İşsizlik Maaşı", aciklama: "Tutar ve süre", grup: "Maaş ve Çalışma" }
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
}

// ---------- Sonuç satırları ----------

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
}
