/* ============================================================
   KARE KOD (QR) — kendi çizdiğimiz kodlayıcı
   ============================================================

   NEDEN KÜTÜPHANE YOK: sayfa hiçbir dış adrese bağlanmıyor; bir
   kütüphane çekmek hem ağırlık hem de kullanıcının verisini üçüncü
   bir tarafa açık hâle getirme riski. Aktarımın konusu KİŞİSEL
   BÜTÇE — dışarıya çıkmaması gereken tam da bu.

   NASIL DOĞRULANDI: kodlayıcının çizdiği matris, Python `qrcode`
   kütüphanesinin aynı girdi için çizdiğiyle modül modül
   karşılaştırıldı (`sinama_kare_kod.py`). Kendi kendini onaylayan
   sınama değil — dışarıdan bağımsız hakem.

   SINIR: yalnız bayt kipi, yalnız düzeltme seviyesi M, en çok
   sürüm 27 (1125 bayt). Sığmayan veri kare koda DEĞİL dosyaya
   gider; `qrKodla` null döner ve çağıran bunu ele almak zorunda.
   ============================================================ */

/* [ [[blokSayisi, toplamKodSozcugu, veriKodSozcugu], ...], [hizalamaMerkezleri] ]
   Ezberden yazılmadı: Python `qrcode` tablolarından üretildi. */
const QR_TABLO = [
  /* v1  */ [[[1,26,16]], []],
  /* v2  */ [[[1,44,28]], [6,18]],
  /* v3  */ [[[1,70,44]], [6,22]],
  /* v4  */ [[[2,50,32]], [6,26]],
  /* v5  */ [[[2,67,43]], [6,30]],
  /* v6  */ [[[4,43,27]], [6,34]],
  /* v7  */ [[[4,49,31]], [6,22,38]],
  /* v8  */ [[[2,60,38],[2,61,39]], [6,24,42]],
  /* v9  */ [[[3,58,36],[2,59,37]], [6,26,46]],
  /* v10 */ [[[4,69,43],[1,70,44]], [6,28,50]],
  /* v11 */ [[[1,80,50],[4,81,51]], [6,30,54]],
  /* v12 */ [[[6,58,36],[2,59,37]], [6,32,58]],
  /* v13 */ [[[8,59,37],[1,60,38]], [6,34,62]],
  /* v14 */ [[[4,64,40],[5,65,41]], [6,26,46,66]],
  /* v15 */ [[[5,65,41],[5,66,42]], [6,26,48,70]],
  /* v16 */ [[[7,73,45],[3,74,46]], [6,26,50,74]],
  /* v17 */ [[[10,74,46],[1,75,47]], [6,30,54,78]],
  /* v18 */ [[[9,69,43],[4,70,44]], [6,30,56,82]],
  /* v19 */ [[[3,70,44],[11,71,45]], [6,30,58,86]],
  /* v20 */ [[[3,67,41],[13,68,42]], [6,34,62,90]],
  /* v21 */ [[[17,68,42]], [6,28,50,72,94]],
  /* v22 */ [[[17,74,46]], [6,26,50,74,98]],
  /* v23 */ [[[4,75,47],[14,76,48]], [6,30,54,78,102]],
  /* v24 */ [[[6,73,45],[14,74,46]], [6,28,54,80,106]],
  /* v25 */ [[[8,75,47],[13,76,48]], [6,32,58,84,110]],
  /* v26 */ [[[19,74,46],[4,75,47]], [6,30,58,86,114]],
  /* v27 */ [[[22,73,45],[3,74,46]], [6,34,62,90,118]]
];

/* ---------- GF(256), indirgeme polinomu x^8+x^4+x^3+x^2+1 ---------- */
const QR_USS = new Uint8Array(512), QR_LOG = new Uint8Array(256);
(function () {
    let x = 1;
    for (let i = 0; i < 255; i++) { QR_USS[i] = x; QR_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (let i = 255; i < 512; i++) QR_USS[i] = QR_USS[i - 255];
})();
function qrCarp(a, b) { return (a === 0 || b === 0) ? 0 : QR_USS[QR_LOG[a] + QR_LOG[b]]; }

function qrUretici(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
        const y = new Array(g.length + 1).fill(0);
        for (let j = 0; j < g.length; j++) { y[j] ^= g[j]; y[j + 1] ^= qrCarp(g[j], QR_USS[i]); }
        g = y;
    }
    return g;
}

