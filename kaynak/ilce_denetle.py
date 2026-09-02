# -*- coding: utf-8 -*-
"""ILCE NOBETCISI -- "yanlis sehrin havasi" hata sinifi.

NIYE VAR
  Bu uygulamada sayi yanlis olunca ekranda hata GORUNMEZ: sicaklik,
  ruzgar, yagis hepsi gecerli gorunur -- yalnizca BASKA BIR YERIN
  havasidir. Kullanici bunu ancak disari cikinca anlar.
  Gecmis: Gulnar 121 km sasmisti; 03.09.2026'da canlida "il merkezi
  koordinatini kullanan" eski bir kopya bulundu.

NE OLCER
  1. IKI LISTE AYNI MI: kaynak/ilceler.py (masaustu) ile
     mobil/yerler.js (mobil). Ikisi ayrisirsa kullanici hangi
     cihazda oldugua gore FARKLI ilce listesi gorur.
     yerler.js'in baslgindaki "masaustu surumuyle ayni veri" notu
     03.09.2026'da DOGRU DEGILDI: mobilde 970, masaustunde 957 kayit.
  2. ORTAK KAYITLARDA KOORDINAT AYRISIMI (asil tehlike).
  3. IL MERKEZI KOPYASI: ilce koordinati kendi il merkeziyle ayni mi?
  4. UZAKLIK: ilce kendi il merkezinden makul mesafede mi?
  5. TURKIYE SINIRLARI icinde mi?
  6. AYNI NOKTADA iki farkli ilce var mi?

TAKMA AD (5. ALAN)
  mobil/yerler.js bazi kayitlarda BESINCI alan tasir: ilcenin ESKI adi.
    ["Kahramankazan", "Ankara", 40.2317, 32.6839, "Kazan"]
  Boylece "Kazan" arayan kullanici da bulur. Bu nobetci ilk yazildiginda
  dort alanli kayit bekliyordu ve o 10 kaydi SESSIZCE ATLADI; neredeyse
  "10 ilce kayip" diye yanlis bir bulgu yazdiriyordu. Aleti sonuctan
  once dogrulamak sart.

NE GOREMEZ
  Koordinatin GERCEKTEN dogru oldugunu soyleyemez -- yapisal olarak
  supheli olani isaretler. Dogrulama disaridan yapilir.
"""
import io
import math
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOBIL = os.path.join(KOK, "mobil", "yerler.js")
URETEC = os.path.join(KOK, "kaynak", "ilceler.py")

LAT_MIN, LAT_MAX = 35.7, 42.2
LON_MIN, LON_MAX = 25.5, 45.0
UZAK_ESIK_KM = 200.0      # Anamur-Mersin 181 km GERCEK; esik onun ustunde
AYNI_NOKTA_KM = 0.6


def km(a_lat, a_lon, b_lat, b_lon):
    R = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp = math.radians(b_lat - a_lat)
    dl = math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def mobil_oku():
    m = io.open(MOBIL, encoding="utf-8").read()
    il_g = re.search(r"const\s+ILLER\s*=\s*\[([\s\S]*?)\];", m).group(1)
    ilce_g = re.search(r"const\s+ILCELER\s*=\s*\[([\s\S]*?)\];", m).group(1)
    iller = {a: (float(x), float(y)) for a, x, y in re.findall(
        r'\[\s*"([^"]+)"\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]', il_g)}
    # BESINCI alan istege bagli -- takma (eski) ad
    kal = re.compile(r'\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*'
                     r'(-?\d+(?:\.\d+)?)\s*(?:,\s*"([^"]*)"\s*)?\]')
    ilceler = [(g.group(1), g.group(2), float(g.group(3)), float(g.group(4)),
                g.group(5)) for g in kal.finditer(ilce_g)]
    return iller, ilceler


def uretec_oku():
    u = io.open(URETEC, encoding="utf-8").read()
    # tek VE cift tirnak: ilk surum yalniz cift tirnak ariyordu ve
    # "cozumlenemedi" deyip sessizce geciyordu.
    return [(a, i, float(x), float(y)) for a, i, x, y in re.findall(
        r"""[\(\[]\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*"""
        r"""(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*[\)\]]""", u)]


ILLER, MOBIL_ILCE = mobil_oku()
URETEC_ILCE = uretec_oku()

print("=" * 72)
print("ILCE NOBETCISI")
print("=" * 72)
print("  il sayisi         : %d" % len(ILLER))
print("  mobil ilce        : %d  (takma adli: %d)"
      % (len(MOBIL_ILCE), sum(1 for m in MOBIL_ILCE if m[4])))
print("  masaustu ilce     : %d" % len(URETEC_ILCE))

bulgu = []
M = {(m[0], m[1]): (m[2], m[3]) for m in MOBIL_ILCE}
TAKMA = {(m[4], m[1]) for m in MOBIL_ILCE if m[4]}
U = {(a, i): (x, y) for a, i, x, y in URETEC_ILCE}

