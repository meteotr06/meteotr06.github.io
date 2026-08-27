# -*- coding: utf-8 -*-
"""YAYIN NÖBETÇİSİ — canlı sitenin gerçekten güncel olduğunu doğrular.

NEDEN VAR
    27 Ağustos 2026'da iki kez aynı şey oldu: bir hata KAYNAKTA düzeltildi,
    kimse yayın deposuna kopyalamadı ve canlıda haftalarca durdu.
      - Kur Pusulası'nda "100.000" yazan kullanıcı 100 TL ile hesap yapıyordu.
      - Hesap Araçları'nda net maaş EKSİ çıkıyordu.
    İkisi de "düzelttik" denmiş işlerdi. Düzeltmenin kullanıcıya ULAŞTIĞINI
    kimse ölçmemişti.

    Ayrıca bir kez de tersi oldu: "/planlayici/ 404 veriyor" diye bir bulgu
    dolaştı, oysa 200 dönüyordu. Klasör bu depoda yok, AYRI bir depodan
    yayınlanıyor. Depoya bakıp karar vermek yanlış (K-20).

NE DENETLER — üç halka, üçü de ayrı bir kopmayı yakalar:
    A) KAYNAK  -> YAYIN DEPOSU   : düzeltme kopyalanmış mı?
    B) YAYIN DEPOSU -> CANLI     : push edilmiş ve yayınlanmış mı?
    C) CANLI SAĞLIK              : 200 mü, bozuk girdi kalmış mı, sitemap tutuyor mu?

SINIRI (dürüstlük notu):
    type="number" sayımı burada STATİK yapılır, yani yalnızca HTML metnine
    bakar. JavaScript'in SONRADAN ürettiği kutuları göremez — Kur
    Pusulası'nda tam olarak öyle 9 kutu gizlenmişti. Tarayıcıyla sayım
    şarttır; bu betik onun yerine geçmez, sadece ucuz olanı yapar.

KULLANIM
    python yayin_denetle.py            (yayından hemen sonra çalıştır)
    python yayin_denetle.py --ayrinti  (her adresin ayrıntısını yaz)
"""

import io
import os
import re
import sys
import time
import urllib.error
import urllib.request

# Windows konsolu varsayilan olarak cp1254; "✓" yazamiyor ve betik
# UnicodeEncodeError ile COKUYOR. Nobetci cokerse nobet tutmuyor demektir,
# o yuzden once ciktiyi UTF-8'e cevirmeyi deniyoruz, olmazsa duz isarete
# dusuyoruz. Denetimin kendisi hicbir kosulda kesilmemeli.
TIK, CARPI = "✓", "✗"
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    TIK, CARPI = "[OK]", "[!!]"

KOK = os.path.dirname(os.path.abspath(__file__))
CANLI = "https://meteotr06.github.io"

# (ad, kaynak klasörü, yayın deposundaki klasör, canlı yol)
# kaynak None ise: uygulama doğrudan bu depoda geliştiriliyor
# depo   None ise: AYRI bir depodan yayınlanıyor, burada kopyası yok
UYGULAMALAR = [
    ("Ana sayfa",         None,                            "",              "/"),
    ("Hava Durumu",       None,                            "mobil",         "/mobil/"),
    ("Hesap Araçları",    r"D:\Projeler\09 Hesap Araclari", "hesap",        "/hesap/"),
    ("Kur Pusulası",      r"D:\Projeler\07 Kur Hesaplama",  "kur-pusulasi", "/kur-pusulasi/"),
    ("Muhasebe",          r"D:\Projeler\04 Muhasebe\mobil", "muhasebe",     "/muhasebe/"),
    ("Haftalık Planlayıcı", r"D:\Projeler\06 Programlama",  None,           "/planlayici/"),
    ("Göz Molası",        None,                            None,            "/goz-molasi/"),
    ("Arsa Rehberi",      r"D:\Projeler\10 Arsa Rehberi",   None,           "/arsa/"),
]

# Yayına henüz çıkmamış olabilecekler: 404 dönerse HATA değil, "henüz yok"
HENUZ_YOK_SERBEST = {"Arsa Rehberi"}

ZAMAN_ASIMI = 25


# ---------- küçük yardımcılar ----------

def getir(adres):
    """(durum_kodu, gövde). Ağ hatasında (None, hata metni)."""
    try:
        istek = urllib.request.Request(
            adres + ("&" if "?" in adres else "?") + "nb=%d" % time.time(),
            headers={"User-Agent": "yayin-denetle/1.0", "Cache-Control": "no-cache"})
        with urllib.request.urlopen(istek, timeout=ZAMAN_ASIMI) as c:
            return c.getcode(), c.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return None, str(e)


def dosya_oku(*parcalar):
    yol = os.path.join(*parcalar)
    if not os.path.exists(yol):
        return None
    return io.open(yol, encoding="utf-8", errors="ignore").read()


def damga(metin):
    """Sürüm damgalarını çıkarır: ?v=NN ve sw.js içindeki SURUM.

    Birden fazla farklı ?v= varsa hepsini döndürür — kendisi de bir bulgudur
    (06'da stil.css?v=17 ile betikler ?v=19 uyumsuzdu)."""
    if not metin:
        return set()
    d = set(re.findall(r"[?&]v=(\w+)", metin))
    d |= set(re.findall(r'SURUM\s*=\s*"([^"]+)"', metin))
    return d


def sayi_kutusu(metin):
    """Statik HTML'de kalan type="number" sayısı (yorum satırları hariç)."""
    if not metin:
        return 0
    temiz = re.sub(r"<!--.*?-->", "", metin, flags=re.S)
    temiz = re.sub(r"^\s*(//|\*|/\*).*$", "", temiz, flags=re.M)
    return len(re.findall(r'type\s*=\s*["\']number["\']', temiz))


