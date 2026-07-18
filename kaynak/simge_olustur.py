"""Uygulamanin BUTUN simgelerini cizer (masaustu + mobil).

Calistirmak: python simge_olustur.py   (ya da derle.bat otomatik cagirir)

Uretilenler:
  kaynak/hava_durumu.ico        exe simgesi (cok boyutlu)
  kaynak/simge_onizleme.png     goz karari kontrol icin
  mobil/simge-192.png           telefon ana ekran simgesi
  mobil/simge-512.png           buyuk telefon simgesi
  mobil/simge-maskeli-512.png   Android "maskable" (kendi sekline kirpar)

Cizim tek yerde tanimli (_tasarim_ciz); boylece butun boyutlar AYNI gorunur.
Pillow (PIL) kullanir; tkintermapview ile birlikte zaten kurulur.
"""

import math
import os

from PIL import Image, ImageDraw

BOYUT = 512          # once buyuk cizip kucultuyoruz -> her boyutta net

# tema renkleri (arayuzle ayni)
UST = (30, 42, 58)          # #1e2a3a
ALT = (15, 22, 32)          # #0f1620
GUNES = (255, 210, 59)      # #ffd23b
BULUT = (240, 247, 255)
BULUT_GOLGE = (200, 214, 227)


def _gradient_arka(boyut=BOYUT):
    """Ustten alta koyulasan arka plan."""
    img = Image.new("RGB", (boyut, boyut), ALT)
    piksel = img.load()
    for y in range(boyut):
        oran = y / (boyut - 1)
        renk = tuple(int(UST[i] + (ALT[i] - UST[i]) * oran) for i in range(3))
        for x in range(boyut):
            piksel[x, y] = renk
    return img


def _yuvarlak_maske(boyut=BOYUT):
    maske = Image.new("L", (boyut, boyut), 0)
    kenar = boyut * 0.023
    ImageDraw.Draw(maske).rounded_rectangle(
        [kenar, kenar, boyut - kenar, boyut - kenar],
        radius=boyut * 0.22, fill=255)
    return maske


def _gunes(ciz, cx, cy, r):
    kalinlik = max(2, int(r * 0.28))
    for aci in range(0, 360, 45):
        rad = math.radians(aci)
        x1, y1 = cx + math.cos(rad) * r * 1.35, cy + math.sin(rad) * r * 1.35
        x2, y2 = cx + math.cos(rad) * r * 1.85, cy + math.sin(rad) * r * 1.85
        ciz.line([x1, y1, x2, y2], fill=GUNES, width=kalinlik)
        uc = kalinlik / 2
        ciz.ellipse([x2 - uc, y2 - uc, x2 + uc, y2 + uc], fill=GUNES)
    ciz.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GUNES)


def _bulut(ciz, cx, cy, r):
    def yumak(px, py, pr, renk):
        ciz.ellipse([px - pr, py - pr, px + pr, py + pr], fill=renk)
    # hafif govde golgesi
    yumak(cx - r * 0.5, cy + r * 0.2, r * 0.52, BULUT_GOLGE)
    yumak(cx, cy - r * 0.18, r * 0.64, BULUT_GOLGE)
    yumak(cx + r * 0.55, cy + r * 0.2, r * 0.56, BULUT_GOLGE)
    # asil beyaz bulut
    yumak(cx - r * 0.5, cy + r * 0.1, r * 0.5, BULUT)
    yumak(cx, cy - r * 0.28, r * 0.62, BULUT)
    yumak(cx + r * 0.55, cy + r * 0.1, r * 0.54, BULUT)
    ciz.rectangle([cx - r * 0.95, cy + r * 0.05, cx + r * 0.98, cy + r * 0.55],
                  fill=BULUT)


def _tasarim_ciz(img, kucult=1.0):
    """Gunes + bulut tasarimini cizer. 'kucult' 1'den kucukse icerik ortada
    kalacak sekilde kuculur (maskeli simgede kenarlar kirpilabildigi icin)."""
    ciz = ImageDraw.Draw(img)
    b = img.size[0]
    o = b / 512.0 * kucult          # olcek
    kaydir = b * (1 - kucult) / 2   # kucultunce ortala
    _gunes(ciz, kaydir + 192 * o, kaydir + 208 * o, 80 * o)
    _bulut(ciz, kaydir + 300 * o, kaydir + 336 * o, 156 * o)


def _kucult(img, hedef):
    return img.resize((hedef, hedef), Image.LANCZOS)


def masaustu_simgeleri():
    img = _gradient_arka().convert("RGBA")
    _tasarim_ciz(img)
    img.putalpha(_yuvarlak_maske())
    img.save("hava_durumu.ico",
             sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    _kucult(img, 256).save("simge_onizleme.png")
    return img


def mobil_simgeleri(yuvarlak, klasor=os.path.join("..", "mobil")):
    os.makedirs(klasor, exist_ok=True)
    _kucult(yuvarlak, 512).save(os.path.join(klasor, "simge-512.png"))
    _kucult(yuvarlak, 192).save(os.path.join(klasor, "simge-192.png"))
    # maskeli: kose yuvarlatma YOK (Android kendi seklini uygular), icerik
    # guvenli alanda kalsin diye biraz kucultulur
    maskeli = _gradient_arka().convert("RGBA")
    _tasarim_ciz(maskeli, kucult=0.72)
    _kucult(maskeli, 512).save(os.path.join(klasor, "simge-maskeli-512.png"))


if __name__ == "__main__":
    yuvarlak = masaustu_simgeleri()
    mobil_simgeleri(yuvarlak)
    print("Tamam: masaustu (.ico + onizleme) ve mobil (192/512/maskeli) "
          "simgeleri olusturuldu.")
