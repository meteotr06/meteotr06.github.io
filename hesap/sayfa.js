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
    { yol: "yakit-maliyeti-hesaplama.html", ad: "Yakıt Maliyeti", aciklama: "Yol kaç lira tutar", grup: "Araç", anahtar: "yakıt benzin mazot motorin lpg yol masrafı km litre araç seyahat tatil" },
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
    { yol: "saat-sure-hesaplama.html", ad: "Saat ve Süre", aciklama: "Mesai süresi, süre toplama", grup: "Genel", anahtar: "saat süre mesai vardiya çalışma dakika ondalık gece vardiyası mola bordro puantaj zaman fark" },
    { yol: "tapu-harci-hesaplama.html", ad: "Tapu Harcı", aciklama: "Alıcı ve satıcı ne kadar öder", grup: "Ev ve Yaşam", anahtar: "tapu harcı ev alım satım gayrimenkul konut arsa devir rayiç döner sermaye binde 20 masraf" },
    { yol: "emlak-vergisi-hesaplama.html", ad: "Emlak Vergisi", aciklama: "Konut, iş yeri, arsa; taksitler", grup: "Ev ve Yaşam", anahtar: "emlak vergisi bina arsa arazi işyeri belediye taksit muafiyet emekli değerli konut vergisi büyükşehir" },
    { yol: "kar-marji-hesaplama.html", ad: "Kâr Marjı", aciklama: "Satış fiyatı, marj ve markup", grup: "Ticaret", anahtar: "kâr marjı markup satış fiyatı maliyet esnaf ticaret e-ticaret komisyon kârlılık fiyatlandırma zarar" },
    { yol: "iskonto-hesaplama.html", ad: "İskonto", aciklama: "Ardışık indirimde gerçek oran", grup: "Ticaret", anahtar: "iskonto indirim ardışık kademeli liste fiyatı net fiyat bayi toptan kampanya ihale teklif" },
    { yol: "dogalgaz-faturasi-hesaplama.html", ad: "Doğalgaz Faturası", aciklama: "m³'ten kWh'a, sayaçtan faturaya", grup: "Ev ve Yaşam", anahtar: "doğalgaz fatura m3 metreküp kwh sayaç ısıl değer kombi ısınma abonelik igdaş başkentgaz" },
    { yol: "dogum-izni-hesaplama.html", ad: "Doğum İzni", aciklama: "24 hafta — yeni düzenleme", grup: "Maaş ve Çalışma", anahtar: "doğum izni analık izni süt izni babalık izni 24 hafta 16 hafta hamile gebe çoğul ücretsiz izin sgk analık ödeneği 7578" },
    { yol: "kira-geliri-vergisi-hesaplama.html", ad: "Kira Geliri Vergisi", aciklama: "İstisna, götürü/gerçek gider", grup: "Ev ve Yaşam", anahtar: "kira geliri vergisi gmsi beyanname istisna götürü gider gerçek gider ev sahibi mart temmuz taksit hazır beyan stopaj" },
    { yol: "gebelik-haftasi-hesaplama.html", ad: "Gebelik Haftası", aciklama: "Tahmini doğum tarihi", grup: "Sağlık", anahtar: "gebelik haftası hamilelik kaçıncı hafta tahmini doğum tarihi naegele son adet trimester üç ay bebek" },
    { yol: "kiralamak-mi-satin-almak-mi.html", ad: "Kirala mı Al mı", aciklama: "Ev: dürüst karşılaştırma", grup: "Ev ve Yaşam", anahtar: "ev almak kiralamak kira mı taksit mi konut kredisi peşinat fırsat maliyeti yatırım başabaş değer artışı" },
    { yol: "elektrikli-arac-sarj-maliyeti.html", ad: "Şarj Maliyeti", aciklama: "Elektrikli araç vs benzinli", grup: "Araç", anahtar: "elektrikli araç şarj maliyeti kwh 100 km benzinli karşılaştırma ev şarjı istasyon hızlı şarj togg tesla menzil" },
    { yol: "araba-masrafi-hesaplama.html", ad: "Araba Masrafı", aciklama: "Değer kaybı dahil gerçek maliyet", grup: "Araç", anahtar: "araba masrafı araç gideri sahip olma maliyeti değer kaybı amortisman mtv kasko sigorta bakım lastik km başına otomobil" },
    { yol: "lpg-donusum-amortisman-hesaplama.html", ad: "LPG Amortismanı", aciklama: "Kaç ayda kendini çıkarır", grup: "Araç", anahtar: "lpg dönüşüm amortisman tasarruf benzin karşılaştırma otogaz tüp montaj kaç ayda amorti başabaş" }
];

// ---------- Rehberler ----------
// İnsanlar tek bir hesapla değil, bir DURUMLA gelir: "işten çıkarıldım".
// Rehber o durumu anlatır ve her adımda doğru hesap aracına yollar.
const REHBERLER = [
    { yol: "isten-cikarildim-haklarim.html", ad: "İşten çıkarıldım, haklarım neler?",
      aciklama: "Kıdem, ihbar, izin, fazla mesai ve işsizlik maaşı — hangi durumda hangisi",
      gruplar: ["Maaş ve Çalışma"],
      anahtar: "işten çıkarıldım kovuldum haklarım kıdem ihbar tazminat işsizlik maaşı istifa ibraname arabuluculuk fesih" },
    { yol: "ev-alirken-rehberi.html", ad: "Ev alırken: baştan sona",
      aciklama: "Bütçe, kredi, tapu harcı, görünmeyen masraflar ve tapuda kontrol listesi",
      gruplar: ["Ev ve Yaşam", "Kredi ve Borç"],
      anahtar: "ev almak konut satın alma tapu masraf ekspertiz emlakçı komisyon dask iskan kat mülkiyeti irtifak düşük beyan peşinat" },
    { yol: "bordro-nasil-okunur.html", ad: "Bordronuzu nasıl okursunuz?",
      aciklama: "Kesintiler, kümülatif matrah ve maaşın yıl içinde neden azaldığı",
      gruplar: ["Maaş ve Çalışma"],
      anahtar: "bordro maaş kesinti sgk işsizlik gelir vergisi damga kümülatif matrah vergi dilimi asgari ücret istisnası işveren maliyeti" }
];

function rehberleriCiz(hedefId) {
    const k = document.getElementById(hedefId);
    if (!k || !REHBERLER.length) return;
    k.innerHTML = `<h2 class="grup-baslik">Rehberler</h2>
        <div class="arac-izgara">${REHBERLER.map(r =>
            `<a class="arac-kart rehber-kart" href="${r.yol}">
                <b>${r.ad}</b><span>${r.aciklama}</span></a>`).join("")}</div>`;
}

const KAYIT = "hesapAraclariAyar";

function ayarOku() {
    try { return JSON.parse(localStorage.getItem(KAYIT)) || {}; } catch (e) { return {}; }
}
/* DEGISMEDIYSE YAZMA.
   `dinle()` acilista bir kez hesapliyor, o da `kaydet()`i cagiriyor:
   yani sayfayi ACMAK bile bir yazma uretiyordu. Ayni degeri geri yazmak
   diger sekmelere `storage` olayi gonderip bosuna "baska sekmede
   degisti" uyarisi cikarabilir. Gercekten degisen bir sey yoksa
   dokunmuyoruz. */
