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
