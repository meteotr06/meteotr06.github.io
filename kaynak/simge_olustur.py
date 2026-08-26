"""Uygulamanin BUTUN simgelerini cizer (masaustu + mobil).

Calistirmak: python simge_olustur.py

Uretilenler:
  kaynak/hava_durumu.ico        exe simgesi (cok boyutlu)
  kaynak/simge_onizleme.png     goz karari kontrol icin
  mobil/simge-192.png           telefon ana ekran simgesi
  mobil/simge-512.png           buyuk telefon simgesi
  mobil/simge-maskeli-512.png   Android "maskable" (kendi sekline kirpar)

Tasarim: canli gokyuzu gradyani + isildayan gunes + yumusak golgeli bulut.
Once 1024 px'te cizilip hedefe kucultulur; boylece kenarlar puruzsuz (anti-alias)
ve golge/isik yumusak olur (GaussianBlur). Pillow kullanir.
"""

import os

from PIL import Image, ImageDraw, ImageFilter

BUYUK = 1024   # yuksek cozunurluk; sonra kucultuyoruz

# --- renkler ---
GOK_UST = (124, 194, 255)   # acik gok mavisi (ust)
GOK_ALT = (36, 116, 220)    # koyu gok mavisi (alt)
GUNES = (255, 196, 46)
GUNES_CEKIRDEK = (255, 232, 150)
GUNES_ISIK = (255, 214, 92)
BULUT = (253, 254, 255)
GOLGE = (10, 44, 92)


def _gradient(boyut, ust, alt):
    """Ustten alta gecen dikey gradyan (satir satir cizilir - hizli)."""
    img = Image.new("RGB", (boyut, boyut), alt)
    ciz = ImageDraw.Draw(img)
    for y in range(boyut):
        o = y / (boyut - 1)
        renk = tuple(int(ust[i] + (alt[i] - ust[i]) * o) for i in range(3))
        ciz.line([(0, y), (boyut, y)], fill=renk)
    return img


def _yuvarlak_maske(boyut, yaricap_orani=0.225):
    maske = Image.new("L", (boyut, boyut), 0)
    ImageDraw.Draw(maske).rounded_rectangle(
        [0, 0, boyut, boyut], radius=int(boyut * yaricap_orani), fill=255)
    return maske


def _bulut_ciz(ciz, cx, cy, r, renk):
    """Uc yumak + duz taban ile yumusak bir bulut."""
    def yumak(px, py, pr):
        ciz.ellipse([px - pr, py - pr, px + pr, py + pr], fill=renk)
    yumak(cx - r * 0.55, cy + r * 0.18, r * 0.55)
    yumak(cx - r * 0.05, cy - r * 0.32, r * 0.72)
    yumak(cx + r * 0.60, cy + r * 0.12, r * 0.60)
    ciz.rounded_rectangle(
        [cx - r * 1.02, cy + r * 0.12, cx + r * 1.02, cy + r * 0.74],
        radius=r * 0.35, fill=renk)


def _cizim(taban, olcek):
    """Gunes (isikli) + golgeli bulut'u taban resmin uzerine ciz."""
    c = BUYUK / 2
    r_bulut = 300 * olcek
    r_gunes = 172 * olcek
    gx, gy = c - 150 * olcek, c - 155 * olcek     # gunes: sol ust
    bx, by = c + 95 * olcek, c + 150 * olcek       # bulut: sag alt

    # 1) gunes halesi (isilti): ayri katmana ciz, bulaniklastir, birlestir
    hale = Image.new("RGBA", (BUYUK, BUYUK), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hale)
    hd.ellipse([gx - r_gunes * 2.0, gy - r_gunes * 2.0,
                gx + r_gunes * 2.0, gy + r_gunes * 2.0],
               fill=GUNES_ISIK + (150,))
    hale = hale.filter(ImageFilter.GaussianBlur(int(64 * olcek)))
    taban.alpha_composite(hale)

    cd = ImageDraw.Draw(taban)

    # 2) gunes isinlari (kisa, yuvarlak uclu)
    import math
    for aci in range(0, 360, 45):
        rad = math.radians(aci + 22.5)
        x1 = gx + math.cos(rad) * r_gunes * 1.35
        y1 = gy + math.sin(rad) * r_gunes * 1.35
        x2 = gx + math.cos(rad) * r_gunes * 1.72
        y2 = gy + math.sin(rad) * r_gunes * 1.72
        cd.line([x1, y1, x2, y2], fill=GUNES + (235,),
                width=int(r_gunes * 0.22))
        uc = r_gunes * 0.11
        cd.ellipse([x2 - uc, y2 - uc, x2 + uc, y2 + uc], fill=GUNES + (235,))

    # 3) gunes govdesi + parlak cekirdek
    cd.ellipse([gx - r_gunes, gy - r_gunes, gx + r_gunes, gy + r_gunes],
               fill=GUNES)
    cd.ellipse([gx - r_gunes * 0.62 - r_gunes * 0.18,
                gy - r_gunes * 0.62 - r_gunes * 0.18,
                gx + r_gunes * 0.62 - r_gunes * 0.18,
                gy + r_gunes * 0.62 - r_gunes * 0.18],
               fill=GUNES_CEKIRDEK)

    # 4) bulut golgesi (yumusak): ayri katman, bulaniklastir
    golge = Image.new("RGBA", (BUYUK, BUYUK), (0, 0, 0, 0))
    _bulut_ciz(ImageDraw.Draw(golge), bx, by + 24 * olcek, r_bulut,
               GOLGE + (120,))
    golge = golge.filter(ImageFilter.GaussianBlur(int(26 * olcek)))
    taban.alpha_composite(golge)

    # 5) beyaz bulut
    _bulut_ciz(ImageDraw.Draw(taban), bx, by, r_bulut, BULUT + (255,))


def olustur(boyut, maskeli=False):
    """Belirtilen boyutta simge uretir (RGBA)."""
    taban = _gradient(BUYUK, GOK_UST, GOK_ALT).convert("RGBA")
    _cizim(taban, olcek=0.72 if maskeli else 1.0)   # maskeli: icerik guvenli alanda
    if not maskeli:
        taban.putalpha(_yuvarlak_maske(BUYUK))
    return taban.resize((boyut, boyut), Image.LANCZOS)


if __name__ == "__main__":
    kaynak = os.path.dirname(os.path.abspath(__file__))
    mobil = os.path.join(kaynak, "..", "mobil")
    os.makedirs(mobil, exist_ok=True)

    yuvarlak = olustur(BUYUK)                       # ana tasarim (buyuk)
    # masaustu: cok boyutlu .ico + onizleme
    yuvarlak.save(os.path.join(kaynak, "hava_durumu.ico"),
                  sizes=[(16, 16), (32, 32), (48, 48), (64, 64),
                         (128, 128), (256, 256)])
    yuvarlak.resize((256, 256), Image.LANCZOS).save(
        os.path.join(kaynak, "simge_onizleme.png"))
    # mobil
    yuvarlak.resize((512, 512), Image.LANCZOS).save(
        os.path.join(mobil, "simge-512.png"))
    yuvarlak.resize((192, 192), Image.LANCZOS).save(
        os.path.join(mobil, "simge-192.png"))
    olustur(512, maskeli=True).save(os.path.join(mobil, "simge-maskeli-512.png"))
    print("Tamam: masaustu (.ico + onizleme) ve mobil (192/512/maskeli) "
          "simgeleri yeni tasarimla olusturuldu.")
