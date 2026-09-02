# Hava Durumu — kullanım turu bulguları (03.09.2026)

**Kim:** oturum `hesap-maki-nesi-e0` · **Nerede:** `mobil/` çalışan uygulamada
**Niye:** kullanıcının kendi cümlesi — *"diğerlerini kullanmadığımdan
sorunlarını bulamıyorum da, kullanımları halledin."* Nöbetçiler **kodu**
ölçüyor; bu tur uygulamayı **kullandı**.

**Yayın yapılmadı** (K-25, kullanıcı uykuda). `mobil/index.html` ve
`mobil/manifest.json`'a **dokunulmadı** — orada başka bir oturumun
yayınlanmamış işi duruyor.

---

## ÖZET

| başlık | sonuç |
|---|---|
| İlçe koordinatları | **TEMİZ** — iki listede 960 ortak kaydın hepsinde koordinat aynı |
| Çevrimdışı | **TEMİZ** — eski veriyi güncel gibi göstermiyor |
| Ön önbellek mayını | **TEMİZ** — 8 girdinin 8'i de yayına gidiyor |
| Arama (Türkçe harf) | **KUSUR** — 963 yer adının **502'si** aksansız yazınca bulunamıyor |
| Masaüstü ↔ mobil liste | **KUSURDU** — 13 ilçe eksikti, eklendi; 10 ad farkı duruyor |

---

## 1 · KOORDİNATLAR — temiz, "yanlış şehrin havası" yok

Aranan hata sınıfı: ilçenin koordinatı yanlışsa ekranda **hata görünmez**;
sıcaklık, rüzgâr, yağış hepsi geçerli görünür — yalnızca **başka bir yerin**
havasıdır. Geçmişte Gülnar 121 km şaşmıştı.

