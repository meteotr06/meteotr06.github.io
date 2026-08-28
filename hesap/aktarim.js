/* ============================================================
   CİHAZDAN CİHAZA AKTARIM (K-49)
   ============================================================

   Veriler yalnız bu cihazda duruyor; sunucu yok. Telefondan bilgisayara
   geçmek isteyen kullanıcının tek yolu bütçesini elle yeniden yazmaktı.

   İKİ KANAL:
   · KARE KOD — küçük veri. Karşı cihaz kendi kamerasıyla okur; kod bir
     adres taşır, adres açılınca bu sayfa veriyi görür. Böylece okuyucu
     yazmamıza gerek kalmıyor (telefonun kamerası zaten okuyor).
   · DOSYA — kare koda sığmayan veri. `qrKodla` sığmayınca null döner ve
     kullanıcı dosyaya yönlendirilir. Kırpılmış bir kare kod üretmek,
     yarım bütçeyi tam gibi aktarmak olurdu.

   İKİ KURAL (ikisi de bu oturumda ölçülmüş hatalardan geliyor):
   1. DIŞARIDAN GELEN VERİ SÜZGEÇTEN GEÇER. Bu yükü bir başkası
      hazırlamış olabilir — adres paylaşılabilir bir şey. `__proto__`
      gibi anahtarlar, aşırı uzun değerler ve bilinmeyen araç yolları
      elenir. Geçmiş listesi `ARACLAR`da olmayan yolu taşıyamaz.
   2. SESSİZ YAZMA YOK. Ne geleceği ekranda gösterilir, kullanıcı
      onaylamadan hiçbir şey değişmez. Yazma TEK SEFERDE olur; yarım
      yazılmış bir ayar bırakılmaz.

   ÖZET SAYISI İMZA DEĞİLDİR. `ozetle()` bozulmayı yakalar (yanlış
   kopyalanmış adres, eksik dosya). Kötü niyetli birini durdurmaz —
   o da özeti yeniden hesaplayabilir. Kullanıcıyı koruyan şey özet
   değil, ONAY EKRANI.
   ============================================================ */

const AKTARIM_ISARET = "hesap-araclari";
const AKTARIM_BICIM = 1;              /* yük biçiminin sürümü */
const AKTARIM_EN_UZUN_DEGER = 40;     /* tek bir bütçe alanı için */
const AKTARIM_EN_COK_ALAN = 60;

