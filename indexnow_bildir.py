# -*- coding: utf-8 -*-
"""IndexNow: Bing, Yandex, Seznam ve Naver'a "sayfalarim guncellendi" der.
Ucretsiz, hesap gerekmez, anahtar dosyasi kokte durdugu surece calisir.
Google IndexNow kullanmaz; onun icin Search Console gerekiyor.

Kullanim:  python indexnow_bildir.py
"""
import json, re, io, os, urllib.request, urllib.error

ALAN = "meteotr06.github.io"
ANAHTAR = "16de6ccbb5fc9a09a82e1fb13d54a495"
ANAHTAR_ADRESI = "https://%s/%s.txt" % (ALAN, ANAHTAR)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def sitemapten_adresler(yol):
    if not os.path.exists(yol): return []
    return re.findall(r"<loc>(.*?)</loc>", io.open(yol, encoding="utf-8").read())

adresler = []
for s in ("sitemap-uygulamalar.xml", "hesap/sitemap.xml"):
    adresler += sitemapten_adresler(s)
adresler = sorted(set(a for a in adresler if a.startswith("https://" + ALAN)))

# Once anahtar dosyasi gercekten yayinda mi?
try:
    g = urllib.request.urlopen(ANAHTAR_ADRESI, timeout=20).read().decode().strip()
    if g != ANAHTAR:
        raise SystemExit("HATA: anahtar dosyasinin icerigi tutmuyor -> " + g[:40])
except Exception as e:
    raise SystemExit("HATA: anahtar dosyasi yayinda degil (%s). Once push edin." % e)

govde = json.dumps({
    "host": ALAN,
    "key": ANAHTAR,
    "keyLocation": ANAHTAR_ADRESI,
    "urlList": adresler
}).encode("utf-8")

for sunucu in ("https://api.indexnow.org/indexnow",
               "https://www.bing.com/indexnow",
               "https://yandex.com/indexnow"):
    istek = urllib.request.Request(sunucu, data=govde,
                                   headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        c = urllib.request.urlopen(istek, timeout=30)
        print("%-40s %s  (%d adres)" % (sunucu, c.getcode(), len(adresler)))
    except urllib.error.HTTPError as e:
        print("%-40s %s  %s" % (sunucu, e.code, e.read()[:120]))
    except Exception as e:
        print("%-40s HATA %s" % (sunucu, str(e)[:60]))

print()
print("Bildirilen adres sayisi:", len(adresler))