# ---------- denetimler ----------

def uygulama_denetle(ad, kaynak, depo, yol, ayrinti):
    bulgular = []
    adres = CANLI + yol

    kod, govde = getir(adres)

    # C1) Canlı ayakta mı?
    if kod != 200:
        if kod == 404 and ad in HENUZ_YOK_SERBEST:
            return ["  %-22s —      henüz yayında değil" % ad], 0
        sebep = "ağ hatası: " + str(govde)[:40] if kod is None else "HTTP %s" % kod
        return ["  %-22s %s AYAKTA DEĞİL  (%s)" % (ad, CARPI, sebep)], 1

    # C2) Statik bozuk girdi kalmış mı?
    kalan = sayi_kutusu(govde)
    if kalan:
        bulgular.append('%d adet type="number" (Türkçe sayı yazımını bozar)' % kalan)

    canli_damga = damga(govde)

    # B) Yayın deposundaki kopya ile canlı aynı mı?
    if depo is not None:
        yerel = dosya_oku(KOK, depo, "index.html")
        if yerel is None:
            bulgular.append("depoda index.html yok (%s)" % (depo or "kök"))
        else:
            yerel_damga = damga(yerel)
            if yerel_damga and canli_damga and yerel_damga != canli_damga:
                bulgular.append("CANLI GERİDE — depo %s, canlı %s (push edildi mi? "
                                "Pages yayınlaması 1-2 dk sürer)"
                                % (sirala(yerel_damga), sirala(canli_damga)))

    # A) Kaynak klasördeki düzeltme yayın deposuna kopyalanmış mı?
    if kaynak is not None and depo is not None:
        k = dosya_oku(kaynak, "index.html")
        y = dosya_oku(KOK, depo, "index.html")
        if k is not None and y is not None:
            kd, yd = damga(k), damga(y)
            if kd and yd and kd != yd:
                bulgular.append("KAYNAK KOPYALANMAMIŞ — kaynak %s, depo %s "
                                "(bugün iki hata tam bu yüzden canlıda kaldı)"
                                % (sirala(kd), sirala(yd)))
        if k is not None and sayi_kutusu(k) == 0 and kalan > 0:
            bulgular.append("kaynak düzeltilmiş ama canlı hâlâ eski")

    if not bulgular:
        ek = ""
        if ayrinti:
            ek = "  [damga: %s]" % (sirala(canli_damga) or "yok")
        return ["  %-22s %s güncel%s" % (ad, TIK, ek)], 0
    satirlar = ["  %-22s %s %s" % (ad, CARPI, bulgular[0])]
    for b in bulgular[1:]:
        satirlar.append("  %-22s   %s" % ("", b))
    return satirlar, len(bulgular)


def sirala(kume):
    return ",".join(sorted(kume)) if kume else ""


def sitemap_denetle():
    """Sitemap'te yazan her adres gerçekten açılıyor mu?

    Google'a "bu sayfa var" diyoruz; yoksa güvenilirlik kaybı. Ters yönü de
    önemli: bir adresi 404 SANIP sitemap'ten silmek, çalışan bir sayfayı
    aramadan düşürür (K-20) — bu yüzden karar CANLI ölçüme dayanır."""
    kod, govde = getir(CANLI + "/sitemap.xml")
    if kod != 200:
        return ["  sitemap.xml açılmıyor (HTTP %s)" % kod], 1

    haritalar = re.findall(r"<loc>([^<]+)</loc>", govde)
    adresler = []
    for h in haritalar:
        k2, g2 = getir(h)
        if k2 != 200:
            return ["  alt sitemap açılmıyor: %s (HTTP %s)" % (h, k2)], 1
        adresler += re.findall(r"<loc>([^<]+)</loc>", g2)

    adresler = sorted(set(a for a in adresler if not a.endswith(".xml")))
    kirik = []
    for a in adresler:
        k3, _ = getir(a)
        if k3 != 200:
            kirik.append("%s (HTTP %s)" % (a.replace(CANLI, ""), k3))

    if kirik:
        satirlar = ["  %s sitemap'te %d kırık adres (%d adresin içinde):"
                    % (CARPI, len(kirik), len(adresler))]
        satirlar += ["      " + x for x in kirik[:8]]
        if len(kirik) > 8:
            satirlar.append("      ... ve %d tane daha" % (len(kirik) - 8))
        return satirlar, len(kirik)
    return ["  %s sitemap: %d adresin %d'i açılıyor" % (TIK, len(adresler), len(adresler))], 0


def main():
    ayrinti = "--ayrinti" in sys.argv
    print("YAYIN NÖBETÇİSİ —", CANLI)
    print()

    toplam = 0
    for ad, kaynak, depo, yol in UYGULAMALAR:
        satirlar, n = uygulama_denetle(ad, kaynak, depo, yol, ayrinti)
        for s in satirlar:
            print(s)
        toplam += n

    print()
    satirlar, n = sitemap_denetle()
    for s in satirlar:
        print(s)
    toplam += n

    print()
    if toplam == 0:
        print("HEPSİ GÜNCEL.")
    else:
        print("%d SORUN VAR — yukarı bak." % toplam)
        print("Hatırlatma: type=\"number\" sayımı burada yalnızca STATİK HTML'e bakar.")
        print("JavaScript'in sonradan ürettiği kutular için tarayıcıda saymak şart.")
    return 1 if toplam else 0


if __name__ == "__main__":
    sys.exit(main())
