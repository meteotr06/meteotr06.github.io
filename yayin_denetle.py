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

import hashlib
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
    ("Göz Molası",        r"D:\Projeler\05 Ekran koruması", None,    "/goz-molasi/"),
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
    """Sürüm damgalarını çıkarır.

    KÖR NOKTA HİKÂYESİ (27 Ağustos 2026): burası yalnızca "?v=" arıyordu.
    Göz Molası damgasını "?s=v82" diye yazıyor. Sonuç: boş küme döndü,
    karşılaştırma sessizce atlandı ve nöbetçi ekrana "güncel" yazdı —
    oysa canlı v77, yerel v82 idi. Yani nöbetçi hiçbir şey ölçmeden
    "ölçtüm" dedi. Bir aracın en kötü hatası budur.

    Birden fazla farklı damga varsa hepsi döner; kendisi de bir bulgudur
    (06'da stil.css?v=17 ile betikler ?v=19 uyumsuzdu)."""
    if not metin:
        return set()
    # YORUMLARI AT. f2 gercek bir yanlis alarm buldu: Goz Molasi'nin
    # sw.js'inde "// ...?s=v55 gibi surum etiketi var" diye bir ACIKLAMA
    # satiri vardi ve nobetci onu gercek damga sandi, "CANLI GERIDE" dedi.
    # Yanlis alarm, gercek alarmi sagirlastirir: birkac kez bosa otan
    # nobetci artik okunmaz. sayi_kutusu() zaten yorumlari atliyordu;
    # burada atlamamak kendi icimizde tutarsizliktı.
    metin = re.sub(r"<!--.*?-->", "", metin, flags=re.S)
    metin = re.sub(r"/\*.*?\*/", "", metin, flags=re.S)
    metin = re.sub(r"(?m)^\s*//.*$", "", metin)
    # ?v=40 · ?s=v82 · ?ver=3 · ?surum=12 · &v=40
    d = set(re.findall(r"[?&](?:v|s|ver|surum|version)=v?([\w.]+)", metin, re.I))
    d |= set(re.findall(r"""SURUM\s*=\s*['"]([^'"]+)['"]""", metin))
    # "hesap-v40" gibi ad-onekli damgalari sadeleştir ki v40 ile eşleşsin
    return set(re.sub(r"^[a-z\-]*v", "", x, flags=re.I) or x for x in d)


def sayi_kutusu(metin):
    """Statik HTML'de kalan type="number" sayısı (yorum satırları hariç)."""
    if not metin:
        return 0
    temiz = re.sub(r"<!--.*?-->", "", metin, flags=re.S)
    temiz = re.sub(r"^\s*(//|\*|/\*).*$", "", temiz, flags=re.M)
    return len(re.findall(r'type\s*=\s*["\']number["\']', temiz))



def cevrimdisi_eksigi(kaynak_klasor, depo_klasor, canli_html):
    """Sayfanin kullandigi CSS/JS, servis calisaninin on-bellek listesinde var mi?

    f2 nin fikri. Kacirilmasi kolay, cunku CEVRIMICI HICBIR SEY BOZULMAZ:
    uygulama normal calisir, yalnizca internet kesikken yarim acilir.
    Bugun 09 da tam bu vardi: sayfalar ?v=41 istiyordu, on-bellek listesi
    ?v=40 sakliyordu -- farkli anahtar, hic eslesmiyor. Yani cevrimdisi
    katmani, tam da is gormesi gereken anda bos donuyordu.

    Yalnizca kendi alan adimizdaki .css/.js bakilir; disaridan gelen
    (reklam vb.) zaten on-belleklenmez, onu istemek yanlis alarm olurdu.
    """
    TIRNAKLAR = chr(34) + chr(39)          # duz tirnak ve tek tirnak
    Q = chr(91) + TIRNAKLAR + chr(93)      # ["']

    sw = None
    if depo_klasor is not None:
        sw = dosya_oku(KOK, depo_klasor, "sw.js")
    if not sw and kaynak_klasor:
        sw = dosya_oku(kaynak_klasor, "sw.js")
    if not sw:
        return []

    # ignoreSearch: TRUE ise damgasiz on-bellek kaydi, damgali istegi de
    # karsilar. Goz Molasi boyle yapiyor. Bunu gormezsek "cevrimdisi
    # listesinde YOK" diye YANLIS ALARM veririz -- f2'yi bosuna avlatirdik.
    # Yanlis alarm, gercek alarmi sagirlastirir.
    if "ignoreSearch" in sw:
        return []

    # sw.js damgayi SURUM den turetiyorsa listede degisken durur; cozelim.
    m = re.search("SURUM" + r"\s*=\s*" + Q + "([^" + TIRNAKLAR + "]+)" + Q, sw)
    surum_damga = ("v=" + re.sub(r"^\D*v", "", m.group(1))) if m else ""
    sw_coz = sw.replace(chr(34) + " + DAMGA", surum_damga + chr(34))
    sw_coz = sw_coz.replace(chr(39) + " + DAMGA", surum_damga + chr(39))

    varlik = r"(?:\./)?([\w.\-]+\.(?:css|js)(?:\?[\w.=]+)?)"
    onbellekte = set(re.findall(Q + varlik + Q, sw_coz))
    istenen = set(re.findall("(?:src|href)=" + chr(34) + "(?!https?://)" + varlik + chr(34),
                             canli_html))
    return sorted(istenen - onbellekte)