/* YUTULAN HATA DA BIR KAYIPTIR.
   `try/catch` cokmeyi onluyor ama basarisiz yazmayi da SESSIZCE yutuyordu.
   Olculdu (28 Agustos 2026, test-depolama.html): kota doluyken kullanici
   butcesini giriyor, uygulama sorunsuz gorunuyor, HICBIR SEY kaydedilmiyor
   ve hicbir sey soylenmiyor. Kullanici bunu ancak geri dondugunde anlar --
   o da "ben girmemis miyim?" diye kendinden suphelenir.
   Cokmeyen hata, cokenden sinsidir.

   Uyari CUKURUN AGZINDA veriliyor: tek tek cagiranlar degil, yazmanin
   kendisi. Boylece bundan sonra eklenecek her kayit da korunuyor. */
let depoUyarisiVerildi = false;
function depoyaYazilamadi() {
    if (depoUyarisiVerildi) return;
    depoUyarisiVerildi = true;
    const ana = document.querySelector("main");
    if (!ana || document.getElementById("depoUyarisi")) return;
    const n = document.createElement("div");
    n.id = "depoUyarisi";
    n.className = "kutu uyari-kutu";
    n.setAttribute("role", "alert");
    n.innerHTML = "<p><b>Bu tarayıcıda kayıt yapılamıyor.</b> Girdikleriniz " +
        "bu sayfadan ayrıldığınızda kaybolur — hesap sonuçları doğru, " +
        "yalnızca saklanmıyor.</p>" +
        '<p class="kucuk">Sebebi genelde gizli/özel pencere ya da tarayıcı ' +
        "deposunun dolu olmasıdır. Sonucu kaybetmemek için " +
        "<b>bağlantıyı kopyalayın</b> ya da ekran görüntüsü alın.</p>";
    ana.insertBefore(n, ana.firstChild);
}

function ayarYaz(a) {
    try {
        const yeni = JSON.stringify(a);
        if (localStorage.getItem(KAYIT) === yeni) return true;
        localStorage.setItem(KAYIT, yeni);
        return true;
    } catch (e) {
        depoyaYazilamadi();
        return false;
    }
}


/* ============================================================
   NELER DEĞİŞTİ — kullanıcıya yaptığımız işi söyle (K-44)

   Bugüne kadar sessizce yayınladık. Yanlış çıkan bir sayıyı
   düzelttiğimizde, o sayıya bakarak karar vermiş kullanıcı bunu hiç
   öğrenmedi. Düzeltmeyi yayınlamak yetmiyor; düzeltildiğini SÖYLEMEK
   gerekiyor.

   `hesapDuzeltmesi: true` olan sürümlerde şerit ayrıca
   "sonucunuzu yeniden hesaplayın" der — çünkü o kullanıcı yanlış bir
   rakamla karar vermiş olabilir.

   Tek kaynak: hem şerit hem "neler-degisti.html" bunu okur.
   ============================================================ */
/* SURUM SAYISI YAYIN DAMGASIYLA AYNI OLMAK ZORUNDA DEGIL.
   Onceki halde serit, `sayfa.js?v=N` damgasini burada TAM ESITLIKLE
   ariyordu. Damgayi merkez yayin aninda basiyor (K-43), bu sayiyi ise
   elle yaziyoruz -- iki sayi kacinilmaz olarak ayrisiyor.

   Olculdu (CANLIDA): damga 61, tek kayit 52 -> eslesme yok -> bildirim
   SESSIZCE hic cikmadi. Ayni hata bu dosyada bugun IKINCI kez oldu:
   sabah kayit 51 / damga 52 diye bulunmus ve SAYILAR HIZALANARAK
   cozulmustu. Sayilari hizalamak cozum degil, tuzagi bir sonraki
   yayina ertelemek. Bedeli somut: bugun eklenen aktarim, kurulum
   daveti, iki sekme uyarisi ve kayit uyarisi -- hicbiri duyurulmadi.

   Artik esitlik degil "kullanicinin gordugunden BUYUK" araniyor.
   Damga her yayinda artabilir; kayit yalniz anlatilacak bir sey olunca
   yazilir; ikisi ayrissa da bildirim calisir. */
const DEGISIKLIKLER = [
    {
        surum: 61,
        tarih: "28 Ağustos 2026",
        ozet: "Doğum izni ve gebelik hesaplarında tarih, Türkiye dışındaki " +
              "bazı kullanıcılarda bir gün geri çıkıyordu; düzeltildi.",
        /* KAYIT KIMIN YAPTIGINI DEGIL, KULLANICININ NE YAPMASI
           GEREKTIGINI soyler. Bu duzeltmeyi baska bir oturum yapti;
           onemli olan kullanicinin YANLIS BIR TARIHLE is planlamis
           olabilmesi. Olculdu: `new Date("2026-01-15")` UTC gece yarisi
           olarak cozuluyordu, `tarihOku` ise yerel gece yarisi --
           aradaki fark tam UTC farki kadar (burada -3 saat). Turkiye'de
           gun degismiyor; UTC'nin BATISINDA bir gun geri kayiyor. */
        hesapDuzeltmesi: true,
        maddeler: [
            "Doğum izni ve gebelik: girdiğiniz tarih, Türkiye dışındaki " +
            "bazı saat dilimlerinde bir gün geri okunuyordu. Düzeltildi — " +
            "daha önce bu iki hesabı yaptıysanız sonucunuzu yeniden alın.",
            "Başka cihaza taşıma: bütçenizi ve tercihlerinizi kare kodla " +
            "ya da dosyayla başka bir cihaza aktarabilirsiniz. Ne " +
            "değişeceği önce gösteriliyor, onaylamadan hiçbir şey yazılmıyor. " +
            "Aktarım bizim sunucumuzdan geçmiyor.",
            "İki sekme: aynı aracı iki sekmede açıp ikisinde de yazdığınızda, " +
            "eski sekme yenisinin girdiklerini siliyordu. Sildiğiniz bütçe de " +
            "geri gelebiliyordu. Artık çakışma söyleniyor ve kararı siz " +
            "veriyorsunuz.",
            "Kaydedilemeyen veri: tarayıcı deposu doluysa ya da gizli " +
            "pencerede çalışıyorsanız girdikleriniz kaydedilmiyordu ve bu " +
            "size söylenmiyordu. Artık açıkça uyarıyor.",
            "Güvenlik: özel hazırlanmış bir bağlantının sayfada kod " +
            "çalıştırmasına izin veren bir açık kapatıldı.",
            "Sayfa eksik yüklendiğinde artık uyarı çıkıyor — sessizce " +
            "çalışmıyor görünmek yerine durumu söylüyor.",
            "Telefonda klavye açıkken sonucun kaybolması giderildi; cevap " +
            "klavyenin üstündeki şeritte duruyor.",
        ],
    },
    {
        surum: 52,
        tarih: "28 Ağustos 2026",
        ozet: "Dört hesapta eski sonuç ekranda kalıyordu; düzeltildi.",
        hesapDuzeltmesi: true,
        maddeler: [
            "Net maaş, kredi, mevduat ve KDV sayfalarında: tutarı silince " +
            "alttaki döküm ESKİ hesabı göstermeye devam ediyordu. Artık " +
            "birlikte temizleniyor.",
            "Kredi: taksitlerin yarısını ödediğinizde borcunuzun yüzde " +
            "kaçının durduğu yazıyor (24 ayda %61, 60 ayda %76).",
            "Net maaş: maaşınızın yıl içinde NE ZAMAN düştüğü dönem dönem " +
            "gösteriliyor.",
            "Kıdem tazminatı: “kendi isteğinizle istifa ederseniz ödenmez” " +
            "uyarısı artık tutarın hemen altında.",
            "İşsizlik maaşı: 30 günlük başvuru süresi ve geciken her günün " +
            "karşılığı sonuç kutusunda.",
            "Doğalgaz: sayaç okuması ters girildiğinde “sayaç turlamış " +
            "kabul edildi” varsayımı görünür hale getirildi.",
            "Tapu harcı: harç, yazdığınız satış bedeline değil rayiç " +
            "bedele göre hesaplanıyorsa açıkça yazıyor.",
            "Kalori, gebelik ve kira geliri sayfalarında sağlık ve hukuk " +
            "uyarıları okunur boyda.",
            "Ortalama ve standart sapma: listeye yazdığınız değerlerden biri " +
            "okunamıyorsa (yazım hatası, harf) o değer SIFIR sayılıp ortalamaya " +
            "katılıyordu. “12 abc 15” yazan biri ortalama 9 görüyordu; doğrusu " +
            "13,5. Artık okunamayan değer hesaba katılmıyor ve hangisi olduğu " +
            "yazılıyor.",
            "Sayıyı yazıyla yazma (çek ve senet): kutuya sayı olmayan bir şey " +
            "yazıldığında ekranda “SIFIR LİRA” çıkıyordu — çeke geçirilecek " +
            "metin. Boş kutuda da aynısı yazıyordu. Artık sayı üretilmiyor, " +
            "sebebi yazıyor. Gerçekten 0 yazarsanız “Sıfır lira” doğru cevaptır " +
            "ve görünmeye devam eder.",
            "Kalori ihtiyacı: “hızlı kilo verme” hedefi, vücudunuzun hiç hareket " +
            "etmeden harcadığı enerjinin altına inebiliyordu; bazı durumlarda " +
            "sıfır ya da eksi çıkıyordu. Artık o hedefe sayı yazılmıyor, " +
            "sebebi açıklanıyor.",
            "Kirala mı satın al: yıl kutusuna aralık dışı bir sayı yazıldığında " +
            "uygulamanın TAVSİYESİ değişiyordu — “Satın almak” yerine " +
            "“Kiralamak” çıkabiliyordu, hiçbir uyarı olmadan. Artık aralık " +
            "dışı değer uyarı veriyor.",
            "Elektrikli araç şarj maliyeti: evde şarj oranına %100’den büyük " +
            "ya da eksi bir değer yazılabiliyordu ve maliyet ona göre " +
            "değişiyordu. Artık uyarı çıkıyor.",
            "Vücut kitle indeksi: boyunu metre olarak yazan biri (1,75) " +
            "“BKİ 22857” gibi anlamsız bir sonuç görüyordu. Artık girdiğiniz " +
            "ölçü insan ölçülerine uymuyorsa söyleniyor.",
            "Doğum izni: doğum öncesi çalışma haftasına aralık dışı bir değer " +
            "yazıldığında sessizce yasal sınıra çekiliyordu — tarihler " +
            "değişiyor ama bunu bilmiyordunuz. Artık hangi değerle " +
            "hesaplandığı yazıyor.",
            "Tarih hesaplama: çok büyük bir gün sayısı yazıldığında ekran " +
            "donuyor ve ÖNCEKİ hesabın cevabı duruyordu; yeni yazdığınızın " +
            "sonucunu değil, eskisini okuyordunuz. Artık sebebi yazıyor.",
            "Karanlık kip artık telefonunuzun ayarına uyuyor.",
        ],
    },
];

