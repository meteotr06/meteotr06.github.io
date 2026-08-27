# -*- coding: utf-8 -*-
"""yayin_denetle.py NÖBET TUTUYOR MU — koruma sınaması.

NEDEN AYRI DOSYA
    Bir koruma, kaldırıldığında sınama düşmüyorsa süstür. Bugün bunu
    yaşadık: Kur Pusulası'nın sınaması "geçti" diyordu ama 9 bozuk kutu
    yayındaydı — sınama sayfa açılır açılmaz tek bakış atıyordu.
    O yüzden nöbetçinin kendisini de kasten bozup ölçüyoruz.

    Bir uyarı: nöbet sınamasının KENDİSİ de yanlış kurulabilir. Bugün
    bir korumayı sınarken bozmayı sınamadan ÖNCE yaptım, sınama haklı
    olarak düşmedi ve az kalsın "koruma çalışmıyor" diyecektim.
    Bozma, sınamanın İÇİNDE olmalı.

ÇALIŞTIRMA
    python sinama_yayin_denetle.py
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")
import yayin_denetle as N

sonuc = []
def kontrol(ad, kosul):
    sonuc.append((ad, bool(kosul)))

# --- damga çıkarma ---
kontrol("damga: ?v=40 okunuyor", N.damga('<script src="a.js?v=40">') == {"40"})
# SURUM adi ile ?v= damgasi AYNI surumu anlatir; nobetci ikisini esitlemeli,
# yoksa "hesap-v40" ile "v=40" farkli sanilir ve her kosuda yanlis alarm verir.
kontrol("damga: SURUM okunuyor", N.damga('const SURUM = "hesap-v40";') == {"40"})
kontrol("damga: tek tırnaklı SURUM da okunur (Göz Molası öyle yazıyor)",
        N.damga("const SURUM = 'goz-molasi-v82';") == {"82"})
kontrol("damga: ?s=v82 biçimi okunur (kör noktanın kök sebebi)",
        N.damga('<link href="stil.css?s=v82">') == {"82"})
kontrol("damga: SURUM ile ?v= aynı sürümde EŞLEŞİR",
        N.damga('a.js?v=40') == N.damga('const SURUM = "hesap-v40";'))
kontrol("damga: uyumsuz damgaları ayrı görür", N.damga("a.css?v=17 b.js?v=19") == {"17", "19"})
kontrol("damga: boş metin boş küme", N.damga("") == set())

# --- type="number" sayımı: yorumları saymamalı, yoksa yanlış alarm verir ---
kontrol("sayım: gerçek girdiyi sayar", N.sayi_kutusu('<input type="number">') == 1)
kontrol("sayım: HTML yorumunu saymaz",
        N.sayi_kutusu('<!-- eskiden type="number" idi --><input type="text">') == 0)
kontrol("sayım: JS yorumunu saymaz",
        N.sayi_kutusu('// type="number" bozuyordu\nvar a=1;') == 0)
kontrol("sayım: tek tırnağı yakalar", N.sayi_kutusu("<input type='number'>") == 1)
kontrol("sayım: boşluklu yazımı yakalar", N.sayi_kutusu('<input type = "number">') == 1)

# --- NÖBET SINAMALARI: canlıyı kasten bozup yakalıyor mu ---
gercek = N.getir

def geri_al_canliyi(adres):
    """Canlı sayfayı bir sürüm ESKİ göster: nöbetçi fark etmeli."""
    k, g = gercek(adres)
    if adres.startswith(N.CANLI + "/hesap/"):
        for yeni in ("v=41", "v=40"):
            g = g.replace(yeni, "v=39")
    return k, g

N.getir = geri_al_canliyi
satirlar, _ = N.uygulama_denetle("Hesap Araçları", r"D:\Projeler\09 Hesap Araclari",
                                 "hesap", "/hesap/", False)
N.getir = gercek
kontrol("NÖBET: canlı geride kalınca yakalar", any("CANLI GERİDE" in s for s in satirlar))

def bozuk_girdi_ekle(adres):
    """Canlıya type="number" enjekte et: nöbetçi görmeli."""
    k, g = gercek(adres)
    if adres.startswith(N.CANLI + "/muhasebe/"):
        g += '<input type="number" id="tuzak">'
    return k, g

N.getir = bozuk_girdi_ekle
satirlar2, _ = N.uygulama_denetle("Muhasebe", None, "muhasebe", "/muhasebe/", False)
N.getir = gercek
kontrol("NÖBET: canlıya bozuk girdi girince yakalar",
        any('type="number"' in s for s in satirlar2))


# --- NÖBET: ölçülemeyeni "güncel" saymamalı ---
# Bugünün kör noktası buydu: damga bulunamayınca hiçbir şey karşılaştırılmadan
# "✓ güncel" yazılıyordu. Damgasız bir uygulama taklit edip kontrol ediyoruz.
def damgasiz(adres):
    k, g = gercek(adres)
    if adres.startswith(N.CANLI + "/muhasebe/"):
        import re as _re
        g = _re.sub(r"[?&](v|s|ver|surum)=[\w.]+", "", g)
    return k, g

N.getir = damgasiz
satirlar3, _ = N.uygulama_denetle("Muhasebe", None, "muhasebe", "/muhasebe/", False)
N.getir = gercek
kontrol("NÖBET: damga yoksa 'güncel' DEMEZ",
        not any("güncel" in x for x in satirlar3))
kontrol("NÖBET: bunun yerine 'karşılaştırılamadı' der",
        any("karşılaştırılamadı" in x for x in satirlar3))

kaldi = [a for a, k in sonuc if not k]
for ad, k in sonuc:
    print(("  " + N.TIK + " " if k else "  " + N.CARPI + " ") + ad)
print()
print("%d/%d geçti" % (len(sonuc) - len(kaldi), len(sonuc)))
sys.exit(1 if kaldi else 0)