METIN_UZANTI = (".css", ".js", ".html", ".json", ".xml", ".txt", ".svg")


def ozet(veri, ad=""):
    """Icerigin parmak izi.

    SATIR SONU NORMALLESTIRILIR -- yoksa UCUNCU YANLIS ALARM olurdu:
    Git, Windows'ta calisma agacina CRLF yazar, depoda ve sunucuda LF durur.
    Ham bayt karsilastirmasi bu yuzden HER metin dosyasini "farkli" gosterir.
    Olculdu: hesap/stil.css yerelde 47.119 bayt, canlida 46.152 -- fark tam
    olarak satir sayisi kadar. 
 atilinca md5'ler birebir ayni cikiyor.
    Ham bayta guvenseydik "hicbir sey yayinlanmamis" diye rapor verecektik.
    Ikili dosyalarda (png vb.) dokunmuyoruz, orada her bayt anlamli."""
    if veri is None:
        return None
    if isinstance(veri, str):
        veri = veri.encode("utf-8", "ignore")
    if ad.lower().endswith(METIN_UZANTI):
        CR, LF = bytes([13]), bytes([10])
        veri = veri.replace(CR + LF, LF).replace(CR, LF).strip()
    return hashlib.md5(veri).hexdigest()


def icerik_karsilastir(kaynak_klasor, depo_klasor, yol, canli_html):
    """Kullanici ESKI dosya mi aliyor? Dogrudan bunu olcer.

    NEDEN DAMGA KARSILASTIRMIYORUZ (f2'nin tespiti, 27 Agustos 2026):
    "damgalar birbirine esit mi" YANLIS SORU. Iki gecerli strateji var:
      - tek tip damga (05): butun dosyalar ayni surumde
      - dosya basina damga (06): degismeyen dosya eski damgada kalir,
        boylece bosuna yeniden indirilmez -- daha verimli
    Nobetci ikincisini "uyumsuz" sanip yanlis alarm veriyordu. O uyariya
    uyan biri CALISAN bir onbellek stratejisini bozacakti: hata olmayan
    seyi duzeltmek. Ustelik damgasiz projeler (Hava Durumu, Muhasebe) hic
    olculemiyordu.

    DOGRU SORU: yereldeki dosya ile canlidaki dosya AYNI MI?
    Bu, stratejiden bagimsiz, damgasiz projelerde de calisiyor ve
    "yayinladim ama ulasti mi" sorusuna dogrudan cevap veriyor.
    """
    kok = None
    if depo_klasor is not None:
        kok = os.path.join(KOK, depo_klasor)
    elif kaynak_klasor:
        kok = kaynak_klasor
    if not kok or not os.path.isdir(kok):
        return [], 0

    varlik = r"(?:src|href)=" + chr(34) + r"(?!https?://)(?:\./)?([\w.\-]+\.(?:css|js))(?:\?[\w.=]+)?" + chr(34)
    # Sayfanin KENDISI de karsilastirilir. Ana sayfa baska klasordeki
    # dosyalari cagiriyor, Muhasebe ise tek parca index.html -- ikisinde de
    # disaridan cagrilan dosya yok ve "karsilastirilamadi" cikiyordu.
    # Oysa asil merak ettigimiz sey zaten sayfanin kendisi.
    dosyalar = ["index.html"] + sorted(set(re.findall(varlik, canli_html)))
    farkli, bakilan = [], 0
    for d in dosyalar:
        yerel = os.path.join(kok, d)
        if not os.path.exists(yerel):
            continue
        yo = ozet(io.open(yerel, "rb").read(), d)
        kod, govde2 = getir(CANLI + yol + ("" if d == "index.html" else d))
        if kod != 200:
            farkli.append("%s (canlıda HTTP %s)" % (d, kod))
            continue
        bakilan += 1
        if ozet(govde2, d) != yo:
            farkli.append(d)
    return farkli, bakilan


# ---------- denetimler ----------