/** Yüklü `sayfa.js?v=N` damgasından sürümü okur.

    ARTIK BILDIRIM BUNA BAKMIYOR. Serit eskiden bu sayiyi
    `DEGISIKLIKLER` kayitlariyla TAM ESITLIKLE karsilastiriyordu ve
    ikisi ayrisinca bildirim sessizce olmustu (damga 61, kayit 52).
    Islev, tanilama ve olcum icin duruyor; kapi olarak KULLANILMAMALI.
    Iki elle yazilan sayinin esitligine dayanan kapi yazilmaz (K-46). */
function surumNo() {
    const s = document.querySelector('script[src*="sayfa.js"]');
    const m = s && (s.getAttribute("src") || "").match(/[?&]v=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
}

function yenilikSeridi() {
    /* Damgaya BAKMIYORUZ. Kullanicinin en son gordugu kayittan yeni bir
       kayit var mi? Damganin kac oldugu bu sorunun cevabini degistirmez. */
    const ayar = ayarOku();
    const gorulen = Number(ayar.gorulenSurum) || 0;
    const yeniler = DEGISIKLIKLER.filter(function (d) { return d.surum > gorulen; });
    if (!yeniler.length) return;

    /* En yenisi gosterilir; ama arada birden cok yayin kacirilmis
       olabilir, o yuzden "hesap duzeltmesi" uyarisi HEPSINE bakar --
       kullanici arada duzeltilmis bir hesaba bakmis olabilir. */
    const kayit = yeniler.reduce(function (a, b) { return b.surum > a.surum ? b : a; });
    const duzeltmeVar = yeniler.some(function (d) { return d.hesapDuzeltmesi; });
    const surum = kayit.surum;

    const c = document.createElement("div");
    c.className = "yenilik-serit";
    c.setAttribute("role", "status");
    c.innerHTML =
        '<div class="ys-govde">' +
        '<b>Bu araçlarda değişiklik yapıldı.</b> ' + kayit.ozet +
        (duzeltmeVar
            ? ' Daha önce hesap yaptıysanız <b>sonucunuzu yeniden alın</b>.'
            : "") +
        ' <a href="neler-degisti.html">Neler değişti?</a>' +
        "</div>" +
        '<button type="button" class="ys-kapat" aria-label="Kapat">✕</button>';
    document.body.insertBefore(c, document.body.firstChild);

    c.querySelector(".ys-kapat").onclick = function () {
        const a = ayarOku();
        a.gorulenSurum = surum;
        ayarYaz(a);
        c.remove();
    };
}

// ---------- Üst bar ve alt bilgi ----------

function iskeletKur(aktifYol) {
    window.hesapIskeleti = true;
    const ayar = ayarOku();
    /* KULLANICI SEÇMEDİYSE İŞLETİM SİSTEMİNE UY.
       Ölçüldü (28.08.2026): telefon karanlık kipteyken sayfa bembeyaz
       açılıyordu (zemin parlaklığı 246/255). Karanlık tema VARDI ve
       düzgün çalışıyordu — yalnızca sorulmuyordu. Kod sadece kayıtlı
       "koyu" değerine bakıyor, ilk ziyarette ayar boş oluyordu.
       Sistem tercihi kullanıcının KARARI değil, VARSAYILANI: açıkça
       seçim yapmışsa seçimi kazanır. */
    const sistemKoyu = window.matchMedia
        && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const koyuMu = ayar.tema === "koyu"
        || (ayar.tema !== "acik" && sistemKoyu);
    if (koyuMu) document.documentElement.dataset.tema = "koyu";
    // Telefonun tarayıcı çubuğu da sayfayla aynı renkte olsun.
    try {
        const tc = document.querySelector('meta[name="theme-color"]');
        if (tc) tc.setAttribute("content", koyuMu ? "#0c0e13" : "#ffffff");
    } catch (e) { }

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
                    aria-label="Açık veya koyu temaya geç" title="Açık / koyu tema">${koyuMu ? "◑" : "◐"}</button>
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
        /* Kayitli ayara DEGIL ekrandaki duruma bak. Tema sistemden
           geldiyse `a.tema` undefined olur; eski mantik ilk tikta
           "koyu" yazardi ve sayfa ZATEN koyu oldugu icin hicbir sey
           degismezdi - kullanici dugmeyi bozuk sanardi. */
        const suAnKoyu = document.documentElement.dataset.tema === "koyu";
        a.tema = suAnKoyu ? "acik" : "koyu";
        if (a.tema === "koyu") document.documentElement.dataset.tema = "koyu";
        else delete document.documentElement.dataset.tema;
        document.getElementById("temaBtn").textContent = a.tema === "koyu" ? "◑" : "◐";
        try {
            const tc = document.querySelector('meta[name="theme-color"]');
            if (tc) tc.setAttribute("content", a.tema === "koyu" ? "#0c0e13" : "#ffffff");
        } catch (e) { }
        ayarYaz(a);
    };
    cevrimdisiUyari(aktifYol);
    gecmiseEkle(aktifYol);
    try { yenilikSeridi(); } catch (e) { }
    yapiskanSonuc();
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

// SAYI OLARAK OKUNAMAYAN ALANI GÖRÜNÜR YAP.
//
// Ölçüldü (27.08.2026, canlı sayfada): kredi hesaplamada faiz alanına
// "abc" yazıldığında ekranda **"Toplam faiz 0,00 ₺"** ve %0'lık bir kredi
// çıkıyordu — hiçbir uyarı olmadan. Sebep: `oku()` çözemediği değer için
// 0 döner, sayfalar da `if (!tutar || tutar <= 0)` diye yalnız BAZI
// alanları denetler. Faiz gibi alanlarda **0 meşru bir değerdir**
// (0 faizli kampanya kredisi vardır), o yüzden "0 geldi" ile "kullanıcı
// anlaşılmayan bir şey yazdı" ayırt edilemiyordu.
//
// `sayiGecersizMi()` tam bunun için yazılmıştı ama 47 sayfanın HİÇBİRİ
// çağırmıyordu. Tek tek 47 sayfaya eklemek yerine ortak bağlayıcıya
// koyuldu: her sayfa zaten `dinle()`den geçiyor.
//
// Yalnız SAYISAL alanlara bakılır. İşaret: `inputmode` (185 metin
// alanının 176'sında var; olmayanlar ders adı gibi gerçek metin
// alanları). Tarih, saat, onay kutusu ve açılır liste dışarıda kalır.
//
// Hesabı DURDURMUYORUZ — sayfa akışını değiştirmek 47 sayfayı birden
// etkilerdi. Yapılan: sessiz yanlışı görünür yanlışa çevirmek.
function girdileriDenetle(idler) {
    idler.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.tagName !== "INPUT") return;
        const im = el.getAttribute("inputmode");
        if (!im) return;                       // sayısal alan değil
        const bozuk = typeof sayiGecersizMi === "function" &&
                      sayiGecersizMi(el.value, el.dataset ? el.dataset.tur : undefined);

        /* OLU `min`/`max`I CANLIYA CEVIR.
           Turkce sayi yazimi icin `type="number"`den kactik ve kutulari
           `type="text"` yaptik. Ustlerindeki `min`/`max` ORADA KALDI ve
           tarayici onlari `text` turunde UYGULAMAZ -- kodu okuyan
           "sinir var" saniyordu. Gorunen bir koruma, olmayan bir
           korumadan tehlikelidir.

           Olculdu (28 Agustos 2026, CANLIDA):
             elektrikli-arac  evOran (0-100) -> "%10000" kabul, 51,48 TL
                                                "-%50"   kabul, 227,70 TL
             kira-geliri      ay (1-12)      -> "-49" -> 0,00 TL, uyari yok
             kiralamak-mi     yil (1-30)     -> aralik disi deger
                                                TAVSIYEYI degistiriyordu
                                                (Satin almak <-> Kiralamak)
           Bildirim zaten HTML'de duruyor; burada okunup uygulaniyor.
           Boylece sinir TEK KAYNAKTAN gelir ve iki yerde ayrisamaz. */
        let aralikDisi = null;
        if (!bozuk && el.value.trim() !== "" && typeof sayiOku === "function") {
            const enAz = el.getAttribute("min"), enCok = el.getAttribute("max");
            if (enAz !== null || enCok !== null) {
                const d = sayiOku(el.value, el.dataset ? el.dataset.tur : undefined);
                if (enAz !== null && d < Number(enAz)) aralikDisi = "en az " + enAz;
                else if (enCok !== null && d > Number(enCok)) aralikDisi = "en fazla " + enCok;
            }
        }

        el.classList.toggle("girdi-bozuk", !!(bozuk || aralikDisi));
        const kap = el.parentNode;
        if (!kap) return;
        // Uyari ALANA bagli aranir, kapsayiciya degil.
        // Kendi sinamam yakaladi: ":scope > .girdi-uyari" ile ararken, ayni
        // kapsayiciyi paylasan GECERLI bir alan, bozuk alanin uyarisini
        // siliyordu (else dalindaki `not.remove()`). Canli sayfalarda her
        // girdi kendi sarmalindaydi, o yuzden gorunmuyordu -- ama sayfa
        // duzeni degistiginde sessizce kaybolurdu.
        let not = kap.querySelector('.girdi-uyari[data-icin="' + el.id + '"]');
        /* EKRAN OKUYUCU ICIN UYARI ALANA BAGLANMALI.
           Olculdu (test-erisilebilirlik.html): uyari ekranda cikiyordu ama
           `aria-invalid` yoktu ve uyarinin `id`si olmadigi icin alana da
           baglanamiyordu. Ekran okuyucu kullanan biri alana geldiginde
           "Brut aylik maas, metin" duyuyor; hangi alanin bozuk oldugunu
           ve NEDEN bozuk oldugunu hic ogrenemiyordu. Uyari GORSEL olarak
           vardi, ISITSEL olarak yoktu.
           `role="alert"` yalniz uyari CIKTIGI ANDA okunur; kullanici
           sonradan alana donerse bir daha duymaz -- bagi kuran sey
           `aria-describedby`. */
        const uyariKimlik = "uyari-" + el.id;
        if (bozuk || aralikDisi) {
            if (!not) {
                not = document.createElement("div");
                not.className = "girdi-uyari";
                not.setAttribute("role", "alert");
                not.setAttribute("data-icin", el.id);
                not.id = uyariKimlik;
                kap.insertBefore(not, el.nextSibling);
            }
            if (!not.id) not.id = uyariKimlik;
            el.setAttribute("aria-invalid", "true");
            const mevcut = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
            if (mevcut.indexOf(uyariKimlik) < 0) {
                mevcut.push(uyariKimlik);
                el.setAttribute("aria-describedby", mevcut.join(" "));
            }
            not.textContent = bozuk
                ? "Bu alan sayı olarak okunamadı — hesap 0 kabul ediyor."
                : "Bu alan " + aralikDisi + " olmalı. Aşağıdaki sonuç " +
                  "girdiğiniz değerle hesaplandı; aralık dışı olduğu için " +
                  "anlamlı olmayabilir.";
        } else {
            /* TEMIZLEMEK DE ISIN PARCASI. Kalan bir `aria-invalid="true"`,
               duzeltilmis bir alani ekran okuyucuya hala bozuk gosterir --
               ve bu, hic uyarmamaktan daha yaniltici olur. */
            el.removeAttribute("aria-invalid");
            const kalan = (el.getAttribute("aria-describedby") || "")
                .split(/\s+/).filter(function (x) { return x && x !== uyariKimlik; });
            if (kalan.length) el.setAttribute("aria-describedby", kalan.join(" "));
            else el.removeAttribute("aria-describedby");
            if (not) not.remove();
        }
    });
}

