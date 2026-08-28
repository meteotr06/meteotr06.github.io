# -*- coding: utf-8 -*-
"""NOBETCIYI SINAR. `yayin_denetle.py` dogru mu bagiriyor, dogru mu susuyor?

NEDEN VAR: bu arac 27.08.2026'da art arda DORT yanlis alarm verdi. Yanlis
alarm zararsiz degildir -- alarmi sagirlastirir. Dorduncusunde arac
susturulma esigine gelmisti; susturulmus bir nobetci, olmayan nobetciden
kotudur, cunku bakildigi sanilir.

Duzeltmenin kendisi de olculmeden kabul edilmez. Bu dosya iki yone birden
bakar:
    A) DORT yanlis alarm -- artik SUSMALI
    B) GERCEK geride kalma -- hala BAGIRMALI

Yalniz (A)'yi olcmek "her seye tamam de" diyen bir araci da gecirirdi.
Susturmanin en kolay yolu koru etmektir; (B) o yolu kapatir.

Kosum:  python sinama_yayin_denetle.py
"""
import io
import os
import shutil
import sys
import tempfile

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import yayin_denetle as YD

GECTI = FALSO = 0


def kur(sw_metni):
    """Gecici klasore bir sw.js yazar, klasoru dondurur."""
    k = tempfile.mkdtemp(prefix="nobetci_")
    io.open(os.path.join(k, "sw.js"), "w", encoding="utf-8").write(sw_metni)
    return k


def dene(baslik, sw, html, bekleyen_durum, bekleyen_liste=None):
    """bekleyen_durum: 'tamam' | 'eksik' | 'olculemedi'"""
    global GECTI, FALSO
    k = kur(sw)
    try:
        c = YD.cevrimdisi_eksigi(k, None, html)
    finally:
        shutil.rmtree(k, ignore_errors=True)

    tamam = c.get("durum") == bekleyen_durum
    if tamam and bekleyen_liste is not None:
        tamam = sorted(c.get("liste") or []) == sorted(bekleyen_liste)

    if tamam:
        GECTI += 1
        print("  [GECTI] %s" % baslik)
    else:
        FALSO += 1
        print("  [KALDI] %s" % baslik)
        print("          beklenen: %s %s" % (bekleyen_durum, bekleyen_liste or ""))
        print("          gelen   : %s" % c)


print(__doc__.split("Kosum:")[0].strip().split("\n")[0])
print()
print("A) DORT YANLIS ALARM -- artik susmali")
print("-" * 62)

# --- 1 --- Arsa Rehberi: etiket SURUM'dan turetiliyor, adi "ETIKET".
# Eski arac yalniz "+ DAMGA" adini cozuyordu; bunu cozemedi ve
# "cevrimdisi listesinde YOK: arayuz.js?v=27, ..." dedi. Dosyada `?v=27`
# METNI hic yok -- deger calisma aninda uretiliyor.
dene("Arsa: on onbellek `+ ETIKET` ile uretiliyor",
     'const SURUM = "arsa-v28";\n'
     'const ETIKET = "?v=" + SURUM.replace(/^arsa-v/, "");\n'
     'const CEKIRDEK = ["./", "./index.html", "./stil.css" + ETIKET,\n'
     '                  "./cekirdek.js" + ETIKET, "./arayuz.js" + ETIKET];\n',
     '<script src="cekirdek.js?v=28"></script>'
     '<script src="arayuz.js?v=28"></script>'
     '<link href="stil.css?v=28">',
     "olculemedi")

# --- 2 --- Ayni is, degisken adi "DAMGA". Eski arac YALNIZ bunu cozerdi.
# Simdi ikisi de ayni cevabi almali: ada degil BICIME bakiyoruz.
dene("09: ayni yapi, degisken adi `+ DAMGA`",
     'const SURUM = "hesap-v42";\n'
     'const DAMGA = "?v=42";\n'
     'const DOSYALAR = ["./", "./sayfa.js" + DAMGA, "./hesap.js" + DAMGA];\n',
     '<script src="hesap.js?v=42"></script><script src="sayfa.js?v=42"></script>',
     "olculemedi")

# --- 3 --- Yorumdaki ornek adres gercek kayit sanilmasin, tersi de olmasin.
# Arac bir kez YORUM icindeki `?v=10` ornegini gercek zannedip
# "sw.js precache v10" diye bulgu yazmisti.
dene("Yorumdaki eski ornek adres bulgu sayilmaz",
     '// Eskiden burada "./cekirdek.js?v=10" yaziyordu, artik yazmiyor.\n'
     '/* ornek: "./arayuz.js?v=10" */\n'
     'const DOSYALAR = ["./", "./cekirdek.js?v=19", "./arayuz.js?v=19"];\n',
     '<script src="cekirdek.js?v=19"></script><script src="arayuz.js?v=19"></script>',
     "eksik", [])