Ölçüldü:
- **960 ortak kaydın hepsinde koordinat birebir aynı** (masaüstü ↔ mobil).
- Hiçbir kayıt Türkiye sınır kutusunun dışında değil.
- En uzak ilçe **Anamur/Mersin 180,7 km** — gerçek coğrafya, kusur değil.
  (İlk eşiğim 140 km'ydi ve Konya/Mersin ilçelerini yanlış işaretledi;
  eşik 200 km'ye çekildi. Yanlış alarm, alarm vermemekten iyi değildir.)

**Bir gözlem, kusur saymadım:** beş ilçe kendi il merkeziyle **aynı
koordinatta**: Nilüfer ve Osmangazi (Bursa); Atakum, Canik ve İlkadım
(Samsun). Bunlar büyükşehir merkez ilçeleri, gerçekte birbirine ~10 km;
hava farkı ölçülemez düzeyde. Yine de kaynak veri onlara ilin merkezini
vermiş. Düzeltmeye değer mi, sahibinin kararı.

## 2 · ARAMA — 502 yer adı aksansız yazınca bulunamıyor

Normalleştirme (`index.html:368`):
```js
const kucult = s => s.replace(/I/g,"ı").replace(/İ/g,"i").toLowerCase();
```
Türkçe büyük/küçük harf kuralını **doğru** uyguluyor. Ama aksan
**katlanmıyor**: `ç→c`, `ş→s`, `ğ→g`, `ö→o`, `ü→u`, `ı→i` eşleşmesi yok.

Ölçüldü — çalışan uygulamada arandı:

| yazılan | sonuç |
|---|---|
| `Çorum` | bulundu |
| `corum` | **Sonuç yok** |
| `Şırnak` / `şırnak` | bulundu |
| `sirnak` | **Sonuç yok** |
| `Iğdır` / `ığdır` | bulundu |
| `igdir` | **Sonuç yok** |
| `Gülnar` | bulundu |
| `gulnar` | **Sonuç yok** |
| `ISTANBUL` (düz büyük I) | **Sonuç yok** |

**Kapsam ölçüldü: 963 yer adının 502'si (%52) aksansız yazılınca
bulunamıyor.** Adıyaman, Ağrı, Aydın, Balıkesir, Bingöl, Çanakkale,
Çankırı, Çorum, Diyarbakır, Elazığ, Eskişehir, Gümüşhane… listenin yarısı.

Niye önemli: Türkiye'de hızlı yazarken aksan atlamak yaygındır; İngilizce
klavyede zaten mümkün değil. `ISTANBUL` satırı ayrı bir ayrıntı —
kural gereği düz `I` dilbilgisel olarak `ı` olur, ama büyük harf yazan
kullanıcı `İstanbul` demek istiyordur.

**Düzeltilmedi.** `index.html`'de başka bir oturumun yayınlanmamış işi
var; oraya dokunmak onun değişikliğini bozar. Sahibine bırakıldı.
Önerilen: `kucult` içine aksan katlama eklemek ve **aranan metni de,
aranan listeyi de** aynı işlevden geçirmek.

## 3 · ÇEVRİMDIŞI — temiz

Ölçüm: hava verisi geldikten sonra `fetch` engellendi (open-meteo,
rainviewer) ve **yenile**ye basıldı.

Sonuç: **"Veri alınamadı. İnternet bağlantınızı kontrol edip tekrar
deneyin."** — panel temizleniyor. Eski sıcaklığı güncel gibi göstermiyor.
Bu, aranan en tehlikeli davranıştı; yok.

Not: uygulama hava verisini **hiç saklamıyor** (`localStorage`'da yalnız
`sonYer` var), yani gösterecek bayat veri de yok. Tasarım gereği güvenli.

## 4 · ÖN ÖNBELLEK MAYINI — temiz

`REFERANS-DENETLE.py --yerel hava` → **8 girdinin 8'i de yayına gidiyor.**
`install` içindeki `addAll()` hep-ya-hiç çalışır; listedeki tek bir 404
çevrimdışı çalışmayı tümden bozar. Mayın yok.

## 5 · MASAÜSTÜ ↔ MOBİL AYRIŞMASI — düzeltildi (kısmen)

`mobil/yerler.js` başlığı diyor ki: *"Kaynak: kaynak/sehirler.py +
kaynak/ilceler.py (masaüstü sürümüyle **aynı veri**)"*. **Değildi.**

Ölçüldü: mobilde **970**, masaüstünde **957** kayıt.

**Yapıldı — 13 ilçe masaüstüne eklendi** (2012-2018 arasında kurulanlar):
Sultanhanı/Aksaray · Kemalpaşa/Artvin · Merkezefendi ve Pamukkale/Denizli ·
Derecik/Hakkari · Arsuz ve Payas/Hatay · Menteşe/Muğla · Altınordu/Ordu ·
Kapaklı/Tekirdağ · Kilimli ve Kozlu/Zonguldak · Karaköprü/Şanlıurfa.
Koordinatları mobil dosyadan alındı; ortak kayıtların koordinatı zaten
birebir aynı olduğu için o kaynak güvenilir.

**Yapılmadı — 10 ad değişikliği:** mobil adları güncellemiş ve eski adı
**beşinci alanda takma ad** olarak tutuyor:
```js
["Kahramankazan", "Ankara", 40.2317, 32.6839, "Kazan"]
```
Masaüstünün demeti dört alanlı; adı değiştirmek **eski adı arayan
kullanıcıyı kaybettirir**. Önce takma ad desteği gerekir. Bekleyenler:
Sinanpaşa←Sincanlı · Kahramankazan←Kazan · İliç←Ilıç · Çağlayancerit←Çağlıyancerit ·
Bahşılı←Bahşili · Arapgir←Arapkir · 19 Mayıs←Ondokuzmayıs · Tillo←Aydınlar ·
Ereğli←Karadenizereğli · Eyüpsultan←Eyüp.

**Mobil güvende:** `tek_dosya_uret.py` `yerler.js`'i **okuyup gömüyor**,
üretmiyor. Yani bayat masaüstü verisi mobili ezmiyor. Kontrol edildi.

**Kalıcı nöbetçi:** `kaynak/ilce_denetle.py` — iki listeyi, koordinat
ayrışmasını, il merkezi kopyasını, uzaklığı, sınırları ve çakışmayı
ölçer. Bulgu varsa **çıkış kodu 1** verir, sessizce geçmez.

---

## NÖBETÇİNİN KENDİ KUSURU — yazılmalı

İlk sürümü `mobil/yerler.js`'te **dört alanlı** kayıt bekliyordu. On kayıtta
**beşinci alan** var (takma ad). O onunu **sessizce atladı** ve az kalsın
*"masaüstünde var, mobilde yok — 10 ilçe kayıp"* diye **yanlış bir bulgu**
yazdırıyordu. Gerçekte hepsi mobilde, yeni adlarıyla duruyordu.

Aynı turda ikinci körlük: üreteç **tek tırnak** kullanıyor, ayrıştırıcım
**çift tırnak** arıyordu; araç *"üreteç çözümlenemedi — ÖLÇÜLEMEDİ"* deyip
geçti. **Sessiz kaçırma, yanlış alarmdan tehlikelidir** — "ölçülemedi"
satırı bir sonraki koşuda göz ardı edilir.

**Ders:** aleti sonuçtan önce doğrula. Ölçülen sayı ile uygulamanın
gösterdiği sayı tutmuyorsa, önce **aletten** şüphelen. Bu turda tarayıcı
970 derken aracım 960 diyordu; farkı kovalamak bulgunun kendisini kurtardı.