// Girdi kutularını dinle: her değişiklikte hesapla
function dinle(idler, isle) {
    // ISTISNA BAYAT SONUC BIRAKMAMALI.
    //
    // Olculdu (28 Agustos 2026, CANLIDA): tarih-hesaplama sayfasinda
    // "999999999" yazilinca `tarihEkle` RangeError firlatti, `hesapla()`
    // yarida kesildi ve ekranda ONCEKI hesabin cevabi kaldi:
    //     girdi 100        -> "100 gun sonrasi · 04.12.2026"
    //     girdi 999999999  -> ekran DEGISMEDI, hala 04.12.2026
    // Kullanici artik girmedigi bir sayinin cevabini okuyor. Cokme yok,
    // uyari yok. `sonucBekliyor` bu sinifi kapatiyordu ama istisna yolu
    // ona hic ugramiyordu.
    //
    // Burasi 42 aracin ORTAK gecidi; korumayi tek tek araclara birakmak
    // 42 kez hatirlamayi gerektirirdi. Bir kez burada durduruluyor.
    const sarmal = () => {
        girdileriDenetle(idler);
        try {
            isle();
            /* CANLILIK ISARETI. Sayfanin sonundaki satir ici denetim buna
               bakiyor. YALNIZ basarili hesaptan sonra kalkar: `hesap.js`
               indirilemezse `isle()` firlatir ve isaret KALKMAZ. */
            window.hesapCalisti = true;
        } catch (h) {
            /* Sessizce yutma: kullaniciya bir sey soyle, eski cevabi da
               ekranda birakma. Hangi girdinin kirdigini bilmiyoruz ama
               "eski cevap dogru" demekten iyidir. */
            if (typeof console !== "undefined" && console.error) console.error(h);
            if (typeof sonucBekliyor === "function") {
                sonucBekliyor("Girdiğiniz değerlerle hesap yapılamadı. " +
                              "Sayılar çok büyük ya da beklenmedik olabilir — " +
                              "kontrol edip tekrar deneyin.");
            }
        }
    };
    idler.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", sarmal);
        el.addEventListener("change", sarmal);
    });
    sarmal();
}

