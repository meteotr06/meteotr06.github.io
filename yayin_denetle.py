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



def cevrimdisi_eksigi(kaynak_klasor, depo_klasor, canli_html, canli_sw=None):
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

    # CANLI OLAN OKUNUR, YERELDEKI DEGIL.
    #
    # Olculdu (27.08.2026): 06 Planlayici'nin canli sw.js'i ?v=17 sakliyor,
    # canli sayfa ?v=19 istiyor -- cevrimdisi katmani YAYINDA bozuk. Ben
    # yereldeki sw.js'i duzeltince bu arac SUSTU: yerel dosyayi canli
    # sayfayla karsilastiriyordu, ikisi uyusunca "sorun yok" dedi.
    #
    # Bu, yanlis alarmdan tehlikelidir. Yanlis alarm rahatsiz eder;
    # YANLIS GUVENCE ise aramayi durdurur. Ustelik tam ters yonde calisir:
    # duzeltmeyi yaptigin an uyari kayboluyordu, yani arac en cok
    # "duzeldi mi?" diye baktigin anda yaniltiyordu.
    #
    # Bu arac YAYINI denetler; olcecegi sey canli olandir. Yerel dosya
    # ancak canliya erisilemediginde yedektir ve o zaman not dusulur.
    sw, kaynagi = None, "canli"
    if canli_sw:
        sw = canli_sw
    if not sw and depo_klasor is not None:
        sw, kaynagi = dosya_oku(KOK, depo_klasor, "sw.js"), "depo kopyasi"
    if not sw and kaynak_klasor:
        sw, kaynagi = dosya_oku(kaynak_klasor, "sw.js"), "yerel kaynak" 
    if not sw:
        return {"durum": "olculemedi", "sebep": "sw.js bulunamadi"}

    # ignoreSearch: TRUE ise damgasiz on-bellek kaydi, damgali istegi de
    # karsilar. Goz Molasi boyle yapiyor. Bunu gormezsek "cevrimdisi
    # listesinde YOK" diye YANLIS ALARM veririz -- f2'yi bosuna avlatirdik.
    # Yanlis alarm, gercek alarmi sagirlastirir.
    if "ignoreSearch" in sw:
        return {"durum": "tamam"}

    # HESAPLANAN DEGERI "EKSIK" SANMA.
    #
    # Olculdu (27.08.2026): bu satirlar yalnizca "+ DAMGA" adini cozuyordu.
    # Arsa Rehberi ayni isi "+ ETIKET" diye yaziyor; cozulemedi ve nobetci
    # "cevrimdisi listesinde YOK" dedi. Dosyada `?v=27` METNI yoktur, o
    # deger CALISMA ANINDA uretilir. Statik okuma bunu goremez.
    #
    # Ada gore cozmek kirilgan bir yamaydi: bir sonraki proje degiskene
    # baska bir ad verse yine yanlis alarm. O yuzden artik ADA DEGIL
    # BICIME bakiyoruz: listede herhangi bir birlestirme varsa
    # "karsilastirilamadi" diyoruz.
    #
    # UCUNCU CEVAP. Olculemeyen seye ne "gecti" ne "kaldi" denir. Yanlis
    # alarm veren nobetci bir sure sonra susturulur; dorduncusunde o esige
    # gelinmisti.
    liste = re.search(r"(?:DOSYALAR|CEKIRDEK|VARLIKLAR)\s*=\s*\[(.*?)\]", sw, re.S)
    govde = liste.group(1) if liste else sw
    if re.search(Q + r"\s*\+\s*[A-Za-z_$]", govde):
        return {"durum": "olculemedi",
                "sebep": "on onbellek adresleri calisma aninda uretiliyor "
                         "(metin birlestirme); statik okumayla karsilastirilamaz. "
                         "Tarayicida servis calisaninin onbellegine bakmak sart."}

    varlik = r"(?:\./)?([\w.\-]+\.(?:css|js)(?:\?[\w.=]+)?)"
    onbellekte = set(re.findall(Q + varlik + Q, sw_coz_yok(sw)))
    istenen = set(re.findall("(?:src|href)=" + chr(34) + "(?!https?://)" + varlik + chr(34),
                             canli_html))
    return {"durum": "eksik", "liste": sorted(istenen - onbellekte),
            "kaynak": kaynagi}


def sw_coz_yok(sw):
    """Yorumlari atar. Yorumdaki bir ornek adres gercek kayit sanilmasin."""
    sw = re.sub(r"/\*.*?\*/", "", sw, flags=re.S)
    return "\n".join(s for s in sw.split("\n") if not s.strip().startswith("//"))



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



