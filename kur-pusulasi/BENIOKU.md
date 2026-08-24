# 💱 Kur Pusulası

Döviz, altın ve ekonomi takibi + **yarın / 1 hafta / 1 ay** için istatistiksel tahmin.
Telefon ve bilgisayarda çalışır, internet yokken son veriyle açılır.

---

## Nasıl çalıştırılır?

**Bilgisayarda:** `BASLAT.bat` dosyasına çift tıklayın. Tarayıcı kendiliğinden açılır.

**İnternete açmak için:** `YAYINLA.bat` dosyasına çift tıklayın. Dosyalar mevcut GitHub
sitenizin içine kopyalanır ve adres şu olur:
**https://meteotr06.github.io/kur-pusulasi/**

**Telefonda — 2 yol var:**

**A) Hemen, Wi-Fi ile (yayına gerek yok)**
`TELEFONDA AC.bat` dosyasına çift tıklayın. Pencerede telefona yazacağınız adres çıkar
(`http://192.168.1.22:8077` gibi) ve `KAREKOD-TELEFON.png` dosyası güncellenir —
telefonun kamerasıyla okutunca doğrudan açılır.
- Telefon **aynı Wi-Fi ağında** olmalı
- Bilgisayar **açık** ve o pencere **kapanmamış** olmalı
- Windows ilk seferde izin sorarsa "İzin Ver" deyin

**B) Her yerden (yayınlayarak)**
`YAYINLA.bat` → `https://meteotr06.github.io/kur-pusulasi/`
Bilgisayar kapalıyken de, başka şehirden de çalışır.

İki yolda da açılınca tarayıcı menüsünden **"Ana ekrana ekle"** deyin — normal bir
uygulama gibi simgesi çıkar ve çevrimdışı bile açılır.

### Telefonda nasıl çalışıyor?

Bu bir **PWA** (yüklenebilir web uygulaması). Play Store/App Store'a gerek yok:

| | Nasıl |
|---|---|
| **Kurulum** | Tarayıcı → "Ana ekrana ekle". Simge ana ekrana düşer, tam ekran açılır (adres çubuğu görünmez) |
| **Çevrimdışı** | `sw.js` dosyaları telefona kopyalar. Uçak modunda bile açılır; son çekilen kurları gösterir |
| **Veri** | İnternet varsa kurlar yenilenir, yoksa son kayıtlı veri kullanılır — ekranda "çevrimdışı" yazar |
| **Kayıtlar** | Portföy, alarm, ayarlar telefonun kendi hafızasında durur (sunucuya gitmez) |
| **Dokunma** | Sekmeler ekranın altında, tüm düğmeler en az 44 piksel |

---

## Ekran düzeni: sade önde, ayrıntı arkada

Açılışta sadece **ana para** (dolar) ve yanında 3 değer görünür. Uzun listeler ve
teknik kutular **katlanmış** durur; başlığına dokununca açılır. Böylece her gün
bakacağınız şey bir bakışta önünüzde, ayrıntı isteyince elinizin altında olur.

**Telefon ve bilgisayar düzeni farklıdır — sadece küçültülmüş bir kopya değil:**

| | 📱 Telefon | 💻 Bilgisayar |
|---|---|---|
| Sekmeler | ekranın **altında** sabit çubuk (başparmak rahat uzanır) | üstte hap şeklinde |
| Ana kart + takip listesi | alt alta, 3 mini kart | **yan yana**, sağda 6 kart alt alta |
| Formlar | tek sütun | 3 sütun |
| Varsayılan mod | Sade | Tam |

---

## 🎨 Görünüm ayarları

Üstteki **🎨** düğmesi iki şey sunar:

**Sade / Tam mod**
- **🌿 Sade**: 3 sekme (Piyasa, Tahmin, Faiz) ve sadece ana bilgiler.
  Telefonda tek bakışta biter.
- **🔬 Tam**: 5 sekme ve bütün araçlar — senaryolar, model karnesi, olasılık hesabı,
  reel getiri, kredi, ekonomi tablosu, portföy, alarmlar.

### ⚠️ Ayarlar bilgisayar ve telefon için AYRIDIR

Bilgisayarda **Tam**, telefonda **Sade** kullanabilirsiniz — birini değiştirmek diğerini
etkilemez. Renk seçimi de aynı şekilde ayrı tutulur. Ayar panelinin en üstünde
hangisini düzenlediğiniz yazar (💻 veya 📱).

Sınır **900 piksel**: altı telefon/tablet, üstü bilgisayar sayılır. Pencereyi
küçültünce ya da telefonu yan çevirince uygulama o cihazın kendi ayarına geçer.