// NEDEN type="number" KULLANMIYORUZ (ölçüldü, 26 Ağustos 2026):
// Kullanıcı Türkçe biçimde "33.030,00" yazdığında tarayıcı virgülü ATIYOR,
// noktayı ondalık sayıyor ve kutuda "33.03000" kalıyor. Uygulama bunu
// 33,03 TL okuyor ve net maaşı -4.921,47 ₺ diye gösteriyordu. Çökme yok,
// uyarı yok — sadece yanlış. Telefonda daha da kötü: Türkçe klavye virgül
// tuşu veriyor, kutu onu yutuyor.
// Bu yüzden sayı kutuları type="text" + inputmode; biçimi sayiOku çözüyor.
// data-tur="oran" olan alanlarda nokta her zaman ondalıktır (faiz "3.29").
function oku(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.type === "number") { const d = parseFloat(el.value); return isFinite(d) ? d : 0; }
    return sayiOku(el.value, el.dataset ? el.dataset.tur : undefined);
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

/* ---------- 3) Sonucu kopyala / paylaş / yazdır ----------
   PAYLASILAN BAGLANTI GIRDILERI TASIYOR — ve bu SOYLENMIYORDU.
   Olculdu (28 Agustos 2026, gercek kullanim turu):
     net-maas   -> ?brut=92.500
     gebelik    -> ?sat=2026-03-15     (son adet tarihi)
     kredi      -> ?tutar=...&faiz=... (borc bilgisi)
     vki        -> ?boy=...&kilo=...
   Adres cubuguna yazmak KASITLI ve yararli: sayfa yenilenince deger
   kayboluyorlardi, boyle korunuyor. Sorun ozellikte degil, SUSMADA:
   dugme "Baglantiyi paylas" diyor, kullanici ARACI paylastigini
   sanabilir. Gebelik tarihini ya da maasini bir gruba yollamak,
   niyet edilmemis bir aciklamadir.
   `sonucMetni` de sona `location.href` ekliyor; yani "Sonucu kopyala"
   diyen de baglantiyi kopyaliyor. Ikisi de kapsandi.
   Ozellik kaldirilmadi -- soylendi. Kullanicinin bilerek paylasmasi
   ile bilmeden paylasmasi arasindaki fark budur.
   Bu, parca sinamalarinin YAKALAYAMADIGI bir sinif: dugmeye basmak
   ve panoya BAKMAK gerekiyordu (K-47). */
// ---------- 3) Sonucu kopyala / paylaş / yazdır ----------
function eylemCubugu(sonucGetir) {
    const c = document.createElement("div");
    c.className = "eylem-cubugu";
    c.setAttribute("role", "group");
    c.setAttribute("aria-label", "Sonuç işlemleri");
    c.innerHTML = `
        <button class="ikincil" type="button" id="kopyalaBtn">Sonucu kopyala</button>
        <button class="ikincil" type="button" id="paylasBtn">Bağlantıyı paylaş</button>
        <button class="ikincil" type="button" id="yazdirBtn">Yazdır</button>
        <p class="kucuk eylem-notu">Bağlantı ve kopyalanan metin,
        <b>girdiğiniz değerleri içerir</b> — paylaştığınız kişi onları
        görebilir.</p>`;
    return c;
}

function eylemleriBagla(sonucGetir) {
    const kopyala = async (metin, dugme) => {
        try { await navigator.clipboard.writeText(metin); }
        catch (e) { window.prompt("Kopyalayın:", metin); return; }
        const eski = dugme.textContent;
        dugme.textContent = "Kopyalandı — girdiler dahil";
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
    const yol = location.pathname.split("/").pop() || "index.html";
    const arac = ARACLAR.find(a => a.yol === yol);
    const rehber = (typeof REHBERLER !== "undefined") ? REHBERLER.find(r => r.yol === yol) : null;

    // Rehber bir uygulama değil, MAKALEDİR. Google'a doğru türü söylemek gerekir.
    if (rehber) {
        ldEkle({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": ad,
            "description": aciklama,
            "inLanguage": "tr-TR",
            "url": "https://meteotr06.github.io/hesap/" + yol,
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://meteotr06.github.io/hesap/" + yol },
            "image": "https://meteotr06.github.io/hesap/onizleme/" + yol.replace(".html", ".png"),
            "publisher": { "@type": "Organization", "name": "Hesap Araçları",
                           "url": "https://meteotr06.github.io/hesap/" }
        });
        ldEkle({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Hesap Araçları",
                  "item": "https://meteotr06.github.io/hesap/" },
                { "@type": "ListItem", "position": 2, "name": "Rehberler" },
                { "@type": "ListItem", "position": 3, "name": rehber.ad,
                  "item": "https://meteotr06.github.io/hesap/" + yol }
            ]
        });
        return;
    }

    // Finans disi araclar da var; kategoriyi grubuna gore ver
    const kategori = !arac ? "UtilitiesApplication"
        : ["Maaş ve Çalışma", "Kredi ve Borç", "Birikim", "Ticaret"].indexOf(arac.grup) >= 0
            ? "FinanceApplication"
        : arac.grup === "Okul" ? "EducationalApplication"
        : arac.grup === "Sağlık" ? "HealthApplication"
        : "UtilitiesApplication";

    const veri = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": ad,
        "description": aciklama,
        "url": "https://meteotr06.github.io/hesap/" + (yol === "index.html" ? "" : yol),
        "applicationCategory": kategori,
        "operatingSystem": "Tüm cihazlar",
        "inLanguage": "tr-TR",
        "isAccessibleForFree": true,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY" },
        "publisher": { "@type": "Organization", "name": "Hesap Araçları",
                       "url": "https://meteotr06.github.io/hesap/" }
    };
    ldEkle(veri);

    // Kırıntı yolu: Google sonuçlarda çıplak adres yerine
    // "Hesap Araçları › Maaş ve Çalışma › Net Maaş" gösterir; tıklanma artar.
    if (arac) {
        ldEkle({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Hesap Araçları",
                  "item": "https://meteotr06.github.io/hesap/" },
                { "@type": "ListItem", "position": 2, "name": arac.grup },
                { "@type": "ListItem", "position": 3, "name": arac.ad,
                  "item": "https://meteotr06.github.io/hesap/" + arac.yol }
            ]
        });
    }
}

