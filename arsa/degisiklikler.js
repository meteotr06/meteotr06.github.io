/* NELER DEĞİŞTİ — kullanıcıya yaptığımız işi söyle (K-44).
 *
 * NEDEN VAR
 *   Bu uygulama insanların **para kararını** etkiliyor. Biri buradaki
 *   bir sayıya bakıp bir arsaya teklif verebilir. Sessizce yayınlamak,
 *   o kişinin yanlış bir rakamla karar vermiş olabileceğini ondan
 *   saklamak demek.
 *
 *   `gizlilik.html` zaten söz veriyor: "esaslı bir değişiklikte uygulama
 *   içinde ayrıca bilgilendirme yapılır." Bu dosya o sözün karşılığı.
 *
 * `surum` NE DEMEK
 *   Bu değişikliklerin ÇIKTIĞI damga. Güncel damgaya eşit olmak ZORUNDA
 *   DEĞİL ve olmaya çalışma. Damga her yayında artıyor, bu liste ise
 *   yalnızca anlatılacak bir şey olunca büyüyor.
 *
 *   Şerit "damgaya eşit kayıt" değil, "kullanıcının en son gördüğünden
 *   BÜYÜK kayıt" arıyor. Eşitlik arayan bir kapı, iki elle yazılan
 *   sayının ayrıştığı gün SESSİZCE hiç çıkmaz — bu tuzak 27–28 Ağustos'ta
 *   üç ayrı projede yakalandı (K-46).
 *
 * `hesapDuzeltmesi`
 *   SAYI değiştiyse true. O zaman kullanıcıya "daha önce sonuç aldıysanız
 *   bir kez daha alın" deniyor. Metin düzeltmesi için true YAZMA —
 *   her seferinde uyaran bir uyarı, uyarı olmaktan çıkar.
 */