**Varsayılanlar:** bilgisayarda Tam (geniş ekranda her şey sığar), telefonda Sade.

**Renk** — altı seçenek: Turkuaz (varsayılan), Okyanus, Orman, Gün batımı, Lavanta, Sade gri.
Renk hem vurguları hem koyu temadaki zemin tonunu değiştirir. Açık/koyu tema ayrı
düğmededir (🌙) ve renk seçimiyle birlikte çalışır.

Seçimleriniz cihazda saklanır, uygulamayı kapatıp açınca korunur.

---

## Telefon görünümünü bilgisayarda denemek

`_onizleme.html` dosyası uygulamayı 375×760 telefon çerçevesinde gösterir:

```
http://localhost:8077/_onizleme.html#mod=sade&renk=orman&tema=acik
```

`mod`, `renk`, `tema` ve `sekme` değerlerini değiştirerek farklı görünümleri
bilgisayardan kontrol edebilirsiniz. Bu dosya yayına gönderilmez.

| Sekme | Ne yapar |
|---|---|
| 📊 **Piyasa** | Ana para büyük kart + yarın/1 hafta/1 ay tahmini. Yanında 3 mini kart. "Tüm paralar" düğmesiyle 35 varlığın listesi açılır. **Bir karta dokununca o varlığın bütün verileri açılır.** |
| 🔮 **Tahmin** | Üç vadeli tahmin, olasılık bandı, grafik konisi ve **tek tuşla ekonomist analizi**. Katlanmış: senaryolar, yöntem, model karnesi, olasılık hesabı. |
| 💰 **Faiz** | Mevduat hesabı. Katlanmış: **"TL mevduat mı döviz mi" başabaş kuru**, reel getiri, kredi taksiti. |
| 🌍 **Ekonomi** | Politika faizleri (düzenlenebilir). Katlanmış: Türkiye makro göstergeleri, TL'nin 1 yıllık performansı, maden/kripto, **"nereye bakmalı" rehberi**. |
| 💼 **Portföy** | Varlık ekleyin: toplam değer, dağılım, kâr/zarar, 1 ay sonrası aralık. Ayrıca **fon takibi** ve **kur alarmları**. |

**Kısayol:** Adresin sonuna `#tahmin`, `#faiz`, `#ekonomi`, `#portfoy` ya da `#detay=USD`
yazarak doğrudan o ekranı açabilirsiniz.

---

## Kur alarmı

Portföy sekmesindeki **🔔 Kur alarmları** bölümünden ya da bir varlığın detay panelindeki
"Bu kura alarm kur" düğmesinden kurulur. Örnek: *"Dolar 50 ₺'nin üstüne çıkarsa haber ver."*

Uygulama her açıldığında kontrol edilir. Alarm çalarsa ana ekranın en üstünde uyarı çıkar;
bildirim izni verdiyseniz telefon bildirimi de gelir.

> Not: Tarayıcı uygulamaları kapalıyken sürekli fiyat kontrol edemez. Alarm, uygulamayı
> her açtığınızda kontrol edilir — arka planda dakika dakika değil.

---

## Faiz hatırlatıcısı

Tahminler TCMB politika faizini kullanır; faiz değişip de siz güncellemezseniz tahmin sapar.
Bu yüzden uygulama şu üç durumda ana ekranda uyarı gösterir:

1. Bir TCMB toplantısı geçmiş ama siz faizi güncellememişseniz
2. Toplantıya 10 günden az kalmışsa
3. Faizi 60 günden uzun süredir güncellememişseniz

Bilinen toplantı tarihi: **10 Eylül 2026**. Yenileri açıklanınca `arayuz.js` içindeki
`PPK_TARIHLERI` listesine eklenir.

---

## Fon / özel varlık takibi

Yatırım fonlarının (TEFAS) canlı fiyatı ücretsiz ve açık bir kaynaktan alınamıyor —
tarayıcıdan çağrılmasına izin veren bir uç nokta yok. Bu yüzden fonu **fiyatını siz girerek**
eklersiniz; portföy toplamına ve dağılıma katılır. Fiyat 2 haftadan eskiyse uygulama
ana ekranda hatırlatır. Fon fiyatı geçmişi olmadığı için tahmin hesabına katılmaz —
bu, portföy özetinde açıkça yazar.

---

## Tahmin nasıl yapılıyor?

Üç parçadan oluşur:

**1. Faiz paritesi.** Piyasada vadeli kur, faiz farkından hesaplanır. TL faizi %37,
dolar faizi %4 ise fark %33'tür; bu farkın kura yansıması "normal" kabul edilir.
Yoksa herkes TL'ye geçip risksiz kazanırdı — buna arbitraj denir ve piyasa buna izin vermez.

**2. Geçmiş trend.** Son 90 iş gününün ortalama günlük hareketi ileriye taşınır.

**3. Sapma düzeltmesi.** ⭐ Modeli geçmişteki her güne uyguladık ve gördük ki
faiz paritesi doları **sistematik olarak yüksek** tahmin ediyor. Bu bilinen bir olaydır
(finans literatüründe "forward premium sapması"). Merkezi bu sapma kadar geri çekiyoruz —
bu düzeltme, dolarda 1 aylık hatayı **%0,87'den %0,50'ye** indirdi.

**Band (olası aralık)** teoriden değil, **modelin geçmişteki gerçek hatalarından** üretilir.
Son 80 tahminin ne kadar tuttuğuna bakılır, %68 ve %95 dilimleri oradan çıkarılır.

---

## Model karnesi — iddia değil, ölçüm

Tahmin sekmesindeki karne, modeli geçmişteki ~280 gün üzerinde test eder.
Kıyas noktası "fiyat aynı kalır" varsayımıdır (buna *naive* denir; tahmin dünyasında
geçilmesi şaşırtıcı derecede zor bir eşiktir).

Ölçülen sonuçlar (13 Ağustos 2026 verisiyle):

| Varlık | Vade | Model hatası | Naive | Kazanç | Yön isabeti |
|---|---|---|---|---|---|
| Dolar | 1 ay | %0,50 | %1,48 | **+%66** | %99 |
| Dolar | 1 hafta | %0,21 | %0,38 | **+%45** | %90 |
| Euro | 1 ay | %1,79 | %2,16 | +%17 | %77 |
| Gram altın | 1 ay | %5,51 | %4,54 | **−%21** | %45 |

**Altında model kaybediyor.** Bu yüzden uygulama, beceri gösteremediği varlıklarda
kendiliğinden **"bugünkü fiyat" moduna** geçer ve bunu ekranda açıkça yazar.
Uydurma tahmin vermektense dürüst olmayı tercih ediyoruz.

---

## Veri kaynakları (hepsi ücretsiz, anahtarsız)

| Kaynak | Ne verir |
|---|---|
| **Frankfurter (Avrupa Merkez Bankası)** | 29 para biriminin 3 yıllık günlük kuru |
| **gold-api.com** | Anlık altın, gümüş, bitcoin fiyatı |
| **CoinGecko** | Altın (PAXG) ve bitcoinin 1 yıllık dolar geçmişi |
| **Dünya Bankası** | Türkiye enflasyon, büyüme, işsizlik, kişi başı gelir |
| **Elle girilir** | Politika faizleri — merkez bankası kararı değişince Ekonomi sekmesinden güncelleyin |

Kurlar **günlük referans kurudur**; bankaların alış/satış kuru bundan biraz farklı olur.

---

## ⚠️ Önemli uyarı

Buradaki tahminler geçmiş verilerden ve faiz farkından üretilen **istatistiksel hesaplardır**.
Kesin bilgi ya da **yatırım tavsiyesi değildir**. Kur; seçim, merkez bankası kararı,
jeopolitik olay gibi önceden bilinemeyen şeylerden etkilenir. Model bunları göremez.

Bu yüzden uygulama size tek bir sayı değil, **olasılık aralığı** verir. Aralığı ciddiye alın.

---

## Dosya düzeni

```
07 Kur Hesaplama/
├── index.html          arayüz iskeleti
├── stil.css            görünüm (koyu/açık tema)
├── cekirdek.js         MANTIK: veri çekme, tahmin, faiz, senaryo (arayüzsüz)
├── arayuz.js           ekran: sekmeler, grafikler, paneller
├── manifest.json       "ana ekrana ekle" bilgileri
├── sw.js               çevrimdışı çalışma
├── simge_olustur.py    simgeleri üretir (python simge_olustur.py)
├── surum_artir.py      önbellek sürümünü artırır (YAYINLA.bat kendisi çağırır)
├── ikon-*.png          uygulama simgeleri
├── BASLAT.bat          bilgisayarda çalıştırır
└── YAYINLA.bat         internete yayınlar
```

**Kural:** Hesap `cekirdek.js`'te, ekran `arayuz.js`'te. Karıştırmayın —
böylece hesabı bozmadan görünümü değiştirebilirsiniz.

---

Son güncelleme: 14 Ağustos 2026