/* Reed-Solomon: veri kodsözcüklerinin düzeltme kodsözcükleri */
function qrDuzeltme(veri, adet) {
    const g = qrUretici(adet), kalan = new Uint8Array(adet);
    for (let i = 0; i < veri.length; i++) {
        const etken = veri[i] ^ kalan[0];
        kalan.copyWithin(0, 1); kalan[adet - 1] = 0;
        if (etken !== 0) for (let j = 0; j < adet; j++) kalan[j] ^= qrCarp(g[j + 1], etken);
    }
    return kalan;
}

/* ---------- Veri kodsözcükleri ---------- */
function qrBloklar(v) {
    const cikti = [];
    QR_TABLO[v - 1][0].forEach(function (s) {
        for (let i = 0; i < s[0]; i++) cikti.push({ toplam: s[1], veri: s[2] });
    });
    return cikti;
}
function qrVeriKapasitesi(v) { return qrBloklar(v).reduce((t, b) => t + b.veri, 0); }

function qrKodSozcukleri(baytlar, v) {
    const bloklar = qrBloklar(v), kapasite = qrVeriKapasitesi(v);
    const sayacBiti = v >= 10 ? 16 : 8;
    const bitler = [];
    const yaz = (deger, uzunluk) => { for (let i = uzunluk - 1; i >= 0; i--) bitler.push((deger >>> i) & 1); };
    yaz(4, 4);                       /* bayt kipi */
    yaz(baytlar.length, sayacBiti);
    baytlar.forEach(b => yaz(b, 8));
    for (let i = 0; i < 4 && bitler.length < kapasite * 8; i++) bitler.push(0);
    while (bitler.length % 8 !== 0) bitler.push(0);

    const veri = [];
    for (let i = 0; i < bitler.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | bitler[i + j];
        veri.push(b);
    }
    const DOLGU = [0xEC, 0x11];
    for (let i = 0; veri.length < kapasite; i++) veri.push(DOLGU[i % 2]);

    /* Bloklara böl, düzeltme hesapla, ARDIŞIK DEĞİL ÇAPRAZ diz.
       Çapraz dizim standardın gereği: bir leke tek bloğu değil, her
       bloktan birer kodsözcüğü bozar; böylece hepsi kurtarılabilir. */
    let p = 0;
    const vb = [], eb = [];
    bloklar.forEach(b => {
        const parca = veri.slice(p, p + b.veri); p += b.veri;
        vb.push(parca);
        eb.push(qrDuzeltme(parca, b.toplam - b.veri));
    });
    const sonuc = [];
    const enUzunV = Math.max.apply(null, vb.map(x => x.length));
    for (let i = 0; i < enUzunV; i++) vb.forEach(x => { if (i < x.length) sonuc.push(x[i]); });
    const enUzunE = Math.max.apply(null, eb.map(x => x.length));
    for (let i = 0; i < enUzunE; i++) eb.forEach(x => { if (i < x.length) sonuc.push(x[i]); });
    return sonuc;
}

/* ---------- İskelet: işlev desenleri ---------- */
function qrIskelet(v) {
    const n = v * 4 + 17;
    const mod = new Uint8Array(n * n), rez = new Uint8Array(n * n);
    const koy = (r, c, d) => {
        if (r < 0 || c < 0 || r >= n || c >= n) return;
        mod[r * n + c] = d; rez[r * n + c] = 1;
    };

    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(k => {
        for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
            const ic = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                       (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                       (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            koy(k[0] + r, k[1] + c, ic ? 1 : 0);
        }
    });
    for (let i = 8; i < n - 8; i++) {
        koy(6, i, i % 2 === 0 ? 1 : 0);
        koy(i, 6, i % 2 === 0 ? 1 : 0);
    }

    /* Hizalama desenleri. YALNIZ ÜÇ KÖŞE atlanır — bulucularla çakışan
       kombinasyonlar. "Yer dolu mu" diye bakmak YANLIŞ olurdu: (6,22)
       gibi meşru merkezler zamanlama çizgisinin üstünde oturur ve
       elenirdi; kod v7'den itibaren sessizce bozulurdu. */
    const ap = QR_TABLO[v - 1][1], son = ap.length - 1;
    ap.forEach((r0, i) => ap.forEach((c0, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === son) || (i === son && j === 0)) return;
        for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++)
            koy(r0 + r, c0 + c, Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0);
    }));

    koy(n - 8, 8, 1);                                   /* koyu modül */
    /* Biçim bilgisi alanı ayrılıyor. `i === 6` ATLANIR: (6,8) ve (8,6)
       ZAMANLAMA çizgisine aittir, biçim bitleri oraya yazılmaz. Atlanmazsa
       az önce konan zamanlama modülü sıfırlanır — kod hâlâ kare kod gibi
       görünür ama hiçbir okuyucu çözemez. (Ölçüldü: hakemle karşılaştırma
       9 girdinin 9'unda da tam bu noktada ayrıldı.) */
    for (let i = 0; i < 9; i++) { if (i === 6) continue; koy(8, i, 0); koy(i, 8, 0); }
    for (let i = 0; i < 8; i++) { koy(8, n - 1 - i, 0); koy(n - 1 - i, 8, 0); }
    if (v >= 7) for (let i = 0; i < 18; i++) {
        koy(Math.floor(i / 3), i % 3 + n - 11, 0);
        koy(i % 3 + n - 11, Math.floor(i / 3), 0);
    }
    return { n: n, mod: mod, rez: rez };
}

