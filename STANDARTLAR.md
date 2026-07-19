# 📐 Proje Standartları

Bu dosya, birlikte belirlediğimiz **çalışma kurallarını ve teknik standartları**
kaydeder. Yeni projelerde bu dosyayı örnek alın; böylece her şey aynı düzende
ilerler.

Son güncelleme: 20 Temmuz 2026

---

## 1. Çalışma kuralları (nasıl ilerliyoruz)

| Kural | Açıklama |
|---|---|
| 🇹🇷 **Türkçe** | Arayüz, açıklamalar, kod yorumları — hepsi Türkçe |
| 🎓 **Öğreterek** | Her adımda "ne yaptık" ve **"neden yaptık"** anlatılır, günlük dille |
| ✅ **Yaz → hemen test et** | Kod yazılır yazılmaz çalıştırılır, sonucu gösterilir |
| 🔬 **İddia etme, ölç** | "Çalışıyor" demek yetmez; ekran görüntüsü/ölçüm ile kanıtla |
| ⚡ **Performans** | Görsel ağır olmasın; animasyon az, ağır şeyler isteğe bağlı yüklensin |
| 📱 **Mobil önemli** | Her özellik telefonda da düşünülür |
| 🌍 **Evrensel hedef** | Mümkün olduğunca herkes, her cihaz, her yerden kullanabilsin |

---

## 2. Klasör düzeni

```
D:\Projeler\NN Proje Adı\
├── Uygulama.exe            ← çift tıkla çalışan program
├── BENIOKU.md              ← kullanım kılavuzu (Türkçe)
├── STANDARTLAR.md          ← bu dosya
├── YAYINLA.bat             ← tek tıkla internete yayınla
├── index.html              ← kök yönlendirme (mobil/'e gider)
│
├── kaynak/                 ← Python kaynak kodu
│   ├── *_cekirdek.py           iş mantığı (ARAYÜZSÜZ)
│   ├── *.py                    tkinter arayüzü
│   ├── simge_olustur.py        tüm simgeleri çizer
│   ├── surum_artir.py          mobil önbellek sürümünü artırır
│   └── derle.bat               exe üretir
│
└── mobil/                  ← telefon/web sürümü (PWA)
    ├── index.html              uygulamanın tamamı
    ├── yerler.js               veri (kaynak/'tan ÜRETİLİR)
    ├── manifest.json           "ana ekrana ekle" bilgileri
    ├── sw.js                   çevrimdışı çalışma
    ├── .nojekyll               GitHub Pages PWA'yı bozmasın
    └── simge-*.png             telefon simgeleri
```

**Kural:** Numaralı klasör (`01`, `02`, …), Türkçe isim.

---

## 3. Kod yazım kuralları

| Konu | Kural | Örnek |
|---|---|---|
| Değişken/fonksiyon adı | Türkçe ama **özel harf YOK** | `hava_al`, `cekirdek`, `guncelle` |
| Kullanıcıya görünen metin | **Tam Türkçe** | `"Şiddetli yağış"` |
| Yorumlar | Türkçe, **nedeni** anlatır | `# pilde de çalışsın diye` |
| Mimari | **Mantık ile arayüz AYRI dosyada** | `hava_cekirdek.py` ↔ `hava_durumu.py` |
| Renkler | Sabit isimlerden (`PANEL`, `YAZI`), asla doğrudan `#hex` | tema değişince hepsi uyar |
| Ağ işlemleri | **Arka planda** + kuyrukla ana ekrana taşı | pencere donmasın |

---

## 4. Veri kaynakları (hepsi ücretsiz, anahtarsız)

| Kaynak | Ne verir |
|---|---|
| **Open-Meteo** | Hava tahmini (ICON/GFS/ECMWF modelleri) |
| **Open-Meteo Air Quality** | Hava kalitesi (AQI) + polen |
| **Open-Meteo Geocoding** | Yer adı → koordinat (dünya geneli) |
| **RainViewer** | Yağış radarı katmanı |
| **OpenStreetMap / Esri** | Harita ve uydu görüntüsü |

---

## 5. Yayınlama düzeni

```
Kod değişti  →  YAYINLA.bat çift tık  →  ~1 dakika  →  canlı
```

- **Adres:** `https://meteotr06.github.io`
- **Depo:** `meteotr06/meteotr06.github.io` (public)
- Depo adı `kullanici.github.io` olduğu için adres **kısa** kalır
- `YAYINLA.bat` otomatik: sürüm artırır → commit → push → Pages

---

## 6. ⚠️ Öğrenilen tuzaklar (tekrar düşmeyelim)

| Tuzak | Belirti | Çözüm |
|---|---|---|
| **PyInstaller `--windowed` + subprocess** | `.py` çalışır, `.exe` donar | Tüm `subprocess`'e `stdin=DEVNULL` |
| **Pillow 10+ `Image.ANTIALIAS` kaldırıldı** | Radar açınca harita bembeyaz | Başta `Image.ANTIALIAS = Image.Resampling.LANCZOS` |
| **Servis çalışanı önbelleği** | Kullanıcı eski sürümde kalır | `sw.js` sürümünü her yayında artır (`surum_artir.py` otomatik yapar) |
| **schtasks varsayılanları** | Dizüstü pilde bildirim gelmez | `DisallowStartIfOnBatteries=false`, `StartWhenAvailable=true` |
| **Oturum açılışı tetiği** | `Access denied` (yönetici ister) | Görev yerine **uygulama açılışta** kontrol etsin |
| **Tkinter default argüman** | Tema değişince renk güncellenmez | `on=None` yapıp gövdede ata |
| **PowerShell `Out-File -Encoding utf8`** | JSON okunamaz (BOM) | Python ile yaz ya da BOM'suz UTF-8 |
| **Git Bash `/Create` argümanı** | `schtasks` hata verir | PowerShell ya da Python `subprocess` kullan |

---

## 7. Test alışkanlıkları

1. **Duman testi:** Pencereyi aç, veri geldi mi, çöktü mü?
2. **Görsel doğrulama:** Ekran görüntüsü al, gözle bak
3. **Gerçek ürünü test et:** `.py` değil `.exe`; yerel değil **canlı site**
4. **Uç durumlar:** 320px ekran, pil modu, internet yok, gece/gündüz
5. **Temizlik:** Test için oluşturulan görev/kayıt/dosyaları sil

---

## 8. Mobil (PWA) standartları

- Dokunma hedefleri **≥ 44×44 px**
- Arama kutusu yazı boyutu **≥ 16px** (iOS zoom yapmasın)
- Yatay taşma **yok** (320px'de bile)
- Ağır kütüphaneler (harita) **isteğe bağlı** yüklenir
- Toplam ilk yükleme **< 100 KB** hedefi
- "Ana ekrana ekle" **daveti uygulama kendisi gösterir**
- Koyu/açık tema **cihaza göre otomatik**

---

## 9. Şu anki durum (20 Temmuz 2026)

| | |
|---|---|
| GitHub hesabı | `meteotr06` |
| Canlı adres | https://meteotr06.github.io |
| Masaüstü | `Hava Durumu.exe` (~23 MB) |
| Kod büyüklüğü | ~4.000 satır |
| Bildirimler | Sabah (bugün) ✅ · Akşam (yarın) ⬜ kurulum bekliyor · Uyarılar ✅ |
| Sıradaki hedef | Evrensellik: dil (TR/EN) · dünya konumları · °F birimi |
