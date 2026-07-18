# 🌍 Uygulamayı yayınlama (herkes kullanabilsin)

Bu adımlar **ücretsizdir** ve bir kez yapılır. Sonunda elinizde şöyle bir link olur:

```
https://KULLANICI-ADINIZ.github.io/hava-durumu/
```

Bu linki telefonda açan herkes uygulamayı kullanabilir — kurulum gerekmez.

---

## Adım 1 — GitHub hesabı açın (5 dakika, ücretsiz)

1. [github.com](https://github.com) → **Sign up**
2. E-posta, şifre, kullanıcı adı girin
3. E-postanıza gelen kodu onaylayın

> Kullanıcı adınızı not edin, birazdan lazım olacak.

## Adım 2 — Boş bir depo oluşturun

1. Sağ üstteki **+** → **New repository**
2. **Repository name:** `hava-durumu`
3. **Public** seçili kalsın (ücretsiz yayın için gerekli)
4. ⚠️ **"Add a README file" kutusunu İŞARETLEMEYİN** (boş olmalı)
5. **Create repository**

## Adım 3 — `YAYINLA.bat` dosyasına çift tıklayın

Sorulacak:
- GitHub kullanıcı adınız
- Depo adı (`hava-durumu`)

İlk gönderimde GitHub şifre/token isteyebilir. Şifre yerine **token** istenirse:
GitHub → Settings → Developer settings → Personal access tokens → *Generate new token (classic)* →
`repo` kutusunu işaretleyin → oluşan uzun metni şifre yerine yapıştırın.

## Adım 4 — Yayını açın (bir kez)

1. `https://github.com/KULLANICI/hava-durumu/settings/pages` adresine gidin
2. **Source:** Deploy from a branch
3. **Branch:** `main` — klasör: `/ (root)` → **Save**
4. 1–2 dakika bekleyin

**Bitti!** Siteniz yayında:
`https://KULLANICI.github.io/hava-durumu/`

---

## Güncelleme yapmak isterseniz

Kodu değiştirdikten sonra tekrar **`YAYINLA.bat`** çift tıklayın — site otomatik güncellenir.

> ⚠️ `mobil/index.html` veya `mobil/yerler.js` değiştiyse, `mobil/sw.js` içindeki
> `ONBELLEK = "hava-durumu-vX"` numarasını **bir artırın**. Yoksa telefona
> eklemiş kullanıcılar eski sürümü görmeye devam eder.

---

## Sonrası: daha da ileri gitmek

| Hedef | Nasıl | Maliyet |
|---|---|---|
| Kendi alan adı (`havadurumum.com`) | Alan adı alıp GitHub Pages'e bağlayın | ~$10/yıl |
| Google Play'de uygulama | [PWABuilder](https://www.pwabuilder.com) ile APK üretin | $25 (tek sefer) |
| Windows exe'yi paylaşmak | GitHub → Releases → exe'yi yükleyin | Ücretsiz |
| exe'de uyarı çıkmasın | Kod imzalama sertifikası | $150–300/yıl |
