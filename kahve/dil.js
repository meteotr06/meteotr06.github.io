/* ROASTMATE — DİL KATMANI / LANGUAGE LAYER
   ==================================================================
   İKİ DİL: Türkçe (varsayılan) ve İngilizce.

   NEDEN BİR SÖZLÜK DOSYASI, NEDEN İKİ AYRI SAYFA DEĞİL:
   İki ayrı index.html tutulsaydı, bir düzeltme birinde yapılıp
   ötekinde unutulurdu. Bu takımda tam bu yaşandı (K-69: bir uygulamada
   kapatılan sınıf kardeşlerinde açık kalır). Tek sayfa + tek sözlük
   olunca, çevirisi eksik olan anahtar ÖLÇÜLEBİLİR -- `sinama.html`
   her anahtarın iki dilde de var olduğunu denetler.

   ------------------------------------------------------------------
   ÜÇ ŞEY DİLE BAĞLIDIR, DÖRDÜNCÜSÜ DEĞİLDİR:

     1. METİN        -- bu dosyadaki sözlük.
     2. SAYI OKUMA   -- "1,500" Türkçe'de 1,5 · İngilizce'de 1500.
                        `C.dilAyarla()` ile motora bildirilir.
     3. SAYI YAZMA   -- 1500,50 · 1,500.50. `Dil.yerel()` verir.

     4. PARA BİRİMİ DİLE BAĞLI DEĞİLDİR. İngilizce konuşan biri de
        Türk Lirası ile alışveriş yapıyor olabilir; Türkçe konuşan
        biri de dolarla yeşil kahve alıyor olabilir. Bu yüzden para
        birimi AYRI bir seçimdir. Yalnız kullanıcı HİÇ seçmemişse
        dilden türetilir (tr -> TL, en -> USD) -- ve o türetilmiş
        değer diske YAZILMAZ, yoksa dil değişince donar.

   ------------------------------------------------------------------
   VERİ HİÇBİR ZAMAN DİLE BAĞLI DEĞİLDİR. Kavurma defterine kod
   yazılır, ekrana çeviri çıkar. Ayrıntı: veri.js başlığı.
   ================================================================== */
