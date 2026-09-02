# -*- coding: utf-8 -*-
"""PORTAL SIMGESI URETICISI -- meteotr06 ana sayfasinin logosu.

NEDEN YENIDEN CIZILDI (02.09.2026):
Eskisi dort DUZ renk karoydu: mavi/yesil/turuncu/mor, kopkoyu bir zemin
uzerinde. Fikir dogruydu (uygulama izgarasi = "hepsi tek yerde") ama
isci kabaydi -- renkler birbiriyle kavga ediyordu ve 32 pikselde
bulanik bir renk lekesine donusuyordu.

TASARIM KARARLARI, HER BIRI BIR SEBEPLE:

1. IZGARA KORUNDU. Simge bir seyi ANLATMALI; buradaki anlam "birden
   cok uygulama, tek kapi". Harf ya da soyut sekil bunu anlatmazdi.

2. DORT KARO, SEKIZ UYGULAMA. Sekiz karo cizmek 32 pikselde okunmaz.
   Simge envanter degil, ISARET.

3. RENKLER UYUMLU BIR AILEDEN. Eskisi ham RGB'ye yakindi (saf yesil,
   saf mor) ve yan yana titriyordu. Yenisi ayni parlaklik/doygunluk
   ailesinden secildi; yan yana durunca dinleniyor.

4. KAROLARDA DIKEY GECIS + UST ISIK. Duz renk yassi durur; ustten
   hafif aydinlik, ekranda "nesne" hissi verir.

5. ZEMIN SIYAH DEGIL, DERIN LACIVERT GECIS. Saf siyah, koyu temada
   arka planla birlesip simgeyi "delik" gibi gosteriyordu.

6. MASKELI SURUM AYRI URETILIR. Android simgeyi daire/kare/damla
   seklinde KESER. Ayni gorseli maskeli diye vermek, kenarlarin
   kesilmesi demektir -- guvenli alan %80'lik daire kabul edilip
   icerik kucultuldu. (Ayni dosyayi hem `any` hem `maskable` vermek
   bu ailenin bilinen hatasi.)

CIKTI: portal-192.png · portal-512.png · portal-maskeli.png · portal.svg
Dosya ADLARI degismedi -- manifest ve sayfa onlara bakiyor.
"""
import os

from PIL import Image, ImageDraw, ImageFilter

KOK = os.path.dirname(os.path.abspath(__file__))

# Zemin: derin lacivert, ustten alta hafif koyulasan
ZEMIN_UST = (26, 33, 54)
ZEMIN_ALT = (15, 20, 35)

# Dort karo -- ayni parlaklik ailesinden, yan yana titremeyen
KAROLAR = [
    ((0, 0), (96, 165, 250), (37, 99, 235)),     # mavi   -- hava/kur
    ((1, 0), (52, 211, 153), (5, 150, 105)),     # yesil  -- planlayici
    ((0, 1), (251, 191, 114), (217, 119, 6)),    # amber  -- kahve/arsa
    ((1, 1), (167, 139, 250), (109, 40, 217)),   # menekse-- hesap/muhasebe
]


def zemin(boy):
    """Dikey gecisli zemin."""
    g = Image.new("RGB", (1, boy))
    p = g.load()
    for y in range(boy):
        t = y / max(1, boy - 1)
        p[0, y] = tuple(int(ZEMIN_UST[i] + (ZEMIN_ALT[i] - ZEMIN_UST[i]) * t)
                        for i in range(3))
    return g.resize((boy, boy), Image.BILINEAR).convert("RGBA")


