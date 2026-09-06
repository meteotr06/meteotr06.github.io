# -*- coding: utf-8 -*-
"""SON GÜNCELLEME TARİHİNİ GIT'TEN YAZAR — yayından önce çalıştırılır.

NEDEN VAR (06.09.2026, ölçüldü)
    `hesap.js` içinde `guncelleme: "2026-09-03"` yazıyordu, ama dosyalar
    06.09'da değişmişti — hem de İKİ PARA HATASININ düzeltildiği sürümde
    (tam 15 yıl kıdemde yıllık izin 20 yerine 26 gün; ihbar süresi takvim
    ayından ölçülüyor, tam 6 ayda tazminatın yarısı eksikti).

    Tarihe bakan kullanıcı, kendisini ilgilendiren bir düzeltmenin
    varlığından habersiz kalıyordu. Sayfanın kendi gerekçesi şöyle diyor:
    "Bir hesap yanlış çıkıyorduysa ve düzelttiysek bunu da açıkça
    yazıyoruz — çünkü o hesaba bakarak karar vermiş olabilirsiniz."

    Tarihi bir kez daha ELLE düzeltmek çözüm değil: elle tutulan her
    değer er ya da geç bayatlar (K-87 — bir kez hesaplanan türetilmiş
    değer, türetilmiş değil KOPYALANMIŞTIR).

NE YAPAR
    Git'e sorar: bu uygulamanın hesap dosyaları en son ne zaman değişti?
    Cevabı `guncelleme` alanına yazar. Zaten doğruysa dosyaya dokunmaz.

NİYE AYRI BİR ADIM, NİYE OTOMATİK DEĞİL
    Site statik; derleme adımı yok. Tarihi çalışma anında üretmek de
    olmaz — kullanıcının tarayıcısı dosyanın git geçmişini bilmez.
    En yakın doğru yer yayın öncesi bu adım.

KULLANIM
    python tarih_damgala.py            (yazar)
    python tarih_damgala.py --denetle  (yalnız bakar, yazmaz; çıkış kodu 1 = bayat)

NÖBETÇİ İLE İLİŞKİSİ
    `yayin_denetle.py` aynı karşılaştırmayı yayından SONRA yapar ve
    bayatsa bağırır. Bu betik ise yayından ÖNCE düzeltir. İkisi birlikte:
    biri önler, öteki kaçanı yakalar.
"""

import io
import os
import re
import subprocess
import sys

KOK = os.path.dirname(os.path.abspath(__file__))

# (uygulama adı, kaynak dosya, tarihi belirleyen dosyalar)
# Tarih "hesap sonucunu etkileyen" dosyalardan gelir; bir simge ya da
# metin düzeltmesi "son güncelleme" tarihini ileri almamalı.
HEDEFLER = [
    ("Hesap Araçları",
     os.path.join(KOK, "hesap", "hesap.js"),
     ["hesap/hesap.js", "hesap/sayfa.js"]),
]

TIRNAK = chr(34) + chr(39)
KALIP = "guncelleme:" + r"\s*[" + TIRNAK + r"](\d{4}-\d{2}-\d{2})[" + TIRNAK + r"]"


def gitten_tarih(yollar):
    """Bu dosyaların en son değiştiği tarih (YYYY-AA-GG) ya da None."""
    try:
        s = subprocess.run(
            ["git", "log", "-1", "--format=%ad", "--date=short", "--"] + yollar,
            cwd=KOK, capture_output=True, text=True, timeout=20)
        return (s.stdout or "").strip() or None
    except Exception:
        return None


def main():
    denetle = "--denetle" in sys.argv
    bayat = 0

    for ad, dosya, yollar in HEDEFLER:
        if not os.path.exists(dosya):
            print("  ? %s: dosya yok (%s)" % (ad, dosya))
            continue

        metin = io.open(dosya, encoding="utf-8").read()
        m = re.search(KALIP, metin)
        if not m:
            print("  ? %s: guncelleme alanı okunamadı — biçim değişmiş olabilir" % ad)
            bayat += 1
            continue

        ilan = m.group(1)
        gercek = gitten_tarih(yollar)

        if not gercek:
            # ÖLÇÜLEMEYENE "TAMAM" DENMEZ. Git okunamadıysa sessizce
            # geçmek, bayat tarihi onaylamak olur.
            print("  ~ %s: git geçmişi okunamadı — tarih DOĞRULANAMADI" % ad)
            continue

        if ilan == gercek:
            print("  ✓ %s: %s (git ile tutuyor)" % (ad, ilan))
            continue

        if gercek < ilan:
            # İlan edilen tarih gelecekte: bu da yanlış ama farklı bir yanlış.
            print("  ! %s: %s yazıyor ama son değişiklik %s — ileri tarihli" % (ad, ilan, gercek))
            bayat += 1
            continue

        bayat += 1
        if denetle:
            print("  ✗ %s: %s yazıyor, dosyalar %s tarihinde değişmiş" % (ad, ilan, gercek))
        else:
            yeni = metin[:m.start(1)] + gercek + metin[m.end(1):]
            io.open(dosya, "w", encoding="utf-8").write(yeni)
            print("  → %s: %s → %s yazıldı" % (ad, ilan, gercek))

    if denetle and bayat:
        print()
        print("%d tarih bayat. Yayından önce 'python tarih_damgala.py' çalıştır." % bayat)
    return 1 if (denetle and bayat) else 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    sys.exit(main())
