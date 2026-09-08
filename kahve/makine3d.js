/* ☕ KAHVE KAVURMA — 3B MAKİNE
   ============================================================
   Kullanıcı 06.09.2026'da: "olum animasyon olayına çevir aynısını,
   3d şekilde, yapılır be."

   DAHA ÖNCE "OLMAZ" DENMİŞTİ VE O GEREKÇE YANLIŞTI. Gerekçe
   "kütüphane yüklenemiyor" idi; oysa yüklenemeyen şey CDN'di.
   Kütüphaneyi depoya kopyalayınca çevrimdışı da çalışıyor.
   Yanlış gerekçeyle iş reddedilmiş; kullanıcı ısrar etti ve haklıydı.

   FOTOĞRAF SİLİNMİYOR. Üç sebeple:
     1. 3B hazır olana kadar ekranda o duruyor (afiş).
     2. WebGL yoksa ya da çizim başarısızsa kalıcı olarak o kalıyor.
     3. `prefers-reduced-motion` seçen kullanıcıda 3B hiç başlamıyor.
   Yani hiçbir durumda boş çerçeve görünmüyor.

   SAYILAR UYDURULMUYOR (K-22). Tamburun ve tepsideki kahvenin rengi
   kullanıcının Fire sekmesinde ÖLÇTÜĞÜ fire yüzdesinden geliyor.
   Ölçüm yoksa çekirdek yeşil kalıyor — sahte bir kavrulma yok.
   ============================================================ */