def uygulama_denetle(ad, kaynak, depo, yol, ayrinti):
    bulgular = []
    adres = CANLI + yol

    kod, govde = getir(adres)

    # 1) Canlı ayakta mı?
    if kod != 200:
        if kod == 404 and ad in HENUZ_YOK_SERBEST:
            return ["  %-22s —      henüz yayında değil" % ad], 0
        sebep = "ağ hatası: " + str(govde)[:40] if kod is None else "HTTP %s" % kod
        return ["  %-22s %s AYAKTA DEĞİL  (%s)" % (ad, CARPI, sebep)], 1

    # 2) Statik bozuk girdi kalmış mı?
    kalan = sayi_kutusu(govde)
    if kalan:
        bulgular.append('%d adet type="number" (Türkçe sayı yazımını bozar)' % kalan)

    # 3) Çevrimdışı listesi eksik mi?
    eksik = cevrimdisi_eksigi(kaynak, depo, govde)
    if eksik:
        bulgular.append("çevrimdışı listesinde YOK: %s — çevrimiçi sorunsuz "
                        "çalışır, internet kesikken yarım açılır"
                        % ", ".join(eksik[:4]))

    # 4) ASIL HÜKÜM: kullanıcı eski dosyayı mı alıyor?
    #
    # Eskiden burada DAMGALAR karşılaştırılıyordu ve iki kez yanlış alarm
    # verdi: (a) yorumda geçen "?s=v55" gerçek damga sanıldı, (b) dosya
    # başına damgalayan proje "uyumsuz" sanıldı — oysa o strateji geçerli
    # ve daha verimli, değişmeyen dosya boşuna indirilmiyor.
    # İkisi de aynı kökten: araç GÖRÜNÜŞE bakıyordu.
    # Artık SONUCA bakıyor: yereldeki dosya ile canlıdaki dosya aynı mı.
    # Bu, damgalama stratejisinden bağımsız ve damgasız projede de çalışır.
    farkli, bakilan = icerik_karsilastir(kaynak, depo, yol, govde)
    if farkli:
        bulgular.append("CANLIYA ULAŞMAMIŞ: %s — yereldeki hâli farklı "
                        "(push edildi mi? Pages yayınlaması 1-2 dk sürer)"
                        % ", ".join(farkli[:4]))

    if bulgular:
        satirlar = ["  %-22s %s %s" % (ad, CARPI, bulgular[0])]
        for b in bulgular[1:]:
            satirlar.append("  %-22s   %s" % ("", b))
        return satirlar, len(bulgular)

    if bakilan == 0:
        # Ölçülemeyene "güncel" denmez — üçüncü cevap şart.
        return ["  %-22s ~ ayakta — içerik karşılaştırılamadı "
                "(yerelde eşleşen dosya bulunamadı)" % ad], 0

    ek = "  [damga: %s]" % (sirala(damga(govde)) or "yok") if ayrinti else ""
    return ["  %-22s %s güncel — %d dosya içerikçe doğrulandı%s"
            % (ad, TIK, bakilan, ek)], 0


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
    damgalar = {}          # damga -> ornek adres
    for a in adresler:
        k3, g3 = getir(a)
        if k3 != 200:
            kirik.append("%s (HTTP %s)" % (a.replace(CANLI, ""), k3))
            continue
        # ASIMETRI (f2'nin notu): "surum artti mi" diye bakmak yetmiyor,
        # "artti ama bir sayfa geride mi kaldi" diye de sormak gerek.
        # Nobetci uygulama basina TEK sayfa cekiyordu; alt sayfalar
        # gozden kaciyordu. Ornek: 09'da 142 adres v41 ama 1 tanesi v40.
        for d in damga(g3):
            damgalar.setdefault(d, []).append(a.replace(CANLI, ""))

    if kirik:
        satirlar = ["  %s sitemap'te %d kırık adres (%d adresin içinde):"
                    % (CARPI, len(kirik), len(adresler))]
        satirlar += ["      " + x for x in kirik[:8]]
        if len(kirik) > 8:
            satirlar.append("      ... ve %d tane daha" % (len(kirik) - 8))
        return satirlar, len(kirik)
    # Sayfalar arasi DAMGA karsilastirmasi KALDIRILDI: dosya basina
    # damgalayan projede yanlis alarm veriyordu. Hukum artik icerik
    # karsilastirmasindan geliyor (bkz. icerik_karsilastir).
    return ["  %s sitemap: %d adresin %d'i açılıyor" % (TIK, len(adresler), len(adresler))], 0


def main():
    ayrinti = "--ayrinti" in sys.argv
    print("YAYIN NÖBETÇİSİ —", CANLI)
    print()

    toplam = 0
    olculemeyen = 0
    for ad, kaynak, depo, yol in UYGULAMALAR:
        satirlar, n = uygulama_denetle(ad, kaynak, depo, yol, ayrinti)
        for s in satirlar:
            print(s)
            if "karşılaştırılamadı" in s:
                olculemeyen += 1
        toplam += n

    print()
    satirlar, n = sitemap_denetle()
    for s in satirlar:
        print(s)
    toplam += n

    print()
    if toplam == 0 and olculemeyen:
        # "Sorun yok" ile "hepsini dogruladim" AYRI seylerdir. Bugun
        # Goz Molasi'na "guncel" dedik, olculmemisti ve geride oldugu
        # sanildi. Ozet satiri de yalan soylememeli.
        print("SORUN YOK — ama %d uygulamanın sürümü DOĞRULANAMADI (~ ile işaretli)."
              % olculemeyen)
    elif toplam == 0:
        print("HEPSİ GÜNCEL — sürümler tek tek karşılaştırıldı.")
    else:
        print("%d SORUN VAR — yukarı bak." % toplam)
        print("Hatırlatma: type=\"number\" sayımı burada yalnızca STATİK HTML'e bakar.")
        print("JavaScript'in sonradan ürettiği kutular için tarayıcıda saymak şart.")
    return 1 if toplam else 0


if __name__ == "__main__":
    sys.exit(main())
