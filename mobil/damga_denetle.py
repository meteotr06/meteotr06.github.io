# -*- coding: utf-8 -*-
"""Kod degisti ama surum damgasi ayni mi? — kendini denetleyen kontrol.

NEDEN VAR: Kardes projede bir kod duzeltmesi uc kez tarayiciya ULASMADI —
onbellek eski dosyayi veriyordu. Bu projede surum sw.js'teki ONBELLEK adinda
tutuluyor ve dosyanin basinda "elle artirin" yaziyor. O disiplin tutmuyor.

Yayinda bu daha kotusunu yapar — kullanici duzeltilmis surumu HIC gormez.
Yayindan once calistir:  python damga_denetle.py
"""
import hashlib, os, re, sys

K = os.path.dirname(os.path.abspath(__file__))
IZLENEN = ("index.html", "yerler.js")
KAYIT = os.path.join(K, "SURUM-DAMGASI.txt")


def kod_ozeti():
    h = hashlib.sha256()
    for ad in IZLENEN:
        with open(os.path.join(K, ad), encoding="utf-8") as f:
            h.update(f.read().encode("utf-8"))
    return h.hexdigest()[:12]


def damga():
    """Bu projede surum, sw.js icindeki ONBELLEK adinda tutuluyor."""
    with open(os.path.join(K, "sw.js"), encoding="utf-8") as f:
        m = re.search(r'ONBELLEK\s*=\s*"([^"]+)"', f.read())
    return m.group(1) if m else None


def main():
    yeni_ozet, yeni_damga = kod_ozeti(), damga()
    if not os.path.exists(KAYIT):
        print("Kayit yok, olusturuluyor.")
        eski_ozet = eski_damga = None
    else:
        with open(KAYIT, encoding="utf-8") as f:
            metin = f.read()
        eski_damga = re.search(r"damga=(\S+)", metin).group(1)
        eski_ozet = re.search(r"kod_ozeti=(\S+)", metin).group(1)

    print("Kod ozeti : %s -> %s" % (eski_ozet, yeni_ozet))
    print("Damga     : %s -> %s" % (eski_damga, yeni_damga))

    if eski_ozet and yeni_ozet != eski_ozet and yeni_damga == eski_damga:
        print("\n!! HATA: Kod degismis ama surum damgasi ayni kalmis.")
        print("   sw.js icindeki ONBELLEK adini yeni tarih/saatle guncelle.")
        print("   Yoksa kullanici duzeltilmis surumu GORMEZ.")
        return 1

    with open(KAYIT, "w", encoding="utf-8") as f:
        f.write("damga=%s\nkod_ozeti=%s\n" % (yeni_damga, yeni_ozet))
    print("\nTamam: damga kodla tutarli.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