def karo(en, ust_renk, alt_renk, yaricap):
    """Dikey gecisli, yuvarlak kosel karo + ust isik."""
    # Gecis
    g = Image.new("RGB", (1, en))
    p = g.load()
    for y in range(en):
        t = y / max(1, en - 1)
        # Ust yariya daha cok isik: t**0.85 ile egri yumusatiliyor
        t = t ** 0.85
        p[0, y] = tuple(int(ust_renk[i] + (alt_renk[i] - ust_renk[i]) * t)
                        for i in range(3))
    g = g.resize((en, en), Image.BILINEAR).convert("RGBA")

    # Yuvarlak kose maskesi -- kenar yumusatma icin 4x cizilip kucultuluyor
    k = 4
    m = Image.new("L", (en * k, en * k), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, en * k - 1, en * k - 1], radius=yaricap * k, fill=255)
    m = m.resize((en, en), Image.LANCZOS)
    g.putalpha(m)

    # UST ISIK: karonun ust kenarinda ince bir aydinlik serit.
    # Duz renk yassi durur; bu serit ona hacim verir.
    isik = Image.new("RGBA", (en, en), (255, 255, 255, 0))
    d = ImageDraw.Draw(isik)
    d.rounded_rectangle([0, 0, en - 1, int(en * 0.5)],
                        radius=yaricap, fill=(255, 255, 255, 38))
    isik = isik.filter(ImageFilter.GaussianBlur(en * 0.06))
    isik.putalpha(Image.composite(isik.getchannel("A"),
                                  Image.new("L", (en, en), 0), m))
    return Image.alpha_composite(g, isik)


def ciz(boy, doluluk=0.74):
    """doluluk: karolarin kapladigi alanin kenara orani.

    MASKELI SURUMDE KUCUK OLMALI -- Android simgeyi keser; guvenli alan
    %80'lik dairedir. Ayni gorseli iki amac icin kullanmak, kenarlarin
    ucmasi demektir.
    """
    im = zemin(boy)
    alan = int(boy * doluluk)
    bas = (boy - alan) // 2
    bosluk = int(alan * 0.085)
    en = (alan - bosluk) // 2
    yaricap = int(en * 0.30)

    for (sx, sy), ust, alt in KAROLAR:
        k = karo(en, ust, alt, yaricap)
        x = bas + sx * (en + bosluk)
        y = bas + sy * (en + bosluk)
        im.alpha_composite(k, (x, y))
    return im


def svg():
    """Sekmede net gorunsun diye vektor surum.

    PNG 16-32 pikselde bulaniklasir; SVG her boyutta keskin kalir ve
    koyu temada da ayni durur (renkler sabit, ortama bagli degil).
    """
    kare = []
    d = 0.74
    bas = (1 - d) / 2 * 512
    alan = 512 * d
    bosluk = alan * 0.085
    en = (alan - bosluk) / 2
    r = en * 0.30
    for i, ((sx, sy), ust, alt) in enumerate(KAROLAR):
        x = bas + sx * (en + bosluk)
        y = bas + sy * (en + bosluk)
        kare.append(
            '  <rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" '
            'fill="url(#g%d)"/>' % (x, y, en, en, r, i))
        kare.append(
            '  <linearGradient id="g%d" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="rgb(%d,%d,%d)"/>'
            '<stop offset="1" stop-color="rgb(%d,%d,%d)"/></linearGradient>'
            % (i, ust[0], ust[1], ust[2], alt[0], alt[1], alt[2]))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n'
            '  <defs>\n'
            '    <linearGradient id="zemin" x1="0" y1="0" x2="0" y2="1">\n'
            '      <stop offset="0" stop-color="rgb(%d,%d,%d)"/>\n'
            '      <stop offset="1" stop-color="rgb(%d,%d,%d)"/>\n'
            '    </linearGradient>\n'
            '  </defs>\n'
            '  <rect width="512" height="512" rx="112" fill="url(#zemin)"/>\n'
            '%s\n</svg>\n'
            % (ZEMIN_UST + ZEMIN_ALT + ("\n".join(kare),)))


def main():
    for ad, boy, dol in [("portal-192.png", 192, 0.74),
                         ("portal-512.png", 512, 0.74),
                         ("portal-maskeli.png", 512, 0.58)]:
        im = ciz(boy, dol)
        y = os.path.join(KOK, ad)
        im.convert("RGB").save(y, "PNG", optimize=True)
        print("  %-22s %5d bayt" % (ad, os.path.getsize(y)))
    y = os.path.join(KOK, "portal.svg")
    with open(y, "w", encoding="utf-8") as f:
        f.write(svg())
    print("  %-22s %5d bayt" % ("portal.svg", os.path.getsize(y)))


if __name__ == "__main__":
    main()