function ldEkle(veri) {
    const et = document.createElement("script");
    et.type = "application/ld+json";
    et.textContent = JSON.stringify(veri);
    document.head.appendChild(et);
}

// ---------- 6) İlgili araçlar ----------
// Eskiden: ayni gruptan ilk 4. Iki sorunu vardi —
//   1) rehber sayfalarinda grup eslesmedigi icin listenin ilk 4 araci cikiyordu
//   2) arac sayfalarinda rehberler HIC gorunmuyordu; kidem hesaplayan birinin
//      "isten cikarildim" rehberini gormesi lazim.
// Simdi ANAHTAR KELIME ORTAKLIGINA gore puanlaniyor.
function ilgiliAraclar(aktifYol) {
    const rehberler = (typeof REHBERLER !== "undefined") ? REHBERLER : [];
    const hepsi = ARACLAR.concat(rehberler.map(r => Object.assign({ rehberMi: true }, r)));
    const aktif = hepsi.find(a => a.yol === aktifYol);
    if (!aktif) return;

    const kelimeler = (metin) => new Set(sadelestir(metin || "").split(/\s+/).filter(k => k.length > 2));
    const aktifKelime = kelimeler((aktif.anahtar || "") + " " + (aktif.ad || "") + " " + (aktif.aciklama || ""));

    const puanla = (a) => {
        let p = 0;
        if (aktif.grup && a.grup === aktif.grup) p += 40;
        // Rehber, ilgili oldugu gruptaki araclarda grup eslesmesi kadar deger gorsun
        if (a.rehberMi && a.gruplar && aktif.grup && a.gruplar.indexOf(aktif.grup) >= 0) p += 40;
        // Ters yon: rehber sayfasindayken kendi gruplarindaki araclar one ciksin
        if (aktif.rehberMi && aktif.gruplar && a.grup && aktif.gruplar.indexOf(a.grup) >= 0) p += 30;
        const k = kelimeler((a.anahtar || "") + " " + a.ad + " " + a.aciklama);
        k.forEach(x => { if (aktifKelime.has(x)) p += 6; });
        // Rehberler biraz one cikarilsin: durumu anlatan sayfa, tek hesaptan degerli
        if (a.rehberMi) p += 12;
        return p;
    };

    const secilen = hepsi.filter(a => a.yol !== aktifYol)
        .map(a => ({ a: a, p: puanla(a) }))
        .sort((x, y) => y.p - x.p)
        .slice(0, 4)
        .map(x => x.a);

    const b = document.createElement("section");
    b.className = "kutu";
    b.innerHTML = `<h2 class="kutu-baslik">Bunlar da işinize yarayabilir</h2>
        <div class="arac-izgara">${secilen.map(a =>
            `<a class="arac-kart${a.rehberMi ? " rehber-kart" : ""}" href="${a.yol}">
                <b>${a.rehberMi ? "Rehber: " : ""}${a.ad}</b><span>${a.aciklama}</span></a>`).join("")}</div>`;
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

// ---------- REKLAM YUKLEYICI: ERTELENMIS ----------
//
// OLCUM (27 Agustos 2026, canli sayfada):
//     show_ads_impl_fy2021.js   166 KB
//     sodar + zrt_lookup         18 KB   -> reklam toplam ~184 KB
//     hesap.js + sayfa.js + css  57 KB   -> butun uygulamamiz
// Reklam makinesi uygulamanin UC KATI. Ustelik AdSense onayi gelmedigi ve
// data-ad-slot olmadigi icin su an hicbir reklam DOLMUYOR: kullanici
// karsiligi sifir olan 184 KB indiriyor. Telefonda mobil veriyle giren
// icin bu gercek bir zarar -- hem veri hem bekleme.
//
// COZUM: betigi silmiyoruz (onay sureci icin sayfada bulunmali), sadece
// SAYFA ACILDIKTAN SONRA yukluyoruz. Kullanici cevabini once goruyor.
// Sahiplik dogrulamasi <meta name="google-adsense-account"> ile yapilir;
// o her sayfada duruyor, bu erteleme onu etkilemez.
//
// ONAY GELINCE: asagidaki ERTELE'yi false yap. Reklam basta yuklenir.
// (O gun ayrica reklam biriminin data-ad-slot'u eklenmeli, bkz. reklamAlani.)
function reklamYukleyiciyiErtele() {
    const ERTELE = true;                       // onay gelince false
    const ADRES = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
                + "?client=ca-pub-4471538043632173";

    let yuklendi = false;
    const yukle = () => {
        if (yuklendi) return;
        yuklendi = true;
        const b = document.createElement("script");
        b.async = true;
        b.src = ADRES;
        b.crossOrigin = "anonymous";
        document.head.appendChild(b);
    };

    if (!ERTELE) { yukle(); return; }

    // Iki yol: kullanici sayfayla ilgilenirse hemen, ilgilenmezse bosta.
    // Ikincisi Googlebot icin de gecerli -- oturup beklemesi gerekmez.
    ["pointerdown", "keydown", "touchstart", "scroll"].forEach(o =>
        addEventListener(o, yukle, { once: true, passive: true }));

    const bosta = () => {
        if (typeof requestIdleCallback === "function") requestIdleCallback(yukle, { timeout: 4000 });
        else setTimeout(yukle, 2500);
    };
    if (document.readyState === "complete") bosta();
    else addEventListener("load", bosta, { once: true });
}

reklamYukleyiciyiErtele();

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
        <!-- ONAY GELINCE: AdSense panelinden "Goruntulu reklam" birimi ac ve
             asagiya data-ad-slot="..." ekle. SLOT OLMADAN MANUEL BIRIM DOLMAZ.
             Slot ID'si ancak hesap onaylandiktan sonra uretilir; simdi eklenecek
             bir deger yok. Ayrinti icin KARARLAR.md madde 13. -->
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
    /* Aktarim sayfasi buradan ulasilir. Arac listesine KOYULMADI: bir
       hesap araci degil, tasima yolu. Listede olsaydi "42 arac" sayisi
       da yalan olurdu. */
    p.innerHTML = `<a href="gizlilik.html">Gizlilik politikası</a> ·
        <a href="aktarim.html">Başka cihaza taşı</a> ·
        <a href="index.html">Bütün araçlar</a> ·
        Bu sitede Google AdSense reklamları gösterilir.`;
    alt.appendChild(p);
    digerUygulamalar();
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

/* KULLANICI BU SAYFADA BIR SEY YAPTI MI?
   Iki isaret denendi, ikisi de yanlis cikti:
   1. `hesapCalisti` -- "isle() firlatmadi mi" demek. Girdisiz sayfada da
      dogru; yarim yukleme denetimi icin dogru isaret ama bu soru icin degil.
   2. "Ekranda sonuc var mi" -- bu da yetmedi. Olculdu (28.08.2026): arac
      sayfalari ON DEGERLE aciliyor ve daha ilk anda sonuc gosteriyor.
        net-maas   girdi 75000       -> 58.080,27 TL
        kredi      girdi 100000      -> 6.523,81 TL
        tarih      girdi 1990-05-15  -> 13.252 gun
      Yani "sonuc var" sayfanin acildigi anda da dogru.
   Geriye iki durust yol kaliyor:
   a) kullanicinin KENDI dokunusu (yazdi, sectikleri degisti);
   b) baglantinin KENDI degerlerini tasimasi -- paylasilan bir hesabi
      acan kisi de sonucu gormustur, sayfanin on degerini degil.
   (b) olmasa, uygulamayi hep paylasilan baglantidan kullanan birine
   davet hic gosterilmezdi. */
let kullaniciDokundu = false;

/* Adres kendi girdi degerlerini tasiyor mu? `?taze=`, `?t=` gibi
   olcum/onbellek parametreleri sayilmaz: yalniz sayfada GERCEKTEN
   var olan bir girdi adiyla eslesen parametre. */
function baglantiDegerTasiyorMu() {
    try {
        const p = new URLSearchParams(location.search);
        let varMi = false;
        p.forEach(function (_, ad) {
            const el = document.getElementById(ad);
            if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) varMi = true;
        });
        return varMi;
    } catch (e) { return false; }
}