print("\n--- 1) IKI LISTE AYNI MI ---")
u_fazla = sorted(set(U) - set(M) - TAKMA)
m_fazla = sorted(set(M) - set(U) - {(m[4], m[1]) for m in MOBIL_ILCE if m[4]})
u_eski_ad = sorted(set(U) - set(M) & TAKMA)
if u_eski_ad:
    print("  bilgi: masaustundeki %d ad mobilde TAKMA AD olarak duruyor"
          % len(u_eski_ad))
if u_fazla:
    print("  !! masaustunde VAR, mobilde HIC YOK: %d" % len(u_fazla))
    for a, i in u_fazla[:10]:
        print("       %-18s %s" % (a, i))
    bulgu.append("masaustunde fazla: %d" % len(u_fazla))
if m_fazla:
    print("  !! mobilde VAR, masaustunde YOK: %d" % len(m_fazla))
    for a, i in m_fazla[:15]:
        print("       %-18s %s" % (a, i))
    bulgu.append("mobilde fazla: %d" % len(m_fazla))
if not u_fazla and not m_fazla:
    print("  TAMAM -- iki liste ortusuyor (takma adlar sayildi)")

print("\n--- 2) ORTAK KAYITLARDA KOORDINAT AYRISIMI ---")
ortak = set(U) & set(M)
ayr = [(k, U[k], M[k]) for k in ortak
       if abs(U[k][0] - M[k][0]) > 1e-6 or abs(U[k][1] - M[k][1]) > 1e-6]
if ayr:
    print("  !! %d kayit ayrisiyor -- ASIL TEHLIKE BU:" % len(ayr))
    for k, a, b in sorted(ayr, key=lambda z: -km(z[1][0], z[1][1], z[2][0], z[2][1]))[:10]:
        print("       %-18s %-14s %.1f km fark" % (k[0], k[1], km(a[0], a[1], b[0], b[1])))
    bulgu.append("koordinat ayrisimi: %d" % len(ayr))
else:
    print("  TAMAM -- %d ortak kaydin hepsinde koordinat ayni" % len(ortak))

print("\n--- 3) IL MERKEZI KOORDINATINI KULLANAN ILCE ---")
kopya = [(m[0], m[1], km(m[2], m[3], ILLER[m[1]][0], ILLER[m[1]][1]))
         for m in MOBIL_ILCE if m[1] in ILLER
         and km(m[2], m[3], ILLER[m[1]][0], ILLER[m[1]][1]) <= AYNI_NOKTA_KM]
# il merkezini TASIYAN ilce dogal olarak yakindir; adi ile ayni olanlari ele
supheli = [x for x in kopya if x[0] != x[1]]
print("  il merkeziyle ayni noktada: %d  (adi ilin adiyla ayni olanlar haric: %d)"
      % (len(kopya), len(supheli)))
for ad, il, d in supheli[:12]:
    print("       %-18s %-14s %.2f km" % (ad, il, d))
print("  NOT: buyuksehirlerin merkez ilceleri (Cukurova/Adana gibi) dogal")
print("       olarak il merkezine yakindir; liste elle gozden gecirilir.")

print("\n--- 4) IL MERKEZINDEN COK UZAK (esik %d km) ---" % UZAK_ESIK_KM)
uzak = sorted(((km(m[2], m[3], ILLER[m[1]][0], ILLER[m[1]][1]), m[0], m[1])
               for m in MOBIL_ILCE if m[1] in ILLER), reverse=True)
asan = [x for x in uzak if x[0] > UZAK_ESIK_KM]
if asan:
    for d, ad, il in asan[:10]:
        print("       %-18s %-14s %7.1f km" % (ad, il, d))
    bulgu.append("cok uzak: %d" % len(asan))
else:
    print("  TAMAM -- en uzagi %s/%s %.1f km (gercek cografya)"
          % (uzak[0][1], uzak[0][2], uzak[0][0]))

print("\n--- 5) TURKIYE SINIRLARI ---")
dis = [(m[0], m[1]) for m in MOBIL_ILCE
       if not (LAT_MIN <= m[2] <= LAT_MAX and LON_MIN <= m[3] <= LON_MAX)]
if dis:
    print("  !! sinir disinda: %s" % dis[:8])
    bulgu.append("sinir disi: %d" % len(dis))
else:
    print("  TAMAM -- hepsi sinir kutusu icinde")

print("\n--- 6) AYNI NOKTADA IKI ILCE ---")
nokta = {}
cakisan = []
for m in MOBIL_ILCE:
    k = (round(m[2], 4), round(m[3], 4))
    if k in nokta:
        cakisan.append((nokta[k], (m[0], m[1])))
    else:
        nokta[k] = (m[0], m[1])
if cakisan:
    print("  %d cakisma (buyuksehir merkez ilceleri olabilir):" % len(cakisan))
    for a, b in cakisan[:10]:
        print("       %-22s <-> %s" % (a[0] + "/" + a[1], b[0] + "/" + b[1]))
    bulgu.append("ayni noktada: %d" % len(cakisan))
else:
    print("  TAMAM -- cakisma yok")

print("\n" + "=" * 72)
print("SONUC: %s" % ("TEMIZ" if not bulgu else " | ".join(bulgu)))
print("SINIR: koordinatin GERCEKTEN dogru oldugunu soyleyemez.")
print("=" * 72)
sys.exit(1 if bulgu else 0)
