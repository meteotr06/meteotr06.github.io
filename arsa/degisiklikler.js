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