/* FNV-1a 32 bit. Bozulma yakalamak için; imza için değil. */
function ozetle(metin) {
    let h = 0x811c9dc5;
    for (let i = 0; i < metin.length; i++) {
        h ^= metin.charCodeAt(i) & 0xff;
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
}

function b64Yaz(metin) {
    const b = new TextEncoder().encode(metin);
    let s = "";
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64Oku(kod) {
    let s = kod.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const ham = atob(s);
    const b = new Uint8Array(ham.length);
    for (let i = 0; i < ham.length; i++) b[i] = ham.charCodeAt(i);
    return new TextDecoder().decode(b);
}

/* ---------- Gönderen taraf ---------- */

/* Ne aktarılıyor? Cihaza ÖZGÜ olanlar bilerek dışarıda:
   `hesapKurulu` (bu cihaza kurulu mu) ve `gorulenSurum` (değişiklik
   şeridini gördü mü) — ikisi de karşı cihazda yanlış olurdu. */
function aktarimVerisi() {
    const a = (function () {
        try { return JSON.parse(localStorage.getItem("hesapAraclariAyar")) || {}; }
        catch (e) { return {}; }
    })();
    const g = (function () {
        try { return JSON.parse(localStorage.getItem("hesapGecmis")) || []; }
        catch (e) { return []; }
    })();
    const v = {};
    if (a.tema === "acik" || a.tema === "koyu") v.tema = a.tema;
    if (a.butce && Object.keys(a.butce).length) v.butce = a.butce;
    if (g.length) v.gecmis = g;
    return v;
}

/* Kullanıcıya "ne gidiyor" diye göstermek için sayılabilir özet. */
function aktarimDokumu(v) {
    const d = [];
    if (v.tema) d.push({ ad: "Görünüm tercihi", deger: v.tema === "koyu" ? "koyu tema" : "açık tema" });
    if (v.butce) d.push({ ad: "Bütçe kayıtları", deger: Object.keys(v.butce).length + " alan" });
    if (v.gecmis) d.push({ ad: "Son kullanılan araçlar", deger: v.gecmis.length + " araç" });
    return d;
}

function aktarimPaketle(v, zaman) {
    const govde = JSON.stringify(v);
    return JSON.stringify({
        u: AKTARIM_ISARET,
        s: AKTARIM_BICIM,
        t: zaman,
        k: ozetle(govde),
        v: v
    });
}
function aktarimKodu(v, zaman) { return b64Yaz(aktarimPaketle(v, zaman)); }

/* ---------- Alan taraf: ÇÖZ ve REDDET ---------- */

/* Her başarısızlık AYRI bir sebep döndürür. "Okunamadı" demek yetmez:
   kullanıcı yanlış kopyalanmış bir adresle, eski sürümden gelen bir
   dosyayla ve başka bir uygulamanın dosyasıyla aynı şeyi yapamaz.
   Hiçbir dalda YARIM yazma yok — bu işlev hiç yazmaz, yalnız okur. */
function aktarimCoz(kod) {
    if (!kod || !String(kod).trim()) return { hata: "bos", mesaj: "Okunacak bir şey yok." };
    let metin;
    try { metin = b64Oku(String(kod).trim()); }
    catch (e) {
        return { hata: "bozuk", mesaj: "Bu kod okunamadı — bağlantı eksik kopyalanmış olabilir. " +
                                       "Adresin tamamını kopyalayıp tekrar deneyin." };
    }
    let p;
    try { p = JSON.parse(metin); }
    catch (e) {
        return { hata: "bozuk", mesaj: "Kodun içeriği bozulmuş. Kare kodu yeniden okutun " +
                                       "ya da dosyayı yeniden oluşturun." };
    }
    /* BOZULMA "YABANCI" GIBI GORUNEBILIR.
       Olculdu: kodun TEK karakterini degistirmek yeterli -- cozulen metin
       hala gecerli JSON oluyor, yalniz isaret "hesaq-araclari" cikiyor.
       Kullaniciya sadece "bize ait degil" demek yanlis yola sokar:
       baglantisini yeniden kopyalamayi akil etmez. Iki ihtimal de
       soyleniyor, cunku ikisini ayirmak MUMKUN DEGIL. */
    if (!p || p.u !== AKTARIM_ISARET)
        return { hata: "yabanci", mesaj: "Bu veri Hesap Araçları'na ait değil — " +
                                         "ya da bağlantı eksik/bozuk kopyalanmış. " +
                                         "Adresin tamamını kopyalayıp tekrar deneyin." };
    if (typeof p.s !== "number" || p.s > AKTARIM_BICIM)
        return { hata: "yeni", mesaj: "Bu veri uygulamanın daha yeni bir sürümünden geliyor. " +
                                      "Bu cihazdaki uygulamayı güncelleyin." };
    if (!p.v || typeof p.v !== "object")
        return { hata: "bozuk", mesaj: "Kodun içeriği eksik." };
    if (p.k !== ozetle(JSON.stringify(p.v)))
        return { hata: "bozuk", mesaj: "Veri taşınırken bozulmuş (doğrulama tutmadı). " +
                                       "Hiçbir şey değiştirilmedi — yeniden aktarın." };
    return { veri: aktarimSuz(p.v), zaman: typeof p.t === "number" ? p.t : null };
}

/* SÜZGEÇ. Bu yükü bir başkası hazırlamış olabilir. */
function aktarimSuz(v) {
    const c = {};
    if (v.tema === "acik" || v.tema === "koyu") c.tema = v.tema;

    if (v.butce && typeof v.butce === "object" && !Array.isArray(v.butce)) {
        const b = {};
        let n = 0;
        Object.keys(v.butce).forEach(anahtar => {
            if (n >= AKTARIM_EN_COK_ALAN) return;
            /* `__proto__` / `constructor` gibi anahtarlar ve tuhaf adlar elenir */
            if (!/^[A-Za-z][A-Za-z0-9_-]{0,30}$/.test(anahtar)) return;
            /* `__proto__` duzenli ifadeye zaten takiliyor (alt cizgiyle
               basliyor) ama `constructor` ve `prototype` TAKILMIYORDU --
               kendi sinamam yakaladi. Zararsiz gorunuyorlar (duz bir
               nesnede kendi ozelligi olarak duruyorlar) ama disaridan
               gelen veride dile ait adlari hic tasimamak daha ucuz. */
            if (anahtar === "constructor" || anahtar === "prototype") return;
            const d = v.butce[anahtar];
            if (typeof d !== "string" && typeof d !== "number") return;
            const s = String(d);
            if (s.length > AKTARIM_EN_UZUN_DEGER) return;
            b[anahtar] = s;
            n++;
        });
        if (n) c.butce = b;
    }

    /* Geçmiş YALNIZ bilinen araç yollarını taşıyabilir. `ARACLAR` yoksa
       süzgeç de yok demektir: liste tümden düşürülür (kapalı tarafa hata). */
    if (Array.isArray(v.gecmis) && typeof ARACLAR !== "undefined") {
        const g = v.gecmis
            .filter(y => typeof y === "string")
            .filter(y => ARACLAR.some(a => a.yol === y))
            .slice(0, 8);
        if (g.length) c.gecmis = g;
    }
    return c;
}

/* ---------- Ne değişecek: karşılaştırma ---------- */

/* Kullanıcı onaylamadan önce TAM OLARAK neyin değişeceğini görmeli.
   "Bütçe içe aktarılacak" yetmez: hangi alan, eski değeri neydi. */
function aktarimFarki(gelen) {
    const mevcut = aktarimVerisi();
    const f = [];
    if (gelen.tema && gelen.tema !== mevcut.tema)
        f.push({ ad: "Görünüm", eski: mevcut.tema === "koyu" ? "koyu" : "açık",
                 yeni: gelen.tema === "koyu" ? "koyu" : "açık", tur: "degisecek" });

    if (gelen.butce) {
        const m = mevcut.butce || {};
        Object.keys(gelen.butce).forEach(k => {
            const eski = m[k], yeni = gelen.butce[k];
            if (eski === undefined) f.push({ ad: k, eski: "—", yeni: yeni, tur: "eklenecek" });
            else if (String(eski) !== String(yeni)) f.push({ ad: k, eski: eski, yeni: yeni, tur: "degisecek" });
        });
        /* GELMEYEN AMA BURADA OLAN alanlar da söylenir: aktarım bütçenin
           TAMAMINI değiştirir, kullanıcı burada kalan alanların silineceğini
           bilmeli. Sessiz birleştirme yok. */
        Object.keys(m).forEach(k => {
            if (!(k in gelen.butce)) f.push({ ad: k, eski: m[k], yeni: "—", tur: "silinecek" });
        });
    }
    if (gelen.gecmis)
        f.push({ ad: "Son kullanılanlar", eski: ((mevcut.gecmis || []).length) + " araç",
                 yeni: gelen.gecmis.length + " araç", tur: "degisecek" });
    return f;
}

/* ---------- Yazma: TEK SEFERDE ---------- */

/* Önce yeni hâlin tamamı bellekte kurulur, sonra bir kez yazılır.
   Alan alan yazsaydık, ortada oluşacak bir hata kullanıcıyı yarısı eski
   yarısı yeni bir bütçeyle bırakırdı — ekranda hata yok, sayı yanlış. */
function aktarimUygula(gelen) {
    let a;
    try { a = JSON.parse(localStorage.getItem("hesapAraclariAyar")) || {}; }
    catch (e) { a = {}; }

    const yeni = {};
    Object.keys(a).forEach(k => { yeni[k] = a[k]; });
    if (gelen.tema) yeni.tema = gelen.tema;
    if (gelen.butce) yeni.butce = gelen.butce;

    const metin = JSON.stringify(yeni);
    try {
        localStorage.setItem("hesapAraclariAyar", metin);
        if (gelen.gecmis) localStorage.setItem("hesapGecmis", JSON.stringify(gelen.gecmis));
    } catch (e) {
        return { hata: "yazilamadi", mesaj: "Cihazın deposu dolu ya da kapalı; " +
                                            "hiçbir değişiklik yapılamadı." };
    }
    return { tamam: true };
}
