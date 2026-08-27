# -*- coding: utf-8 -*-
"""yayin_denetle.py NÖBET TUTUYOR MU — koruma sınaması.

NEDEN AYRI DOSYA
    Bir koruma, kaldırıldığında sınama düşmüyorsa süstür. Bugün bunu
    yaşadık: bir sınama "geçti" diyordu ama 9 bozuk kutu yayındaydı —
    sayfa açılır açılmaz tek bakış atıyor, sonradan üretilenleri görmüyordu.

İKİ TUZAK, ikisi de bugün yaşandı:
    1. Nöbet sınamasının KENDİSİ yanlış kurulabilir. Bir korumayı sınarken
       bozmayı sınamadan ÖNCE yaptım; sınama haklı olarak düşmedi ve az
       kalsın "koruma çalışmıyor" diyecektim. Bozma, sınamanın İÇİNDE olmalı.
    2. Sınav ESKİYEBİLİR. Nöbetçinin hükmü damgadan içeriğe taşındı ama
       sınamalar hâlâ damgayı ölçüyordu ve "kaldı" veriyordu — kod değil,
       sınav eskimişti. Koruma değişince sınavı da değişir.

ÇALIŞTIRMA
    python sinama_yayin_denetle.py
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")
import yayin_denetle as N

sonuc = []
CR, LF = chr(13), chr(10)
HESAP_KAYNAK = "D:" + chr(92) + "Projeler" + chr(92) + "09 Hesap Araclari"


def kontrol(ad, kosul):
    sonuc.append((ad, bool(kosul)))


# ---------- damga okuma (artık hüküm değil, yalnızca ipucu) ----------
kontrol("damga: ?v=40 okunuyor", N.damga('<script src="a.js?v=40">') == {"40"})
kontrol("damga: SURUM okunuyor", N.damga('const SURUM = "hesap-v40";') == {"40"})
kontrol("damga: tek tırnaklı SURUM da okunur (Göz Molası öyle yazıyor)",
        N.damga("const SURUM = 'goz-molasi-v82';") == {"82"})
kontrol("damga: ?s=v82 biçimi okunur (birinci kör noktanın kök sebebi)",
        N.damga('<link href="stil.css?s=v82">') == {"82"})
kontrol("damga: YORUMDAKİ damgayı saymaz (birinci yanlış alarm)",
        N.damga("// ornekte ?s=v55 gibi bir etiket gecer") == set())

# ---------- type="number" sayımı ----------
kontrol("sayım: gerçek girdiyi sayar", N.sayi_kutusu('<input type="number">') == 1)
kontrol("sayım: HTML yorumunu saymaz",
        N.sayi_kutusu('<!-- eskiden type="number" idi --><input type="text">') == 0)
kontrol("sayım: JS yorumunu saymaz",
        N.sayi_kutusu('// type="number" bozuyordu' + LF + 'var a=1;') == 0)
kontrol("sayım: tek tırnağı yakalar", N.sayi_kutusu("<input type='number'>") == 1)
kontrol("sayım: boşluklu yazımı yakalar", N.sayi_kutusu('<input type = "number">') == 1)

# ---------- içerik özeti: satır sonuna duyarlı OLMAMALI ----------
kontrol("özet: CRLF ile LF aynı sayılır (üçüncü yanlış alarm sınıfı)",
        N.ozet("a" + CR + LF + "b", "x.css") == N.ozet("a" + LF + "b", "x.css"))
kontrol("özet: gerçek içerik farkını görür",
        N.ozet("bir", "x.js") != N.ozet("iki", "x.js"))

# ---------- NÖBET SINAMALARI: kasten boz, yakalıyor mu ----------
gercek = N.getir


def icerigi_boz(adres):
    """Canlı stil.css'e satır ekle: nöbetçi 'canlıya ulaşmamış' demeli."""
    k, g = gercek(adres)
    if adres.startswith(N.CANLI + "/hesap/stil.css") and isinstance(g, str):
        g = g + LF + "/* sinama: kasten eklenmis satir */" + LF
    return k, g


N.getir = icerigi_boz
satirlar = N.uygulama_denetle("Hesap Araçları", HESAP_KAYNAK, "hesap", "/hesap/", False)[0]
N.getir = gercek
kontrol("NÖBET: canlı içerik farklıysa yakalar",
        any("ULAŞMAMIŞ" in x for x in satirlar))


def bozuk_girdi_ekle(adres):
    """Canlıya bir sayı kutusu enjekte et: nöbetçi görmeli."""
    k, g = gercek(adres)
    if "/muhasebe/" in adres and isinstance(g, str):
        g = g + chr(60) + 'input type="number" id="tuzak"' + chr(62)
    return k, g


N.getir = bozuk_girdi_ekle
satirlar2 = N.uygulama_denetle("Muhasebe", None, "muhasebe", "/muhasebe/", False)[0]
N.getir = gercek
kontrol("NÖBET: canlıya bozuk girdi girince yakalar",
        any('type="number"' in x for x in satirlar2))


def crlf_yap(adres):
    """Canlıyı CRLF'e çevir. İÇERİK AYNI — nöbetçi SUSMALI.

    Üçüncü yanlış-alarm sınıfı buydu: Git, Windows'ta çalışma ağacına CRLF
    yazar, sunucuda LF durur. Ham bayt karşılaştırması her metin dosyasını
    'farklı' gösterip 'hiçbir şey yayınlanmamış' diye rapor verecekti."""
    k, g = gercek(adres)
    if adres.startswith(N.CANLI + "/hesap/") and isinstance(g, str):
        g = g.replace(LF, CR + LF)
    return k, g


N.getir = crlf_yap
satirlar3 = N.uygulama_denetle("Hesap Araçları", HESAP_KAYNAK, "hesap", "/hesap/", False)[0]
N.getir = gercek
kontrol("NÖBET: satır sonu farkı YANLIŞ ALARM üretmez",
        not any("ULAŞMAMIŞ" in x for x in satirlar3))

# Yerelde karşılığı olmayan uygulamaya "güncel" DEMEMELİ.
# Ölçülmemişe onay vermek, hiç ölçmemekten kötüdür.
satirlar4 = N.uygulama_denetle("Deneme", None, None, "/goz-molasi/", False)[0]
kontrol("NÖBET: karşılaştıramadığına 'güncel' demez",
        not any("güncel" in x for x in satirlar4))

kaldi = [a for a, k in sonuc if not k]
for ad, k in sonuc:
    print(("  " + N.TIK + " " if k else "  " + N.CARPI + " ") + ad)
print()
print("%d/%d geçti" % (len(sonuc) - len(kaldi), len(sonuc)))
sys.exit(1 if kaldi else 0)