var DEGISIKLIKLER = [
    {
        surum: 133,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Yardım düğmelerine artık gerçekten basılabiliyor',
        maddeler: [
            'Terimlerin yanındaki soru işareti düğmeleri parmakla ' +
            'vurulamıyordu. Daha önce düzelttiğimizi sanmıştık; yeni ' +
            'yazdığımız ekran denetimi bunu ÇÜRÜTTÜ. Büyüttüğümüz alan ' +
            'başka ögelerin altında kalıyormuş. Düğmenin kendisi ' +
            'büyütüldü, görünüş aynı kaldı.',

            'Onay kutularının etiketleri artık kutuya bağlı: yazıya ' +
            'dokunmak da kutuyu işaretliyor, ekran okuyucu da ne ' +
            'olduğunu söylüyor.',

            'Rayiç kutusundaki resmî belge bağlantısı, yazı ' +
            'büyütüldüğünde tıklanamayacak kadar küçülüyordu.'
        ]
    },
    {
        surum: 128,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Arsanızı haritada bulun — Türkiyenin bütün mahalleleri',
        maddeler: [
            'Yeni: il, ilçe ve mahallenizi seçin, arsanızın bulunduğu yeri ' +
            'UYDU GÖRÜNTÜSÜNDE gösterelim. Türkiyenin 43.265 mahalle ve ' +
            'köyü listede.',

            'Numara istemiyoruz, terim kullanmıyoruz: üç açılır kutu, ' +
            'hepsi tanıdık kelimelerle.',

            'İşaret mahallenin MERKEZİNİ gösterir, arsanızı değil. ' +
            'Haritayı yakınlaştırıp kendi arsanızı bulabilirsiniz.',

            'Tapudaki tam alan için TKGMnin kendi sayfasına bağlantı ' +
            'koyduk. TKGM verisini uygulamanın içine çekmiyoruz — servis ' +
            'başka sitelerin çağırmasını istemiyor, biz de bu sınıra ' +
            'uyuyoruz.',

            'Harita internet ister; olmadığında uygulama eskisi gibi ' +
            'çalışmaya devam eder.'
        ]
    },
    {
        surum: 120,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Telefonda: "undefined" yazısı ve küçük yardım düğmeleri düzeltildi',
        maddeler: [
            'Güncelleme şeridinde ekranın en üstünde "undefined" ' +
            'yazıyordu — hem de neyin değiştiğini anlatması gereken ' +
            'yerde. Kod, kayıtlarda bulunmayan bir alanı okuyordu. ' +
            'Sayfa çalıştığı ve konsol temiz olduğu için aylarca fark ' +
            'edilmemiş; ekrana bakan ölçüm yakaladı.',

            'Terimlerin yanındaki "?" düğmeleri 20 piksel karedi — ' +
            'parmakla vurulması gereken en küçük ölçünün yarısı. ' +
            'Görünüş aynı kaldı, dokunma alanı 44 piksele çıkarıldı.',

            'Aynı düğmeler ekran okuyucuda sadece "soru işareti" diye ' +
            'okunuyordu; artık hangi alanı açıkladıklarını söylüyorlar.',

            'Ölçüldü: telefon boyutunda (375 piksel) ve yazı iki ' +
            'katına çıkarıldığında hiçbir şey ekran dışına taşmıyor.'
        ]
    },
    {
        surum: 117,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'Değer artışı istisnası YILLIK — işlem başına değil',
        maddeler: [
            'Aynı yıl iki taşınmaz satan biri için vergiyi olduğundan ' +
            'DÜŞÜK gösteriyorduk. 150.000 TL istisna, bir takvim ' +
            'yılındaki değer artışı kazançlarının TOPLAMINA bir kez ' +
            'uygulanır (GVK mükerrer md. 80); biz her satışta yeniden ' +
            'düşüyorduk.',

            'Bu hata sizi EKSİK BEYANA sürükleyebilirdi — cezası da ' +
            'var. Artık istisnanın yıllık olduğunu ekranda yazıyoruz ve ' +
            'o yıl kullandığınız kısmı hesaba katabiliyoruz.',

            'Aynı yıl birden fazla satış yaptıysanız hesabı tekrar ' +
            'yapın.'
        ]
    },
    {
        surum: 115,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'Mevzuat denetimi: beş düzeltme',
        maddeler: [
            'DÜŞÜK BEYAN CEZASI DÖRT KAT ARTMIŞ, biz eskisini ' +
            'yazıyorduk. Tapuda gerçek bedelin altında beyan ' +
            'ederseniz vergi ziyaı cezası artık %25 değil BİR KAT ' +
            '(eksik harcın tamamı kadar) — 7566 sayılı Kanun, ' +
            '19 Aralık 2025. Cezayı olduğundan küçük gösteriyorduk.',

            'RAYİÇ DEĞERİ DE TAVANA TABİ. Cetvelden aldığınız ' +
            'metrekare değeri belediyenin HAM TAKDİR rakamıdır. ' +
            'Tebliğin örneğinde takdir 4.000 TL iken uygulanan değer ' +
            '1.800 TL olmuş. Artık emsal alanına yazarken bunu ' +
            'söylüyoruz.',

            'BODRUM KAT MALİYETİ DEĞİŞTİRİR. Yapı yüksekliğine ' +
            'bodrum, asma kat ve çatı arası da dâhil. Kat sayınıza ' +
            'bunları katmadıysanız yapı sınıfı bir üste çıkabilir ve ' +
            'inşaat maliyeti artar; uyarıyı ekledik.',

            'Emlak vergisi satırı artık "+ %10 katkı payı" diyor. ' +
            'Sayı zaten doğruydu ama adı eksikti; belediye ' +
            'tahakkukuyla karşılaştıran %10 fazla görüyordu.',

            'Yasal tavan 2029 sonuna kadar SÜRMÜYOR: 2026 için tek ' +
            'seferlik. 2027-2029 bu sınırlı değere yeniden değerleme ' +
            'oranı eklenerek yürüyor. Yanlış yazmıştık.'
        ]
    },
    {
        surum: 111,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Verisi olmayan ilçede artık belediyenin resmî sorgusuna yönlendiriyoruz',
        maddeler: [
            'Eskiden "bu ilçe için veri yok" deyip sizi orada bırakıyorduk. ' +
            'Artık o ilçenin belediyesi rayiç değerlerini kendi sitesinde ' +
            'sorgulatıyorsa, doğrudan o sayfaya bağlantı veriyoruz.',

            'Neden önemli: belediyelerin çoğu cetveli PDF olarak değil, ' +
            'kendi e-belediye sitesinde sorgu sayfası olarak yayımlıyor. ' +
            'İzmirin 30 ilçesini taradık: PDF olarak yayımlayan 1, sorgu ' +
            'sayfası olan 8 çıktı.',

            'Belediyenin kendi sayfası HER ZAMAN GÜNCELDİR; bizim ' +
            'kopyamız zamanla eskir. Bu yüzden verimiz olmayan yerde ' +
            'sizi kaynağa göndermek daha doğru cevap.',

            'Bağlantı belediyenin sitesine gider, uygulamadan çıkarsınız — ' +
            'bunu da ekranda yazıyoruz. Bulduğunuz metrekare değerini ' +
            'emsal fiyat alanına yazabilirsiniz.'
        ]
    },
    {
        surum: 107,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Yeni: satarsanız ne kadar vergi ödersiniz',
        maddeler: [
            'Bir arsayı aldıktan sonra 5 YIL DOLMADAN satarsanız, kârınız ' +
            'üzerinden "değer artışı kazancı" vergisi ödersiniz. Uygulama ' +
            'bunu HİÇ SÖYLEMİYORDU — oysa hesabı içinde zaten vardı ve ' +
            'sınanmıştı; sadece hiçbir ekrana bağlanmamıştı.',

            'Artık İmar sekmesindeki maliyet kartında görünüyor. Arsa ' +
            'zaten sizinse Parsel sekmesindeki "6 · Satarsanız vergi" ' +
            'bölümüne alış tarihinizi ve bedelinizi girin; tutarı ' +
            'hesaplıyoruz. Almayı düşünüyorsanız boş bırakın — 5 yıl ' +
            'kuralını yine de yazıyoruz.',

            '5 yıl dolduktan sonra satarsanız bu vergi doğmaz. Miras ' +
            'veya bağışla edindiğiniz taşınmazda da doğmaz; ikisini de ' +
            'ayrı ayrı söylüyoruz.',

            'Satış giderlerinizi (tapu harcı, emlakçı, ilan) girmezseniz ' +
            '0 kabul edilir ve vergi olduğundan YÜKSEK çıkar. Bunu da ' +
            'ekranda yazıyoruz.'
        ]
    },
    {
        surum: 105,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'DÜZELTME: yasal tavan üç kat, iki kat değil',
        maddeler: [
            'Birkaç saat önce yayınladığımız sürümde yasal tavanı "2025 ' +
            'değerinizin İKİ KATI" diye yazmıştık. YANLIŞTI. Doğrusu: ' +
            'ÜÇ KATI. Kanun "iki kat fazlasını geçemez" diyor ve tebliğin ' +
            'örneği bunu 900.000 + (900.000 × 2) = 2.700.000 TL diye ' +
            'hesaplıyor.',

            'Neden yanlış yazdık: kanun metnini değil, bir mali müşavir ' +
            'özetini okumuştuk. Özet "900.000 → 1.800.000" demişti. ' +
            '1.800 sayısı tebliğin tablosunda GERÇEKTEN var ama başka bir ' +
            'satırda ve başka bir şeyi anlatıyor (metrekare birim değeri). ' +
            'Şimdi tebliğin PDF metni doğrudan okundu ve tablonun her ' +
            'satırı sınamaya çıpa olarak konuldu.',

            'Bu arada tavan hesabı yaptıysanız TEKRAR YAPIN: eski sürüm ' +
            'sınırı olduğundan düşük gösteriyordu, yani belediyenin ' +
            'uygulayabileceği değeri olduğundan düşük sanmış olabilirsiniz.'
        ]
    },
    {
        surum: 104,
        tarih: '30 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'Emlak vergisine yasal tavan eklendi',
        maddeler: [
            '2025 sonunda çıkan 7566 sayılı Kanun, 2026 emlak vergi ' +
            'değerine bir TAVAN koydu. Uygulama bu sınırı hiçbir ekranda ' +
            'göstermiyordu; artık gösteriyor. (Bu sürümde çarpan yanlış ' +
            'yazılmıştı, v105 düzeltti.)',

            'Belediyelerin 2026 rayiç cetvelleri bu kanundan ÖNCE ' +
            'hazırlandı. Yani cetveldeki metrekare değeri ham takdir ' +
            'değeridir; tavan uygulanmamış olabilir. Uygulama artık bunu ' +
            'söylüyor.',

            'Yeni alan: "2025 emlak vergi değeri". Girerseniz yasal tavanı ' +
            've o tavandaki yıllık vergiyi hesaplıyoruz. Boş bırakırsanız ' +
            'hiçbir şey bozulmaz — sadece "ölçülemedi" yazarız, tahminî ' +
            'bir sayıyla tavan hesaplamayız.',

            'Sınır yalnız vergiye değil, aynı değerlere dayanan HARÇLARA ' +
            'da işliyor; tapu harcının alt sınırı olan emlak vergi değeri ' +
            'de tavana tabi.',

            'Gizlilik ve "neler değişti" sayfaları 29 sürüm eski kod ' +
            'istiyordu; o sayfaları açanlar eski sürümü alıyordu. ' +
            'Düzeltildi.'
        ]
    },
    {
        surum: 69,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Telefonunuzda yazıyı büyüttüyseniz artık uygulama da büyüyor',
        maddeler: [
            'Telefon veya tarayıcı ayarından yazı boyutunu büyüttüyseniz ' +
            'uygulama bunu YOK SAYIYORDU — yazılar hep aynı kalıyordu. ' +
            'Artık sizin ayarınıza uyuyor.',

            'Uzun parsel adı yazdığınızda defter kartı ekranın dışına ' +
            'taşıyor ve SİLME düğmesi görünmez oluyordu. Düzeltildi.',

            'Yazıyı iki katına çıkardığınızda onay kutularının yazısı ' +
            'ekranın dışında kalıyor ve okunamıyordu. Düzeltildi.',

            'Ölçüldü: telefon boyutunda %100, %150 ve %200 yazıda hiçbir ' +
            'şey ekran dışına taşmıyor.'
        ]
    },
    {
        surum: 64,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Güncelleme sonrası çevrimdışı açılmama riski kapatıldı',
        maddeler: [
            'Yeni bir sürüm yayınlandıktan hemen sonra, elinizde hâlâ ' +
            'eski sayfa varken interneti kaybederseniz uygulama ' +
            'AÇILMAYABİLİRDİ — çevrimdışı katmanı, sayfanın istediği ' +
            'sürüm etiketiyle kendi kaydettiğini eşleştiremiyordu.',

            'Tam da çevrimdışı çalışmanın gerektiği anda çalışmaması ' +
            'demekti. Artık etiket uyuşmasa bile kaydedilmiş dosya ' +
            'kullanılıyor.',

            'Ölçüldü: ağ kapatıldı, eski etiketli üç dosya da ' +
            'açıldı; olmayan bir dosya ise doğru şekilde açılmadı.'
        ]
    },
    {
        surum: 59,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Yazdırılan raporda tarih artık her zaman çıkıyor',
        maddeler: [
            'Raporu Ctrl+P ile ya da tarayıcı menüsünden yazdırdıysanız ' +
            'kâğıdın üstü BOŞ çıkıyordu — tarih yalnızca uygulamanın ' +
            'kendi "Yazdır" düğmesine basınca yazılıyordu.',

            'Tarihsiz bir değer raporu yanıltır: arsa fiyatları değişir ' +
            've buradaki resmî oranlar 2026 yılına aittir. Üç ay sonra o ' +
            'kâğıda bakan kimse ne zaman üretildiğini bilemez.',

            'Artık hangi yoldan yazdırırsanız yazdırın tarih çıkıyor.'
        ]
    },
    {
        surum: 58,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Okunamayan defter kaydı artık uydurma sayı göstermiyor',
        maddeler: [
            'Bir kaydınız bozulursa uygulama eskiden onu yine de ' +
            'çiziyordu: tarihi "01.01.1970", alanı "-500 m²" gibi ' +
            'GERÇEKÇİ görünen ama uydurma değerlerle. Kendi kaydınız ' +
            'sanabilirdiniz.',

            'Artık böyle bir kayıt "okunamadı" diye işaretleniyor ve ' +
            'hiçbir sayı gösterilmiyor. Yanlış bir sayı göstermektense ' +
            'söylemeyi tercih ediyoruz. Kayıt silinmiyor — kararı size ' +
            'bırakıyoruz; diğer kayıtlarınız etkilenmiyor.'
        ]
    },
    {
        surum: 57,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Sayılar Türkçe yazımla gösteriliyor — yanlış okunmasınlar diye',
        maddeler: [
            'Bazı ondalıklı sayılar virgül yerine NOKTA ile yazılıyordu. ' +
            'Türkçede nokta binlik ayırıcıdır; böyle yazılan bir sayıyı ' +
            'bin kat büyük okumak çok kolaydır. Sayı doğruydu ama yazımı ' +
            'yanlış okunmaya açıktı. Artık hepsi virgülle yazılıyor.',

            '"Tahmini kat adedi" 7,1 gibi kesirli çıkabiliyordu — 0,1 kat ' +
            'diye bir şey yok. Üstelik aynı ekrandaki bahçe mesafeleri ' +
            'zaten 7 kat üzerinden hesaplanıyordu: bir yerde 7,1, ' +
            'öbüründe 7. Artık ikisi de aynı sayı.',

            'Hesaplarda değişiklik yok; değişen yalnızca sayıların ' +
            'ekranda nasıl yazıldığı.'
        ]
    },
    {
        surum: 54,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Defterde yanlış kaydın silinmesi düzeltildi',
        maddeler: [
            'İki sekmede birden açtıysanız, defterden bir parseli ' +
            'silerken BAŞKA bir parsel silinebiliyordu. Onay kutusu ' +
            '"X silinsin mi?" diye soruyor, siz onaylıyordunuz, X ' +
            'duruyor ve az önce kaydettiğiniz parsel gidiyordu.',

            'Artık her kaydın kendi kimliği var; silme sıraya değil ' +
            'kimliğe bakıyor. Kayıt bulunamazsa hiçbir şey silinmiyor ' +
            've size söyleniyor.',

            'Defter sekmesine her geçişte yenileniyor, ve öteki ' +
            'sekmede kaydettiğiniz parsel burada da anında görünüyor.',

            'Ayrıca: kayıtlarınız bir şekilde okunamaz hâle gelirse ' +
            'uygulama artık üzerine yazmadan önce bir kopyasını ' +
            'saklıyor. Eskiden bu durumda "deftere ekle" sessizce ' +
            'hiç çalışmıyordu.'
        ]
    },
    {
        surum: 52,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Ekran okuyucu artık hangi sekmede olduğunuzu söylüyor',
        maddeler: [
            'Uygulama görme engelli kullanıcılar için sekme yapısını ' +
            'ilan ediyordu ama gereğini yapmıyordu: ekran okuyucu dört ' +
            'sekme sayıyor, hangisinin açık olduğunu SÖYLEYEMİYORDU.',

            'Artık etkin sekme hem renkle hem sözle belli. Bölümler de ' +
            'kendi sekmeleriyle eşleştirildi. Sayılarda değişiklik yok.'
        ]
    },
    {
        surum: 51,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'Resmî cetvelde iki değerle geçen sokak artık ikisini de gösteriyor',
        maddeler: [
            'Menemen resmî değer cetvelinde bir cadde (Değirmendere / ' +
            '30 Ağustos Caddesi) İKİ ayrı değerle geçiyor: 16.000 ve ' +
            '17.000 TL/m². Eskiden bu cadde listede iki kez görünüyordu ' +
            've hangisini seçtiğinizi anlamanın yolu yoktu.',

            'Artık tek satır çıkıyor ve ikiliği açıkça söylüyor: hangi ' +
            'değerin sizin bölümünüz olduğunu belediyeden doğrulamanız ' +
            'gerektiğini yazıyor. Düğme düşük olanı yazar — bu bir TABAN ' +
            'değer ve tabanı yüksek tutmak tahmini şişirir.',

            'Ayrıca resmî değer listesi artık sürüm etiketiyle iniyor. ' +
            'Önceden liste güncellendiğinde tarayıcı eskisini saklıyor ' +
            'olabilirdi; bu, güncellenen bir resmî değeri görmemenize ' +
            'yol açabilirdi.'
        ]
    },
    {
        surum: 50,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: false,
        baslik: 'Ekranı kaplayan yanlış hata uyarısı kaldırıldı',
        maddeler: [
            'Uygulamayı açtığınızda "Uygulama eksik yüklendi — hesaplama ' +
            'çalışmıyor" yazan bir kutu ekranı kaplıyordu. Bu kutu ' +
            'yanlıştı: uygulama düzgün çalışıyordu, hesap da doğruydu.',

            'Sebep: kutunun gizlenmesi gerektiğini söyleyen işaret ' +
            'duruyordu ama görünümü belirleyen kural onu eziyordu. ' +
            'Kutu "gizli" sayılıyor, yine de çiziliyordu.',

            'Sayılarda bir değişiklik yok — hesap zaten doğruydu, ' +
            'sadece üstünü örten bir uyarı vardı. Daha önce sonuç ' +
            'aldıysanız o sonuç geçerlidir.'
        ]
    },
    {
        surum: 49,
        tarih: '29 Ağustos 2026',
        hesapDuzeltmesi: true,
        baslik: 'İki yöntem çok ayrışırsa artık tek bir aralık vermiyoruz',
        maddeler: [
            'Uygulama parselinizi iki bağımsız yöntemle değerlendiriyor. ' +
            'Bu iki yöntem bazen birbirinden çok uzak sonuç veriyor. ' +
            'Eskiden bu durumda yine tek bir aralık gösteriyorduk ve ' +
            'gösterdiğimiz aralık, kendi tahminlerimizden birini ' +
            'DIŞARIDA bırakabiliyordu.',

            'Artık böyle bir parselde "tek bir aralık veremiyoruz" diyoruz ' +
            've iki tahmini ayrı ayrı gösteriyoruz. Dar bir aralık ' +
            'yanıltıcı olurdu; dürüstçe geniş bir aralık ise karar ' +
            'verilemeyecek kadar geniş olurdu.',

            'Ölçüm notu: bu durumun bugünkü uygulamada oluşmadığını ' +
            'ölçtük (62.208 seçenek bileşimi tarandı; en büyük ayrışma ' +
            '%108,9, koruma %120 üzerinde devreye giriyor). Koruma, ' +
            'resmî rayiç verisi gerçek emsalleri getirdiğinde gerekecek ' +
            'diye şimdiden kondu.'
        ]
    },
    {
        surum: 42,
        tarih: '28 Ağustos 2026',
        ozet: 'Yarım kalan parseliniz artık kayboluyor değil: sayfa ' +
              'yenilenirse girdiğiniz alanlar geri geliyor.',
        /* Katsayı değişmedi; bu bir veri kaybı düzeltmesi. */
        hesapDuzeltmesi: false,
        maddeler: [
            'Formu doldururken sayfa yenilenirse (telefonda bellek ' +
                'baskısıyla bu kendiliğinden olabiliyor) girdiğiniz her ' +
                'şey siliniyordu ve uyarı da yoktu. Artık taslak ' +
                '<b>bu cihazda</b> saklanıyor ve geri yükleniyor.',
            'Geri yükleyince <b>ne zaman girildiğini</b> de yazıyoruz. ' +
                'Sessizce dönen eski bir parsel, silinmesinden daha ' +
                'kötü olurdu: bugünkü arsayı hesapladığınızı ' +
                'sanabilirdiniz. Tek düğmeyle temizlenebiliyor.',
            'Taslak da defteriniz gibi <b>yalnızca cihazınızda</b> kalır; ' +
                'hiçbir yere gönderilmez.',
        ],
    },
    {
        surum: 41,
        tarih: '28 Ağustos 2026',
        ozet: 'İki yerde belirsizliği açıkça yazdık: yola cephesi olmayan ' +
              'parselde ne yapılabileceği ve imar fonksiyonu çarpanının ' +
              'kendi kaynağımızla ters düştüğü.',
        /* Hiçbir katsayı değişmedi — ölçüldü: canlı sürümle yerel
           sürüm arasındaki tek fark iki metin bloğu. O yüzden false. */
        hesapDuzeltmesi: false,
        maddeler: [
            'Yola cephesi olmayan parsel: uygulama yalnızca <b>ruhsat ' +
                'alınamaz</b> diyordu, doğruydu ama eksikti. Artık ' +
                'yönetmeliğin tanıdığı iki çıkış yolu da yazıyor: ' +
                '<b>tevhit</b> (yola cepheli komşu parselle birleştirme — ' +
                'başka hüküm uygulanamıyorsa zorunlu olabilir) ve ' +
                '<b>geçit hakkı</b> (üç koşul birlikte: parsel ' +
                'yönetmelikten önce oluşmuş, bitişiğinde boş parsel yok, ' +
                've sınırsız geçit hakkı tapuya şerh edilmiş).',
            'İmar fonksiyonu çarpanı: bu çarpanlar sanayiyi konutun ' +
                '<b>altına</b> koyuyor, uygulamanın kendi kaynağı olan K7 ' +
                'puanlama tablosu ise <b>üstüne</b>. Bu ters düşme artık ' +
                'kaynak metninde açıkça yazıyor. <b>Sayı değişmedi</b> — ' +
                'motor zaten iki yöntemi de koşup aradaki ayrışmayı ' +
                '(sanayide %18,6) sonuç bandına ekliyordu.',
            'Uygulama güncellendiğinde ne değiştiğini söyleyen bu sayfa ' +
                've açılıştaki şerit eklendi.',
        ],
    },
];