const QR_MASKELER = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
];

/* Ceza kuralları AYRI AYRI yazıldı: toplam hakemle tutmayınca "bir yerde
   ayrıldık" demek yetmiyor, hangi kuralda ayrıldığı ölçülebilmeli. */
function qrCeza1(mod, n) {                 /* art arda aynı renk */
    const al = (r, c) => mod[r * n + c];
    let puan = 0;
    for (let yon = 0; yon < 2; yon++)
        for (let a = 0; a < n; a++) {
            let say = 1, onceki = -1;
            for (let b = 0; b < n; b++) {
                const d = yon === 0 ? al(a, b) : al(b, a);
                if (d === onceki) { say++; if (say === 5) puan += 3; else if (say > 5) puan++; }
                else { onceki = d; say = 1; }
            }
        }
    return puan;
}
function qrCeza2(mod, n) {                 /* 2x2 aynı renk */
    const al = (r, c) => mod[r * n + c];
    let puan = 0;
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
        const d = al(r, c);
        if (d === al(r, c + 1) && d === al(r + 1, c) && d === al(r + 1, c + 1)) puan += 3;
    }
    return puan;
}
/* 3: bulucuya benzeyen 1:1:3:1:1 dizisi, bir yanında 4 modül açıklık.
   ISO/IEC 18004'teki iki desen: 10111010000 ve 00001011101. */
function qrCeza3(mod, n) {
    const al = (r, c) => mod[r * n + c];
    const D1 = [1,0,1,1,1,0,1,0,0,0,0], D2 = [0,0,0,0,1,0,1,1,1,0,1];
    let puan = 0;
    for (let yon = 0; yon < 2; yon++)
        for (let a = 0; a < n; a++)
            for (let b = 0; b + 10 < n; b++) {
                let e1 = true, e2 = true;
                for (let k = 0; k < 11; k++) {
                    const d = yon === 0 ? al(a, b + k) : al(b + k, a);
                    if (d !== D1[k]) e1 = false;
                    if (d !== D2[k]) e2 = false;
                }
                if (e1) puan += 40;
                if (e2) puan += 40;
            }
    return puan;
}
function qrCeza4(mod, n) {                 /* koyu oranının %50'den sapması */
    let koyu = 0;
    for (let i = 0; i < n * n; i++) if (mod[i]) koyu++;
    return Math.floor(Math.abs(koyu * 100 / (n * n) - 50) / 5) * 10;
}
function qrCezaPuani(mod, n) {
    return qrCeza1(mod, n) + qrCeza2(mod, n) + qrCeza3(mod, n) + qrCeza4(mod, n);
}