# --- 4 --- Goz Molasi: ignoreSearch:true. Damgasiz kayit, damgali istegi
# de karsilar. Bunu gormeyen arac "hepsi eksik" der; f2 oturumu bu yuzden
# bosuna avlanmisti.
dene("Goz Molasi: ignoreSearch damga farkini yutar",
     'const DOSYALAR = ["./", "./stil.css", "./kod.js"];\n'
     'caches.match(e.request, {ignoreSearch: true});\n',
     '<link href="stil.css?v=7"><script src="kod.js?v=7"></script>',
     "tamam")

print()
print("B) GERCEK GERIDE KALMA -- hala bagirmali")
print("-" * 62)

# --- 5 --- BUGUN CANLIDA OLAN HATA. 06 Planlayici: sayfa ?v=19 istiyor,
# on onbellek ?v=17 sakliyordu. Farkli anahtar -> hic eslesmiyor ->
# cevrimdisi katmani tam is gormesi gereken anda bos donuyor.
# Bunu yakalamazsa arac ise yaramaz.
dene("06 Planlayici: sayfa v19 istiyor, onbellek v17 sakliyor",
     'const DOSYALAR = ["./", "./stil.css?v=17",\n'
     '                  "./cekirdek.js?v=17", "./arayuz.js?v=17"];\n',
     '<link href="stil.css?v=17">'
     '<script src="cekirdek.js?v=19"></script>'
     '<script src="arayuz.js?v=19"></script>',
     "eksik", ["arayuz.js?v=19", "cekirdek.js?v=19"])

# --- 6 --- Dosya listeye hic girmemis (damga degil, VARLIK eksik).
dene("Yeni dosya on onbellege hic eklenmemis",
     'const DOSYALAR = ["./", "./stil.css?v=3", "./cekirdek.js?v=3"];\n',
     '<link href="stil.css?v=3">'
     '<script src="cekirdek.js?v=3"></script>'
     '<script src="grafik.js?v=3"></script>',
     "eksik", ["grafik.js?v=3"])

# --- 7 --- KORLESME TUZAGI. Liste hem birlestirme HEM elle yazilmis
# damga tasiyorsa arac yine "olculemedi" der -- ve elle yazilmis olan
# geride kalmissa bunu GORMEZ. Bu bilinen bir kor nokta; sinama onu
# gizlemek yerine yaziya dokuyor. "Olculemedi" bir gecis belgesi degil,
# tarayicida elle bakma emridir.
dene("Karisik liste: birlestirme varsa yine olculemedi (bilinen kor nokta)",
     'const DAMGA = "?v=9";\n'
     'const DOSYALAR = ["./", "./stil.css?v=2", "./kod.js" + DAMGA];\n',
     '<link href="stil.css?v=9"><script src="kod.js?v=9"></script>',
     "olculemedi")

print()
print("D) YANLIS GUVENCE -- yerel duzeltme canliyi duzeltmez")
print("-" * 62)

# --- 8 --- EN TEHLIKELI KUSUR. Canli sw.js v17 sakliyor, canli sayfa v19
# istiyor: YAYIN bozuk. Yereldeki sw.js'i duzeltince eski arac SUSUYORDU
# -- yerel dosyayi canli sayfayla karsilastirdigi icin. Yani duzeltmeyi
# yaptigin an uyari kayboluyor, yayin bozuk kaliyordu.
# Yanlis alarm rahatsiz eder; yanlis GUVENCE aramayi durdurur.
k_yerel = kur('const DOSYALAR = ["./", "./cekirdek.js?v=19"];\n')   # duzeltilmis
try:
    c = YD.cevrimdisi_eksigi(k_yerel, None,
                             '<script src="cekirdek.js?v=19"></script>',
                             'const DOSYALAR = ["./", "./cekirdek.js?v=17"];')  # CANLI: eski
finally:
    shutil.rmtree(k_yerel, ignore_errors=True)
if c.get("durum") == "eksik" and c.get("liste") == ["cekirdek.js?v=19"]:
    GECTI += 1
    print("  [GECTI] Yerel duzeltilmis ama CANLI eski -> hala bagiriyor")
else:
    FALSO += 1
    print("  [KALDI] Yerel duzeltilmis ama CANLI eski -> SUSTU (yanlis guvence)")
    print("          gelen: %s" % c)

print()
print("C) DIS ADRES -- bizim degil, on onbelleklenmez")
print("-" * 62)
dene("Baska alan adindaki betik eksik sayilmaz",
     'const DOSYALAR = ["./", "./kod.js?v=1"];\n',
     '<script src="kod.js?v=1"></script>'
     '<script src="https://pagead2.googlesyndication.com/reklam.js"></script>',
     "eksik", [])

print()
print("=" * 62)
print("GECTI: %d    KALDI: %d" % (GECTI, FALSO))
if FALSO:
    print("Nobetci hatali. Duzeltmeden yayin denetimine guvenme.")
sys.exit(1 if FALSO else 0)
