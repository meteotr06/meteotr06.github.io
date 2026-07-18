# Türkiye Hava Durumu

Türkiye'nin 81 ili için **saat saat** ve **7 günlük** hava durumu gösteren,
haritalı bir Windows masaüstü uygulaması. Sıcaklık, **nem, rüzgâr, yağış**,
ayrıca **UV indeksi ve gün doğumu/batımı** bilgilerini verir; yarının havasını
**bildirim** olarak da gönderebilir.

![Uygulama](kaynak/simge_onizleme.png)

## Özellikler

**Hava verisi**
- 🏘️ **81 il + 957 ilçe** — listeden seç ya da yazarak ara
- 🗺️ Kaydırılabilir **Türkiye haritası** — tıkladığın yerin **ilçesi** bulunur
- 🔎 **Yer arama** — listede olmayan kasaba/mahalle için de arama (yaz + Enter)
- ⏱️ **Saat saat** tahmin (nem · rüzgâr · yağış) + **7 günlük** tahmin
- 📈 **24 saatlik sıcaklık grafiği** (yağış olasılığı çubuklarıyla)
- ☀️ UV indeksi, gün doğumu/batımı, **hissedilen** sıcaklık
- 🧭 **Detaylar**: basınç, görüş, çiy noktası, rüzgâr hamlesi, bulut örtüsü, ay evresi
- 🌫️ **Hava kalitesi (AQI)** + polen bilgisi
- 🌧️ "**Yağmur ne zaman başlıyor**" (15 dakika çözünürlük)
- 📊 **Model karşılaştırma** (ECMWF · GFS · ICON — 3'ü yakınsa tahmin daha güvenilir)

**Harita katmanları**
- 🛰️ **Uydu** görünümü (Normal ↔ Uydu)
- 🌩️ **Yağış radarı** — haritada canlı yağmur/kar bulutları (RainViewer)

**Bildirimler ve uyarılar** (Windows bildirimi olarak)
- 🌅 Her sabah **yarının özeti**
- ☔ **Yağmur başlamadan** uyarı
- ⚠️ **Şiddetli hava** uyarısı (fırtına / aşırı sıcak / don)

**Kişiselleştirme**
- ⭐ **Favori iller** (yıldıza tıkla)
- 🎨 **Tema**: Koyu / Açık / Sisteme göre otomatik
- 🔢 **Sistem tepsisinde** anlık sıcaklık
- 🚀 **Windows açılışında** otomatik başlatma

## İlk açılış

Uygulamayı ilk açtığınızda **"Hangi bölgeyi takip edelim?"** penceresi gelir.
Burada **il + ilçe**, bildirim saati ve uyarıları seçersiniz. Seçtiğiniz yer:

- ⭐ favoriniz olur (açılışta o gelir),
- 🌅 **her sabah** o bölgenin havası bildirim olarak gönderilir.

Sonradan değiştirmek için: **Ayarlar → "Takip edilen bölgeyi değiştir"**.

## Nasıl çalıştırılır?

`Hava Durumu.exe` dosyasına **çift tıklayın**. Python'un kurulu olmasına gerek
yok — her şey exe'nin içinde. Başka bir bilgisayara kopyalasanız da çalışır.

> **Not:** Hesap Makinesi'nin aksine bu uygulama **internet ister.** Sebebi:
> hem hava verisi hem de harita internetten gelir. İnternet yoksa "İnternet/veri
> hatası" yazar.

Masaüstüne kısayol için: `Hava Durumu.exe` üzerine sağ tık → **Kısayol oluştur**
→ çıkan kısayolu masaüstüne taşıyın. (Ya da exe'nin kendisini masaüstüne
kopyalayın.)

## Kullanım

- **İl seçme:** Sol üstteki kutuya il adını yazın veya listeden seçin.
  Yazdıkça liste süzülür (örneğin "an" yazınca Ankara, Antalya... görünür).
- **Haritadan seçme:** Haritada herhangi bir yere tıklayın; oranın havası gelir
  ve en yakın ilin adı yazılır.
- **Üst kart** "şu an"ı gösterir. **Alttaki liste** önümüzdeki ~24 saati
  saat saat gösterir; "Şimdi" satırı mavi ile işaretlidir.

## Yarın bildirimi 🔔

"Yarın" panelinde seçili yerin **ertesi gün** özeti görünür (en düşük/en yüksek
sıcaklık, durum, yağış ihtimali).

- **Yarını bildir:** Hemen bir Windows bildirimi gönderir (denemek için).
- **Her sabah:** Saati seçip **Kur**'a basın. Her sabah o saatte, bilgisayar
  seçtiğiniz yerin yarınki havasını **kendiliğinden bildirir** — uygulamayı
  açmanıza gerek yok. Kapatmak için aynı düğme (**Kapat**) kullanılır.

> Nasıl çalışır? "Kur" dediğinizde Windows **Görev Zamanlayıcı**'ya günlük bir
> görev eklenir; bu görev her sabah programı sessizce (pencere açmadan)
> çalıştırıp bildirimi gösterir. Yönetici izni gerekmez.
>
> **Not:** Tam ekran video/oyun sırasında Windows "Rahatsız Etme"yi açar ve
> bildirimi *Bildirim Merkezi*'ne (saate tıklayınca açılır) düşürür.
>
> **SMS** henüz yok: SMS ücretli bir servis (Netgsm, Twilio vb.) ve hesap
> gerektirir. İstenirse sonradan eklenebilir.

## Veri nereden geliyor? (Bilimsel taraf)

Hava verisi **[Open-Meteo](https://open-meteo.com)** servisinden gelir. Bu servis
ulusal meteoroloji kurumlarının **bilimsel tahmin modellerini** (ICON, GFS,
ECMWF gibi) birleştirir. Yani ciddi hava tahmin sistemleriyle aynı kaynakları
kullanır. Ücretsizdir ve şifre/anahtar istemez.

Hava kodları **Dünya Meteoroloji Örgütü (WMO)** standardındadır; `hava_cekirdek.py`
içinde Türkçe karşılıklarına çevrilir.

## 📱 Telefon sürümü (mobil)

`mobil/` klasöründe, telefonda çalışan bir sürüm var — **aynı veri kaynağı,
aynı 81 il + 957 ilçe**. Kurulum gerektirmez, tarayıcıda çalışır.

Üç kullanım yolu:

1. **En kolay — TEK DOSYA:** Ana klasördeki **`Hava Durumu (telefon).html`**
   dosyasını telefona gönderin (WhatsApp, e-posta, kablo) ve açın. Bu dosyanın
   içine 957 ilçe verisi gömülüdür, **başka hiçbir dosyaya ihtiyacı yoktur**.
   *(Bu dosyayı `kaynak/tek_dosya_uret.py` üretir; mobil sürümü değiştirince
   yeniden çalıştırın.)*
2. **Ana ekrana eklemek için (önerilen):** `mobil` klasörünü ücretsiz bir yere
   yayınlayın (ör. GitHub Pages). Telefonda açıp **"Ana ekrana ekle"** deyin —
   normal bir uygulama gibi simgesiyle durur ve **internetsiz de açılır**
   (veriyi çekmek için elbette internet gerekir).
3. **Bilgisayarda denemek:** `mobil/index.html` dosyasına çift tıklayın.

**Mobil sürümde neler var:** güncel hava · **saatlik** (nem · yağış, yatay
kaydırmalı) · **sıcaklık grafiği** · 7 günlük · **hava kalitesi + polen** ·
**detaylar** (basınç, görüş, çiy noktası, hamle, bulut, ay evresi) ·
**model karşılaştırma** · "**yağmur ne zaman başlıyor**" · **harita + yağış
radarı** · il/ilçe **arama** · **📍 konumumu kullan** · **havaya göre değişen
arka plan** · koyu/açık tema (telefonunuza göre) · son bakılan yeri hatırlama.

> Harita **isteğe bağlı** yüklenir ("Haritayı göster" düğmesi). Böylece
> uygulama hızlı açılır, telefonu yormaz.

## Klasörler

```
02 Hava Dururmu/
├── Hava Durumu.exe        <- Program. Çift tıkla, açılır.
│
└── kaynak/                <- Kaynak kodu (programın "tarifi")
    ├── sehirler.py           81 il + arama/eşleştirme yardımcıları
    ├── ilceler.py            957 ilçe (OTOMATİK üretildi, elle düzenlemeyin)
    ├── hava_cekirdek.py      İnternetten veriyi çeken MOTOR (arayüzsüz)
    ├── bildirim.py           Windows bildirimi gösterir (arayüzsüz)
    ├── hava_durumu.py        Pencere + HARİTA + 7 günlük (arayüz)
    ├── simge_olustur.py      Simgeyi (logoyu) çizen betik
    ├── hava_durumu.ico       exe'nin simgesi
    ├── simge_onizleme.png    Simgenin büyük hâli (göz kararı)
    ├── simge_olustur.py      TÜM simgeleri çizer (masaüstü + mobil)
    └── derle.bat             Çift tıkla: exe'yi yeniden üretir

02 Hava Dururmu/
└── mobil/                 <- Telefon sürümü (HTML/PWA)
    ├── index.html            Uygulamanın tamamı (arayüz + mantık)
    ├── yerler.js             81 il + 957 ilçe (kaynak/'tan OTOMATİK üretilir)
    ├── manifest.json         "Ana ekrana ekle" bilgileri
    ├── sw.js                 Çevrimdışı açılmayı sağlar
    └── simge-*.png           Telefon simgeleri
```

### İş bölümü (neden üç ayrı dosya?)

Kod tek dosyada da yazılabilirdi ama **bilerek** üçe böldük. Her dosyanın tek
bir işi var; böylece bir şeyi değiştirmek gerekince nereye bakacağınız bellidir:

| Dosya | Tek işi | Değiştirmek isterseniz |
|---|---|---|
| `sehirler.py` | Hangi il nerede | Yeni bir ilçe/nokta eklemek |
| `hava_cekirdek.py` | İnternetten veri | Başka bir veri kaynağı, yeni bilgi (örn. UV) |
| `hava_durumu.py` | Pencere ve harita | Renkler, düzen, yeni buton |

Hesap Makinesi'nde de aynı mantık vardı: hesaplama (`hesap_cekirdek.py`) ile
arayüz (`hesap_makinesi.py`) ayrıydı. Aynı disiplin.

## Kodu değiştirdiysem ne yapmalıyım?

`kaynak\derle.bat` dosyasına **çift tıklayın.** Şunları otomatik yapar:
1. Gerekli paketleri (`tkintermapview`, `PyInstaller`) kontrol eder, yoksa kurar.
2. Simgeyi yeniler.
3. `.exe`'yi yeniden derler ve ana klasöre koyar.

Derleme, harita eklentileri yüzünden **birkaç dakika** sürebilir; normaldir.

## Geliştirici notları (meraklısına)

- **Arayüz:** Python + `tkinter` (Hesap Makinesi ile aynı). Harita için
  `tkintermapview` eklentisi kullanılır.
- **Donmayan pencere:** Veri internetten gelirken pencere donmaz. Çünkü veri
  çekme işi **ayrı bir iş parçacığında** yapılır; sonuç bir "kuyruğa" bırakılır,
  ana pencere kuyruğu 120 ms'de bir kontrol eder. tkinter'da arayüze yalnızca
  ana iş parçacığından dokunulabildiği için bu yöntem şarttır.
- **Hava ikonları** ekranda çizilir (hazır resim değil), `hava_durumu.py`
  içindeki `hava_ikonu()` fonksiyonuyla. Aynı fonksiyon hem büyük karttaki
  hem de saatlik satırdaki küçük ikonu çizer.

## Gerekenler (kaynaktan çalıştırmak için)

- Python 3.12+
- `pip install tkintermapview`  (haritayı ve gerekli her şeyi getirir)

Sadece `.exe`'yi kullanacaksanız bunlara gerek yok.
