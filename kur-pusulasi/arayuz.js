// ================= ARAYÜZ =================
// Ekranla ilgili her şey burada. Hesap yok — hesabı cekirdek.js yapar, burası sadece gösterir.

const durum = {
    ayar: ayarOku(),
    veri: null,          // { tarihler, seriler, dxy, sepet }
    madenler: {},        // { XAU: 4381.2, XAG: 65.2, BTC: 62821 }
    onsGecmis: {},       // gerçek ons geçmişi bulunabilirse
    makro: null,
    secili: "USD",
    detayKod: null,
    detayGun: 30,
    cevrimdisi: false
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// ---------- Yardımcılar ----------

function birim(kod) { return kod === "ONSALTIN" ? "$" : "₺"; }
function fiyatYaz(kod, deger, basamak) { return sayi(deger, basamak) + " " + birim(kod); }
function renkSinif(x) { return x > 0.005 ? "yukari" : x < -0.005 ? "asagi" : "notr-renk"; }
function okIsareti(x) { return x > 0.005 ? "▲" : x < -0.005 ? "▼" : "▬"; }

// Bir varlığın TL cinsinden geçmiş serisi
function seriAl(kod) {
    if (!durum.veri) return null;
    if (durum.veri.seriler[kod]) return durum.veri.seriler[kod];
    const m = MADENLER.find(x => x.kod === kod);
    if (!m) return null;
    const usdSerisi = durum.veri.seriler.USD;
    const gercekOns = durum.onsGecmis[m.kaynak];
    if (gercekOns) {
        // Gerçek ons geçmişi varsa onu kullan (en doğrusu)
        const cikti = [];
        let sonBilinen = null;
        for (let i = 0; i < durum.veri.tarihler.length; i++) {
            const ons = gercekOns[i];
            const deger = ons ? madenFiyatiHesapla(m, ons, usdSerisi[i]) : null;
            if (deger) sonBilinen = deger;
            cikti.push(deger || sonBilinen);   // boşluk varsa son bilinen fiyatı taşı
        }
        return cikti;
    }
    return madenGecmisiUret(m, durum.madenler[m.kaynak], usdSerisi);
}

function guncelFiyat(kod) {
    const s = seriAl(kod);
    if (!s || !s.length) return null;
    // Maden/kripto için anlık fiyat, kurdan daha tazedir
    const m = MADENLER.find(x => x.kod === kod);
    if (m && durum.madenler[m.kaynak]) {
        const usdSon = durum.veri.seriler.USD[durum.veri.seriler.USD.length - 1];
        return madenFiyatiHesapla(m, durum.madenler[m.kaynak], usdSon);
    }
    return s[s.length - 1];
}

function yabanciFaizAl(kod) {
    const v = varlikBul(kod);
    if (durum.ayar.yabanciFaiz && durum.ayar.yabanciFaiz[kod] !== undefined) return durum.ayar.yabanciFaiz[kod];
    if (!v) return 0;
    // faiz: null → dolar varlığı (altın, gümüş, bitcoin). Dolar faizini kullan.
    if (v.faiz === null) {
        const usd = durum.ayar.yabanciFaiz && durum.ayar.yabanciFaiz.USD !== undefined
            ? durum.ayar.yabanciFaiz.USD : varlikBul("USD").faiz;
        return usd;
    }
    return v.faiz;
}

// Tahmin ayarları. Vade verilirse o vadenin kalibrasyonu da eklenir
// (band, modelin o vadedeki gerçek hatalarından üretilsin diye).
function tahminAyari(kod, gun) {
    const ayar = {
        tlFaiz: durum.ayar.tlFaiz,
        yabanciFaiz: yabanciFaizAl(kod),
        pariteAgirlik: durum.ayar.pariteAgirlik
    };
    if (gun) {
        const s = seriAl(kod);
        if (s) {
            const anahtar = [kod, gun, ayar.tlFaiz, ayar.yabanciFaiz, ayar.pariteAgirlik,
                durum.onsGecmis[kod] ? 1 : 0].join("|");
            ayar.kalibrasyon = kalibrasyonAl(anahtar, s, gun, {
                tlFaiz: ayar.tlFaiz, yabanciFaiz: ayar.yabanciFaiz, pariteAgirlik: ayar.pariteAgirlik
            });
        }
    }
    return ayar;
}

// ---------- SVG ÇİZİM ----------

// Mini grafik (kart içindeki küçük çizgi)
function sparkline(seri, g, y, renk) {
    const temiz = seri.filter(x => x && isFinite(x)).slice(-40);
    if (temiz.length < 2) return "";
    const en = Math.min(...temiz), ek = Math.max(...temiz);
    const araliq = (ek - en) || 1;
    const noktalar = temiz.map((v, i) => {
        const px = i / (temiz.length - 1) * (g - 2) + 1;
        const py = y - 3 - (v - en) / araliq * (y - 6);
        return px.toFixed(1) + "," + py.toFixed(1);
    }).join(" ");
    const artis = temiz[temiz.length - 1] >= temiz[0];
    const c = renk || (artis ? "var(--artis)" : "var(--azalis)");
    return `<svg class="cizim"viewBox="0 0 ${g} ${y}"preserveAspectRatio="none"> <polyline points="${noktalar}"fill="none"stroke="${c}"stroke-width="1.8"stroke-linejoin="round"stroke-linecap="round"/></svg>`;
}

// Büyük grafik: geçmiş çizgi + (varsa) ileriye doğru tahmin konisi
function grafikCiz(hedef, tarihler, seri, tahminler) {
    const el = typeof hedef === "string" ? $(hedef) : hedef;
    if (!el) return;
    const G = Math.max(300, el.clientWidth || 600);
    const Y = el.clientHeight || 230;
    const solBosluk = 52, sagBosluk = 8, ustBosluk = 10, altBosluk = 22;

    const veriler = [];
    for (let i = 0; i < seri.length; i++) if (seri[i] && isFinite(seri[i])) veriler.push({ t: tarihler[i], v: seri[i] });
    if (veriler.length < 2) { el.innerHTML = '<p class="yukleniyor">Yeterli veri yok</p>'; return; }

    // Tahmin varsa eksenin sağına gelecek günleri de ekle
    const gelecek = tahminler && tahminler.length ? tahminler.slice().sort((a, b) => a.gun - b.gun) : [];
    const enUzunGun = gelecek.length ? gelecek[gelecek.length - 1].gun : 0;
    const gelecekAdim = enUzunGun ? isGunu(enUzunGun) : 0;
    const toplamNokta = veriler.length + gelecekAdim;

    let enAz = Math.min(...veriler.map(d => d.v));
    let enCok = Math.max(...veriler.map(d => d.v));
    gelecek.forEach(t => { enAz = Math.min(enAz, t.alt95); enCok = Math.max(enCok, t.ust95); });
    const pay = (enCok - enAz) * 0.08 || 1;
    enAz -= pay; enCok += pay;

    const x = (i) => solBosluk + i / (toplamNokta - 1) * (G - solBosluk - sagBosluk);
    const y = (v) => ustBosluk + (1 - (v - enAz) / (enCok - enAz)) * (Y - ustBosluk - altBosluk);

    let svg = `<svg viewBox="0 0 ${G} ${Y}"width="${G}"height="${Y}">`;

    // Yatay ızgara + fiyat etiketleri
    for (let k = 0; k <= 4; k++) {
        const v = enAz + (enCok - enAz) * k / 4;
        const py = y(v);
        svg += `<line x1="${solBosluk}"y1="${py.toFixed(1)}"x2="${G - sagBosluk}"y2="${py.toFixed(1)}"stroke="var(--cizgi)"stroke-width="1"stroke-dasharray="3 4"/>`;
        svg += `<text x="${solBosluk - 6}"y="${(py + 4).toFixed(1)}"text-anchor="end"font-size="11"fill="var(--yazi2)">${sayi(v, v > 1000 ? 0 : 2)}</text>`;
    }

    // Tahmin konisi (önce çizilir ki çizginin arkasında kalsın)
    if (gelecek.length) {
        const bas = veriler.length - 1;
        const spot = veriler[bas].v;
        const koni = (altAd, ustAd, dolgu) => {
            let ust = `${x(bas)},${y(spot)}`, alt = "";
            gelecek.forEach(t => {
                const px = x(bas + isGunu(t.gun));
                ust += ` ${px.toFixed(1)},${y(t[ustAd]).toFixed(1)}`;
            });
            for (let i = gelecek.length - 1; i >= 0; i--) {
                const t = gelecek[i];
                alt += ` ${x(bas + isGunu(t.gun)).toFixed(1)},${y(t[altAd]).toFixed(1)}`;
            }
            svg += `<polygon points="${ust}${alt} ${x(bas)},${y(spot)}"fill="${dolgu}"stroke="none"/>`;
        };
        koni("alt95", "ust95", "rgba(255,179,71,.16)");
        koni("alt68", "ust68", "rgba(255,179,71,.34)");

        let merkezYol = `M ${x(bas)} ${y(spot)}`;
        gelecek.forEach(t => { merkezYol += ` L ${x(bas + isGunu(t.gun)).toFixed(1)} ${y(t.merkez).toFixed(1)}`; });
        svg += `<path d="${merkezYol}"fill="none"stroke="var(--uyari)"stroke-width="2"stroke-dasharray="5 4"/>`;
        gelecek.forEach(t => {
            svg += `<circle cx="${x(bas + isGunu(t.gun)).toFixed(1)}"cy="${y(t.merkez).toFixed(1)}"r="3.5"fill="var(--uyari)"/>`;
        });
        svg += `<line x1="${x(bas).toFixed(1)}"y1="${ustBosluk}"x2="${x(bas).toFixed(1)}"y2="${Y - altBosluk}"stroke="var(--yazi2)"stroke-width="1"stroke-dasharray="2 3"opacity=".6"/>`;
        svg += `<text x="${(x(bas) + 4).toFixed(1)}"y="${ustBosluk + 10}"font-size="10"fill="var(--yazi2)">bugün</text>`;
    }

    // Geçmiş çizgi + altındaki dolgu
    const yol = veriler.map((d, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(" ");
    svg += `<path d="${yol} L ${x(veriler.length - 1).toFixed(1)} ${Y - altBosluk} L ${x(0).toFixed(1)} ${Y - altBosluk} Z"fill="var(--vurgu2)"opacity=".10"/>`;
    svg += `<path d="${yol}"fill="none"stroke="var(--vurgu2)"stroke-width="2"stroke-linejoin="round"/>`;

    // Tarih etiketleri (baş / orta / son)
    [0, Math.floor(veriler.length / 2), veriler.length - 1].forEach((i, k) => {
        const t = veriler[i].t;
        svg += `<text x="${x(i).toFixed(1)}"y="${Y - 6}"font-size="10"fill="var(--yazi2)"text-anchor="${k === 0 ? "start" : k === 2 ? "middle" : "middle"}">${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(2, 4)}</text>`;
    });

    svg += `</svg>`;
    el.innerHTML = svg;
}

// ---------- ÖNE ÇIKANLAR ----------
// Ana ekranda ana paranın altında sadece 3 küçük kart durur. Gerisi gizli.

function oneCikanlarCiz() {
    const ana = durum.ayar.anaPara || "USD";
    // Bilgisayarda yer bol: 5 kart. Telefonda 3 (sepet dahil) yeter.
    const adet = cihazTuru() === "pc" ? 5 : 2;
    const kodlar = ["USD", "EUR", "GRAMALTIN", "GBP", "CHF", "BILEZIK"]
        .filter(k => k !== ana).slice(0, adet);
    let html = "";

    kodlar.forEach(kod => {
        const v = varlikBul(kod);
        const s = seriAl(kod);
        if (!s) return;
        const dgs = degisimYuzde(s[s.length - 2], s[s.length - 1]);
        html += `<button class="mini-kart"data-kod="${kod}"> <span class="mk-ad">${v.ad}</span> <span class="mk-deger">${fiyatYaz(kod, guncelFiyat(kod))}</span> <span class="mk-fark ${renkSinif(dgs)}">${okIsareti(dgs)} ${yuzde(dgs)}</span> </button>`;
    });

    // Sepet kur: TCMB'nin izlediği yarı dolar + yarı euro ortalaması
    if (durum.veri.sepet) {
        const sp = durum.veri.sepet.filter(x => x);
        const dgs = degisimYuzde(sp[sp.length - 2], sp[sp.length - 1]);
        html += `<div class="mini-kart"title="Yarı dolar + yarı euro"> <span class="mk-ad">Sepet Kur</span> <span class="mk-deger">${sayi(sp[sp.length - 1], 3)} ₺</span> <span class="mk-fark ${renkSinif(dgs)}">${okIsareti(dgs)} ${yuzde(dgs)}</span> </div>`;
    }

    $("#oneCikanlar").innerHTML = html;
    $$("#oneCikanlar .mini-kart[data-kod]").forEach(b => b.onclick = () => detayAc(b.dataset.kod));
}

// ---------- ANA EKRAN UYARILARI ----------
// Faiz güncelleme hatırlatması ve tetiklenen kur alarmları burada görünür.

// Doğrulanmış TCMB Para Politikası Kurulu tarihi. Yenisi açıklanınca buraya eklenir.
const PPK_TARIHLERI = ["2026-09-10"];

function faizHatirlatmasi() {
    const bugun = isoTarih(new Date());
    const sonGuncelleme = durum.ayar.faizGuncelleme || null;

    // 1) Toplantı olmuş ama faiz hâlâ güncellenmemiş
    const gecmisPPK = PPK_TARIHLERI.filter(t => t <= bugun).sort();
    const sonPPK = gecmisPPK[gecmisPPK.length - 1];
    if (sonPPK && (!sonGuncelleme || sonGuncelleme < sonPPK)) {
        return {
            tur: "uyari",
            metin: ` <b>${tarihYaz(sonPPK)}</b> tarihinde TCMB faiz kararı vardı.
                    Tahminlerin doğru olması için politika faizini kontrol edin.`,
            dugme: "Faize git"
        };
    }

    // 2) Yaklaşan toplantı
    const yaklasan = PPK_TARIHLERI.filter(t => t > bugun).sort()[0];
    if (yaklasan) {
        const kalan = Math.round((new Date(yaklasan) - new Date(bugun)) / 86400000);
        if (kalan <= 10) {
            return {
                tur: "bilgi",
                metin: ` TCMB faiz kararı <b>${kalan} gün sonra</b> (${tarihYaz(yaklasan)}).
                        Karar sonrası faizi güncellemeyi unutmayın — tahminler buna göre değişir.`
            };
        }
    }

    // 3) Uzun süredir güncellenmemiş
    if (sonGuncelleme) {
        const gun = Math.round((new Date(bugun) - new Date(sonGuncelleme)) / 86400000);
        if (gun > 60) {
            return { tur: "bilgi", metin: ` Politika faizini <b>${gun} gündür</b> güncellemediniz. Değiştiyse tahminler sapar.` };
        }
    }
    return null;
}

function uyarilariCiz() {
    const parcalar = [];

    // Otomatik eşik uyarıları (yuvarlak seviye, sert hareket, zirve/dip, ortalama)
    (durum.otomatikUyarilar || []).forEach((u, i) => {
        parcalar.push(`<div class="uyari alarm">
            <span>${u.metin}</span>
            <button class="ikincil" data-oto-kapat="${i}">Tamam</button>
        </div>`);
    });

    // Tetiklenen alarmlar
    (durum.ayar.alarmlar || []).filter(a => a.tetiklendi && !a.okundu).forEach(a => {
        const v = varlikBul(a.kod);
        parcalar.push(`<div class="uyari alarm"> <span> <b>${v ? v.ad : a.kod}</b>, belirlediğiniz seviyenin
            ${a.yon === "ust" ? "üstüne çıktı" : "altına indi"}:
 <b>${fiyatYaz(a.kod, a.gerceklesen || a.seviye)}</b> · ${tarihYaz(a.tetiklendi)}</span> <button class="ikincil"data-alarm-oku="${a.id}">Tamam</button> </div>`);
    });

    // Faiz hatırlatması
    const fh = faizHatirlatmasi();
    if (fh) {
        parcalar.push(`<div class="uyari ${fh.tur}"> <span>${fh.metin}</span> ${fh.dugme ? `<button class="ikincil"id="faizGitBtn">${fh.dugme}</button>` : ""}
 </div>`);
    }

    // Fiyatı eskimiş fonlar
    const eskiFon = (durum.ayar.fonlar || []).filter(f => !f.guncelleme || (new Date(isoTarih(new Date())) - new Date(f.guncelleme)) / 86400000 > 14);
    if (eskiFon.length) {
        parcalar.push(`<div class="uyari bilgi"> <span> <b>${eskiFon.length} fonun</b> fiyatı 2 haftadan eski. Portföy sekmesinden güncelleyin.</span> </div>`);
    }

    $("#uyarilar").innerHTML = parcalar.join("");

    $$("[data-oto-kapat]").forEach(b => b.onclick = () => {
        durum.otomatikUyarilar.splice(parseInt(b.dataset.otoKapat, 10), 1);
        uyarilariCiz();
    });
    $$("[data-alarm-oku]").forEach(b => b.onclick = () => {
        const a = (durum.ayar.alarmlar || []).find(x => x.id === b.dataset.alarmOku);
        if (a) { a.okundu = true; ayarYaz(durum.ayar); uyarilariCiz(); alarmListeCiz(); }
    });
    const fgb = $("#faizGitBtn");
    if (fgb) fgb.onclick = () => {
        sekmeAc("sEkonomi");
        setTimeout(() => $("#faizKartlari").scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    };
}

// ---------- OTOMATİK UYARILAR ----------
// Elle alarm kurmaya gerek kalmadan, belirlenen eşikler aşılınca haber verir.

function bildirimGonder(baslik, govde, etiket) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(baslik, { body: govde, icon: "ikon-192.png", tag: etiket }); }
    catch (e) { /* bildirim engellenmişse sessizce geç */ }
}

async function bildirimIzniIste() {
    if (!("Notification" in window)) return "yok";
    if (Notification.permission === "granted") return "verildi";
    if (Notification.permission === "denied") return "reddedildi";
    try { return (await Notification.requestPermission()) === "granted" ? "verildi" : "reddedildi"; }
    catch (e) { return "reddedildi"; }
}

function otomatikUyarilariKontrolEt() {
    const a = durum.ayar.otomatik;
    if (!a || !a.acik) return [];

    durum.ayar.gorulenUyarilar = durum.ayar.gorulenUyarilar || [];
    const gorulen = new Set(durum.ayar.gorulenUyarilar);
    const yeni = [];

    (a.izlenen || ["USD"]).forEach(kod => {
        const seri = seriAl(kod);
        if (!seri) return;
        const ozet = varlikOzeti(kod, durum.veri.tarihler, seri);
        otomatikUyariUret(kod, ozet, seri, a).forEach(u => {
            if (gorulen.has(u.anahtar)) return;
            gorulen.add(u.anahtar);
            yeni.push(u);
        });
    });

    if (yeni.length) {
        // Liste şişmesin: son 200 kayıt yeter
        durum.ayar.gorulenUyarilar = Array.from(gorulen).slice(-200);
        ayarYaz(durum.ayar);
        yeni.forEach(u => bildirimGonder("Kur Pusulası", u.metin.replace(/<[^>]+>/g, ""), u.anahtar));
    }
    durum.otomatikUyarilar = (durum.otomatikUyarilar || []).concat(yeni).slice(-6);
    return yeni;
}

// ---------- KUR ALARMLARI ----------

function alarmlariKontrolEt() {
    const yeni = [];
    (durum.ayar.alarmlar || []).forEach(a => {
        if (a.tetiklendi) return;
        const fiyat = guncelFiyat(a.kod);
        if (!fiyat) return;
        const carpti = (a.yon === "ust" && fiyat >= a.seviye) || (a.yon === "alt" && fiyat <= a.seviye);
        if (carpti) { a.tetiklendi = isoTarih(new Date()); a.gerceklesen = fiyat; yeni.push(a); }
    });
    if (!yeni.length) return;
    ayarYaz(durum.ayar);

    // Telefon/masaüstü bildirimi (izin verildiyse)
    if ("Notification"in window && Notification.permission === "granted") {
        yeni.forEach(a => {
            const v = varlikBul(a.kod);
            try {
                new Notification("Kur Pusulası", {
                    body: `${v ? v.ad : a.kod} ${a.yon === "ust" ? "yükseldi" : "düştü"}: `
                        + `${sayi(a.gerceklesen)} (hedef ${sayi(a.seviye)})`,
                    icon: "ikon-192.png", tag: a.id
                });
            } catch (e) { /* bildirim engellenmişse sessizce geç */ }
        });
    }
}

function otomatikAyarCiz() {
    const a = durum.ayar.otomatik || {};
    const izlenebilir = ["USD", "EUR", "GBP", "GRAMALTIN", "BILEZIK", "GRAMGUMUS", "BITCOIN"];

    $("#otomatikAyar").innerHTML = `
        <label class="onay">
            <input type="checkbox" id="otoAcik" ${a.acik ? "checked" : ""} />
            Otomatik uyarılar açık
        </label>

        <div class="ayar-baslik" style="margin-top:14px">Hangi varlıklar izlensin?</div>
        <div class="secim-etiketleri">
            ${izlenebilir.map(k => {
                const v = varlikBul(k);
                const secili = (a.izlenen || []).includes(k);
                return `<button class="etiket-dugme ${secili ? "secili" : ""}" data-izle="${k}">${v ? v.ad : k}</button>`;
            }).join("")}
        </div>

        <div class="ayar-baslik" style="margin-top:16px">Hangi durumlarda?</div>
        ${UYARI_KURALLARI.map(k => `
            <label class="onay">
                <input type="checkbox" data-kural="${k.kod}" ${a[k.kod] ? "checked" : ""} />
                <span>${k.ad}<br><span class="not">${k.aciklama}</span></span>
            </label>
            ${k.esikli ? `<label style="margin:-4px 0 10px 30px;max-width:180px">Eşik (%)
                <input type="number" step="0.1" min="0.1" id="otoSertEsik" value="${a.sertEsik !== undefined ? a.sertEsik : k.varsayilanEsik}" />
            </label>` : ""}
        `).join("")}

        <div id="bildirimDurum" class="kucuk"></div>
        <button class="birincil" id="bildirimIzinBtn" style="width:100%;margin-top:10px">Bildirimlere izin ver</button>`;

    const kaydet = () => { ayarYaz(durum.ayar); otomatikAyarCiz(); };

    $("#otoAcik").onchange = (e) => { durum.ayar.otomatik.acik = e.target.checked; kaydet(); };

    $$("[data-izle]").forEach(b => b.onclick = () => {
        const k = b.dataset.izle;
        const liste = durum.ayar.otomatik.izlenen || [];
        durum.ayar.otomatik.izlenen = liste.includes(k) ? liste.filter(x => x !== k) : liste.concat([k]);
        kaydet();
    });

    $$("[data-kural]").forEach(c => c.onchange = () => {
        durum.ayar.otomatik[c.dataset.kural] = c.checked;
        kaydet();
    });

    const esik = $("#otoSertEsik");
    if (esik) esik.onchange = () => {
        durum.ayar.otomatik.sertEsik = Math.max(0.1, parseFloat(esik.value) || 1);
        kaydet();
    };

    // Bildirim izni durumu
    const d = $("#bildirimDurum");
    const btn = $("#bildirimIzinBtn");
    if (!("Notification" in window)) {
        d.textContent = "Bu tarayıcı bildirimleri desteklemiyor. Uyarılar yine de ekranda görünür.";
        btn.hidden = true;
    } else if (Notification.permission === "granted") {
        d.innerHTML = "Bildirim izni <b>verildi</b> — uyarılar telefon bildirimi olarak da gelir.";
        btn.hidden = true;
    } else if (Notification.permission === "denied") {
        d.innerHTML = "Bildirim izni <b>reddedilmiş</b>. Tarayıcı ayarlarından açabilirsiniz. Uyarılar yine de ekranda görünür.";
        btn.hidden = true;
    } else {
        d.textContent = "Uyarılar şimdilik sadece ekranda görünüyor.";
        btn.hidden = false;
        btn.onclick = async () => { await bildirimIzniIste(); otomatikAyarCiz(); };
    }
}

function alarmListeCiz() {
    const alarmlar = durum.ayar.alarmlar || [];
    $("#alarmSayaci").textContent = alarmlar.length ? alarmlar.length + "alarm" : "yok";
    if (!alarmlar.length) { $("#alarmListe").innerHTML = '<p class="kucuk">Henüz alarm kurmadınız.</p>'; return; }
    $("#alarmListe").innerHTML = alarmlar.map(a => {
        const v = varlikBul(a.kod);
        const fiyat = guncelFiyat(a.kod);
        const uzaklik = fiyat ? (a.seviye / fiyat - 1) * 100 : null;
        return `<div class="portfoy-satir"> <span class="bayrak">${a.tetiklendi ? "ÇAL" : "BKL"}</span> <span><b>${v ? v.ad : a.kod}</b><br> <span style="font-size:12px;color:var(--yazi2)"> ${a.yon === "ust" ? "üstüne çıkarsa" : "altına inerse"}: ${fiyatYaz(a.kod, a.seviye)}
                ${a.tetiklendi ? " · <b>gerçekleşti " + tarihYaz(a.tetiklendi) + "</b>"
                    : uzaklik !== null ? " · " + yuzde(uzaklik) + "uzakta" : ""}</span></span> <span></span> <button class="sil"data-alarm-sil="${a.id}"title="Sil"></button> </div>`;
    }).join("");
    $$("[data-alarm-sil]").forEach(b => b.onclick = () => {
        durum.ayar.alarmlar = durum.ayar.alarmlar.filter(x => x.id !== b.dataset.alarmSil);
        ayarYaz(durum.ayar); alarmListeCiz(); uyarilariCiz();
    });
}

// ---------- ANA PARA KARTI (ilk görülen şey) ----------

function anaKartCiz() {
    const kod = durum.ayar.anaPara || "USD";
    const v = varlikBul(kod);
    const s = seriAl(kod);
    if (!s) return;
    const ozet = varlikOzeti(kod, durum.veri.tarihler, s);
    const fiyat = guncelFiyat(kod);
    const vadeler = [{ g: 1, ad: "Yarın" }, { g: 7, ad: "1 Hafta" }, { g: 30, ad: "1 Ay" }];
    const tahminler = vadeler.map(x => tahminYap(s, x.g, tahminAyari(kod, x.g))).filter(Boolean);

    $("#anaKart").innerHTML = `<div class="ana-kart"> <div class="ana-ust"> <div class="ana-sol"> <div class="ana-etiket">${v.ad}</div> <div class="ana-fiyat">${fiyatYaz(kod, fiyat)}</div> <div class="ana-fark ${renkSinif(ozet.gun)}">${okIsareti(ozet.gun)} ${yuzde(ozet.gun)} bugün</div> </div> <select id="anaParaSecim"class="ana-secim"title="Ana parayı değiştir"> ${tumVarliklar().map(x => `<option value="${x.kod}" ${x.kod === kod ? "selected" : ""}>${x.bayrak}</option>`).join("")}
 </select> </div> <!-- Ek istatistikler tam genişlikte durur (dar sütunda alt satıra kayıyordu)
             ve sade modda hiç görünmez --> <div class="ana-istatistik gelismis"> <span>hafta <b class="${renkSinif(ozet.hafta)}">${yuzde(ozet.hafta)}</b></span> <span>ay <b class="${renkSinif(ozet.ay)}">${yuzde(ozet.ay)}</b></span> <span>yıl <b class="${renkSinif(ozet.yil)}">${yuzde(ozet.yil)}</b></span> </div> <div class="ana-tahminler"> ${tahminler.map((t, i) => `<div class="ana-tahmin"> <div class="atv">${vadeler[i].ad}</div> <div class="atm">${sayi(t.merkez)}</div> <div class="atf ${renkSinif(t.degisimYuzde)}">${yuzde(t.degisimYuzde)}</div> <div class="atb">${sayi(t.alt68, 2)} – ${sayi(t.ust68, 2)}</div> </div>`).join("")}
 </div> <div class="ana-alt"> <button class="ikincil"id="anaDetayBtn"> Tüm veriler</button> <button class="birincil"id="anaAnalizBtn"> Ekonomist analizi</button> </div> </div>`;

    $("#anaParaSecim").onchange = (e) => {
        durum.ayar.anaPara = e.target.value;
        ayarYaz(durum.ayar);
        anaKartCiz();
    };
    $("#anaDetayBtn").onclick = () => detayAc(kod);
    $("#anaAnalizBtn").onclick = () => {
        durum.secili = kod;
        $("#tahminVarlik").value = kod;
        sekmeAc("sTahmin");
        setTimeout(() => { const b = $(".analiz-btn"); if (b) b.click(); }, 100);
    };
}

// ---------- PİYASA SEKMESİ ----------

function piyasaCiz() {
    const arama = ($("#arama").value || "").toLocaleLowerCase("tr");
    const sirala = $("#siralama").value;

    let liste = tumVarliklar().map(v => {
        const s = seriAl(v.kod);
        if (!s || s.length < 3) return null;
        const ozet = varlikOzeti(v.kod, durum.veri.tarihler, s);
        return { v: v, s: s, ozet: ozet, fiyat: guncelFiyat(v.kod) };
    }).filter(Boolean);

    if (arama) {
        liste = liste.filter(x => x.v.ad.toLocaleLowerCase("tr").includes(arama) ||
            x.v.kod.toLocaleLowerCase("tr").includes(arama) ||
            (arama === "dolar" && x.v.kod === "USD") || (arama === "altın" && x.v.kod.includes("ALTIN")));
    }

    if (sirala === "gunArtan") liste.sort((a, b) => (b.ozet.gun || 0) - (a.ozet.gun || 0));
    else if (sirala === "gunAzalan") liste.sort((a, b) => (a.ozet.gun || 0) - (b.ozet.gun || 0));
    else if (sirala === "yilArtan") liste.sort((a, b) => (b.ozet.yil || 0) - (a.ozet.yil || 0));
    else if (sirala === "ad") liste.sort((a, b) => a.v.ad.localeCompare(b.v.ad, "tr"));

    $("#kartlar").innerHTML = liste.map(x => `
        <button class="varlik-kart"data-kod="${x.v.kod}"> <span class="bayrak">${x.v.bayrak}</span> <span> <span class="ad">${x.v.ad}</span><br> <span class="altad">ay ${yuzde(x.ozet.ay)} · yıl ${yuzde(x.ozet.yil)}</span> </span> <span> <span class="fiyat">${fiyatYaz(x.v.kod, x.fiyat)}</span><br> <span class="fark ${renkSinif(x.ozet.gun)}">${okIsareti(x.ozet.gun)} ${yuzde(x.ozet.gun)}</span> </span> ${sparkline(x.s, 84, 34)}
 </button>`).join("") || '<p class="yukleniyor">Sonuç yok</p>';

    $$("#kartlar .varlik-kart").forEach(b => b.onclick = () => detayAc(b.dataset.kod));
}

// ---------- DETAY PANELİ: "bütün veriler" ----------

function detayAc(kod) {
    durum.detayKod = kod;
    durum.detayGun = 30;
    $$("#detayAralik button").forEach(b => b.classList.toggle("aktif", b.dataset.gun === "30"));
    $("#detayArka").hidden = false;
    $("#detayPanel").hidden = false;
    document.body.style.overflow = "hidden";
    detayCiz();
}

function detayKapat() {
    $("#detayArka").hidden = true;
    $("#detayPanel").hidden = true;
    document.body.style.overflow = "";
}

function detayCiz() {
    const kod = durum.detayKod;
    const v = varlikBul(kod);
    const s = seriAl(kod);
    if (!s) return;
    const ozet = varlikOzeti(kod, durum.veri.tarihler, s);
    const fiyat = guncelFiyat(kod);

    $("#detayAd").innerHTML = `${v.ad} <span class="rozet">${kod}</span>`;
    $("#detayFiyat").textContent = fiyatYaz(kod, fiyat);
    $("#detayDegisim").innerHTML =
        `<span class="${renkSinif(ozet.gun)}">${okIsareti(ozet.gun)} ${yuzde(ozet.gun)} bugün</span> <span class="not"> · ${tarihYaz(ozet.tarih)} referans kuru</span>`;

    // Grafik (seçili aralık) + tahmin konisi
    const gun = durum.detayGun;
    const adim = gun ? Math.min(s.length, isGunu(gun)) : s.length;
    const tarihDilim = durum.veri.tarihler.slice(-adim);
    const seriDilim = s.slice(-adim);
    const tahminler = [1, 7, 30].map(g => tahminYap(s, g, tahminAyari(kod, g))).filter(Boolean);
    grafikCiz("#detayGrafik", tarihDilim, seriDilim, tahminler);

    // --- Bütün veriler ---
    const hucre = (etiket, deger, sinif) => `<div class="veri-hucre"><div class="etiket">${etiket}</div><div class="deger ${sinif || ""}">${deger}</div></div>`;

    let html = `<h3> Değişim</h3><div class="veri-izgara"> ${hucre("Bugün", yuzde(ozet.gun), renkSinif(ozet.gun))}
        ${hucre("1 hafta", yuzde(ozet.hafta), renkSinif(ozet.hafta))}
        ${hucre("1 ay", yuzde(ozet.ay), renkSinif(ozet.ay))}
        ${hucre("3 ay", yuzde(ozet.ucAy), renkSinif(ozet.ucAy))}
        ${hucre("6 ay", yuzde(ozet.altiAy), renkSinif(ozet.altiAy))}
        ${hucre("1 yıl", yuzde(ozet.yil), renkSinif(ozet.yil))}
        ${hucre("Yılbaşından", yuzde(ozet.yilBasi), renkSinif(ozet.yilBasi))}
        ${hucre("Enflasyona karşı (yıl)", yuzde(reelGetiri(ozet.yil || 0, durum.ayar.enflasyon)), renkSinif(reelGetiri(ozet.yil || 0, durum.ayar.enflasyon)))}
 </div>`;

    html += `<h3> Ortalamalar</h3><div class="veri-izgara"> ${hucre("7 günlük", fiyatYaz(kod, ozet.ort7), ozet.son > ozet.ort7 ? "yukari" : "asagi")}
        ${hucre("30 günlük", fiyatYaz(kod, ozet.ort30), ozet.son > ozet.ort30 ? "yukari" : "asagi")}
        ${hucre("90 günlük", fiyatYaz(kod, ozet.ort90), ozet.son > ozet.ort90 ? "yukari" : "asagi")}
        ${hucre("200 günlük", ozet.ort200 ? fiyatYaz(kod, ozet.ort200) : "—", ozet.ort200 && ozet.son > ozet.ort200 ? "yukari" : "asagi")}
 </div> <p class="kucuk">Fiyat ortalamanın üstündeyse yeşil: o vadede yükseliş eğilimi var demektir.</p>`;

    html += `<h3> 52 haftalık aralık</h3> <div class="bant"><div class="imlec"style="left:calc(${Math.max(0, Math.min(100, ozet.bandKonumu)).toFixed(1)}% - 2px)"></div></div> <div class="bant-etiket"><span>En düşük ${fiyatYaz(kod, ozet.enDusuk52)}</span><span>En yüksek ${fiyatYaz(kod, ozet.enYuksek52)}</span></div> <p class="kucuk">Şu an aralığın <b>%${sayi(ozet.bandKonumu, 0)}</b> seviyesinde.</p>`;

    html += `<h3> Risk ve hareket</h3><div class="veri-izgara"> ${hucre("Yıllık oynaklık", "%" + sayi(ozet.yillikOynaklik, 1))}
        ${hucre("Günlük tipik", "±%" + sayi(ozet.yillikOynaklik / Math.sqrt(IS_GUNU_YIL), 2))}
        ${hucre("En sert gün (1 yıl)", yuzde(ozet.enSertGun), renkSinif(ozet.enSertGun))}
        ${hucre("Art arda", Math.abs(ozet.ardArda) + "gün " + (ozet.ardArda > 0 ? "↑" : "↓"), renkSinif(ozet.ardArda))}
 </div>`;

    // Tahminler
    html += `<h3> Tahmin</h3><div class="tablo-sar"><table><thead><tr> <th>Vade</th><th>Merkez</th><th>Değişim</th><th>%68 aralık</th><th>%95 aralık</th></tr></thead><tbody>`;
    tahminler.forEach(t => {
        const ad = t.gun === 1 ? "Yarın" : t.gun === 7 ? "1 hafta" : "1 ay";
        html += `<tr><td>${ad}</td><td><b>${fiyatYaz(kod, t.merkez)}</b></td> <td class="${renkSinif(t.degisimYuzde)}">${yuzde(t.degisimYuzde)}</td> <td>${sayi(t.alt68)} – ${sayi(t.ust68)}</td> <td>${sayi(t.alt95)} – ${sayi(t.ust95)}</td></tr>`;
    });
    html += `</tbody></table></div>`;

    // Sürücüler
    const surucular = surucuAnalizi(kod, ozet, durum.ayar, durum.veri, durum.makro);
    html += `<h3> Kuru ne hareket ettiriyor?</h3><div class="surucu-izgara">` +
        surucular.map(s => `<div class="surucu"> <span class="sad">${s.ad}</span> <span class="sdeger ${s.yon === "yukari" ? "yukari" : s.yon === "asagi" ? "asagi" : ""}">${s.deger}</span> <span class="saciklama">${s.aciklama}</span> </div>`).join("") + `</div>`;

    html += `<button class="analiz-btn"id="detayAnalizBtn"style="margin-top:14px"> Ekonomist gibi analiz et</button> <div id="detayAnaliz"></div>`;

    html += `<div class="panel-dugmeler"> <button class="ikincil"id="tahminGitBtn"> Tahmin sekmesinde aç</button> <button class="ikincil"id="alarmKurBtn"> Bu kura alarm kur</button> </div>`;

    $("#detayVeriler").innerHTML = html;

    $("#detayAnalizBtn").onclick = () => {
        const karne = karneCikar(s, 30, tahminAyari(kod));
        const bolumler = ekonomistAnalizi(kod, ozet, tahminler, karne, durum.ayar, { sonrakiPPK: "10 Eylül 2026" });
        $("#detayAnaliz").innerHTML = analizHtml(bolumler);
        $("#detayAnaliz").scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    $("#alarmKurBtn").onclick = () => {
        detayKapat();
        sekmeAc("sPortfoy");
        $("#alarmKutu").open = true;
        $("#aVarlik").value = kod;
        // Bir sonraki yuvarlak seviyeyi öner (kolaylık olsun diye)
        const adim = fiyat > 1000 ? 100 : fiyat > 100 ? 5 : fiyat > 10 ? 1 : 0.5;
        $("#aSeviye").value = (Math.ceil(fiyat / adim) * adim).toFixed(2);
        setTimeout(() => $("#alarmKutu").scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    };
    $("#tahminGitBtn").onclick = () => {
        detayKapat();
        durum.secili = kod;
        $("#tahminVarlik").value = kod;
        sekmeAc("sTahmin");
        tahminCiz();
    };
}

function analizHtml(bolumler) {
    return bolumler.map(b => `<div class="analiz-bolum ${b.onem}"> <h4>${b.baslik}</h4> ${b.satirlar.map(s => `<p>${s}</p>`).join("")}
 </div>`).join("");
}

// ---------- TAHMİN SEKMESİ ----------

function tahminSecimDoldur() {
    const secim = $("#tahminVarlik");
    secim.innerHTML = tumVarliklar().map(v => `<option value="${v.kod}">${v.ad}</option>`).join("");
    secim.value = durum.secili;
    ["#bbVarlik", "#pVarlik", "#aVarlik"].forEach(id => {
        $(id).innerHTML = tumVarliklar().map(v => `<option value="${v.kod}">${v.bayrak} ${v.ad}</option>`).join("");
    });
}

function tahminCiz() {
    const kod = durum.secili;
    const s = seriAl(kod);
    if (!s) return;
    const ozet = varlikOzeti(kod, durum.veri.tarihler, s);
    const ayar = tahminAyari(kod);
    const vadeler = [{ g: 1, ad: "Yarın" }, { g: 7, ad: "1 Hafta Sonra" }, { g: 30, ad: "1 Ay Sonra" }];
    const tahminler = vadeler.map(x => tahminYap(s, x.g, tahminAyari(kod, x.g))).filter(Boolean);

    $("#tahminKartlar").innerHTML = tahminler.map((t, i) => `
        <div class="tahmin-kart"> <div class="vade">${vadeler[i].ad}</div> <div class="merkez">${fiyatYaz(kod, t.merkez)}</div> <div class="fark ${renkSinif(t.degisimYuzde)}">${okIsareti(t.degisimYuzde)} ${yuzde(t.degisimYuzde)} · bugün ${fiyatYaz(kod, t.spot)}</div> <div class="band-satir"><span>%68 olasılıkla</span><b>${sayi(t.alt68)} – ${sayi(t.ust68)}</b></div> <div class="band-satir"><span>%95 olasılıkla</span><b>${sayi(t.alt95)} – ${sayi(t.ust95)}</b></div> <div class="band-satir"><span>Yükselme olasılığı</span><b>%${sayi(seviyeOlasiligi(t, t.spot).ustunde, 0)}</b></div> </div>`).join("") +
        `<p class="kucuk"style="grid-column:1/-1"> Bu aralıklar, modelin <b>son ${tahminler[0].kalibreAdet || 80} tahmininde
        ne kadar yanıldığına</b> bakılarak çizildi. Piyasa uzun süredir sakin olduğu için bandlar dar.
        Beklenmedik bir haber (faiz kararı, seçim, kriz) gelirse kur bu aralığın <b>dışına çıkabilir</b>.</p>`;

    // Grafik: son 90 iş günü + koni
    const adim = Math.min(s.length, 90);
    grafikCiz("#tahminGrafik", durum.veri.tarihler.slice(-adim), s.slice(-adim), tahminler);

    // Yöntem kırılımı
    const naiveVar = tahminler.some(t => t.naiveModu);
    $("#yontemTablo").innerHTML = `<div class="tablo-sar"><table><thead><tr> <th>Vade</th><th>Faiz paritesi</th><th>Geçmiş trend</th><th>Sapma düzeltmesi</th><th>Sonuç</th></tr></thead><tbody>` +
        tahminler.map((t, i) => `<tr> <td>${vadeler[i].ad}${t.naiveModu ? ' <span class="rozet bilgi">naive</span>' : ""}</td> <td>${fiyatYaz(kod, t.parite)}</td> <td>${fiyatYaz(kod, t.trend)}</td> <td class="${renkSinif(t.sapmaDuzeltme)}">${t.sapmaDuzeltme !== undefined ? yuzde(t.sapmaDuzeltme) : "—"}</td> <td><b>${fiyatYaz(kod, t.merkez)}</b></td></tr>`).join("") +
        `</tbody></table></div> <p class="kucuk"><b>Faiz paritesi:</b> TL faizi %${sayi(durum.ayar.tlFaiz, 2)} · ${varlikBul(kod).ad} tarafı %${sayi(yabanciFaizAl(kod), 2)}.
 <b>Sapma düzeltmesi:</b> model geçmişte hep aynı yöne kaçıyorsa merkez o kadar geri çekilir —
        ölçtük, bu düzeltme dolarda hatayı neredeyse yarıya indirdi.</p>` +
        (naiveVar
            ? `<p class="kucuk"style="color:var(--uyari)"><b> Dikkat:</b> Bu varlıkta model, geçmişte
               <i>"fiyat değişmez"</i> varsayımını geçemedi (beceri %${sayi(tahminler.find(t => t.naiveModu).beceri, 0)}).
               Bu yüzden merkez tahmin olarak <b>bugünkü fiyat</b> alındı; sadece olası aralık gösteriliyor.
               Uydurma tahmin vermektense dürüst olmayı tercih ediyoruz.</p>`
            : `<p class="kucuk"style="color:var(--artis)"> Bu varlıkta model, geçmişte basit varsayımı
 <b>%${sayi(tahminler[tahminler.length - 1].beceri, 0)}</b> geçti — tahmin kullanılıyor.</p>`);

    // Model karnesi
    $("#karne").innerHTML = '<p class="yukleniyor">Geçmiş veriyle test ediliyor…</p>';
    setTimeout(() => {
        const satirlar = [1, 7, 30].map(g => karneCikar(s, g, ayar)).filter(Boolean);
        if (!satirlar.length) { $("#karne").innerHTML = '<p class="kucuk">Test için yeterli geçmiş veri yok.</p>'; return; }
        $("#karne").innerHTML = `<div class="tablo-sar"><table><thead><tr> <th>Vade</th><th>Ort. sapma</th><th>Basit tahmin</th><th>Kazanç</th><th>%68 band tuttu</th><th>Yön isabeti</th></tr></thead><tbody>` +
            satirlar.map(k => `<tr> <td>${k.gun === 1 ? "Yarın" : k.gun === 7 ? "1 hafta" : "1 ay"}</td> <td><b>%${sayi(k.ortalamaHata, 2)}</b></td> <td>%${sayi(k.naiveHata, 2)}</td> <td class="${k.iyilesme > 0 ? "yukari" : "asagi"}">${yuzde(k.iyilesme, 0)}</td> <td>${k.band68 === null ? "—" : "%" + sayi(k.band68, 0)}</td> <td>%${sayi(k.yonBasarisi, 0)}</td></tr>`).join("") +
            `</tbody></table></div> <p class="kucuk"><b>Nasıl okunur:</b> "Ort. sapma"modelin ortalama hatası. "Basit tahmin",
            <i>"fiyat aynı kalır"</i> demenin hatası. "Kazanç"pozitifse model basit varsayımdan iyi.
            "%68 band tuttu"ideal olarak <b>%68 civarında</b> olmalı — düşükse band dar, yüksekse gereksiz geniş demektir.</p> <p class="kucuk">Test ${satirlar[0].deneme} geçmiş gün üzerinde yapıldı. Band testi ayrıca dürüst olsun diye
            ilk %70 ile kurulup <b>son ${satirlar[0].testAdet} günde sınandı</b> — yani bandı hiç görmediği veriyle test ettik.</p>`;
    }, 30);

    // Senaryolar
    senaryoCiz();

    // Olasılık kutusu
    if (!$("#hedefFiyat").value) $("#hedefFiyat").value = (Math.round(ozet.son * 1.05 * 100) / 100).toFixed(2);
    olasilikHesapla();
}

function senaryoCiz() {
    const kod = durum.secili;
    const s = seriAl(kod);
    if (!s) return;
    const gun = parseInt($("#senaryoVade").value, 10);
    const t = tahminYap(s, gun, tahminAyari(kod, gun));
    if (!t) { $("#senaryoSonuc").innerHTML = '<p class="kucuk">Yeterli veri yok.</p>'; return; }

    const d = olasilikDilimleri(t);
    // Telefonda tablo dar kalıyor; her senaryo kendi satırında kart olarak gösterilir.
    const senaryoKart = (ad, deger, aciklama, vurgulu) => `<div class="senaryo ${vurgulu ? "secili" : ""}"> <div class="s-ust"> <span class="s-ad">${ad}</span> <span class="s-deger">${fiyatYaz(kod, deger)}
                <b class="${renkSinif(deger / d.spot - 1)}">${yuzde((deger / d.spot - 1) * 100)}</b></span> </div> <div class="s-aciklama">${aciklama}</div></div>`;

    let html = `<h4 style="margin:6px 0"> Olasılık dilimleri</h4> ${senaryoKart("Çok iyimser", d.yuzde5, "Kurun bundan daha düşük kalma ihtimali sadece %5.")}
        ${senaryoKart("İyimser", d.yuzde25, "Bu seviyenin altında kalma ihtimali %25.")}
        ${senaryoKart("Beklenen", d.orta, "Ortanca senaryo — yarı yarıya ihtimal.", true)}
        ${senaryoKart("Kötümser", d.yuzde75, "Bu seviyeyi aşma ihtimali %25.")}
        ${senaryoKart("Çok kötümser", d.yuzde95, "Bunu aşma ihtimali sadece %5.")}
        <p class="kucuk">Not: "iyimser"TL açısından yazıldı (düşük kur). Dövizi olan için tersi geçerlidir.</p>`;

    const olaylar = olaySenaryolari(s, kod, durum.ayar, gun);
    if (olaylar.length) {
        html += `<h4 style="margin:16px 0 6px"> Olay senaryoları</h4>` +
            olaylar.map(o => `<div class="senaryo ${o.ad.includes("Beklenen") ? "secili" : ""}"> <div class="s-ust"> <span class="s-ad">${o.ad}</span> <span class="s-deger">${fiyatYaz(kod, o.deger)}
                        <b class="${renkSinif(o.degisim)}">${yuzde(o.degisim)}</b></span> </div> <div class="s-aciklama">${o.aciklama}</div></div>`).join("");
    }
    $("#senaryoSonuc").innerHTML = html;
}

function olasilikHesapla() {
    const kod = durum.secili;
    const s = seriAl(kod);
    if (!s) return;
    const gun = parseInt($("#hedefVade").value, 10);
    const hedef = parseFloat($("#hedefFiyat").value);
    const t = tahminYap(s, gun, tahminAyari(kod, gun));
    if (!t || !hedef) { $("#olasilikSonuc").innerHTML = '<p class="kucuk">Bir hedef seviye yazın.</p>'; return; }
    const ol = seviyeOlasiligi(t, hedef);
    const vadeAd = { 1: "yarın", 7: "1 hafta içinde", 30: "1 ay içinde", 90: "3 ay içinde", 365: "1 yıl içinde" }[gun];
    $("#olasilikSonuc").innerHTML = `
        <div class="sonuc-satir"><span>${fiyatYaz(kod, hedef)} <b>üstünde</b> olma olasılığı (${vadeAd})</span><b class="yukari">%${sayi(ol.ustunde, 1)}</b></div> <div class="sonuc-satir"><span>${fiyatYaz(kod, hedef)} <b>altında</b> olma olasılığı</span><b class="asagi">%${sayi(ol.altinda, 1)}</b></div> <div class="sonuc-satir"><span>Merkezi tahmin</span><b>${fiyatYaz(kod, t.merkez)}</b></div> <p class="kucuk">Log-normal dağılım varsayımıyla, %${sayi(t.yillikOynaklik, 1)} yıllık oynaklık üzerinden hesaplandı.</p>`;
}

// ---------- FAİZ SEKMESİ ----------

function faizHesapla() {
    // Mevduat
    const bilesik = $("#mBilesik").checked;
    $("#mDonem").disabled = !bilesik;
    const m = mevduatHesapla(
        parseFloat($("#mAna").value) || 0,
        parseFloat($("#mFaiz").value) || 0,
        parseInt($("#mVade").value, 10) || 1,
        parseFloat($("#mStopaj").value) || 0,
        bilesik,
        parseInt($("#mDonem").value, 10) || 1
    );
    $("#mevduatSonuc").innerHTML = `
        <div class="sonuc-satir"><span>Brüt faiz</span><b>${paraYaz(m.brutFaiz)}</b></div> <div class="sonuc-satir"><span>Stopaj kesintisi</span><b class="asagi">−${paraYaz(m.stopaj)}</b></div> <div class="sonuc-satir"><span>Net faiz (${m.toplamGun} gün)</span><b class="yukari">${paraYaz(m.netFaiz)}</b></div> <div class="sonuc-satir buyuk"><span>Vade sonu toplam</span><b>${paraYaz(m.vadeSonu)}</b></div> <div class="sonuc-satir"><span>Yıllık net getiri oranı</span><b>${yuzdeOn(m.netYillik)}</b></div> <div class="sonuc-satir"><span>Enflasyon %${sayi(durum.ayar.enflasyon, 2)} ise reel getiri</span> <b class="${reelGetiri(m.netYillik, durum.ayar.enflasyon) > 0 ? "yukari" : "asagi"}">${yuzdeOn(reelGetiri(m.netYillik, durum.ayar.enflasyon))}</b></div>`;

    // Başabaş
    const kod = $("#bbVarlik").value;
    const s = seriAl(kod);
    if (s) {
        const spot = guncelFiyat(kod);
        const gun = parseInt($("#bbGun").value, 10) || 30;
        const bb = basabasKuru(spot, parseFloat($("#bbTlFaiz").value) || 0, parseFloat($("#bbDvFaiz").value) || 0,
            gun, parseFloat($("#bbStopaj").value) || 0);
        const t = tahminYap(s, gun, tahminAyari(kod, gun));
        let yorum = "";
        if (t) {
            const ol = seviyeOlasiligi(t, bb.kur);
            yorum = `<div class="sonuc-satir"><span>Modelin ${gun} günlük merkezi tahmini</span><b>${fiyatYaz(kod, t.merkez)}</b></div> <div class="sonuc-satir"><span>Kurun başabaşı geçme olasılığı</span><b>%${sayi(ol.ustunde, 0)}</b></div> <p class="kucuk">${ol.ustunde > 55
                    ? "Model, kurun başabaşı geçmesini daha olası buluyor — yani bu senaryoda döviz önde biter."
                    : ol.ustunde < 45
                        ? "Model, kurun başabaşın altında kalmasını daha olası buluyor — yani bu senaryoda TL mevduat önde biter."
                        : "İki seçenek neredeyse başa baş görünüyor."}
 <b>Bu bir tahmindir, tavsiye değildir.</b></p>`;
        }
        $("#basabasSonuc").innerHTML = `
            <div class="sonuc-satir"><span>Bugünkü kur</span><b>${fiyatYaz(kod, spot)}</b></div> <div class="sonuc-satir"><span>TL mevduatın ${gun} günlük net getirisi</span><b>${yuzdeOn(bb.tlGetiri)}</b></div> <div class="sonuc-satir buyuk"><span>Başabaş kur</span><b>${fiyatYaz(kod, bb.kur)}</b></div> <div class="sonuc-satir"><span>Bunun için gereken artış</span><b>${yuzde(bb.gerekliArtis)}</b></div> ${yorum}`;
    }

    // Reel getiri
    const r = reelGetiri(parseFloat($("#rNominal").value) || 0, parseFloat($("#rEnf").value) || 0);
    const anapara = 100000;
    $("#reelSonuc").innerHTML = `
        <div class="sonuc-satir buyuk"><span>Reel (gerçek) getiri</span><b class="${r > 0 ? "yukari" : "asagi"}">${yuzdeOn(r)}</b></div> <div class="sonuc-satir"><span>100.000 ₺'nin 1 yıl sonraki alım gücü</span><b>${paraYaz(anapara * (1 + r / 100))}</b></div> <p class="kucuk">${r > 0 ? "Paranız enflasyonun üstünde kazandırıyor — alım gücünüz artıyor."
            : "Nominal olarak kazanıyorsunuz ama alım gücünüz azalıyor."}</p>`;

    // Kredi
    const k = krediHesapla(parseFloat($("#kTutar").value) || 0, parseFloat($("#kFaiz").value) || 0,
        parseInt($("#kTaksit").value, 10) || 1, $("#kVergi").checked);
    $("#krediSonuc").innerHTML = `
        <div class="sonuc-satir buyuk"><span>Aylık taksit</span><b>${paraYaz(k.taksit)}</b></div> <div class="sonuc-satir"><span>Toplam ödeme</span><b>${paraYaz(k.toplamOdeme)}</b></div> <div class="sonuc-satir"><span>Toplam faiz</span><b class="asagi">${paraYaz(k.toplamFaiz)}</b></div> <div class="sonuc-satir"><span>Vergili aylık maliyet</span><b>${yuzdeOn(k.efektifAylik)}</b></div> <div class="sonuc-satir"><span>Yıllık bileşik maliyet</span><b>${yuzdeOn(k.yillikMaliyet)}</b></div>`;
}

// ---------- EKONOMİ SEKMESİ ----------

function ekonomiCiz() {
    // Faiz kartları
    const onemli = ["USD", "EUR", "GBP", "CHF", "JPY"];
    let html = `<div class="faiz-kart"> <div class="fad"> TCMB politika faizi</div> <input type="number"step="0.25"value="${durum.ayar.tlFaiz}"data-faiz="TL" /> </div> <div class="faiz-kart"> <div class="fad"> TL mevduat faizi</div> <input type="number"step="0.25"value="${durum.ayar.mevduatFaiz}"data-faiz="MEVDUAT" /> </div> <div class="faiz-kart"> <div class="fad"> Yıllık enflasyon</div> <input type="number"step="0.1"value="${durum.ayar.enflasyon}"data-faiz="ENFLASYON" /> </div>`;
    onemli.forEach(kod => {
        const v = varlikBul(kod);
        html += `<div class="faiz-kart"> <div class="fad">${v.bayrak} ${kod} faizi</div> <input type="number"step="0.25"value="${yabanciFaizAl(kod)}"data-faiz="${kod}" /> </div>`;
    });
    $("#faizKartlari").innerHTML = html;
    $$("#faizKartlari input").forEach(inp => {
        inp.onchange = () => {
            const d = inp.dataset.faiz, deger = parseFloat(inp.value) || 0;
            if (d === "TL") durum.ayar.tlFaiz = deger;
            else if (d === "MEVDUAT") durum.ayar.mevduatFaiz = deger;
            else if (d === "ENFLASYON") durum.ayar.enflasyon = deger;
            else { durum.ayar.yabanciFaiz = durum.ayar.yabanciFaiz || {}; durum.ayar.yabanciFaiz[d] = deger; }
            durum.ayar.faizGuncelleme = isoTarih(new Date());   // hatırlatıcı bunu kullanır
            ayarYaz(durum.ayar);
            uyarilariCiz();
            $("#mFaiz").value = durum.ayar.mevduatFaiz;
            $("#bbTlFaiz").value = durum.ayar.mevduatFaiz;
            $("#rEnf").value = durum.ayar.enflasyon;
            tahminCiz(); faizHesapla(); ekonomiCiz();
        };
    });

    // Makro tablo
    if (durum.makro && durum.makro.enflasyon) {
        const satir = (ad, dizi, ek) => {
            if (!dizi || !dizi.length) return "";
            const son = dizi[dizi.length - 1];
            return `<tr><td>${ad}</td><td><b>${sayi(son.deger, 2)}${ek || ""}</b></td><td>${son.yil}</td></tr>`;
        };
        $("#makroTablo").innerHTML = `<div class="tablo-sar"><table><thead><tr> <th>Gösterge</th><th>Değer</th><th>Yıl</th></tr></thead><tbody> ${satir("Enflasyon (TÜFE, yıllık ort.)", durum.makro.enflasyon, "%")}
            ${satir("Büyüme (GSYH)", durum.makro.buyume, "%")}
            ${satir("İşsizlik", durum.makro.issizlik, "%")}
            ${satir("Kişi başı gelir", durum.makro.kisiBasiGsyh, " $")}
 </tbody></table></div> <p class="kucuk">Kaynak: Dünya Bankası (yıllık, resmî). Aylık TÜİK verisinden farklı olabilir.</p>`;
        const e = durum.makro.enflasyon;
        grafikCiz("#makroGrafik", e.map(x => x.yil + "-01-01"), e.map(x => x.deger), null);
    } else {
        $("#makroTablo").innerHTML = '<p class="kucuk">Makro veri alınamadı (internet yok olabilir).</p>';
    }

    // TL performansı
    const perf = PARALAR.map(p => {
        const s = seriAl(p.kod);
        if (!s) return null;
        const o = varlikOzeti(p.kod, durum.veri.tarihler, s);
        return { p: p, yil: o.yil, tlKaybi: o.yil !== null ? (1 - 1 / (1 + o.yil / 100)) * 100 : null };
    }).filter(x => x && x.yil !== null).sort((a, b) => b.yil - a.yil).slice(0, 12);
    const enBuyuk = Math.max(...perf.map(x => Math.abs(x.yil)));
    $("#tlPerformans").innerHTML = perf.map(x => `
        <div class="sonuc-satir"> <span>${x.p.bayrak} ${x.p.ad}</span> <span style="display:flex;align-items:center;gap:8px"> <span style="display:inline-block;height:8px;border-radius:4px;background:${x.yil > 0 ? "var(--azalis)" : "var(--artis)"};width:${Math.abs(x.yil) / enBuyuk * 70}px"></span> <b class="${x.yil > 0 ? "asagi" : "yukari"}">${yuzde(x.yil)}</b> </span> </div>`).join("") +
        `<p class="kucuk">Pozitif = o para TL karşısında değer kazandı, yani TL değer kaybetti.
        TL'nin dolar karşısındaki 1 yıllık alım gücü kaybı: <b>%${sayi(perf.find(x => x.p.kod === "USD") ? perf.find(x => x.p.kod === "USD").tlKaybi : 0, 1)}</b>.</p>`;

    // Madenler
    const madenSatir = MADENLER.map(m => {
        const s = seriAl(m.kod);
        if (!s) return "";
        const o = varlikOzeti(m.kod, durum.veri.tarihler, s);
        return `<tr><td>${m.bayrak} ${m.ad}</td><td><b>${fiyatYaz(m.kod, guncelFiyat(m.kod))}</b></td> <td class="${renkSinif(o.gun)}">${yuzde(o.gun)}</td><td class="${renkSinif(o.yil)}">${yuzde(o.yil)}</td></tr>`;
    }).join("");
    const oran = durum.madenler.XAU && durum.madenler.XAG ? durum.madenler.XAU / durum.madenler.XAG : null;
    $("#madenTablo").innerHTML = `<div class="tablo-sar"><table><thead><tr> <th>Varlık</th><th>Fiyat</th><th>Gün</th><th>Yıl</th></tr></thead><tbody>${madenSatir}</tbody></table></div> ${durum.onsGecmis.XAU ? "" : `<p class="kucuk"style="color:var(--uyari)"> Altının dolar geçmişi henüz
            yüklenmedi. O yüzden aşağıdaki değişim yüzdeleri <b>yalnızca kur hareketini</b> yansıtıyor
            (altının kendi dolar fiyatı sabit varsayıldı). Birkaç saniye içinde tazelenir.</p>`}
        ${oran ? `<p class="kucuk">Altın/Gümüş oranı: <b>${sayi(oran, 1)}</b> — 1 ons altın kaç ons gümüş eder.
        Tarihsel ortalama 60-70 civarındadır; yüksek değerler gümüşün altına göre ucuz olduğuna işaret sayılır.</p>` : ""}`;

    // İzlenecekler: ücretsiz çekemediğimiz ama profesyonellerin izlediği göstergeler
    $("#izlenecekler").innerHTML = `<p class="kucuk">Bunları ücretsiz ve otomatik çekemiyoruz
        (açık veri yok). Uydurmak yerine <b>nereden bakacağınızı</b> söylüyoruz.</p>` +
        IZLENECEKLER.map(x => `<div class="analiz-bolum"> <h4>${x.ad}</h4> <p>${x.neden}</p> <p class="kucuk"> ${x.nereden} — <a href="${x.adres}"target="_blank"rel="noopener"style="color:var(--vurgu2)">bağlantı</a></p> </div>`).join("");

    // Faizin en son ne zaman güncellendiği
    $("#faizGuncelBilgi").innerHTML = durum.ayar.faizGuncelleme
        ? `Son güncelleme: <b>${tarihYaz(durum.ayar.faizGuncelleme)}</b>.`
        : `Bu oranlar varsayılan değerlerdir — doğruluğunu kontrol edip kaydedin.`;
}

// ---------- PORTFÖY ----------
// İki tür varlık var: (1) kuru otomatik gelen paralar/madenler,
// (2) fiyatı kullanıcının elle girdiği fonlar (TEFAS canlı veri açık değil).

function portfoyKalemleri() {
    const kalemler = [];
    const usdSon = durum.veri.seriler.USD[durum.veri.seriler.USD.length - 1];

    (durum.ayar.portfoy || []).forEach((x, i) => {
        const v = varlikBul(x.kod);
        if (!v) return;
        const fiyat = guncelFiyat(x.kod);
        // Ons altın dolar cinsindendir; TL'ye çevrilir
        const tlFiyat = x.kod === "ONSALTIN" ? fiyat * usdSon : fiyat;
        kalemler.push({
            tur: "varlik", dizin: i, kod: x.kod, ad: v.ad, simge: v.bayrak,
            miktar: x.miktar, fiyat: tlFiyat, alis: x.alis, deger: tlFiyat * x.miktar
        });
    });

    (durum.ayar.fonlar || []).forEach(f => {
        kalemler.push({
            tur: "fon", id: f.id, ad: f.ad, simge: "FON",
            miktar: f.miktar, fiyat: f.fiyat, alis: f.alis,
            deger: f.fiyat * f.miktar, guncelleme: f.guncelleme
        });
    });

    return kalemler;
}

function portfoyCiz() {
    const kalemler = portfoyKalemleri();
    if (!kalemler.length) {
        $("#portfoyOzet").innerHTML = "";
        $("#portfoyListe").innerHTML = '<p class="yukleniyor">Henüz varlık eklemediniz.</p>';
        return;
    }

    const renkler = ["#4dd4c0", "#7aa2ff", "#ffb347", "#ff6b6b", "#a78bfa", "#35d07f", "#f472b6", "#60a5fa"];
    let toplam = 0, toplamMaliyet = 0;
    kalemler.forEach((k, i) => {
        k.renk = renkler[i % renkler.length];
        toplam += k.deger;
        if (k.alis) toplamMaliyet += k.alis * k.miktar;
    });

    // 1 ay sonrası aralık: her varlığın kendi bandı toplanır.
    // Fonların tahmini yok (fiyat geçmişi yok) — oldukları gibi sayılır, bu ayrıca belirtilir.
    let alt = 0, ust = 0, merkez = 0, tahminsiz = 0;
    kalemler.forEach(k => {
        if (k.tur === "fon") { alt += k.deger; ust += k.deger; merkez += k.deger; tahminsiz += k.deger; return; }
        const seri = seriAl(k.kod);
        const t = seri ? tahminYap(seri, 30, tahminAyari(k.kod, 30)) : null;
        if (t) {
            const carpan = k.deger / t.spot;
            alt += t.alt68 * carpan; ust += t.ust68 * carpan; merkez += t.merkez * carpan;
        } else { alt += k.deger; ust += k.deger; merkez += k.deger; tahminsiz += k.deger; }
    });

    const usdKur = durum.veri.seriler.USD[durum.veri.seriler.USD.length - 1];
    const kar = toplamMaliyet ? toplam - toplamMaliyet : null;

    $("#portfoyOzet").innerHTML = `<div class="kutu"> <div class="sonuc-satir buyuk"><span>Toplam değer</span><b>${paraYaz(toplam)}</b></div> <div class="sonuc-satir"><span>Dolar karşılığı</span><b>${sayi(toplam / usdKur, 2)} $</b></div> ${kar !== null ? `<div class="sonuc-satir"><span>Kâr / zarar</span> <b class="${kar >= 0 ? "yukari" : "asagi"}">${paraYaz(kar)} (${yuzde(kar / toplamMaliyet * 100)})</b></div>` : ""}
        <div class="sonuc-satir"><span>1 ay sonra merkezi tahmin</span><b>${paraYaz(merkez)}</b></div> <div class="sonuc-satir"><span>1 ay sonra %68 aralık</span><b>${paraYaz(alt)} – ${paraYaz(ust)}</b></div> <div class="dagilim">${kalemler.map(k => `<div style="width:${k.deger / toplam * 100}%;background:${k.renk}"></div>`).join("")}</div> <div class="dagilim-liste">${kalemler.map(k => `<span><i style="background:${k.renk}"></i>${k.ad} %${sayi(k.deger / toplam * 100, 1)}</span>`).join("")}</div> ${tahminsiz > 0 ? `<p class="kucuk">Not: portföyün ${paraYaz(tahminsiz)} kadarlık kısmı (fonlar)
            fiyat geçmişi olmadığı için tahmine katılmadı, olduğu gibi sayıldı.</p>` : ""}
 </div>`;

    $("#portfoyListe").innerHTML = kalemler.map(k => {
        const kazanc = k.alis ? (k.fiyat / k.alis - 1) * 100 : null;
        const eski = k.tur === "fon" && (!k.guncelleme ||
            (new Date(isoTarih(new Date())) - new Date(k.guncelleme)) / 86400000 > 14);
        return `<div class="portfoy-satir"> <span class="bayrak">${k.simge}</span> <span><b>${k.ad}</b><br> <span style="font-size:12px;color:var(--yazi2)"> ${sayi(k.miktar, 4)} × ${paraYaz(k.fiyat)}
                ${k.tur === "fon" ? ` · <span class="${eski ? "asagi" : ""}">fiyat ${k.guncelleme ? tarihYaz(k.guncelleme) : "girilmedi"}</span>` : ""}
 </span></span> <span style="text-align:right"><b>${paraYaz(k.deger)}</b> ${kazanc !== null ? `<br><span class="${kazanc >= 0 ? "yukari" : "asagi"}"style="font-size:12px">${yuzde(kazanc)}</span>` : ""}</span> <button class="sil"data-sil-tur="${k.tur}"data-sil="${k.tur === "fon" ? k.id : k.dizin}"title="Sil"></button> </div> ${k.tur === "fon" ? `<div class="fon-guncelle"> <label>Yeni birim fiyat
                <input type="number"step="any"inputmode="decimal"placeholder="${sayi(k.fiyat, 4)}"data-fon-fiyat="${k.id}" /> </label> <button class="ikincil"data-fon-kaydet="${k.id}">Güncelle</button> </div>` : ""}`;
    }).join("");

    $$("#portfoyListe .sil").forEach(b => b.onclick = () => {
        if (b.dataset.silTur === "fon") {
            durum.ayar.fonlar = (durum.ayar.fonlar || []).filter(f => f.id !== b.dataset.sil);
        } else {
            durum.ayar.portfoy.splice(parseInt(b.dataset.sil, 10), 1);
        }
        ayarYaz(durum.ayar); portfoyCiz(); uyarilariCiz();
    });

    $$("[data-fon-kaydet]").forEach(b => b.onclick = () => {
        const id = b.dataset.fonKaydet;
        const kutu = document.querySelector(`[data-fon-fiyat="${id}"]`);
        const yeni = parseFloat(kutu.value);
        if (!yeni || yeni <= 0) { kutu.focus(); return; }
        const f = (durum.ayar.fonlar || []).find(x => x.id === id);
        if (f) { f.fiyat = yeni; f.guncelleme = isoTarih(new Date()); ayarYaz(durum.ayar); portfoyCiz(); uyarilariCiz(); }
    });
}

// ---------- GÖRÜNÜM AYARLARI ----------
// İki ayar var: kaç ayrıntı görünsün (sade/tam) ve hangi renk.

const RENKLER = [
    { kod: "varsayilan", ad: "Lacivert", ornek: "#1c5fd6" },
    { kod: "okyanus", ad: "Petrol", ornek: "#0a7ea4" },
    { kod: "orman", ad: "Yeşil", ornek: "#15803d" },
    { kod: "gunbatimi", ad: "Kiremit", ornek: "#c2410c" },
    { kod: "lavanta", ad: "Mor", ornek: "#7c3aed" },
    { kod: "gri", ad: "Antrasit", ornek: "#475569" }
];

// Hangi cihazdayız? Eşik 900px: bunun altı telefon/tablet, üstü bilgisayar sayılır.
function cihazTuru() { return window.innerWidth >= 900 ? "pc" : "mobil"; }

// O cihazın kendi ayarını verir
function gorunumAyari() {
    if (!durum.ayar.gorunum) durum.ayar.gorunum = { pc: { mod: "tam", renk: "varsayilan" }, mobil: { mod: "sade", renk: "varsayilan" } };
    const t = cihazTuru();
    if (!durum.ayar.gorunum[t]) durum.ayar.gorunum[t] = { mod: t === "pc" ? "tam" : "sade", renk: "varsayilan" };
    return durum.ayar.gorunum[t];
}

function gorunumUygula() {
    const g = gorunumAyari();

    // Sade mod: "gelismis"işaretli her şey gizlenir
    document.body.classList.toggle("sade", g.mod !== "tam");
    document.body.dataset.cihaz = cihazTuru();

    // Renk
    const renk = g.renk || "varsayilan";
    if (renk === "varsayilan") delete document.documentElement.dataset.renk;
    else document.documentElement.dataset.renk = renk;

    // Telefon üst çubuğunun rengi de uysun
    const zemin = getComputedStyle(document.documentElement).getPropertyValue("--zemin").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && zemin) meta.content = zemin;

    // Panel içindeki seçili işaretleri güncelle
    $$("#ayarPanel .secenek").forEach(b => b.classList.toggle("aktif", b.dataset.mod === g.mod));
    $$("#ayarPanel .renk-nokta").forEach(b => b.classList.toggle("aktif", b.dataset.renk === renk));

    // Hangi cihazın ayarını düzenlediğimizi yaz — diğeri etkilenmiyor
    const etiket = $("#ayarCihaz");
    if (etiket) {
        const pc = cihazTuru() === "pc";
        etiket.innerHTML = pc
            ? ` <b>Bilgisayar</b> görünümünü ayarlıyorsunuz. Telefonun ayarı ayrıdır.`
            : ` <b>Telefon</b> görünümünü ayarlıyorsunuz. Bilgisayarın ayarı ayrıdır.`;
    }

    // Sade moddayken gizli bir sekmede kalmayalım
    const aktifSayfa = document.querySelector(".sayfa.aktif");
    if (aktifSayfa && g.mod !== "tam" &&
        (aktifSayfa.id === "sEkonomi" || aktifSayfa.id === "sPortfoy")) {
        sekmeAc("sPiyasa");
    }
}

function ayarPaneliKur() {
    $("#renkSecenekleri").innerHTML = RENKLER.map(r => `<button class="renk-nokta"data-renk="${r.kod}"title="${r.ad}"style="background:${r.ornek}"></button>`).join("");

    $$("#ayarPanel .secenek").forEach(b => b.onclick = () => {
        gorunumAyari().mod = b.dataset.mod;   // sadece bu cihazın ayarı değişir
        ayarYaz(durum.ayar);
        gorunumUygula();
        ekraniTazele();
    });
    $$("#ayarPanel .renk-nokta").forEach(b => b.onclick = () => {
        gorunumAyari().renk = b.dataset.renk;
        ayarYaz(durum.ayar);
        gorunumUygula();
        ekraniTazele();   // grafikler renkleri değişkenden okuyor, yeniden çizilsin
    });

    $("#ayarBtn").onclick = () => {
        const p = $("#ayarPanel");
        p.hidden = !p.hidden;
        $("#ayarBtn").classList.toggle("acik", !p.hidden);
    };
}

// ---------- SEKMELER ----------

// Sekme adları ↔ adres çıpası (böylece "…/#tahmin"doğrudan tahmin sekmesini açar)
const CIPALAR = { sPiyasa: "piyasa", sTahmin: "tahmin", sFaiz: "faiz", sEkonomi: "ekonomi", sPortfoy: "portfoy" };

function sekmeAc(hedef, cipaYazma) {
    $$(".sayfa").forEach(s => s.classList.toggle("aktif", s.id === hedef));
    $$(".sekme").forEach(b => b.classList.toggle("aktif", b.dataset.hedef === hedef));
    if (!cipaYazma && CIPALAR[hedef]) {
        try { history.replaceState(null, "", "#" + CIPALAR[hedef]); } catch (e) { }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (hedef === "sTahmin") tahminCiz();
    if (hedef === "sEkonomi") ekonomiCiz();
    if (hedef === "sPortfoy") { portfoyCiz(); alarmListeCiz(); otomatikAyarCiz(); }
    if (hedef === "sFaiz") faizHesapla();
}

// ---------- VERİ YÜKLEME ----------

// Altın ve bitcoinin DOLAR cinsinden geçmişi.
// Neden CoinGecko? Ücretsiz, anahtarsız ve tarayıcıdan çağrılmasına izin veriyor (CORS açık).
// Altın için PAX Gold (PAXG) kullanılır: 1 token = 1 ons altın karşılığıdır, fiyatı altını takip eder.
// Son nokta, anlık ons fiyatına oranlanarak hizalanır ki grafikte kopukluk olmasın.
async function dolarGecmisiCek(coingeckoAdi, tarihler, anlikFiyat) {
    try {
        const y = await fetch(`https://api.coingecko.com/api/v3/coins/${coingeckoAdi}/market_chart?vs_currency=usd&days=365&interval=daily`);
        if (!y.ok) return null;
        const v = await y.json();
        if (!v.prices || v.prices.length < 100) return null;

        const harita = {};
        v.prices.forEach(p => { harita[new Date(p[0]).toISOString().slice(0, 10)] = p[1]; });

        // Bizim iş günü eksenimize oturt (o gün yoksa bir öncekini taşı)
        let sonBilinen = null;
        const dizi = tarihler.map(t => { if (harita[t]) sonBilinen = harita[t]; return sonBilinen; });

        // Anlık fiyata hizala (kaynaklar arası küçük farkı gider)
        const sonDeger = dizi.filter(x => x).pop();
        if (anlikFiyat && sonDeger) {
            const oran = anlikFiyat / sonDeger;
            return dizi.map(x => x ? x * oran : null);
        }
        return dizi;
    } catch (e) { return null; }
}

async function veriYukle(sessiz) {
    const rozet = $("#veriDurumu");
    if (!sessiz) rozet.textContent = "yükleniyor…", rozet.className = "rozet bekle";

    // Önce önbellekten göster (uygulama anında açılsın)
    const onbellek = onbellekOku();
    if (onbellek && !durum.veri) {
        durum.veri = onbellek.veri.kur;
        durum.madenler = onbellek.veri.madenler || {};
        durum.makro = onbellek.veri.makro || null;
        ekraniTazele();
        rozet.textContent = "önbellek";
    }

    try {
        const bas = gunEkle(isoTarih(new Date()), -1100);   // ~3 yıl: backtest için yeterli
        const [kur, madenler] = await Promise.all([kurGecmisiCek(bas), madenFiyatCek()]);
        durum.veri = kur;
        if (Object.keys(madenler).length) durum.madenler = madenler;

        // Makro veriyi arka planda al (gecikirse uygulama beklemesin)
        makroCek().then(m => {
            if (m && Object.keys(m).length) {
                durum.makro = m;
                if (m.enflasyon && m.enflasyon.length) {
                    const son = m.enflasyon[m.enflasyon.length - 1];
                    if (!localStorage.getItem(KAYIT_ADI)) durum.ayar.enflasyon = Math.round(son.deger * 100) / 100;
                }
                if ($("#sEkonomi").classList.contains("aktif")) ekonomiCiz();
                onbellekYaz({ kur: durum.veri, madenler: durum.madenler, makro: durum.makro });
            }
        });

        // Altın ve bitcoinin gerçek dolar geçmişi (olmazsa kur türevi seriye düşer)
        Promise.all([
            dolarGecmisiCek("pax-gold", kur.tarihler, durum.madenler.XAU),
            dolarGecmisiCek("bitcoin", kur.tarihler, durum.madenler.BTC)
        ]).then(([altin, btc]) => {
            let degisti = false;
            if (altin && altin.filter(Boolean).length > 150) { durum.onsGecmis.XAU = altin; degisti = true; }
            if (btc && btc.filter(Boolean).length > 150) { durum.onsGecmis.BTC = btc; degisti = true; }
            if (degisti) ekraniTazele();
        });

        durum.cevrimdisi = false;
        rozet.textContent = tarihYaz(kur.sonTarih);
        rozet.className = "rozet canli";
        onbellekYaz({ kur: durum.veri, madenler: durum.madenler, makro: durum.makro });
        ekraniTazele();
        cipayiUygula();
    } catch (e) {
        durum.cevrimdisi = true;
        if (durum.veri) { rozet.textContent = "çevrimdışı"; rozet.className = "rozet hata"; }
        else {
            rozet.textContent = "bağlantı yok"; rozet.className = "rozet hata";
            $("#kartlar").innerHTML = `<p class="yukleniyor">İnternet bağlantısı kurulamadı.<br> Bağlanınca  düğmesine basın.</p>`;
        }
    }
}

// Adresteki çıpayı uygula: "#tahmin"sekmeyi açar, "#detay=USD"varlık panelini açar
function cipayiUygula() {
    const cipa = (location.hash || "").replace("#", "");
    if (!cipa) return;
    if (cipa.startsWith("detay=")) {
        const kod = cipa.slice(6).toUpperCase();
        if (varlikBul(kod)) detayAc(kod);
        return;
    }
    const hedef = Object.keys(CIPALAR).find(k => CIPALAR[k] === cipa);
    if (hedef) sekmeAc(hedef, true);
}

// Cihaz değiştiyse (pencere büyütüldü/küçültüldü, telefon döndürüldü) o cihazın
// ayarına geç. Olaylara güvenmiyoruz: bazı tarayıcılarda resize/matchMedia
// tetiklenmeyebiliyor — bu yüzden her çizimde sessizce kontrol ediyoruz.
let _sonCihaz = null;
function cihazKontrol() {
    const t = cihazTuru();
    if (t === _sonCihaz) return;
    _sonCihaz = t;
    gorunumUygula();
}

function ekraniTazele() {
    if (!durum.veri) return;
    cihazKontrol();
    oneCikanlarCiz();
    anaKartCiz();
    alarmlariKontrolEt();
    otomatikUyarilariKontrolEt();
    uyarilariCiz();
    if (!$("#tumListe").hidden) piyasaCiz();
    if ($("#sTahmin").classList.contains("aktif")) tahminCiz();
    if ($("#sEkonomi").classList.contains("aktif")) ekonomiCiz();
    if ($("#sPortfoy").classList.contains("aktif")) portfoyCiz();
    if (durum.detayKod && !$("#detayPanel").hidden) detayCiz();
}

// ---------- BAŞLANGIÇ ----------

function baslat() {
    // Tema
    document.documentElement.dataset.tema = durum.ayar.tema;
    $("#temaBtn").textContent = durum.ayar.tema === "koyu" ? "◑" : "◐";
    $("#temaBtn").onclick = () => {
        durum.ayar.tema = durum.ayar.tema === "koyu" ? "acik" : "koyu";
        document.documentElement.dataset.tema = durum.ayar.tema;
        $("#temaBtn").textContent = durum.ayar.tema === "koyu" ? "◑" : "◐";
        ayarYaz(durum.ayar);
        gorunumUygula();
        ekraniTazele();
    };

    // Görünüm ayarları (sade/tam + renk)
    ayarPaneliKur();
    gorunumUygula();

    // Sekmeler
    $$(".sekme").forEach(b => b.onclick = () => sekmeAc(b.dataset.hedef));

    // Piyasa — tüm liste varsayılan olarak KAPALI (ana ekran sade kalsın)
    $("#arama").oninput = piyasaCiz;
    $("#siralama").onchange = piyasaCiz;
    $("#yenileBtn").onclick = () => veriYukle(false);

    $("#tumunuAcBtn").onclick = () => {
        const liste = $("#tumListe");
        const acik = liste.hidden;
        liste.hidden = !acik;
        $("#tumunuAcBtn").textContent = acik ? "▴ Listeyi gizle" : "▾ Tüm paralar, altın ve kripto";
        $("#tumunuAcBtn").classList.toggle("acik", acik);
        if (acik) piyasaCiz();
    };

    // Katlanır kutular: içinde grafik varsa açılınca yeniden çizilmeli
    // (kapalıyken genişliği 0'dır, o yüzden grafik boş çıkar)
    $$("details.katlanir").forEach(d => {
        d.addEventListener("toggle", () => {
            if (!d.open) return;
            if (d.dataset.cizim === "makro" && durum.makro) ekonomiCiz();
        });
    });

    // Alarm ekle
    $("#aEkleBtn").onclick = async () => {
        const kod = $("#aVarlik").value;
        const seviye = parseFloat($("#aSeviye").value);
        if (!seviye || seviye <= 0) { $("#aSeviye").focus(); return; }
        durum.ayar.alarmlar = durum.ayar.alarmlar || [];
        durum.ayar.alarmlar.push({
            id: "a" + Date.now(), kod: kod, seviye: seviye, yon: $("#aYon").value,
            kurulum: isoTarih(new Date())
        });
        ayarYaz(durum.ayar);
        $("#aSeviye").value = "";
        // Bildirim izni: kullanıcı düğmeye bastığı için tam zamanı
        if ("Notification"in window && Notification.permission === "default") {
            try { await Notification.requestPermission(); } catch (e) { }
        }
        alarmListeCiz(); alarmlariKontrolEt(); uyarilariCiz();
    };

    // Fon / özel varlık ekle
    $("#fEkleBtn").onclick = () => {
        const ad = ($("#fAd").value || "").trim();
        const miktar = parseFloat($("#fMiktar").value);
        const fiyat = parseFloat($("#fFiyat").value);
        const alis = parseFloat($("#fAlis").value);
        if (!ad) { $("#fAd").focus(); return; }
        if (!miktar || miktar <= 0) { $("#fMiktar").focus(); return; }
        if (!fiyat || fiyat <= 0) { $("#fFiyat").focus(); return; }
        durum.ayar.fonlar = durum.ayar.fonlar || [];
        durum.ayar.fonlar.push({
            id: "f" + Date.now(), ad: ad, miktar: miktar, fiyat: fiyat,
            alis: isFinite(alis) ? alis : null, guncelleme: isoTarih(new Date())
        });
        ayarYaz(durum.ayar);
        $("#fAd").value = ""; $("#fMiktar").value = ""; $("#fFiyat").value = ""; $("#fAlis").value = "";
        portfoyCiz(); uyarilariCiz();
    };

    // Detay paneli
    $("#detayKapat").onclick = detayKapat;
    $("#detayArka").onclick = detayKapat;
    document.addEventListener("keydown", e => { if (e.key === "Escape") detayKapat(); });
    $$("#detayAralik button").forEach(b => b.onclick = () => {
        durum.detayGun = parseInt(b.dataset.gun, 10);
        $$("#detayAralik button").forEach(x => x.classList.toggle("aktif", x === b));
        detayCiz();
    });

    // Tahmin
    tahminSecimDoldur();
    $("#tahminVarlik").onchange = () => { durum.secili = $("#tahminVarlik").value; $("#hedefFiyat").value = ""; tahminCiz(); };
    $("#agirlik").oninput = () => {
        durum.ayar.pariteAgirlik = parseInt($("#agirlik").value, 10);
        $("#agirlikDeger").textContent = durum.ayar.pariteAgirlik + "%";
        ayarYaz(durum.ayar);
        tahminCiz();
    };
    $("#agirlik").value = durum.ayar.pariteAgirlik;
    $("#agirlikDeger").textContent = durum.ayar.pariteAgirlik + "%";
    $("#hedefFiyat").oninput = olasilikHesapla;
    $("#hedefVade").onchange = olasilikHesapla;
    $("#senaryoVade").onchange = senaryoCiz;

    // Tek tuş ekonomist analizi (tahmin sekmesinin en üstüne eklenir)
    const analizBtn = document.createElement("button");
    analizBtn.className = "analiz-btn";
    analizBtn.textContent = "Tek tuşla ekonomist analizi";
    analizBtn.onclick = () => {
        const kod = durum.secili;
        const s = seriAl(kod);
        if (!s) return;
        analizBtn.textContent = "hesaplanıyor…";
        setTimeout(() => {
            const ozet = varlikOzeti(kod, durum.veri.tarihler, s);
            const tahminler = [1, 7, 30].map(g => tahminYap(s, g, tahminAyari(kod, g))).filter(Boolean);
            const karne = karneCikar(s, 30, tahminAyari(kod));
            const bolumler = ekonomistAnalizi(kod, ozet, tahminler, karne, durum.ayar, { sonrakiPPK: "10 Eylül 2026" });
            const surucular = surucuAnalizi(kod, ozet, durum.ayar, durum.veri, durum.makro);
            $("#analizSonuc").innerHTML = analizHtml(bolumler) +
                `<h4 style="margin-top:16px"> Sürücü göstergeler</h4><div class="surucu-izgara">` +
                surucular.map(x => `<div class="surucu"> <span class="sad">${x.ad}</span> <span class="sdeger ${x.yon === "yukari" ? "yukari" : x.yon === "asagi" ? "asagi" : ""}">${x.deger}</span> <span class="saciklama">${x.aciklama}</span></div>`).join("") + `</div>`;
            analizBtn.textContent = "Tek tuşla ekonomist analizi";
        }, 20);
    };
    const analizKutu = document.createElement("div");
    analizKutu.className = "kutu";
    analizKutu.id = "analizSonuc";
    const tahminSayfa = $("#sTahmin");
    tahminSayfa.insertBefore(analizBtn, $("#tahminKartlar"));
    tahminSayfa.appendChild(analizKutu);
    analizKutu.innerHTML = `<p class="kucuk">Yukarıdaki düğmeye basınca; trend, oynaklık, faiz farkı,
        enflasyon ve model karnesi birlikte okunup <b>insan diliyle</b> yorumlanır.</p>`;

    // Faiz sekmesi: her değişiklikte anında hesapla
    ["#mAna", "#mFaiz", "#mVade", "#mStopaj", "#mBilesik", "#mDonem",
        "#bbVarlik", "#bbTlFaiz", "#bbDvFaiz", "#bbGun", "#bbStopaj",
        "#rNominal", "#rEnf", "#kTutar", "#kFaiz", "#kTaksit", "#kVergi"].forEach(id => {
            const el = $(id);
            el.oninput = faizHesapla;
            el.onchange = faizHesapla;
        });
    $("#mFaiz").value = durum.ayar.mevduatFaiz;
    $("#bbTlFaiz").value = durum.ayar.mevduatFaiz;
    $("#rEnf").value = durum.ayar.enflasyon;
    $("#rNominal").value = durum.ayar.mevduatFaiz;

    // Portföy
    $("#pEkleBtn").onclick = () => {
        const kod = $("#pVarlik").value;
        const miktar = parseFloat($("#pMiktar").value);
        const alis = parseFloat($("#pAlis").value);
        if (!miktar || miktar <= 0) { $("#pMiktar").focus(); return; }
        durum.ayar.portfoy = durum.ayar.portfoy || [];
        durum.ayar.portfoy.push({ kod: kod, miktar: miktar, alis: isFinite(alis) ? alis : null });
        ayarYaz(durum.ayar);
        $("#pMiktar").value = ""; $("#pAlis").value = "";
        portfoyCiz();
    };

    // Ekran döndürülünce / boyut değişince grafikleri yeniden çiz
    // Bilgisayar <-> telefon sınırı geçilince o cihazın KENDİ ayarına dön.
    // Neden matchMedia? "resize"olayı her tarayıcıda güvenilir tetiklenmiyor;
    // eşik değişimini dinlemenin doğru yolu bu (ölçtük, resize ile çalışmıyordu).
    const genisSorgu = window.matchMedia("(min-width: 900px)");
    const cihazDegisti = () => { gorunumUygula(); ekraniTazele(); };
    if (genisSorgu.addEventListener) genisSorgu.addEventListener("change", cihazDegisti);
    else if (genisSorgu.addListener) genisSorgu.addListener(cihazDegisti);   // eski tarayıcılar

    // Boyut değişince grafikler yeniden çizilsin (genişliğe göre çiziliyorlar)
    let zamanlayici;
    window.addEventListener("resize", () => {
        clearTimeout(zamanlayici);
        zamanlayici = setTimeout(ekraniTazele, 200);
    });

    // "Ana ekrana ekle"daveti
    let kurulumOlayi = null;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); kurulumOlayi = e;
        $("#kurBtn").hidden = false;
        $("#kurBtn").onclick = async () => { kurulumOlayi.prompt(); $("#kurBtn").hidden = true; };
    });

    if ("serviceWorker"in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => { });
    }

    veriYukle(false);
}

document.addEventListener("DOMContentLoaded", baslat);