/* Kullanici "simdi degil" dediyse bir daha sorulmaz. */
const KURULUM_KAPATILDI = "hesapKurulumKapatildi";
function kurulumKapatildiMi() {
    try { return localStorage.getItem(KURULUM_KAPATILDI) === "1"; } catch (e) { return false; }
}

function uygulamaKurulu() {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator.standalone) return true;   // iOS
    try { return localStorage.getItem("hesapKurulu") === "1"; } catch (e) { return false; }
}

// Alt bilgiye "Uygulama olarak kur" düğmesi ekler.
// Kurulamayan tarayıcıda (iOS Safari) düğme yerine nasıl yapılacağını anlatır.
/* ISRARSIZ OLMAK OLCULEBILIR BIR SEYDIR (K-51).
   Serit uc kosulda HIC cikmaz: uygulama zaten kuruluysa, kullanici bir
   kez kapattiysa, ya da bu sayfada henuz bir is bitmediyse.

   ZAMANLAMA: bir arac sayfasinda serit, kullanici SONUCU GORMEDEN
   gosterilmiyor. "Kurmak ister misin?" sorusu, faydayi gormeden
   sorulunca reklamdir; gordukten sonra sorulunca tekliftir.

   ISARET SECIMI icin yukaridaki `kullaniciDokundu` notuna bakin: iki
   makul gorunen isaret olculdukten sonra elendi. */