def kopyalanmamis(kaynak_klasor, depo_klasor):
    """Gelistirici klasorundeki is, YAYIN klasorune kopyalanmis mi?

    NEDEN AYRI BIR OLCUM (olculdu, 29.08.2026):
    Nobetci "yerel" derken YAYIN KLASORUNU kastediyordu. O yuzden
    zincirin sadece IKINCI halkasini olcuyordu:

        kaynak klasoru  --(1) kopyala-->  yayin klasoru  --(2) push-->  canli
                             OLCULMUYOR                     olculuyor

    Sonuc: 09'da `sayfa.js` ve `stil.css` duzeltilmis, yayin klasorune
    HIC kopyalanmamisti. Yayin klasoru ile canli ayni oldugu icin
    nobetci "guncel" dedi. Duzeltme kullaniciya ulasmamisti ve arac
    bunu SOYLEMIYORDU -- yalanci yesil, avladigimiz en tehlikeli sey.

    Yalniz YAYINDA ZATEN OLAN dosyalara bakar: kaynakta olup yayinda
    olmayan seyler (sinama sayfalari, araclar, ic belgeler) kasten
    disarida birakilmistir, onlari "eksik" saymak yanlis alarm olurdu.
    """
    if not kaynak_klasor or depo_klasor is None:
        return []                      # zincir yok: tek klasorde gelisiyor
    yay = os.path.join(KOK, depo_klasor)
    if not os.path.isdir(kaynak_klasor) or not os.path.isdir(yay):
        return []
    farkli = []
    for kok2, _, dosyalar in os.walk(yay):
        for f in dosyalar:
            y = os.path.join(kok2, f)
            r = os.path.relpath(y, yay).replace(os.sep, "/")
            k = os.path.join(kaynak_klasor, r.replace("/", os.sep))
            if not os.path.exists(k):
                continue               # yalniz yayinda: bilerek olabilir
            try:
                if ozet(io.open(k, "rb").read(), r) != ozet(io.open(y, "rb").read(), r):
                    farkli.append(r)
            except Exception:
                pass
    return sorted(farkli)


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
    # ÜÇÜNCÜ CEVAP. Ölçülemeyen şey ne "geçti" ne "kaldı" sayılır; ayrı
    # listede durur ve sorun sayısına eklenmez. Ölçülemeyeni sorun saymak
    # yanlış alarm, sorun saymamak da körlük olurdu — üçüncüsü gerek.
    notlar = []
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
    sw_kod, sw_govde = getir(adres.rstrip("/") + "/sw.js")
    cd = cevrimdisi_eksigi(kaynak, depo, govde,
                           sw_govde if sw_kod == 200 else None)
    if sw_kod != 200 and cd.get("durum") == "eksik":
        # Canli sw.js okunamadi; yerel kopya ile bakildi. Bu, YAYINDAKI
        # hali degil -- "gecti" saydirmamak icin uyari degil not.
        notlar.append("canlı sw.js okunamadı (HTTP %s); çevrimdışı listesi "
                      "%s ile karşılaştırıldı — yayındaki hâli bu olmayabilir"
                      % (sw_kod, cd.get("kaynak", "yerel dosya")))
    if cd.get("durum") == "eksik" and cd.get("liste"):
        bulgular.append("çevrimdışı listesinde YOK: %s — çevrimiçi sorunsuz "
                        "çalışır, internet kesikken yarım açılır"
                        % ", ".join(cd["liste"][:4]))
    elif cd.get("durum") == "olculemedi":
        # SORUN DEGIL, NOT. Bulgu listesine girmez; "kaldi" saydirmaz.
        notlar.append("çevrimdışı listesi ölçülemedi: " + cd["sebep"])

    # 4) ASIL HÜKÜM: kullanıcı eski dosyayı mı alıyor?
    #
    # Eskiden burada DAMGALAR karşılaştırılıyordu ve iki kez yanlış alarm
    # verdi: (a) yorumda geçen "?s=v55" gerçek damga sanıldı, (b) dosya
    # başına damgalayan proje "uyumsuz" sanıldı — oysa o strateji geçerli
    # ve daha verimli, değişmeyen dosya boşuna indirilmiyor.
    # İkisi de aynı kökten: araç GÖRÜNÜŞE bakıyordu.
    # Artık SONUCA bakıyor: yereldeki dosya ile canlıdaki dosya aynı mı.
    # Bu, damgalama stratejisinden bağımsız ve damgasız projede de çalışır.
    kopyasiz = kopyalanmamis(kaynak, depo)
    farkli, bakilan = icerik_karsilastir(kaynak, depo, yol, govde)
    if farkli:
        # ZAMAN TUZAGI. Bu bulgu, push'tan hemen sonra kosulursa YANLIS
        # cikar: GitHub Pages yaymayi 1-2 dakikada yapar, arada eski
        # icerik doner. Olculdu (28.08.2026): Goz Molasi icin uc dosya
        # "ULASMAMIS" dendi, bir dakika sonra ucu de birebir ayniydi.
        #
        # Yanlis ✗, yanlis ✓ kadar zaman yakar -- o gece not "sabah o
        # oturuma sorulmali" diye yazildi ve neredeyse zaten dogru olan
        # dosyalar yeniden yayinlanacakti.
        #
        # Uyari zaten vardi ama parantez icindeydi ve okunmadi. Artik
        # yapilacak is olarak yaziliyor: EMIR, cekince degil.
        bulgular.append("CANLIYA ULAŞMAMIŞ: %s — yereldeki hâli farklı. "
                        "ÖNCE 1-2 DK BEKLEYİP TEKRAR ÖLÇ: Pages yayınlamayı "
                        "geciktirir, push yeniyse bu uyarı yanlıştır."
                        % ", ".join(farkli[:4]))

    if kopyasiz:
        # ZINCIRIN ILK HALKASI. Bu, yukaridakinden BASKA bir arizadir ve
        # zaman tuzagi YOKTUR: iki yerel klasor karsilastiriliyor, aginin
        # gecikmesiyle ilgisi yok. Push beklemek bunu duzeltmez --
        # dosyalar YAYIN KLASORUNE HIC KOPYALANMAMIS demektir.
        bulgular.append("YAYIN KLASÖRÜNE KOPYALANMAMIŞ: %s%s — düzeltme "
                        "geliştirme klasöründe duruyor, kullanıcıya HİÇ "
                        "gitmedi. (Bu ağ gecikmesi değildir; beklemek "
                        "düzeltmez.)"
                        % (", ".join(kopyasiz[:4]),
                           "" if len(kopyasiz) <= 4 else " +%d" % (len(kopyasiz)-4)))

    def notlari_ekle(satirlar):
        for n in notlar:
            satirlar.append("  %-22s   ~ %s" % ("", n))
        return satirlar

    if bulgular:
        satirlar = ["  %-22s %s %s" % (ad, CARPI, bulgular[0])]
        for b in bulgular[1:]:
            satirlar.append("  %-22s   %s" % ("", b))
        return notlari_ekle(satirlar), len(bulgular)

    if bakilan == 0:
        # Ölçülemeyene "güncel" denmez — üçüncü cevap şart.
        return ["  %-22s ~ ayakta — içerik karşılaştırılamadı "
                "(yerelde eşleşen dosya bulunamadı)" % ad], 0

    ek = "  [damga: %s]" % (sirala(damga(govde)) or "yok") if ayrinti else ""
    return notlari_ekle(["  %-22s %s güncel — %d dosya içerikçe doğrulandı%s"
                         % (ad, TIK, bakilan, ek)]), 0


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
    kimliksiz = []
    for a in adresler:
        k3, g3 = getir(a)
        if k3 != 200:
            kirik.append("%s (HTTP %s)" % (a.replace(CANLI, ""), k3))
            continue

        # KENDI KIMLIGINI TASIYOR MU? (22 numarali oturumun fikri)
        # 200 donmesi sayfanin DOGRU sayfa oldugunu gostermez. Servis
        # calisani ya da 404 yedegi devreye girmisse istenen adres
        # ACILIR ama iceride BASKA bir sayfa durur -- ve kullanici
        # yanlis araci kullanir. Kanonik adres bunu ele verir:
        # her sayfa kendi adresini kanonik gosterir, yedege dusen
        # sayfa baskasinin adresini tasir.
        Q2 = chr(91) + chr(34) + chr(39) + chr(93)      # ["']
        kal = ("<link[^>]+rel=" + Q2 + "canonical" + Q2 +
               "[^>]+href=" + Q2 + "([^" + chr(34) + chr(39) + "]+)")
        kan = re.search(kal, g3)
        if kan:
            beklenen = a.split("?")[0].rstrip("/")
            gelen = kan.group(1).split("?")[0].rstrip("/")
            if beklenen != gelen:
                kimliksiz.append("%s -> kendini %s saniyor"
                                 % (beklenen.replace(CANLI, ""), gelen.replace(CANLI, "")))
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
    if kimliksiz:
        satirlar = ["  %s %d sayfa KENDI KIMLIGINI tasimiyor (200 donuyor ama "
                    "iceride baska sayfa var):" % (CARPI, len(kimliksiz))]
        satirlar += ["      " + x for x in kimliksiz[:6]]
        if len(kimliksiz) > 6:
            satirlar.append("      ... ve %d tane daha" % (len(kimliksiz) - 6))
        return satirlar, len(kimliksiz)
    return ["  %s sitemap: %d adresin %d'i açılıyor ve kendi kimliğini taşıyor"
            % (TIK, len(adresler), len(adresler))], 0


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