function qrBicimBitleri(maske) {
    const d = (0 << 3) | maske;          /* düzeltme seviyesi M = 00 */
    let kalan = d << 10;
    for (let i = 14; i >= 10; i--) if (kalan & (1 << i)) kalan ^= 0x537 << (i - 10);
    return ((d << 10) | (kalan & 0x3FF)) ^ 0x5412;
}
function qrSurumBitleri(v) {
    let kalan = v << 12;
    for (let i = 17; i >= 12; i--) if (kalan & (1 << i)) kalan ^= 0x1F25 << (i - 12);
    return (v << 12) | (kalan & 0xFFF);
}
function qrBicimYaz(mod, n, bitler) {
    for (let i = 0; i < 15; i++) {
        const d = (bitler >> i) & 1;
        if (i < 6) mod[i * n + 8] = d;
        else if (i < 8) mod[(i + 1) * n + 8] = d;
        else mod[(n - 15 + i) * n + 8] = d;
        if (i < 8) mod[8 * n + (n - 1 - i)] = d;
        else if (i === 8) mod[8 * n + 7] = d;
        else mod[8 * n + (14 - i)] = d;
    }
    mod[(n - 8) * n + 8] = 1;
}
function qrSurumYaz(mod, n, bitler) {
    for (let i = 0; i < 18; i++) {
        const d = (bitler >> i) & 1;
        mod[Math.floor(i / 3) * n + (i % 3 + n - 11)] = d;
        mod[(i % 3 + n - 11) * n + Math.floor(i / 3)] = d;
    }
}

/* ---------- Ana giriş ---------- */
function qrEnKucukSurum(baytSayisi) {
    for (let v = 1; v <= QR_TABLO.length; v++) {
        const sayacBiti = v >= 10 ? 16 : 8;
        if (qrVeriKapasitesi(v) * 8 >= 4 + sayacBiti + baytSayisi * 8) return v;
    }
    return null;
}

/* Metni kare koda çevirir. SIĞMAZSA null DÖNER — çağıran dosya yoluna
   yönlendirmek zorunda. Sessizce kırpmak, veriyi yarım aktarmak olurdu:
   karşı taraf eksik bütçeyi tam sanardı. */
/* `zorlaMaske` yalnız SINAMA içindir: hakem kütüphaneyle karşılaştırırken
   iki taraf farklı ama ikisi de geçerli maske seçerse sınama boşuna kırılır.
   Uygulamada verilmez; maske ceza puanıyla seçilir. */
function qrKodla(metin, zorlaMaske) {
    const baytlar = Array.from(new TextEncoder().encode(metin));
    const v = qrEnKucukSurum(baytlar.length);
    if (!v) return null;

    const kodlar = qrKodSozcukleri(baytlar, v);
    const bitler = [];
    kodlar.forEach(b => { for (let i = 7; i >= 0; i--) bitler.push((b >> i) & 1); });

    const iskelet = qrIskelet(v), n = iskelet.n, mod = iskelet.mod, rez = iskelet.rez;
    let i = 0, yukari = true;
    for (let sag = n - 1; sag > 0; sag -= 2) {
        if (sag === 6) sag = 5;              /* zamanlama sütunu atlanır */
        for (let k = 0; k < n; k++) {
            const r = yukari ? n - 1 - k : k;
            for (let s = 0; s < 2; s++) {
                const c = sag - s;
                if (rez[r * n + c]) continue;
                mod[r * n + c] = i < bitler.length ? bitler[i] : 0;
                i++;
            }
        }
        yukari = !yukari;
    }

    let enIyi = null, enIyiPuan = Infinity, secilen = -1;
    for (let m = 0; m < 8; m++) {
        if (zorlaMaske !== undefined && m !== zorlaMaske) continue;
        const deneme = new Uint8Array(mod);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
            if (!rez[r * n + c] && QR_MASKELER[m](r, c)) deneme[r * n + c] ^= 1;
        qrBicimYaz(deneme, n, qrBicimBitleri(m));
        if (v >= 7) qrSurumYaz(deneme, n, qrSurumBitleri(v));
        const p = qrCezaPuani(deneme, n);
        if (p < enIyiPuan) { enIyiPuan = p; enIyi = deneme; secilen = m; }
    }
    return { surum: v, boyut: n, modul: enIyi, maske: secilen };
}

/* Kare kodu SVG olarak çizer. Kenar boşluğu 4 modül — EKSİKSE çoğu
   telefon kamerası kodu hiç görmez; "çizdim ama okunmuyor" hatasının
   en sık sebebi budur. */
function qrSvg(kod, kenar) {
    const b = kod.boyut, p = 4, t = b + p * 2;
    let yol = "";
    for (let r = 0; r < b; r++) for (let c = 0; c < b; c++)
        if (kod.modul[r * b + c]) yol += "M" + (c + p) + " " + (r + p) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t +
        '" width="' + kenar + '" height="' + kenar + '" shape-rendering="crispEdges" role="img" ' +
        'aria-label="Aktarım kare kodu">' +
        '<rect width="' + t + '" height="' + t + '" fill="#fff"/>' +
        '<path d="' + yol + '" fill="#000"/></svg>';
}