(function (global) {
    'use strict';

    var ANAHTAR_DIL = 'kahve-dil';
    var ANAHTAR_PARA = 'kahve-para';

    /* ---------------- PARA BİRİMLERİ ----------------
       Simge ve KONUM ayrı: Türkçe'de "500,00 ₺", İngilizce'de
       "$500.00". Simgeyi hep sona koysaydık İngilizce yanlış olurdu. */
    var PARALAR = {
        TL:  { simge: '₺', once: false },
        USD: { simge: '$', once: true },
        EUR: { simge: '€', once: true },
        GBP: { simge: '£', once: true }
    };

    /* ================= SÖZLÜK =================
       Anahtar adları TÜRKÇE ve anlamlıdır; `sinama.html` her ikisinin
       de dolu olduğunu denetler. Boş bırakılan bir çeviri, ekranda
       BOŞLUK olarak görünür -- sessiz kusur. */
    var S = {
        /* ---- başlık çubuğu ---- */
        temaBtn:     { tr: 'Açık / koyu tema',        en: 'Light / dark theme' },
        renkBtn:     { tr: 'Renk seç',                en: 'Choose colour' },
        dilBtn:      { tr: 'Language / Dil',          en: 'Dil / Language' },
        renkBaslik:  { tr: 'Renk',                    en: 'Colour' },
        dilBaslik:   { tr: 'Dil',                     en: 'Language' },
        paraBaslik:  { tr: 'Para birimi',             en: 'Currency' },
        paraNot:     { tr: 'Para birimi dilden ayrıdır — İngilizce arayüzle Türk Lirası da kullanabilirsiniz.',
                       en: 'Currency is separate from language — you can use a Turkish UI with dollars.' },

        /* ---- sayfa basligi ----
           TARAYICI SEKMESI de cevrilmeli. `<title>` `<head>` icinde
           oldugu icin gozden kaciyordu: uygulama Ingilizce'ye gecse
           bile sekmede, gecmiste, yer imlerinde ve gorev
           degistiricide Turkce yaziyordu. Ustelik `<title>` sayfanin
           en guclu arama motoru sinyalidir -- Ingilizce kitleye
           acilmanin amaci tam da bulunabilmekti.
           `uygula()` zaten `textContent` yaziyor; `<title>` uzerinde
           bu dogrudan sekme basligini degistirir, yeni kod gerekmez. */
        sayfaBasligi: { tr: 'RoastLog — kavurma firesi, maliyet, harman, defter',
                        en: 'RoastLog — roast loss, cost, blend and roast log' },

        /* ---- sekmeler ---- */
        sekmeler:    { tr: 'Bölümler',                en: 'Sections' },
        tFire:       { tr: 'Fire',                    en: 'Roast loss' },
        tMaliyet:    { tr: 'Maliyet',                 en: 'Cost' },
        tHarman:     { tr: 'Harman',                  en: 'Blend' },
        tDemleme:    { tr: 'Demleme',                 en: 'Brewing' },
        tEnvanter:   { tr: 'Envanter',                en: 'Inventory' },
        tDefter:     { tr: 'Defter',                  en: 'Log' },

        /* ---- FİRE ---- */
        fireBaslik:  { tr: 'Firemi ölç',              en: 'Measure my roast loss' },
        fireAciklama:{ tr: 'Tarttınız: kaç kilo koydunuz, kaç kilo çıktı? <strong>Kendi makinenizin gerçek firesini</strong> buradan öğrenirsiniz — tahminle çalışmayı bırakırsınız.',
                       en: 'You weighed it: how much went in, how much came out? This is where you learn <strong>your own machine’s real loss</strong> — and stop guessing.' },
        fGirisEt:    { tr: 'Giren yeşil',             en: 'Green in' },
        fCikisEt:    { tr: 'Çıkan kavrulmuş',         en: 'Roasted out' },
        fireKaydet:  { tr: 'Deftere kaydet',          en: 'Save to log' },

        cevirBaslik: { tr: 'Ne kadar çıkar / ne kadar koymalıyım?',
                       en: 'How much comes out / how much do I load?' },
        cevirAciklama:{ tr: 'Fire oranınızı biliyorsanız iki yönde de hesaplar.',
                        en: 'If you know your loss rate, it works in both directions.' },
        hFireEt:     { tr: 'Fire oranı',              en: 'Loss rate' },
        hYesilEt:    { tr: 'Yeşil koyacağım',         en: 'Green I will load' },
        hYesilAlt:   { tr: 'kg → kaç kg çıkar',       en: 'kg → how many kg out' },
        hHedefEt:    { tr: 'Kavrulmuş istiyorum',     en: 'Roasted I want' },
        hHedefAlt:   { tr: 'kg → kaç kg yeşil',       en: 'kg → how many kg green' },

        /* ---- MALİYET ---- */
        maliyetBaslik:{ tr: 'Kilo maliyeti',          en: 'Cost per kilo' },
        maliyetAciklama:{ tr: 'Yeşil kahvenin kilo fiyatı, kavrulmuşun maliyeti <strong>değildir</strong>. Fire yüzünden 1 kilo kavrulmuş için daha fazla yeşil gerekir. Bu farkı atlayan zararına satar.',
                          en: 'The price of green coffee per kilo is <strong>not</strong> the cost of roasted. Because of roast loss, 1 kg of roasted needs more green. Miss this and you sell at a loss.' },
        mFiyatEt:    { tr: 'Yeşil kahve',             en: 'Green coffee' },
        mFireEt:     { tr: 'Fire',                    en: 'Loss' },
        mPartiEt:    { tr: 'Parti büyüklüğü',         en: 'Batch size' },
        mPartiAlt:   { tr: 'kg — isteğe bağlı',       en: 'kg — optional' },
        mEnerjiEt:   { tr: 'Enerji',                  en: 'Energy' },
        mIscilikEt:  { tr: 'İşçilik',                 en: 'Labour' },
        mPaketEt:    { tr: 'Paket',                   en: 'Bag' },
        mAmbalajEt:  { tr: 'Ambalaj',                 en: 'Packaging' },
        mFincanEt:   { tr: 'Fincan',                  en: 'Cup' },
        birimGram:   { tr: 'gram',                    en: 'grams' },
        birimParti:  { tr: '/ parti',                 en: '/ batch' },
        birimPaket:  { tr: '/ paket',                 en: '/ bag' },
        birimKg:     { tr: '/ kg',                    en: '/ kg' },
        maliyetAlt:  { tr: 'kavrulmuş kahvenin kilo maliyeti',
                       en: 'cost per kilo of roasted coffee' },

        /* ---- HARMAN ---- */
        harmanBaslik:{ tr: 'Harman',                  en: 'Blend' },
        harmanAciklama:{ tr: 'Oranları girin; her çekirdekten kaç kilo <strong>yeşil</strong> koymanız gerektiğini fire dahil hesaplar.',
                         en: 'Enter the ratios; it works out how many kilos of <strong>green</strong> you need from each bean, roast loss included.' },
        bHedefEt:    { tr: 'Hedef kavrulmuş',         en: 'Target roasted' },
        bEkle:       { tr: '+ Çekirdek ekle',         en: '+ Add bean' },
        harmanAlt:   { tr: 'toplam yeşil kahve',      en: 'total green coffee' },

        /* ---- DEMLEME ---- */
        demlemeBaslik:{ tr: 'Demleme oranı',          en: 'Brew ratio' },
        demlemeAciklama:{ tr: 'Kaç kişilik demleyeceksiniz? Kaç gram kahve, kaç ml su? <strong>Oranlar tariftir, ölçüm değildir</strong> — kendi zevkinize göre değiştirin.',
                          en: 'How much are you brewing? How many grams of coffee, how much water? <strong>Ratios are recipes, not measurements</strong> — adjust them to your taste.' },
        dYontemEt:   { tr: 'Yöntem',                  en: 'Method' },
        dSuEt:       { tr: 'Su',                      en: 'Water' },
        dOranEt:     { tr: 'Oran',                    en: 'Ratio' },

        /* ---- ENVANTER ---- */
        envanterBaslik:{ tr: 'Depoda ne var?',        en: 'What is in stock?' },
        envanterAciklama:{ tr: '<strong>Yeşil ve kavrulmuş ayrı depodur.</strong> Aralarındaki tek köprü fire: 10 kg yeşil düşer, %15 fireyle 8,5 kg kavrulmuş artar. Yarım kilo buharlaşır — hiçbir depoda yoktur. Kavrulmuşun kilo maliyeti bu yüzden yeşilinkinden yüksektir.',
                           en: '<strong>Green and roasted are separate stores.</strong> The only bridge between them is roast loss: 10 kg of green leaves, and at 15% loss 8.5 kg of roasted arrives. Half a kilo evaporates — it is in neither store. That is why roasted costs more per kilo than green.' },
        hareketEkle: { tr: '+ Hareket ekle',          en: '+ Add movement' },
        nTurEt:      { tr: 'Ne oldu?',                en: 'What happened?' },
        turAlim:     { tr: 'Yeşil kahve aldım',       en: 'Bought green coffee' },
        turKavurma:  { tr: 'Kavurdum',                en: 'Roasted' },
        turSatis:    { tr: 'Sattım',                  en: 'Sold' },
        turZayi:     { tr: 'Zayi / ıskarta',          en: 'Loss / scrap' },
        nTarihEt:    { tr: 'Tarih',                   en: 'Date' },
        nCesitEt:    { tr: 'Çeşit',                   en: 'Variety' },
        nCesitYer:   { tr: 'örn. Brezilya — ya da kendi parti adınız',
                       en: 'e.g. Brazil — or your own batch name' },
        nKgEt:       { tr: 'Ağırlık',                 en: 'Weight' },
        nKgKavurma:  { tr: 'Kavurmaya giren',         en: 'Loaded into roast' },
        nKgKavurmaAlt:{ tr: 'kg yeşil',               en: 'kg green' },
        nFiyatEt:    { tr: 'Kilo fiyatı',             en: 'Price per kilo' },
        nFireEt:     { tr: 'Fire',                    en: 'Loss' },
        nNeredeEt:   { tr: 'Hangi depodan',           en: 'From which store' },
        depoKavrulmus:{ tr: 'Kavrulmuş',              en: 'Roasted' },
        depoYesil:   { tr: 'Yeşil',                   en: 'Green' },
        nCikisEt:    { tr: '…ya da tarttıysanız: çıkan ağırlık',
                       en: '…or if you weighed it: output weight' },
        nCikisAlt:   { tr: 'kg — fireyi biz ölçeriz',
                       en: 'kg — we work out the loss' },
        nEkle:       { tr: 'Deftere işle',            en: 'Record it' },
        hareketlerBaslik:{ tr: 'Hareketler',          en: 'Movements' },

        /* ---- DEFTER ---- */
        defterBaslik:{ tr: 'Kavurma defteri',         en: 'Roast log' },
        defterAciklama:{ tr: 'Her parti kaydedilir. Uygulama zamanla <strong>sizin firenizi</strong> öğrenir — ortalamanızı ve partiler arası oynamayı gösterir.',
                         en: 'Every batch is recorded. Over time the app learns <strong>your own loss</strong> — it shows your average and how much it swings between batches.' },
        partiFormBaslik:{ tr: 'Parti ayrıntısı ekle', en: 'Add batch detail' },
        partiFormAciklama:{ tr: 'Fire sekmesinden gelen parti burada zenginleşir. <strong>Hiçbiri zorunlu değil</strong> — bilmediğiniz alanı boş bırakın, uygulama uydurmaz.',
                            en: 'The batch you saved on the Roast loss tab gets filled out here. <strong>Nothing is required</strong> — leave what you do not know blank; the app will not invent it.' },
        pMenseEt:    { tr: 'Menşe',                   en: 'Origin' },
        pIslemeEt:   { tr: 'İşleme',                  en: 'Processing' },
        /* Cekirdek turu: liste `veri.js`'te bastan beri vardi ama
           hicbir ekrana bagli degildi. */
        pTurEt:      { tr: 'Çekirdek türü',           en: 'Bean species' },
        pVaryeteEt:  { tr: 'Varyete',                 en: 'Variety' },
        pDereceEt:   { tr: 'Kavurma derecesi',        en: 'Roast level' },
        pToplamEt:   { tr: 'Toplam süre',             en: 'Total time' },
        pToplamAlt:  { tr: 'dakika:saniye — örn. 10:30',
                       en: 'minutes:seconds — e.g. 10:30' },
        pCatlakEt:   { tr: 'İlk çatlak',              en: 'First crack' },
        pCatlakAlt:  { tr: 'dakika:saniye',           en: 'minutes:seconds' },
        pSarjEt:     { tr: 'Şarj sıcaklığı',          en: 'Charge temperature' },
        pCikisIsiEt: { tr: 'Çıkış sıcaklığı',         en: 'Drop temperature' },
        pNotEt:      { tr: 'Not',                     en: 'Note' },
        pNotAlt:     { tr: 'tat, koku, gözlem',       en: 'taste, aroma, observation' },
        pNotYer:     { tr: 'örn. çikolata, fındık; ikinci çatlak duyulmadı',
                       en: 'e.g. chocolate, hazelnut; no second crack heard' },
        bosSecim:    { tr: '— belirtilmedi —',        en: '— not specified —' },
        bosSecin:    { tr: '— seçin —',               en: '— choose —' },

        /* ---- ÜRETİLEN METİNLER (arayuz.js) ---- */
        girdiCikti:  { tr: '{0} girdi, {1} çıktı — {2} kayıp.',
                       en: '{0} in, {1} out — {2} lost.' },
        etiketKavrulmus:{ tr: 'kavrulmuş {0}',        en: 'roasted {0}' },
        etiketKayip: { tr: 'kayıp {0}',               en: 'lost {0}' },
        duyurFire:   { tr: 'Fire yüzde {0}. {1} kavrulmuş kahve çıkar.',
                       en: 'Roast loss {0} percent. {1} of roasted coffee comes out.' },
        cevirCikar:  { tr: 'kavrulmuş çıkar — {0} kayıp',
                       en: 'of roasted comes out — {0} lost' },
        cevirKoymali:{ tr: 'yeşil kahve koymalısınız', en: 'of green coffee you must load' },
        ciftYesilPayi:{ tr: 'yeşil kahve payı',       en: 'green coffee share' },
        ciftGiderPayi:{ tr: 'enerji + işçilik payı',  en: 'energy + labour share' },
        maliyetFark: { tr: 'Yeşil kahveye <strong>{0}</strong> veriyorsunuz, ama kavrulmuşun kilosu size <strong>{1}</strong>. Aradaki <strong>{2}</strong> fire yüzünden. Bu farkı hesaba katmayan zararına satar.',
                       en: 'You pay <strong>{0}</strong> for green, but a kilo of roasted costs you <strong>{1}</strong>. The <strong>{2}</strong> gap is roast loss. Anyone who ignores it sells at a loss.' },
        girilmedi:   { tr: 'Şunlar girilmedi, hesaba KATILMADI (sıfır sayılmadı): {0}',
                       en: 'These were left blank and were NOT counted (not treated as zero): {0}' },
        cekirdekEt:  { tr: 'Çekirdek',                en: 'Bean' },
        cekirdekN:   { tr: 'Çekirdek {0}',            en: 'Bean {0}' },
        oranEt:      { tr: 'Oran',                    en: 'Ratio' },
        duyurHarman: { tr: 'Toplam {0} yeşil kahve gerekiyor.',
                       en: '{0} of green coffee needed in total.' },
        hareketIslenmedi:{ tr: 'Hareket işlenmedi: {0}',
                           en: 'Movement not recorded: {0}' },
        hareketIslendi:{ tr: 'Hareket işlendi.',      en: 'Movement recorded.' },
        kaydedilemedi:{ tr: 'Kaydedilemedi — tarayıcı site verilerini engelliyor olabilir. Hesap yapıldı ama KAYDEDİLMEDİ; kapatırsanız kaybolur.',
                        en: 'Could not save — the browser may be blocking site data. The calculation ran but was NOT saved; close the page and it is gone.' },
        kaydedilemediKisa:{ tr: 'Kaydedilemedi — tarayıcı site verilerini engelliyor olabilir.',
                            en: 'Could not save — the browser may be blocking site data.' },
        hesaplanamadi:{ tr: 'Kayıtlı hareketler hesaplanamadı: {0}',
                        en: 'Recorded movements could not be calculated: {0}' },
        depoBos:     { tr: 'Depo boş. İlk hareketi ekleyin — yeşil kahve alımı iyi bir başlangıç.',
                       en: 'The store is empty. Add your first movement — buying green coffee is a good start.' },
        kavrulmusEk: { tr: '{0} kavrulmuş',           en: '{0} roasted' },
        depoOzet:    { tr: '{0} yeşil bekliyor · depodaki para {1}',
                       en: '{0} of green waiting · value in store {1}' },
        fireNotTek:  { tr: 'Kavrulmuş stok %{0} fireyle hesaplandı.',
                       en: 'Roasted stock calculated at {0}% loss.' },
        fireNotAralik:{ tr: '{0} kavurma · fire %{1} – %{2} arasında. Ortalama fire yazmıyoruz; partiler farklı ağırlıkta.',
                        en: '{0} roasts · loss between {1}% and {2}%. We do not print an average; batches differ in weight.' },
        etiketYesil: { tr: 'yeşil',                   en: 'green' },
        etiketKavrulmusKisa:{ tr: 'kavrulmuş',        en: 'roasted' },
        cesitBaslik: { tr: '{0} yeşil, {1} kavrulmuş', en: '{0} green, {1} roasted' },
        hareketYok:  { tr: 'Henüz hareket yok.',      en: 'No movements yet.' },
        cikanKg:     { tr: 'çıkan {0} kg (fire ölçüldü)',
                       en: '{0} kg out (loss measured)' },
        depodan:     { tr: '{0} depodan',             en: 'from the {0} store' },
        partiYok:    { tr: 'Henüz parti yok.<br>Fire ölçüp <strong>Deftere kaydet</strong> deyin — uygulama zamanla sizin firenizi öğrenir.',
                       en: 'No batches yet.<br>Measure a roast loss and hit <strong>Save to log</strong> — the app will learn your own loss over time.' },
        enDusuk:     { tr: 'en düşük',                en: 'lowest' },
        enYuksek:    { tr: 'en yüksek',               en: 'highest' },
        partiDuyur:  { tr: '{0}, fire yüzde {1}. Silmek için etkinleştirin.',
                       en: '{0}, roast loss {1} percent. Activate to delete.' },
        gelisimKisa: { tr: 'gelişim %{0}',            en: 'development {0}%' },
        okunamadi:   { tr: 'Girilen değer sayı olarak okunamadı.',
                       en: 'The value entered could not be read as a number.' },
        suOranPozitif:{ tr: 'Su ve oran sıfırdan büyük olmalı.',
                        en: 'Water and ratio must be greater than zero.' },
        demlemeAlt2: { tr: '{0} ml su için — 1:{1} oranında',
                       en: 'for {0} ml of water — at a 1:{1} ratio' },
        dtrKutu:     { tr: 'Gelişim oranı <strong>%{0}</strong> — ilk çatlaktan sonra {1} geçmiş. <em>Bu sayı için "doğru" bir aralık yazmıyoruz; makineye ve çekirdeğe göre değişir.</em>',
                       en: 'Development ratio <strong>{0}%</strong> — {1} elapsed after first crack. <em>We do not print a "correct" range for this number; it depends on the machine and the bean.</em>' },
        temaKoyu:    { tr: 'Koyu tema',               en: 'Dark theme' },
        temaAcik:    { tr: 'Açık tema',               en: 'Light theme' },
        depolamaKapali:{ tr: 'Tarayıcınız site verilerini engelliyor — kavurma defteri ve envanter KAYDEDİLEMEZ. Hesaplar çalışmaya devam eder, ama kapatınca kaybolur.',
                         en: 'Your browser is blocking site data — the roast log and inventory CANNOT be saved. The calculators keep working, but everything is lost when you close the page.' },
        /* ---- arayuz.js'in urettigi kalan metinler ---- */
        ciftPaket:   { tr: 'paket maliyeti',           en: 'packaging cost' },
        ciftFincan:  { tr: 'fincan maliyeti',          en: 'cost per cup' },
        duyurMaliyet:{ tr: 'Kilo maliyeti {0}',        en: 'Cost per kilo {0}' },
        turAdiAlim:  { tr: 'Alım',                     en: 'Purchase' },
        turAdiKavurma:{ tr: 'Kavurma',                 en: 'Roast' },
        turAdiSatis: { tr: 'Satış',                    en: 'Sale' },
        turAdiZayi:  { tr: 'Zayi',                     en: 'Loss' },
        /* "bilinmiyor" -- fiyat girilmemisse. "0,00" YAZMIYORUZ:
           sifir da bir yalandir ve toplama girer. */
        bilinmiyor:  { tr: 'bilinmiyor',               en: 'unknown' },
        kilosu:      { tr: 'kilosu {0}',               en: '{0} per kilo' },
        fireYuzde:   { tr: 'fire %{0}',                en: 'loss {0}%' },
        silDugme:    { tr: 'sil',                      en: 'delete' },
        hareketSilOnay:{ tr: 'Bu hareket silinsin mi? Depo yeniden hesaplanacak.',
                         en: 'Delete this movement? The store will be recalculated.' },
        hareketSilindi:{ tr: 'Hareket silindi.',       en: 'Movement deleted.' },
        partiKaydedildi:{ tr: 'Parti deftere kaydedildi.',
                          en: 'Batch saved to the log.' },
        partiSilOnay:{ tr: 'Bu parti silinsin mi?',    en: 'Delete this batch?' },
        partiSilindi:{ tr: 'Parti silindi.',           en: 'Batch deleted.' },
        ortalamaFire:{ tr: '{0} partide ortalama fireniz',
                       en: 'your average loss over {0} batches' },
        oynama:      { tr: 'oynama',                   en: 'spread' },
        /* HARMAN MALIYETI. Fiyati girilmemis bilesen SIFIR sayilmaz;
           hesap yapilmaz ve hangi cekirdegin eksik oldugu yazilir. */
        bFiyatEt:    { tr: 'Yeşil fiyatı',             en: 'Green price' },
        harmanMaliyetBaslik:{ tr: 'Bu harmanın kilo maliyeti',
                              en: 'Cost per kilo of this blend' },
        harmanYesilOrt:{ tr: 'yeşil ortalaması',       en: 'green average' },
        harmanFiyatEksik:{ tr: 'Kilo maliyeti için şunların yeşil fiyatı gerekiyor: {0}',
                           en: 'To get the cost per kilo, these still need a green price: {0}' },
        /* SATIS ANALIZI. "Onerilen fiyat" diye bir sey YAZMIYORUZ --
           oneri, olculmemis bir sayidir ve kullanici onu hesap sanir. */
        mSatisEt:    { tr: 'Satış fiyatım',            en: 'My selling price' },
        mSatisAlt:   { tr: '— isteğe bağlı',           en: '— optional' },
        yer750:      { tr: '750',                      en: '750' },
        satisKar:    { tr: 'kilo başına kârınız',      en: 'your profit per kilo' },
        satisZarar:  { tr: 'kilo başına ZARARINIZ',    en: 'your LOSS per kilo' },
        ciftMarj:    { tr: 'Kâr marjı (satışın yüzdesi)',
                       en: 'Margin (share of the selling price)' },
        ciftMarkup:  { tr: 'Kâr oranı (maliyetin üstüne)',
                       en: 'Markup (added on top of cost)' },
        ciftBasabas: { tr: 'Başabaş fiyat',            en: 'Break-even price' },
        satisZararNot:{ tr: 'Bu fiyat maliyetinizin altında. Başabaş için en az {0} gerekiyor.',
                        en: 'This price is below your cost. You need at least {0} to break even.' },
        /* Bozuk kayit sessizce atilmaz; kac tanesi atildigi yazilir. */
        kayitAtlandi:{ tr: '{0} kayıt okunamadı, hesaba katılmadı.',
                       en: '{0} records could not be read and were left out.' },
        kayitAtlandiTek:{ tr: '1 kayıt okunamadı, hesaba katılmadı.',
                          en: '1 record could not be read and was left out.' },
        /* FIRE SEKMESINDEKI "KENDI GECMISIN" KUTUSU.
           Butun sayilar kullanicinin defterinden turer; defter bossa
           sayi uretilmez, sebebi yazilir. */
        gecmisBaslik:{ tr: 'Kendi geçmişiniz',        en: 'Your own history' },
        gecmisYok:   { tr: 'Deftere henüz parti kaydetmediniz. Ölçüp kaydettikçe kendi ortalamanız burada çıkacak.',
                       en: 'You have not saved a batch to the log yet. As you measure and save, your own average will appear here.' },
        gecmisOrt:   { tr: '{0} partide ortalamanız',  en: 'your average over {0} batches' },
        gecmisTek:   { tr: '1 partilik kaydınız',      en: 'from your 1 saved batch' },
        /* DIKKAT: asagidaki UC anahtar arayuz.js'te DEGISKENLE
           cagriliyor (`T(notAnahtar, ...)`). CEVIRI-DENETLE.py
           yalnizca duz yazilmis anahtari gorur ve bu ucunu
           "kullanilmiyor" diye listeler. KULLANILIYORLAR --
           silmeyin. Ayni durum kiyas* anahtarlarinda da var. */
        gecmisUstunde:{ tr: 'Bu ölçüm ortalamanızın <b>{0} puan üstünde</b>.',
                        en: 'This one is <b>{0} points above</b> your average.' },
        gecmisAltinda:{ tr: 'Bu ölçüm ortalamanızın <b>{0} puan altında</b>.',
                        en: 'This one is <b>{0} points below</b> your average.' },
        gecmisAyni:  { tr: 'Bu ölçüm ortalamanızla <b>aynı</b>.',
                       en: 'This one is <b>the same</b> as your average.' },
        /* PARTI KIYASLAMA -- kullanicinin KENDI gecmisine gore.

           DIKKAT: kiyasOlagan / kiyasYuksek / kiyasDusuk anahtarlari
           arayuz.js'te DEGISKENLE cagriliyor (`T(anahtar, ...)`).
           CEVIRI-DENETLE.py yalnizca duz yazilmis anahtari gorur, bu
           ucunu "kullanilmiyor" diye listeler. KULLANILIYORLAR --
           silmeyin. Araci genisletmek yerine buraya not dusuyorum:
           arac genisletildiginde 49 yalan "eksik anahtar" uretmisti.
           Hicbir cumlede "ideal fire" yok; olcut kullanicinin kendi
           ortalamasi. Sayilar disaridan bicimli gecirilir ki yuzde
           isareti dogru yana dussun (Turkce %15,0 · Ingilizce 15.0%). */
        kiyasOlagan: { tr: '{0} önceki partiye göre olağan · ort. {1}',
                       en: 'usual for your {0} earlier batches · avg {1}' },
        kiyasYuksek: { tr: '{0} önceki partiye göre YÜKSEK · ort. {1}',
                       en: 'HIGH vs your {0} earlier batches · avg {1}' },
        kiyasDusuk:  { tr: '{0} önceki partiye göre DÜŞÜK · ort. {1}',
                       en: 'LOW vs your {0} earlier batches · avg {1}' },
        kiyasAralik: { tr: 'aralık {0} – {1}',         en: 'range {0} – {1}' },
        /* INGILIZCEDE COGUL EKI VAR, TURKCEDE YOK. Tek bir metne
           "{1} batches" yazarsak "over 1 batches" cikar -- ekranda
           olculdu. Iki ayri anahtar, sayiya gore secilir. */
        kiyasDtr:    { tr: 'gelişim ort. {0} ({1} partide)',
                       en: 'avg development {0} (over {1} batches)' },
        kiyasDtrTek: { tr: 'gelişim ort. {0} (1 partide)',
                       en: 'avg development {0} (over 1 batch)' },
        kiyasAz:     { tr: 'Kıyas için aynı çekirdek ve derecede en az 2 önceki parti gerekiyor ({0} var).',
                       en: 'Comparison needs at least 2 earlier batches of the same bean and roast ({0} found).' },
        kiyasKunye:  { tr: 'Menşe ve kavurma derecesini yazarsanız bu partiyi öncekilerle kıyaslayabiliriz.',
                       en: 'Add the origin and roast level and we can compare this batch with earlier ones.' },
        puan:        { tr: '{0} puan',                 en: '{0} points' },
        duyurDemleme:{ tr: '{0} gram kahve gerekiyor.',
                       en: '{0} grams of coffee needed.' },
        /* Renk ADLARI cevrilir; renk KODU ('kiraz') sabittir ve diske
           o yazilir. Ad yazilsaydi dil degisince secili renk kaybolurdu. */
        renkKahve:   { tr: 'Kahve',                    en: 'Coffee' },
        renkKiraz:   { tr: 'Kiraz',                    en: 'Cherry' },
        renkYesil:   { tr: 'Yeşil',                    en: 'Green' },
        renkOkyanus: { tr: 'Okyanus',                  en: 'Ocean' },
        renkMor:     { tr: 'Mor',                      en: 'Purple' },
        renkEtiket:  { tr: '{0} rengi',                en: '{0} colour' },
        etiketGiren: { tr: 'giren',                    en: 'in' },
        etiketCikan: { tr: 'çıkan',                    en: 'out' },
        dilDegisti:  { tr: 'Dil Türkçe olarak ayarlandı.',
                       en: 'Language set to English.' },

        /* ---- kavurma makinesi çizimi ---- */
        makineBaslik:{ tr: 'Kavurma makinesi',        en: 'Coffee roaster' },
        makineOzet:  { tr: 'Huniye {0} yeşil girdi, tepsiye {1} kavrulmuş çıktı; aradaki {2} buharlaştı.',
                       en: '{0} of green went into the hopper, {1} of roasted came out to the tray; the {2} between them evaporated.' },

        /* ---- 3D makine sekmesi ---- */
        tMakine:     { tr: 'Makine',                  en: 'Roaster' },
        makineSekmeBaslik: { tr: 'Kavurma makinesi',  en: 'The roaster' },
        makineTut:        { tr: 'Parçalara dokunun', en: 'Tap the parts' },
        makine3dYukleniyor:{ tr: '3B makine yükleniyor…', en: 'Loading the 3D machine…' },
        makine3dOlmadi:   { tr: '3B açılamadı — fotoğrafın üzerinden devam edebilirsiniz.',
                            en: 'The 3D view could not start — you can keep using the photo.' },
        makineFotoAlt:    { tr: 'Tamburlu kahve kavurma makinesi: üstte hazne, ortada tambur kapağı, önde soğutma teknesi.',
                            en: 'Drum coffee roaster: hopper on top, drum door in the middle, cooling tray in front.' },
        makineTepsi:      { tr: 'Soğutma teknesi — dokununca ne kadar kahve çıktığını söyler',
                            en: 'Cooling tray — tap to see how much coffee came out' },
        makDurTepsiBos:   { tr: 'Tepse henüz boş. Önce kavurun, sonra boşaltın.',
                            en: 'The tray is still empty. Roast first, then discharge.' },
        makineHazneKol:   { tr: 'Hazne kolu — çekince kapak açılır, çekirdek tambura dökülür',
                            en: 'Hopper lever — pull to open the gate and drop the beans into the drum' },
        makineKasik:      { tr: 'Kontrol kaşığı — çekince o anki çekirdek görünür',
                            en: 'Trier — pull it out to see the beans right now' },
        makineBosaltKol:  { tr: 'Boşaltma kolu — aşağı çekince kahve soğutma teknesine dökülür',
                            en: 'Discharge lever — pull down to drop the coffee into the cooling tray' },
        makineEtHazne:    { tr: 'Hazne',              en: 'Hopper' },
        makineEtHazneKol: { tr: 'Hazne kolu \u25b8 ÇEK',  en: 'Hopper lever \u25b8 PULL' },
        makineEtTambur:   { tr: 'Tambur',             en: 'Drum' },
        makineEtPanel:    { tr: 'Ekran',             en: 'Display' },
        makineEtBosalt:   { tr: 'Boşaltma kolu \u25b8 ÇEK', en: 'Discharge lever \u25b8 PULL' },
        makineEtKasik:    { tr: 'Kontrol kaşığı \u25b8 ÇEK', en: 'Trier \u25b8 PULL' },
        makineEtTepsi:    { tr: 'Soğutma teknesi',   en: 'Cooling tray' },
        makineEtSiklon:   { tr: 'Baca — kabuk',      en: 'Stack — chaff' },
        makineEtGaz:      { tr: 'Brulör',            en: 'Burner' },
        makDurHazir:      { tr: 'Hazne dolu. Ölçtüğünüz fire {0}. Turuncu kollardan birini tutup çekin.',
                            en: 'Hopper loaded. Your measured loss is {0}. Grab one of the orange levers and pull.' },
        makDurOlcumYok:   { tr: 'Henüz fire ölçmediniz — makine çalışır ama kiloları uydurmaz. Fire sekmesini doldurun.',
                            en: 'You have not measured a roast yet — the machine works but will not invent kilos. Fill in the Loss tab.' },
        makDurDokuluyor:  { tr: 'Kapak açıldı — {0} yeşil çekirdek tambura dökülüyor.',
                            en: 'Gate open — {0} of green coffee is dropping into the drum.' },
        makDurDokulOlcumsuz:{ tr: 'Kapak açıldı — çekirdek dökülüyor. (Kilo yazılmıyor çünkü henüz ölçmediğiniz.)',
                            en: 'Gate open — beans are dropping. (No weight shown: you have not measured one yet.)' },
        makDurSarjTamam:  { tr: 'Şarj tamam. Tambur dönüyor, alev açık. Şimdi kontrol kaşığını çekin.',
                            en: 'Charged. The drum is turning and the flame is on. Now pull the trier.' },
        makDurOnceSarj:   { tr: 'Tambur boş. Önce hazne kolunu çekin.',
                            en: 'The drum is empty. Pull the hopper lever first.' },
        makDurKasik:      { tr: 'Kaşıktaki renk, ölçtüğünüz {0} fireye karşılık gelen renktir.',
                            en: 'The colour on the trier is the one matching your measured {0} loss.' },
        makDurKasikOlcumsuz:{ tr: 'Kaşık boş görünüyor — renk ancak ölçtüğünüz fireden gelir, uydurulmaz.',
                            en: 'The trier looks empty — the colour can only come from a loss you measured.' },
        makDurKasikGirdi: { tr: 'Kaşık yerine girdi.', en: 'Trier back in.' },
        makDurBosaliyor:  { tr: 'Oluk açıldı — kahve soğutma teknesine akıyor, kollar dönüyor.',
                            en: 'Chute open — the coffee is flowing into the cooling tray, the arms are turning.' },
        makDurBosaldi:    { tr: 'Tepside {0} kavrulmuş kahve. Siklonda {1} kabuk ve nem.',
                            en: '{0} of roasted coffee in the tray. {1} of chaff and moisture in the cyclone.' },
        makDurBosaldiOlcumsuz:{ tr: 'Boşaltıldı. Kiloları yazmak için Fire sekmesinde giren ve çıkan kiloyu doldurun.',
                            en: 'Discharged. Fill in the green and roasted weights on the Loss tab to see the kilos.' },
        makineSekmeAciklama: { tr: 'Makinenin parçalarına dokunun: hazne, kontrol kaşığı, boşaltma kolu, soğutma teknesi. Tamburdaki renk, Fire sekmesinde ölçtüğünüz fireden gelir — ölçmediğinizde yeşil kalır.',
                              en: 'Tap the parts of the machine: hopper, trier, discharge lever, cooling tray. The colour in the drum comes from the loss you measured on the Loss tab — it stays green until you measure one.' },
        makineSurukle: { tr: 'Sürükleyerek çevir, ok tuşlarıyla da döner',
                         en: 'Drag to turn; arrow keys work too' },
        makineDon:   { tr: 'Döndür',                  en: 'Turn' },
        makineSifirla:{ tr: 'Baştan',                 en: 'Reset view' },
        makine3dOlculdu: { tr: 'Tamburdaki renk sizin ölçtüğünüz {0} fireye göre.',
                           en: 'The colour in the drum reflects the {0} loss you measured.' },
        makine3dOlculmedi: { tr: 'Henüz fire ölçmediniz — tambur yeşil kahve renginde duruyor. Fire sekmesinde tartınızı girin, burası da değişsin.',
                             en: 'You have not measured a roast loss yet — the drum stays the colour of green coffee. Enter your weights on the Roast loss tab and this will follow.' },
        makineParcaBaslik: { tr: 'Parçalar ne işe yarar', en: 'What the parts do' },
        parcaHuni:   { tr: 'Huni',                    en: 'Hopper' },
        parcaHuniAcik:{ tr: 'Yeşil kahve buraya dökülür — "Giren yeşil"',
                        en: 'Green coffee goes in here — "Green in"' },
        parcaTambur: { tr: 'Tambur',                  en: 'Drum' },
        parcaTamburAcik:{ tr: 'Çekirdek burada döner ve kavrulur; nem atar, ağırlık kaybeder',
                          en: 'The beans turn and roast here; they lose moisture and weight' },
        parcaTepsi:  { tr: 'Soğutma tepsisi',         en: 'Cooling tray' },
        parcaTepsiAcik:{ tr: 'Kavrulan kahve buraya boşalır — "Çıkan kavrulmuş"',
                         en: 'The roasted coffee drops here — "Roasted out"' },
        parcaPanel:  { tr: 'Kumanda paneli',          en: 'Control panel' },
        parcaPanelAcik:{ tr: 'Sıcaklık ve süre; Defter sekmesine yazdığınız çıkış sıcaklığı burada görünür',
                         en: 'Temperature and time; the drop temperature you record on the Log tab shows here' },
        parcaKavuz:  { tr: 'Kavuz haznesi',           en: 'Chaff collector' },
        parcaKavuzAcik:{ tr: 'Çekirdeğin kabuğu buraya toplanır — kaybolan ağırlığın bir kısmı',
                         en: 'The bean skins collect here — part of the weight you lose' },

        /* ---- yer tutucular ----
           Sayilar ayni; degisen 'orn.' ve ONDALIK AYRACI.
           Ingilizce arayuzde 'orn. 8,5' birakmak, kullaniciya
           yanlis bicimde yazmasini SOYLEMEK olurdu. */
        yer10:       { tr: 'örn. 10', en: 'e.g. 10' },
        yer100:      { tr: 'örn. 100', en: 'e.g. 100' },
        yer12:       { tr: 'örn. 12', en: 'e.g. 12' },
        yer15:       { tr: 'örn. 15', en: 'e.g. 15' },
        yer195:      { tr: 'örn. 195', en: 'e.g. 195' },
        yer212:      { tr: 'örn. 212', en: 'e.g. 212' },
        yer250:      { tr: 'örn. 250', en: 'e.g. 250' },
        yer5:        { tr: 'örn. 5', en: 'e.g. 5' },
        yer500:      { tr: 'örn. 500', en: 'e.g. 500' },
        yer60:       { tr: 'örn. 60', en: 'e.g. 60' },
        yer7:        { tr: 'örn. 7', en: 'e.g. 7' },
        yer85:       { tr: 'örn. 8,5', en: 'e.g. 8.5' },

        /* ---- kurulum daveti (ortak modul, metni disaridan alir) ---- */
        kurBaslik:   { tr: 'Uygulama olarak kur',     en: 'Install as an app' },
        kurMetin:    { tr: 'Ana ekranına ekle, internetsiz de çalışsın',
                       en: 'Add it to your home screen — works offline too' },
        kurKapi:     { tr: '📲 Uygulama olarak kur',  en: '📲 Install as an app' },
        kurBtn:      { tr: 'Kur',                     en: 'Install' },
        kurSonra:    { tr: 'Şimdi değil',             en: 'Not now' },
        kurNasil:    { tr: 'Nasıl?',                  en: 'How?' },
        kurIos:      { tr: 'Safari’de paylaş düğmesine (kutudan çıkan ok) dokunun, sonra “Ana Ekrana Ekle” deyin.',
                       en: 'In Safari, tap the share button (the box with an arrow), then choose “Add to Home Screen”.' },
        kurDiger:    { tr: 'Tarayıcı menüsünü açın ve “Uygulamayı yükle” ya da “Ana ekrana ekle” seçeneğini seçin.',
                       en: 'Open the browser menu and choose “Install app” or “Add to Home screen”.' },
    };

    /* ================= MOTOR ================= */

    var ETKIN = 'tr';

    function diskten(anahtar) {
        try { return localStorage.getItem(anahtar); } catch (e) { return null; }
    }
    function diske(anahtar, deger) {
        try { localStorage.setItem(anahtar, deger); return true; } catch (e) { return false; }
    }

    /** Kullanıcının SEÇİMİ yoksa tarayıcının diline bakılır.
        TÜRETİLEN DEĞER DİSKE YAZILMAZ -- yazsaydık ilk açılışta donar,
        kullanıcı tarayıcı dilini değiştirse bile bir daha dinlenmezdi.
        (Tema için de aynı kural uygulanıyor; index.html başındaki
        betiğe bakın.) */
    function ilkDil() {
        var secim = diskten(ANAHTAR_DIL);
        if (secim === 'tr' || secim === 'en') return secim;
        var t = (global.navigator && (navigator.language || navigator.userLanguage)) || 'tr';
        return String(t).toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en';
    }

    function oku() { return ETKIN; }

    /** Etkin dilin sayı yereli. Sayfada GÖRÜNEN her sayı bundan geçer.
        Sabit 'tr-TR' bırakılsaydı İngilizce arayüzde 1.500,50 yazardı;
        kullanıcı 1,5 sanabilirdi. */
    function yerel() { return ETKIN === 'en' ? 'en-US' : 'tr-TR'; }

    /** Etkin para birimi kodu. Seçim yoksa DİLDEN türetilir ve
        türetilmiş değer diske YAZILMAZ. */
    function paraKodu() {
        var secim = diskten(ANAHTAR_PARA);
        if (secim && PARALAR[secim]) return secim;
        return ETKIN === 'en' ? 'USD' : 'TL';
    }
    function paraSimge() { return PARALAR[paraKodu()].simge; }

    /** Biçimlenmiş sayıya para birimini DOĞRU YANDAN ekler. */
    function paraYaz(bicimliSayi) {
        var p = PARALAR[paraKodu()];
        return p.once ? p.simge + bicimliSayi : bicimliSayi + ' ' + p.simge;
    }

    function paraAyarla(kod) {
        if (!PARALAR[kod]) return false;
        diske(ANAHTAR_PARA, kod);
        return true;
    }

    /** Çeviri. `{0}`, `{1}` ... yerine sırayla argümanlar konur.

        ANAHTAR BULUNAMAZSA anahtarın KENDİSİ döner, boş dize değil.
        Boş dönseydi ekranda boşluk olurdu ve eksik çeviri GÖRÜNMEZDİ --
        tam da sessiz kusur. Anahtar adı görününce hemen fark edilir. */
    function T(anahtar) {
        var girdi = S[anahtar];
        var metin = girdi ? (girdi[ETKIN] || girdi.tr) : anahtar;
        if (arguments.length > 1) {
            var yerler = Array.prototype.slice.call(arguments, 1);
            metin = metin.replace(/\{(\d+)\}/g, function (tam, n) {
                return yerler[+n] === undefined ? tam : yerler[+n];
            });
        }
        return metin;
    }

    /** Sayfadaki duran metinleri çevirir.

        Dört öznitelik:
          data-i18n        -> textContent
          data-i18n-html   -> innerHTML  (içinde <strong> geçenler)
          data-i18n-yer    -> placeholder
          data-i18n-baslik -> title + aria-label

        `innerHTML` YALNIZ sözlükten gelen metne uygulanır; kullanıcı
        girdisi buraya hiç uğramaz. */
    function uygula(kok) {
        kok = kok || document;
        kok.querySelectorAll('[data-i18n]').forEach(function (o) {
            o.textContent = T(o.getAttribute('data-i18n'));
        });
        kok.querySelectorAll('[data-i18n-html]').forEach(function (o) {
            o.innerHTML = T(o.getAttribute('data-i18n-html'));
        });
        kok.querySelectorAll('[data-i18n-yer]').forEach(function (o) {
            o.setAttribute('placeholder', T(o.getAttribute('data-i18n-yer')));
        });
        kok.querySelectorAll('[data-i18n-baslik]').forEach(function (o) {
            var m = T(o.getAttribute('data-i18n-baslik'));
            o.setAttribute('title', m);
            o.setAttribute('aria-label', m);
        });
    }

    /** Dili değiştirir. ÜÇ YERE birden bildirir:
          1. `<html lang>`  -- ekran okuyucu doğru sesle okusun.
          2. `C.dilAyarla`  -- sayı OKUMA kuralı değişsin ("1,500").
          3. dinleyiciler   -- arayüz kendini yeniden çizsin.
        Biri atlanırsa arayüz İngilizce görünür ama sayıyı Türkçe
        okur; kullanıcı 1500 yazar, uygulama 1,5 anlar. Sessiz ve
        BİN KAT hata. */
    var dinleyiciler = [];
    function ayarla(d, kaydet) {
        ETKIN = (d === 'en') ? 'en' : 'tr';
        if (kaydet !== false) diske(ANAHTAR_DIL, ETKIN);
        try { document.documentElement.setAttribute('lang', ETKIN); } catch (e) {}
        if (global.C && global.C.dilAyarla) global.C.dilAyarla(ETKIN);
        try { uygula(); } catch (e) {}
        dinleyiciler.forEach(function (f) { try { f(ETKIN); } catch (e) {} });
        return ETKIN;
    }

    function dinle(f) { if (typeof f === 'function') dinleyiciler.push(f); }

    /** Açılışta çağrılır. Seçim yoksa tarayıcıdan türetir ve
        TÜRETİLMİŞ DEĞERİ DİSKE YAZMAZ (`kaydet: false`). */
    function baslat() {
        var secim = diskten(ANAHTAR_DIL);
        ayarla(ilkDil(), secim === 'tr' || secim === 'en');
    }

    global.Dil = {
        S: S,
        T: T,
        oku: oku,
        ayarla: ayarla,
        baslat: baslat,
        uygula: uygula,
        dinle: dinle,
        yerel: yerel,
        PARALAR: PARALAR,
        paraKodu: paraKodu,
        paraSimge: paraSimge,
        paraYaz: paraYaz,
        paraAyarla: paraAyarla
    };

    /* KENDINI HEMEN KURAR. Betik <body> sonunda yuklendigi icin DOM
       hazirdir. Boylece bu satirdan sonraki HER sey -- arayuz.js de,
       index.html'in sonundaki satir ici betikler de -- dogru dilde
       calisir. `baslat()` yeniden cagrilabilir; ikinci cagri zararsizdir. */
    try { baslat(); } catch (e) {}
})(typeof window !== 'undefined' ? window : this);