function kurulumDugmesi() {
    const alt = document.querySelector("footer");
    if (!alt || alt.querySelector(".kurulum-serit")) return;
    if (uygulamaKurulu() || kurulumKapatildiMi()) return;

    /* Arac sayfasiysa sonucu bekle. Rehber/dizin sayfalarinda bekleyecek
       bir "is" yok, dogrudan gosteriliyor. */
    if (document.getElementById("ozet") && !kullaniciDokundu && !baglantiDegerTasiyorMu()) {
        /* Ilk gercek dokunusta bir kez daha denenir. `once: true` ile
           dinleyiciler kendiliginden kalkiyor; sayfada iz birakmiyor. */
        const isaretle = function () {
            if (kullaniciDokundu) return;
            kullaniciDokundu = true;
            setTimeout(kurulumDugmesi, 600);   /* sonuc yazilsin, sonra teklif */
        };
        document.querySelectorAll("main input, main select, main textarea")
            .forEach(function (el) {
                el.addEventListener("input", isaretle, { once: true });
                el.addEventListener("change", isaretle, { once: true });
            });
        return;
    }

    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const s = document.createElement("div");
    s.className = "kurulum-serit";
    s.innerHTML = `
        <span class="kurulum-yazi"><b>Telefonunuza kurun.</b>
        Simgeden tek dokunuşla açılır, internet olmadan da çalışır.</span>
        <button type="button" id="kurBtn" class="ikincil" hidden>Uygulama olarak kur</button>
        <button type="button" id="kurNasil" class="ikincil">Nasıl kurulur?</button>
        <button type="button" id="kurKapat" class="ikincil"
                aria-label="Kurulum önerisini kapat">Şimdi değil</button>`;
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

    /* KAPATAN BIR DAHA GORMEZ. Onceki halde kapatma yolu HIC YOKTU:
       ilgilenmeyen kullaniciya her sayfada ayni sey gosteriliyordu. */
    document.getElementById("kurKapat").addEventListener("click", () => {
        try { localStorage.setItem(KURULUM_KAPATILDI, "1"); } catch (e) { }
        s.remove();
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
    // Bu dosya kok ana sayfada da yukleniyor (arac aramasi icin). Orada
    // "sw.js" adresi /sw.js'e cozulur, yoktur ve her aciliista bosuna bir
    // istek atilir. Manifest'i olmayan sayfa kurulabilir uygulama degildir;
    // cevrimdisi katmani da orada islevsizdir.
    if (!document.querySelector('link[rel="manifest"]')) return;
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

// ---------- Diğer uygulamalar ----------
// Aynı adreste dört uygulama var ama birbirlerini tanıtmıyorlardı.
// Hem ziyaretçi diğerlerini görsün hem de Google iç bağlantıları saysın.
const DIGER_UYGULAMALAR = [
    { ad: "Hava Durumu", adres: "../mobil/", not: "Saatlik ve 7 günlük" },
    { ad: "Kur Pusulası", adres: "../kur-pusulasi/", not: "Döviz, altın ve tahmin" },
    { ad: "Göz Molası", adres: "../goz-molasi/", not: "Ekran başında göz yorgunluğuna" },
    { ad: "Haftalık Planlayıcı", adres: "../planlayici/", not: "Ders ve iş programı" },
    { ad: "Muhasebe", adres: "../muhasebe/", not: "Gelir, gider, kasa ve cari" }
];

function digerUygulamalar() {
    const alt = document.querySelector("footer");
    if (!alt || alt.querySelector(".diger-uygulamalar")) return;
    const k = document.createElement("div");
    k.className = "diger-uygulamalar";
    k.innerHTML = `<h2>Diğer ücretsiz uygulamalarım</h2>
        <div class="diger-izgara">${DIGER_UYGULAMALAR.map(u =>
            `<a class="diger-kart" href="${u.adres}"><b>${u.ad}</b><span>${u.not}</span></a>`).join("")}</div>`;
    alt.insertBefore(k, alt.firstChild);
}

// ---------- Son kullanılanlar geçmişi ----------
// Ana sayfa "Son kullandıklarınız" şeridini bundan doldurur.
// Yalnızca araç yolu tutulur; hiçbir hesap verisi kaydedilmez.
function gecmiseEkle(yol) {
    if (!yol || yol === "index.html" || yol === "gizlilik.html") return;
    try {
        let g = JSON.parse(localStorage.getItem("hesapGecmis") || "[]");
        g = [yol].concat(g.filter(x => x !== yol)).slice(0, 8);
        localStorage.setItem("hesapGecmis", JSON.stringify(g));
    } catch (e) { }
}

// ---------- Boş sonuç durumu ----------
// 31 sayfa eksik girdide SESSİZCE boş kutu gösteriyordu: kullanıcı 0 yazıyor,
// ekranda hiçbir şey olmuyor, neden olmadığını da bilmiyordu.
// Artık ne yapması gerektiğini söylüyoruz.
/* Metni HTML'e gomulebilir hale getirir. AYIKLAMAK degil KACIRMAK:
   ayiklamak kullanicinin yazdigini degistirir, "<5" yazan kisi neden
   uyarildigini anlayamaz. */
function kacir(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
}

/* MESAJ HTML DEGIL METINDIR.
   Olculdu (28 Agustos 2026): iki sayfa kullanicinin YAZDIGINI bu mesaja
   koyuyordu -- `sayi-yaziyla-yazma` 20 karakter, `alan-cevre-hacim` 12
   karakter kirparak. Girdiler adres cubugunda tasindigi icin bu metin
   SALDIRGANIN hazirladigi bir baglantidan gelebilir; `innerHTML` ile
   basilinca saldirganin etiketi bizim adresimizde calisirdi: kayitli
   butce okunabilir, sahte sonuc gosterilebilirdi.
   Olculen kanit: `x<b data-sizinti=1>y` yuku `sayi-yaziyla-yazma`
   sayfasinda GERCEK bir dugum olusturdu (test-guvenlik.html).
   Kirpma koruma DEGILDI -- yalnizca uzun yukleri eledi, kisalari gecirdi;
   `alan-cevre-hacim` bu yuzden "temiz" gorunuyordu.
   Cagiranlarin hicbiri isaretleme gondermiyor; mesaj METIN olarak
   yaziliyor, boylece bundan sonraki cagiranlar da kendiliginden korunur. */
function sonucBekliyor(mesaj) {
    const o = document.getElementById("ozet");
    if (o) {
        o.innerHTML = `<div class="kutu bekleyen">
        <div class="bekleyen-simge" aria-hidden="true">⌨</div>
        <p class="bekleyen-baslik">Sonuç burada görünecek</p>
        <p class="kucuk"></p>
    </div>`;
        o.querySelector(".bekleyen .kucuk").textContent = mesaj ||
            "Yukarıdaki alanları doldurun — hesap siz yazarken anında yapılır.";
    }
    // BAYAT SONUC HATASI (27 Agustos 2026): burasi yalnizca #ozet ve #dokum'u
    // temizliyordu. net-maas sayfasinda 12 aylik tablo (#tablo) ONCEKI hesabi
    // gostermeye devam ediyordu: kutu bosaltilinca ustte "Brut maasinizi yazin"
    // yaziyor, altta hala "Ocak 90.251,22 TL" duruyordu. Kullanici artik
    // girmedigi bir maasin dokumunu okuyor -- cokme yok, sadece yalan.
    // Yeni sayfa eklerken sonuc kabina data-sonuc koymak yeterli.
    ["dokum", "tablo", "liste"].forEach(function (kimlik) {
        const k = document.getElementById(kimlik);
        if (k) k.innerHTML = "";
    });
    document.querySelectorAll("[data-sonuc]").forEach(function (k) { k.innerHTML = ""; });
}

// ---------- Mobilde yapışkan sonuç çubuğu ----------
// SORUN (ölçüldü): 375px ekranda sonuç y=736'da başlıyor, ekran 812.
// Kullanıcı formu doldururken cevabı GÖREMİYOR; her değişiklikte
// aşağı kaydırıp geri dönmesi gerekiyor. Hesap makinesinde en temel şey bu.
// ÇÖZÜM: sonuç ekrandan çıkınca altta ince bir çubukta göstermek.
/* Gorsel alanin olculeri. `visualViewport` yoksa duzen alanina duser. */
function gorselAlan() {
    const v = window.visualViewport;
    if (!v) return { ust: 0, yukseklik: window.innerHeight, kayma: 0 };
    return { ust: v.offsetTop, yukseklik: v.height, kayma: v.offsetTop };
}

function yapiskanSonuc() {
    if (!window.matchMedia("(max-width: 719px)").matches) return;
    const ozet = document.getElementById("ozet");
    if (!ozet) return;

    const c = document.createElement("div");
    c.className = "yapiskan-sonuc";
    c.setAttribute("role", "status");
    c.hidden = true;
    c.innerHTML = `<span class="ys-etiket"></span><b class="ys-deger"></b><span class="ys-ok" aria-hidden="true">↑</span>`;
    document.body.appendChild(c);
    document.body.classList.add("yapiskan-var");
    const etiketEl = c.querySelector(".ys-etiket");
    const degerEl = c.querySelector(".ys-deger");

    // Sonuca dön
    c.addEventListener("click", () => {
        const d = ozet.querySelector(".dev-deger, .yazi-sonuc");
        (d || ozet).scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // "Sonuç ekranda mı" sorusunu SAYININ KENDİSİNE sormak lazım, kutunun
    // tamamına değil: kutunun %35'i görünmese de sayı okunuyor olabilir.
    // Sayı her hesapta yeniden oluşturulduğu için IntersectionObserver
    // hedefini kaybediyor; o yüzden kaydırmada elle ölçüyoruz.
    function sayiOkunuyorMu() {
        const d = ozet.querySelector(".dev-deger, .yazi-sonuc");
        if (!d) return true;
        const k = d.getBoundingClientRect();
        const cubukPayi = 60;                    // çubuğun kaplayacağı alan
        /* GORSEL ALAN, DUZEN ALANI DEGIL.
           Burada once `innerHeight` vardi. Telefonda klavye acilinca
           `innerHeight` DEGISMEZ -- duzen alani ayni kalir, yalnizca
           GORSEL alan kisilir. Sonuc: klavye ekranin yarisini kapatirken
           kod sayiyi "gorunuyor" sayiyor ve cubugu gizli tutuyordu.
           Yani cubuk tam da en cok gerektigi anda ortaya cikmiyordu.
           Olculdu (28 Agustos 2026, 375x420 = klavye acik yuksekligi):
           sonucun ustu y=393, ekran 420 -- sayi 27 px kala dipte,
           kullanici yazarken cevabini goremiyordu. */
        const gorunen = gorselAlan();
        return k.top >= gorunen.ust &&
               k.bottom <= gorunen.ust + gorunen.yukseklik - cubukPayi;
    }

    function tazele() {
        const d = ozet.querySelector(".dev-deger, .yazi-sonuc");
        const e = ozet.querySelector(".dev-etiket");
        if (!d) { c.hidden = true; return; }
        degerEl.textContent = d.textContent.trim();
        etiketEl.textContent = (e ? e.textContent.trim() : "").slice(0, 30);
        c.hidden = sayiOkunuyorMu();
    }

    // requestAnimationFrame kullanmiyoruz: sayfa cizim yapmadiginda hic
    // calismiyor. Ama bu tam koruma DEGIL -- olculdu (28.08.2026): cizim
    // durmus sekmede `scroll` olayi da atesleme yapmiyor, cubuk yine bayat
    // kaliyor. Kullanici o sekmeye bakmadigi icin zarari yok; sekme one
    // gelince ilk kaydirmada duzeliyor.
    let sonCalisma = 0;
    const kaydirinca = () => {
        const t = Date.now();
        if (t - sonCalisma < 80) return;
        sonCalisma = t;
        tazele();
    };
    addEventListener("scroll", kaydirinca, { passive: true });
    addEventListener("resize", kaydirinca);

    /* KLAVYE `resize` URETMEZ. Duzen alani degismedigi icin pencerenin
       `resize` olayi cogu telefonda hic atesleme yapmaz; degisen sey
       `visualViewport`tur. Onu dinlemezsek cubuk klavye acildiginda
       ne guncellenir ne yer degistirir.
       `position: fixed; bottom: 0` de duzen alanina gore hesaplanir --
       yani klavyenin ARKASINDA kalir. Gorsel alan ne kadar yukari
       kaydiysa cubugu o kadar yukari cekiyoruz. */
    function cubuguYerlestir() {
        const g = gorselAlan();
        const alt = (window.innerHeight - (g.ust + g.yukseklik));
        c.style.transform = alt > 0 ? "translateY(-" + Math.round(alt) + "px)" : "";
    }
    if (window.visualViewport) {
        const vv = window.visualViewport;
        const guncelle = () => { cubuguYerlestir(); kaydirinca(); };
        vv.addEventListener("resize", guncelle);
        vv.addEventListener("scroll", guncelle);
        cubuguYerlestir();
    }

    // Kullanıcı yazdıkça sonuç değişir; çubuk da değişsin
    try {
        new MutationObserver(tazele).observe(ozet, { childList: true, subtree: true, characterData: true });
    } catch (e) { }

    tazele();
}