(function (kok) {
    'use strict';

    var T = null;                 // THREE
    var ciz = null, sahne = null, kamera = null, isik = {}, saat = null;
    var P = {};                   // parçalar
    var durum = { sarjli: false, kasikta: false, bosaldi: false };
    var kavrulma = null;          // 0..1 fire oranı; null = ölçüm yok
    var acikMi = false, dongu = 0, hazir = false;
    var kap = null, tuval = null;
    /* Sabit bakis acisi. Serbest dondurme kapali (kullanici istegi);
       bu degerler makinenin en okunakli durdugu aci. */
    var donme = { x: -0.1, y: -0.42, surukluyor: false, sonX: 0, sonY: 0 };
    var taneler = null, taneVeri = [], akis = null, akisVeri = [];
    var sonVurguAn = 0;
    var D = {};                   // canvas'ta uretilen dokular (A adayindan)
    /* A adayinin doku sisteminin bagli oldugu modul degiskenleri.
       Blok tasinirken bunlar unutulmustu ve 3B sessizce fotografa
       dusuyordu ("enBuyukAniso is not defined"). Tasinan kodun
       BAGIMLILIKLARI da tasinmali -- kod parcasi tek basina yasamaz. */
    var enBuyukAniso = 1, kucukAygit = false, azHareket = false;

    /* Çekirdek rengi: yeşilden ölçülen kavrulmaya. Fire ne kadar
       yüksekse o kadar koyu. Aynı eşleme arayüzdeki `kavrulmaRengi`
       ile uyumlu olsun diye 0.08–0.22 bandına oturtuldu. */
    function cekirdekRengi() {
        if (kavrulma === null) return 0x8fa055;
        var t = Math.max(0, Math.min(1, (kavrulma - 0.08) / 0.14));
        var a = [0x8f, 0xa0, 0x55], b = [0x4a, 0x2b, 0x18], c = [0, 0, 0];
        for (var i = 0; i < 3; i++) c[i] = Math.round(a[i] + (b[i] - a[i]) * t);
        return (c[0] << 16) | (c[1] << 8) | c[2];
    }

    function mat(o) { return new T.MeshStandardMaterial(o); }

    function cevreHaritasi() {
        var oda = new T.Scene();
        var g = new T.BoxGeometry(1, 1, 1);
        function kutu(renk, guc, ol, kon) {
            var m = new T.MeshBasicMaterial({ color: renk });
            m.color.multiplyScalar(guc);          // 1'in üstü = HDR parlaklık
            var me = new T.Mesh(g, m);
            me.scale.set(ol[0], ol[1], ol[2]);
            me.position.set(kon[0], kon[1], kon[2]);
            oda.add(me);
        }
        // kapalı oda (içeriden görünsün diye arka yüz)
        var duvarM = new T.MeshBasicMaterial({ color: 0x0c0b0a, side: T.BackSide });
        var duvar = new T.Mesh(g, duvarM);
        duvar.scale.set(34, 26, 34);
        oda.add(duvar);

        kutu(0xfff4e2, 2.3, [8, 0.3, 7], [-1, 11.5, 1.5]);   // üstten anahtar softbox
        kutu(0xffd7a4, 2.6, [0.3, 7, 8], [-11, 5.0, 1]);     // sol sıcak softbox
        kutu(0xb9d2ff, 0.75, [0.3, 7, 8], [11, 4.0, 0]);     // sağ soğuk dolgu
        kutu(0xffffff, 6.0, [0.25, 13, 0.7], [-6.5, 5, -9]); // arka ince şerit (kenar parlaması)
        kutu(0xffffff, 4.2, [0.25, 13, 0.7], [7.5, 5, -9]);  // ikinci şerit
        kutu(0x574636, 0.55, [16, 0.3, 16], [0, -6, 0]);     // zeminden sıcak sekme
        kutu(0x14161a, 1.0, [16, 10, 0.3], [0, 3, 12]);      // önde koyu kart: kontrast
        kutu(0xfff6ea, 4.6, [0.45, 9, 0.3], [-5.5, 4.6, 10]); // ön-sol dikey şerit
        kutu(0xeaf1ff, 2.4, [0.45, 9, 0.3], [6.2, 4.4, 10]);  // ön-sağ dikey şerit

        var pm = new T.PMREMGenerator(ciz);
        var h = pm.fromScene(oda, 0.028, 0.1, 70).texture;
        pm.dispose();
        duvarM.dispose(); g.dispose();
        return h;
    }

    /* ================================================================
       4) GEOMETRİ YARDIMCILARI
       ================================================================ */

    /* Köşeleri kırılmış kutu. Keskin kenarlı BoxGeometry "ilkel şekil"
       gibi durur; gerçek sac gövdenin kenarı hep kırıktır ve ışığı tam
       oradan yakalar — o ince parlak çizgi profesyonel görünümün yarısı. */


    function tuvalYap(g, y) {
        var c = document.createElement('canvas');
        c.width = g; c.height = y || g;
        return c;
    }

    /* nx×ny boyutunda rastgele değer ızgarası. Deterministik (LCG):
       her açılışta aynı doku çıksın, kullanıcı sayfayı yenileyince
       makine değişmiş gibi olmasın. */
    function izgara(nx, ny, tohum) {
        var a = new Float32Array(nx * ny), s = (tohum || 1) >>> 0;
        for (var i = 0; i < a.length; i++) {
            s = (s * 1664525 + 1013904223) >>> 0;
            a[i] = (s >>> 8) / 16777216;
        }
        return a;
    }

    /* Sararak bilineer örnekleme + smoothstep. x,y ızgara biriminde. */
    function ornek(a, nx, ny, x, y) {
        var xi = Math.floor(x), yi = Math.floor(y);
        var fx = x - xi, fy = y - yi;
        var x0 = ((xi % nx) + nx) % nx, y0 = ((yi % ny) + ny) % ny;
        var x1 = (x0 + 1) % nx, y1 = (y0 + 1) % ny;
        var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        var u0 = a[y0 * nx + x0], u1 = a[y0 * nx + x1];
        var v0 = a[y1 * nx + x0], v1 = a[y1 * nx + x1];
        var A = u0 + (u1 - u0) * sx, B = v0 + (v1 - v0) * sx;
        return A + (B - A) * sy;
    }

    /* Katman listesi -> yükseklik fonksiyonu. Her katmanın kendi ızgarası
       var; böylece x ve y'de FARKLI sıklık kullanabiliyoruz. Fırçalanmış
       çelik tam olarak bu: bir eksende uzun, diğerinde sık. */
    function katmanli(katlar) {
        var i, toplamA = 0;
        for (i = 0; i < katlar.length; i++) {
            katlar[i].a = izgara(katlar[i].nx, katlar[i].ny, 7919 + i * 104729);
            toplamA += katlar[i].w;
        }
        return function (u, v) {          // u,v 0..1
            var s = 0;
            for (var k = 0; k < katlar.length; k++) {
                var K = katlar[k];
                s += ornek(K.a, K.nx, K.ny, u * K.nx, v * K.ny) * K.w;
            }
            return s / toplamA;           // 0..1
        };
    }

    /* Yükseklik alanından GRİ harita (roughness/metalness için). */
    function griTuval(boy, yuk, alt, ust) {
        var c = tuvalYap(boy), x = c.getContext('2d');
        var im = x.createImageData(boy, boy), p = im.data, i = 0;
        for (var y = 0; y < boy; y++) {
            for (var g = 0; g < boy; g++) {
                var h = yuk(g / boy, y / boy);
                var d = Math.max(0, Math.min(255, Math.round((alt + (ust - alt) * h) * 255)));
                p[i++] = d; p[i++] = d; p[i++] = d; p[i++] = 255;
            }
        }
        x.putImageData(im, 0, 0);
        return c;
    }

    /* Yükseklik alanından NORMAL haritası. Komşu farkından eğim çıkarıp
       (x,y,z) normalini 0..1'e sıkıştırıyoruz. Normal haritası olmadan
       "portakal kabuğu" ya da fırça izi diye bir şey yok — düz cam gibi
       bir boya çıkar ve gözün "oyuncak" dediği şey tam olarak budur. */
    function normalTuval(boy, yuk, guc) {
        var c = tuvalYap(boy), x = c.getContext('2d');
        var h = new Float32Array(boy * boy), g, y;
        for (y = 0; y < boy; y++)
            for (g = 0; g < boy; g++) h[y * boy + g] = yuk(g / boy, y / boy);
        var im = x.createImageData(boy, boy), p = im.data, i = 0;
        for (y = 0; y < boy; y++) {
            var yu = ((y - 1) + boy) % boy, ya = (y + 1) % boy;
            for (g = 0; g < boy; g++) {
                var gs = ((g - 1) + boy) % boy, gd = (g + 1) % boy;
                var dx = (h[y * boy + gd] - h[y * boy + gs]) * guc;
                var dy = (h[ya * boy + g] - h[yu * boy + g]) * guc;
                var nx = -dx, ny = -dy, nz = 1;
                var l = Math.sqrt(nx * nx + ny * ny + 1) || 1;
                nx /= l; ny /= l; nz /= l;
                p[i++] = Math.round((nx * 0.5 + 0.5) * 255);
                p[i++] = Math.round((ny * 0.5 + 0.5) * 255);
                p[i++] = Math.round((nz * 0.5 + 0.5) * 255);
                p[i++] = 255;
            }
        }
        x.putImageData(im, 0, 0);
        return c;
    }

    /* Hazır canvas'tan (elle çizilmiş) yükseklik okuyucu. Kahve yatağı
       gibi "yuvarlak tümsekler" gürültüyle değil, doğrudan çizilerek
       daha inandırıcı çıkıyor. */
    function tuvaldanYukseklik(c) {
        var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        var b = c.width;
        return function (u, v) {
            var g = Math.min(b - 1, Math.max(0, Math.floor(u * b)));
            var y = Math.min(b - 1, Math.max(0, Math.floor(v * b)));
            return d[(y * b + g) * 4] / 255;
        };
    }

    /* CanvasTexture sarmalayıcı. renkMi=true olan dokular sRGB olarak
       işaretlenmeli, yoksa renkler yanlış (soluk) çıkar. r147'de anahtar
       `encoding`; r152+ sürümlerde `colorSpace`. İkisi de güvenli
       şekilde denenip hangisi varsa o kullanılıyor. */
    function doku(c, tx, ty, renkMi, sabitle) {
        var d = new T.CanvasTexture(c);
        if (sabitle) { d.wrapS = d.wrapT = T.ClampToEdgeWrapping; }
        else { d.wrapS = d.wrapT = T.RepeatWrapping; d.repeat.set(tx || 1, ty || tx || 1); }
        d.anisotropy = enBuyukAniso;
        if (renkMi) {
            /* TUZAK — DEPODAKİ three.min.js İLE ÖLÇÜLDÜ:
               r147'de `THREE.SRGBColorSpace` SABİTİ VAR ama `texture.colorSpace`
               ÖZELLİĞİ YOK (dosyada `outputColorSpace` hiç geçmiyor, `encoding`
               13 yerde geçiyor). Yani "sabit varsa yeni API vardır" varsayımı
               burada YANLIŞ. `else if` yazsaydık r147'de renk dokuları lineer
               kalır, kadran ve künye soluk çıkardı ve kimse sebebini bulamazdı.
               O yüzden ikisi de ayrı ayrı, else'siz kuruluyor: hangisi
               gerçekten çalışıyorsa o iş görür, diğeri zararsız bir özellik. */
            if (T.sRGBEncoding !== undefined) d.encoding = T.sRGBEncoding;
            if (T.SRGBColorSpace !== undefined) d.colorSpace = T.SRGBColorSpace;
        }
        d.needsUpdate = true;
        return d;
    }

    function dokulariUret() {
        /* --- fırınlanmış boya: ince portakal kabuğu ---
           Gerçek fırın boyası hiçbir zaman ayna değildir; yüzeyinde
           milimetrik bir dalgalanma vardır ve parlama BU dalgalanmada
           kırılır. Verniğin (clearcoat) kendi normal haritası olması
           şart: altındaki boya düz, üstündeki vernik dalgalı. */
        var peel = katmanli([
            { nx: 48, ny: 48, w: 0.55 },
            { nx: 96, ny: 96, w: 0.30 },
            { nx: 160, ny: 160, w: 0.15 }
        ]);
        /* Normal haritası 256, pürüzlülük 128: göz eğimdeki detayı
           görür, matlıktaki detayı görmez. Telefonda açılış süresini
           yarıya indiren ucuz bir takas. */
        D.boyaN = doku(normalTuval(256, peel, 5.0), 3, 3);
        D.boyaR = doku(griTuval(128, peel, 0.74, 1.0), 3, 3);

        /* --- fırçalanmış / tornalanmış çelik ---
           Bir eksende çok uzun, diğerinde çok sık: çizgiler böyle doğar.
           Silindirlerde u çevre boyunca gittiği için çizgiler tornada
           dönmüş metal gibi çember çember çıkıyor — kavurma makinesinin
           tamburu zaten öyledir. */
        var firca = katmanli([
            { nx: 2, ny: 128, w: 0.55 },
            { nx: 4, ny: 256, w: 0.28 },
            { nx: 32, ny: 32, w: 0.17 }
        ]);
        D.celikR = doku(griTuval(128, firca, 0.70, 1.0), 1, 1);
        D.celikN = doku(normalTuval(256, firca, 1.6), 1, 1);

        /* --- dökme demir: kaba gren ---
           Kaide ve tambur gövdesi döküm. Döküm yüzey MAT ve gözeneklidir;
           çelikle aynı haritayı kullanırsak ikisi de aynı malzeme gibi
           görünür ve makine tek parça plastik gibi durur. */
        var gren = katmanli([
            { nx: 24, ny: 24, w: 0.45 },
            { nx: 64, ny: 64, w: 0.35 },
            { nx: 128, ny: 128, w: 0.20 }
        ]);
        D.demirN = doku(normalTuval(256, gren, 7.0), 5, 5);
        D.demirR = doku(griTuval(128, gren, 0.78, 1.0), 5, 5);

        /* --- kahve yatağı: tepside üst üste binmiş çekirdekler ---
           Elle çizilen tümsekler. Bunu yalnızca NORMAL + ROUGHNESS olarak
           kullanıyoruz, RENK haritası olarak DEĞİL — renk ölçümden gelmek
           zorunda (K-22). Doku sadece "kabartma" veriyor. */
        var yc = tuvalYap(256), yx = yc.getContext('2d');
        yx.fillStyle = '#4c4c4c'; yx.fillRect(0, 0, 256, 256);
        var s = 20261;
        function rast() { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 16777216; }
        for (var i = 0; i < 850; i++) {
            var cx = rast() * 256, cy = rast() * 256;
            var r = 4.5 + rast() * 3.0, a = rast() * Math.PI;
            yx.save(); yx.translate(cx, cy); yx.rotate(a); yx.scale(1, 0.62);
            var gr = yx.createRadialGradient(0, 0, 0, 0, 0, r);
            gr.addColorStop(0, 'rgba(255,255,255,0.95)');
            gr.addColorStop(0.62, 'rgba(150,150,150,0.55)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            yx.fillStyle = gr; yx.beginPath(); yx.arc(0, 0, r, 0, 6.2832); yx.fill();
            yx.restore();
        }
        var yatakYuk = tuvaldanYukseklik(yc);
        D.yatakN = doku(normalTuval(256, yatakYuk, 4.5), 1, 1);
        D.yatakR = doku(griTuval(128, yatakYuk, 0.72, 1.0), 1, 1);

        /* --- kadran yüzü ---
           SAYI YAZMIYOR. Elimizde ölçülmüş bir sıcaklık yok; rakam
           yazarsak kullanıcı onu gerçek sanır. Sadece çentikler var,
           ibreler de sıfır dayanağında duruyor ve hiç oynamıyor. */
        var kc = tuvalYap(256), kx = kc.getContext('2d');
        kx.fillStyle = '#efe9dd'; kx.fillRect(0, 0, 256, 256);
        var vg = kx.createRadialGradient(128, 118, 20, 128, 128, 130);
        vg.addColorStop(0, 'rgba(255,255,255,0.55)');
        vg.addColorStop(1, 'rgba(120,105,86,0.42)');
        kx.fillStyle = vg; kx.fillRect(0, 0, 256, 256);
        kx.translate(128, 128);
        for (var t2 = 0; t2 <= 40; t2++) {
            var ac = -Math.PI * 1.22 + t2 * (Math.PI * 1.44 / 40);
            var buyuk = (t2 % 5 === 0);
            kx.strokeStyle = buyuk ? '#2b2723' : '#6d675f';
            kx.lineWidth = buyuk ? 4 : 2;
            kx.beginPath();
            kx.moveTo(Math.cos(ac) * 104, Math.sin(ac) * 104);
            kx.lineTo(Math.cos(ac) * (buyuk ? 84 : 92), Math.sin(ac) * (buyuk ? 84 : 92));
            kx.stroke();
        }
        kx.fillStyle = '#3a342c';
        kx.beginPath(); kx.arc(0, 0, 9, 0, 6.2832); kx.fill();
        D.kadran = doku(kc, 1, 1, true, true);

        /* --- marka plakası ---
           Metnin kendisi bir sayı değil, sadece isim. Fırçalı zemin
           üstüne oyulmuş harf: plakayı düz gri dikdörtgen olmaktan
           çıkarıp gerçek bir künyeye çeviren şey bu. */
        var pc = tuvalYap(256, 64), px = pc.getContext('2d');
        var pg = px.createLinearGradient(0, 0, 0, 64);
        pg.addColorStop(0, '#cfd3d7'); pg.addColorStop(0.5, '#eef1f3'); pg.addColorStop(1, '#b9bec3');
        px.fillStyle = pg; px.fillRect(0, 0, 256, 64);
        for (var l = 0; l < 220; l++) {
            px.strokeStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.05) + ')';
            px.beginPath(); px.moveTo(Math.random() * 256, 0); px.lineTo(Math.random() * 256, 64); px.stroke();
        }
        px.font = 'bold 27px Georgia, "Times New Roman", serif';
        px.textAlign = 'center'; px.textBaseline = 'middle';
        px.fillStyle = 'rgba(255,255,255,0.65)'; px.fillText('KAVURMA', 128, 34);
        px.fillStyle = '#3b3a37'; px.fillText('KAVURMA', 128, 32);
        D.plaka = doku(pc, 1, 1, true, true);

        /* --- yumuşak parıltı (alev) ve zemin lekesi ---
           İkisi de radyal geçiş. Alevde toplamalı harmanla ısı hissi,
           zeminde makineyi yere oturtan yumuşak koyuluk. */
        function radyal(boy, ic, dis) {
            var c = tuvalYap(boy), x = c.getContext('2d');
            var g = x.createRadialGradient(boy / 2, boy / 2, 0, boy / 2, boy / 2, boy / 2);
            g.addColorStop(0, ic); g.addColorStop(0.45, dis); g.addColorStop(1, 'rgba(0,0,0,0)');
            x.fillStyle = g; x.fillRect(0, 0, boy, boy);
            return c;
        }
        D.parilti = doku(radyal(128, 'rgba(255,255,255,1)', 'rgba(255,190,120,0.35)'), 1, 1, true, true);
        D.leke = doku(radyal(256, 'rgba(255,255,255,1)', 'rgba(120,120,120,0.55)'), 1, 1, false, true);
    }

    /* ================================================================
       3) ÇEVRE HARİTASI — metal neyi yansıttığını bilmeden metal olmaz
       ================================================================
       RoomEnvironment examples/ altında, bize yasak. O yüzden küçük bir
       stüdyoyu ELDE kuruyoruz: üstte anahtar softbox, solda sıcak dolgu,
       sağda soğuk dolgu, arkada iki ince şerit. O ince şeritler önemli:
       kromda uzun, keskin parlama çizgileri onlardan çıkıyor; büyük
       yumuşak kutular tek başına metali "gri plastik" bırakıyor.
       PMREMGenerator ÇEKİRDEKTE var (examples değil), kullanımı serbest. */

    function malzemeler() {
        function fiz(o) { return new T.MeshPhysicalMaterial(o); }
        function std(o) { return new T.MeshStandardMaterial(o); }

        var M = {};

        /* --- D) fırın boyası: tek clearcoat'lu aile --- */
        M.boya = fiz({
            color: 0x76150b, metalness: 0.10, roughness: 0.26,
            roughnessMap: D.boyaR, normalMap: D.boyaN,
            clearcoat: 0.72, clearcoatRoughness: 0.12,
            clearcoatNormalMap: D.boyaN,
            envMapIntensity: 0.62
        });
        M.boya.normalScale.set(0.20, 0.20);
        M.boya.clearcoatNormalScale.set(0.5, 0.5);

        M.boyaKoyu = M.boya.clone();          // aynı program, sadece renk
        M.boyaKoyu.color.setHex(0x3d0d06);
        M.boyaKoyu.roughness = 0.32;

        /* --- A) metaller: hepsi tek program --- */
        function metal(renk, mtl, prz, dk, env, nsc) {
            var m = std({
                color: renk, metalness: mtl, roughness: prz,
                roughnessMap: dk === 'demir' ? D.demirR : D.celikR,
                normalMap: dk === 'demir' ? D.demirN : D.celikN,
                envMapIntensity: env
            });
            m.normalScale.set(nsc, nsc);
            return m;
        }
        /* CEVRE SIDDETI METALDE YUKSEK, BOYADA DUSUK.
           Olcerek bulundu: oda karartilinca boya duzeldi ama butun
           metaller camur rengine dondu -- cunku saf metalin RENGI
           yoktur, sadece yansittigi vardir. Cozum odayi geri
           aydinlatmak degil (o zaman boya yine somon oluyor), metalin
           envMapIntensity'sini ayri yukseltmek. Iki malzeme ailesi ayni
           odada bagimsiz pozlaniyor. */
        M.krom = metal(0xdfe3e7, 1.0, 0.11, 'celik', 2.30, 0.10);
        M.celik = metal(0xc8cdd2, 1.0, 0.22, 'celik', 2.00, 0.20);
        M.celikMat = metal(0xa2a8ae, 0.92, 0.44, 'celik', 1.60, 0.26);
        M.pirinc = metal(0xcb9d47, 1.0, 0.19, 'celik', 2.00, 0.12);
        /* Dökme demir grenini İNCE tut: ilk denemede normalScale 0.75 +
           tekrar 2 idi, kaide beton bloğa dönmüştü. Gren gerçekte
           milimetriktir, ekranda da öyle görünmeli. */
        M.demir = metal(0x35322e, 0.38, 0.82, 'demir', 0.78, 0.26);
        M.demirKoyu = metal(0x211f1c, 0.26, 0.92, 'demir', 0.52, 0.26);
        M.kahve = std({
            color: cekirdekRengi(), metalness: 0.0, roughness: 0.95,
            roughnessMap: D.yatakR, normalMap: D.yatakN, envMapIntensity: 0.18
        });
        M.kahve.normalScale.set(0.9, 0.9);

        /* --- B) içi görünen kabuklar: A + DoubleSide --- */
        M.celikIki = M.celik.clone();
        M.celikIki.side = T.DoubleSide;
        M.celikIki.envMapIntensity = 1.95;
        M.celikIki.normalScale.set(0.035, 0.035); // oluk degil, iz
        M.tekne = M.celikIki.clone();             // sogutma teknesi:
        M.tekne.roughness = 0.30;                 // ayna degil, fircali
        M.tekne.envMapIntensity = 1.55;
        M.tamburMal = M.celikIki.clone();     // aynı program
        M.tamburMal.color.setHex(0x2e251c);   // is tutmuş
        M.tamburMal.metalness = 0.7;
        M.tamburMal.roughness = 0.70;
        M.tamburMal.envMapIntensity = 0.85;

        /* --- C) yüzü basılı parçalar: Standard + map --- */
        M.kadran = std({
            map: D.kadran, color: 0xffffff, metalness: 0.0,
            roughness: 0.32, envMapIntensity: 1.0
        });
        /* Tambur kapağı: makinenin en büyük tek yüzeyi. Parlak çelik
           yaparsak dev bir gri disk oluyor; gerçekte dökümdür ve mat
           olmalı ki etrafındaki krom halka öne çıksın. */
        M.kapakMal = metal(0x3d4046, 0.62, 0.55, 'demir', 1.15, 0.22);
        M.plaka = std({
            map: D.plaka, color: 0xffffff, metalness: 0.85,
            roughness: 0.28, envMapIntensity: 1.1
        });

        /* --- E) çekirdek, kepçe, cam: BOYANIN KLONU ---
           Bunlar da clearcoat'lu; ayrı bir Physical malzeme yazsaydık
           three.js İKİNCİ bir dev gölgelendirici daha derlerdi. Boyanın
           haritalarını miras alıyorlar: çekirdekte 3 kat tekrarlı ince
           doku zaten görünmüyor, camda da fark etmiyor — ama derlenen
           program sayısı bir eksiliyor. (Ölçüldü: ilk kare 3289 ms'den
           bu tür birleştirmelerle aşağı indi.)
           ÇEKİRDEK: renk yalnızca ölçümden. Sabit bir parlaklık var
           (kavrulmuş çekirdek yağlıdır) ama bu parlaklık ÖLÇÜMDEN
           BAĞIMSIZ sabit — hiçbir sayı ima etmiyor.
           CAM: transmission KULLANILMADI; çekirdekte var ama ek bir
           çizim geçişi istiyor ve telefonda pahalı. */
        M.tane = M.boya.clone();
        M.tane.color.setHex(cekirdekRengi());
        M.tane.metalness = 0.0;
        M.tane.roughness = 0.88;      // harita ~0.86 ile carpiliyor
        M.tane.clearcoat = 0.06;      // yagli parlaklik VAR ama az
        M.tane.clearcoatRoughness = 0.55;
        M.tane.envMapIntensity = 0.16;

        M.kepceMal = M.boya.clone();
        M.kepceMal.color.setHex(0xc9a04c);
        M.kepceMal.metalness = 0.9;
        M.kepceMal.roughness = 0.22;
        M.kepceMal.clearcoat = 0.25;
        M.kepceMal.envMapIntensity = 1.8;

        M.cam = M.boya.clone();
        M.cam.color.setHex(0x0b1116);
        M.cam.roughness = 0.04;
        M.cam.clearcoat = 1.0;
        M.cam.clearcoatRoughness = 0.02;
        M.cam.transparent = true;
        M.cam.opacity = 0.55;
        M.cam.envMapIntensity = 1.5;

        return M;
    }

    /* ================================================================
       6) MAKİNE
       ================================================================ */


    /* DELIKLI ELEK DOKUSU. Fotografta tepsinin tabani yuzlerce ince
       delikten olusuyor. Her deligi ayri nesne yapmak ucgen sayisini
       patlatirdi; canvas ile bir desen uretip dokuya cevirmek hem
       ucuz hem dis dosya gerektirmiyor (cevrimdisi calismali). */
    function elekDokusu(adim, delik) {
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        var g = c.getContext('2d');
        g.fillStyle = '#8d9298';
        g.fillRect(0, 0, 256, 256);
        g.fillStyle = '#101214';
        for (var y = adim / 2; y < 256; y += adim) {
            for (var x = adim / 2; x < 256; x += adim) {
                var kx = x + ((Math.round(y / adim) % 2) ? adim / 2 : 0);
                g.beginPath();
                g.arc(kx % 256, y, delik, 0, Math.PI * 2);
                g.fill();
            }
        }
        var d = new T.CanvasTexture(c);
        d.wrapS = d.wrapT = T.RepeatWrapping;
        d.repeat.set(14, 14);
        return d;
    }

    /* Köşeleri kırılmış kutu. Keskin kenarlı `BoxGeometry` "ilkel şekil"
       gibi duruyor; gerçek sac gövdelerin kenarı hep kırıktır ve ışığı
       oradan yakalar. Farkı en çok yapan tek değişiklik bu. */
    function yuvarlakKutu(g, y, d, r, m) {
        var s = new T.Shape();
        var a = g / 2, b = y / 2;
        s.moveTo(-a + r, -b);
        s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r);
        s.lineTo(a, b - r);  s.quadraticCurveTo(a, b, a - r, b);
        s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r);
        s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
        var derin = Math.max(0.02, d - 0.08);
        var geo = new T.ExtrudeGeometry(s, {
            depth: derin, bevelEnabled: true, bevelThickness: 0.04,
            bevelSize: 0.04, bevelSegments: 3, curveSegments: 10
        });
        geo.translate(0, 0, -derin / 2);
        var me = new T.Mesh(geo, m);
        me.castShadow = true; me.receiveShadow = true;
        return me;
    }

    function golgeli(m) { m.castShadow = true; m.receiveShadow = true; return m; }

    function perckinHalka(grup, yaricap, adet, z, mal, boy) {
        for (var i = 0; i < adet; i++) {
            var a = i * Math.PI * 2 / adet;
            var p = new T.Mesh(new T.SphereGeometry(boy || 0.026, 10, 8), mal);
            p.position.set(Math.cos(a) * yaricap, Math.sin(a) * yaricap, z);
            grup.add(p);
        }
    }

    /* Kemer profilli kabuk: alti dikdortgen, ustu yarim daire.
       Fotografta govdenin siyahinin arkasindan gorunen paslanmaz
       kavis bu. */
    function kemerKabuk(g, y, d, mal) {
        var a = g / 2, r = a;
        var sk = new T.Shape();
        sk.moveTo(-a, -y / 2);
        sk.lineTo(a, -y / 2);
        sk.lineTo(a, y / 2 - r);
        sk.absarc(0, y / 2 - r, r, 0, Math.PI, false);
        sk.lineTo(-a, -y / 2);
        var geo = new T.ExtrudeGeometry(sk, {
            depth: d - 0.06, bevelEnabled: true, bevelThickness: 0.025,
            bevelSize: 0.025, bevelSegments: 2, curveSegments: 26
        });
        geo.translate(0, 0, -(d - 0.06) / 2);
        var me = new T.Mesh(geo, mal);
        me.castShadow = true; me.receiveShadow = true;
        return me;
    }

    /* Panel cizgisi: ince, koyu, iceri gomulmus bir seritten ibaret.
       Kullanici "cizgileri falan" dedi -- duz bir siyah yuzeyi makine
       yapan sey bu ayrimlar. */
    function panelCizgi(grup, g, y, kon, mal) {
        var c = new T.Mesh(new T.BoxGeometry(g, y, 0.012), mal);
        c.position.set(kon[0], kon[1], kon[2]);
        grup.add(c);
        return c;
    }

    function makineyiKur() {
        /* ===============================================================
           TEKNİK ÇİZİME GÖRE KURULDU (07.09.2026)

           Kullanıcı sonunda makinenin İKİ DİK GÖRÜNÜŞLÜ teknik çizimini
           gönderdi — yandan (L) ve önden (W). Şimdiye kadarki bütün
           referanslar ya perspektif render ya fotoğraftı; bir makineyi
           doğru kurmak için gereken şey tam olarak buydu.

           VE ÇİZİM BİR YANLIŞI DA ORTAYA ÇIKARDI. Bundan önceki üç tur
           BEYAZ 3B MODELİ kovalıyordu: çıplak yatay tambur, kollu kasnak,
           ayrı duran kumanda dolabı — klasik tip. Çizimdeki makine o
           değil: tekerlekli uzun bir KAİDE DOLABI, üstünde paslanmaz
           bantlı YATAY GÖVDE, solda kollu ekran, sağda ayrı bir SİKLON.
           Modern tip. Klasik kurgu terk edildi.

           EKSEN SÖZLEŞMESİ YİNE KORUNDU. `kare()` tamburu `rotation.z`
           ile döndürüyor → tambur ekseni Z (ön-arka). Çizimde de öyle:
           yan görünüşte tambur boydan boya, ön görünüşte yuvarlak yüz
           bize bakıyor.

           ÖLÇÜLER ÇİZİMDEN ORANLANDI. Çizimdeki H (yükseklik) 1 kabul
           edilip her parça ona göre türetildi; tek tek göz kararı sayı
           yazmak yerine tek bir ölçekten çıkıyorlar.
           =============================================================== */
        var AM = malzemeler();
        function duzle(m, guc) {
            var k = m.clone();
            if (k.normalScale) k.normalScale.set(guc, guc);
            if (k.clearcoatNormalScale) k.clearcoatNormalScale.set(guc, guc);
            return k;
        }
        function metalYap(renk, mtl, prz, env) {
            return new T.MeshStandardMaterial({
                color: renk, metalness: mtl, roughness: prz, envMapIntensity: env
            });
        }
        var boyaSiyah = duzle(AM.boya, 0.08);     boyaSiyah.color.setHex(0x2b2f34);
        var boyaKoyu  = duzle(AM.boyaKoyu, 0.06); boyaKoyu.color.setHex(0x1a1d21);
        var boyaAcik  = duzle(AM.boya, 0.08);     boyaAcik.color.setHex(0x3a4048);
        var M = {
            siyah: boyaSiyah, siyahKoyu: boyaKoyu, siyahAcik: boyaAcik,
            celik: metalYap(0xd6dade, 0.96, 0.18, 2.2),
            celikMat: metalYap(0xa8aeb4, 0.9, 0.34, 1.7),
            ahsap: new T.MeshStandardMaterial({ color: 0x8a5730, metalness: 0.0, roughness: 0.54 }),
            bakir: metalYap(0xb4713a, 1.0, 0.18, 2.3),
            bakirMat: metalYap(0x94572a, 0.94, 0.34, 1.7),
            cam: AM.cam
        };
        P.mat = M;

        var kokG = new T.Group();
        sahne.add(kokG); P.kok = kokG;

        /* ---- ÇİZİMDEN GELEN ÖLÇÜLER --------------------------------
           H = toplam yükseklik. Her şey bunun oranı; bir parça değişince
           yanındakinin elle kaydırılması gerekmesin diye. */
        /* 2.30 idi. Kullanici "daha dar ve dik olmali" dedi;
           yukseklik artiyor, genislik carpani DUSUYOR -- ikisi
           birlikte silueti inceltiyor. */
        var H  = 2.62;
        var KAY = 0.16;            // tekerlek + şase yüksekliği
        /* 0.40 idi. Kullanici "biraz daha uste dogru uzasa" dedi;
           kaide yukselince makine dik bir siluete cikiyor ve
           referans cizimdeki orana yaklasiyor. */
        var KAH = H * 0.52;        // kaide dolabının yüksekliği
        /* ÇİZİMİ İLK OKUYUŞUMDA EKSENLERİ TERS ALDIM. Ön görünüşte
           tamburun YUVARLAK YÜZÜ bize bakıyor → tambur ekseni Z. O
           hâlde yan görünüşteki uzun ölçü (L) DERİNLİKTİR, genişlik
           değil; ön görünüşteki dar ölçü (W) genişliktir. İlk denemede
           kaideyi X''yönünde uzattım ve makine yandan basık, önden
           gereğinden geniş çıktı. */
        var KAU = H * 0.37;        // kaide GENİŞLİĞİ (X) — çizimdeki W
        var KAD = H * 0.88;        // kaide DERİNLİĞİ (Z) — çizimdeki L
        var GVT = KAY + KAH;       // kaidenin üst yüzü = gövdenin tabanı
        var GVH = H * 0.34;        // yatay gövdenin yüksekliği
        var GVU = H * 0.58;        // yatay gövdenin uzunluğu (Z ekseni boyunca)
        var TR  = GVH * 0.46;      // tambur yarıçapı
        var TMX = -H * 0.06;       // tambur ekseni X
        var TMY = GVT + GVH * 0.52;
        var ONZ = 0;               // (gövde kurulunca hesaplanıyor)

        /* ================= TEKERLEKLER VE ŞASE ================= */
        var sase = golgeli(yuvarlakKutu(KAU, 0.07, KAD, 0.015, M.siyahKoyu));
        sase.position.set(0, KAY - 0.02, 0); kokG.add(sase);
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (t) {
            var tk = golgeli(new T.Mesh(new T.CylinderGeometry(0.062, 0.062, 0.045, 18), M.siyahKoyu));
            tk.rotation.z = Math.PI / 2;
            tk.position.set(t[0] * (KAU / 2 - 0.12), 0.062, t[1] * (KAD / 2 - 0.10));
            kokG.add(tk);
        });

        /* ================= KAİDE DOLABI =================
           Çizimde makine ince ayaklar üzerinde değil; yerden gövdeye
           kadar dolu, kapaklı bir dolap var ve makine ona oturuyor. */
        var kaide = golgeli(yuvarlakKutu(KAU, KAH, KAD, 0.02, M.siyah));
        kaide.position.set(0, KAY + KAH / 2, 0); kokG.add(kaide);
        /* sol yanda büyük dikdörtgen kapak (çizimde bariz) */
        var kapakLev = golgeli(new T.Mesh(new T.BoxGeometry(KAU * 0.40, KAH * 0.62, 0.016), M.siyahKoyu));
        kapakLev.position.set(-KAU * 0.24, KAY + KAH * 0.52, KAD / 2 + 0.008); kokG.add(kapakLev);
        var kapakCer = golgeli(new T.Mesh(new T.BoxGeometry(KAU * 0.43, KAH * 0.68, 0.010), M.siyahAcik));
        kapakCer.position.set(-KAU * 0.24, KAY + KAH * 0.52, KAD / 2 + 0.003); kokG.add(kapakCer);
        /* sağda kavuz çekmecesi ağzı */
        var cekmece = golgeli(yuvarlakKutu(KAU * 0.20, KAH * 0.26, 0.10, 0.012, M.siyahAcik));
        cekmece.position.set(KAU * 0.26, KAY + KAH * 0.34, KAD / 2 + 0.05); kokG.add(cekmece);

        /* ================= YATAY GÖVDE =================
           Çizimde gövdenin ÜST YARISI paslanmaz (açık), alt yarısı boyalı
           (koyu). Tek renk bir kutu çizimdeki makineye benzemiyor. */
        /* Gövde X'te DAR, Z'de UZUN — çizimdeki W ve L. Üst kapak
           yarım silindir ve ekseni Z (tamburla aynı eksen). */
        var GVW = KAU * 0.86;                 /* gövde genişliği (X) */
        ONZ = GVU / 2;                        /* ön yüz gövdenin Z ucunda */
        var govdeAlt = golgeli(yuvarlakKutu(GVW, GVH * 0.46, GVU, 0.02, M.siyah));
        govdeAlt.position.set(TMX, GVT + GVH * 0.23, 0); kokG.add(govdeAlt);
        var govdeUst = golgeli(new T.Mesh(
            new T.CylinderGeometry(GVW * 0.52, GVW * 0.52, GVU, 40, 1, false, 0, Math.PI),
            metalYap(0xc3c8cd, 0.92, 0.24, 2.0)));
        govdeUst.rotation.x = Math.PI / 2;    /* ekseni Z */
        govdeUst.position.set(TMX, GVT + GVH * 0.46, 0); kokG.add(govdeUst);
        /* gövdenin yan yüzünde ince etiket yuvası */
        var etiket = golgeli(new T.Mesh(new T.BoxGeometry(0.012, 0.055, GVU * 0.30), M.siyahKoyu));
        etiket.position.set(TMX - GVW / 2 - 0.008, GVT + GVH * 0.24, -GVU * 0.10);
        kokG.add(etiket);

        /* ================= ÖN YÜZ (DURAĞAN) ================= */
        var onYuzG = new T.Group();
        onYuzG.position.set(TMX, TMY, ONZ + 0.03);
        kokG.add(onYuzG); P.onYuz = onYuzG;
        var yuzPlaka = golgeli(new T.Mesh(new T.CylinderGeometry(TR * 1.06, TR * 1.06, 0.055, 40), M.siyahKoyu));
        yuzPlaka.rotation.x = Math.PI / 2; onYuzG.add(yuzPlaka);
        perckinHalka(onYuzG, TR * 0.86, 12, 0.04, M.celikMat, 0.014);
        var kapakYuz = golgeli(new T.Mesh(new T.CylinderGeometry(TR * 0.60, TR * 0.60, 0.03, 32), M.siyahAcik));
        kapakYuz.rotation.x = Math.PI / 2; kapakYuz.position.z = 0.04; onYuzG.add(kapakYuz);
        /* çizimde yüzün üstünde koyu ekran şeridi var */
        var yuzEkran = new T.Mesh(new T.BoxGeometry(TR * 0.9, 0.075, 0.012),
                                  new T.MeshBasicMaterial({ color: 0x0a0c0f }));
        yuzEkran.position.set(0, TR * 0.74, 0.035); onYuzG.add(yuzEkran);

        /* ---- KADRAN (sag ust) ----
           Referansta var. SAYI YAZMIYORUZ ve IBRE OYNAMIYOR: dinlenme
           konumunda sabit. Oynayan ya da rakamli bir kadran, olculmus
           bir sicaklik sanilirdi -- sicakligi hic olcmuyoruz (K-22). */
        var yuzKadran = golgeli(new T.Mesh(
            new T.CylinderGeometry(TR * 0.20, TR * 0.20, 0.018, 24),
            new T.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.62 })));
        yuzKadran.rotation.x = Math.PI / 2;
        yuzKadran.position.set(TR * 0.50, TR * 0.44, 0.048); onYuzG.add(yuzKadran);
        var kadranCer = golgeli(new T.Mesh(
            new T.TorusGeometry(TR * 0.21, 0.014, 12, 24), M.celikMat));
        kadranCer.position.set(TR * 0.50, TR * 0.44, 0.050); onYuzG.add(kadranCer);
        for (var ct = 0; ct < 12; ct++) {
            var cta = ct * Math.PI * 2 / 12;
            var centik = new T.Mesh(new T.BoxGeometry(0.005, 0.012, 0.004),
                                    new T.MeshBasicMaterial({ color: 0x3a3a3a }));
            centik.position.set(TR * 0.50 + Math.cos(cta) * TR * 0.155,
                                TR * 0.44 + Math.sin(cta) * TR * 0.155, 0.058);
            centik.rotation.z = cta; onYuzG.add(centik);
        }
        var ibre = new T.Mesh(new T.BoxGeometry(TR * 0.15, 0.006, 0.004),
                              new T.MeshBasicMaterial({ color: 0xc0392b }));
        ibre.position.set(TR * 0.50 - TR * 0.05, TR * 0.44 - TR * 0.05, 0.059);
        ibre.rotation.z = Math.PI * 1.25; onYuzG.add(ibre);

        /* ---- BAKIR ALTIGEN SOMUN (sol ust) ---- */
        var somun = golgeli(new T.Mesh(
            new T.CylinderGeometry(TR * 0.13, TR * 0.13, 0.032, 6), M.bakir));
        somun.rotation.x = Math.PI / 2;
        somun.position.set(-TR * 0.52, TR * 0.42, 0.050); onYuzG.add(somun);

        /* ================= KASNAK = DÖNEN PARÇA (P.tambur) =================
           Gerçek tambur kapağın arkasında döner, yani görünmez; ekranda
           bu "makine bozuk" gibi durur. Dönen parça, çizimde de ön yüzde
           duran göbek ve kolları. */
        var tamburG = new T.Group();
        tamburG.position.set(TMX, TMY, ONZ + 0.10);
        kokG.add(tamburG); P.tambur = tamburG;
        var gobek = golgeli(new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.09, 20), M.celik));
        gobek.rotation.x = Math.PI / 2; tamburG.add(gobek);
        var gobekTop = golgeli(new T.Mesh(new T.SphereGeometry(0.070, 18, 14), M.celik));
        gobekTop.position.z = 0.075; tamburG.add(gobekTop);
        [0, Math.PI / 2].forEach(function (a) {
            var kol = golgeli(new T.Mesh(new T.BoxGeometry(TR * 1.05, 0.038, 0.030), M.celikMat));
            kol.rotation.z = a; tamburG.add(kol);
        });

        /* ================= HAZNE ================= */
        var hazneG = new T.Group();
        hazneG.position.set(TMX, GVT + GVH + H * 0.14, -GVU * 0.10);
        kokG.add(hazneG); P.hazne = hazneG;
        /* Çizimde huni ÇOKGEN; 30 dilim yakından yuvarlak görünüyordu.
           `flatShading` olmadan dilim sayısını düşürmek tek başına
           yetmiyor — ikisi birlikte. */
        var huni = golgeli(new T.Mesh(new T.CylinderGeometry(H * 0.17, H * 0.045, H * 0.17, 12, 1, true),
            new T.MeshStandardMaterial({ color: 0x24282d, metalness: 0.34,
                                         roughness: 0.56, side: T.DoubleSide,
                                         flatShading: true })));
        hazneG.add(huni);
        var hBant = golgeli(new T.Mesh(new T.CylinderGeometry(H * 0.175, H * 0.175, 0.055, 12, 1, true),
            new T.MeshStandardMaterial({ color: 0x2f343a, metalness: 0.5, roughness: 0.42,
                                         side: T.DoubleSide, flatShading: true })));
        hBant.position.y = H * 0.085; hazneG.add(hBant);
        /* Boyun KALIN ve govdeye GIREN bir flansla bitiyor. Onceden
           ince bir cubuktu ve huni tablanin ustunde asili gorunuyordu:
           nereye oturdugu belli degildi. */
        var boyunFlans = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.13, 0.13, 0.05, 20), M.siyahAcik));
        boyunFlans.position.set(TMX, GVT + GVH + 0.02, -GVU * 0.10);
        kokG.add(boyunFlans);
        var boyun = golgeli(new T.Mesh(new T.CylinderGeometry(0.085, 0.085, H * 0.10, 16), M.siyahAcik));
        boyun.position.set(TMX, GVT + GVH + H * 0.03, -GVU * 0.10); kokG.add(boyun);
        var kapakG = new T.Group();
        kapakG.position.set(-0.05, -H * 0.09, 0);
        hazneG.add(kapakG); P.hazneKapak = kapakG;
        var kpk = golgeli(new T.Mesh(new T.BoxGeometry(0.11, 0.016, 0.11), M.celikMat));
        kpk.position.x = 0.05; kapakG.add(kpk);
        /* hazne kolu */
        var ustKol = new T.Group();
        ustKol.position.set(TMX + GVW * 0.34, GVT + GVH + H * 0.02, -GVU * 0.02);
        kokG.add(ustKol); P.hazneKol = ustKol;
        var ukMil = golgeli(new T.Mesh(new T.CylinderGeometry(0.013, 0.013, H * 0.10, 12), M.celikMat));
        ukMil.position.y = H * 0.05; ustKol.add(ukMil);
        var ukAh = golgeli(new T.Mesh(new T.CylinderGeometry(0.026, 0.022, 0.11, 16), M.bakir));
        ukAh.position.y = H * 0.10; ustKol.add(ukAh);

        /* ================= BACA + SİKLON =================
           Çizimin sağında ayrı duran, konik tabanlı uzun silindir.
           Makinenin siluetinin bir parçası; yoksa çizime benzemiyor. */
        var SKX = KAU * 0.86;   /* siklon SAGDA, ayri duruyor */
        /* Siklonu govdeye baglayan KANAL. Onceden arada hicbir sey
           yoktu ve siklon ayri bir nesne gibi duruyordu. */
        var siklonKanal = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.05, 0.05, Math.abs(SKX - TMX) * 0.9, 16), M.siyahAcik));
        siklonKanal.rotation.z = Math.PI / 2;
        siklonKanal.position.set((SKX + TMX) / 2, GVT + H * 0.12, -GVU * 0.24);
        kokG.add(siklonKanal);
        var siklon = golgeli(new T.Mesh(new T.CylinderGeometry(H * 0.115, H * 0.115, H * 0.34, 26), M.siyah));
        siklon.position.set(SKX, GVT + H * 0.18, -GVU * 0.24); kokG.add(siklon);
        var siklonKoni = golgeli(new T.Mesh(new T.CylinderGeometry(H * 0.115, H * 0.035, H * 0.20, 26), M.siyah));
        siklonKoni.position.set(SKX, GVT - H * 0.09, -GVU * 0.24); kokG.add(siklonKoni);
        var siklonKova = golgeli(yuvarlakKutu(H * 0.15, H * 0.11, H * 0.15, 0.015, M.siyahAcik));
        /* Kova koninin ALTINA DEGMELI. Onceki yerinde arada bosluk
           vardi ve kova havada duruyordu -- kullanici bunu
           on gorunuste gordu. Koni GVT-H*0.09'da merkezli,
           yuksekligi H*0.20, yani ucu GVT-H*0.19'da bitiyor. */
        siklonKova.position.set(SKX, GVT - H * 0.245, -GVU * 0.24); kokG.add(siklonKova);
        /* Koniyi kovaya baglayan kisa boyun -- bosluk kalmasin. */
        var siklonBoyun = golgeli(new T.Mesh(
            new T.CylinderGeometry(H * 0.035, H * 0.035, H * 0.07, 18), M.siyahAcik));
        siklonBoyun.position.set(SKX, GVT - H * 0.195, -GVU * 0.24); kokG.add(siklonBoyun);
        var bacaUst = golgeli(new T.Mesh(new T.CylinderGeometry(0.055, 0.055, SKX - TMX, 18), M.siyahAcik));
        bacaUst.rotation.z = Math.PI / 2;
        bacaUst.position.set((SKX + TMX) / 2, GVT + GVH + 0.02, -GVU * 0.24);
        kokG.add(bacaUst);

        /* ---- SARI UYARI ETIKETI ----
           Fotografta govdenin on yuzunde kucuk sari bir uyari plakasi
           var. Uzerine YAZI koymuyoruz: okunamayacak kadar kucuk bir
           yazi, uydurma bir metin olurdu. */
        var uyariEt = golgeli(new T.Mesh(new T.BoxGeometry(0.10, 0.08, 0.010),
            new T.MeshStandardMaterial({ color: 0xd8b53a, roughness: 0.55 })));
        uyariEt.position.set(TMX - KAU * 0.20, GVT - KAH * 0.18,
                             KAD / 2 + 0.006);
        kokG.add(uyariEt);

        /* ---- KROM BACA (sagda, yukari kivriliyor) ----
           Fotografta govdenin sagindan yukari kivrilan parlak boru.
           Siklondan ayri: bu, govdenin ustune cikan egri hat. */
        /* SIKLON KISA VE KALIN BIR KANALLA BAGLI.
           Onceki halde govdenin ustunden siklona uzanan uzun bir krom
           hat vardi. Iki ucu da baglilydi -- sinir kutusu olcumu "havada
           degil" diyordu -- ama kullanici arkadan bakinca "ince beyaz bir
           cubuk havada" dedi ve hakliydi: UZUN ve INCE bir parca,
           uclari bagli olsa bile bosluktan gecen bir TEL gibi okunuyor.

           Olcum yanlis degildi, DARDI: "hicbir seye degmeyen var mi?"
           diye sormustum; "bosluktan gecen ince uzun parca var mi?"
           diye sormamistim.

           Referans fotografta da boru govdeye YAPISIK; havada uzun bir
           hat yok. Kisa, kalin, govdenin sagina bitisik bir kanal. */
        var siklonUst = GVT + H * 0.18 + (H * 0.34) / 2;
        var kanalBoy = Math.abs(SKX - (TMX + KAU * 0.42)) + 0.10;
        var bacaKanal = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.055, 0.055, kanalBoy, 18), M.celik));
        bacaKanal.rotation.z = Math.PI / 2;
        bacaKanal.position.set((SKX + TMX + KAU * 0.42) / 2,
                               siklonUst - 0.02, -GVU * 0.20);
        kokG.add(bacaKanal);

        /* ================= EKRAN KOLU (SOLDA) =================
           Ön görünüşte sola uzanan kolun ucunda dokunmatik panel. */
        var ekranG = new T.Group();
        /* Ekran GOVDEYE YAKIN olmali: onceki yerinde (KAU*0.78)
           kol uzunlugu (KAU*0.40) govdeye YETISMIYORDU ve panel
           havada asili duruyordu. Mesafe kol uzunlugundan kucuk
           tutuluyor ki kol her zaman govdeye degsin. */
        ekranG.position.set(TMX - KAU * 0.62, GVT + GVH * 0.72, GVU * 0.22);
        kokG.add(ekranG);
        /* Kol, ekrandan govdeye kadar UZANIR. Uzunluk ekranin
           govdeye uzakligindan buyuk secilir; kisa kalirsa boslukta
           biten bir cubuk gorunur. */
        var ekKol = golgeli(new T.Mesh(new T.CylinderGeometry(0.022, 0.022, KAU * 0.72, 14), M.celikMat));
        ekKol.rotation.z = Math.PI / 2;
        ekKol.position.x = KAU * 0.36; ekranG.add(ekKol);
        var ekKutu = golgeli(yuvarlakKutu(0.30, 0.21, 0.055, 0.018, M.siyahKoyu));
        ekranG.add(ekKutu);
        var ekCam = new T.Mesh(new T.BoxGeometry(0.25, 0.16, 0.012),
                               new T.MeshBasicMaterial({ color: 0x0d1620 }));
        ekCam.position.z = 0.034; ekranG.add(ekCam);

        /* ---- KIVRIK BAKIR BORU (on yuzde) ----
           Fotografta yuzden asagi kivrilarak inen kalin bakir hat.
           Yarim tor: bir ucu yuzun yaninda, oteki ucu asagi bakiyor. */
        var bakirBoru = golgeli(new T.Mesh(
            new T.TorusGeometry(TR * 0.62, 0.028, 12, 26, Math.PI * 0.95), M.bakir));
        bakirBoru.position.set(TMX - TR * 0.10, TMY - TR * 0.30, ONZ + 0.10);
        bakirBoru.rotation.z = -Math.PI * 0.28;
        kokG.add(bakirBoru);
        var boruUc = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.028, 0.028, TR * 0.55, 14), M.bakir));
        boruUc.position.set(TMX - TR * 0.62, TMY - TR * 0.72, ONZ + 0.10);
        kokG.add(boruUc);

        /* ================= KAŞIK (NUMUNE) ================= */
        var vanaG = new T.Group();
        vanaG.position.set(TMX - TR * 0.62, TMY - TR * 0.48, ONZ + 0.06);
        kokG.add(vanaG); P.kasik = vanaG; P.kasikZ0 = vanaG.position.z;
        var vMil = golgeli(new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.26, 12), M.bakir));
        vMil.rotation.x = Math.PI / 2; vanaG.add(vMil);
        var vKabza = golgeli(new T.Mesh(new T.CylinderGeometry(0.028, 0.024, 0.10, 16), M.bakir));
        vKabza.rotation.x = Math.PI / 2; vKabza.position.z = 0.17; vanaG.add(vKabza);
        var ksKepce = golgeli(new T.Mesh(new T.CylinderGeometry(0.034, 0.034, 0.024, 16),
                                         mat({ color: cekirdekRengi(), roughness: 0.85 })));
        ksKepce.rotation.x = Math.PI / 2; ksKepce.position.z = 0.10;
        vanaG.add(ksKepce); P.kepce = ksKepce;

        /* ================= BOŞALTMA OLUĞU + KOL ================= */
        var oluk = new T.Group();
        oluk.position.set(TMX, TMY - TR * 1.08, ONZ + 0.02);
        kokG.add(oluk); P.oluk = oluk;
        var olukYar = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.15, 0.15, 0.36, 22, 1, true, 0, Math.PI),
            new T.MeshStandardMaterial({ color: 0xa8aeb4, metalness: 0.9,
                                         roughness: 0.34, side: T.DoubleSide })));
        olukYar.rotation.x = Math.PI / 2; olukYar.rotation.y = 0.34;
        olukYar.position.set(-0.10, -0.02, 0.14); oluk.add(olukYar);
        var bosKol = new T.Group();
        /* SAGA VE ONE. Onceki yerinde (TR*0.70) kol teknenin
           arkasinda kaliyordu ve isin ona hic ulasamiyordu --
           612 noktalik izgarada SIFIR isabet. Tekne solda
           oldugu icin yuzun sagi bos; kol oraya alindi. */
        bosKol.position.set(TMX + TR * 1.32, TMY - TR * 0.20, ONZ + 0.14);
        kokG.add(bosKol); P.bosKol = bosKol;
        var bkMil = golgeli(new T.Mesh(new T.CylinderGeometry(0.013, 0.013, 0.22, 12), M.celikMat));
        bkMil.position.y = -0.11; bosKol.add(bkMil);
        var bkTop = golgeli(new T.Mesh(new T.SphereGeometry(0.055, 18, 14), M.bakir));
        bkTop.position.y = -0.24; bosKol.add(bkTop);

        /* ================= SOĞUTMA TEKNESİ =================
           Çizimde ÖNDE, gövdeden öne taşan geniş ve ALÇAK bir tekne.
           (Klasik modeldeki derin kova DEĞİL — o başka makineydi.) */
        /* Tekne ilk denemede DEVASA cikti (yaricap kaidenin 0.62'si) ve
           makinenin onunu kapatti. Cizimde tekne kaide genisligini biraz
           asan, ALCAK bir daire. */
        /* 0.44 idi. Tekne fotografta GENIS ve SIG bir tabla;
           bende dar ve derin bir kovaydi ve makinenin onunu
           kapatiyordu. */
        var TPR = KAU * 0.66;
        var TPH = H * 0.045;   /* 0.09 idi -- yariya indi */
        var TPX = TMX, TPY = GVT + TPH * 0.5, TPZ = ONZ + TPR * 0.62;
        var tepsiG = new T.Group();
        tepsiG.position.set(TPX, TPY, TPZ);
        kokG.add(tepsiG); P.tepsi = tepsiG;
        var ceper = golgeli(new T.Mesh(new T.CylinderGeometry(TPR, TPR * 0.97, TPH, 48, 1, true),
            new T.MeshStandardMaterial({ color: 0x30353b, metalness: 0.55,
                                         roughness: 0.44, side: T.DoubleSide })));
        tepsiG.add(ceper);
        /* IC CEPER: disi koyu, ICI BAKIR. Tek silindirin iki yuzu ayri
           renk olamaz, bu yuzden hafif kucuk ikinci bir silindir iceri
           geciriliyor. */
        var bakirIc = golgeli(new T.Mesh(
            new T.CylinderGeometry(TPR - 0.012, TPR * 0.955, TPH * 0.98, 48, 1, true),
            new T.MeshStandardMaterial({ color: 0xb4713a, metalness: 0.95,
                                         roughness: 0.28, side: T.BackSide })));
        tepsiG.add(bakirIc);
        /* Agiz halkasi da bakir -- fotografta tekne agzi bakir bir bant. */
        var ustHalka = golgeli(new T.Mesh(new T.TorusGeometry(TPR, 0.020, 12, 48), M.bakir));
        ustHalka.rotation.x = Math.PI / 2; ustHalka.position.y = TPH / 2; tepsiG.add(ustHalka);
        var elekD = elekDokusu(22, 3.2);
        /* TABAN BAKIR. Fotografta teknenin ici parlak bakir; disi koyu
           kaliyor. Elek dokusu korunuyor -- delikli tabla bakir da olsa
           delikli. */
        var taban = new T.Mesh(new T.CylinderGeometry(TPR - 0.01, TPR - 0.01, 0.02, 48),
                               mat({ map: elekD, roughnessMap: elekD, color: 0xb4713a,
                                     metalness: 0.92, roughness: 0.34 }));
        taban.position.y = -TPH / 2 + 0.01; taban.receiveShadow = true; tepsiG.add(taban);
        var dolgu = golgeli(new T.Mesh(new T.CylinderGeometry(TPR - 0.03, TPR - 0.04, TPH * 0.62, 44),
                                       mat({ color: cekirdekRengi(), roughness: 0.92 })));
        dolgu.position.y = -TPH * 0.14; dolgu.scale.set(0.01, 0.01, 0.01);
        tepsiG.add(dolgu); P.dolgu = dolgu;
        var kollar = new T.Group(); kollar.position.y = TPH / 2 - 0.05;
        tepsiG.add(kollar); P.kollar = kollar;
        var mil2 = golgeli(new T.Mesh(new T.CylinderGeometry(0.032, 0.044, 0.17, 16), M.celik));
        mil2.position.y = 0.085; kollar.add(mil2);
        var milTop = golgeli(new T.Mesh(new T.SphereGeometry(0.046, 16, 12), M.celik));
        milTop.position.y = 0.18; kollar.add(milTop);
        [0, Math.PI / 2].forEach(function (a) {
            var kol2 = golgeli(new T.Mesh(new T.BoxGeometry(TPR * 2 - 0.08, 0.026, 0.045), M.bakir));
            kol2.rotation.y = a; kol2.position.y = 0.01; kollar.add(kol2);
        });
        /* teknenin gövdesi kaideye kadar iniyor + boşaltma ağzı */
        /* Teknenin altindaki govde: ilk denemede yerden tepsiye kadar
           dev bir silindirdi ve makinenin onunu kapatiyordu. Cizimde
           tekne kaidenin on ucuna OTURUYOR, ayri bir kule degil. */
        /* Kaide TABLADAN INCE: fotografta tabla disari tasiyor,
           altindaki govde daha dar. Onceden neredeyse ayni capta
           oldugu icin butun parca bir kova gibi gorunuyordu. */
        var teknGovde = golgeli(new T.Mesh(new T.CylinderGeometry(TPR * 0.58, TPR * 0.54, (GVT - KAY) * 0.62, 40), M.siyah));
        teknGovde.position.set(TPX, GVT - (GVT - KAY) * 0.31, TPZ); kokG.add(teknGovde);
        /* Teknenin sol yaninda, kolun ucunda SIYAH TOPUZ (fotografta
           bariz). Kol zaten vardi, ucu bostu. */
        var teknKol = golgeli(new T.Mesh(
            new T.CylinderGeometry(0.014, 0.014, TPR * 0.55, 12), M.celikMat));
        teknKol.rotation.z = Math.PI / 2 + 0.28;
        teknKol.position.set(TPX - TPR * 0.92, TPY - TPH * 0.30, TPZ + 0.06);
        kokG.add(teknKol);
        var teknTopuz = golgeli(new T.Mesh(new T.SphereGeometry(0.042, 16, 12), M.siyahKoyu));
        teknTopuz.position.set(TPX - TPR * 1.18, TPY - TPH * 0.62, TPZ + 0.06);
        kokG.add(teknTopuz);

        var teknAgiz = golgeli(yuvarlakKutu(0.22, 0.13, 0.20, 0.012, M.siyahAcik));
        teknAgiz.position.set(TPX - TPR - 0.03, TPY - TPH * 0.9, TPZ + 0.10); kokG.add(teknAgiz);

        /* ================= ALEV ================= */
        var alev = new T.Mesh(new T.ConeGeometry(0.16, 0.24, 18),
                              new T.MeshBasicMaterial({ color: 0xffa445, transparent: true, opacity: 0 }));
        alev.position.set(TMX, GVT + 0.06, 0); kokG.add(alev); P.alev = alev;
        var alevIsik = new T.PointLight(0xff8a2a, 0, 2.2);
        alevIsik.position.copy(alev.position); kokG.add(alevIsik); P.alevIsik = alevIsik;

        /* ================= ÇEKİRDEK ================= */
        var taneG = new T.IcosahedronGeometry(0.020, 0);
        var taneM = mat({ color: cekirdekRengi(), roughness: 0.85 });
        taneler = new T.InstancedMesh(taneG, taneM, 46);
        taneler.instanceMatrix.setUsage(T.DynamicDrawUsage);
        taneler.castShadow = true; kokG.add(taneler); P.taneMat = taneM;
        akis = new T.InstancedMesh(taneG, mat({ color: 0x5a3a22, roughness: 0.9 }), 46);
        akis.instanceMatrix.setUsage(T.DynamicDrawUsage);
        akis.castShadow = true; kokG.add(akis);
        gizleHepsi(taneler); gizleHepsi(akis);

        /* Tane yolları GEOMETRİYLE birlikte taşındı. Eski koordinatlar
           kalsaydı çekirdek makinenin dışına dökülürdü — "çalışıyor ama
           yanlış yerde", en sinsi hâli. */
        P.yol = {
            dokumBas: [TMX, GVT + GVH + H * 0.06, -GVU * 0.10],
            dokumSon: [TMX, TMY, -GVU * 0.10],
            akisBas:  [TMX, TMY - TR * 1.12, ONZ + 0.06],
            akisSon:  [TPX, TPY + TPH * 0.4, TPZ]
        };

        /* ---- DOKUNMA VEKILLERI ----
           Olculdu: tuvale tiklandiginda bes noktadan yalniz biri (huni)
           tepki veriyordu. Ekranda "makinenin parcalarina dokunun"
           yaziyor; yazi vaat ediyor, uygulama tutmuyordu.

           Sebep parcalarin INCE olmasi: kasik yaricapi 0,016 olan bir
           cubuk, bosaltma kolu ince bir mil. Isin onlari ancak piksel
           isabetiyle yakaliyor -- parmakla kullanilan bir arayuzde bu
           "hic calismiyor" demektir.

           Cozum: her parcaya GORUNMEZ ama GENIS bir vekil. `visible:
           false` olan mesh CIZILMEZ ama isin onu yine de keser -- yani
           gorunum hic degismiyor, yalniz hedef buyuyor. Vekil parcanin
           KENDI grubuna ekleniyor, boylece parca hareket edince (kol
           donuyor, kasik disari cikiyor) vekil de onunla gidiyor. */
        function dokunmaVekili(grup, gen, yuk, der, kaydir) {
            var m = new T.Mesh(new T.BoxGeometry(gen, yuk, der),
                               new T.MeshBasicMaterial({ visible: false }));
            if (kaydir) m.position.set(kaydir[0], kaydir[1], kaydir[2]);
            grup.add(m);
            return m;
        }
        dokunmaVekili(hazneG, 0.62, 0.62, 0.62);
        dokunmaVekili(ustKol, 0.26, 0.42, 0.26, [0, 0.16, 0]);
        /* Kasik olcumde en zayif hedefti (612 noktalik izgarada
           2-3 nokta). Vekil buyutuldu; gorunum degismiyor. */
        dokunmaVekili(vanaG,  0.52, 0.44, 0.56, [0, 0, 0.12]);
        dokunmaVekili(bosKol, 0.34, 0.52, 0.34, [0, -0.18, 0]);
        dokunmaVekili(oluk,   0.46, 0.30, 0.40, [-0.10, -0.04, 0.14]);
        dokunmaVekili(tepsiG, TPR * 2.05, TPH + 0.30, TPR * 2.05);

        P.tiklanabilir = [
            { ad: 'hazne', ogeler: [hazneG, ustKol] },
            { ad: 'kasik', ogeler: [vanaG] },
            { ad: 'bosalt', ogeler: [bosKol, oluk] },
            { ad: 'tepsi', ogeler: [tepsiG] }
        ];
    }

    var GECICI = null;
    function gizleHepsi(im) {
        if (!GECICI) GECICI = new T.Matrix4();
        GECICI.makeScale(0.0001, 0.0001, 0.0001);
        for (var i = 0; i < im.count; i++) im.setMatrixAt(i, GECICI);
        im.instanceMatrix.needsUpdate = true;
    }

    function taneBaslat(liste, adet, kaynak, hedef, yayilma) {
        liste.length = 0;
        for (var i = 0; i < adet; i++) {
            liste.push({
                gecikme: i * 0.045,
                t: 0,
                x0: kaynak[0] + (Math.random() - 0.5) * yayilma,
                z0: kaynak[2] + (Math.random() - 0.5) * yayilma,
                y0: kaynak[1],
                x1: hedef[0] + (Math.random() - 0.5) * yayilma * 2.2,
                z1: hedef[2] + (Math.random() - 0.5) * yayilma * 2.2,
                y1: hedef[1],
                donus: Math.random() * 6.28
            });
        }
    }

    function taneCiz(im, liste, dt) {
        if (!GECICI) GECICI = new T.Matrix4();
        var canli = false;
        for (var i = 0; i < im.count; i++) {
            var v = liste[i];
            if (!v) { GECICI.makeScale(0.0001, 0.0001, 0.0001); im.setMatrixAt(i, GECICI); continue; }
            v.gecikme -= dt;
            if (v.gecikme > 0) { GECICI.makeScale(0.0001, 0.0001, 0.0001); im.setMatrixAt(i, GECICI); canli = true; continue; }
            v.t += dt / 0.62;
            if (v.t >= 1) { GECICI.makeScale(0.0001, 0.0001, 0.0001); im.setMatrixAt(i, GECICI); continue; }
            canli = true;
            var t = v.t, e = t * t;                     // yerçekimi: hızlanarak
            GECICI.makeRotationY(v.donus + t * 7);
            GECICI.setPosition(
                v.x0 + (v.x1 - v.x0) * t,
                v.y0 + (v.y1 - v.y0) * e,
                v.z0 + (v.z1 - v.z0) * t);
            im.setMatrixAt(i, GECICI);
        }
        im.instanceMatrix.needsUpdate = true;
        return canli;
    }

    /* ---------------- döngü ---------------- */
    function kare() {
        if (!acikMi) { dongu = 0; return; }
        dongu = requestAnimationFrame(kare);
        var dt = Math.min(saat.getDelta(), 0.05);

        if (durum.sarjli && !durum.bosaldi) P.tambur.rotation.z -= dt * 1.7;
        if (durum.bosaldi) P.kollar.rotation.y += dt * 1.1;

        // hedeflere yumuşak yaklaşma: hareket ani değil, mekanik
        var hedefKapak = durum.sarjli ? -1.35 : 0;
        P.hazneKapak.rotation.z += (hedefKapak - P.hazneKapak.rotation.z) * Math.min(1, dt * 7);
        var hedefKol = durum.sarjli ? -0.9 : 0;
        P.hazneKol.rotation.z += (hedefKol - P.hazneKol.rotation.z) * Math.min(1, dt * 7);
        var hedefBos = durum.bosaldi ? 1.1 : 0;
        P.bosKol.rotation.z += (hedefBos - P.bosKol.rotation.z) * Math.min(1, dt * 6);
        P.oluk.rotation.x += ((durum.bosaldi ? 0.3 : 0) - P.oluk.rotation.x) * Math.min(1, dt * 6);
        var hedefKasik = durum.kasikta ? 0.42 : 0;
        P.kasik.position.z += ((P.kasikZ0 + hedefKasik) - P.kasik.position.z) * Math.min(1, dt * 9);

        var hedefDolgu = durum.bosaldi ? 1 : 0.01;
        var s = P.dolgu.scale.x + (hedefDolgu - P.dolgu.scale.x) * Math.min(1, dt * 3);
        P.dolgu.scale.set(s, Math.max(0.01, s), s);

        var alevGuc = (durum.sarjli && !durum.bosaldi) ? 1 : 0;
        var titrek = alevGuc * (0.72 + Math.sin(performance.now() / 90) * 0.14 + Math.random() * 0.1);
        P.alev.material.opacity += (titrek - P.alev.material.opacity) * Math.min(1, dt * 8);
        P.alev.scale.y = 0.8 + titrek * 0.5;
        P.alevIsik.intensity += (titrek * 2.6 - P.alevIsik.intensity) * Math.min(1, dt * 8);

        if (taneVeri.length) { if (!taneCiz(taneler, taneVeri, dt)) taneVeri.length = 0; }
        if (akisVeri.length) { if (!taneCiz(akis, akisVeri, dt)) akisVeri.length = 0; }

        P.kok.rotation.y += (donme.y - P.kok.rotation.y) * Math.min(1, dt * 9);
        P.kok.rotation.x += (donme.x - P.kok.rotation.x) * Math.min(1, dt * 9);

        ciz.render(sahne, kamera);
    }

    /* KADRAJ ELLE DEGIL OLCUYLE KURULUR.
       Bu dosyada kameranin ustunde ust uste BES ayri "kadraj duzeltme"
       yorumu birikmisti: her parca degisiminde biri cerceveden tasiyor,
       biri kamerayi elle geri cekiyordu. Duzeltilen hep O SEFERKI
       tasmaydi; bir sonraki degisiklikte yeniden bozuluyordu.

       Artik makinenin GERCEK sinir kutusu olculuyor ve kamera ona gore
       yerlestiriliyor. Parca eklense de buyutulse de kadraj kendini
       toparlar. Olcum, duran pozda (donme uygulanmis halde) yapiliyor;
       yoksa makine donunce kose disari tasardi. */
    function kadrajaOturt(hedef) {
        var kok = hedef || P.kok;
        if (!kok || !kamera) return;
        /* Duran poz: `kare()` bu iki degere yumusayarak gidiyor. */
        kok.rotation.x = donme.x;
        kok.rotation.y = donme.y;
        kok.updateMatrixWorld(true);

        var kutu = new T.Box3().setFromObject(kok);
        if (kutu.isEmpty()) return;
        var merkez = kutu.getCenter(new T.Vector3());
        var boy = kutu.getSize(new T.Vector3());

        var yariDik = T.MathUtils.degToRad(kamera.fov) / 2;
        var yariYatay = Math.atan(Math.tan(yariDik) * kamera.aspect);
        /* Makine Y ekseninde donuyor; en genis kesit X ile Z'nin
           buyugu kadar olabilir. Kucugunu alsaydik donunce tasardi. */
        var en = Math.max(boy.x, boy.z);
        var uzaklik = Math.max(en / 2 / Math.tan(yariYatay),
                               boy.y / 2 / Math.tan(yariDik));
        uzaklik = uzaklik * 1.16 + boy.z / 2;   /* pay + derinlik */

        /* Yukseklik carpani 0,13 -> 0,24. Sebep BICIM degil ISLEV:
           tekne derinlesince kamera neredeyse agiz hizasinda kaliyordu
           ve icine dokulen cekirdek hic gorunmuyordu -- "bosalt"
           komutu ekranda hicbir sey degistirmiyordu. Referans render de
           zaten hafif YUKARIDAN; hem tekneye bakabiliyoruz hem referansa
           yaklasiyoruz. */
        kamera.position.set(merkez.x + uzaklik * 0.26,
                            merkez.y + uzaklik * 0.24,
                            merkez.z + uzaklik);
        kamera.lookAt(merkez.x, merkez.y, merkez.z);
        kamera.updateProjectionMatrix();
        P.kadraj = { merkez: merkez, boy: boy, uzaklik: uzaklik };
    }

    function olcuAyarla() {
        if (!kap || !ciz) return;
        var g = kap.clientWidth || 600;
        var y = Math.round(g * 0.88);
        ciz.setSize(g, y, false);
        kamera.aspect = g / y;
        kamera.updateProjectionMatrix();
        /* En-boy orani degisince gereken uzaklik da degisir; dar bir
           telefonda eski uzaklik makineyi yanlardan keserdi. */
        kadrajaOturt();
    }

    /* ---------------- dış yüzey ---------------- */
    function kurulumYap(kapsayici, tiklandi) {
        kap = kapsayici;
        ciz = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        ciz.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        enBuyukAniso = (ciz.capabilities && ciz.capabilities.getMaxAnisotropy) ?
            Math.min(8, ciz.capabilities.getMaxAnisotropy()) : 1;
        kucukAygit = Math.min(innerWidth, innerHeight) < 520;
        azHareket = !!(window.matchMedia &&
            matchMedia('(prefers-reduced-motion: reduce)').matches);
        ciz.outputColorSpace = T.SRGBColorSpace || ciz.outputColorSpace;
        ciz.toneMapping = T.ACESFilmicToneMapping;
        ciz.toneMappingExposure = 1.3;
        /* GÖLGE OLMADAN NESNE HAVADA DURUR. Yumuşak gölge, makinenin
           yere bastığını anlatan tek şey. */
        ciz.shadowMap.enabled = true;
        ciz.shadowMap.type = T.PCFSoftShadowMap;
        tuval = ciz.domElement;
        tuval.style.width = '100%';
        tuval.style.height = 'auto';
        tuval.style.display = 'block';
        tuval.style.touchAction = 'none';
        tuval.setAttribute('aria-hidden', 'true');

        sahne = new T.Scene();
        /* Konum burada VERILMIYOR. Makine kurulduktan sonra
           `kadrajaOturt()` sinir kutusunu olcup kamerayi yerlestiriyor.
           Elle yazilan her sayi, bir sonraki parca degisiminde
           bayatliyordu. */
        kamera = new T.PerspectiveCamera(30, 1.2, 0.1, 100);

        sahne.environment = cevreHaritasi();
        sahne.add(new T.HemisphereLight(0xd8e2ff, 0x2a2018, 0.42));
        var yon = new T.DirectionalLight(0xfff0dc, 2.1);
        yon.position.set(-4.2, 6.4, 4.6);
        yon.castShadow = true;
        yon.shadow.mapSize.set(1024, 1024);
        yon.shadow.camera.near = 1; yon.shadow.camera.far = 22;
        yon.shadow.camera.left = -5; yon.shadow.camera.right = 5;
        yon.shadow.camera.top = 6; yon.shadow.camera.bottom = -2;
        yon.shadow.bias = -0.0012;
        yon.shadow.normalBias = 0.02;
        sahne.add(yon);
        var dolgu = new T.DirectionalLight(0x8aa8ff, 0.45);
        dolgu.position.set(5, 2.2, -3.4); sahne.add(dolgu);
        /* MAT SIYAH GOVDE KOYU ARKA PLANDA KAYBOLUYOR.
           Arkadan gelen kenar isigi siluetin cizgisini ceker; onsuz
           makine arka planla birlesiyor. Fotografta da bu var. */
        var kenar = new T.DirectionalLight(0xffe0bc, 1.15);
        kenar.position.set(3.2, 2.6, -4.6); sahne.add(kenar);
        var kenar2 = new T.DirectionalLight(0xbcd4ff, 0.75);
        kenar2.position.set(-3.6, 2.2, -3.2); sahne.add(kenar2);
        var onDolgu = new T.DirectionalLight(0xffffff, 0.28);
        onDolgu.position.set(0.5, 1.2, 6); sahne.add(onDolgu);

        /* Zemin: gölgeyi tutar ama kendisi görünmez — sayfanın arka planı
           neyse onun üzerine düşer. */
        var zemin = new T.Mesh(new T.PlaneGeometry(40, 40),
                               new T.ShadowMaterial({ opacity: 0.42 }));
        zemin.rotation.x = -Math.PI / 2;
        zemin.position.y = 0;
        zemin.receiveShadow = true;
        sahne.add(zemin);

        dokulariUret();     /* malzemelerden ONCE: M dokulara bagli */
        makineyiKur();
        kadrajaOturt();
        saat = new T.Clock();
        kap.appendChild(tuval);
        olcuAyarla();
        addEventListener('resize', olcuAyarla, { passive: true });

        /* Döndürme: parmak/fare. Dikey açı kısıtlı, yoksa makine ters
           dönüyor ve kullanıcı nerede olduğunu kaybediyor. */
        /* DONDURME VE SECIM BIR ARADA.
           Once serbest dondurme vardi ve dokunusla karisiyordu; sonra
           dondurme tamamen kapatildi ve bu sefer makineyi cevirmek
           imkansiz oldu. Dogrusu ikisini AYIRMAK:
             - parmagi GEZDIRIRSEN doner (esik: 7 piksel)
             - KISA dokunursan parca secilir (7 pikselden az VE 400 ms
               altinda)
           Boylece yanlislikla ne parca seciliyor ne de secmek
           isterken makine kayiyor.

           Dikey aci KISITLI (-0.5..+0.45): sinirsiz birakilirsa makine
           ters doner ve kullanici nerede oldugunu kaybeder.
           touchAction none SART, yoksa telefonda parmak hareketi
           sayfayi kaydirir ve dondurme hic calismaz. */
        tuval.style.cursor = 'grab';
        tuval.style.touchAction = 'none';
        var bas = null;
        tuval.addEventListener('pointerdown', function (e) {
            bas = { x: e.clientX, y: e.clientY, an: Date.now(), kaydi: false };
            donme.sonX = e.clientX; donme.sonY = e.clientY;
            tuval.style.cursor = 'grabbing';
            try { tuval.setPointerCapture(e.pointerId); } catch (x) {}
        });
        tuval.addEventListener('pointermove', function (e) {
            /* SURUKLEMIYORKEN: uzerinden gecilen parcayi bul, imleci
               degistir. Kullanici "uzerinde etkilesim olsun" dedi;
               tiklanabilir oldugunu gosteren tek sey buydu ve yoktu.
               Isin atisi her harekette degil, ~60 ms'de bir -- sahne
               kucuk ama her pikselde raycast bosuna is. */
            if (!bas) {
                var simdi = (performance && performance.now) ? performance.now() : 0;
                if (simdi - sonVurguAn < 60) return;
                sonVurguAn = simdi;
                var ustunde = secim(e);
                P.vurgu = ustunde || null;
                tuval.style.cursor = ustunde ? 'pointer' : 'grab';
                return;
            }
            var tx = e.clientX - bas.x, ty = e.clientY - bas.y;
            if (!bas.kaydi && (Math.abs(tx) + Math.abs(ty)) > 7) bas.kaydi = true;
            if (!bas.kaydi) return;
            donme.y += (e.clientX - donme.sonX) * 0.008;
            donme.x = Math.max(-0.5, Math.min(0.45, donme.x - (e.clientY - donme.sonY) * 0.006));
            donme.sonX = e.clientX; donme.sonY = e.clientY;
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (o) {
            tuval.addEventListener(o, function (e) {
                if (!bas) return;
                var kisa = !bas.kaydi && (Date.now() - bas.an) < 400;
                bas = null;
                tuval.style.cursor = 'grab';
                if (kisa && o === 'pointerup') secim(e, tiklandi);
            });
        });
        /* Klavye: ok tuslariyla da cevrilsin. */
        tuval.tabIndex = 0;
        tuval.addEventListener('keydown', function (e) {
            var a2 = e.shiftKey ? 0.24 : 0.08, t = true;
            if (e.key === 'ArrowLeft') donme.y -= a2;
            else if (e.key === 'ArrowRight') donme.y += a2;
            else if (e.key === 'ArrowUp') donme.x = Math.max(-0.5, donme.x - a2 * 0.6);
            else if (e.key === 'ArrowDown') donme.x = Math.min(0.45, donme.x + a2 * 0.6);
            else t = false;
            if (t) e.preventDefault();
        });

        hazir = true;
        hazirModeliDene();   /* makine.glb varsa devralir */
    }

    var isin = null, nokta = null;
    function secim(e, tiklandi) {
        if (!isin) { isin = new T.Raycaster(); nokta = new T.Vector2(); }
        var r = tuval.getBoundingClientRect();
        nokta.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        nokta.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        isin.setFromCamera(nokta, kamera);
        var vurus = isin.intersectObjects(sahne.children, true);
        if (!vurus.length) return;
        /* EN YAKIN NESNE DEGIL, EN YAKIN TIKLANABILIR PARCA.
           Onceden yalniz en yakin nesneye bakiliyordu; onunde
           tiklanamaz bir
           govde varsa parca ULASILMAZ oluyordu. Olculdu (07.09.2026,
           isabet haritasi): dort parcadan bosaltma kolu SIFIR noktadan,
           kasik iki noktadan ulasilabiliyordu -- ekranda "parcalarina
           dokunun" yazdigi halde.
           Bu bir diyagram, fizik benzetimi degil: kullanici kola
           nisan aldiysa niyeti bellidir. Isin listesi bastan gezilip
           ILK tiklanabilir parca aliniyor. */
        var ad = null;
        for (var v = 0; v < vurus.length && !ad; v++) {
            var o = vurus[v].object;
            while (o && !ad) {
                for (var i = 0; i < P.tiklanabilir.length; i++) {
                    if (P.tiklanabilir[i].ogeler.indexOf(o) >= 0) { ad = P.tiklanabilir[i].ad; break; }
                }
                o = o.parent;
            }
        }
        if (ad && tiklandi) tiklandi(ad);
        return ad;
    }

    /* ---------------- HAZIR MODEL (glTF) ----------------
       Klasorde `makine.glb` varsa makine ONUNLA cizilir; yoksa elle
       yazilmis model kalir. Dosya gelince kod degistirmek gerekmiyor.

       Neden boyle: kullanici birebir benzerlik istedi. Elle modelleme
       dokuz turda yaklasti ama tutmadi; dogru lisansli hazir bir model
       bunu tek adimda cozer. Yedek yol duruyor, yani dosya yoksa ya da
       bozuksa uygulama yine calisir. */
    function hazirModeliDene() {
        if (!T.GLTFLoader) return;                  // okuyucu yuklenmemis
        var okuyucu = new T.GLTFLoader();
        okuyucu.load('makine.glb', function (gltf) {
            try { hazirModeliYerlestir(gltf.scene); }
            catch (x) {
                if (window.console && console.error) console.error('makine.glb yerlesemedi:', x);
            }
        }, undefined, function () {
            /* Dosya yok ya da okunamadi: sessizce elle yazilmis modelde
               kalinyor. Bu bir hata degil, beklenen durum. */
        });
    }

    function hazirModeliYerlestir(nesne) {
        /* Olcek ve konum: modelin kendi birimi bilinmiyor. Sinir
           kutusundan olculup makinemizin boyuna (yaklasik 2.9 birim)
           oturtuluyor; boylece kamera ve isik ayari bozulmuyor. */
        var kutu = new T.Box3().setFromObject(nesne);
        var boy = new T.Vector3(); kutu.getSize(boy);
        var merkez = new T.Vector3(); kutu.getCenter(merkez);
        var enBuyuk = Math.max(boy.x, boy.y, boy.z) || 1;
        /* HEDEF BOY ELLE YAZILMIYOR. Onceden sabit "2.9" vardi; o sayi
           makinenin O GUNKU boyuydu ve makine bastan yazilinca sessizce
           bayatladi. Simdi elle yazilmis modelin GERCEK yuksekligi
           olculuyor -- hazir model onun yerine gececegi icin dogru
           olcut o. */
        var bizimKutu = new T.Box3().setFromObject(P.kok);
        var bizimBoy = new T.Vector3(); bizimKutu.getSize(bizimBoy);
        var hedefBoy = Math.max(bizimBoy.x, bizimBoy.y, bizimBoy.z) || 2.9;
        var olcek = hedefBoy / enBuyuk;
        nesne.scale.setScalar(olcek);
        nesne.position.set(-merkez.x * olcek,
                           -kutu.min.y * olcek,
                           -merkez.z * olcek);
        nesne.traverse(function (o) {
            if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });

        /* Elle yazilmis model GORUNMEZ oluyor ama SILINMIYOR:
           tiklama vekilleri ondan geliyor ve hareketli parcalar
           (kapak, kol, kasik, kollar) hala kare() tarafindan
           surulUYOR. Silseydik dongu tanimsiza carpardi. */
        P.kok.traverse(function (o) {
            if (o.isMesh && o.material) {
                if (Array.isArray(o.material)) o.material.forEach(function (m) { m.visible = false; });
                else o.material.visible = false;
            }
        });
        sahne.add(nesne);
        P.hazir = nesne;
        /* KADRAJ HAZIR MODELE GORE YENIDEN. Kurulumda kamera elle
           yazilmis modele gore oturtulmustu; hazir model SONRADAN
           geliyor ve olculeri baska. Bu satir olmadan sinama modeli
           cerceveden tasiyordu -- kullanicinin gercek bir model
           koydugunda ilk gorecegi sey oydu. */
        kadrajaOturt(nesne);

        /* DUGUM ADLARI: hazir modelin parcalarini dogrudan tiklamaya
           baglamak icin adlarini bilmek gerekiyor. Uydurma bir
           eslestirme yazmak yerine adlari yaziyoruz; adlar gorulunce
           eslestirme elle kurulacak (K-94: kaynagi olmayan varsayimla
           is yapilmaz). */
        var adlar = [];
        nesne.traverse(function (o) { if (o.name) adlar.push(o.name); });
        kok.MAKINE_GLB_DUGUMLERI = adlar;
        if (window.console && console.log) {
            console.log('makine.glb yuklendi. Dugum sayisi:', adlar.length);
            console.log('Dugum adlari:', adlar.slice(0, 80).join(', '));
        }
    }

    kok.Makine3D = {
        destekleniyorMu: function () {
            try {
                var c = document.createElement('canvas');
                return !!(window.WebGLRenderingContext &&
                          (c.getContext('webgl2') || c.getContext('webgl')));
            } catch (x) { return false; }
        },
        hazirMi: function () { return hazir; },
        kur: function (kapsayici, THREE, tiklandi) {
            if (hazir) return true;
            T = THREE;
            try { kurulumYap(kapsayici, tiklandi); return true; }
            catch (x) {
                /* SESSIZ YUTMA YOK. Once bu catch hatayi yutuyordu ve
                   3B "acilmadi" diye fotografa dusuyordu; sebebi
                   gorunmuyordu. Yedege dusmek dogru, ama SEBEBI
                   soylemeden dusmek hatayi saklar (K-89). */
                if (window.console && console.error) console.error('Makine3D kurulamadi:', x);
                kok.MAKINE3D_HATA = (x && x.message) ? x.message : String(x);
                hazir = false; return false;
            }
        },
        ac: function () { if (!hazir || acikMi) return; acikMi = true; saat.getDelta(); kare(); },
        kapa: function () { acikMi = false; if (dongu) cancelAnimationFrame(dongu); dongu = 0; },
        /* Kavrulma ölçüldüyse renk buradan gelir; ölçüm yoksa yeşil kalır. */
        kavrulmaVer: function (oran) {
            kavrulma = (typeof oran === 'number' && isFinite(oran)) ? oran : null;
            if (!hazir) return;
            var r = cekirdekRengi();
            P.taneMat.color.setHex(r);
            P.kepce.material.color.setHex(durum.kasikta ? r : 0xc9a04c);
            P.dolgu.material.color.setHex(r);
        },
        eylem: function (ad) {
            if (!hazir) return;
            if (ad === 'hazne') {
                if (durum.sarjli) return;
                durum.sarjli = true;
                taneBaslat(taneVeri, 40, P.yol.dokumBas, P.yol.dokumSon, 0.18);
            } else if (ad === 'kasik') {
                durum.kasikta = !durum.kasikta;
                P.kepce.material.color.setHex(durum.kasikta ? cekirdekRengi() : 0xc9a04c);
            } else if (ad === 'bosalt') {
                if (!durum.sarjli || durum.bosaldi) return;
                durum.bosaldi = true; durum.kasikta = false;
                taneBaslat(akisVeri, 42, P.yol.akisBas, P.yol.akisSon, 0.16);
            } else if (ad === 'bastan') {
                durum.sarjli = durum.kasikta = durum.bosaldi = false;
                taneVeri.length = 0; akisVeri.length = 0;
                gizleHepsi(taneler); gizleHepsi(akis);
                P.kepce.material.color.setHex(0xc9a04c);
            }
        },
        durumVer: function () { return { sarjli: durum.sarjli, kasikta: durum.kasikta, bosaldi: durum.bosaldi }; },
        /* Su an imlecin altindaki tiklanabilir parca (yoksa null).
           Hem arayuz icin, hem OLCUM icin: dokunmanin calistigini
           dolayli gostergelerle (durum, mesaj) olcmeye calismak
           yetmedi -- ikisi de her parcayi yansitmiyor. */
        vurguVer: function () { return P.vurgu || null; },
        /* HAVADA DURAN PARCALARI BULUR.
           Kullanici uc kez "havada duruyor" dedi; her seferinde tek bir
           parca duzeltildi ve dorduncu tur yine ayni sikayetle geldi.
           Gozle kovalamak bitmiyor -- her yeni parca ayni riski tasiyor.
           Bu islev sahnedeki her mesh'in sinir kutusunu alip BASKA
           hicbir parcaya degmeyenleri listeliyor.

           SINIRI: sinir kutusu KABADIR. Egri bir boru, kutusuyla baska
           bir kutuya degiyor gorunup gercekte degmeyebilir. Yani bos
           liste "temiz" degil, "kaba elekten gecti" demektir; gozle
           bakmanin yerine gecmez, isini daraltir (K-96). */
        havadaOlanlar: function (tolerans) {
            if (!P.kok || !T) return null;
            var t = (tolerans === undefined) ? 0.02 : tolerans;
            var kutular = [];
            P.kok.updateMatrixWorld(true);
            P.kok.traverse(function (o) {
                if (!o.isMesh || !o.geometry) return;
                if (o.material && o.material.visible === false) return;  /* dokunma vekilleri */
                var k = new T.Box3().setFromObject(o);
                if (k.isEmpty()) return;
                k.expandByScalar(t);
                kutular.push({ ad: o.name || o.geometry.type, kutu: k, oge: o });
            });
            var havada = [];
            for (var i = 0; i < kutular.length; i++) {
                var degdi = false;
                for (var j = 0; j < kutular.length && !degdi; j++) {
                    if (i === j) continue;
                    if (kutular[i].oge.parent === kutular[j].oge) continue;  /* ata-cocuk sayilmaz */
                    if (kutular[i].kutu.intersectsBox(kutular[j].kutu)) degdi = true;
                }
                if (!degdi) {
                    var m = kutular[i].kutu.getCenter(new T.Vector3());
                    havada.push({ ad: kutular[i].ad,
                                  x: +m.x.toFixed(2), y: +m.y.toFixed(2), z: +m.z.toFixed(2) });
                }
            }
            return { sayi: havada.length, toplamParca: kutular.length, havada: havada };
        },
        /* Verilen tuval noktasinda hangi parca var? Olcum ve sinama
           icin; arayuz bunu kullanmiyor. */
        noktadaNeVar: function (x, y) {
            if (!tuval || !kamera) return null;
            return secim({ clientX: x, clientY: y }) || null;
        }
    };
})(window);
